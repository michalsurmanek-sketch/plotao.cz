# Audit administrace PLOTAO.cz — 30. 9. 2026

## Zjištěný provozní tok

1. Veřejné kontaktní, poradenské a kalkulační formuláře skládají payload v `assets/plotao-supabase-leads.js`. Kalkulační parametry se posílají jako validovaný snapshot; orientační cenu klientského payloadu nelze považovat za smluvní cenu.
2. Formuláře volají veřejnou Supabase Edge Function `submit-lead` (aktivní verze 12). Funkce kontroluje origin, JSON, velikost a tvar vstupu, rate-limituje přes hashované události a uloží poptávku do `plotao_leads`. Přijetí případně potvrdí přes Resend.
3. Insert trigger nyní automaticky založí/sdílí kartu zákazníka podle normalizovaného e-mailu, zachová místo realizace a zapíše auditní událost. Telefonní záznam bez e-mailu se záměrně neslučuje s dalšími lidmi na sdíleném čísle.
4. Administrace ověřuje přihlášení přes Supabase Auth a volá chráněnou Edge Function `admin-leads` (aktivní verze 13; JWT povinný). Funkce dnes povoluje jedno konkrétní administrátorské e-mailové konto.
5. V detailu poptávky zůstává historie komunikace, odpověď zákazníkovi přes Resend a při souhlasu zákazníka možnost předat poptávku jedné vhodné partnerské firmě. Vhodnost se kontroluje podle kraje, plotu a služby; předání se eviduje v `plotao_lead_referrals`.

## Stav databáze při auditu

| Oblast | Zjištěný stav |
|---|---|
| Poptávky | 19: 9 žádostí o radu a 10 kalkulačních poptávek |
| Partnerské firmy | 2 záznamy v registru |
| Zákazníci | Nově založeno 12 CRM karet propojených s existujícími poptávkami |
| Místa realizace | 17 uložených adres propojených s poptávkou a zákazníkem |
| Předání partnerovi | 0 záznamů |
| Nabídky / zakázky | Před přidáním nové datové vrstvy 0; nové tabulky jsou připravené, admin UI následuje v další části první etapy |

## Zabezpečení a zjištěné limity

- RLS je zapnuté na poptávkách, partnerech, předáních a nových CRM/obchodních tabulkách. Anonymní ani přihlášený browser klient nemá přímé tabulkové oprávnění; zápisy a čtení jdou přes Edge Functions.
- Veřejná funkce `submit-lead` má záměrně vypnuté JWT ověření, protože ji volá webový formulář; nahrazuje je allowlist originů, validace a rate limit. `admin-leads` vyžaduje JWT a dále kontroluje e-mail administrátora.
- Nové SECURITY DEFINER triggery nemají EXECUTE přístup pro `anon` ani `authenticated`; auditní tabulka nemá browser oprávnění.
- Aktuální oprávnění ještě nejsou rolový systém. Dispečer, účetní a partner nemají vlastní role ani izolované pohledy. Partner zatím nepřijímá/odmítá poptávku přihlášeným portálem; stav zaznamenává administrátor.
- Supabase Security Advisor hlásí vypnutou ochranu proti uniklým heslům. Performance Advisor původně upozornil na dva shodné indexy stavu poptávek; jejich přesná duplicita byla ověřena a jeden index bezpečně odstraněn. Zůstávají jen upozornění na dosud nepoužité indexy u zatím malých tabulek.

## Co se provedlo v první implementační části

- Administrace byla rozdělena na shell `admin.html`, styl `assets/admin/admin-v1.css` a aplikační logiku `assets/admin/admin-v1.js`. Přidán samostatný modul `assets/admin/crm-v1.js`.
- Ukázkové sloupce falešného grafu byly nahrazeny přehledem skutečných poptávek podle stavu a čekajících reakcí partnera.
- Přidána karta Zákazníci jako bezpečný CRM přehled nad stávajícími poptávkami: deduplikuje přes e-mail, u nějž e-mail chybí přes telefon, zobrazuje historii žádostí a umí otevřít původní poptávku. Neudržuje druhou kopii poptávkových dat.
- Přidána datová vrstva pro zákazníky a adresy; stávajících 19 žádostí se backfillnulo. Budoucí formuláře založí zákazníka a uloží adresu v databázovém triggeru.
- Připraveny privátní tabulky nabídky, řádků nabídky, zakázky a řádků zakázky. Nabídka má číslování a položky pro materiál, montáž, dopravu, slevu, nákupní cenu, prodejní cenu a DPH; řádky počítají prodejní základ, náklad a DPH.
- Přidán neveřejný auditní log pro poptávky, zákazníky, adresy, partnery, předání, nabídky a zakázky. Uchovává předchozí/novou hodnotu a typ aktéra; aktuální admin má jedno povolené konto.

## Další pořadí první etapy

1. Modul Nabídky: vytvoření z poptávky, převzetí parametrů kalkulátoru, editor položek a výpočtů, tisk/PDF a odeslání e-mailem.
2. Přijetí nabídky a atomické vytvoření zakázky z jejího snapshotu; číslování, termíny, partner, stav realizace a historie.
3. Detail zákazníka propojující všechny poptávky, nabídky, zakázky, komunikaci, adresy a poznámky.
4. Bezpečný partnerský přístup s vlastní identitou a omezením na předané zakázky. Teprve poté rozšířit role a plný audit „kdo“ bez pevného účtu.
5. Napojit skutečné metriky dashboardu na nabídky/zakázky/náklady. Aktuální grafy a část karet přehledu jsou pouze demonstrační.

## Kontroly

- Syntaxe stávající admin aplikace a nového CRM modulu prošla kontrolou JavaScript parserem.
- Ověřeno, že nové tabulky mají RLS a že po zpřísnění trigger funkcí advisor již nehlásí spustitelné SECURITY DEFINER funkce pro anon/authenticated.
- Nasazovací workflow GitHub Pages a jeho live smoke test ověřují veřejnou doménu; po aktuálním běhu se ověří i načtení oddělených admin assetů.
