# ADR-001 — Unreal Engine 5 comme client 3D de BTP Life FOUNDATION

**Statut :** accepté
**Date :** 11 octobre 2026

## Contexte

Le client Next.js est adapté au portail, aux comptes et aux tableaux de bord, mais pas à l'objectif d'un simulateur de vie en troisième personne comparable dans sa structure à un jeu de vie urbaine moderne. Le prototype WebGL valide les données et les destinations, mais ne doit pas devenir le moteur principal.

## Décision

Adopter une architecture hybride :

```text
Portail Next.js ----+
                    +---- API NestJS autoritaire ---- PostgreSQL
Client Unreal UE5 --+              |
                             futur serveur monde
```

Unreal gère le rendu, les personnages, l'animation, la caméra, les intérieurs et les interactions. NestJS conserve l'autorité sur l'identité, la progression, les qualifications, les BTL, les propriétés et les résultats. Le multijoueur persistant sera ajouté via un serveur de monde durable ; il ne sera pas simulé par Vercel.

## Conséquences

- La qualité visuelle et la profondeur de gameplay peuvent dépasser les limites du navigateur.
- Une chaîne de compilation Windows/Android et une équipe 3D deviennent nécessaires.
- Les règles économiques ne doivent jamais être dupliquées dans Unreal.
- Le prototype WebGL reste une démonstration web, mais n'est plus l'architecture cible du jeu.

## Prochaines étapes

1. Compiler le projet avec Unreal 5.4.
2. Remplacer les primitives par un kit architectural original inspiré d'Abidjan.
3. Ajouter locomotion, animations, interactions contextuelles et intérieurs.
4. Implémenter l'authentification device-code entre Unreal et NestJS.
5. Déployer un serveur de monde durable avec réplication pour 4 à 8 joueurs.
