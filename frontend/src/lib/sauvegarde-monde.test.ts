import { describe, expect, it } from 'vitest';
import { appliquerTempsEcoule, choisirEtatMondeRecent, cleSauvegardeMonde, type EtatMonde } from './sauvegarde-monde';

const base: EtatMonde = { version: 3, position: { x: 0, z: 0 }, quartier: 'Centre', relations: {}, mode: 'libre', etapeMode: 0, score: 0, secondes: null, heure: 16, pause: false };

describe('sauvegarde du monde', () => {
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
