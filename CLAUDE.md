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
                            # chantiers, auth, admin, cv, offres, promotions...)
  src/<domaine>/*.spec.ts  # tests unitaires, voir convention ci-dessous
  prisma/schema.prisma     # 52 modèles
  prisma/migrations/       # migrations écrites à la main (voir plus bas)
  prisma/seed-data/        # contenu du jeu, par domaine (voir plus bas)
  prisma/seed.ts           # orchestration seulement (upserts), ~860 lignes
  scripts/test-migrations.ts

frontend/
  src/app/                 # routes App Router (40 pages)
  src/lib/                 # api client, auth store (zustand), constantes de jeu
  src/components/app/      # composants partagés de l'app authentifiée
```

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

## Contenu du jeu (`prisma/seed-data/`)

Les missions, modules académie et chantiers virtuels vivent dans des fichiers
séparés par domaine (`missions-data.ts`, `academie-data.ts`,
`chantiers-data.ts`), importés par `seed.ts` qui ne fait que les upserter.
Ajouter du contenu = ajouter une entrée dans le bon fichier de données, pas
fouiller un fichier de 4 600 lignes.

## Migrations Prisma

Écrites à la main (pas d'environnement Postgres local historiquement
disponible). **Avant tout `prisma migrate deploy` en production**, lancer
`npm run test:migrations` (backend) : télécharge un Postgres portable
(`embedded-postgres`, aucune install système), rejoue toutes les migrations
depuis zéro puis lance le seed complet. Si ça échoue, la migration ne part
pas en prod.

Note Windows : `embedded-postgres` a besoin de `initdbFlags: ['--locale=C']`
dans `scripts/test-migrations.ts` — sans ça, `initdb` plante si la locale
système contient des caractères non-ASCII (ex. `French_Côte d'Ivoire.1252`).

Deux modes de connexion Supabase (même hôte) :
- **Transaction** (port 6543) : usage normal, seed.
- **Session** (port 5432) : requis spécifiquement pour `prisma migrate deploy`.

## Déploiement

Backend et frontend se déploient indépendamment (`vercel deploy --prod --yes`
depuis chaque dossier). **Toujours** health-check immédiatement après (`curl`
sur `/api/auth/login`) avant de considérer un déploiement backend réussi.

## Système de progression

- `xpRequisPourNiveau(niveau)` / `xpToNiveau(xp)` dans
  `carriere/progression.service.ts` définissent la courbe (exposant 2.2,
  calibrée pour aller jusqu'au niveau 100).
- `UserCarriere.reputation` est sur une échelle **0–1000**, pas 0–100.
- `ProgressionService.appliquerDelta()` est le seul endroit qui doit
  recalculer `niveau` depuis `xp` — tout autre code qui touche `niveau`
  directement doit se protéger contre une régression (voir plus haut).
