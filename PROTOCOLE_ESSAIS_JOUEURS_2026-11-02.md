# Protocole d'essai par de nouveaux joueurs — 2 novembre 2026

Ce protocole sert à faire essayer BTP Life à des personnes qui ne le connaissent pas, après chaque lot de changements.
Il vérifie ce que les tests automatiques ne peuvent pas dire : un nouveau joueur comprend-il sa première journée, ses
panneaux restent-ils lisibles sur son téléphone, trouve-t-il ce qu'il doit viser ensuite ?

## Ce qu'on veut savoir

1. **Première journée** : le joueur enchaîne-t-il seul logement → première paie → paie vérifiée → prochain objectif ?
2. **Lisibilité** : un panneau cache-t-il une action, sur téléphone comme sur ordinateur ?
3. **Gestes du chantier** : tracer, mesurer, placer, contrôler, corriger sont-ils compris et maniables au doigt ?
4. **Carrière** : le joueur trouve-t-il son parcours, son cursus (étudiant) et ses objectifs durables ?
5. **Quartier** : la ville paraît-elle vivante (habitants qui arrivent, déjeunent, saluent) et lisible (pluie, nuit) ?

## Les testeurs

Cinq à huit personnes, jamais les mêmes d'un lot à l'autre :

| Profil | Nombre | Appareil |
|---|---|---|
| Étudiant BTS ou école d'ingénieurs | 2 | téléphone Android milieu de gamme |
| Ouvrier ou technicien du bâtiment | 2 | téléphone |
| Encadrant de chantier | 1 | ordinateur portable |
| Personne hors BTP | 1 à 2 | téléphone ou ordinateur |

Noter pour chacun : modèle du téléphone, navigateur, connexion (Wi-Fi ou données mobiles).

## Préparation

- Une version publiée et vérifiée (adresse notée dans le compte rendu), ou la démonstration `/simulation-preview`.
- Des comptes de test neufs, créés par le testeur lui-même : aucun mot de passe dans ce document ni dans les comptes rendus.
- L'accord du testeur pour être observé ; l'enregistrement de l'écran est facultatif.
- Une montre ou un chronomètre, et la grille d'observation ci-dessous.

## Déroulé (45 minutes)

Consigne unique donnée au départ : « Tu arrives dans le quartier. Joue comme tu le sens, dis à voix haute ce que tu
penses. » Ne pas aider tant que le testeur ne bloque pas plus de deux minutes ; noter chaque aide donnée.

| Temps | Ce que le testeur fait | Ce qu'on observe |
|---|---|---|
| 0–5 min | Crée son personnage, choisit son poste (un étudiant choisit BTS ou ingénieur) | Comprend-il la prime et le logement annoncés ? |
| 5–20 min | Suit la première journée : rentre chez lui, gagne sa première paie (journée avec Yao ou séance), la vérifie dans la Banque, ouvre Carrière | Temps de chaque étape, hésitations, retours en arrière |
| 20–30 min | Joue une journée de chantier jusqu'au bilan, dont le geste du jour | Comprend-il le geste ? Le réussit-il au premier essai ? |
| 30–40 min | Ouvre chat, téléphone, plan, options et planning, l'un après l'autre ; parle à un habitant | Un panneau en cache-t-il un autre ? Retrouve-t-il les boutons ? |
| 40–45 min | Questions de fin | — |

## Grille d'observation

| Étape | Réussie seul ? | Temps | Aide donnée | Remarques |
|---|---|---|---|---|
| Logement trouvé et visité | | | | |
| Première paie gagnée | | | | |
| Paie vérifiée (Banque) | | | | |
| Objectifs trouvés (Carrière) | | | | |
| Geste du chantier réussi | | | | |
| Panneaux sans gêne sur téléphone | | | | |
| Habitant salué ou interrogé | | | | |

## Questions de fin

Notes de 1 (pas du tout) à 5 (tout à fait) :

1. J'ai compris quoi faire pendant ma première journée.
2. Les panneaux étaient lisibles et ne se gênaient pas.
3. Les gestes du chantier étaient agréables à faire.
4. Je sais ce que je dois viser ensuite.
5. La ville me donne envie de revenir.

Questions ouvertes : qu'est-ce qui t'a perdu ? Qu'est-ce qui t'a plu ? Que voudrais-tu faire ensuite dans le jeu ?

## Mesures sur les téléphones ciblés

- **Temps de chargement** jusqu'au HUD, chronométré sur le téléphone du testeur.
- **Fluidité** : Options → statistiques de rendu (images par seconde) au centre du quartier, de jour, puis sous la pluie.
- **Chauffe et batterie** après 30 minutes : noter le pourcentage de départ et d'arrivée.
- Sur ordinateur, `node scripts/captures-monde.mjs` (dossier `frontend`, démonstration lancée) relève pour six points de
  vue fixes le temps jusqu'au quartier affiché, les appels de dessin et les triangles par image : à comparer d'un lot à
  l'autre. Pour des temps de chargement comparables, servir la version de production (`npm run build` puis
  `npm run start`) et ne rien lancer d'autre pendant les captures. Les images par seconde de ce script ne valent que s'il
  tourne avec une carte graphique (le moteur est noté dans `mesures.json`). Le relevé compte aussi les programmes de
  shaders et le temps bloqué à les compiler : le pilote graphique les garde en cache d'un passage à l'autre, donc le
  premier passage d'une série est toujours le plus lent ; comparer deux versions à rang de passage égal.

## Comparer les changements visuels

Avant et après un lot, lancer `node scripts/captures-monde.mjs` depuis `frontend` avec la démonstration en marche : les
mêmes six vues (place de jour, résidence et maquis, chantier, carrefour, place sous la pluie, place la nuit) sont
capturées au même endroit, à la même heure et sous le même ciel. Les comparer côte à côte dans le compte rendu.

## Critères de réussite d'un lot

- Au moins quatre testeurs sur cinq finissent la première journée seuls, en moins de quinze minutes.
- Aucun panneau ne cache une action dont le testeur a besoin, sur téléphone.
- Au moins trois testeurs sur cinq réussissent le geste du chantier au premier ou au deuxième essai.
- Au moins 30 images par seconde au centre du quartier sur le téléphone milieu de gamme, de jour.
- Moyenne d'au moins 4 sur 5 aux questions 1 et 2.

## Compte rendu

Un fichier par session d'essai (`ESSAIS_JOUEURS_<date>.md`) : testeurs (profil et appareil, sans nom), grilles
remplies, notes, mesures, captures avant/après, puis trois à cinq corrections prioritaires.
