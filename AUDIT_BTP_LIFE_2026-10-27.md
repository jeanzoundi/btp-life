# Analyse du dossier BTP Life — 27 octobre 2026

> Mise à jour après demande de déploiement : la double prime et le paiement partiel des séances décrits ci-dessous ont été corrigés. Le test PostgreSQL `backend/scripts/test-installation-transactions.ts` confirme la prime unique sous concurrence et l'annulation complète après échec du paiement. Les conflits des équipes/du guide sont retentés et les notifications ne font plus échouer les validations déjà enregistrées. Les constats suivants conservent l'état de l'audit initial ; la correction serveur des exercices, la validation des gestes du guide et ses événements sur réseau lent restent à traiter.

## Verdict

Le jeu web dispose d'une base substantielle : création de personnage, cinq portes d'entrée professionnelles, carrière, missions, besoins, patrimoine, campagne et présence sociale. Les nouveaux ajouts améliorent l'accueil et les interactions. Cependant, des défauts de récompenses restent reproductibles et les cinq profils ne constituent pas encore cinq vies avec des chronologies complètes. La partie Unreal est un prototype distinct, pas le client complet du jeu web.

Audit du code local au commit `cfe6e16`. Aucune modification du code applicatif, aucun déploiement et aucune écriture dans la base de production pendant cet audit. Les reproductions utilisent des dépendances simulées, pas PostgreSQL.

## État des versions

- `main` est en avance de six commits sur la référence locale `origin/main`, à `e410e79`. Pas de rafraîchissement du distant pendant cet audit.
- Depuis cette référence : 44 fichiers modifiés, 1 545 insertions, 64 suppressions. Ajouts : attestations académie, équipes de quatre, bonus collectif de 10 % d'XP, premiers pas guidés, prime de 25 000 F, loyer plus clément, promeneurs et célébrations.
- Deux migrations nouvelles : `20261027100000_equipes_quartier` et `20261027110000_premiers_pas`. Le dossier contient maintenant 22 migrations.
- Inspection Vercel du 27 octobre : backend `dpl_5tpy62QwXpemZKh23afzjwJwXHBi`, frontend `dpl_CBsqXEBfLNAsG4RNaVm56dbTsTWS`, tous deux Ready et créés le 26 octobre. Ce sont les déploiements de la livraison précédente ; les six nouveaux commits locaux ne sont pas publiés par ces déploiements.

## Constats prioritaires

### P1 — La prime d'installation peut être payée deux fois

`backend/src/carriere/carriere.service.ts:123` lit `profilActuelId`, puis les lignes 132–140 effectuent une mise à jour indépendante. Deux premiers choix simultanés lisent tous deux un profil vide et ajoutent chacun 25 000 F. La sonde locale reproduit un versement de 50 000 F.

Correction : rendre le premier choix et son versement atomiques, avec une condition persistée de premier versement et une gestion des conflits. Un bouton désactivé dans le navigateur ne protège pas l'API.

### P1 — Les séances acceptent une note fournie par le joueur

`backend/src/carriere/carriere.controller.ts:153` transmet directement `dto.note` à `LieuxService.seance`. Le DTO borne la note entre 0 et 100 mais le serveur ne corrige pas les réponses. `backend/src/carriere/lieux.service.ts:85` utilise cette note pour calculer les gains ; une note de 100 donne une base de 2 000 F lors d'une séance payée. Connaître le lieu et l'étape attendue suffit à demander les gains sans résoudre l'exercice.

Correction : envoyer les réponses à un exercice identifié et corriger côté serveur, avec version du contenu et tentative unique. Le délai de 20 minutes par lieu limite les versements mais ne garantit pas la réussite pédagogique. Défaut préexistant, toujours présent dans le code actuel.

### P2 — Une séance peut avancer sans payer le joueur

`backend/src/carriere/lieux.service.ts:103` enregistre la progression et la date de récompense dans une transaction, terminée ligne 105. Le versement intervient ensuite ligne 110, puis la consommation des besoins et les compétences séparément. Si le versement échoue, l'étape reste acquise et le délai de récompense a déjà commencé.

Sonde locale : après une erreur injectée dans le paiement, l'étape passe de 0 à 1 et `derniereRecompenseLe` est renseignée. Correction : réunir progression, argent et effets persistants dans la même transaction ; isoler les notifications après validation.

### P2 — Les premiers pas sont déclaratifs, y compris la séance réussie

`backend/src/monde/premiers-pas.service.ts:43` contrôle uniquement que le nom d'étape existe et n'a pas déjà été récompensé. Il ne vérifie pas que le joueur a accompli l'action. Cinq appels avec les noms connus rapportent 4 500 F et 125 XP, une fois par compte. La sonde confirme aussi ce versement au niveau 30, alors que le guide ne s'affiche plus au-delà du niveau 5.

L'absence de limite de niveau peut être un choix produit : la limite actuelle ne concerne que l'affichage. En revanche, la validation d'une séance devrait provenir du serveur qui l'a corrigée. Décider explicitement quelles étapes purement visuelles peuvent rester déclaratives.

### P2 — Le guide peut manquer une action sur connexion lente

`frontend/src/components/app/premiers-pas.tsx:30` abandonne la validation tant que la première lecture serveur n'est pas terminée. Les effets de `quartier-3d.tsx:706` à 709 dépendent de l'ouverture du téléphone, de l'intérieur, du résultat de séance ou de l'émote, pas de la disponibilité du guide. Ouvrir le téléphone avant la réponse puis le laisser ouvert ne revalide pas l'action après chargement. Les erreurs POST sont également absorbées sans file de reprise.

Correction : conserver les actions observées et les rejouer après chargement ou reconnexion. Sérialiser les validations, gérer les conflits `P2034` et rafraîchir l'état après erreur. Les transactions du guide et des équipes sont sérialisables mais n'ont pas de nouvelle tentative explicite dans ces services. Ce constat vient de la lecture du code ; aucun test navigateur avec réseau ralenti n'a été exécuté.

## Correspondance avec la vision du jeu

| Attente | État constaté | Travail restant |
|---|---|---|
| Présenter mode normal et monde vivant | Écran de création et présentation existants | Recette complète avec un nouveau compte |
| Choisir personnage, taille, silhouette | Choix enregistrés dans la configuration d'avatar | Vérification visuelle actuelle sur ordinateur et mobile |
| Cinq profils BTP | Étudiant, ouvrier, dessinateur-projeteur, encadrant, ingénieur d'études dans `frontend/src/lib/profils-depart.ts` | Objectifs, rythme et contraintes propres à chaque profil |
| BTS ou ingénieur | `formationDepart` enregistré dans la configuration d'avatar, relu dans l'écran de création | Aucun usage métier trouvé côté serveur hors tests : cursus, examens, stages et diplômes distincts à implémenter |
| Logement étudiant | Catalogue serveur : studio, F2, villa | Cité universitaire et attribution selon le profil absentes du catalogue actuel |
| Argent de départ | Prime commune de 25 000 F | Paiement unique fiable et éventuel équilibrage par profil |
| Vie sociale | Présence, chat, émotes, équipes et bonus de proximité | La présence interrogée toutes les dix secondes n'est pas une simulation physique multijoueur continue |

Les filières, métiers, missions et compétences existants sont réutilisables. La prochaine étape produit consiste à relier ces systèmes en parcours vécus : cours → exercices → stage rémunéré → diplôme → emploi pour l'étudiant ; commandes → travail → rémunération → responsabilité pour les professionnels.

## Structure et ambition visuelle

- `frontend/` : véritable client web jouable, Next.js/React/Three.js. `quartier-3d.tsx` atteint 1 439 lignes : il concentre orchestration du monde, HUD et plusieurs systèmes. Extraire progressivement les responsabilités, sans réécrire le rendu ni changer le style.
- `backend/` : monolithe modulaire NestJS/Prisma. La centralisation de la progression est utile ; elle doit être appliquée systématiquement dans les transactions des récompenses.
- Les barèmes de démonstration sont recopiés côté navigateur. Une modification doit être validée des deux côtés pour éviter des écarts avec le jeu connecté.
- `game-unreal/` et `game-unreal 5.8/` : bases C++ proches, avec quatre fichiers Source différents. Les personnages utilisent cylindres/capsules et les bâtiments des cubes. Aucun fichier d'asset trouvé dans `game-unreal/Content` ; aucun dossier Content présent dans la seconde copie au moment du contrôle.
- Le sous-système API Unreal inspecté ne fait que lire le catalogue public. Il ne reproduit pas la boucle complète de progression du client web.
- `.gitignore` exclut tout `game-unreal 5.8/` : les différences de cette copie ne seront pas incluses dans un push normal. Ne pas supprimer ce dossier ; choisir ensuite quelle version devient la référence à sauvegarder.
- L'ADR annonce Unreal comme client principal, tandis que les notes V1 présentent encore cette décision comme future. Clarifier cette direction avant d'étendre les deux clients.

Le code actuel ne démontre pas un résultat visuel du niveau visé dans les échanges sur GTA. Changer de moteur ne fournit pas les personnages, animations, rues et intérieurs détaillés. Pour évaluer cette ambition, il faut un quartier témoin visuellement abouti et mesuré, puis décider de son extension. Aucune nouvelle inspection visuelle n'a été réalisée pendant cet audit.

## Vérifications effectuées

| Contrôle | Résultat du 27 octobre |
|---|---|
| Génération Prisma | Réussie |
| Tests backend | 381 réussis, 29 suites ; avertissement Jest sur une opération asynchrone restant ouverte |
| Compilation backend | Réussie |
| Tests frontend complets | 420 réussis, 1 dépassement du délai de 5 s, 78 fichiers |
| Relance isolée du fichier de création | 3/3 réussis, sans changement de code ni augmentation du délai ; dépassement initial compatible avec la charge, non reproduit isolément |
| Sondes des récompenses | Trois défauts reproduits avec dépendances simulées : double prime, guide déclaratif, séance persistée sans paiement |
| Compilation frontend | Bloquée par la résolution DNS des polices Google, y compris après relance hors sandbox ; ne pas annoncer le build validé |
| Vérification TypeScript frontend | `npx tsc --noEmit --incremental false` réussit, sans erreur |
| Migrations PostgreSQL | Deux nouvelles migrations lues, non exécutées pendant cet audit |
| Recette humaine | `RECETTE_V1_2026-10-27.md` reste à cocher ; compte neuf, deux joueurs, réseau lent et Android non validés ici |

Sonde reproductible : depuis la racine, `node .tmp-tests/audit-20261027.cjs`. Journal de compilation : `.tmp-tests/audit-20261027-frontend-build.log`. Ces fichiers de travail sont ignorés par Git.

## Ordre conseillé

1. Corriger les récompenses : prime unique, correction des séances sur serveur, atomicité des gains.
2. Fiabiliser le guide et les opérations concurrentes des équipes ; tester les cas d'erreur et de reconnexion.
3. Valider compilation, 22 migrations sur base temporaire et recette à deux comptes avant la publication des six commits.
4. Terminer un parcours étudiant BTS de bout en bout, puis décliner ingénieur et quatre profils professionnels avec leur quotidien.
5. Réaliser un quartier témoin pour les personnages et la ville, en conservant le style actuel et en fixant une seule direction de client principal.
