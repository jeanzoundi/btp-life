import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/app/quartier-3d.tsx', 'utf8');

describe('cadence de sauvegarde du monde 3D', () => {
  it('n’écrit plus la sauvegarde serveur toutes les secondes', () => {
    expect(source).toContain('setInterval(sauvegarder, 30000)');
    expect(source).not.toContain('setInterval(sauvegarder, 2000)');
  });

  it('tamponne séparément la sauvegarde locale', () => {
    expect(source).toContain('setInterval(sauvegarderLocal, 5000)');
    expect(source).toContain('localModifieRef.current = true');
  });
});
