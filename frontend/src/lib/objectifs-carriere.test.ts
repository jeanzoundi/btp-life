import { describe, expect, it } from 'vitest';
import { NIVEAU_RESPONSABILITES, objectifsCarriere, prochainObjectif, type EtatCarriereJoueur } from './objectifs-carriere';
import { OUTILS } from './patrimoine';
import { avancementCursus, CURSUS, lireFormation, type EtatCursusJoueur } from './cursus';

const NOUVEAU: EtatCarriereJoueur = { niveau: 1, porte: 'ouvrier', certificats: [], outils: [], logement: 'studio', entreprise: false, journees: 0, livraisons: 0, diplome: false };

describe('les objectifs durables', () => {
  it('couvrent qualification, outil, logement, responsabilités et entreprise, dans cet ordre', () => {
    expect(objectifsCarriere(NOUVEAU).map(o => o.categorie)).toEqual(['qualification', 'outil', 'logement', 'responsabilite', 'entreprise']);
    expect(prochainObjectif(objectifsCarriere(NOUVEAU))?.titre).toBe('Attestation Sécurité chantier');
  });
  it('diffèrent d’un parcours à l’autre et se mesurent sur l’état réel du joueur', () => {
    const etudiant = objectifsCarriere({ ...NOUVEAU, porte: 'etudiant', logement: 'chambre' });
    expect(etudiant[0].titre).toBe('Obtenir ton diplôme');
    expect(objectifsCarriere({ ...NOUVEAU, porte: 'etudiant', diplome: true })[0].atteint).toBe(true);
    expect(objectifsCarriere({ ...NOUVEAU, porte: 'dessinateur', outils: ['ordinateur-bim'] })[1].atteint).toBe(true);
    expect(objectifsCarriere({ ...NOUVEAU, porte: 'ingenieur', logement: 'f2' })[2].atteint).toBe(false);
    expect(objectifsCarriere({ ...NOUVEAU, logement: 'villa' })[2].atteint).toBe(true);
    expect(objectifsCarriere({ ...NOUVEAU, porte: 'encadrant', livraisons: 1 })[3]).toMatchObject({ titre: 'Livrer un ouvrage avec ton équipe', atteint: true });
    expect(objectifsCarriere({ ...NOUVEAU, niveau: NIVEAU_RESPONSABILITES })[3].atteint).toBe(true);
    expect(objectifsCarriere({ ...NOUVEAU, entreprise: true })[4].atteint).toBe(true);
  });
  it('ne vise que des outils qui existent dans le patrimoine', () => {
    const slugs = new Set(OUTILS.map(o => o.slug));
    for (const porte of ['etudiant', 'ouvrier', 'dessinateur', 'encadrant', 'ingenieur'] as const) {
      const outil = objectifsCarriere({ ...NOUVEAU, porte })[1];
      expect([...slugs].some(s => outil.titre.includes(OUTILS.find(o => o.slug === s)!.nom))).toBe(true);
    }
  });
});

describe('le cursus, côté jeu (même calcul qu’au serveur)', () => {
  it('suit le même ordre : semestres, stage, diplôme ; chaque étape demande la précédente', () => {
    const vide: EtatCursusJoueur = { coursLus: new Set(), modules: new Map(), missionsReussies: new Set(), journees: 0, etapesLieux: {} };
    const { etapes } = avancementCursus('BTS', vide);
    expect(etapes.map(e => e.type)).toEqual(['semestre', 'semestre', 'stage', 'semestre', 'semestre', 'diplome']);
    expect(etapes[0].statut).toBe('en-cours');
    expect(etapes.slice(1).every(e => e.statut === 'verrouille')).toBe(true);
    expect(CURSUS.ingenieur.stages).toHaveLength(2);
    expect(lireFormation({ formationDepart: 'ingenieur' })).toBe('ingenieur');
  });
});
