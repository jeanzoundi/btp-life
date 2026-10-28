import { describe, expect, it } from 'vitest';
import { avancerHorloge, heureDeDepart, peutRestaurerMonde, appliquerTempsEcoule, choisirEtatMondeRecent, cleSauvegardeMonde, type EtatMonde } from './sauvegarde-monde';
import { LIEUX_PROGRAMME } from './lieux-programme';

const base: EtatMonde = { version: 4, position: { x: 0, z: 0 }, quartier: 'Centre', relations: {}, mode: 'libre', etapeMode: 0, score: 0, secondes: null, heure: 16, pause: false, decouvertes: [], records: {} };

describe('sauvegarde du monde', () => {
  it('attend une réponse fraîche réussie et ignore le cache initial', () => {
    expect(peutRestaurerMonde(false, false, false)).toBe(false);
    expect(peutRestaurerMonde(true, true, false)).toBe(false);
    expect(peutRestaurerMonde(true, false, true)).toBe(false);
    expect(peutRestaurerMonde(true, false, true, true)).toBe(true);
    expect(peutRestaurerMonde(true, false, false)).toBe(true);
  });

  it('conserve les fractions de seconde entre sauvegardes fréquentes', () => {
    let horloge = { heure: 16, instant: 1000, pause: false };
    for (let i = 1; i <= 20; i++) horloge = avancerHorloge(horloge, 1000 + i * 750);
    expect(horloge.heure).toBeCloseTo(16.25, 10);
  });

  it('rattrape un onglet suspendu et passe minuit', () => {
    expect(avancerHorloge({ heure: 23.5, instant: 1000, pause: false }, 61000).heure).toBe(0.5);
    expect(avancerHorloge({ heure: 16, instant: 1000, pause: true }, 61000).heure).toBe(16);
  });

  it('accélère le temps en 2x et 3x, sans effet en pause', () => {
    expect(avancerHorloge({ heure: 10, instant: 0, pause: false }, 60000, 2).heure).toBe(12);
    expect(avancerHorloge({ heure: 10, instant: 0, pause: false }, 60000, 3).heure).toBe(13);
    expect(avancerHorloge({ heure: 10, instant: 0, pause: true }, 60000, 3).heure).toBe(10);
  });

  it('recharge sans perdre le délai de transport de la sauvegarde serveur', () => {
    const etat = { ...base, heureCalculeeLe: '2026-10-13T10:00:00.000Z', sauvegardeLe: '2026-10-13T10:00:02.000Z' };
    expect(appliquerTempsEcoule(etat, Date.parse('2026-10-13T10:00:15.750Z')).heure).toBeCloseTo(16.2625);
  });
  it('isole la sauvegarde de chaque joueur', () => {
    expect(cleSauvegardeMonde('u1')).not.toBe(cleSauvegardeMonde('u2'));
  });

  it('restaure la copie locale quand elle est plus récente que le serveur', () => {
    const serveur = { ...base, position: { x: 1, z: 2 }, sauvegardeLe: '2026-10-13T10:00:00.000Z' };
    const local = { ...base, position: { x: 30, z: 40 }, sauvegardeLe: '2026-10-13T10:00:02.000Z' };
    expect(choisirEtatMondeRecent(serveur, local)?.position).toEqual({ x: 30, z: 40 });
  });

  it('préfère le serveur quand il est plus récent', () => {
    const serveur = { ...base, score: 50, sauvegardeLe: '2026-10-13T10:00:03.000Z' };
    const local = { ...base, score: 10, sauvegardeLe: '2026-10-13T10:00:02.000Z' };
    expect(choisirEtatMondeRecent(serveur, local)?.score).toBe(50);
  });

  it("fait avancer l'heure du monde et le chronomètre après une actualisation", () => {
    const etat = { ...base, secondes: 120, sauvegardeLe: '2026-10-13T10:00:00.000Z' };
    const restaure = appliquerTempsEcoule(etat, Date.parse('2026-10-13T10:01:30.000Z'));
    expect(restaure.heure).toBe(17.5);
    expect(restaure.secondes).toBe(30);
  });

  it('ne fait pas avancer le temps quand le joueur a mis le jeu en pause', () => {
    const etat = { ...base, pause: true, secondes: 120, sauvegardeLe: '2026-10-13T10:00:00.000Z' };
    expect(appliquerTempsEcoule(etat, Date.parse('2026-10-13T11:00:00.000Z'))).toEqual(etat);
  });
});

describe('l’heure de départ du monde', () => {
  it('ouvre la démonstration le matin, quand tous les mentors reçoivent pour plusieurs heures', () => {
    const depart = heureDeDepart(true);
    for (const [lieu, { programme }] of Object.entries(LIEUX_PROGRAMME)) {
      expect(depart, lieu).toBeGreaterThanOrEqual(programme.horaires.ouverture);
      expect(depart + 4, lieu).toBeLessThanOrEqual(programme.horaires.fermeture);
    }
  });
  it('garde 16 h pour la première partie d’un joueur', () => {
    expect(heureDeDepart(false)).toBe(16);
  });
});
