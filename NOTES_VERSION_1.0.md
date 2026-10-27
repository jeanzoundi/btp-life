# BTP Life — version 1.0 (27 octobre 2026)

Simulateur de carrière dans le BTP en Côte d'Ivoire : de l'étudiant ou de l'ouvrier jusqu'au directeur de travaux ou au promoteur, dans un quartier d'Abidjan en 3D, seul ou en équipe.

## Ce que contient la version 1.0

**Carrière**
- 8 filières et 46 métiers, dont 16 échelons experts au-delà du niveau 20 qu'on n'atteint que par promotion.
- Niveaux de 1 à 100, réputation sur 1 000, promotions à conditions (niveau, réputation, compétences, chantiers, examens).
- Offres d'emploi triées selon le niveau ; une embauche ne fait jamais reculer dans sa filière.
- CV tenu tout seul, badges, et certificats délivrés : attestations de module (académie et Grande École), fin de parcours, maîtrise.

**Formation et chantiers**
- 81 missions de 14 types, 23 modules et 89 cours, 17 compétences.
- 16 chantiers gérés de 3 à 5 phases, et le Grand chantier en 18 journées avec Yao, recrutement et imprévus à choix.

**La ville**
- 5 quartiers et 21 bâtiments visitables ; 11 lieux avec mentor, séances payées et compétences travaillées.
- Une journée dure 24 minutes ; météo, habitants à horaires, voitures, taxis, gbakas et bus à l'échelle des personnages.
- Le fil rouge de la Résidence Akwaba en 9 chapitres, avec le concurrent Serge et un plan de caméra à chaque étape.

**La vie**
- 6 besoins et des humeurs, 8 traits qui comptent, affinité avec les habitants.
- Téléphone (T) : messages, appels, GPS, taxi et gbaka payés, banque, offres, fil rouge, agenda, défis, patrimoine.
- Logement avec loyer, outillage, travaux chez soi (métré, devis, journées de travaux), épargne, entreprise à soi.
- Défis du jour et de la semaine.

**En ligne**
- Les joueurs connectés se voient dans la ville, avec leur personnage et leurs émotes.
- Chat de quartier (C) : messages courts, sans liens ni rafales, nom du personnage plutôt que le nom réel.
- **Nouveau : les équipes de quartier.** On invite un voisin connecté (quatre joueurs au plus) ; les coéquipiers portent un anneau doré, et une séance faite pendant qu'un coéquipier est dans le même lieu rapporte 10 % d'XP de plus.

## Sous le capot
- Serveur NestJS 10 et Prisma 5 sur Supabase ; jeu Next.js 15 en 3D. Deux déploiements Vercel, une base partagée.
- 377 tests côté serveur, 408 côté jeu ; 21 migrations, toutes rejouées avec le seed sur un Postgres éphémère (`npm run test:migrations`).
- Le nouveau contenu se publie en production sans rien écraser : `npx ts-node scripts/publier-contenu-monde.ts --apply`.

## Mise en production de cette version
1. Publier le contenu manquant (les 3 attestations de la Grande École) avec le script de publication.
2. Pousser les commits.
3. Déployer le serveur (son build applique la migration des équipes), puis faire le health-check sur `/api/auth/login`.
4. Déployer le jeu, puis dérouler la recette (`RECETTE_V1_2026-10-27.md`).

## Version 2 (feuille de route)
- Chantiers à plusieurs : 2 à 4 joueurs sur le même Grand chantier, chacun avec un rôle.
- Entreprises de joueurs : recruter d'autres joueurs.
- Offre commerciale : abonnements et comptes entreprise (les tables existent, la mécanique reste à faire).
- Décision sur le client Unreal Engine 5.8, dont la base a été posée le 12 octobre.
