import { withSupabase } from '@supabase/server'

const ORIGIN = 'https://poptejcenu.cz'
const MAX_BODY_BYTES = 64 * 1024
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT = 8
const RATE_RETENTION_MS = 24 * 60 * 60 * 1000
const encoder = new TextEncoder()

function respond(status: number, body: Record<string, unknown>, origin = '') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Access-Control-Allow-Origin': origin === ORIGIN ? ORIGIN : 'null',
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
function cleanPhone(value: unknown) {
  const raw = String(value ?? '').trim()
  const prefix = raw.startsWith('+') ? '+' : ''
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 15 ? prefix + digits : ''
}
function inferRegion(place: string) {
  const normalized = place.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const regions = [
    'Hlavní město Praha', 'Středočeský kraj', 'Jihočeský kraj', 'Plzeňský kraj',
    'Karlovarský kraj', 'Ústecký kraj', 'Liberecký kraj', 'Královéhradecký kraj',
    'Pardubický kraj', 'Kraj Vysočina', 'Jihomoravský kraj', 'Olomoucký kraj',
    'Zlínský kraj', 'Moravskoslezský kraj',
  ]
  const explicit = regions.find((value) => normalized.includes(value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()))
  if (explicit) return explicit
  const cities: Array<[string, string]> = [
    ['uherske hradiste', 'Zlínský kraj'], ['uhersky brod', 'Zlínský kraj'],
    ['zlin', 'Zlínský kraj'], ['praha', 'Hlavní město Praha'], ['brno', 'Jihomoravský kraj'],
    ['ostrava', 'Moravskoslezský kraj'], ['olomouc', 'Olomoucký kraj'],
    ['plzen', 'Plzeňský kraj'], ['liberec', 'Liberecký kraj'],
    ['ceske budejovice', 'Jihočeský kraj'], ['hradec kralove', 'Královéhradecký kraj'],
    ['pardubice', 'Pardubický kraj'], ['jihlava', 'Kraj Vysočina'],
  ]
  return cities.find(([city]) => normalized === city || normalized.startsWith(city + ' '))?.[1] || ''
}

export default {
  fetch: withSupabase(
    { auth: 'none', cors: 'disabled' },
    async (req, ctx) => {
      const origin = req.headers.get('origin') || ''
      if (origin !== ORIGIN) return respond(403, { error: 'origin_not_allowed' }, origin)
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
      if (!input || typeof input !== 'object' || input.source !== 'poptejcenu.cz' || input.transportVersion !== 1 || !input.lead || typeof input.lead !== 'object') {
        return respond(422, { error: 'invalid_envelope' }, origin)
      }

      const rawLead = input.lead
      const isPartner = rawLead.mode === 'partner'
      const name = cleanText(rawLead.name, 120)
      const email = cleanText(rawLead.email, 254).toLowerCase()
      const phone = cleanPhone(rawLead.phone)
      const place = cleanText(rawLead.place, 200)
      const fenceType = cleanText(rawLead.fenceType, 120)
      const userNote = typeof rawLead.note === 'string' ? rawLead.note.trim().slice(0, isPartner ? 1500 : 4000) : ''
      const segments = Array.isArray(rawLead.segments) ? rawLead.segments : []
      const length = Number(segments[0]?.length)
      const height = rawLead.height === null ? null : Number(rawLead.height)
      const allowedScopes = new Set(['material', 'turnkey', 'installation'])
      const scopeValue = String(rawLead.scopeValue || '')
      const options = Array.isArray(rawLead.options) && rawLead.options.length <= 50
        ? rawLead.options.map((value: unknown) => cleanText(value, 200)).filter(Boolean)
        : null
      const partnerShareConsent = rawLead.partner_share_consent === true

      const partnerName = cleanText(rawLead.partner_name, 160)
      const partnerIco = cleanText(rawLead.ico, 8)
      const partnerWebsite = cleanText(rawLead.website_url, 250)
      const partnerRegions = cleanText(rawLead.regions, 500)
      const allowedServices = new Set(['Montáž', 'Materiál', 'Montáž i materiál', 'Zaměření a poradenství'])
      const allowedFences = new Set(['Panelové', 'Pletivové', 'Betonové', 'Gabionové', 'Dřevěné', 'WPC / hliníkové', 'Brány a branky', 'Jiné'])
      const partnerServices = Array.isArray(rawLead.services) && rawLead.services.length <= 10
        ? rawLead.services.map((value: unknown) => cleanText(value, 80)).filter((value: string) => allowedServices.has(value))
        : []
      const partnerFences = Array.isArray(rawLead.fences) && rawLead.fences.length <= 20
        ? rawLead.fences.map((value: unknown) => cleanText(value, 80)).filter((value: string) => allowedFences.has(value))
        : []
      let partnerWebsiteValid = !partnerWebsite
      try {
        const parsedUrl = new URL(partnerWebsite)
        partnerWebsiteValid = ['https:', 'http:'].includes(parsedUrl.protocol)
      } catch {}
      const note = isPartner
        ? ['Registrace firmy do sítě dodavatelů PoptejCenu.cz', 'Firma: ' + partnerName, 'IČO: ' + (partnerIco || 'neuvedeno'), 'Web: ' + (partnerWebsite || 'neuveden'), 'Oblasti působení: ' + partnerRegions, 'Služby: ' + partnerServices.join(', '), 'Typy oplocení: ' + partnerFences.join(', '), userNote ? 'Poznámka: ' + userNote : ''].filter(Boolean).join('\n').slice(0, 4000)
        : userNote

      const errors: string[] = []
      if (rawLead.schemaVersion !== 2 || !['lead', 'partner'].includes(rawLead.mode)) errors.push('mode')
      if (rawLead.admin_processing_acknowledged !== true) errors.push('admin_processing_acknowledged')
      if (name.length < 2) errors.push('name')
      if (!validEmail(email)) errors.push('email')
      if (!phone) errors.push('phone')
      if (isPartner) {
        if (partnerName.length < 2) errors.push('partner_name')
        if (partnerIco && !/^\\d{8}$/.test(partnerIco)) errors.push('ico')
        if (partnerRegions.length < 2) errors.push('regions')
        if (partnerServices.length < 1) errors.push('services')
        if (partnerFences.length < 1) errors.push('fences')
        if (!partnerWebsiteValid) errors.push('website_url')
        if (rawLead.website) return respond(201, { id: 'filtered', filtered: true }, origin)
      } else {
        if (place.length < 2) errors.push('place')
        if (!fenceType) errors.push('fenceType')
        if (segments.length !== 1 || !Number.isFinite(length) || length < 1 || length > 1000) errors.push('length')
        if (height !== null && (!Number.isFinite(height) || height < 40 || height > 400)) errors.push('height')
        if (options === null) errors.push('options')
        if (!allowedScopes.has(scopeValue)) errors.push('scope')
        if (userNote.length > 4000 || cleanText(rawLead.scope, 80).length < 2) errors.push('details')
      }
      if (errors.length) return respond(422, { error: 'validation_failed', fields: errors }, origin)

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
      const lead = isPartner
        ? {
            schemaVersion: 2,
            mode: 'partner',
            name,
            phone,
            email,
            place: partnerName,
            region: partnerRegions.slice(0, 200),
            note,
            partner_name: partnerName,
            ico: partnerIco,
            website_url: partnerWebsite,
            services: partnerServices,
            fences: partnerFences,
            regions: partnerRegions,
            partner_share_consent: false,
            admin_processing_acknowledged: true,
            sourceLabel: 'PoptejCenu.cz',
          }
        : {
            schemaVersion: 2,
            mode: 'lead',
            name,
            phone,
            email,
            place,
            region: inferRegion(place),
            note,
            fenceType,
            height,
            segments: [{ name: 'Oplocení', length, connection: 'začátek' }],
            options,
            gate: false,
            gateType: '',
            gateWidth: 0,
            gateDrive: '',
            gateSection: 0,
            gatePos: 0,
            wicket: false,
            wicketWidth: 0,
            wicketSection: 0,
            wicketPos: 0,
            scopeValue,
            scope: cleanText(rawLead.scope, 80),
            displayedPrice: '',
            priceKind: 'individuální nabídka',
            priceReason: '',
            placeFromCalculator: '',
            partner_share_consent: partnerShareConsent,
            admin_processing_acknowledged: true,
            sourceLabel: 'PoptejCenu.cz',
          }
      const { data, error } = await ctx.supabaseAdmin
        .from('plotao_leads')
        .insert({
          submitted_at: receivedAt,
          source: 'poptejcenu.cz',
          mode: isPartner ? 'partner' : 'lead',
          name,
          phone,
          email,
          place: isPartner ? partnerName : place,
          partner_name: isPartner ? partnerName : '',
          region: lead.region,
          note,
          payload: lead,
        })
        .select('id')
        .single()
      if (error || !data?.id) {
        console.error('poptejcenu lead insert failed', error?.code || 'missing_id')
        return respond(500, { error: 'storage_failed' }, origin)
      }

      const cutoff = new Date(Date.now() - RATE_RETENTION_MS).toISOString()
      ctx.supabaseAdmin.from('plotao_lead_rate_events').delete().lt('created_at', cutoff).then(({ error }) => {
        if (error) console.error('poptejcenu rate cleanup failed', error.code || 'unknown')
      })
      const communication: Record<string, unknown>[] = []
      const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()
      let emailSent = false
      let adminEmailSent = false
      if (!resendKey) console.error('poptejcenu.cz email unavailable: RESEND_API_KEY missing')

      const sendResend = async (payload: Record<string, unknown>, idempotencyKey: string) => {
        if (!resendKey) return null
        try {
          const mailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + resendKey,
              'Content-Type': 'application/json',
              'Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000),
          })
          let mailData: Record<string, unknown> = {}
          try { mailData = await mailResponse.json() } catch {}
          if (!mailResponse.ok) {
            console.error('poptejcenu.cz email rejected', mailResponse.status, typeof mailData.name === 'string' ? mailData.name : '')
            return null
          }
          return typeof mailData.id === 'string' ? mailData.id : null
        } catch (error) {
          console.error('poptejcenu.cz email request failed', error instanceof Error ? error.message : 'unknown')
          return null
        }
      }

      const customerSubject = isPartner ? 'Potvrzení registrace – PoptejCenu.cz' : 'Potvrzení přijetí poptávky – PoptejCenu.cz'
      const customerBody = isPartner ? 'Dobrý den, ' + name + ',\n\nVaši registraci dodavatele jsme v pořádku přijali. Ozveme se vám po jejím posouzení.\n\nS pozdravem,\nPoptejCenu.cz\nhttps://poptejcenu.cz' : 'Dobrý den, ' + name + ',\n\nVaši poptávku jsme v pořádku přijali. Prověříme zadané informace a ozveme se vám s dalším postupem.\n\nDěkujeme, že jste se obrátili na PoptejCenu.cz.\n\nS pozdravem,\nPoptejCenu.cz\nhttps://poptejcenu.cz'
      const adminNotice = [
        'Na webu poptejcenu.cz dorazila nová žádost.',
        '',
        'Čas přijetí: ' + receivedAt,
        'ID žádosti: ' + data.id,
        '',
        'Otevřete administraci PLOTAO.cz a v sekci Poptávky zobrazte detail žádosti.',
        'Toto upozornění neobsahuje kontaktní údaje zákazníka.',
      ].join('\n')
      const [customerProviderId, adminProviderId] = await Promise.all([
        validEmail(email) ? sendResend({
          from: 'PLOTAO.cz <odpovedi@plotao.cz>',
          to: [email],
          reply_to: 'michalsurmanek@seznam.cz',
          subject: customerSubject,
          text: customerBody,
        }, 'poptejcenu.cz-confirmation-' + data.id) : Promise.resolve(null),
        sendResend({
          from: 'PLOTAO.cz <odpovedi@plotao.cz>',
          to: ['michalsurmanek@seznam.cz'],
          subject: 'Nová žádost z poptejcenu.cz v administraci PLOTAO.cz',
          text: adminNotice,
        }, 'poptejcenu.cz-admin-notice-' + data.id),
      ])
      if (customerProviderId) {
        emailSent = true
        communication.push({
          direction: 'out', body: customerBody, sent_at: new Date().toISOString(),
          provider: 'resend', provider_id: customerProviderId, kind: 'automatic_confirmation',
        })
      }
      if (adminProviderId) {
        adminEmailSent = true
        communication.push({
          direction: 'out', body: adminNotice, sent_at: new Date().toISOString(),
          provider: 'resend', provider_id: adminProviderId, kind: 'admin_notification',
        })
      }
      if (communication.length) {
        const { error: communicationError } = await ctx.supabaseAdmin
          .from('plotao_leads')
          .update({ communication })
          .eq('id', data.id)
        if (communicationError) console.error('poptejcenu.cz communication history save failed', communicationError.code || 'unknown')
      }
      return respond(201, { id: data.id, received_at: receivedAt, email_sent: emailSent, admin_email_sent: adminEmailSent }, origin)
    },
  ),
}
