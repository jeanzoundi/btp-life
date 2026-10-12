# BTP Life — client Unreal Engine 5

Ce dossier est le nouveau client 3D FOUNDATION. Le frontend Next.js reste le portail web et le backend NestJS reste la source autoritaire pour les comptes, la carrière, les missions, les chantiers et l'économie.

## Prototype inclus

- personnage jouable en troisième personne ;
- caméra libre à la souris ;
- quartier inspiré d'Abidjan généré au démarrage ;
- université, résidence, entreprise, chantier, maquis et banque ;
- interaction par visée avec `E` ;
- trois PNJ suivant une routine visible ;
- sous-système HTTP vers l'API de production BTP Life ;
- aucune dépendance à des assets ou marques de jeux tiers.

## Prérequis

1. Installer Unreal Engine 5.8 avec le composant C++.
2. Installer Visual Studio avec `Desktop development with C++` et `Game development with C++`.
3. Clic droit sur `BtpLife.uproject`, puis `Generate Visual Studio project files`.
4. Compiler la cible `BtpLifeEditor Development Win64`.
5. Ouvrir `BtpLife.uproject` et lancer Play.

## Commandes

- `ZQSD`, `WASD` : déplacement ;
- souris : caméra ;
- `E` : interaction ;
- espace : saut.

## Limites vérifiées

Le quartier utilise temporairement les formes primitives du moteur afin de valider la boucle de jeu avant l'intégration de personnages, animations et bâtiments artistiques.
