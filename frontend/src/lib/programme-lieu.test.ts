import { describe, expect, it } from 'vitest';
import { creerNavigation } from './navigation-plan';
import {
  appliquerSeance, bilanSeance, contenuTache, enReposLieu, fusionnerProgres, lireNombre, lireProgresLieu, nouvelleSeance, noter, PROGRES_INITIAL, prochaineEtape,
  scoreMesure, scoreSelection, scoreSituation, seanceDisponible, seanceFaite, tacheALaZoneLieu, tachesRestantes, type ContenuTache, type SeanceLieu,
} from './programme-lieu';
import { LIEUX_PROGRAMME } from './lieux-programme';
import { commande, CHARGE_UTILE } from './lieux-programme/depot';
import { PROGRAMME_LABORATOIRE, tableauLaboratoire } from './lieux-programme/laboratoire';
import { ordreChoix } from './programme-chantier';

const LAB = PROGRAMME_LABORATOIRE;
/** Score parfait pour un contenu : la bonne réponse, la valeur exacte, ou toutes les pièces attendues. */
const parfait = (c: ContenuTache) => c.type === 'situation' ? scoreSituation(c.situation, c.situation.choix.findIndex(x => x.correct))
  : c.type === 'mesure' ? scoreMesure(c.mesure, c.mesure.reponse)
  : scoreSelection(c.selection, c.selection.options.flatMap((o, i) => o.attendu ? [i] : []));
const faire = (s: SeanceLieu, score?: number) => s.taches.reduce((x, t) => noter(x, t.id, score ?? parfait(contenuTache(LAB, x, t.id)!)), s);

describe('contenus des lieux', () => {
  for (const [slug, { programme, plan }] of Object.entries(LIEUX_PROGRAMME)) {
    it(`${slug} : étapes complètes, contenus justes sur quatre cycles, postes accessibles`, () => {
      expect(programme.slug).toBe(slug);
      expect(programme.etapes.length).toBeGreaterThanOrEqual(5);
      const nav = creerNavigation(plan);
      for (const etape of programme.etapes) {
        expect(etape.taches.length, etape.id).toBeGreaterThanOrEqual(2);
        expect(new Set(etape.taches.map(t => t.id)).size, etape.id).toBe(etape.taches.length);
        for (const tache of etape.taches) {
          expect(plan.stations[tache.zone], `${etape.id}/${tache.id}`).toBeDefined();
          for (let cycle = 0; cycle < 4; cycle++) {
            const c = tache.contenu(cycle);
            expect(c.type, tache.id).toBe(tache.contenu(0).type);
            if (c.type === 'situation') {
              expect(c.situation.choix, tache.id).toHaveLength(3);
              expect(c.situation.choix.filter(x => x.correct), tache.id).toHaveLength(1);
            } else if (c.type === 'mesure') {
              expect(Number.isFinite(c.mesure.reponse), tache.id).toBe(true);
              expect(c.mesure.tolerance, tache.id).toBeGreaterThanOrEqual(0);
            } else {
              expect(c.selection.options.filter(o => o.attendu).length, tache.id).toBeGreaterThanOrEqual(2);
              expect(c.selection.options.some(o => !o.attendu), tache.id).toBe(true);
            }
            expect(parfait(c), tache.id).toBe(100);
          }
        }
      }
      expect(nav.libre(plan.depart)).toBe(true);
      for (const [nom, point] of Object.entries(plan.stations)) {
        expect(nav.libre(point, .2), nom).toBe(true);
        const trajet = nav.chemin(plan.depart, point);
        expect(trajet.length, nom).toBeGreaterThan(0);
        const fin = trajet[trajet.length - 1];
        expect(Math.hypot(fin[0] - point[0], fin[1] - point[1]), nom).toBeLessThan(.2);
      }
    });
  }
  it('affiche la bonne réponse des situations à des rangs variés', () => {
    const situations = Object.values(LIEUX_PROGRAMME).flatMap(({ programme }) => programme.etapes.flatMap(e => e.taches.map(t => t.contenu(0))))
      .flatMap(c => c.type === 'situation' ? [c.situation] : []);
    const rangs = [0, 0, 0];
    for (const s of situations) rangs[ordreChoix(s).findIndex(i => s.choix[i].correct)]++;
    for (const n of rangs) expect(n, rangs.join(' / ')).toBeGreaterThan(situations.length / 6);
  });
  it('fait varier les chiffres d’une campagne à l’autre, avec des bétons conformes et non conformes', () => {
    const tableaux = [0, 1, 2, 3].map(tableauLaboratoire);
    expect(new Set(tableaux.map(t => t.affaissement)).size).toBe(4);
    expect(tableaux.map(t => t.conforme)).toEqual([true, false, true, false]);
    // Section d'une éprouvette de 16 cm et résistance à 7 jours de la première campagne.
    expect(contenuTache(LAB, { etape: 0, cycle: 0 }, 'section')).toMatchObject({ mesure: { reponse: expect.closeTo(201.06, 1) } });
    expect(contenuTache(LAB, { etape: 3, cycle: 0 }, 'fc7')).toMatchObject({ mesure: { reponse: expect.closeTo(18.9, 1) } });
  });
  it('calcule la commande du dépôt et signale la surcharge quand il le faut', () => {
    expect(commande(0)).toMatchObject({ sacs: 40, barres: 100, agglos: 250, montant: 1_074_250 });
    expect(commande(0).masse).toBeCloseTo(7565.6, 0);
    expect([0, 1, 2, 3].map(c => commande(c).masse > CHARGE_UTILE)).toEqual([false, false, true, false]);
  });
});

describe('correction des tâches', () => {
  const mesure = { titre: 't', enonce: 'e', donnees: [], question: 'q', unite: 'MPa', reponse: 18.9, tolerance: .25, explication: 'x' };
  it('accepte une mesure dans la tolérance, à moitié à moins du double', () => {
    expect(scoreMesure(mesure, 19.1)).toBe(100);
    expect(scoreMesure(mesure, 19.3)).toBe(50);
    expect(scoreMesure(mesure, 21)).toBe(0);
    expect(scoreMesure(mesure, Number.NaN)).toBe(0);
    expect(lireNombre('18,9')).toBe(18.9);
    expect(lireNombre('1 074 250')).toBe(1074250);
    expect(lireNombre('−25'.replace('−', '-'))).toBe(-25);
  });
  it('retire un point par intrus coché dans une sélection', () => {
    const t = { titre: 't', enonce: 'e', consigne: 'c', options: [
      { texte: 'a', attendu: true, explication: '' }, { texte: 'b', attendu: true, explication: '' }, { texte: 'c', attendu: false, explication: '' }, { texte: 'd', attendu: false, explication: '' },
    ] };
    expect(scoreSelection(t, [0, 1])).toBe(100);
    expect(scoreSelection(t, [0])).toBe(50);
    expect(scoreSelection(t, [0, 1, 2])).toBe(50);
    expect(scoreSelection(t, [2, 3])).toBe(0);
  });
});

describe('séances et progression', () => {
  it('fait les tâches de l’étape dans n’importe quel ordre, une seule fois chacune', () => {
    const s = nouvelleSeance(LAB, PROGRES_INITIAL);
    expect(s).toMatchObject({ slug: 'laboratoire', cycle: 0, etape: 0 });
    expect(s.taches.map(t => t.id)).toEqual(['tracabilite', 'transport', 'section']);
    expect(tacheALaZoneLieu(s, 'bureau')?.id).toBe('section');
    const apres = noter(s, 'section', 100);
    expect(tachesRestantes(apres).map(t => t.id)).toEqual(['tracabilite', 'transport']);
    expect(noter(apres, 'section', 0)).toBe(apres);
    expect(noter(apres, 'inconnue', 100)).toBe(apres);
    expect(seanceFaite(faire(s))).toBe(true);
  });
  it('note la séance et valide l’étape au-dessus de 40', () => {
    expect(bilanSeance(faire(nouvelleSeance(LAB, PROGRES_INITIAL)))).toMatchObject({ note: 100, compte: true, mention: 'Séance exemplaire', paie: 2000, xp: 50 });
    expect(bilanSeance(faire(nouvelleSeance(LAB, PROGRES_INITIAL), 0))).toMatchObject({ note: 10, compte: false, mention: 'Séance à reprendre', paie: 0, xp: 2 });
  });
  it('avance d’une étape, clôt le cycle à la dernière, puis recommence avec d’autres chiffres', () => {
    const maintenant = 1_000_000;
    let progres = PROGRES_INITIAL;
    for (let i = 0; i < LAB.etapes.length; i++) {
      const s = faire(nouvelleSeance(LAB, progres));
      expect(s.etape).toBe(i);
      progres = appliquerSeance(LAB, progres, s, bilanSeance(s), 16, maintenant);
    }
    expect(progres).toMatchObject({ etapes: LAB.etapes.length, cycles: 1, seances: LAB.etapes.length });
    expect(prochaineEtape(LAB, progres)).toBe(0);
    expect(nouvelleSeance(LAB, progres).cycle).toBe(1);
    // Une séance ratée laisse l'étape à refaire.
    const ratee = faire(nouvelleSeance(LAB, PROGRES_INITIAL), 0);
    expect(appliquerSeance(LAB, PROGRES_INITIAL, ratee, bilanSeance(ratee), 16, maintenant).etapes).toBe(0);
  });
  it('ouvre aux horaires du lieu, une séance par jour de jeu, et relit une sauvegarde abîmée', () => {
    const maintenant = 1_000_000, repos = { ...PROGRES_INITIAL, repos: { heure: 16, le: maintenant } };
    expect(seanceDisponible(LAB, PROGRES_INITIAL, 6.5, maintenant)).toBe(false);
    expect(seanceDisponible(LAB, PROGRES_INITIAL, 9, maintenant)).toBe(true);
    expect(enReposLieu(repos, 16.5, maintenant + 60_000)).toBe(true);
    expect(enReposLieu(repos, 8, maintenant + 60_000)).toBe(false);
    expect(fusionnerProgres(LAB, repos, { etapes: 5, cycles: 2, seances: 12, derniereRecompenseLe: null })).toEqual({ ...repos, etapes: 5, cycles: 2, seances: 12 });
    expect(fusionnerProgres(LAB, repos, { etapes: 99, cycles: 0, seances: 0, derniereRecompenseLe: null }).etapes).toBe(LAB.etapes.length);
    expect(fusionnerProgres(LAB, repos, undefined)).toBe(repos);
    expect(lireProgresLieu(LAB, null)).toEqual(PROGRES_INITIAL);
    expect(lireProgresLieu(LAB, { version: 1, etapes: 99, seances: -1, cycles: 2, repos: { heure: 'x' } })).toEqual({ version: 1, etapes: LAB.etapes.length, seances: 0, cycles: 2, repos: null });
  });
  it('compte autant d’étapes que le serveur (ETAPES_LIEUX, backend/src/carriere/lieux.service.ts)', () => {
    expect(Object.fromEntries(Object.entries(LIEUX_PROGRAMME).map(([slug, { programme }]) => [slug, programme.etapes.length]))).toEqual({
      laboratoire: 7, fournisseur: 5, mairie: 6, banque: 5, agence: 5, 'bureau-etudes': 6, atelier: 5, logistique: 5, entreprise: 5,
      'jardins-residence': 5, 'construction-nord': 5,
    });
  });
  it('relie chaque service de lieu à une station de son plan', () => {
    for (const [slug, { plan, services }] of Object.entries(LIEUX_PROGRAMME)) for (const service of services ?? []) {
      expect(plan.stations[service.station], `${slug}/${service.station}`).toBeDefined();
      expect(plan.libelles[service.station], `${slug}/${service.station}`).toBeDefined();
      expect(LIEUX_PROGRAMME[slug].programme.etapes.flatMap(e => e.taches).some(t => t.zone === service.station), `${slug}/${service.station} ne doit pas servir aux tâches`).toBe(false);
    }
  });
});
