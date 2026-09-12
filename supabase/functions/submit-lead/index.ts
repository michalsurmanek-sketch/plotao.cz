import { withSupabase } from '@supabase/server'
import { validateEnvelope } from './validation.mjs'

const ALLOWED_ORIGIN = 'https://plotao.cz'
const MAX_BODY_BYTES = 64 * 1024
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT = 8
const RATE_RETENTION_MS = 24 * 60 * 60 * 1000
const encoder = new TextEncoder()

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, accept',
  'Access-Control-Max-Age': '600',
  'Vary': 'Origin',
}

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function clientAddress(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('cf-connecting-ip')?.trim() || req.headers.get('x-real-ip')?.trim() || 'unknown'
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function readBodyLimited(req: Request) {
  const announced = Number(req.headers.get('content-length') || 0)
  if (Number.isFinite(announced) && announced > MAX_BODY_BYTES) throw new Error('body_too_large')
  if (!req.body) return ''
  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      try { await reader.cancel() } catch {}
      throw new Error('body_too_large')
    }
    chunks.push(value)
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(merged)
}

function rateSalt() {
  const salt = Deno.env.get('PLOTAO_RATE_SALT')?.trim()
  if (!salt || salt.length < 32) throw new Error('rate_salt_missing')
  return salt
}

export default {
  fetch: withSupabase(
    { auth: 'none', cors: 'disabled' },
    async (req, ctx) => {
      const origin = req.headers.get('origin') || ''
      if (origin !== ALLOWED_ORIGIN) return response(403, { error: 'origin_not_allowed' })
      if (req.method === 'OPTIONS') return response(200, { ok: true })
      if (req.method !== 'POST') return response(405, { error: 'method_not_allowed' })
      if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
        return response(415, { error: 'json_required' })
      }

      let raw = ''
      try {
        raw = await readBodyLimited(req)
      } catch (error) {
        return response(error instanceof Error && error.message === 'body_too_large' ? 413 : 400, { error: 'invalid_body' })
      }

      let input: unknown
      try {
        input = JSON.parse(raw)
      } catch {
        return response(400, { error: 'invalid_json' })
      }

      const validated = validateEnvelope(input)
      if (!validated.ok) return response(422, { error: 'validation_failed', fields: validated.errors })

      let keyHash = ''
      try {
        const ua = (req.headers.get('user-agent') || 'unknown').slice(0, 300)
        keyHash = await digest(`${rateSalt()}\n${clientAddress(req)}\n${ua}`)
      } catch {
        return response(503, { error: 'rate_limit_unavailable' })
      }

      const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
      const { count, error: countError } = await ctx.supabaseAdmin
        .from('plotao_lead_rate_events')
        .select('id', { count: 'exact', head: true })
        .eq('key_hash', keyHash)
        .gte('created_at', since)

      if (countError) {
        console.error('plotao rate count failed', countError.code || 'unknown')
        return response(503, { error: 'rate_limit_unavailable' })
      }
      if ((count || 0) >= RATE_LIMIT) return response(429, { error: 'rate_limited' })

      const { error: rateInsertError } = await ctx.supabaseAdmin
        .from('plotao_lead_rate_events')
        .insert({ key_hash: keyHash })
      if (rateInsertError) {
        console.error('plotao rate insert failed', rateInsertError.code || 'unknown')
        return response(503, { error: 'rate_limit_unavailable' })
      }

      const lead = validated.lead
      const row = {
        submitted_at: validated.submittedAt,
        source: 'plotao.cz',
        mode: lead.mode,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        place: lead.place,
        note: lead.note,
        payload: lead,
      }

      const { data, error: insertError } = await ctx.supabaseAdmin
        .from('plotao_leads')
        .insert(row)
        .select('id')
        .single()

      if (insertError || !data?.id) {
        console.error('plotao lead insert failed', insertError?.code || 'missing_id')
        return response(500, { error: 'storage_failed' })
      }

      // Best-effort retention cleanup. Failure never exposes or loses the accepted lead.
      const cutoff = new Date(Date.now() - RATE_RETENTION_MS).toISOString()
      ctx.supabaseAdmin.from('plotao_lead_rate_events').delete().lt('created_at', cutoff).then(({ error }) => {
        if (error) console.error('plotao rate cleanup failed', error.code || 'unknown')
      })

      return response(201, { id: data.id })
    },
  ),
}
