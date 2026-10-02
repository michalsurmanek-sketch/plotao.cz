import { withSupabase } from '@supabase/server'
import { validateEnvelope } from './validation.mjs'

const ALLOWED_ORIGINS = new Set(['https://plotao.cz', 'https://www.plotao.cz'])
const MAX_BODY_BYTES = 64 * 1024
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT = 8
const RATE_RETENTION_MS = 24 * 60 * 60 * 1000
const encoder = new TextEncoder()

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://plotao.cz',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, accept, apikey',
  'Access-Control-Max-Age': '600',
  'Vary': 'Origin',
}

function response(status: number, body: Record<string, unknown>, origin = '') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://plotao.cz',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function clientAddress(req: Request) {
  const cf = req.headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf.slice(0, 200)
  const real = req.headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 200)
  const forwarded = (req.headers.get('x-forwarded-for') || '').split(',').map((x) => x.trim()).filter(Boolean)
  return (forwarded.at(-1) || 'unknown').slice(0, 200)
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

const REGION_NAMES = [
  'Hlavní město Praha', 'Středočeský kraj', 'Jihočeský kraj', 'Plzeňský kraj',
  'Karlovarský kraj', 'Ústecký kraj', 'Liberecký kraj', 'Královéhradecký kraj',
  'Pardubický kraj', 'Kraj Vysočina', 'Jihomoravský kraj', 'Olomoucký kraj',
  'Zlínský kraj', 'Moravskoslezský kraj',
]
const normalizePlace = (value: string) => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const CITY_REGIONS: Array<[string, string]> = [
  ['uherske hradiste', 'Zlínský kraj'], ['uhersky brod', 'Zlínský kraj'],
  ['uhersky ostroh', 'Zlínský kraj'], ['zlin', 'Zlínský kraj'],
  ['praha', 'Hlavní město Praha'], ['brno', 'Jihomoravský kraj'],
  ['ostrava', 'Moravskoslezský kraj'], ['olomouc', 'Olomoucký kraj'],
  ['plzen', 'Plzeňský kraj'], ['liberec', 'Liberecký kraj'],
  ['ceske budejovice', 'Jihočeský kraj'], ['hradec kralove', 'Královéhradecký kraj'],
  ['pardubice', 'Pardubický kraj'], ['jihlava', 'Kraj Vysočina'],
  ['karlovy vary', 'Karlovarský kraj'], ['usti nad labem', 'Ústecký kraj'],
]
function inferRegionFromPlace(place: string) {
  const normalized = normalizePlace(place)
  const explicit = REGION_NAMES.find((region) => normalized.includes(normalizePlace(region)))
  if (explicit) return explicit
  return CITY_REGIONS.find(([city]) => normalized === city || normalized.startsWith(city + ' '))?.[1] || ''
}

export default {
  fetch: withSupabase(
    { auth: 'none', cors: 'disabled' },
    async (req, ctx) => {
      const origin = req.headers.get('origin') || ''
      if (!ALLOWED_ORIGINS.has(origin)) return response(403, { error: 'origin_not_allowed' }, origin)
      if (req.method === 'OPTIONS') return response(200, { ok: true }, origin)
      if (req.method !== 'POST') return response(405, { error: 'method_not_allowed' }, origin)
      if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
        return response(415, { error: 'json_required' }, origin)
      }

      let raw = ''
      try {
        raw = await readBodyLimited(req)
      } catch (error) {
        return response(error instanceof Error && error.message === 'body_too_large' ? 413 : 400, { error: 'invalid_body' }, origin)
      }

      let input: unknown
      try {
        input = JSON.parse(raw)
      } catch {
        return response(400, { error: 'invalid_json' }, origin)
      }

      const validated = validateEnvelope(input)
      if (!validated.ok) return response(422, { error: 'validation_failed', fields: validated.errors }, origin)
      const lead = validated.lead
      if (!lead.region) lead.region = inferRegionFromPlace(lead.place)
      const receivedAt = new Date().toISOString()

      let rateKeys: string[] = []
      try {
        const salt = rateSalt()
        const address = clientAddress(req)
        const ua = (req.headers.get('user-agent') || 'unknown').slice(0, 300)
        if (address !== 'unknown') rateKeys.push(await digest(`${salt}\nnetwork\n${address}\n${ua}`))
        rateKeys.push(await digest(`${salt}\ncontact\n${lead.phone}\n${lead.email}`))
        rateKeys = [...new Set(rateKeys)]
      } catch {
        return response(503, { error: 'rate_limit_unavailable' }, origin)
      }

      const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
      const checks = await Promise.all(rateKeys.map((keyHash) => ctx.supabaseAdmin
        .from('plotao_lead_rate_events')
        .select('id', { count: 'exact', head: true })
        .eq('key_hash', keyHash)
        .gte('created_at', since)))

      if (checks.some((x) => x.error)) {
        const firstError = checks.find((x) => x.error)?.error
        console.error('plotao rate count failed', firstError?.code || 'unknown')
        return response(503, { error: 'rate_limit_unavailable' }, origin)
      }
      if (checks.some((x) => (x.count || 0) >= RATE_LIMIT)) return response(429, { error: 'rate_limited' }, origin)

      const { error: rateInsertError } = await ctx.supabaseAdmin
        .from('plotao_lead_rate_events')
        .insert(rateKeys.map((key_hash) => ({ key_hash })))
      if (rateInsertError) {
        console.error('plotao rate insert failed', rateInsertError.code || 'unknown')
        return response(503, { error: 'rate_limit_unavailable' }, origin)
      }

      const row = {
        submitted_at: receivedAt,
        source: 'plotao.cz',
        mode: lead.mode,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        place: lead.place,
        region: lead.region,
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
        return response(500, { error: 'storage_failed' }, origin)
      }

      // Best-effort retention cleanup. Failure never exposes or loses the accepted lead.
      const cutoff = new Date(Date.now() - RATE_RETENTION_MS).toISOString()
      ctx.supabaseAdmin.from('plotao_lead_rate_events').delete().lt('created_at', cutoff).then(({ error }) => {
        if (error) console.error('plotao rate cleanup failed', error.code || 'unknown')
      })

      let emailSent = false
      const communication: Record<string, unknown>[] = []
      if (lead.email) {
        const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()
        if (!resendKey) {
          console.error('plotao auto-reply unavailable: RESEND_API_KEY missing')
        } else {
          const subject = lead.mode === 'help'
            ? 'Potvrzení přijetí vašeho dotazu – PLOTAO.cz'
            : lead.mode === 'partner'
              ? 'Potvrzení přijetí vaší zprávy – PLOTAO.cz'
              : 'Potvrzení přijetí poptávky – PLOTAO.cz'
          const detail = lead.mode === 'help'
            ? 'Vaši zprávu jsme v pořádku přijali. Ozveme se vám co nejdříve na uvedený e-mail nebo telefon.'
            : lead.mode === 'partner'
              ? 'Děkujeme za zájem o spolupráci. Vaši zprávu jsme předali k vyřízení a ozveme se vám.'
              : 'Vaši poptávku jsme v pořádku přijali. Prověříme zadané informace a ozveme se vám s dalším postupem.'
          const message = 'Dobrý den, ' + lead.name + ',\n\n' + detail + '\n\nDěkujeme, že jste se obrátili na PLOTAO.cz.\n\nS pozdravem,\nPLOTAO.cz\nPlotové centrum\nhttps://plotao.cz'
          try {
            const mailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + resendKey,
                'Content-Type': 'application/json',
                'Idempotency-Key': 'plotao-auto-' + data.id,
              },
              body: JSON.stringify({
                from: 'PLOTAO.cz <odpovedi@plotao.cz>',
                to: [lead.email],
                reply_to: 'michalsurmanek@seznam.cz',
                subject,
                text: message,
              }),
            })
            let mailData: Record<string, unknown> = {}
            try { mailData = await mailResponse.json() } catch {}
            if (mailResponse.ok) {
              emailSent = true
              communication.push({
                direction: 'out',
                body: message,
                sent_at: new Date().toISOString(),
                provider: 'resend',
                provider_id: typeof mailData.id === 'string' ? mailData.id : null,
                kind: 'automatic_confirmation',
              })
            } else {
              console.error('plotao auto-reply rejected', mailResponse.status, typeof mailData.name === 'string' ? mailData.name : '')
            }
          } catch (error) {
            console.error('plotao auto-reply network failure', error instanceof Error ? error.message : 'unknown')
          }
        }
      }

      const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()
      if (!resendKey) {
        console.error('plotao admin notification unavailable: RESEND_API_KEY missing')
      } else {
        const adminNotice = [
          'Na webu PLOTAO.cz dorazila nová žádost.',
          '',
          'Čas přijetí: ' + receivedAt,
          'ID žádosti: ' + data.id,
          '',
          'Otevřete administraci PLOTAO.cz a v sekci Poptávky zobrazte detail žádosti.',
          'Toto upozornění neobsahuje kontaktní údaje zákazníka.',
        ].join('\n')
        try {
          const notificationResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + resendKey,
              'Content-Type': 'application/json',
              'Idempotency-Key': 'plotao-admin-notice-' + data.id,
            },
            body: JSON.stringify({
              from: 'PLOTAO.cz <odpovedi@plotao.cz>',
              to: ['michalsurmanek@seznam.cz'],
              subject: 'Nová poptávka v administraci PLOTAO.cz',
              text: adminNotice,
            }),
          })
          let notificationData: Record<string, unknown> = {}
          try { notificationData = await notificationResponse.json() } catch {}
          if (notificationResponse.ok) {
            communication.push({
              direction: 'out',
              body: adminNotice,
              sent_at: new Date().toISOString(),
              provider: 'resend',
              provider_id: typeof notificationData.id === 'string' ? notificationData.id : null,
              kind: 'admin_notification',
            })
          } else {
            console.error('plotao admin notification rejected', notificationResponse.status, typeof notificationData.name === 'string' ? notificationData.name : '')
          }
        } catch (error) {
          console.error('plotao admin notification network failure', error instanceof Error ? error.message : 'unknown')
        }
      }

      if (communication.length) {
        const { error: communicationError } = await ctx.supabaseAdmin
          .from('plotao_leads')
          .update({ communication })
          .eq('id', data.id)
        if (communicationError) console.error('plotao communication history save failed', communicationError.code || 'unknown')
      }

      return new Response(JSON.stringify({ id: data.id, email_sent: emailSent }), {
        status: 201,
        headers: { ...corsHeaders, 'Access-Control-Allow-Origin': origin, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    },
  ),
}
