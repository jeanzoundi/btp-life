# Ressources 3D réalistes — régénération

Les fichiers servis par le jeu sont déjà dans `public/personnages` et `public/materials`. Ces scripts ne servent qu'à les **régénérer** depuis les sources ; les outils ne font pas partie des dépendances du site.

## Outils (une fois, hors du projet)

```bash
npm install --prefix ../outils-3d fbx2gltf@0.9.7-p1 @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 sharp@0.35.5 meshoptimizer@0.22
```

`sharp` doit être en 0.35.5 : `@gltf-transform/functions` en dépend dans cette version, et deux copies différentes empêchent son chargement sous Windows.

## Personnages — `convertir-rocketbox.js`

Source : [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox) (licence MIT). Seuls les fichiers listés dans `PERSONNAGES` et `ANIMATIONS` sont nécessaires (FBX de `Export/`, textures `*_color.tga` et `*_normal.tga`, animations `all_animations_max_motextr_*`).

```bash
ROCKETBOX_ASSETS=/chemin/Microsoft-Rocketbox/Assets NODE_PATH=../outils-3d/node_modules node convertir-rocketbox.js
```

Ce que fait le script :

- FBX converti en glTF par FBX2glTF.
- Textures TGA 2048 réduites en WebP 1024 (corps, tête) et 512 (accessoires).
- Matériaux non métalliques ; transparence en masque pour les cheveux.
- Compression meshopt.
- Animations fusionnées par genre (`animations-h.glb`, `animations-f.glb`) sur un squelette unique.
- Marche et course ramenées sur place.
- Pistes des repères 3ds Max retirées.

Ajouter `--animations` pour ne régénérer que les animations.

## Matériaux — `textures-poly-haven.js`

Sources [Poly Haven](https://polyhaven.com) (CC0), en 1K, via `https://api.polyhaven.com/files/{asset}` : `clay_roof_tiles_02`, `painted_plaster_wall`, `brick_pavement_02`, `corrugated_iron`. Le ciel HDRI est `kloofendal_48d_partly_cloudy_puresky` (1k).

Nommer les fichiers `<asset>-color.jpg`, `<asset>-normal.jpg`, `<asset>-rough.jpg` et `ciel-kloofendal-1k.hdr`, puis lancer :

```bash
POLYHAVEN_SOURCE=/chemin/telechargements NODE_PATH=../outils-3d/node_modules node textures-poly-haven.js
```

Traitements appliqués :

- L'enduit est éclairci pour servir de détail sous la couleur de chaque bâtiment.
- Les pavés de granit gris sont recolorés en grès chaud à partir de leur luminance.
- Tuiles et tôle sont copiées telles quelles.

## Variantes web — `alleger-ressources.cjs`

Le jeu ne charge plus ces sources (14 Mo de JPG, 2,3 Mo de PNG, 1,4 Mo de HDR) mais leurs variantes web, à refaire après tout changement d'une texture, des devantures, du ciel ou d'un personnage :

```bash
node alleger-ressources.cjs [textures] [devantures] [ciel] [personnages]
```

Seul `sharp` est nécessaire : celui de Next, déjà dans `node_modules` du frontend.

- **Textures** : WebP 1024 (`<asset>-<carte>.webp`) et 512 (`-512.webp`) pour les téléphones, qualité 90 pour la couleur et le relief, 85 pour la rugosité. 13,7 Mo → 4,8 Mo, et 1 Mo en 512.
- **Devantures** : `facades-abidjan-v1.webp`, une seule taille (l'atlas fait 1254 px). 2,3 Mo → 0,3 Mo.
- **Ciel** : carte de gain au format de `@monogrid/gainmap-js` (`ciel-kloofendal-1k.jpg`, `-gain.jpg`, `.json`). 1,4 Mo → 0,26 Mo ; le script vérifie que l'éclairement recomposé reste à moins de 1 % de celui du HDR (0,31 % aujourd'hui).
- **Personnages** : `<modele>-512.glb` pour les téléphones, textures de 512 px au plus, maillage et squelette recopiés octet pour octet. 3,7 Mo → 1,8 Mo.

Le choix entre version normale et légère (téléphone, tablette ou fenêtre de moins de 768 px) est dans `src/lib/ressources-legeres.ts` ; son test vérifie que chaque fichier existe. Le ciel est recomposé sur le processeur par `src/lib/ciel-carte-de-gain.ts`, pour servir à tous les `Canvas` (la ville et chaque intérieur). La page d'essai du personnage (`studio-personnage.tsx`) garde le HDR et la variante `ouvrier-studio.glb`.

Le service worker (`public/sw.js`) sert les images (`.webp`, `.jpg`, `.png`) depuis son cache sans revalider : une variante régénérée sous le même nom n'atteint les joueurs déjà venus qu'avec une nouvelle valeur de `CACHE`.
