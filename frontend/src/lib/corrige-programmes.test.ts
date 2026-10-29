import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { corrigeProgrammes } from './corrige-programmes';

describe('corrigé des séances pour le serveur', () => {
  it('suit les programmes de l’interface (backend/src/carriere/programmes-corrige.json)', () => {
    const fichier = join(process.cwd(), '../backend/src/carriere/programmes-corrige.json');
    expect(JSON.parse(readFileSync(fichier, 'utf8')), 'corrigé périmé : relancer node backend/scripts/generer-corrige-programmes.cjs').toEqual(corrigeProgrammes());
  });
});
