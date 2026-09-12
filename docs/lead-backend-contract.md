# PLOTAO lead backend contract

Tento kontrakt popisuje jediný podporovaný způsob serverového příjmu formulářů z `https://plotao.cz`.

## Stav na frontendu

Frontend používá `lead-core-v1.js` pro normalizaci/validaci a `lead-transport-core-v1.js` pro schválení síťového cíle. Produkční runtime konfigurace je v `assets/lead-transport-config-v1.js` a standardně je záměrně vypnutá. Serverové odesílání se povolí jen při současném splnění všech tří podmínek: `enabled: true`, platný HTTPS endpoint a přesná shoda originu endpointu s `allowedOrigins`.

Runtime konfigurace smí obsahovat pouze veřejný endpoint a explicitní allowlist jeho originu. Nikdy do ní nepatří service-role klíč, secret key, databázové heslo, privátní API klíč ani jiný serverový secret.

Výchozí produkční stav:

```js
window.PLOTAO_LEAD_TRANSPORT_CONFIG = {
  enabled: false,
  endpoint: '',
  allowedOrigins: []
};
```

Příklad konfigurace až po plném ověření backendu:

```js
window.PLOTAO_LEAD_TRANSPORT_CONFIG = {
  enabled: true,
  endpoint: 'https://<project-ref>.supabase.co/functions/v1/submit-lead',
  allowedOrigins: ['https://<project-ref>.supabase.co']
};
```

Samotné vyplnění endpointu bez `enabled: true` transport nezapne.

## HTTP požadavek

- metoda: `POST`
- transport: pouze HTTPS
- request credentials: `omit`
- `Content-Type: application/json`
- `Accept: application/json`
- očekávaný CORS origin webu: `https://plotao.cz`

Tělo:

```json
{
  "transportVersion": 1,
  "source": "plotao.cz",
  "submittedAt": "2026-09-12T20:30:00.000Z",
  "lead": {
    "schemaVersion": 2,
    "mode": "lead | help | partner"
  }
}
```

`lead` je kompletní normalizovaný payload vytvořený `lead-core-v1.js`. Režimy `help` a `partner` záměrně neobsahují zákaznickou konfiguraci plotu. Server nesmí doplňovat chybějící konfiguraci z jiného požadavku, cookie ani session.

## Povinné kontroly serveru

Server musí znovu validovat minimálně:

1. `transportVersion === 1`, `source === "plotao.cz"`, `lead.schemaVersion === 2`.
2. `lead.mode` je pouze `lead`, `help` nebo `partner`.
3. Kontakt, délkové limity textů a datové typy; klientská validace není bezpečnostní hranice.
4. Maximální velikost request body.
5. Rate limit / anti-abuse ochranu bez nutnosti posílat browser cookies.
6. CORS pouze pro schválený origin `https://plotao.cz`; nepoužívat `*` pro produkční endpoint s osobními údaji.
7. Server nesmí důvěřovat `displayedPrice` jako účetní nebo smluvní ceně. Je to snapshot UI pro zpracování poptávky.
8. Logy nesmí zbytečně vypisovat celé telefonní číslo, e-mail, poznámku ani celý request body.

## Připravená Supabase implementace

Zdroj je připravený v repozitáři, ale **není tím automaticky nasazený do Supabase**:

- `supabase/schema/plotao-leads.sql` — tabulky `plotao_leads` a `plotao_lead_rate_events`, RLS, explicitní odebrání práv rolím `anon` a `authenticated` a minimální práva pro `service_role`.
- `supabase/functions/submit-lead/index.ts` — veřejná Edge Function s přesným CORS originem, 64 KiB limitem těla, serverovou validací a rate limitem.
- `supabase/functions/submit-lead/validation.mjs` — sdílená serverová validace payloadu.
- `supabase/functions/submit-lead/deno.json` — přesně připnutá verze `@supabase/server`.
- `supabase/config.toml` — `verify_jwt = false` pouze pro `submit-lead`, protože jde o veřejný kontaktní endpoint; autorizaci/anti-abuse provádí samotná funkce.
- `assets/lead-transport-config-v1.js` — jediný produkční přepínač aktivace; default je `enabled:false` bez endpointu.
- `scripts/lead-backend-source-check.mjs` a `scripts/lead-transport-scenario-check.mjs` — CI regresní testy bezpečnostních invariantů.

Edge Function nepoužívá ani nečte privilegovaný klíč v browseru nebo ze zdrojového kódu. Pro databázový zápis používá serverový `ctx.supabaseAdmin` poskytnutý Supabase runtime.

Rate limit ukládá jen salted SHA-256 digest klientského síťového klíče, nikdy syrovou IP adresu. Funkce vyžaduje Supabase secret `PLOTAO_RATE_SALT` o délce alespoň 32 znaků. Tento secret nesmí být commitnutý do GitHubu ani vložený do frontendu.

## Doporučené uložení

Minimální serverový záznam:

- interní `id` generované serverem,
- `created_at` generované serverem,
- `mode`,
- normalizovaný kontakt,
- `place`, `note`,
- celý validovaný lead payload jako JSON/JSONB snapshot,
- stav zpracování (`new`, `contacted`, `closed`, případně další interní stavy),
- technická metadata pouze v nezbytném rozsahu.

Nevytvářet tabulku v databázi jiného projektu jen proto, že už existuje. PLOTAO má mít vlastní oddělený backend/projekt nebo jinak výslovně oddělené prostředí.

## Odpověď

Úspěch:

```json
{
  "id": "server-generated-id"
}
```

s HTTP `200`, `201` nebo jiným úspěšným 2xx statusem.

Chyba validace má vracet 4xx; serverová chyba 5xx. Frontend při neúspěchu draft nemaže a nabídne lokální kopii podkladů.

## Aktivace v Supabase

Po zpřístupnění správného projektu PLOTAO konektoru je pořadí nasazení pevné:

1. Ověřit project ref a že nejde o projekt SLEVAO.
2. Aplikovat `supabase/schema/plotao-leads.sql` do PLOTAO databáze.
3. Spustit Supabase security/performance advisors a opravit relevantní nálezy.
4. Nastavit náhodný secret `PLOTAO_RATE_SALT` pouze v Supabase secrets.
5. Nasadit Edge Function `submit-lead` s `verify_jwt=false`.
6. Poslat testovací validní lead a potvrdit, že se v `plotao_leads` vytvořil právě jeden záznam.
7. Otestovat neplatný origin, příliš velké tělo, neplatný payload a rate limit.
8. Teprve potom změnit **jen** `assets/lead-transport-config-v1.js`: nastavit přesný function endpoint, jeho origin do `allowedOrigins` a nakonec `enabled:true`.
9. Nechat projít hlavní CI, Pages deploy a ověření skutečné vlastní domény.

Serverové odesílání se smí aktivovat teprve po současném splnění všech bodů:

- existuje samostatný schválený PLOTAO backend,
- endpoint je HTTPS,
- CORS je omezený na PLOTAO,
- serverová validace a rate limiting jsou nasazené,
- perzistence byla ověřena testovacím požadavkem,
- produkční konfigurace má přesný endpoint, správný origin a `enabled:true`,
- CI a ověření živé vlastní domény zůstanou zelené.
