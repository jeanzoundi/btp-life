# ADR-002 — Le client web reste le client principal ; Unreal devient une piste exploratoire

**Statut :** proposé (à valider) — remplace en partie l'ADR-001
**Date :** 29 octobre 2026

## Contexte

L'ADR-001 (11 octobre 2026) a fait d'Unreal Engine 5 l'architecture cible du jeu et du client WebGL une simple
démonstration. Dix-huit jours plus tard, la réalité est l'inverse :

- **Unreal** : un seul commit (« foundation », 12 octobre), rien depuis. Les dossiers `game-unreal` et
  `game-unreal 5.8` pèsent environ 4,9 Go en local, surtout des fichiers de compilation.
- **Web (Next.js + React Three Fiber)** : tout le jeu y vit et avance chaque jour. Ville 3D, séances chez les mentors
  corrigées par le serveur, fil rouge, journées de chantier, quartier en ligne (présence, chat modéré, équipes),
  personnage sur mesure, démonstration jouable sans compte. Plus de 40 commits côté jeu depuis le 11 octobre.
- **Le public** : des élèves, étudiants et professionnels de Côte d'Ivoire, souvent sur un téléphone Android de gamme
  moyenne, avec des données mobiles chères. Le web ne demande pas d'installation et se met à jour pour tous à chaque
  déploiement. Une partie fonctionne hors ligne, et une coque Android existe déjà (`android-twa`).

Un client Unreal demanderait des téléchargements de plusieurs centaines de Mo, un GPU plus puissant, des builds Windows et
Android, une connexion par code d'appareil, une équipe 3D et un serveur de monde dédié (pas Vercel). Il dupliquerait
aussi l'interface du jeu.

## Décision

1. Le client web est le client principal du jeu pour les prochains mois. Il reçoit les nouvelles fonctions.
2. Unreal devient une piste exploratoire : vitrine, prototype visuel, essais. Ce n'est plus l'architecture cible.
3. Le serveur NestJS reste l'autorité, comme le prévoyait l'ADR-001. Il valide déjà les séances, le fil rouge, le guide
   et les gains à partir des réponses brutes. Un futur client, Unreal ou autre, consommerait la même API sans recopier
   les règles.

## Quand rouvrir la question

Reconsidérer Unreal si au moins deux de ces conditions sont réunies :

- les scènes clés restent sous 30 images par seconde en qualité basse sur un téléphone Android de milieu de gamme
  représentatif, malgré l'optimisation (niveaux de détail, instanciation, textures compressées) ;
- une équipe 3D est financée ;
- le jeu a besoin d'un vrai temps réel multijoueur (plus que des relevés toutes les 10 secondes), donc d'un serveur de
  monde que le web utiliserait aussi ;
- des joueurs demandent une version PC ou console, et cette demande est mesurée.

## Conséquences

- Les efforts 3D vont à la performance du web : réglages de qualité, niveaux de détail, compression des modèles GLB,
  mesures sur de vrais téléphones.
- Les règles du jeu restent dans des modules purs, testés et partagés avec le serveur (barèmes recopiés et vérifiés des
  deux côtés).
- Les dossiers Unreal restent hors des déploiements web. Les archiver hors du dossier de travail libérerait environ
  4,9 Go.
- L'ADR-001 garde sa partie serveur (API autoritaire, pas de règles dans le client). Sa partie client est remplacée par
  celle-ci.
