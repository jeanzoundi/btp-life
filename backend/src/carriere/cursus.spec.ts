import { avancementCursus, CURSUS, lireFormation, type EtatCursusJoueur, type Formation } from './cursus';
import { modulesAcademie } from '../../prisma/seed-data/academie-data';
import { modulesGrandeEcole } from '../../prisma/seed-data/grande-ecole-batiment-data';

/** Un joueur dont tous les modules du cursus ont deux cours et une mission d'examen ; `faits` dit lesquels il a validés. */
function etatJoueur(formation: Formation, { semestresFaits = 0, journees = 0, bureau = 0, sansExamen = false } = {}): EtatCursusJoueur {
  const cursus = CURSUS[formation], modules = new Map<string, { cours: string[]; missions: string[] }>();
  const lus = new Set<string>(), reussies = new Set<string>();
  cursus.semestres.forEach((s, i) => s.modules.forEach(m => {
    modules.set(m, { cours: [`${m}-1`, `${m}-2`], missions: [`${m}-examen`] });
    if (i < semestresFaits) { lus.add(`${m}-1`); lus.add(`${m}-2`); if (!sansExamen) reussies.add(`${m}-examen`); }
  }));
  return { coursLus: lus, modules, missionsReussies: reussies, journees, etapesLieux: { 'bureau-etudes': bureau } };
}

describe('le cursus de l’étudiant', () => {
  it('lit la formation choisie au départ', () => {
    expect(lireFormation({ formationDepart: 'BTS' })).toBe('BTS');
    expect(lireFormation({ formationDepart: 'ingenieur' })).toBe('ingenieur');
    expect(lireFormation({ formationDepart: 'doctorat' })).toBeNull();
    expect(lireFormation(null)).toBeNull();
  });
  it('ouvre le premier semestre et verrouille la suite tant qu’il n’est pas validé', () => {
    const { etapes, diplomeMerite } = avancementCursus('BTS', etatJoueur('BTS'));
    expect(etapes.map(e => e.statut)).toEqual(['en-cours', 'verrouille', 'verrouille', 'verrouille', 'verrouille', 'verrouille']);
    expect(etapes.map(e => e.type)).toEqual(['semestre', 'semestre', 'stage', 'semestre', 'semestre', 'diplome']);
    expect(diplomeMerite).toBe(false);
  });
  it('ne valide un semestre qu’avec ses cours lus et son examen réussi', () => {
    const sansExamen = avancementCursus('BTS', etatJoueur('BTS', { semestresFaits: 1, sansExamen: true }));
    expect(sansExamen.etapes[0]).toMatchObject({ statut: 'en-cours', cours: { lus: 8, total: 8 }, examen: { reussis: 0, total: 4 } });
    expect(avancementCursus('BTS', etatJoueur('BTS', { semestresFaits: 1 })).etapes[0].statut).toBe('valide');
  });
  it('demande le stage avant le troisième semestre, même si ses cours sont déjà lus', () => {
    const avance = avancementCursus('BTS', etatJoueur('BTS', { semestresFaits: 4, journees: 3 }));
    expect(avance.etapes.map(e => e.statut)).toEqual(['valide', 'valide', 'en-cours', 'verrouille', 'verrouille', 'verrouille']);
    expect(avance.etapes[2].stage).toEqual({ fait: 3, requis: 5 });
    const diplome = avancementCursus('BTS', etatJoueur('BTS', { semestresFaits: 4, journees: 7 }));
    expect(diplome.diplomeMerite).toBe(true);
    expect(diplome.etapes.at(-1)).toMatchObject({ type: 'diplome', statut: 'valide' });
  });
  it('mène l’ingénieur au diplôme par deux stages, dont trois étapes au bureau d’études', () => {
    expect(avancementCursus('ingenieur', etatJoueur('ingenieur', { semestresFaits: 4, journees: 5, bureau: 2 })).diplomeMerite).toBe(false);
    expect(avancementCursus('ingenieur', etatJoueur('ingenieur', { semestresFaits: 4, journees: 5, bureau: 3 })).diplomeMerite).toBe(true);
  });
  it('ne compte que des modules qui existent à l’Académie ou à la Grande École', () => {
    const existants = new Set([...modulesAcademie, ...modulesGrandeEcole].map(m => m.slug));
    for (const c of Object.values(CURSUS)) for (const s of c.semestres) {
      expect(s.modules.length).toBeGreaterThanOrEqual(4);
      for (const m of s.modules) expect(existants.has(m)).toBe(true);
    }
  });
});
