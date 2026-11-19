# Connexion par code et Brevo

Le backend envoie les codes de connexion via l'API transactionnelle Brevo.
Les secrets restent dans les variables d'environnement du backend, jamais dans Git ou le frontend.

## Configuration nécessaire avant activation

- `BREVO_API_KEY` : clé API Brevo, pas une clé SMTP.
- `MAIL_EXPEDITEUR` : `BTP Life <adresse-validée-dans-Brevo>`.
- `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` : secrets existants, ne pas les remplacer pour cette installation.

Configurer ces variables pour **Production** dans le projet Vercel **btp-life-backend**, puis redéployer le backend.
Vérifier que l'expéditeur est actif dans Brevo. Ne pas activer le nouvel écran de connexion avant que l'envoi soit opérationnel.
Resend reste une alternative si seule `RESEND_API_KEY` est définie ; Brevo est prioritaire si les deux clés existent.

## Vérifications de livraison

1. Tests backend et frontend, compilation TypeScript.
2. `npm run test:migrations` dans le backend : rejoue aussi les demandes et validations concurrentes sur PostgreSQL temporaire, sans envoyer d'e-mail.
3. Déploiement du backend : la migration additive `20261118100000_codes_connexion` crée la table des codes.
4. Vérification d'un envoi à une adresse de test explicitement choisie, puis vérification manuelle du code reçu. Un appel accepté par Brevo ne prouve pas à lui seul la réception dans la boîte.
5. Publication du frontend après validation de l'envoi.

## Garanties testées

- Codes valables dix minutes, cinq essais maximum, comparaison d'empreintes HMAC.
- Quota par adresse et consommation du code dans une transaction sérialisable, avec nouvelle tentative après conflit PostgreSQL.
- Un seul succès pour deux validations simultanées ; les erreurs ne rétablissent pas les essais consommés.
- Le code utilisé reste dans l'historique, invalidé, pour conserver les quotas d'envoi.
- Aucun e-mail dans une transaction susceptible d'être rejouée.
- Jamais de code de développement sur Vercel, même sans `NODE_ENV`.
- Les réponses d'erreur du fournisseur ne sont pas recopiées dans les journaux.

Limite conservée : une demande dont l'envoi échoue consomme son quota ; le joueur doit attendre le délai avant de réessayer.

Documentation fournisseur : https://developers.brevo.com/reference/send-transac-email
