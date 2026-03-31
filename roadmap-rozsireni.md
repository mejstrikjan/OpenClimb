# Roadmap Rozsireni

## Cil

Cilem dalsi faze je rozsirit aplikaci o:

- synchronizacni server pro mobilni app
- vlastni backend
- vlastni admin webapp frontend
- spravu uzivatelu, zaznamu a reportingu

Zaroven je potreba udrzet nizke mesicni provozni naklady a mit rozumnou cestu pro pozdejsi rust.

## Soucasny stav aplikace

Mobilni aplikace je dnes offline-first a uklada data lokalne do SQLite. Datovy model je relacni a obsahuje vazby mezi entitami:

- areas
- crags
- sectors
- routes
- ascents
- user_profile

V datech uz existuje naznak budouci synchronizace:

- `synced`
- `created_at`
- `updated_at`

To je dobry zaklad, ale pro realny sync backend to zatim nestaci.

## Doporucena cilova architektura

Pro dalsi rozvoj je doporucena tato architektura:

- mobilni app zustane offline-first
- sync pobezi pres vlastni backend API
- admin webapp bude samostatny frontend
- backend bude spolecny pro sync i admin cast
- databaze bude centralni relacni uloziste

### Doporuceny stack

- Backend: `NestJS` v TypeScriptu
- Admin frontend: `Next.js`
- Databaze: `Postgres`
- ORM: `Prisma`
- Reverse proxy: `Caddy` nebo `Nginx`
- Deploy: `Docker Compose`

## Proc Postgres a ne MariaDB

I kdyz MariaDB muze byt v nekterych pripadech levna, pro tento projekt je vhodnejsi Postgres.

Hlavni duvody:

- aplikace ma relacni datovy model
- budou potreba filtry, agregace, reporty a administrace
- Postgres ma velmi silny ekosystem pro TypeScript backendy
- Prisma i moderni Node stacky s nim pracuji velmi dobre

MariaDB by byla pouzitelna, ale neprinasi zde zasadni vyhodu.

## Nejlevnejsi smysluplna varianta hostingu

Nejlevnejsi doporucena varianta je:

- `1x Hetzner Cloud VPS`
- na jednom serveru pobezi:
  - backend API
  - Postgres
  - admin webapp
  - reverse proxy

### Odhad nakladu

K 30. breznu 2026:

- Hetzner `CAX11`: `EUR 3.29 / mesic`
- Hetzner `CAX21`: `EUR 5.99 / mesic`

Od 1. dubna 2026:

- Hetzner `CAX11`: `EUR 4.49 / mesic`
- Hetzner `CAX21`: `EUR 7.99 / mesic`

Realisticky odhad pro cely nejlevnejsi provoz:

- uplne minimum: `EUR 4.49 az 7.99 / mesic`
- rozumne minimum pro prvni produkci: `EUR 9 az 13 / mesic`

V teto cene muze byt cely sync server:

- backend
- databaze
- admin frontend
- zakladni provoz

### Co v teto cene typicky neni

- vyssi dostupnost
- oddelene staging prostredi
- managed monitoring
- robustni offsite backup strategie
- objektove uloziste pro vetsi objem fotek
- failover nebo replika databaze

## Doporucena roadmapa

### Faze 1: Navrh backendu a sync modelu

Cil:

- navrhnout serverovy datovy model
- navrhnout sync kontrakt
- pripravit backend na offline-first synchronizaci

Ukony:

- doplnit `user_id` na vsechny uzivatelske entity
- zavest `deleted_at` misto hard delete
- doplnit serverem rizene `updated_at`
- doplnit `version` nebo `server_updated_at`
- doplnit `client_mutation_id` pro idempotenci
- navrhnout `push/pull` sync API

Vystup:

- backend schema
- API kontrakt
- pravidla pro konflikty

### Faze 2: Zaklad backendu

Cil:

- vytvorit produkcni backend pro sync i admin cast

Ukony:

- zalozit backend projekt v NestJS
- nastavit Prisma a Postgres
- vytvorit migrace
- implementovat autentizaci
- implementovat role:
  - `admin`
  - `moderator`
  - `user`
- pripravit auditovatelne admin operace

Vystup:

- bezici backend API
- DB migrace
- auth a role model

### Faze 3: MVP synchronizace

Cil:

- zprovoznit prvni realnou synchronizaci mobilni aplikace

Ukony:

- endpoint `POST /sync/push`
- endpoint `GET /sync/pull?since=...`
- synchronizace entit:
  - areas
  - routes
  - ascents
- osetrit smazane zaznamy pres tombstones
- zavest zakladni conflict resolution

Doporucene pravidlo pro MVP:

- `last write wins` podle serveroveho casu

Vystup:

- funkcni prvni sync mezi mobilem a serverem

### Faze 4: Admin webapp MVP

Cil:

- dodat prvni spravcovske webove rozhrani

Ukony:

- zalozit Next.js projekt
- prihlaseni admin uzivatele
- seznam uzivatelu
- seznam oblasti, cest a vystupu
- editace a mazani zaznamu
- jednoduche fulltextove a stavove filtry

Vystup:

- pouzitelna admin webapp pro beznou spravu dat

### Faze 5: Reporting a provozni nastroje

Cil:

- dodat provozni a administrativni funkce navic

Ukony:

- dashboard s pocty uzivatelu a zaznamu
- prehled nesynchronizovanych nebo chybnych dat
- exporty CSV
- zakladni reporty
- audit log admin akci

Vystup:

- admin rozhrani pouzitelne i pro dohled a reporting

### Faze 6: Produkcni zpevneni

Cil:

- pripravit reseni na dlouhodobejsi provoz

Ukony:

- automaticke zalohy DB
- monitoring
- alerting
- hardening serveru
- obnova po havarii
- priprava staging prostredi

Vystup:

- stabilnejsi a bezpecnejsi provoz

## Navrh provozu na jednom serveru

Na jednom levnem VPS mohou bezet tyto kontejnery:

- `postgres`
- `backend`
- `admin-web`
- `caddy` nebo `nginx`

Volitelne:

- `backup` job
- `minio`, pokud by bylo potreba lokalni objektove uloziste

## Rizika nejlevnejsi varianty

Nejlevnejsi varianta je financne vyhodna, ale ma tato omezeni:

- vse bezi na jednom stroji
- selhani serveru odpoji backend i admin web
- databaze nema HA
- vyzaduje vlastni spravu aktualizaci a bezpecnosti
- vyzaduje disciplínu kolem zaloh

Pro prvni produkci je to stale obhajitelne reseni, pokud je cil:

- minimalni cena
- rychly start
- postupne rozsireni bez velke pocatecni investice

## Doporuceni

Finalni doporuceni pro tento projekt:

- pouzit vlastni backend
- pouzit vlastni admin webapp
- pouzit Postgres
- hostovat prvni produkci na jednom Hetzner VPS
- stavet backend i frontend v TypeScript stacku

Tato varianta ma nejlepsi pomer:

- cena
- kontrola nad systemem
- moznost dalsiho rustu

## Doporuceny dalsi krok

Jako dalsi krok je vhodne udelat:

1. navrh serverove databazove struktury
2. navrh sync API kontraktu
3. navrh autentizace a role modelu
4. rozpad prvni implementace na backend a admin web MVP
