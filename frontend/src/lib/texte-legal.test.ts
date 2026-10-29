import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blocsLegaux } from './texte-legal';

describe('blocsLegaux', () => {
  it('garde un texte sans mise en forme en un seul paragraphe, comme avant', () => {
    expect(blocsLegaux('Éditeur : BTP Life. Hébergeur : à préciser.')).toEqual([{ type: 'paragraphe', texte: 'Éditeur : BTP Life. Hébergeur : à préciser.' }]);
    expect(blocsLegaux('')).toEqual([]);
  });

  it('découpe intertitres, paragraphes et listes', () => {
    const texte = '## Éditeur\r\n\r\nBTP Life est édité\npar l’éditeur.\n\n## Ce que nous collectons\n- Ton compte\n- Ta partie\nRien d’autre.\n\nFin.';
    expect(blocsLegaux(texte)).toEqual([
      { type: 'titre', texte: 'Éditeur' },
      { type: 'paragraphe', texte: 'BTP Life est édité par l’éditeur.' },
      { type: 'titre', texte: 'Ce que nous collectons' },
      { type: 'liste', elements: ['Ton compte', 'Ta partie'] },
      { type: 'paragraphe', texte: 'Rien d’autre.' },
      { type: 'paragraphe', texte: 'Fin.' },
    ]);
  });

  it('lit les brouillons légaux du dépôt sans perdre de texte', () => {
    for (const page of ['mentions-legales', 'cgu', 'confidentialite', 'cookies']) {
      const texte = readFileSync(join(process.cwd(), `../legal/${page}.md`), 'utf8');
      const blocs = blocsLegaux(texte);
      expect(blocs.filter((b) => b.type === 'titre').length, page).toBeGreaterThan(2);
      const mots = (s: string) => s.replace(/^## |^- /gm, '').split(/\s+/).filter(Boolean).length;
      const lus = blocs.map((b) => b.type === 'liste' ? b.elements.join(' ') : b.texte).join(' ');
      expect(mots(lus), page).toBe(mots(texte));
    }
  });
});
