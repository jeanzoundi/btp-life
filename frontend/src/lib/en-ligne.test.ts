import { describe, expect, it } from 'vitest';
import { DUREE_EMOTE_MS, LONGUEUR_MESSAGE, PROMENEURS_MAX, REGLES_EQUIPE, emoteParId, equipeAvec, estCoequipier, invitables, messagePret, messagesDemo, promeneurs, surBoucle, voisinsDemo } from './en-ligne';

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

describe('les équipes de quartier', () => {
  const moi = { userId: 'moi', nom: 'Koffi' };
  it('propose les voisins qui ne sont pas déjà de l’équipe, tant qu’il reste de la place', () => {
    const voisins = voisinsDemo(0);
    expect(invitables(voisins, null).map(v => v.nom)).toEqual(['Aya', 'Kader', 'Inès']);
    const equipe = equipeAvec(null, moi, voisins[0]);
    expect(equipe.chefId).toBe('moi');
    expect(estCoequipier(equipe, 'demo-aya')).toBe(true);
    expect(invitables(voisins, equipe).map(v => v.nom)).toEqual(['Kader', 'Inès']);
    const complete = voisins.reduce((e, v) => equipeAvec(e, moi, v), equipe);
    expect(complete.membres).toHaveLength(REGLES_EQUIPE.membresMax);
    expect(invitables(voisins, complete)).toEqual([]);
    expect(equipeAvec(complete, moi, { userId: 'autre', nom: 'Autre' }).membres).toHaveLength(REGLES_EQUIPE.membresMax);
  });
});

describe('les promeneurs de la place', () => {
  const recents = ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ userId: id, nom: id.toUpperCase(), avatarConfig: null, niveau: i + 2 }));
  it('fait promener jusqu’à trois joueurs récents tant que presque personne n’est connecté, sans les dire en ligne', () => {
    const liste = promeneurs(recents, [], 30);
    expect(liste).toHaveLength(PROMENEURS_MAX);
    expect(liste.every(p => p.promeneur && p.lieu === null && p.emote === null && Math.abs(p.x) <= 20 && Math.abs(p.z) <= 12)).toBe(true);
    expect(liste[0].promeneur).toEqual({ niveau: 2 });
  });
  it('n’affiche pas en promeneur un joueur connecté, et disparaît dès que deux joueurs sont en ligne', () => {
    expect(promeneurs(recents, [{ userId: 'a' }], 0).map(p => p.userId)).toEqual(['b', 'c', 'd']);
    expect(promeneurs(recents, [{ userId: 'x' }, { userId: 'y' }], 0)).toEqual([]);
  });
});
