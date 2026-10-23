import { describe, expect, it } from 'vitest';
import {
  appliquerJournee, bilanJournee, CHANTIER_QUARTIER_INITIAL, enRepos, etatVisuel, etatVisuelSimulateur, evenementsDuJour, journeeDisponible,
  lireChantierQuartier, nouvelleJournee, phaseDepuisNom, postesRestants, repondre, situation, situationAuPoste, SITUATION_EPI,
} from './journee-chantier';
import { planChantier } from './plan-chantier';

const bonne = (id: string) => situation(id)!.choix.findIndex(c => c.correct);
const mauvaise = (id: string) => situation(id)!.choix.findIndex(c => !c.correct);

describe('phases du chantier', () => {
  it('découpe l’avancement global en phases visibles', () => {
    expect(etatVisuel(0).phase).toBe('terrain');
    expect(etatVisuel(20)).toMatchObject({ phase: 'fondations', progression: .25 });
    expect(etatVisuel(70).phase).toBe('toiture');
    expect(etatVisuel(100).phase).toBe('livre');
    expect(etatVisuel(Number.NaN).phase).toBe('terrain');
  });
  it('reconnaît les phases du simulateur par leur nom', () => {
    expect(phaseDepuisNom('Terrassement et implantation')).toBe('terrain');
    expect(phaseDepuisNom('Gros œuvre')).toBe('elevation');
    expect(phaseDepuisNom('Charpente et couverture')).toBe('toiture');
    expect(phaseDepuisNom('Second œuvre')).toBe('finitions');
    expect(phaseDepuisNom('Réception administrative')).toBeNull();
  });
  it('montre la phase en cours d’un chantier du simulateur', () => {
    const chantier = { id: 'c1', statut: 'en_cours', phaseCourante: 1, avancementPct: 30, avancementPhases: { '1': 40 }, chantier: { nom: 'Villa R+1', phases: [{ nom: 'Terrassement' }, { nom: 'Fondations' }, { nom: 'Gros œuvre' }] } };
    expect(etatVisuelSimulateur(chantier)).toMatchObject({ phase: 'fondations', nom: 'Fondations', progression: .4, avancement: 30 });
    expect(etatVisuelSimulateur({ ...chantier, statut: 'termine' }).phase).toBe('livre');
    expect(evenementsDuJour({ evenementsLog: [{ jour: 1, type: 'travail', texte: 'a' }, { jour: 2, type: 'meteo', texte: 'b' }, { jour: 2, type: 'travail', texte: 'c' }] }).map(e => e.texte)).toEqual(['b', 'c']);
  });
});

describe('journée de travail', () => {
  it('enchaîne équipement, sécurité, livraison puis bilan', () => {
    let j = nouvelleJournee(4);
    expect(new Set(j.securite).size).toBe(3);
    expect(situationAuPoste(j, 'bungalow')?.id).toBe(SITUATION_EPI.id);
    expect(situationAuPoste(j, 'livraison')).toBeNull();
    j = repondre(j, 'epi', bonne('epi'));
    expect(j.etape).toBe('securite');
    expect(postesRestants(j)).toEqual(['securite-0', 'securite-1', 'securite-2']);
    j = repondre(j, j.securite[1], bonne(j.securite[1]));
    expect(situationAuPoste(j, 'securite-1')).toBeNull();
    expect(postesRestants(j)).toEqual(['securite-0', 'securite-2']);
    j = repondre(j, j.securite[0], mauvaise(j.securite[0]));
    j = repondre(j, j.securite[2], bonne(j.securite[2]));
    expect(j.etape).toBe('livraison');
    j = repondre(j, j.livraison, bonne(j.livraison));
    expect(j.etape).toBe('bilan');
    // Une réponse donnée ne se change pas.
    expect(repondre(j, 'epi', mauvaise('epi'))).toBe(j);
    expect(bilanJournee(j)).toMatchObject({ bonnes: 4, total: 5, note: 85, mention: 'Bonne journée', avancement: 18, paie: 6400, xp: 71 });
  });
  it('réserve « Journée exemplaire » au sans-faute', () => {
    let j = nouvelleJournee(2);
    for (const id of ['epi', ...j.securite, j.livraison]) j = repondre(j, id, bonne(id));
    expect(bilanJournee(j)).toMatchObject({ bonnes: 5, total: 5, note: 100, mention: 'Journée exemplaire' });
  });
  it('varie les situations d’une journée à l’autre', () => {
    expect(nouvelleJournee(0).securite).not.toEqual(nouvelleJournee(1).securite);
    expect(nouvelleJournee(0).livraison).not.toBe(nouvelleJournee(1).livraison);
  });
  it('donne une note minimale de présence même sans bonne réponse', () => {
    let j = nouvelleJournee(0);
    for (const id of ['epi', ...j.securite, j.livraison]) j = repondre(j, id, mauvaise(id));
    expect(bilanJournee(j)).toMatchObject({ note: 10, bonnes: 0, avancement: 9, mention: 'Journée à revoir' });
  });
});

describe('chantier du quartier', () => {
  const maintenant = 1_000_000;
  it('ouvre de 6 h à 18 h, une journée par jour de jeu', () => {
    expect(journeeDisponible(CHANTIER_QUARTIER_INITIAL, 5.5, maintenant)).toBe(false);
    expect(journeeDisponible(CHANTIER_QUARTIER_INITIAL, 9, maintenant)).toBe(true);
    expect(journeeDisponible(CHANTIER_QUARTIER_INITIAL, 18.2, maintenant)).toBe(false);
    const apres = appliquerJournee(CHANTIER_QUARTIER_INITIAL, 15, 17, maintenant);
    expect(apres).toMatchObject({ avancement: 39, journees: 1, repos: { heure: 17 } });
    expect(enRepos(apres, 22, maintenant + 60_000)).toBe(true);
    // L'horloge a repassé minuit : la journée suivante peut commencer à 6 h.
    expect(enRepos(apres, 2, maintenant + 60_000)).toBe(false);
    expect(journeeDisponible(apres, 7, maintenant + 60_000)).toBe(true);
    // Partie reprise bien plus tard, même à une heure plus avancée.
    expect(enRepos(apres, 20, maintenant + 31 * 60_000)).toBe(false);
  });
  it('livre l’ouvrage puis en recommence un autre', () => {
    const presque = { ...CHANTIER_QUARTIER_INITIAL, avancement: 95 };
    const livre = appliquerJournee(presque, 12, 17, maintenant);
    expect(livre).toMatchObject({ avancement: 100, livraisons: 1 });
    expect(appliquerJournee(livre, 12, 17, maintenant).avancement).toBe(12);
  });
  it('relit une sauvegarde locale abîmée sans planter', () => {
    expect(lireChantierQuartier(null)).toEqual(CHANTIER_QUARTIER_INITIAL);
    expect(lireChantierQuartier({ avancement: 250, journees: -3, repos: { heure: 'x' } })).toMatchObject({ avancement: 100, journees: 0, repos: null });
  });
});

describe('ouvrage en construction', () => {
  it('monte avec l’avancement et perd son échafaudage à la livraison', () => {
    const terrain = planChantier(etatVisuel(5)), murs = planChantier(etatVisuel(55)), toit = planChantier(etatVisuel(80)), livre = planChantier(etatVisuel(100));
    expect(terrain.echafaudage).toHaveLength(0);
    expect(murs.structure.length).toBeGreaterThan(terrain.structure.length);
    expect(murs.echafaudage.length).toBeGreaterThan(0);
    expect(toit.hauteurTravail).toBeGreaterThan(murs.hauteurTravail);
    expect(livre.echafaudage).toHaveLength(0);
    expect(livre.vitres.length).toBeGreaterThan(0);
  });
});
