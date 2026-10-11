# Architecture proposée — BTP Life World Simulation Engine

**Date :** 11 octobre 2026  
**Statut :** proposition à valider  
**Décision structurante :** conserver le monolithe NestJS, y ajouter des modules de simulation clairement isolés et exécuter la boucle du monde dans un worker durable.

## 1. Contraintes et hypothèses

- La V3 améliore le dépôt actuel et ne repart pas de zéro.
- PostgreSQL reste la source de vérité.
- Le serveur est seul autoritaire pour l'argent, les propriétés, les constructions, les diplômes et les résultats.
- Le premier livrable est un quartier d'Abidjan jouable, pas une métropole entière.
- Le client historique Next.js reste disponible pendant la migration.
- La simulation doit fonctionner sans IA externe.
- Les personnages hors ligne ne subissent pas une dégradation punitive illimitée.
- L'échelle initiale visée est un monde pilote, extensible ensuite par quartiers partitionnés.

## 2. Décision d'architecture

### Option retenue : monolithe modulaire + worker de simulation

| Dimension | Évaluation |
|---|---|
| Complexité initiale | Moyenne |
| Réutilisation de l'existant | Forte |
| Cohérence transactionnelle | Forte |
| Mise sur le marché | Rapide |
| Évolution vers plusieurs quartiers | Bonne |
| Coût opérationnel | Modéré |

Le backend NestJS reste l'API et la couche métier. Les modules V3 sont isolés par interfaces et tables dédiées. Un exécutable NestJS distinct exécute les ticks, consomme les commandes et publie les événements. Au début, API et worker partagent le même dépôt et la même base.

### Options non retenues immédiatement

#### Microservices complets

Ils isoleraient bien les domaines, mais imposeraient trop tôt contrats distribués, observabilité, déploiements multiples et cohérence éventuelle. Ils deviendront pertinents seulement si un domaine impose une montée en charge indépendante.

#### Logique mondiale dans le frontend

Rapide à prototyper, mais incompatible avec l'autorité serveur, l'anti-triche, le multijoueur et la continuité hors connexion.

#### Migration immédiate vers Unity ou Unreal

Elle produirait une meilleure 3D, mais obligerait à reconstruire prématurément navigation, authentification, déploiement et interfaces. Le moteur de simulation doit d'abord exister indépendamment du rendu.

## 3. Vue d'ensemble

```text
Client Next.js/PWA          Futur client 3D
        | REST + temps réel       |
        +------------+------------+
                     |
              API NestJS autoritaire
                     |
       Commandes validées + transactions
                     |
     PostgreSQL <----+----> Outbox d'événements
          |                       |
          +------ Worker World Simulation
                      |
          ticks, agendas, décisions, projections
                      |
           Canal temps réel / cache de présence
```

Le canal temps réel pourra commencer par SSE pour les notifications de quartier, puis évoluer vers WebSocket quand la présence et les déplacements continus seront introduits. Redis n'est pas requis pour le premier prototype mono-worker, mais devient nécessaire pour la présence, les verrous distribués et la diffusion multi-instance.

## 4. Modules cibles

| Module | Responsabilité |
|---|---|
| `world-clock` | Heure simulée, vitesse, pause administrative, fuseau et calendrier |
| `world-events` | Enveloppes d'événements, outbox, idempotence, réactions et rejeu contrôlé |
| `characters` | Identité simulée commune aux joueurs et PNJ, étape de vie et état courant |
| `needs-emotions` | Besoins, humeur, stress, effets et récupération |
| `npc-behavior` | Agenda, objectifs, machine à états, planification et décision |
| `relationships` | Graphe social, affinité, confiance, conflits et souvenirs |
| `housing-property` | Unités, occupation, location, propriété, accès et mobilier |
| `construction-world` | Parcelles, permis, chantier physique et transformation en bâtiment utile |
| `career-education` | Adaptateur entre le monde et les missions/cours/promotions existants |
| `economy-inventory` | Portefeuille BTL, ledger, objets, transactions et échanges atomiques |
| `multiplayer-social` | Présence, sessions, permissions, invitations et coopération |
| `district-evolution` | Population, demande, services, loyers et projets urbains |
| `partnerships` | Demandes partenaires, statuts, notifications et accès admin |
| `simulation-admin` | Santé du worker, inspection, pause, accélération et journal causal |

## 5. Modèle de simulation

### Horloge

- Une ligne `World` contient `simulatedAt`, `speed`, `status` et `tickSequence`.
- Une journée réelle ne doit pas nécessairement correspondre à une journée simulée.
- Le temps avance par ticks atomiques ; un tick possède un identifiant monotone.
- L'administrateur peut mettre un monde en pause sans modifier l'heure système.

### Trois niveaux de détail

1. **Actif :** joueurs connectés et PNJ proches ; actions courtes et état détaillé.
2. **Quartier :** PNJ importants hors champ ; agenda par blocs et événements significatifs.
3. **Arrière-plan :** population agrégée ; évolution analytique quotidienne ou hebdomadaire.

Un changement de niveau de détail matérialise ou agrège l'état sans changer les résultats économiques déjà validés.

### Commandes et événements

Une action utilisateur est une commande : `Dormir`, `AcheterObjet`, `CommencerCours`, `AccepterStage`. L'API valide la commande dans une transaction, modifie l'état et écrit un événement dans l'outbox.

Exemple de chaîne :

```text
EntrepriseRecrute
  -> ContratCree
  -> RevenuAttenduModifie
  -> DemandeLogementModifiee
  -> PressionLoyerQuartierModifiee
  -> OpportuniteConstructionCreee
```

Chaque consommateur enregistre l'identifiant de l'événement traité. Une répétition réseau ne doit jamais doubler un salaire, un achat ou une récompense.

## 6. Premiers modèles de données

Les noms définitifs seront validés avant migration.

```text
World
WorldTick
WorldEvent
SimulationCommand
District
Parcel
Building
BuildingUnit
Character
CharacterState
CharacterNeed
CharacterSchedule
CharacterActivity
NpcGoal
Relationship
Memory
Household
PropertyRight
FurnitureDefinition
FurnitureInstance
Wallet
LedgerEntry
WorldConstructionProject
DistrictMetricSnapshot
PresenceSession (éphémère ou TTL)
```

`User` référence éventuellement un `Character`. Un PNJ est aussi un `Character`, mais sans `User`. Cette unification évite deux moteurs de besoins, de relations et de logement.

## 7. Autorité et cohérence

- Solde calculé depuis un ledger ou maintenu avec contrôle transactionnel et audit.
- Version optimiste sur les entités fortement concurrentes.
- Clé d'idempotence obligatoire pour les commandes économiques.
- Permissions explicites sur chaque logement, parcelle et chantier.
- Aucun client ne fournit le résultat d'une simulation ; il ne fournit que son intention.
- Le worker verrouille un monde ou une partition de quartier pendant un tick.
- Les effets externes sont écrits via outbox après validation de la transaction métier.

## 8. Premier quartier jouable

Le quartier pilote contient :

- un logement initial et trois meubles fonctionnels : lit, douche et réfrigérateur ;
- une université avec un professeur et un exercice existant ;
- une entreprise BTP proposant un stage ;
- un chantier raccordé au moteur existant ;
- un commerce pour acheter un premier meuble ;
- un lieu social ;
- 8 à 12 PNJ avec agendas simples ;
- un cycle jour/nuit ;
- faim, énergie, hygiène, social, moral et stress ;
- une relation voisin et une relation professeur ;
- une évolution visible, limitée et déterministe du quartier.

Le scénario d'acceptation suit exactement le parcours demandé : création, emménagement, voisin, sommeil, université, professeur, exercice, stage, chantier, salaire et achat domestique.

## 9. Feuille de route priorisée

### Phase 0 — Sécuriser la base (courte)

- Réparer le lint frontend.
- Rendre visibles les erreurs de catalogue au build.
- Ajouter tests de concurrence et conventions d'idempotence.
- Pousser ou valider le commit `DIRECT_URL` avant toute migration suivante.

**Sortie :** pipeline fiable, aucune fonctionnalité de jeu annoncée.

### Phase 1 — Vertical slice du moteur

- Créer `World`, horloge, commande, événement, outbox et worker.
- Ajouter pause, vitesse et tick déterministe.
- Exposer l'état du monde en lecture.
- Tester rattrapage après arrêt, double exécution et ordre des ticks.

**Sortie jouable :** heure mondiale persistante et cycle jour/nuit visible.

### Phase 2 — Personnage unifié et besoins

- Relier `User` à `Character` et migrer les quatre besoins existants.
- Ajouter hygiène, sommeil et stress.
- Introduire activités avec durée et effets.
- Plafonner le rattrapage hors ligne et protéger les joueurs déconnectés.

**Sortie jouable :** dormir, manger et se laver dans le temps du monde.

### Phase 3 — PNJ autonomes

- Migrer les PNJ importants vers `Character`.
- Ajouter agenda, domicile, profession, objectifs et machine à états.
- Ajouter mémoire structurée et initiation d'interactions.
- Conserver les messages actuels comme réactions événementielles.

**Sortie jouable :** voisin, professeur et ouvrier suivent un cycle observable.

### Phase 4 — Logement et objets

- Propriété, location, droits d'accès et foyer.
- Pièce/grille spatiale simple.
- Mobilier fonctionnel, inventaire générique et boutique BTL.

**Sortie jouable :** emménagement et achat du premier objet utile.

### Phase 5 — Carrière, stage et chantier intégrés

- Contrats, horaires et salaires.
- Raccorder cours, missions et chantier existants aux lieux et au temps.
- Transformer la livraison d'un chantier en bâtiment ou amélioration persistante.

**Sortie jouable :** parcours université -> stage -> chantier -> salaire.

### Phase 6 — Relations et quartier évolutif

- Graphe social, interactions et souvenirs.
- Parcelles, bâtiments et métriques du quartier.
- Première chaîne causale entreprise/logement/construction.

**Sortie jouable :** changements observables après plusieurs journées.

### Phase 7 — Multijoueur

- Présence, synchronisation, invitations et permissions.
- Chantier coopératif et visite de logement.
- Ledger et échanges atomiques.

**Sortie jouable :** deux joueurs interagissent sans compromettre l'autorité serveur.

### Phase 8 — Fondateur et partenariats

- Profil officiel vérifié sans privilèges admin implicites.
- Formulaire partenaire, anti-spam, workflow et tableau de suivi.

## 10. Stratégie de rendu

### Étape initiale

Une scène isométrique web interactive permet de livrer rapidement le quartier sur la PWA/TWA existante. Le rendu reçoit des entités et des actions ; il ne contient aucune règle économique.

### Étape ultérieure

Si la 3D libre devient prioritaire après validation du gameplay, un client Godot ou Unity pourra consommer les mêmes commandes et projections. Ce choix sera évalué par un ADR séparé avec prototypes de performance Android.

## 11. Observabilité et tests

- Compteurs : durée de tick, retard, commandes rejetées, événements en attente.
- Journal causal consultable par personnage, bâtiment et quartier.
- Tests unitaires des règles pures.
- Tests d'intégration PostgreSQL pour transactions et verrous.
- Tests déterministes : même seed + mêmes commandes = même résultat.
- Tests de rattrapage après arrêt du worker.
- Tests de charge avant activation de plusieurs quartiers.

## 12. Décisions à valider avant le premier code V3

1. Valider le monolithe modulaire avec worker durable.
2. Valider le premier rendu isométrique web avant toute migration vers un moteur 3D natif.
3. Fixer le rapport temps réel / temps simulé et les heures de pause éventuelles.
4. Choisir l'hébergement du worker persistant.
5. Valider les six besoins initiaux et la règle de protection hors ligne.

Après validation, la prochaine modification non destructive est la Phase 0 puis le squelette de Phase 1, accompagnés des migrations et tests correspondants.

