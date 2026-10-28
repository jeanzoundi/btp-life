# BTP Life — analyse et critique franche (28 octobre 2026)

Analyse faite sur la version en ligne (jeu au commit `ea65f34`, Next 15.5.28) et sur le code. Parcours réel du site public et de
la démonstration, sur ordinateur et en 375 × 812 (téléphone), plus lecture du code serveur et jeu. Aucun compte créé, aucune écriture
en production.

## Verdict

BTP Life a un vrai sujet (une carrière dans le BTP ivoirien), un vrai fond métier et une base technique saine : 428 tests côté jeu,
383 côté serveur, migrations rejouées avant chaque mise en ligne. C'est rare pour un projet de cette taille.

Mais le jeu veut être quatre jeux à la fois : simulateur de carrière, vie de quartier façon Sims, académie, monde multijoueur. Chacun
est à moitié fini, et ils se marchent dessus à l'écran. Cinq problèmes passent avant tout le reste :

1. **L'économie se triche.** Le serveur accepte la note qu'envoie le navigateur après une séance. Envoyer « 100 » rapporte 2 000 F et
   50 XP, toutes les 20 minutes par lieu, sans rien faire.
2. **La boucle de jeu n'est pas lisible.** Guide, fil rouge, planning, défis, missions et besoins proposent chacun un objectif.
   Le joueur ne sait pas ce qui compte.
3. **Le monde « multijoueur » n'est pas partagé.** Chaque joueur a sa propre heure et sa propre vitesse du temps. Deux joueurs au même
   café ne vivent pas la même journée : l'un le trouve ouvert, l'autre fermé. La météo est commune depuis aujourd'hui, l'heure non.
4. **La vitrine promet plus que le jeu.** Tableaux de bord écoles, examens supervisés, campagnes entreprises, « certificats
   vérifiables » : rien de cela n'existe. Le formulaire de contact n'envoie rien. Les mentions légales tiennent en une ligne.
5. **Le rendu reste un prototype.** Personnages et bâtiments simples, sept tenues aux vignettes identiques, aucune personnalisation.
   Sur téléphone, les performances restent à mesurer sur un vrai appareil d'entrée de gamme.

## 1. Bugs constatés

| # | Bug | Où | Gravité |
|---|-----|----|---------|
| 1 | Séances : la note vient du navigateur, le serveur la croit | `carriere.controller.ts:153`, `lieux.service.ts` | Critique |
| 2 | Guide : « Fais quelques pas » ne se validait jamais pour un nouveau joueur ni en démonstration (pas de position de départ) | `quartier-3d.tsx` | Élevée — **corrigé le 28/10, pas encore en ligne** |
| 3 | Guide déclaratif : cinq appels à l'API rapportent 4 500 F et 125 XP, une fois, même au niveau 30 | `premiers-pas.service.ts` (`valider`) | Moyenne |
| 4 | Formulaire de contact factice : « Message bien noté ✔ », rien n'est envoyé, puis renvoi vers une adresse mail | `(public)/contact/page.tsx` | Moyenne |
| 5 | Mentions légales, CGU, confidentialité, cookies : une ligne chacune (« Hébergeur : à préciser ») | contenu en production | Élevée (légal) |
| 6 | Pages Écoles et Entreprises : fonctions annoncées qui n'existent pas | `(public)/ecoles`, `(public)/entreprises` | Moyenne |
| 7 | « Certificats vérifiables » annoncés, aucune page de vérification | pages métiers, tarifs, guide du mentor | Moyenne |
| 8 | Académie publique : catégories brutes affichées (« grande-ecole-batiment », « hse », « general ») | `(public)/academie/page.tsx:43` | Faible |
| 9 | Accueil : compteurs écrits en dur (30 profils annoncés, 46 en base) ; « 0 » dans la page servie avant l'animation (vu par les moteurs de recherche) | `(public)/page.tsx:103` | Faible |
| 10 | Choix du personnage : les sept vignettes montrent le même visage casqué | choix du personnage | Faible |
| 11 | « Café social » dans la ville et le GPS, « Café des Bâtisseurs » à l'intérieur | `lib/liens-modes.ts`, `lib/lieux.ts` | Faible |
| 12 | Démonstration : « Le même personnage t'attend en mode classique » dit à un visiteur sans compte | `quartier-3d.tsx` (validation du personnage) | Faible |
| 13 | Sur écran tactile, raccourcis clavier affichés : « Ranger (T) », aide ZQSD dans Options | téléphone, options | Faible |
| 14 | Le drapeau 🇨🇮 s'affiche « CI » sous Windows | accueil | Faible |
| 15 | Blog vide (« bientôt disponible ») mais lié dans le menu | `(public)/blog` | Faible |
| 16 | Le guide peut manquer un geste fait avant son chargement ; un envoi raté n'est pas rejoué | `premiers-pas.tsx` | Faible |
| 17 | Tests instables quand toute la suite tourne sur une machine chargée : plusieurs tests du jeu dépassent 5 s, et le hachage argon2 réel de l'authentification aussi. Seuls, ils passent | `creation-vie.test.tsx`, `renovation-maison.test.tsx`, `auth.service.spec.ts` | Faible |
| 18 | Alerte de développement « synchronously unmount a root » (affichage HTML de la scène 3D, bibliothèque drei) | développement seulement | Négligeable |
| 19 | Un `package-lock.json` traîne dans `C:\Users\jeanz` : Next devine mal la racine du projet en local | poste de développement | Négligeable |

## 2. Le jeu lui-même

**Ce qui marche.** Le thème est original et local (Plateau, Riviera, gbaka, harmattan). Le contenu pédagogique a du fond : académie,
missions, chantiers avec budget et imprévus. La ville tourne dans un navigateur et sur téléphone. Le fil rouge de la Résidence Akwaba
donne un vrai fil narratif. Les équipes, le chat et les émotes posent une base sociale.

**Ce qui ne marche pas encore.**

- **Trop d'objectifs simultanés.** À l'écran en même temps : la case objectif, le guide, la pastille du fil rouge, les défis, les
  besoins qui baissent, les notifications. Il faut un seul objectif principal visible, les autres rangés dans le téléphone.
- **L'argent sert peu.** Loyer, trajets et repas ne créent pas de vraie tension : on accumule sans arbitrer. Et la triche des séances
  (bug 1) rend tout gain sans valeur.
- **La progression vise trop loin.** Une courbe calibrée jusqu'au niveau 100, quand le contenu s'épuise bien avant. Le fil rouge
  finit au chapitre 9, avec seulement un teaser pour la suite.
- **Cinq portes d'entrée, pas cinq vies.** Étudiant, ouvrier, dessinateur, encadrant et ingénieur commencent différemment, puis
  vivent la même chose. Pas de vrai cursus BTS ou ingénieur, pas de logement étudiant.
- **Le multijoueur est cosmétique.** Une présence relevée toutes les 10 s, un chat, des équipes à +10 % d'XP. Sans heure commune
  (problème 3 du verdict), on partage la carte, pas le monde.
- **Le personnage n'appartient pas au joueur.** Sept tenues, pas de cheveux, de barbe ni de couleurs à choisir. C'est le premier
  attachement d'un joueur, et il manque (travail en cours).

## 3. La technique

**Points forts.** Tests nombreux, transactions sérialisables pour l'argent et l'XP, migrations rejouées sur une base temporaire avant
chaque déploiement, publication du contenu sans écraser la production, déploiements vérifiés et réversibles.

**Points faibles.**

- `quartier-3d.tsx` fait environ 1 450 lignes : HUD, horloge, guide, campagne, chantier, intérieurs, téléphone. Chaque changement y
  devient risqué. Il faut le découper par responsabilité, sans toucher au rendu.
- Les barèmes existent en double, côté jeu (pour la démonstration) et côté serveur : risque d'écart à chaque réglage.
- Une partie de l'état vit dans le navigateur (guide masqué, fin de campagne vue, démonstration) : changer d'appareil la fait oublier.
- Dépendances : côté serveur, des failles élevées dont une partie demande NestJS 11 ; côté jeu, deux failles PostCSS (embarquées par
  Next) qui attendent Next 16.
- Pas de suivi des erreurs en ligne (elles restent dans le navigateur du joueur) ni de mesure d'audience : on ne sait pas qui joue,
  ni où ça casse.
- La présence par relevés sur des fonctions serverless coûtera cher et plafonnera si le nombre de joueurs monte.
- Deux outils commitent dans le même dossier : ça marche grâce à la discipline, mais le risque de collision reste réel.

## 4. Ordre conseillé

1. **Bloquer la triche** : corriger les séances sur le serveur ; limiter le guide au niveau 5 et vérifier ses étapes côté serveur.
2. **Mettre la vitrine en règle** : vraies mentions légales, contact qui envoie vraiment (ou pas de formulaire), retrait ou mention
   « bientôt » des promesses écoles, entreprises et certificats.
3. **Corriger les petits bugs** du tableau (une demi-journée).
4. **Rendre la boucle lisible** : un objectif principal à la fois.
5. **Partager le monde** : une heure commune, ou au moins des horaires de lieux calés sur l'heure réelle.
6. **Personnage et rendu** : personnalisation (en cours), puis un quartier témoin plus abouti.
7. **Mesurer** : suivi des erreurs et mesure d'audience simple ; performances sur un vrai téléphone d'entrée de gamme.
