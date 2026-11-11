// Les pages légales du site (Pages CMS) : mentions légales, conditions générales, confidentialité et cookies. L'éditeur
// est Mister JZ, à titre personnel. Mise en forme des Pages CMS : « ## » pour un intertitre, « - » pour une liste, une
// ligne vide entre deux paragraphes (frontend/src/lib/texte-legal.ts). Le seed les met à jour sur place ; en production,
// scripts/publier-pages-legales.ts les remplace, sans toucher à une page déjà réécrite dans l'administration.
// Chaque phrase décrit le jeu tel qu'il est : rien n'y promet une suppression automatique qui n'est pas programmée.

export const DERNIERE_MISE_A_JOUR_LEGALE = '10 novembre 2026';
const miseAJour = `Dernière mise à jour : ${DERNIERE_MISE_A_JOUR_LEGALE}.`;

/** Les premières versions d'une ligne, remplacées par la publication des pages complètes. */
export const PAGES_LEGALES_D_ORIGINE: Record<string, string> = {
  cgu: 'Conditions générales d\'utilisation de BTP Life.',
  confidentialite: 'Politique de confidentialité et RGPD.',
  'mentions-legales': 'Éditeur : BTP Life. Hébergeur : à préciser.',
  cookies: 'Politique de gestion des cookies.',
};

export const PAGES_LEGALES: { slug: string; titre: string; texte: string }[] = [
  {
    slug: 'mentions-legales',
    titre: 'Mentions légales',
    texte: `## Éditeur
BTP Life est édité par Mister JZ, à titre personnel, en Côte d'Ivoire.

Directeur de la publication : Mister JZ.

Courriel : contact@btplife.com.

## Hébergement
Le site et l'application sont hébergés par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).

La base de données est hébergée par Supabase, Inc., 65 Chulia Street #38-02/03, OCBC Centre, Singapour 049513 (supabase.com), sur des serveurs situés hors de Côte d'Ivoire.

## Propriété intellectuelle
Les textes, scénarios, exercices, illustrations et le code de BTP Life appartiennent à l'éditeur. Toute reproduction ou réutilisation sans son autorisation est interdite, sauf usage personnel et pédagogique non commercial.

Certaines ressources viennent de bibliothèques libres : les textures et le ciel de Poly Haven (licence CC0) et les personnages de Microsoft Rocketbox (licence MIT).

## Contenus pédagogiques
BTP Life est un simulateur pédagogique. Ses contenus techniques ne remplacent ni les normes officielles, ni les bureaux d'études, ni les professionnels habilités : voir l'avertissement pédagogique.

## Contact
Pour toute question : contact@btplife.com.

${miseAJour}`,
  },
  {
    slug: 'cgu',
    titre: 'Conditions générales d’utilisation',
    texte: `## Objet
Ces conditions encadrent l'utilisation de BTP Life, simulateur de carrière dans le bâtiment et les travaux publics, édité par Mister JZ et accessible sur btp-life-frontend.vercel.app. Créer un compte ou jouer, c'est les accepter.

## Ton compte
- L'inscription est gratuite. Elle demande une adresse électronique valide, un nom et un mot de passe.
- Tu gardes ton mot de passe pour toi : tu es responsable de ce qui se fait avec ton compte.
- Ton compte est personnel : il ne se prête pas et ne se vend pas.
- Il faut avoir au moins 13 ans pour créer un compte, et l'accord d'un parent ou tuteur avant 18 ans.
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
Ces conditions sont soumises au droit ivoirien. À défaut d'accord amiable, les tribunaux d'Abidjan sont compétents.

${miseAJour}`,
  },
  {
    slug: 'confidentialite',
    titre: 'Politique de confidentialité',
    texte: `## Qui est responsable
Mister JZ, éditeur de BTP Life, est responsable des données traitées par le jeu. Contact : contact@btplife.com.

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
- Les autres joueurs voient le nom de ton personnage ou ton pseudo (jamais ton nom réel ni ton adresse électronique), ton personnage, tes messages du chat et ta présence dans le quartier.
- L'éditeur y accède pour le support et la modération.
- Elles sont hébergées par des prestataires techniques : Vercel pour l'application, aux États-Unis, et Supabase pour la base de données. Les notifications passent par le service de ton navigateur (Google, Mozilla ou Apple selon le navigateur).

Tes données ne sont ni vendues ni louées.

## Hors de Côte d'Ivoire
Ces prestataires conservent les données hors de Côte d'Ivoire et s'engagent par contrat à les protéger.

## Combien de temps
- Ton compte, ta progression et tes messages du chat : tant que ton compte existe. Ils sont effacés quand tu le supprimes.
- Ta position dans le quartier : seule la dernière est gardée, remplacée à chaque relevé.
- Les rapports d'erreur : ils ne sont pas liés à ton compte et servent seulement à corriger le jeu.

## Tes droits
La loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel te permet d'accéder à tes données, de les faire corriger ou supprimer, et de t'opposer à leur traitement pour un motif légitime.

Tu corriges ton profil et tu supprimes ton compte toi-même, dans Profil et paramètres ; la suppression efface aussi la copie gardée dans ton navigateur. Pour le reste, écris à contact@btplife.com : tu auras une réponse sous un mois.

Tu peux aussi t'adresser à l'Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI).

Les notifications se coupent à tout moment dans les réglages de ton navigateur.

## Mineurs
BTP Life s'adresse notamment aux élèves et aux étudiants. Avant 18 ans, il faut l'accord d'un parent ou tuteur pour créer un compte.

## Sécurité
Les échanges sont chiffrés (HTTPS), les mots de passe protégés par argon2, et l'administration réservée aux comptes habilités.

${miseAJour}`,
  },
  {
    slug: 'cookies',
    titre: 'Cookies',
    texte: `## Aucun cookie publicitaire
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

${miseAJour}`,
  },
];
