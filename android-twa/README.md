# BTP Life — Application Android (TWA)

Ce dossier enveloppe la PWA BTP Life (`https://btp-life-frontend.vercel.app`) dans une
**Trusted Web Activity** (Android) via [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).
L'app affiche le site en plein écran, **sans barre d'URL**, avec icône, splash screen et
notifications déléguées — c'est ta PWA, packagée pour le Play Store / le sideload.

## Contenu

- `twa-manifest.json` — configuration source de l'app (package, couleurs, URL de lancement…).
- `app/`, `build.gradle`, `gradlew…` — projet Android généré.
- `android.keystore` — **clé de signature (SECRÈTE, non versionnée)**. Voir ci-dessous.
- Le fichier de vérification de domaine est côté frontend :
  `frontend/public/.well-known/assetlinks.json` (déployé sur le domaine).

## Prérequis (déjà présents sur cette machine)

- JDK 17 (`C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot`)
- Android SDK (`C:\Users\jeanz\AppData\Local\Android\Sdk`)

## Reconstruire l'APK signé

```bash
cd android-twa
export JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-17.0.18.8-hotspot"
export ANDROID_HOME="C:/Users/jeanz/AppData/Local/Android/Sdk"
./gradlew assembleRelease \
  "-Pandroid.injected.signing.store.file=$(pwd)/android.keystore" \
  "-Pandroid.injected.signing.store.password=<MOT_DE_PASSE>" \
  "-Pandroid.injected.signing.key.alias=btplife" \
  "-Pandroid.injected.signing.key.password=<MOT_DE_PASSE>"
```

APK produit : `app/build/outputs/apk/release/app-release.apk`

Pour un **bundle Play Store (AAB)** : remplacer `assembleRelease` par `bundleRelease`
→ `app/build/outputs/bundle/release/app-release.aab`.

## Clé de signature

- Fichier : `android-twa/android.keystore` (alias `btplife`) — **ne jamais committer, garder une sauvegarde**.
- Empreinte SHA-256 (dans `assetlinks.json`) :
  `93:5D:C5:9B:B7:F6:EA:3F:5A:34:F4:7B:83:C9:4E:E8:9D:51:E8:0A:4E:7A:70:B0:6C:94:14:AD:6D:AB:CE:67`
- Le mot de passe n'est pas stocké dans le dépôt. Si tu le perds, il faut regénérer une clé
  **et** mettre à jour `assetlinks.json` avec la nouvelle empreinte.

## Installer l'APK sur un téléphone

1. Copier `app-release.apk` sur le téléphone (câble, Drive, etc.).
2. Autoriser « installer des applications de sources inconnues » pour l'appli de fichiers.
3. Ouvrir l'APK → Installer.

Ou en USB avec débogage activé :

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

## Play Store (plus tard)

1. Créer un compte Google Play Console (25 $ une fois).
2. Uploader l'**AAB** (`bundleRelease`).
3. Activer **Play App Signing** : Google génère sa propre clé de signature → il faudra
   **ajouter l'empreinte SHA-256 fournie par la Console** dans `assetlinks.json` (en plus de
   celle ci-dessus) et redéployer le frontend, sinon la barre d'URL réapparaîtra.
