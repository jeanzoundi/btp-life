import { describe, expect, it } from 'vitest';
import { arretLePlusProche, distanceRues, minutesLisibles, prixTrajet, trajet, trajetMotorise } from './transports';

describe('les prix des transports', () => {
  it('fait payer le gbaka au forfait, avec un supplément au-delà de 4 km', () => {
    expect(prixTrajet('gbaka', 100)).toBe(200);
    expect(prixTrajet('gbaka', 200)).toBe(300);
    expect(prixTrajet('pied', 500)).toBe(0);
  });
  it('fait payer le taxi à la prise en charge et au kilomètre, plus cher sous la pluie', () => {
    // 120 m du jeu = 3 km : 300 + 3 × 250 = 1 050, arrondi à 1 050.
    expect(prixTrajet('taxi', 120)).toBe(1050);
    expect(prixTrajet('taxi', 120, true)).toBe(1600);
    expect(prixTrajet('taxi', 0)).toBe(300);
  });
});

describe('les trajets', () => {
  const tour: [number, number] = [29, -16.5], mairie: [number, number] = [-26, -82.5];
  it('mesure la distance par les rues', () => {
    expect(distanceRues(tour, mairie)).toBe(121);
  });
  it('à pied, c’est gratuit mais long', () => {
    expect(trajet('pied', tour, mairie)).toMatchObject({ prix: 0, minutes: 27, marche: 121 });
  });
  it('en taxi, on gagne du temps et on paie la course', () => {
    const t = trajet('taxi', tour, mairie);
    expect(t.prix).toBe(1050);
    expect(t.minutes).toBeLessThan(trajet('pied', tour, mairie).minutes);
    expect(t.marche).toBe(0);
  });
  it('en gbaka, on marche jusqu’aux arrêts, on attend, et c’est le moins cher', () => {
    const t = trajet('gbaka', tour, mairie);
    expect(t.prix).toBe(200);
    expect(t.marche).toBeGreaterThan(0);
    expect(t.prix).toBeLessThan(trajet('taxi', tour, mairie).prix);
  });
  it('trouve l’arrêt le plus proche, et refuse un véhicule pour quelques pas', () => {
    expect(arretLePlusProche([-100, -58])).toEqual([-108, -61]);
    expect(trajetMotorise([0, 0], [10, 10])).toBe(false);
    expect(trajetMotorise([0, 0], [30, 30])).toBe(true);
  });
  it('affiche les durées lisiblement', () => {
    expect(minutesLisibles(45)).toBe('45 min');
    expect(minutesLisibles(75)).toBe('1 h 15');
  });
});
