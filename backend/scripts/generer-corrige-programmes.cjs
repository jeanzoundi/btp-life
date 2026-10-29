// Régénère le corrigé serveur des séances des lieux depuis les programmes de l'interface (frontend/src/lib/lieux-programme).
// À relancer après chaque changement d'un programme : le test frontend corrige-programmes.test.ts le réclame sinon.
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { corrigeProgrammes } = require('../../frontend/src/lib/corrige-programmes');

const corrige = corrigeProgrammes();
writeFileSync(join(__dirname, '../src/carriere/programmes-corrige.json'), `${JSON.stringify(corrige, null, 2)}\n`);
const taches = Object.values(corrige).flat(2).length;
console.log(`Corrigé écrit : ${Object.keys(corrige).length} lieux, ${taches} tâches.`);
