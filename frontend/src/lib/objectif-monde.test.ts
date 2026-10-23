import { describe, expect, it } from 'vitest';
import { alertesBesoins, objectifDuMoment } from './objectif-monde';

const bien = { energie: 80, moral: 80, faim: 80, social: 80 };

describe('objectif du moment', () => {
  it('envoie vers le lieu du besoin le plus bas', () => {
    expect(objectifDuMoment({ ...bien, faim: 30, energie: 20 }, 0, 6)).toEqual({ texte: 'Repose-toi chez toi', etiquette: '20 %', lieu: 'residence' });
    expect(objectifDuMoment({ ...bien, social: 44 }, 6, 6).lieu).toBe('cafe');
  });
  it('propose ensuite les repères, puis la vie libre', () => {
    expect(objectifDuMoment(bien, 2, 6)).toEqual({ texte: 'Trouve les repères', etiquette: '2/6' });
    expect(objectifDuMoment(bien, 6, 6).lieu).toBeUndefined();
  });
});

describe('alertes de besoins', () => {
  it('signale une seule fois un besoin critique, puis de nouveau après remontée', () => {
    const premiere = alertesBesoins({ ...bien, faim: 20 }, new Set());
    expect(premiere.nouvelles).toEqual([{ cle: 'faim', texte: 'Tu as faim', action: 'Aller manger', lieu: 'maquis' }]);
    expect(alertesBesoins({ ...bien, faim: 18 }, premiere.signales).nouvelles).toEqual([]);
    const remontee = alertesBesoins({ ...bien, faim: 45 }, premiere.signales);
    expect(remontee.signales.has('faim')).toBe(false);
    expect(alertesBesoins({ ...bien, faim: 10 }, remontee.signales).nouvelles).toHaveLength(1);
  });
  it('n’alerte pas entre 25 et 40, sans oublier un signal déjà donné', () => {
    expect(alertesBesoins({ ...bien, energie: 30 }, new Set()).nouvelles).toEqual([]);
    expect(alertesBesoins({ ...bien, energie: 30 }, new Set(['energie'])).signales.has('energie')).toBe(true);
  });
});
