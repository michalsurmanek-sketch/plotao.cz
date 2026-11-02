import { withSupabase } from '@supabase/server'

const ORIGINS = new Set(['https://opravao.cz', 'https://www.opravao.cz'])
const MAX_BODY_BYTES = 16 * 1024
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT = 8
const RATE_RETENTION_MS = 24 * 60 * 60 * 1000
const encoder = new TextEncoder()
const REPAIR_TYPES = new Set(['Instalatér', 'Elektrikář', 'Spotřebiče', 'Dveře a okna', 'Střecha', 'Hodinový manžel'])

function respond(status: number, body: Record<string, unknown>, origin = '') {
  const allowedOrigin = ORIGINS.has(origin) ? origin : 'null'
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, accept, apikey',
      'Access-Control-Max-Age': '600',
      'Vary': 'Origin',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
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

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : ''
}
function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value) && value.length <= 254
}
function cleanPhone(value: string) {
  const raw = value.trim()
  const prefix = raw.startsWith('+') ? '+' : ''
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 15 ? prefix + digits : ''
}
function inferRegion(place: string) {
  const normalized = place.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const regions: Array<[string, string]> = [
    ['praha', 'Hlavní město Praha'], ['brno', 'Jihomoravský kraj'], ['ostrava', 'Moravskoslezský kraj'],
    ['plzen', 'Plzeňský kraj'], ['olomouc', 'Olomoucký kraj'], ['liberec', 'Liberecký kraj'],
    ['ceske budejovice', 'Jihočeský kraj'], ['hradec kralove', 'Královéhradecký kraj'],
    ['pardubice', 'Pardubický kraj'], ['zlin', 'Zlínský kraj'], ['jihlava', 'Kraj Vysočina'],
  ]
  return regions.find(([city]) => normalized.includes(city))?.[1] || ''
}

export default {
  fetch: withSupabase(
    { auth: 'none', cors: 'disabled' },
    async (req, ctx) => {
      const origin = req.headers.get('origin') || ''
      if (!ORIGINS.has(origin)) return respond(403, { error: 'origin_not_allowed' }, origin)
      if (req.method === 'OPTIONS') return respond(200, { ok: true }, origin)
      if (req.method !== 'POST') return respond(405, { error: 'method_not_allowed' }, origin)
      if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
        return respond(415, { error: 'json_required' }, origin)
      }

      let raw = ''
      try { raw = await readBodyLimited(req) }
      catch (error) {
        return respond(error instanceof Error && error.message === 'body_too_large' ? 413 : 400, { error: 'invalid_body' }, origin)
      }
      let input: any
      try { input = JSON.parse(raw) }
      catch { return respond(400, { error: 'invalid_json' }, origin) }
      if (!input || typeof input !== 'object' || input.source !== 'opravao.cz' || input.transportVersion !== 1 || !input.lead || typeof input.lead !== 'object') {
        return respond(422, { error: 'invalid_envelope' }, origin)
      }

      const rawLead = input.lead
      const repairType = cleanText(rawLead.repairType, 80)
      const place = cleanText(rawLead.place, 200)
      const contact = cleanText(rawLead.contact, 254)
      let email = ''
      let phone = ''
      if (contact.includes('@')) {
        email = contact.toLowerCase()
        if (!validEmail(email)) return respond(422, { error: 'invalid_contact' }, origin)
      } else {
        phone = cleanPhone(contact)
        if (!phone) return respond(422, { error: 'invalid_contact' }, origin)
      }
      if (!REPAIR_TYPES.has(repairType)) return respond(422, { error: 'invalid_repair_type' }, origin)
      if (place.length < 2) return respond(422, { error: 'invalid_place' }, origin)

      const rateSalt = Deno.env.get('PLOTAO_RATE_SALT')?.trim()
      if (!rateSalt || rateSalt.length < 32) return respond(503, { error: 'rate_limit_unavailable' }, origin)
      const address = req.headers.get('cf-connecting-ip')?.trim() || req.headers.get('x-real-ip')?.trim() || ''
      const userAgent = (req.headers.get('user-agent') || 'unknown').slice(0, 300)
      const keys = new Set<string>()
      const digest = async (value: string) => {
        const result = await crypto.subtle.digest('SHA-256', encoder.encode(value))
        return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
      }
      if (address) keys.add(await digest(rateSalt + '\nnetwork\n' + address + '\n' + userAgent))
      keys.add(await digest(rateSalt + '\ncontact\n' + phone + '\n' + email))
      const rateKeys = [...keys]
      const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
      const counts = await Promise.all(rateKeys.map((key_hash) => ctx.supabaseAdmin
        .from('plotao_lead_rate_events')
        .select('id', { count: 'exact', head: true })
        .eq('key_hash', key_hash)
        .gte('created_at', since)))
      if (counts.some((item) => item.error)) return respond(503, { error: 'rate_limit_unavailable' }, origin)
      if (counts.some((item) => (item.count || 0) >= RATE_LIMIT)) return respond(429, { error: 'rate_limited' }, origin)
      const { error: rateError } = await ctx.supabaseAdmin
        .from('plotao_lead_rate_events')
        .insert(rateKeys.map((key_hash) => ({ key_hash })))
      if (rateError) return respond(503, { error: 'rate_limit_unavailable' }, origin)

      const receivedAt = new Date().toISOString()
      const name = 'Poptávka z Opravao.cz'
      const note = 'Typ opravy: ' + repairType
      const { data, error } = await ctx.supabaseAdmin
        .from('plotao_leads')
        .insert({
          submitted_at: receivedAt,
          source: 'opravao.cz',
          mode: 'help',
          name,
          phone,
          email,
          place,
          region: inferRegion(place),
          note,
          payload: {
            schemaVersion: 1,
            source: 'opravao.cz',
            sourceLabel: 'Opravao.cz',
            mode: 'help',
            repairType,
            name,
            phone,
            email,
            place,
            region: inferRegion(place),
            note,
          },
        })
        .select('id')
        .single()
      if (error || !data?.id) {
        console.error('opravao lead insert failed', error?.code || 'missing_id')
        return respond(500, { error: 'storage_failed' }, origin)
      }

      const cutoff = new Date(Date.now() - RATE_RETENTION_MS).toISOString()
      ctx.supabaseAdmin.from('plotao_lead_rate_events').delete().lt('created_at', cutoff).then(({ error }) => {
        if (error) console.error('opravao rate cleanup failed', error.code || 'unknown')
      })
      return respond(201, { ok: true, received_at: receivedAt }, origin)
    },
  ),
}
