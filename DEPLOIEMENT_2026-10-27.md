# Livraison BTP Life — 27 octobre 2026

## Contenu

Publication des six commits après `e410e79` : attestations de la Grande École, équipes de quartier et bonus collectif, accueil guidé, prime de départ, loyer clément, promeneurs, fin de campagne et célébrations. Le style de l'interface est conservé.

Correctifs de préparation : prime d'installation transactionnelle avec reprise sur conflit ; progression, argent, besoins et compétence des séances dans une même transaction ; notifications non bloquantes après validation ; reprise des conflits PostgreSQL pour les équipes et le guide.

## Validation

- Les 383 tests backend passent dans 29 suites ; compilation NestJS réussie.
- Les 22 migrations et le seed complet passent sur PostgreSQL temporaire local, sans utilisation de la base de production.
- Les tests d'intégration vérifient les transactions de campagne, les transports concurrents, la publication additive rejouable, la conservation des 88 cours lus et les nouveaux correctifs d'installation/séance.
- Interface inchangée depuis l'audit : 420 tests réussis sur la première exécution, un dépassement de délai ; le fichier concerné passe ensuite ses trois tests isolément. Vérification TypeScript réussie.
- La compilation locale frontend est bloquée par le DNS de Google Fonts ; le build Vercel doit réussir avant promotion.

## Limites conservées

Le serveur accepte encore les notes calculées par le client pour les séances des lieux. Les gestes du guide restent déclaratifs et une action effectuée avant son chargement peut être manquée. Ces points de l'audit ne sont pas annoncés comme corrigés dans cette livraison. Les parcours BTS/ingénieur distincts et le logement universitaire restent du travail produit.

Unreal n'est pas une application déployable sur Vercel. `game-unreal/` est conservé dans le dépôt ; la copie locale `game-unreal 5.8/`, ignorée par Git, n'est pas incluse dans la livraison web.

## Publication et repli

Déployer depuis le commit validé, serveur puis interface, avec les alias publics contrôlés après publication. Le build serveur applique les migrations. Publier le contenu manquant avec le script additif, sans lancer le seed complet en production.

En cas d'erreur bloquante après publication, revenir aux déploiements précédents : backend `dpl_5tpy62QwXpemZKh23afzjwJwXHBi`, frontend `dpl_CBsqXEBfLNAsG4RNaVm56dbTsTWS`. Les deux migrations ajoutent des tables/champs ; ne pas supprimer les données créées pour revenir au code précédent.
