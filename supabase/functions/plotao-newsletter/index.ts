import { withSupabase } from '@supabase/server'

const ALLOWED_ORIGINS = new Set(['https://plotao.cz', 'https://www.plotao.cz'])
const FUNCTION_URL = 'https://jmukoccjqykyoqsypuwb.supabase.co/functions/v1/plotao-newsletter'
const encoder = new TextEncoder()

function json(status: number, body: Record<string, unknown>, origin = '') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://plotao.cz',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, accept, apikey',
      'Access-Control-Max-Age': '600',
      'Vary': 'Origin',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
function htmlPage(title: string, message: string, status = 200) {
  return new Response(`<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – PLOTAO.cz</title><body style="font:16px Arial,sans-serif;background:#f4f7f4;color:#18372b;margin:0;padding:40px 16px"><main style="max-width:620px;margin:8vh auto;background:white;border:1px solid #dbe5de;border-radius:18px;padding:28px;box-shadow:0 8px 32px #12372612"><h1 style="color:#087443">${title}</h1><p style="line-height:1.6">${message}</p><a href="https://plotao.cz/#news" style="display:inline-block;margin-top:12px;background:#087443;color:white;padding:12px 18px;border-radius:9px;text-decoration:none;font-weight:bold">Zpět na PLOTAO.cz</a></main></body></html>`, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}
async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
function address(req: Request) {
  return (req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown').trim().slice(0, 200)
}
function validEmail(email: string) {
  return email.length >= 3 && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default {
  fetch: withSupabase({ auth: 'none', cors: 'disabled' }, async (req, ctx) => {
    const origin = req.headers.get('origin') || ''
    const url = new URL(req.url)

    if (req.method === 'GET' && url.searchParams.get('action') === 'confirm') {
      const token = url.searchParams.get('token') || ''
      if (token.length < 30 || token.length > 100) return htmlPage('Odkaz není platný', 'Odkaz pro potvrzení přihlášení není platný nebo už vypršel.', 400)
      const tokenHash = await digest(token)
      const { data, error } = await ctx.supabaseAdmin
        .from('plotao_newsletter_subscribers')
        .select('id')
        .eq('token_hash', tokenHash)
        .eq('status', 'pending')
        .gt('token_expires_at', new Date().toISOString())
        .maybeSingle()
      if (error || !data?.id) return htmlPage('Odběr už nelze potvrdit', 'Odkaz už byl použit nebo vypršel. Pokud jste se přihlásili právě teď, odběr je již aktivní.', 404)
      const { error: updateError } = await ctx.supabaseAdmin
        .from('plotao_newsletter_subscribers')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), token_hash: null, token_expires_at: null, updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .eq('status', 'pending')
      if (updateError) return htmlPage('Potvrzení se nepodařilo', 'Zkuste odkaz otevřít znovu později nebo napište na info@plotao.cz.', 503)
      return htmlPage('Odběr potvrzen', 'Děkujeme. Přihlášení k novinkám a slevám PLOTAO.cz je potvrzené. Z odběru se můžete kdykoli odhlásit e-mailem na info@plotao.cz.')
    }

    if (req.method === 'GET' && url.searchParams.get('action') === 'unsubscribe') {
      const token = url.searchParams.get('token') || ''
      if (token.length < 30 || token.length > 100) return htmlPage('Odkaz není platný', 'Odkaz pro ukončení odběru není platný.', 400)
      const tokenHash = await digest(token)
      const { data, error } = await ctx.supabaseAdmin
        .from('plotao_newsletter_subscribers')
        .select('id')
        .eq('unsubscribe_token_hash', tokenHash)
        .in('status', ['pending', 'confirmed'])
        .maybeSingle()
      if (error || !data?.id) return htmlPage('Odběr už nelze změnit', 'Odkaz už byl použit nebo odběr byl již ukončen.', 404)
      const { error: updateError } = await ctx.supabaseAdmin
        .from('plotao_newsletter_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString(), token_hash: null, token_expires_at: null, unsubscribe_token_hash: null, updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .in('status', ['pending', 'confirmed'])
      if (updateError) return htmlPage('Odhlášení se nepodařilo', 'Zkuste to prosím později nebo napište na info@plotao.cz.', 503)
      return htmlPage('Odběr ukončen', 'E-mailová adresa byla odhlášena z novinek a slev PLOTAO.cz.')
    }

    if (!ALLOWED_ORIGINS.has(origin)) return json(403, { error: 'origin_not_allowed' }, origin)
    if (req.method === 'OPTIONS') return json(200, { ok: true }, origin)
    if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin)
    if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return json(415, { error: 'json_required' }, origin)

    let input: Record<string, unknown>
    try {
      const raw = await req.text()
      if (raw.length > 4000) return json(413, { error: 'body_too_large' }, origin)
      input = JSON.parse(raw)
    } catch {
      return json(400, { error: 'invalid_json' }, origin)
    }
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    if (!validEmail(email)) return json(422, { error: 'invalid_email' }, origin)
    if (input.consent !== true) return json(422, { error: 'consent_required' }, origin)

    const salt = Deno.env.get('PLOTAO_RATE_SALT')?.trim()
    const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()
    if (!salt || salt.length < 32 || !resendKey) {
      console.error('newsletter configuration missing')
      return json(503, { error: 'service_unavailable' }, origin)
    }

    const clientAddress = address(req)
    const rateKeys = [await digest(salt + "\nemail\n" + email)]
    if (clientAddress !== 'unknown') rateKeys.unshift(await digest(salt + "\nnetwork\n" + clientAddress))
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const checks = await Promise.all(rateKeys.map((key) => ctx.supabaseAdmin
      .from('plotao_newsletter_rate_events')
      .select('id', { count: 'exact', head: true })
      .eq('key_hash', key)
      .gte('created_at', since)))
    if (checks.some((x) => x.error)) return json(503, { error: 'service_unavailable' }, origin)
    if (checks.some((x) => (x.count || 0) >= 5)) return json(429, { error: 'rate_limited' }, origin)
    const { error: rateError } = await ctx.supabaseAdmin.from('plotao_newsletter_rate_events').insert(rateKeys.map((key_hash) => ({ key_hash })))
    if (rateError) return json(503, { error: 'service_unavailable' }, origin)
    ctx.supabaseAdmin.from('plotao_newsletter_rate_events')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .then(({ error }) => { if (error) console.error('newsletter rate cleanup failed', error.code || 'unknown') })

    const { data: existing, error: lookupError } = await ctx.supabaseAdmin
      .from('plotao_newsletter_subscribers')
      .select('status')
      .eq('email', email)
      .maybeSingle()
    if (lookupError) return json(503, { error: 'service_unavailable' }, origin)
    if (existing?.status === 'confirmed') return json(200, { ok: true, message: 'already_confirmed' }, origin)

    const token = randomToken()
    const unsubscribeToken = randomToken()
    const tokenHash = await digest(token)
    const unsubscribeTokenHash = await digest(unsubscribeToken)
    const now = new Date().toISOString()
    const { error: saveError } = await ctx.supabaseAdmin
      .from('plotao_newsletter_subscribers')
      .upsert({
        email, status: 'pending', consent_at: now, consent_text_version: 'newsletter-2026-10',
        confirmed_at: null, unsubscribed_at: null, token_hash: tokenHash, token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), unsubscribe_token_hash: unsubscribeTokenHash, source: 'plotao.cz', updated_at: now,
      }, { onConflict: 'email' })
    if (saveError) {
      console.error('newsletter subscription save failed', saveError.code || 'unknown')
      return json(503, { error: 'service_unavailable' }, origin)
    }

    const confirmUrl = FUNCTION_URL + '?action=confirm&token=' + encodeURIComponent(token)
    const unsubscribeUrl = FUNCTION_URL + '?action=unsubscribe&token=' + encodeURIComponent(unsubscribeToken)
    const unsubscribeUrlHtml = unsubscribeUrl.replace(/&/g, '&amp;')
    const mail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json', 'Idempotency-Key': 'plotao-newsletter-confirm-' + tokenHash },
      body: JSON.stringify({
        from: 'PLOTAO.cz <odpovedi@plotao.cz>',
        to: [email],
        reply_to: 'info@plotao.cz',
        subject: 'Potvrďte přihlášení k novinkám PLOTAO.cz',
        text: 'Dobrý den,\n\nPro potvrzení přihlášení k novinkám a slevám PLOTAO.cz otevřete tento odkaz:\n' + confirmUrl + '\n\nPokud jste o přihlášení nežádali, tento e-mail ignorujte. Bez potvrzení vám novinky zasílat nebudeme.\n\nOdběr můžete ukončit zde: ' + unsubscribeUrl + '\n\nPLOTAO.cz\nhttps://plotao.cz',
        html: '<div style="font-family:Arial,Helvetica,sans-serif;color:#24312c;line-height:1.6;max-width:600px;margin:0 auto"><h2 style="color:#087443">Potvrďte přihlášení</h2><p>Pro aktivaci odběru novinek a slev PLOTAO.cz klikněte na tlačítko:</p><p><a href="' + confirmUrl + '" style="display:inline-block;background:#087443;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">Potvrdit odběr</a></p><p>Pokud jste o přihlášení nežádali, tento e-mail ignorujte. Bez potvrzení vám novinky zasílat nebudeme.</p><p><a href="' + unsubscribeUrlHtml + '">Ukončit odběr novinek</a></p><p>PLOTAO.cz · <a href="https://plotao.cz/ochrana-osobnich-udaju.html">Ochrana osobních údajů</a></p></div>',
      }),
    }).catch((error) => {
      console.error('newsletter mail network failure', error instanceof Error ? error.message : 'unknown')
      return null
    })
    if (!mail?.ok) {
      let providerError = ''
      try { providerError = await mail?.text() || '' } catch {}
      console.error('newsletter mail rejected', mail?.status || 0, providerError.slice(0, 300))
      return json(502, { error: 'email_send_failed' }, origin)
    }
    return json(200, { ok: true, message: 'confirmation_sent' }, origin)
  }),
}
