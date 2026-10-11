# Audit de la surcouche BTP Life — préparation V3.0

**Date :** 11 octobre 2026  
**Statut :** audit technique initial, sans suppression ni restructuration  
**Référence produit :** `PROMPT CODEX — BTP LIFE V3.0`

## 1. Résumé exécutif

BTP Life est aujourd'hui une application web de progression professionnelle BTP solide, testée et déployable. Elle possède déjà plusieurs données et règles qui pourront alimenter un simulateur de vie : avatar, carrière, besoins, traits, lieux, PNJ, messages, économie, inventaire cosmétique, entreprise et chantiers.

En revanche, la surcouche actuelle n'est pas encore un monde vivant. Le « monde » est une carte isométrique servant de navigation vers des pages. Les PNJ répondent à des déclencheurs de progression, mais n'ont ni domicile, ni agenda, ni besoins, ni mémoire relationnelle, ni autonomie. Le temps est le temps réel du serveur ; il n'existe pas d'horloge mondiale, de tick de simulation, de journal d'événements causal ou de présence multijoueur.

La V3 ne doit donc pas remplacer la base existante. Elle doit introduire un noyau de simulation serveur, puis y raccorder progressivement les systèmes actuels.

## 2. État technique constaté

### Stack et déploiement

| Couche | Existant | État |
|---|---|---|
| Frontend | Next.js 15, React 19, Tailwind, React Query, Zustand | Fonctionnel |
| Backend | NestJS 10, REST, Prisma 5 | Fonctionnel |
| Données | PostgreSQL/Supabase, 56 modèles Prisma | Fonctionnel |
| Hébergement | Deux projets Vercel séparés | Adapté au REST, inadapté à une boucle persistante |
| Mobile | PWA et wrapper Android TWA | Réutilisable |
| Temps réel | Aucun WebSocket/SSE de monde partagé | Absent |
| Tâches de fond | Cron de notifications seulement | Insuffisant pour la simulation |
| Cache/queue | Aucun Redis, bus ou file de travaux | Absent |
| Rendu du monde | React/SVG isométrique | Visuel et navigable, pas spatialement simulé |

### Validation réalisée

- Backend : compilation réussie.
- Backend : 17 suites et 229 tests réussis.
- Frontend : compilation de production réussie, 41 pages statiques générées.
- Frontend : 5 suites et 27 tests réussis.
- La branche `main` est propre et possède un commit local non poussé concernant `DIRECT_URL` pour Prisma.

## 3. Inventaire fonctionnel : réel, partiel ou visuel

| Domaine V3 | Ce qui existe réellement | Limite actuelle | Verdict |
|---|---|---|---|
| Personnage | Compte, avatar SVG, traits, carrière, XP, réputation | Pas d'âge, étape de vie, aspiration, mémoire ou position | Réutilisable |
| Besoins | Énergie, faim, social, moral ; déclin paresseux ; actions repos/repas/social | Pas de sommeil, hygiène, stress, emploi du temps ni objets fonctionnels | Prototype métier réel |
| Temps | Dates serveur et ancienneté virtuelle | Pas d'horloge du monde, cycle jour/nuit ou calendrier simulé | Absent |
| PNJ | Catalogue de PNJ, rôles, personnalité JSON, messages déclenchés | Pas d'état vivant, agenda, domicile, emploi, décision ou relation | Contenu réutilisable, moteur absent |
| Monde | Lieux, carte isométrique, pages par lieu | Carte = menu spatial ; aucun déplacement, occupation ou état de quartier | Principalement visuel |
| Relations | Messages unidirectionnels PNJ vers joueur | Pas de graphe relationnel, conversation, amitié ou rivalité | Absent |
| Logement | Aucun modèle de propriété ou mobilier domestique | Aucun espace jouable ni objet interactif | Absent |
| Carrière/éducation | Parcours, profils, missions, cours, promotions, offres et candidatures | Pas d'agenda de travail, contrat, présence ou employeur simulé | Solide, à raccorder |
| Chantiers | Phases, budget, ouvriers, ressources, journées, qualité et sécurité | Instances par joueur, progression déclenchée manuellement, sans effet urbain | Solide, à raccorder |
| Entreprise | Entreprise virtuelle, capital et réputation | Employés/chantiers en JSON, pas d'autonomie ni comptabilité transactionnelle | Partiel |
| Économie | Argent virtuel, épargne, coûts, récompenses | Pas de portefeuille comptable, ledger ni marché local | Partiel |
| Inventaire | Cosmétiques d'avatar et stocks de chantier | Pas d'objets génériques, meubles, ownership ou échange | Partiel |
| Ville/quartier | Lieux et localisations fictives | Pas de parcelles, bâtiments persistants, population ou indicateurs urbains | Absent |
| Multijoueur | Classement et aperçu d'autres joueurs | Pas de présence, session de quartier, coopération ou échanges | Absent |
| Persistance | PostgreSQL relationnel | Pas de snapshot mondial, curseur de tick, événements idempotents ou outbox | Base saine, extension requise |
| Administration | CRUD, utilisateurs, contenus et KPIs | Aucun outil d'observation/rejeu de simulation | Réutilisable |
| Partenariats | Pages B2B génériques prévues | Pas de demande partenaire et workflow de suivi dédié | À créer |

## 4. Composants à conserver

1. Authentification, rôles, protections d'accès et audit.
2. Référentiel de métiers, profils, compétences, cours et missions.
3. Moteur de progression, promotions et historique de carrière.
4. Simulation de chantier, après découplage du modèle strictement « par joueur ».
5. Catalogue PNJ et lieux comme données de départ du premier quartier.
6. Avatar et inventaire cosmétique comme première couche de personnalisation.
7. React Query, PWA, TWA et shell d'administration.
8. PostgreSQL/Prisma comme source de vérité transactionnelle.

## 5. Composants à faire évoluer

### Besoins

Le calcul paresseux actuel est utile pour les joueurs déconnectés. Il doit devenir une projection du moteur de simulation : calcul détaillé pour les personnages actifs, calcul analytique borné pour les personnages éloignés ou hors ligne.

### PNJ

Le service actuel est un générateur de messages contextuels. Il ne doit pas être supprimé ; ses déclencheurs deviennent des réactions à des événements du monde. Un nouveau cerveau déterministe gérera objectifs, agenda, état, mémoire et décisions.

### Chantiers

Les règles de budget, équipe, stock et qualité sont conservées. Un chantier V3 devra aussi référencer une parcelle, un bâtiment futur, une entreprise responsable, des participants et des effets urbains.

### Monde isométrique

La carte actuelle reste une vue de transition et un prototype de direction artistique. Elle devra consommer un état de quartier réel et afficher des entités interactives, au lieu de contenir une liste statique de raccourcis.

## 6. Risques et dettes à traiter avant la simulation persistante

1. **Vercel serverless ne peut pas héberger une boucle mondiale continue.** Il faut un processus worker durable.
2. **L'argent est stocké comme un simple solde.** Les échanges multijoueurs exigent un ledger immuable et des transactions idempotentes.
3. **Plusieurs structures sont en JSON.** Elles sont pratiques pour le prototype, mais inadaptées aux relations, propriétés et recherches du monde.
4. **Aucune notion de version du monde.** Les commandes concurrentes pourraient écraser un état sans verrou optimiste.
5. **Aucun système de présence.** Il faut séparer présence éphémère et état persistant.
6. **Le lint frontend n'est pas automatisable.** `next lint` ouvre une configuration interactive.
7. **Le build public tolère l'indisponibilité de l'API.** Des pages peuvent être générées avec un catalogue vide sans faire échouer la livraison.
8. **Les identifiants administrateur de démonstration sont documentés.** Ils doivent être isolés de toute production réelle.

## 7. Conclusion d'audit

La base existante est suffisamment saine pour devenir le socle de BTP Life V3. Il ne faut ni la jeter ni présenter ses écrans actuels comme un jeu de simulation complet.

Le premier investissement doit porter sur les invariants serveur : horloge, commandes, événements, personnages simulés, bâtiments et propriétés. Le nouveau rendu immersif viendra ensuite lire cet état. Cette séquence protège l'économie, permet les tests et rend possible un futur client 3D sans dupliquer les règles.

