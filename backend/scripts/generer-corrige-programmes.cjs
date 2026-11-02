// Régénère les corrigés serveur depuis les contenus de l'interface : les séances des lieux (frontend/src/lib/lieux-programme)
// et les journées sur le chantier du quartier (frontend/src/lib/programme-chantier.ts).
// À relancer après chaque changement d'un programme : les tests frontend corrige-programmes.test.ts et
// corrige-journees.test.ts le réclament sinon.
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { corrigeProgrammes } = require('../../frontend/src/lib/corrige-programmes');
const { corrigeJournees } = require('../../frontend/src/lib/corrige-journees');

const ecrire = (fichier, contenu) => writeFileSync(join(__dirname, '../src/carriere', fichier), `${JSON.stringify(contenu, null, 2)}\n`);

const programmes = corrigeProgrammes();
ecrire('programmes-corrige.json', programmes);
console.log(`Corrigé des séances écrit : ${Object.keys(programmes).length} lieux, ${Object.values(programmes).flat(2).length} tâches.`);

const journees = corrigeJournees();
ecrire('journees-corrige.json', journees);
console.log(`Corrigé des journées écrit : ${journees.jours.length} jours, ${journees.jours.reduce((n, j) => n + j.taches.length, 0)} situations.`);
