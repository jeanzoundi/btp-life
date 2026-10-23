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
