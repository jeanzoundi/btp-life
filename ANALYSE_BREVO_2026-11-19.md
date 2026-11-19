# Analyse et préparation Brevo — 19 novembre 2026

## État et corrections

L'envoi HTTP Brevo et l'écran unique d'inscription/connexion étaient déjà implémentés dans les commits 633844d et 0f7fadc. La revue a porté sur cette nouvelle authentification et sa préparation au déploiement.

- Corrigé : deux validations simultanées pouvaient accepter le même code. Lecture, consommation et compte sont maintenant dans une transaction sérialisable rejouée après conflit PostgreSQL ; les jetons ne sont signés qu'après le commit.
- Corrigé : le quota d'envoi était vérifié séparément de l'enregistrement, permettant des demandes simultanées. La réservation est maintenant atomique, et le mail part une seule fois après validation de la transaction.
- Corrigé : effacer les codes après connexion effaçait aussi l'historique des quotas. Le code est maintenant invalidé sans effacer l'historique récent.
- Vérifié : les mauvais essais sont réellement enregistrés, même si la réponse HTTP est une erreur. Le cinquième essai bloque aussi le bon code.
- Renforcé : aucun code de développement sur Vercel, même si NODE_ENV manque ; clés nettoyées des espaces ; réponses d'erreur du fournisseur absentes des logs.

## Résultats

- Backend : 528 tests dans 39 suites, compilation NestJS réussie.
- Frontend : 644 tests dans 103 suites, contrôle TypeScript réussi.
- Total : 1 172 tests réussis.
- PostgreSQL temporaire : 27 migrations, seed rejouable, cours lus préservés, transactions de progression et nouveaux tests de concurrence des codes réussis.
- Aucun e-mail réel envoyé et aucune modification de base de production pendant cette préparation.

## Configuration manquante

BREVO_API_KEY et MAIL_EXPEDITEUR sont absents des variables Production de btp-life-backend, des fichiers locaux de configuration réelle et des variables système vérifiées. Le fichier .env.example contient seulement un exemple d'expéditeur.

La mise en ligne du nouvel écran est différée : les nouveaux utilisateurs dépendent des codes et ne pourraient pas s'inscrire sans service d'envoi. La version publique précédente est conservée. Les paramètres doivent être fournis dans un fichier local ignoré par Git ou directement dans les variables Production Vercel. Ne jamais commiter une clé API.

Voir backend/BREVO.md pour les étapes de configuration et de vérification. Une clé valide, un expéditeur Brevo actif et la réception réelle d'un code restent à vérifier avant activation.

Référence API : https://developers.brevo.com/reference/send-transac-email
