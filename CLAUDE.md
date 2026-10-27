# BTP Life

Simulateur de carrière BTP (Côte d'Ivoire) : progression de carrière, missions,
chantiers, entreprise/marchés, académie, monde virtuel multijoueur. Deux apps
séparées, deux déploiements Vercel séparés, une base Supabase partagée.

## Stack

- **Backend** : NestJS 10 + Prisma 5 + PostgreSQL (Supabase). Déployé comme
  fonctions serverless Vercel (`btp-life-backend`).
- **Frontend** : Next.js 15 (App Router) + React Query + Zustand. Déployé
  séparément sur Vercel (`btp-life-frontend`).
- **Tests** : Jest côté backend, Vitest + React Testing Library côté frontend.

## Structure

```
backend/
  src/<domaine>/           # un module NestJS par domaine (carriere, missions,
                            # chantiers, auth, admin, cv, offres, promotions,
                            # monde, certificats, notifications...)
  src/<domaine>/*.spec.ts  # tests unitaires, voir convention ci-dessous
  prisma/schema.prisma     # ~60 modèles
  prisma/migrations/       # migrations écrites à la main (voir plus bas)
  prisma/seed-data/        # contenu du jeu, par domaine (voir plus bas)
  prisma/seed.ts           # orchestration seulement (upserts), ~900 lignes
  scripts/test-migrations.ts       # migrations + seed sur Postgres éphémère
  scripts/publier-contenu-monde.ts # publication additive du contenu en production

frontend/
  src/app/                 # routes App Router (50 pages)
  src/lib/                 # api client, auth store (zustand), logique de jeu
                            # pure (barèmes recopiés du serveur, testés)
  src/components/app/      # composants de l'app authentifiée et de la ville 3D
```

Le module `monde` (serveur) regroupe la vie du quartier hors carrière : trajets
payés, défis et imprévus, logement et travaux chez soi, entreprise du joueur,
présence en ligne, émotes, chat et équipes de quartier (4 joueurs au plus ;
+10 % d'XP sur une séance quand un coéquipier est dans le même lieu, appliqué
dans `lieux.service.ts`). La présence se relève toutes les 10 s
(`POST /monde/presence?equipe=1` renvoie aussi l'équipe et les invitations). Plusieurs barèmes existent des deux côtés
(`backend/src/carriere/patrimoine.ts` et `frontend/src/lib/patrimoine.ts`,
transports, besoins…) : la démonstration joue sans serveur avec les mêmes
chiffres. Modifier un barème = modifier les deux, et leurs tests.

Deux outils travaillent dans le même dossier (Claude et Codex) : ne jamais
annuler ni réécrire le travail de l'autre, et ne commiter que ses propres
fichiers.

## Conventions de test (backend)

Chaque `*.service.spec.ts` suit le même patron : un `fakePrisma(overrides)`
qui fusionne des valeurs par défaut avec des overrides par test, et un
`service(prisma)` qui instancie le service via `Test.createTestingModule`
avec `PrismaService` et les services annexes (`ProgressionService`,
`BesoinsService`, `PnjService`...) mockés en `jest.fn()`.

Exception délibérée : les algorithmes purs sans dépendance externe (hachage
argon2 dans `auth.service.spec.ts`, `BesoinsService.facteurPerformance`
statique) sont exercés réellement, jamais mockés — ce sont exactement les
mécanismes qu'on veut vérifier pour de vrai.

Avant d'écrire une nouvelle méthode qui touche xp/niveau/argent/réputation,
regarder `carriere.service.ts` (`setProfilActuel`) : deux bugs de production
sont venus d'un champ `niveau` fixé sans garde contre une régression — le
motif `Math.max(valeurActuelle, nouvelleValeur)` est le réflexe à avoir.

Argent et gains : une seule transaction sérialisable (avec nouvelle tentative
sur `P2034`), `progression.appliquerDelta(userId, delta, tx)` dedans, puis
`progression.notifierNiveau(...)` après le commit. Les loyers, l'épargne et
les journées d'entreprise se calculent paresseusement à la lecture.

## Contenu du jeu (`prisma/seed-data/`)

Les missions, modules académie et chantiers virtuels vivent dans des fichiers
séparés par domaine (`missions-data.ts`, `academie-data.ts`,
`chantiers-data.ts`), importés par `seed.ts` qui ne fait que les upserter.
Ajouter du contenu = ajouter une entrée dans le bon fichier de données, pas
fouiller un fichier de 4 600 lignes. Métiers experts, offres d'emploi et
certificats sont dans `carriere-data.ts`, défis et imprévus dans
`defis-data.ts`.

Le seed met les cours à jour sur place, repérés par leur titre dans le module :
deux cours d'un même module ne doivent jamais porter le même titre (le seed
s'arrête). Recréer un cours effacerait en cascade les cours lus des joueurs.

En production, publier le nouveau contenu avec
`npx ts-node scripts/publier-contenu-monde.ts --apply` (backend) : il ajoute ce
qui manque, en une transaction, sans toucher aux comptes, aux progrès ni au
contenu modifié dans l'administration. Le seed complet, lui, réécrit le contenu
existant.

## Migrations Prisma

Écrites à la main (pas d'environnement Postgres local historiquement
disponible). **Avant tout `prisma migrate deploy` en production**, lancer
`npm run test:migrations` (backend) : télécharge un Postgres portable
(`embedded-postgres`, aucune install système), rejoue toutes les migrations
depuis zéro puis lance le seed complet. Si ça échoue, la migration ne part
pas en prod.

Le test enchaîne ensuite les vérifications sur cette base : transactions de la
campagne, seed rejoué sur des cours déjà lus, transactions du monde et
publication additive rejouable.

Notes Windows :
- `embedded-postgres` a besoin de `initdbFlags: ['--locale=C']` dans
  `scripts/test-migrations.ts` — sans ça, `initdb` plante si la locale système
  contient des caractères non-ASCII (ex. `French_Côte d'Ivoire.1252`).
- Postgres 18 tourne avec `io_method=sync` : sinon un processus `io_worker`
  survit parfois à l'arrêt, sans parent, et le test ne rend jamais la main
  (port 5433 et `.embedded-pg-data` restent pris). Si un ancien test bloque
  encore, chercher ce `postgres.exe --forkchild="io_worker"` orphelin.

Deux modes de connexion Supabase (même hôte) :
- **Transaction** (port 6543) : usage normal, seed.
- **Session** (port 5432) : requis spécifiquement pour `prisma migrate deploy`.

## Déploiement

Backend et frontend se déploient indépendamment (`vercel deploy --prod --yes`
depuis chaque dossier). **Toujours** health-check immédiatement après (`curl`
sur `/api/auth/login`) avant de considérer un déploiement backend réussi.

- Le build Vercel du backend (`vercel-build`) lance `prisma migrate deploy` :
  déployer le backend applique les migrations en attente à la production.
  `npm run test:migrations` passe donc avant tout déploiement du backend.
- `vercel deploy` envoie le dossier tel qu'il est, modifications non commitées
  comprises : déployer depuis un état propre (ou une copie du commit).
- Pour une mise en ligne prudente : `vercel deploy --prod --skip-domain`, puis
  promotion une fois la version vérifiée. Les migrations, elles, s'appliquent
  dès le build.
- Domaines publics : `btp-life-backend.vercel.app` et
  `btp-life-frontend.vercel.app`.

## Système de progression

- `xpRequisPourNiveau(niveau)` / `xpToNiveau(xp)` dans
  `carriere/progression.service.ts` définissent la courbe (exposant 2.2,
  calibrée pour aller jusqu'au niveau 100).
- `UserCarriere.reputation` est sur une échelle **0–1000**, pas 0–100.
- `ProgressionService.appliquerDelta()` est le seul endroit qui doit
  recalculer `niveau` depuis `xp` — tout autre code qui touche `niveau`
  directement doit se protéger contre une régression (voir plus haut).
