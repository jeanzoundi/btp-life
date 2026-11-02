import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { corrigeJournees } from './corrige-journees';

describe('corrigé des journées pour le serveur', () => {
  it('suit le programme du chantier de l’interface (backend/src/carriere/journees-corrige.json)', () => {
    const fichier = join(process.cwd(), '../backend/src/carriere/journees-corrige.json');
    expect(JSON.parse(readFileSync(fichier, 'utf8')), 'corrigé périmé : relancer node backend/scripts/generer-corrige-programmes.cjs').toEqual(corrigeJournees());
  });
});
