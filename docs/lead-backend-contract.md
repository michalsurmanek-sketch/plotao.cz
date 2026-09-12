# PLOTAO lead backend contract

Tento kontrakt popisuje jediný podporovaný způsob serverového příjmu formulářů z `https://plotao.cz`.

## Stav na frontendu

Frontend používá `lead-core-v1.js` pro normalizaci/validaci a `lead-transport-core-v1.js` pro schválení síťového cíle. Dokud není definována runtime konfigurace `window.PLOTAO_LEAD_TRANSPORT_CONFIG`, serverové odesílání zůstává vypnuté a formulář zachová bezpečný session/clipboard fallback.

Runtime konfigurace smí obsahovat pouze veřejný endpoint a explicitní allowlist jeho originu. Nikdy do ní nepatří service-role klíč, databázové heslo, privátní API klíč ani jiný serverový secret.

Příklad tvaru konfigurace po zprovoznění backendu:

```js
window.PLOTAO_LEAD_TRANSPORT_CONFIG = {
  endpoint: 'https://<schvaleny-host>/leads',
  allowedOrigins: ['https://<schvaleny-host>']
};
```

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
6. CORS pouze pro schválené originy webu PLOTAO; nepoužívat `*` pro produkční endpoint s osobními údaji.
7. Server nesmí důvěřovat `displayedPrice` jako účetní nebo smluvní ceně. Je to snapshot UI pro zpracování poptávky.
8. Logy nesmí zbytečně vypisovat celé telefonní číslo, e-mail, poznámku ani celý request body.

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

## Aktivace

Serverové odesílání se smí aktivovat teprve po současném splnění všech bodů:

- existuje samostatný schválený PLOTAO backend,
- endpoint je HTTPS,
- CORS je omezený na PLOTAO,
- serverová validace a rate limiting jsou nasazené,
- perzistence byla ověřena testovacím požadavkem,
- runtime konfigurace obsahuje přesný endpoint i jeho origin v `allowedOrigins`,
- CI a live smoke zůstanou zelené.
