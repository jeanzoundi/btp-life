import { describe, expect, it } from 'vitest';
import { BATIMENTS, PARCELLES_BATIMENTS } from './batiments-ville';
import { DOSSIERS } from './campagne';
import { CHATEAU, chateauFini, CHANTIERS_DOSSIERS, elementsDossier, etalsHalle, fondationsDossier, futEnElevation, GABARITS_DOSSIERS, poteauxDossier, stocksDossier } from './plan-dossiers';
import { AVENUES_NORD_SUD, ROUTES_EST_OUEST } from './voirie-ville';
import { LIMITES_VILLE } from './ville';

const TROTTOIR = 6.2;
type Rect = { x: number; z: number; largeur: number; profondeur: number };
const chevauche = (a: Rect, b: Rect) => Math.abs(a.x - b.x) < (a.largeur + b.largeur) / 2 && Math.abs(a.z - b.z) < (a.profondeur + b.profondeur) / 2;
const dans = (x: number, z: number, hx: number, hz: number) => Math.abs(x) <= hx && Math.abs(z) <= hz;

describe('les parcelles des dossiers suivants', () => {
  it('ont toutes un gabarit, dans l’ordre du fil rouge', () => {
    expect(CHANTIERS_DOSSIERS.map(c => c.dossier.id)).toEqual(DOSSIERS.slice(2).map(d => d.id));
    for (const { dossier, gabarit } of CHANTIERS_DOSSIERS) expect(gabarit, dossier.id).toBeDefined();
  });

  it('tiennent dans la ville, hors des avenues, sans toucher un lieu ni une autre parcelle', () => {
    for (const { dossier: { id, parcelle: p } } of CHANTIERS_DOSSIERS) {
      expect(p.x - p.largeur / 2, id).toBeGreaterThanOrEqual(LIMITES_VILLE.minX);
      expect(p.x + p.largeur / 2, id).toBeLessThanOrEqual(LIMITES_VILLE.maxX);
      expect(p.z - p.profondeur / 2, id).toBeGreaterThanOrEqual(LIMITES_VILLE.minZ);
      for (const x of AVENUES_NORD_SUD) expect(Math.abs(p.x - x) >= p.largeur / 2 + TROTTOIR, `${id} / avenue x = ${x}`).toBe(true);
      for (const z of ROUTES_EST_OUEST) expect(Math.abs(p.z - z) >= p.profondeur / 2 + TROTTOIR, `${id} / avenue z = ${z}`).toBe(true);
      for (const b of BATIMENTS) expect(chevauche(p, { x: b.position[0], z: b.position[2], largeur: b.taille[0], profondeur: b.taille[2] }), `${id} / ${b.slug}`).toBe(false);
    }
    const toutes = PARCELLES_BATIMENTS.map(b => ({ slug: b.slug, x: b.position[0], z: b.position[2], largeur: b.taille[0], profondeur: b.taille[2] }));
    expect(toutes).toHaveLength(DOSSIERS.length);
    toutes.forEach((a, i) => toutes.slice(i + 1).forEach(b => expect(chevauche(a, b), `${a.slug} / ${b.slug}`).toBe(false)));
  });

  it('gardent l’ouvrage, ses fondations, ses stocks et sa base vie dans la clôture, et les stocks hors de l’ouvrage', () => {
    for (const { dossier, gabarit: g } of CHANTIERS_DOSSIERS) {
      const hx = dossier.parcelle.largeur / 2, hz = dossier.parcelle.profondeur / 2, { largeur: l, profondeur: p, centreZ: cz } = g.ouvrage;
      expect(dans(0, cz, hx - l / 2, hz - p / 2), `${dossier.id} : ouvrage`).toBe(true);
      for (const b of [...fondationsDossier(g), ...stocksDossier(g)]) expect(dans(b.position[0], b.position[2], hx + .2, hz + .2), `${dossier.id} ${JSON.stringify(b.position)}`).toBe(true);
      for (const b of stocksDossier(g)) {
        const surOuvrage = g.forme === 'chateau-eau' ? Math.hypot(b.position[0], b.position[2] - cz) < CHATEAU.radier.rayon
          : Math.abs(b.position[0]) < l / 2 + b.taille[0] / 2 && Math.abs(b.position[2] - cz) < p / 2 + b.taille[2] / 2;
        expect(surOuvrage, `${dossier.id} : stock sur l’ouvrage ${JSON.stringify(b.position)}`).toBe(false);
      }
      const [bx, , bz] = g.baseVie;
      expect(dans(bx, bz, hx - 1.3, hz - .65), `${dossier.id} : base vie`).toBe(true);
      expect(g.grue.hauteur, dossier.id).toBeGreaterThan(g.forme === 'chateau-eau' ? CHATEAU.radier.epaisseur + CHATEAU.fut.hauteur : g.ouvrage.niveaux * g.ouvrage.hauteurNiveau);
    }
  });
});

describe('ce que montrent les chantiers à chaque chapitre', () => {
  it('réservé, puis sondé, clôturé au permis, fondé, en gros œuvre, prêt pour la réception, livré', () => {
    expect(elementsDossier(0)).toMatchObject({ reserve: true, bornes: true, palissade: false });
    expect(elementsDossier(2)).toMatchObject({ sondages: true, implantation: true, panneauProjet: true });
    expect(elementsDossier(3)).toMatchObject({ palissade: true, permis: true, baseVie: true, bornes: false });
    expect(elementsDossier(4)).toMatchObject({ fondations: true, grue: true, stocks: true });
    expect(elementsDossier(5)).toMatchObject({ grosOeuvre: true, grue: true, fondations: false });
    expect(elementsDossier(6)).toMatchObject({ ouvrage: true, reception: true, grue: false, palissade: true });
    for (const stade of [7, 8]) expect(elementsDossier(stade)).toMatchObject({ livre: true, ouvrage: true, palissade: false, baseVie: false, reception: false });
  });

  it('pose ses poteaux sur une trame régulière, dessine la halle en portiques et le château d’eau en cylindres de béton', () => {
    const ecole = GABARITS_DOSSIERS['groupe-scolaire'], halle = GABARITS_DOSSIERS['marche-couvert'], chateau = GABARITS_DOSSIERS['chateau-eau'];
    expect(poteauxDossier(ecole).length).toBeGreaterThanOrEqual(8);
    expect(poteauxDossier(halle)).toHaveLength(10);
    expect(poteauxDossier(chateau)).toEqual([]);
    expect(etalsHalle(halle).filter(b => b.matiere === 'bois').length).toBeGreaterThan(12);
    // Radier et fût en élévation ; radier, fût et cuve une fois fini : des cylindres, pas des boîtes.
    for (const b of [...futEnElevation(chateau).slice(0, 2), ...chateauFini(chateau).slice(0, 3)]) expect(b.forme).toBe('cylindre');
    // La cuve fait bien 500 m³, comme au dossier.
    expect(Math.PI * CHATEAU.cuve.rayon ** 2 * 5.26).toBeCloseTo(500, -1);
  });

  it('montre les aciers en attente sur un béton gris, jamais dans la texture sableuse des trottoirs', () => {
    for (const { dossier, gabarit } of CHANTIERS_DOSSIERS) {
      const fondations = fondationsDossier(gabarit);
      expect(fondations.some(b => b.matiere === 'metal'), dossier.id).toBe(true);
      // La matière « beton » des blocs, multipliée par un gris, donne du brun : un fût ou une semelle aurait l'air de terre.
      const chateau = gabarit.forme === 'chateau-eau' ? [...futEnElevation(gabarit), ...chateauFini(gabarit)] : [];
      for (const b of [...fondations, ...stocksDossier(gabarit), ...etalsHalle(gabarit), ...chateau]) expect(b.matiere, dossier.id).not.toBe('beton');
    }
  });
});
