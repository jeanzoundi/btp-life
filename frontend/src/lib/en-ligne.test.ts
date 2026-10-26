import { describe, expect, it } from 'vitest';
import { DUREE_EMOTE_MS, LONGUEUR_MESSAGE, emoteParId, messagePret, messagesDemo, surBoucle, voisinsDemo } from './en-ligne';

describe('le monde en ligne vu du jeu', () => {
  it('parcourt une boucle à vitesse constante et revient au départ', () => {
    const carre: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    expect(surBoucle(carre, 1, 5)).toEqual([5, 0]);
    expect(surBoucle(carre, 1, 15)).toEqual([10, 5]);
    expect(surBoucle(carre, 1, 40)).toEqual([0, 0]);
  });
  it('fait vivre trois voisins de démonstration, avec une émote qui s’éteint d’elle-même', () => {
    const voisins = voisinsDemo(0);
    expect(voisins.map(v => v.nom)).toEqual(['Aya', 'Kader', 'Inès']);
    expect(voisins.every(v => v.lieu === null && Math.abs(v.x) < 30 && Math.abs(v.z) < 30)).toBe(true);
    expect(voisinsDemo(0)[0].emote).toBe('salut');
    expect(voisinsDemo(DUREE_EMOTE_MS / 1000 + 1)[0].emote).toBeNull();
    expect(emoteParId('danse')?.icone).toBe('💃');
    expect(emoteParId('inconnue')).toBeNull();
  });
  it('fait arriver les messages de démonstration au fil du temps, et prépare ceux du joueur', () => {
    expect(messagesDemo(0)).toHaveLength(1);
    expect(messagesDemo(200).map(m => m.nom)).toEqual(['Aya', 'Kader', 'Inès', 'Aya', 'Kader']);
    expect(messagePret('  On   coule\ndemain  ')).toBe('On coule demain');
    expect(messagePret('   ')).toBeNull();
    expect(messagePret('a'.repeat(300))).toHaveLength(LONGUEUR_MESSAGE);
  });
});
