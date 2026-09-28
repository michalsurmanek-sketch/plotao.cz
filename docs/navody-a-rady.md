# Centrum Návody a rady

`navody-a-rady.html` je veřejný katalog. Detaily jsou samostatné statické stránky `navod-*.html`, aby jejich obsah a odkazy zůstaly dostupné bez JavaScriptu. Sdílený vzhled je v `assets/guides.css`, filtry a hledání bez diakritiky v `assets/guides.js`.

Přidání návodu:
1. Zkopírujte nejbližší stránku `navod-*.html` a upravte obsah, jedinečný title, popis, canonical a Article JSON-LD.
2. Přidejte kartu do katalogu se správnou kategorií `data-category`, obrázkem a skutečným odkazem na detail.
3. Přidejte URL a datum změny do `sitemap.xml`, propojte související články a relevantní typ plotu.
4. Spusťte SEO a kontrolu interních odkazů; funkční scénář je v `scripts/guides-wizard-browser-check.mjs`.

Texty se záměrně neopírají o univerzální rozměr základů, rozteče nebo dobu zatížení betonu. Konkrétní montážní parametry se musí doplnit podle dokumentace zvoleného výrobku a místních podmínek. Praktické tipy nejsou vydávány za citace smyšlených odborníků.
