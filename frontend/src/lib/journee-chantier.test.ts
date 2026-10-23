import { describe, expect, it } from 'vitest';
import {
  appliquerJournee, bilanJournee, CHANTIER_QUARTIER_INITIAL, enregistrerRecrutement, enRepos, etapeSimulateur, etatVisuelSimulateur, evenementsDuJour, journeeDisponible,
  lireChantierQuartier, nouvelleJournee, phaseJournee, postesChantier, prochainJour, repondre, situation, tacheALaZone, tachesDisponibles, type ChantierQuartier, type Journee,
} from './journee-chantier';
import { candidats, etatVisuel, TOTAL_JOURS, type Metier } from './programme-chantier';
import { planChantier } from './plan-chantier';

const GROS_OEUVRE: Metier[] = ['Chef d’équipe', 'Maçon', 'Manœuvre', 'Ferrailleur', 'Coffreur'];
const equipe = candidats(1, GROS_OEUVRE).filter(o => o.id.endsWith('-q'));
const bonne = (id: string) => situation(id)!.choix.findIndex(c => c.correct);
const mauvaise = (id: string) => situation(id)!.choix.findIndex(c => !c.correct);
const toutJuste = (j: Journee) => { for (const t of j.taches) j = t.type === 'recrutement' ? enregistrerRecrutement(j, 1) : repondre(j, t.id, bonne(t.id)); return j; };
const toutFaux = (j: Journee) => { for (const t of j.taches) j = t.type === 'recrutement' ? enregistrerRecrutement(j, 0) : repondre(j, t.id, mauvaise(t.id)); return j; };
const chantier = (jours: number): ChantierQuartier => ({ ...CHANTIER_QUARTIER_INITIAL, jours, equipe });

describe('journée de travail', () => {
  it('commence le premier jour par l’équipement puis le recrutement de l’équipe de gros œuvre', () => {
    const j = nouvelleJournee(CHANTIER_QUARTIER_INITIAL);
    expect(j).toMatchObject({ numero: 0, etape: 'recrutement', jourEtape: 1, recrutement: GROS_OEUVRE });
    expect(j.taches.map(t => t.type)).toEqual(['epi', 'recrutement']);
    expect(phaseJournee(j)).toBe('epi');
    expect(tacheALaZone(j, 'bureau')).toBeNull();
    const equipee = repondre(j, 'epi', bonne('epi'));
    expect(tacheALaZone(equipee, 'bureau')?.type).toBe('recrutement');
    expect(phaseJournee(enregistrerRecrutement(equipee, .9))).toBe('bilan');
    // La meilleure équipe possible (vers 0,97) vaut la totalité des points ; une équipe à revoir, beaucoup moins.
    expect(bilanJournee(enregistrerRecrutement(equipee, .97)).note).toBe(100);
    expect(bilanJournee(enregistrerRecrutement(equipee, .6)).note).toBe(74);
  });
  it('donne les travaux de l’étape, différents d’un jour à l’autre, et la livraison le premier jour', () => {
    const j1 = nouvelleJournee(chantier(4)), j2 = nouvelleJournee(chantier(5));
    expect(j1).toMatchObject({ etape: 'semelles', jourEtape: 1, livraison: 'fers', recrutement: [] });
    expect(j2).toMatchObject({ etape: 'semelles', jourEtape: 2, livraison: null });
    const travaux = (j: Journee) => j.taches.filter(t => t.type === 'travail').map(t => t.id);
    expect(travaux(j1)).toEqual(['proprete', 'cales']);
    expect(travaux(j2)).toEqual(['attentes', 'vibration']);
    expect(j1.taches.some(t => t.type === 'securite')).toBe(true);
    // Une étape d'un seul jour regroupe ses trois travaux.
    expect(travaux(nouvelleJournee(chantier(1)))).toEqual(['chaises', 'equerre', 'niveau']);
  });
  it('fait recruter les métiers manquants avant de travailler', () => {
    const j = nouvelleJournee(chantier(14));
    expect(j.etape).toBe('finitions');
    expect(j.recrutement).toEqual(['Électricien', 'Plombier', 'Carreleur', 'Peintre']);
    let suite = repondre(j, 'epi', bonne('epi'));
    expect(tachesDisponibles(suite).map(t => t.type)).toEqual(['recrutement']);
    suite = enregistrerRecrutement(suite, 1);
    expect(phaseJournee(suite)).toBe('travaux');
    expect(tachesDisponibles(suite).length).toBeGreaterThanOrEqual(3);
  });
  it('laisse faire les travaux dans n’importe quel ordre, puis le bilan', () => {
    let j = repondre(nouvelleJournee(chantier(2)), 'epi', bonne('epi'));
    const [a, b, ...reste] = tachesDisponibles(j);
    j = repondre(j, b.id, bonne(b.id));
    expect(tachesDisponibles(j).map(t => t.id)).toEqual([a, ...reste].map(t => t.id));
    for (const t of [a, ...reste]) j = repondre(j, t.id, bonne(t.id));
    expect(phaseJournee(j)).toBe('bilan');
    // Une réponse donnée ne se change pas.
    expect(repondre(j, 'epi', mauvaise('epi'))).toBe(j);
  });
  it('note la journée sur 100 et réserve « Journée exemplaire » au sans-faute', () => {
    expect(bilanJournee(toutJuste(nouvelleJournee(chantier(4))))).toMatchObject({ note: 100, compte: true, mention: 'Journée exemplaire', paie: 7000, xp: 80 });
    let j = nouvelleJournee(chantier(4));
    const [epi, premiere, ...autres] = j.taches;
    j = repondre(repondre(j, epi.id, bonne(epi.id)), premiere.id, mauvaise(premiere.id));
    for (const t of autres) j = repondre(j, t.id, bonne(t.id));
    expect(bilanJournee(j)).toMatchObject({ note: 83, compte: true, mention: 'Bonne journée' });
    expect(bilanJournee(toutFaux(nouvelleJournee(chantier(4))))).toMatchObject({ note: 10, compte: false, mention: 'Journée à revoir' });
  });
});

describe('chantier du quartier', () => {
  const maintenant = 1_000_000;
  it('avance d’une journée quand le travail est validé, et garde les recrues', () => {
    const j = toutJuste(nouvelleJournee(CHANTIER_QUARTIER_INITIAL));
    const apres = appliquerJournee(CHANTIER_QUARTIER_INITIAL, j, bilanJournee(j), equipe, 17, maintenant);
    expect(apres).toMatchObject({ jours: 1, journees: 1, repos: { heure: 17 } });
    expect(apres.equipe).toHaveLength(5);
    expect(nouvelleJournee(apres)).toMatchObject({ etape: 'implantation', recrutement: [] });
  });
  it('fait refaire une journée ratée', () => {
    const j = toutFaux(nouvelleJournee(chantier(2)));
    expect(appliquerJournee(chantier(2), j, bilanJournee(j), [], 17, maintenant)).toMatchObject({ jours: 2, journees: 1 });
  });
  it('livre l’ouvrage puis en démarre un autre, à l’implantation si l’équipe est au complet', () => {
    const j = toutJuste(nouvelleJournee(chantier(TOTAL_JOURS - 1)));
    const livre = appliquerJournee(chantier(TOTAL_JOURS - 1), j, bilanJournee(j), [], 17, maintenant);
    expect(livre).toMatchObject({ jours: TOTAL_JOURS, livraisons: 1 });
    expect(etatVisuel(livre.jours).etape).toBe('livre');
    expect(prochainJour(livre)).toBe(1);
    expect(prochainJour({ ...livre, equipe: [] })).toBe(0);
  });
  it('ouvre de 6 h à 18 h, une journée par jour de jeu', () => {
    expect(journeeDisponible(CHANTIER_QUARTIER_INITIAL, 5.5, maintenant)).toBe(false);
    expect(journeeDisponible(CHANTIER_QUARTIER_INITIAL, 9, maintenant)).toBe(true);
    expect(journeeDisponible(CHANTIER_QUARTIER_INITIAL, 18.2, maintenant)).toBe(false);
    const repos = { repos: { heure: 17, le: maintenant } };
    expect(enRepos(repos, 22, maintenant + 60_000)).toBe(true);
    // L'horloge a repassé minuit, ou la partie reprend bien plus tard.
    expect(enRepos(repos, 2, maintenant + 60_000)).toBe(false);
    expect(enRepos(repos, 20, maintenant + 31 * 60_000)).toBe(false);
  });
  it('relit une sauvegarde abîmée, ou celle de l’ancienne journée qui repart au début du programme', () => {
    expect(lireChantierQuartier(null)).toEqual(CHANTIER_QUARTIER_INITIAL);
    expect(lireChantierQuartier({ avancement: 60, journees: 3, livraisons: 1, repos: { heure: 17, le: 5 } })).toEqual({ ...CHANTIER_QUARTIER_INITIAL, journees: 3, livraisons: 1, repos: { heure: 17, le: 5 } });
    expect(lireChantierQuartier({ version: 2, jours: 99, journees: -2, equipe: [equipe[0], { nom: 'X' }] })).toMatchObject({ jours: TOTAL_JOURS, journees: 0, equipe: [equipe[0]] });
  });
  it('place Yao et l’entrée du chantier devant le portail', () => {
    const p = postesChantier([31, 22], 21, 15);
    expect(p.yao[1]).toBeGreaterThan(22 + 7.5);
    expect(p.entree[1]).toBeGreaterThan(22 + 7.5);
  });
});

describe('chantier du simulateur', () => {
  const chantierSimule = { id: 'c1', statut: 'en_cours', phaseCourante: 1, avancementPct: 30, avancementPhases: { '1': 40 }, chantier: { nom: 'Villa R+1', phases: [{ nom: 'Fondations renforcées' }, { nom: 'Rez-de-chaussée' }, { nom: 'Dalle intermédiaire' }] } };
  it('rapproche la phase en cours d’une étape du programme et en donne les tâches', () => {
    expect(etapeSimulateur(chantierSimule)).toMatchObject({ etape: 'elevation', jourEtape: 1, joursEtape: 2 });
    expect(etatVisuelSimulateur(chantierSimule)).toMatchObject({ etape: 'elevation', nom: 'Rez-de-chaussée', progression: .4, avancement: 30 });
    expect(etatVisuelSimulateur({ ...chantierSimule, statut: 'termine' }).etape).toBe('livre');
    // L'équipe du vrai chantier se gère dans le simulateur : pas de recrutement ici.
    expect(nouvelleJournee(CHANTIER_QUARTIER_INITIAL, etapeSimulateur(chantierSimule))).toMatchObject({ etape: 'elevation', recrutement: [] });
    expect(evenementsDuJour({ evenementsLog: [{ jour: 1, type: 'travail', texte: 'a' }, { jour: 2, type: 'meteo', texte: 'b' }, { jour: 2, type: 'travail', texte: 'c' }] }).map(e => e.texte)).toEqual(['b', 'c']);
  });
});

describe('ouvrage en construction', () => {
  const plan = (jours: number) => planChantier(etatVisuel(jours));
  it('montre chaque étape : chaises et cordeaux, fouilles, semelles, murs, dalle étayée, étage, toiture, finitions', () => {
    const terrain = plan(0), implantation = plan(1), fouilles = plan(3), semelles = plan(5), soubassement = plan(6), murs = plan(8), dalle = plan(10), etage = plan(12), toit = plan(13), finitions = plan(16), livre = plan(18);
    expect(implantation.structure.length).toBeGreaterThan(terrain.structure.length);
    expect(fouilles.structure.some(b => b.couleur === '#5E4A38')).toBe(true);
    expect(implantation.structure.some(b => b.couleur === '#5E4A38')).toBe(false);
    expect(semelles.structure.some(b => b.couleur === '#B7B2A6')).toBe(true);
    expect(murs.hauteurTravail).toBeGreaterThan(soubassement.hauteurTravail);
    expect(murs.echafaudage.length).toBeGreaterThan(0);
    expect(dalle.structure.some(b => b.couleur === '#C9A13B')).toBe(true);
    expect(etage.structure.some(b => b.couleur === '#C9A13B')).toBe(false);
    expect(etage.hauteurTravail).toBeGreaterThan(murs.hauteurTravail);
    expect(toit.hauteurTravail).toBeGreaterThan(etage.hauteurTravail);
    expect(finitions.vitres.length).toBeGreaterThan(0);
    expect(livre.echafaudage).toHaveLength(0);
    expect(livre.vitres.length).toBeGreaterThan(0);
  });
});
