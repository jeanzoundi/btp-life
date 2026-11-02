import { describe, expect, it } from 'vitest';
import { repliqueAccueil, type ContexteDialogue } from './dialogues-pnj';

const BASE: ContexteDialogue = {
  heure: 10, meteo: 'soleil', niveau: 2, poste: 'Apprenti', journees: 0, derniere: null,
  premiereJournee: { faites: [], finie: false }, chapitresFilRouge: 0, faim: 70, energie: 70,
};

describe('les répliques des habitants', () => {
  it('Yao commente la dernière journée du joueur, sa note à l’appui', () => {
    expect(repliqueAccueil('Yao', { ...BASE, derniere: { type: 'journee', note: 92 } })).toMatch(/92\/100.*responsabilités/);
    expect(repliqueAccueil('Yao', { ...BASE, derniere: { type: 'journee', note: 35 } })).toMatch(/35\/100.*bases/);
  });
  it('Yao propose du travail au nouveau venu, et salue l’habitué', () => {
    expect(repliqueAccueil('Yao', BASE)).toMatch(/7 000 F/);
    expect(repliqueAccueil('Yao', { ...BASE, journees: 6 })).toMatch(/6 journées/);
    // Le soir, il est au maquis : il parle de demain.
    expect(repliqueAccueil('Yao', { ...BASE, heure: 19, journees: 2 })).toMatch(/demain/);
    expect(repliqueAccueil('Yao', { ...BASE, meteo: 'orage' })).toMatch(/pluie/);
  });
  it('Koffi parle de sa pause au maquis à midi, et du premier salaire une fois la première journée finie', () => {
    expect(repliqueAccueil('Koffi', { ...BASE, heure: 12.8 })).toMatch(/garba/);
    expect(repliqueAccueil('Koffi', { ...BASE, premiereJournee: { faites: ['logement', 'travail', 'paie', 'objectif'], finie: true } })).toMatch(/premier salaire/);
  });
  it('Awa encourage l’étudiant et félicite une bonne séance', () => {
    expect(repliqueAccueil('Awa', { ...BASE, poste: 'Étudiant en BTS' , niveau: 4 })).toMatch(/BTS/);
    expect(repliqueAccueil('Awa', { ...BASE, niveau: 6, derniere: { type: 'seance', note: 84 } })).toMatch(/84\/100/);
    expect(repliqueAccueil('Awa', { ...BASE, heure: 18 })).toMatch(/café/);
  });
  it('Fatou s’inquiète de la faim et de la fatigue, et oriente le nouvel arrivant', () => {
    expect(repliqueAccueil('Fatou', { ...BASE, faim: 12 })).toMatch(/affamé/);
    expect(repliqueAccueil('Fatou', { ...BASE, energie: 10 })).toMatch(/fatigue/);
    expect(repliqueAccueil('Fatou', BASE)).toMatch(/Résidence/);
    expect(repliqueAccueil('Fatou', { ...BASE, premiereJournee: { faites: ['logement'], finie: false } })).toBeNull();
  });
  it('Mariam suit le fil rouge et l’ambition du joueur ; un inconnu ne dit rien de particulier', () => {
    expect(repliqueAccueil('Mariam', { ...BASE, chapitresFilRouge: 3 })).toMatch(/3 chapitres déjà validés/);
    expect(repliqueAccueil('Mariam', { ...BASE, niveau: 9 })).toMatch(/entreprise/);
    expect(repliqueAccueil('Inconnu', BASE)).toBeNull();
  });
});
