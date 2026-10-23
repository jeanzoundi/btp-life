import { configureTextBuilder } from 'troika-three-text';

// Police locale (Noto Sans, licence OFL, public/fonts) pour tous les textes 3D : noms, enseignes, panneaux.
// Sans elle, troika télécharge ses polices sur un CDN externe ; si ce téléchargement échoue, les scènes
// qui affichent un texte restent suspendues indéfiniment. Doit s'exécuter avant le premier texte rendu.
configureTextBuilder({ defaultFontURL: '/fonts/noto-sans-latin-regular.ttf' });
