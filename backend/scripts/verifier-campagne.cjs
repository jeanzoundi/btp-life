// Contrôle de cohérence du corrigé serveur avec les exercices de l'interface.
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
const { CHAPITRES } = require('../../frontend/src/lib/campagne');
const attendu = CHAPITRES.map(chapitre => chapitre.taches.map(({ id, contenu: c }) =>
  c.type === 'mesure' ? { id, type: c.type, reponse: c.mesure.reponse, tolerance: c.mesure.tolerance }
    : { id, type: c.type, options: c.type === 'situation' ? c.situation.choix.map(o => o.correct) : c.selection.options.map(o => o.attendu) }));
if (process.argv.includes('--afficher')) console.log(JSON.stringify(attendu, null, 2));
else {
  require('node:assert/strict').deepEqual(require('../src/carriere/campagne-corrige.json'), attendu);
  console.log('Les 9 chapitres et leurs corrigés serveur correspondent aux exercices.');
}
