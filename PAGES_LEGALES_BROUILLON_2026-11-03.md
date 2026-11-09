# Pages légales — brouillon du 3 novembre 2026

Ce brouillon remplace les quatre pages d'une ligne du site : mentions légales, CGU, confidentialité et cookies. L'avertissement pédagogique, lui, est déjà complet.

Chaque texte est écrit dans la mise en forme des Pages CMS (`## ` pour un intertitre, `- ` pour une liste, une ligne vide entre deux paragraphes). Il se colle tel quel dans l'administration, champ « texte » de la page. Les passages `[À COMPLÉTER : …]` attendent des informations que je n'ai pas ; les passages `[À VALIDER : …]` sont des propositions à confirmer. **Rien n'est publié.**

Ce n'est pas un avis juridique : à faire relire, de préférence par un juriste qui connaît le droit ivoirien.

## Ce qu'il me faut

- **Éditeur** : personne physique ou société ; nom ou raison sociale ; forme juridique et capital pour une société ; numéro RCCM ; adresse ; téléphone.
- **Directeur de la publication** : son nom.
- **Adresse de contact** : le site affiche contact@btplife.com. Elle doit exister et être lue, car les demandes sur les données y arriveront.
- **ARTCI** : la formalité pour le traitement des données personnelles est-elle faite, en cours ou à faire ?
- **Hébergement de la base** : la région du projet Supabase, visible dans son tableau de bord.
- **Nom de domaine définitif**, s'il doit remplacer btp-life-frontend.vercel.app.

## Points à trancher

- **Durées de conservation** : le jeu n'efface aujourd'hui ni les messages du chat, ni les rapports d'erreur, ni les comptes inactifs. Le brouillon propose 12 mois pour le chat et les erreurs, et 3 ans d'inactivité pour un compte. Il faudra ensuite programmer ces suppressions.
- **Âge minimum** : le brouillon propose 13 ans, avec l'accord d'un parent ou tuteur avant 18 ans. L'inscription ne demande pas l'âge aujourd'hui.
- **Suppression du compte** : un bouton « Supprimer mon compte » arrive dans Profil et paramètres (écrit, pas encore en ligne). Les textes ci-dessous en parlent : à publier après sa mise en ligne. Les comptes d'administration et ceux qui gèrent un compte École ou Entreprise passent toujours par l'éditeur.

## Ce que le brouillon décrit, vérifié dans le code

- **Données** : compte (adresse électronique, nom, pseudo, pays, ville, niveau d'études, domaine du BTP) ; mot de passe gardé sous forme d'empreinte argon2 ; personnage et progression ; chat, signalements, équipes ; dernière position dans le quartier, relevée toutes les 10 secondes ; abonnement aux notifications ; rapports d'erreur sans lien avec le compte.
- **Ce que voient les autres joueurs** : le nom du personnage ou le pseudo, jamais le nom réel du compte.
- **Services tiers** : Vercel (application) et Supabase (base de données) ; le service de notification du navigateur pour les notifications. Aucune publicité, aucune mesure d'audience, aucun traceur tiers.
- **Navigateur** : aucun cookie ; le stockage local garde la session, les préférences, la démonstration, une copie hors ligne et les erreurs en attente.
- **Ressources graphiques** : textures et ciel de Poly Haven (CC0) ; personnages de Microsoft Rocketbox (licence MIT).

---

## Mentions légales (`mentions-legales`)

```
## Éditeur
BTP Life est édité par [À COMPLÉTER : nom ou raison sociale], [À COMPLÉTER : forme juridique et capital, ou « entrepreneur individuel »], immatriculé au RCCM sous le numéro [À COMPLÉTER], dont le siège est situé [À COMPLÉTER : adresse], Côte d'Ivoire.

Téléphone : [À COMPLÉTER]. Courriel : contact@btplife.com.

Directeur de la publication : [À COMPLÉTER : nom].

## Hébergement
Le site et l'application sont hébergés par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).

La base de données est hébergée par Supabase Inc. (supabase.com), sur des serveurs situés [À COMPLÉTER : région d'hébergement].

## Propriété intellectuelle
Les textes, scénarios, exercices, illustrations et le code de BTP Life appartiennent à l'éditeur. Toute reproduction ou réutilisation sans son autorisation est interdite, sauf usage personnel et pédagogique non commercial.

Certaines ressources viennent de bibliothèques libres : les textures et le ciel de Poly Haven (licence CC0) et les personnages de Microsoft Rocketbox (licence MIT).

## Contenus pédagogiques
BTP Life est un simulateur pédagogique. Ses contenus techniques ne remplacent ni les normes officielles, ni les bureaux d'études, ni les professionnels habilités : voir l'avertissement pédagogique.

## Contact
Pour toute question : contact@btplife.com.
```

## Conditions générales d'utilisation (`cgu`)

```
## Objet
Ces conditions encadrent l'utilisation de BTP Life, simulateur de carrière dans le bâtiment et les travaux publics, accessible sur [À COMPLÉTER : nom de domaine]. Créer un compte ou jouer, c'est les accepter.

## Ton compte
- L'inscription est gratuite. Elle demande une adresse électronique valide, un nom et un mot de passe.
- Tu gardes ton mot de passe pour toi : tu es responsable de ce qui se fait avec ton compte.
- Ton compte est personnel : il ne se prête pas et ne se vend pas.
- Il faut avoir au moins 13 ans pour créer un compte, et l'accord d'un parent ou tuteur avant 18 ans. [À VALIDER]
- La démonstration se joue sans compte : sa progression reste dans ton navigateur.

## Argent et récompenses du jeu
Les francs CFA, l'expérience, la réputation, les objets, les entreprises et les certificats gagnés dans BTP Life sont virtuels. Ils n'ont aucune valeur en argent réel, ne s'échangent pas et ne valent ni diplôme ni qualification professionnelle.

## Offres
BTP Life est gratuit aujourd'hui. Des offres payantes (Premium, Écoles, Entreprises) pourront être proposées : leurs prix et leurs conditions seront présentés avant toute souscription, et ces conditions seront complétées.

## Règles de conduite
Dans le chat du quartier, dans les équipes et partout dans le jeu, il est interdit :
- d'insulter, de harceler, de menacer ou de discriminer d'autres joueurs ;
- de publier des contenus illicites, violents, sexuels ou haineux ;
- de diffuser des informations personnelles (numéro de téléphone, adresse…), les tiennes comme celles des autres ;
- d'envoyer du spam ou de la publicité ;
- de tricher, d'exploiter une faille ou de perturber le service.

Chaque joueur peut signaler un message. L'équipe de BTP Life peut masquer un message, et suspendre ou fermer un compte qui ne respecte pas ces règles.

## Contenus pédagogiques
Les cours, exercices et scénarios servent à apprendre. Ils ne remplacent pas les normes officielles, les bureaux d'études, les ingénieurs habilités, les laboratoires agréés ni les obligations réglementaires du pays concerné.

## Disponibilité
L'éditeur fait son possible pour que BTP Life fonctionne sans interruption, sans pouvoir le garantir : des coupures peuvent arriver pour maintenance ou pour des raisons techniques. Le contenu du jeu évolue.

## Responsabilité
L'éditeur n'est pas responsable de l'usage des contenus pédagogiques en dehors du jeu, ni des conséquences d'une interruption du service ou d'une mauvaise utilisation de ton compte.

## Données personnelles
Ce que BTP Life fait de tes données est décrit dans la politique de confidentialité.

## Fin du compte
Tu peux supprimer ton compte à tout moment, dans Profil et paramètres, avec ton mot de passe. C'est définitif : ton personnage, ta progression et tes messages disparaissent. Si tu ne peux pas le faire toi-même, écris à contact@btplife.com. L'éditeur peut suspendre ou supprimer un compte qui ne respecte pas ces conditions.

## Modifications
Ces conditions peuvent évoluer. La date de mise à jour est indiquée en bas de page ; en cas de changement important, les joueurs sont prévenus dans le jeu.

## Droit applicable
Ces conditions sont soumises au droit ivoirien. À défaut d'accord amiable, les tribunaux d'Abidjan sont compétents. [À VALIDER]

Dernière mise à jour : [À COMPLÉTER : date de publication].
```

## Politique de confidentialité (`confidentialite`)

```
## Qui est responsable
[À COMPLÉTER : nom ou raison sociale de l'éditeur], [À COMPLÉTER : adresse], est responsable des données traitées par BTP Life. Contact : contact@btplife.com.

## Les données collectées
- Ton compte : adresse électronique, nom, pseudo et, si tu les renseignes, pays, ville, niveau d'études et domaine du BTP. Ton mot de passe n'est jamais gardé en clair : seule une empreinte chiffrée (argon2) est conservée.
- Ton personnage et ta progression : apparence, niveau, expérience, argent et réputation virtuels, missions, cours, chapitres, séances, logement, entreprise virtuelle, CV virtuel et certificats.
- La vie du quartier : tes messages dans le chat, tes signalements, tes équipes et invitations. Quand tu joues connecté, ta position dans le quartier virtuel (relevée toutes les 10 secondes) et tes émotes.
- Les notifications : si tu les acceptes, l'adresse d'abonnement que fournit ton navigateur.
- Les rapports d'erreur : quand le jeu plante, le message d'erreur, la page concernée, le navigateur et la version du jeu, sans lien avec ton compte.

BTP Life n'utilise ni publicité, ni mesure d'audience, ni traceur tiers.

## Pourquoi
- Faire fonctionner ton compte et sauvegarder ta progression.
- Montrer les joueurs en ligne, faire vivre le chat et les équipes.
- Modérer les échanges et protéger les joueurs.
- T'envoyer les notifications que tu as acceptées.
- Corriger les erreurs et améliorer le jeu.

Ces traitements servent à fournir le service que tu demandes en créant un compte. Les notifications reposent sur ton accord ; la modération et les rapports d'erreur, sur l'intérêt de BTP Life à garder un service sûr et fiable.

## Qui voit tes données
- Les autres joueurs voient le nom de ton personnage ou ton pseudo (jamais ton nom réel), ton personnage, tes messages du chat et ta présence dans le quartier.
- L'équipe de BTP Life y accède pour le support et la modération.
- Elles sont hébergées par des prestataires techniques : Vercel pour l'application (États-Unis [À VALIDER : aucune région n'est fixée dans le projet, donc celle par défaut de Vercel ; à confirmer dans ses réglages]) et Supabase pour la base de données ([À COMPLÉTER : région]). Les notifications passent par le service de ton navigateur (Google, Mozilla ou Apple selon le navigateur).

Tes données ne sont ni vendues ni louées.

## Hors de Côte d'Ivoire
Ces prestataires stockent les données hors de Côte d'Ivoire. [À COMPLÉTER : référence de la déclaration ou de l'autorisation de l'ARTCI.]

## Combien de temps
- Ton compte et ta progression : tant que ton compte existe. Un compte inactif depuis [À VALIDER : 3 ans] est supprimé, après un avertissement.
- Tes messages du chat : [À VALIDER : 12 mois].
- Ta position dans le quartier : seule la dernière est gardée, remplacée à chaque relevé.
- Les rapports d'erreur : [À VALIDER : 12 mois].

## Tes droits
La loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel te permet d'accéder à tes données, de les faire corriger ou supprimer, et de t'opposer à leur traitement pour un motif légitime.

Tu corriges ton profil et tu supprimes ton compte toi-même, dans Profil et paramètres ; la suppression efface aussi la copie gardée dans ton navigateur. Pour le reste, écris à contact@btplife.com : tu auras une réponse sous un mois. [À VALIDER]

Tu peux aussi t'adresser à l'Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI).

Les notifications se coupent à tout moment dans les réglages de ton navigateur.

## Mineurs
BTP Life s'adresse notamment aux élèves et aux étudiants. Avant 18 ans, il faut l'accord d'un parent ou tuteur pour créer un compte. [À VALIDER]

## Sécurité
Les échanges sont chiffrés (HTTPS), les mots de passe protégés par argon2, et l'administration réservée aux comptes habilités.

Dernière mise à jour : [À COMPLÉTER : date de publication].
```

## Cookies (`cookies`)

```
## Aucun cookie publicitaire
BTP Life ne dépose aucun cookie, ni publicitaire ni de mesure d'audience, et n'utilise aucun traceur tiers.

## Ce que le jeu garde dans ton navigateur
Pour fonctionner, le jeu enregistre quelques informations dans le stockage local de ton navigateur, un mécanisme proche des cookies :
- ta session de connexion, pour ne pas te redemander ton mot de passe à chaque visite ;
- tes préférences : qualité graphique, messages masqués dans le chat ;
- en démonstration, ton personnage et ta progression, qui ne quittent pas ton navigateur ;
- une copie des données et des fichiers du jeu, pour démarrer plus vite et jouer hors ligne ;
- les erreurs en attente d'envoi.

Ces informations sont nécessaires au fonctionnement du jeu et ne servent à aucun suivi.

## Les effacer
Te déconnecter efface ta session. Pour tout effacer, vide les données du site dans les réglages de ton navigateur. La progression de ton compte, elle, reste sauvegardée sur nos serveurs.

Dernière mise à jour : [À COMPLÉTER : date de publication].
```
