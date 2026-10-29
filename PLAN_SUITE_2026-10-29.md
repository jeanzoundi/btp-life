# BTP Life — plans pour la suite (29 octobre 2026)

Trois chantiers trop lourds ou trop structurants pour être tranchés seul dans la série de réglages du 29 octobre :
l'heure commune du quartier en ligne, les cursus BTS et ingénieur, et les montées de version majeures. Le choix du
client principal (web ou Unreal) est traité à part dans `ADR-002-CLIENT-WEB-PRINCIPAL.md`.

## 1. Une heure commune pour le quartier en ligne

### Le problème

Chaque joueur a sa propre horloge : pause, vitesse ×1 à ×3, « dormir jusqu'au matin », « attendre l'ouverture »,
trajets qui font passer le temps. Deux joueurs au même café ne vivent donc pas la même journée : l'un le trouve ouvert,
l'autre fermé. La météo, elle, est commune depuis le 28 octobre (calculée sur l'heure réelle).

### Les options

| Option | Ce qui change | Ce qu'on perd |
|---|---|---|
| A. Heure commune pour tous, calée sur l'heure réelle d'Abidjan et accélérée (une journée de jeu toutes les 2 h réelles) | Tout le monde vit la même heure ; lieux, rendez-vous et événements de quartier communs. | Pause, vitesse ×2/×3, sommeil et attente qui font sauter l'horloge. Attendre l'ouverture d'un lieu peut prendre près d'une heure réelle. |
| B. Seuls les horaires des lieux suivent l'heure réelle | Mêmes lieux ouverts pour tous. | L'heure affichée et les lieux se contredisent (22 h à l'écran, café ouvert). À écarter. |
| C. Mixte : heure commune dans le quartier en ligne, horloge personnelle en solo (démonstration et mode hors ligne) | Le monde partagé devient cohérent, le jeu solo garde son rythme. | Il faut repenser le sommeil et l'attente en ligne : le sommeil restaure les besoins sans faire sauter l'heure, et l'attente propose un autre lieu ouvert. |
| D. Garder l'horloge personnelle et retirer les contradictions visibles | Rejoindre un coéquipier dans un lieu même s'il est fermé à son heure ; montrer l'heure de chaque voisin dans le chat. | Le monde reste « chacun sa journée ». |

### Recommandation

Commencer par **D**, en quelques jours : c'est sans risque et cela retire l'essentiel des frictions. Préparer ensuite
**C** si le quartier en ligne prend de l'importance (événements, chantiers à plusieurs). **A** change trop la boucle
de jeu actuelle, construite sur le temps personnel.

**Décision attendue** : D seul, D puis C, ou A. Elle change le cœur du jeu et revient à l'équipe produit.

## 2. Les cursus BTS et ingénieur

### Ce qui existe

Les portes d'entrée « étudiant » (étudiant BTP, BIM, métré, qualité/HSE, stagiaires) et l'Académie (modules et cours).
L'université dans la ville, les séances chez les mentors (laboratoire, bureau d'études, atelier…), les promotions, les
certificats, et désormais la chambre en cité universitaire et une prime d'installation selon le poste.
`FORMATIONS_DEPART = ['BTS', 'ingenieur']` est déclaré dans `frontend/src/lib/profils-depart.ts`, sans suite.

Ce qui manque : un vrai parcours d'études, avec des semestres, des examens, un stage et un diplôme qui ouvre des postes.

### Le principe

- Un **cursus** est une suite de semestres. Le BTS Bâtiment compte 4 semestres ; le cycle ingénieur 6 semestres
  (2 de classe préparatoire, puis 4 en école), accessible après le BTS ou directement.
- Un **semestre** demande des modules de l'Académie, des séances réussies dans des lieux précis (université,
  laboratoire, bureau d'études) et un **examen**. L'examen est corrigé par le serveur à partir des réponses brutes,
  comme le fil rouge et les séances.
- Le **stage** de fin de cursus passe par les offres d'emploi (type stage), dans un lieu de la ville.
- Le **diplôme** est un certificat. Il ouvre directement des postes : BTS → technicien (niveau 4) ; ingénieur →
  ingénieur débutant (niveau 7), au lieu de les gagner par promotion seulement.
- L'**économie** de l'étudiant : frais d'inscription (public modeste, privé plus cher), bourse mensuelle versée
  paresseusement à la lecture comme l'épargne, petit job (dépôt, logistique) pour payer la chambre.

### Les données

Trois modèles :

- `Cursus` : slug, nom, nombre de semestres, conditions d'entrée.
- `SemestreCursus` : ordre, modules requis, séances requises, examen.
- `UserCursus` : semestre en cours, notes, statut, date d'obtention.

Une migration écrite à la main, le contenu dans `prisma/seed-data/cursus-data.ts`, publié en production par
`publier-contenu-monde.ts`. Les gains passent par `progression.appliquerDelta` dans une transaction sérialisable.

### Les étapes

1. BTS Bâtiment : 4 semestres, à partir des modules et séances existants. Examen corrigé par le serveur. Vue « Mon
   cursus » dans le téléphone et à l'université.
2. Stage et diplôme, reliés aux offres d'emploi et aux règles de promotion.
3. Cycle ingénieur : classe préparatoire, puis école.
4. Validation des acquis de l'expérience, pour qu'un ouvrier expérimenté obtienne un BTS.

## 3. Montées de version majeures

### État au 29 octobre

- **Serveur (NestJS 10)** : plus de faille haute. body-parser, qs, multer, lodash et uuid sont imposés en versions
  corrigées (`overrides` dans `backend/package.json`). Restent deux failles modérées hors de portée : les SSE de
  `@nestjs/core`, que le serveur n'utilise pas, et `file-type`, que seul `FileTypeValidator` charge (inutilisé).
- **Jeu (Next 15.5.28, dernière 15.x)** : il reste postcss, embarqué par Next 15. La faille concerne la compilation de
  feuilles de style ou de cartes de sources venues d'un tiers ; notre CSS est entièrement maison. Next 16 la corrige.

### Ce qu'il faut avant de monter de version

1. Des **tests HTTP de bout en bout** (supertest) sur les routes principales : connexion, carrière, séance, chat,
   administration. Les tests unitaires actuels simulent Prisma et n'exercent pas la couche HTTP.
2. Un **environnement de recette** : déploiement Vercel de prévisualisation et base Supabase séparée. Le backend local
   pointe sur la production, donc les parcours connectés ne s'y testent pas.
3. NestJS 10 → 11 (Express 5 : syntaxe des routes génériques, analyse des paramètres d'URL, Node 20 minimum), puis
   → 12 en lisant ses notes de version.
4. Next 15 → 16 : Turbopack par défaut, `middleware` renommé `proxy`, `next lint` retiré, cache revu. À compiler sur une
   machine plus rapide ou en intégration continue : la compilation locale est très lente (15 min pour la première page
   en développement).
