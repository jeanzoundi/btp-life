# BTP Life — Plateforme complète (full-stack)

**Le simulateur de carrière et de vie professionnelle dans le BTP.**
Monorepo : backend **NestJS + Prisma + PostgreSQL**, frontend **Next.js 15 + Tailwind** (PWA).

> L'ancien prototype mono-fichier est conservé dans [`prototype-v0/`](prototype-v0/).
> La conception complète est dans [`CONCEPTION.md`](CONCEPTION.md).

## Environnement de test en ligne

| | URL | Hébergeur |
|---|---|---|
| Application | https://btp-life-frontend.vercel.app | Vercel (projet `btp-life-frontend`) |
| API | https://btp-life-backend.vercel.app/api | Vercel (projet `btp-life-backend`, fonction serverless) |
| Base de données | Supabase, projet `btp-life` (org **BTP LIFE**) | Supabase |

Comptes démo : `admin@btplife.com` / `Admin1234!` et `demo@btplife.com` / `Demo1234!`.

**Notes de déploiement** :
- Le backend NestJS tourne sur Vercel via `backend/api/index.ts` (handler serverless qui réutilise l'app Nest créée par `backend/src/create-app.ts`, partagée avec `main.ts` pour le dev local). `backend/vercel.json` redirige toutes les routes vers cette fonction.
- Prisma est généré avec `binaryTargets = ["native", "rhel-openssl-3.0.x"]` pour le runtime Vercel.
- La connexion à Supabase utilise le **pooler Supavisor** (port 6543, `pgbouncer=true`) plutôt que la connexion directe : l'hôte direct (`db.<ref>.supabase.co:5432`) ne résout qu'en IPv6, ce qui échoue sur beaucoup de réseaux IPv4. Le pooler résout aussi en IPv4 et fonctionne partout.
- Pour redéployer après un changement de code : `cd backend && npx vercel --prod` puis `cd frontend && npx vercel --prod`.
- Variables d'environnement gérées via `vercel env add/rm <NOM> production` dans chaque dossier (voir `vercel env ls`).

## Structure

```
BTP LIFE/
├── backend/          API NestJS (port 4000)
│   ├── prisma/       schema.prisma (≈45 modèles) + seed.ts (contenu CI/France)
│   └── src/          auth, carrière, missions, chantiers, cv, offres, promotions,
│                     catalog (lecture publique), admin (CRUD + KPIs)
├── frontend/         Next.js App Router (port 3000)
│   └── src/app/      (public)/ site vitrine · app/ application joueur ·
│                     admin/ back-office · onboarding/
├── docker-compose.yml  PostgreSQL 16 prêt à l'emploi
└── CONCEPTION.md       cahier des charges complet
```

## Démarrage

### 1. Base de données (PostgreSQL requis)

Option A — Docker :
```bash
docker compose up -d
```
Option B — PostgreSQL installé localement : créer une base `btp_life`.

### 2. Backend

```bash
cd backend
cp .env.example .env          # ajuster DATABASE_URL si besoin
npm install
npx prisma migrate dev --name init
npm run seed                  # contenu pilote + comptes démo
npm run start:dev             # API sur http://localhost:4000/api
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

## Comptes de démonstration (créés par le seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Super-admin | admin@btplife.com | Admin1234! |
| Joueur démo | demo@btplife.com | Demo1234! |

## Ce qui est implémenté

- **Auth** : inscription, connexion, JWT access + refresh, rôles (USER/ADMIN/ECOLE/ENTREPRISE), suspension de compte.
- **Onboarding 4 étapes** : avatar → profil actuel (~29 profils) → métier cible → parcours généré.
- **Moteur de missions** : 6 types de questions (QCM, numérique avec tolérance, zones image,
  ordonnancement, choix à conséquences, texte), chrono avec bonus, malus sécurité (plafond 50),
  correction pédagogique, XP/réputation/argent, badges auto, compétences validées.
- **19 missions publiées** couvrant les 14 types du cahier des charges (quiz, chrono, analyse image,
  lecture plan, calcul, métré, devis, rapport, décision, gestion humaine, simulation logiciel,
  contrôle qualité, chantier complet, examen).
- **Chantiers virtuels** : 3 chantiers (dalle, clôture, chambre) multi-phases, équipe d'ouvriers,
  budget/délai/qualité/sécurité/moral, note finale A–D, récompenses.
- **Progression** : courbe XP → niveau, règles de promotion conditionnelles avec manquants affichés,
  entretien/examen de passage.
- **CV virtuel** : agrégation automatique (compétences, logiciels, chantiers, badges, certificats),
  export par impression.
- **Offres d'emploi** : 5 offres avec conditions, test d'entrée, feedback de refus + plan d'action,
  embauche = changement de profil.
- **Référentiel pays** : Côte d'Ivoire (normes, bibliothèque de prix FCFA) + France, variantes par pays
  prévues dans le schéma (`mission_variantes_pays`).
- **Académies** : 8 modules BTP avec cours, 6 logiciels référencés.
- **Back-office admin** : dashboard KPIs (taux de réussite par mission pour l'équilibrage 60–85 %),
  gestion utilisateurs (rôles, suspension), CRUD générique sur missions, chantiers, badges, offres,
  règles de promotion, pays, PNJ, pages CMS.
- **PWA** : manifest, service worker (shell offline), installable.

## Ce qui reste (voir CONCEPTION.md §18)

Paiements réels (Stripe/CinetPay/Wave), notifications push, emails transactionnels, exports PDF
serveur (certificats), espaces B2B écoles/entreprises, monde virtuel interactif et messages PNJ
scriptés, 70 missions éditoriales, entreprise virtuelle, défis quotidiens, classements.

---
⚠️ BTP Life est un simulateur pédagogique. Les contenus techniques et normatifs servent à
l'apprentissage et ne remplacent pas les normes officielles, les bureaux d'études, les ingénieurs
habilités, les laboratoires agréés ni les obligations réglementaires du pays concerné.
