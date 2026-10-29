# Textes légaux de BTP Life : brouillons à compléter

Brouillons du 29 octobre 2026, rédigés d'après ce que le jeu fait réellement (données collectées, stockage local,
modération, hébergement). **Rien n'est publié** : les pages du site affichent toujours le contenu actuel des
« Pages CMS » de l'administration.

Ces brouillons ne sont pas un avis juridique : fais-les relire par un professionnel du droit (droit ivoirien des
données personnelles, loi n° 2013-450 du 19 juin 2013 ; RGPD si le jeu vise aussi des joueurs de l'Union européenne).

## Ce qu'il reste à fournir

Chaque information manquante est écrite `[À COMPLÉTER : …]` dans les fichiers.

- Identité de l'éditeur : nom ou raison sociale, forme juridique et capital, RCCM, numéro de compte contribuable,
  adresse du siège, téléphone, e-mail de contact.
- Directeur ou directrice de la publication.
- E-mail dédié aux données personnelles (peut être le même que le contact).
- Région d'hébergement de la base Supabase (visible dans le tableau de bord Supabase, rubrique « Settings ») et
  vérification des adresses des hébergeurs.
- Durées de conservation à décider : comptes inactifs, messages du chat, signalements, erreurs remontées.
- Ville du tribunal compétent (Abidjan par défaut dans le brouillon).
- Âge minimum et règle pour les mineurs (le brouillon demande l'accord d'un parent avant 18 ans : à valider).

## Points à décider côté jeu

- Les messages du chat sont aujourd'hui conservés sans limite : une purge automatique (par exemple 30 jours) rendrait
  la durée annoncée vraie.
- Il n'existe pas encore de suppression de compte ni d'export des données en libre-service : le brouillon renvoie vers
  l'e-mail de contact, ce qui est acceptable si les demandes sont traitées sous un mois.

## Publier

Une fois les blancs remplis : Administration → Pages CMS → ouvrir la page (`cgu`, `confidentialite`,
`mentions-legales`, `cookies`) → coller le texte dans le champ « texte » du contenu. La page du site comprend la mise en
forme légère des brouillons : `## Titre` pour un intertitre, `- ` en début de ligne pour une liste, une ligne vide
entre deux paragraphes.

Ne pas recopier ces textes dans `prisma/seed.ts` tant qu'ils contiennent des blancs : le seed complet réécrit les pages.
