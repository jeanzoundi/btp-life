import { describe, expect, it } from 'vitest';
import { appliquerArticle, articleTropFatigant, articleUtile, lieuVieOuvert, prixArticle } from './lieux-vie';
import { AZUR } from './lieux-vie/azur';
import { CAFE, conseilsObtenus, conversationDu, niveauRelation, POINTS_RELATION, PROFESSIONNELS } from './lieux-vie/cafe';
import { BOUTIQUE_DE, BOUTIQUES, GALERIE } from './lieux-vie/galerie';
import { COLLEGUES_PRESENTS, MAQUIS, NOUVELLES, nouvelleDuRepas } from './lieux-vie/maquis';
import { ETALS, MARCHE, proposer, seuilVendeuse } from './lieux-vie/marche';
import { ARTICLES_MAISON } from './lieux-vie/maison';
import { MARINA, PONTONS, STATION_MARINA, surLeTour, TOUR_PIROGUE } from './lieux-vie/marina';
import { butMarque, coinAdverse, issueTirs, PARCOURS_MATCH, scoreDuMatch, SPORT, STATION_SPORT, TOUR_FOOTING } from './lieux-vie/sport';
import { creerNavigation, type Point } from './navigation-plan';

const PLEIN = { energie: 100, faim: 100, social: 100, moral: 100, hygiene: 100, divertissement: 100 };
const LIEUX = [MAQUIS, CAFE, MARCHE, MARINA, SPORT, AZUR, GALERIE];

describe('lieux de vie', () => {
  for (const lieu of LIEUX) {
    it(`${lieu.slug} : chaque poste est libre et accessible depuis l’entrée`, () => {
      const nav = creerNavigation(lieu.plan);
      expect(nav.libre(lieu.plan.depart)).toBe(true);
      for (const [nom, point] of Object.entries(lieu.plan.stations)) {
        expect(nav.libre(point, .2), nom).toBe(true);
        const trajet = nav.chemin(lieu.plan.depart, point);
        expect(trajet.length, nom).toBeGreaterThan(0);
        expect(Math.hypot(trajet.at(-1)![0] - point[0], trajet.at(-1)![1] - point[1]), nom).toBeLessThan(.2);
      }
    });
  }
  it('garde la carte du serveur (CARTE, backend/src/carriere/besoins.service.ts) : mêmes articles, mêmes prix, mêmes actions', () => {
    const carte = Object.fromEntries(LIEUX.flatMap(l => l.carte).map(a => [a.id, `${a.action} ${a.prix}`]));
    expect(carte).toEqual({
      garba: 'repas 1000', 'alloco-poisson': 'repas 1500', 'attieke-carpe': 'repas 2500', 'foutou-graine': 'repas 3000', 'poulet-braise': 'repas 3500', bissap: 'repas 300', gingembre: 'repas 300',
      'cafe-noir': 'social 300', 'the-menthe': 'social 300', 'jus-passion': 'social 500', 'cafe-croissant': 'social 900', tournee: 'social 2500',
      mangues: 'repas 300', ananas: 'repas 500', 'banane-braisee': 'repas 500', choukouya: 'repas 1500', 'panier-fruits': 'repas 2000',
      coco: 'repas 500', 'brochettes-crevettes': 'repas 3000', pirogue: 'social 2000',
      'match-foot': 'social 500', musculation: 'social 1000', footing: 'social 300', 'jus-buvette': 'repas 300',
      shawarma: 'repas 2000', 'cocktail-fruits': 'repas 1200', glace: 'repas 1000',
      coiffure: 'social 1500', 'credit-telephone': 'social 500', pressing: 'social 1000', patisserie: 'repas 800',
    });
    expect(LIEUX.flatMap(l => l.carte).filter(a => a.moralPrincipal).map(a => a.id).sort()).toEqual(['coiffure', 'footing', 'match-foot', 'musculation', 'pirogue', 'pressing']);
  });
  it('chez soi, cuisiner et recevoir coûtent les prix du serveur, moins chers qu’au maquis et au café ; télé et sieste sont gratuites', () => {
    expect(ARTICLES_MAISON.map(a => `${a.id} ${a.action} ${a.prix}`)).toEqual(['cuisine-maison repas 600', 'voisin-maison social 700', 'tele-maison divertissement 0', 'sieste-maison repos 0']);
    expect(ARTICLES_MAISON[0].prix).toBeLessThan(MAQUIS.carte.find(a => a.id === 'garba')!.prix);
    expect(Object.fromEntries(ARTICLES_MAISON.map(a => [a.id, a.effets]))).toEqual({
      'cuisine-maison': { faim: 55 }, 'voisin-maison': { social: 35, divertissement: 10 }, 'tele-maison': { divertissement: 30 }, 'sieste-maison': { energie: 35 },
    });
  });
  it('garde les effets d’hygiène et de divertissement du serveur : le sport fait transpirer, les loisirs amusent', () => {
    const effets = (cle: 'hygiene' | 'divertissement') => Object.fromEntries(LIEUX.flatMap(l => l.carte).filter(a => a.effets[cle] !== undefined).map(a => [a.id, a.effets[cle]]));
    expect(effets('hygiene')).toEqual({ 'match-foot': -25, musculation: -20, footing: -15, coiffure: 30, pressing: 20 });
    expect(effets('divertissement')).toEqual({
      'poulet-braise': 10, tournee: 20, coco: 5, 'brochettes-crevettes': 10, pirogue: 45, 'match-foot': 35, musculation: 10, footing: 10, glace: 10, 'credit-telephone': 10,
    });
  });
  it('le sport fatigue mais remonte le moral ; à bout de forces, il est refusé', () => {
    const match = SPORT.carte.find(a => a.id === 'match-foot')!;
    // Le match fait aussi transpirer et amuse (hygiène −25, divertissement +35), comme au serveur.
    expect(appliquerArticle({ energie: 60, faim: 50, social: 40, moral: 50, hygiene: 60, divertissement: 40 }, match, { victoire: true })).toEqual({ energie: 40, faim: 50, social: 80, moral: 62, hygiene: 35, divertissement: 75 });
    expect(articleTropFatigant({ ...PLEIN, energie: 10 }, SPORT.carte.find(a => a.id === 'musculation')!)).toBe(true);
    // Transpirer n'est jamais refusé : l'hygiène s'arrête simplement à 0.
    expect(articleTropFatigant({ ...PLEIN, hygiene: 5 }, SPORT.carte.find(a => a.id === 'musculation')!)).toBe(false);
    expect(articleUtile({ ...PLEIN, moral: 80 }, SPORT.carte.find(a => a.id === 'musculation')!)).toBe(true);
  });
  it('applique un article comme le serveur : points ajoutés jusqu’à 100, bonus de la tablée pour un repas', () => {
    const avant = { energie: 60, faim: 30, social: 50, moral: 50, hygiene: 70, divertissement: 70 };
    const garba = MAQUIS.carte.find(a => a.id === 'garba')!, cafe = CAFE.carte.find(a => a.id === 'cafe-noir')!;
    expect(appliquerArticle(avant, garba)).toEqual({ ...avant, faim: 80, moral: 51 });
    expect(appliquerArticle(avant, garba, { tablee: true })).toEqual({ ...avant, faim: 80, social: 70, moral: 53 });
    expect(appliquerArticle(avant, cafe, { tablee: true })).toEqual({ ...avant, energie: 75, social: 60, moral: 51 });
    expect(appliquerArticle({ ...avant, faim: 90 }, MAQUIS.carte.find(a => a.id === 'foutou-graine')!).faim).toBe(100);
    expect(articleUtile(PLEIN, garba)).toBe(false);
    expect(articleUtile({ ...PLEIN, social: 50 }, garba, { tablee: true })).toBe(true);
  });
  it('ouvre aux horaires du lieu ; les collègues mangent à midi et après le travail', () => {
    expect(lieuVieOuvert(MAQUIS, 9.5)).toBe(false);
    expect(lieuVieOuvert(MAQUIS, 22.5)).toBe(true);
    expect(lieuVieOuvert(CAFE, 21)).toBe(false);
    expect([10, 12, 15, 18, 22.5].map(COLLEGUES_PRESENTS)).toEqual([false, true, false, true, false]);
  });
  it('raconte une nouvelle par repas, qui mène quelque part ; la fatigue passe avant tout', () => {
    expect(new Set(NOUVELLES.map(n => n.lieu)).size).toBe(NOUVELLES.length);
    expect(nouvelleDuRepas({ energie: 80 }, 0)).toBe(NOUVELLES[0]);
    expect(nouvelleDuRepas({ energie: 80 }, NOUVELLES.length + 2)).toBe(NOUVELLES[2]);
    expect(nouvelleDuRepas({ energie: 20 }, 3).lieu).toBe('residence');
  });
});

describe('le marchandage', () => {
  it('chaque article du marché a son étal, et seul le marché se marchande', () => {
    expect(MARCHE.carte.map(a => a.id).sort()).toEqual(Object.values(ETALS).flatMap(e => e.articles).sort());
    expect(MARCHE.carte.every(a => a.marchandable)).toBe(true);
    expect(LIEUX.filter(l => l !== MARCHE).flatMap(l => l.carte).some(a => a.marchandable)).toBe(false);
  });
  it('saluer d’abord et venir en fin de journée font baisser le prix ; trop demander fâche', () => {
    expect([seuilVendeuse(false, 10), seuilVendeuse(true, 10), seuilVendeuse(true, 18)].map(s => Math.round(s * 100))).toEqual([5, 15, 20]);
    expect(proposer(.1, seuilVendeuse(true, 10))).toEqual({ issue: 'accepte', remise: .1 });
    expect(proposer(.2, seuilVendeuse(true, 10))).toMatchObject({ issue: 'contre' });
    expect(proposer(.2, seuilVendeuse(true, 10)).remise).toBeCloseTo(.15);
    expect(proposer(.35, seuilVendeuse(true, 10))).toEqual({ issue: 'refuse', remise: 0 });
    expect(proposer(.35, seuilVendeuse(true, 18)).issue).toBe('contre');
  });
  it('arrondit le prix marchandé aux 25 F, et ne remise jamais au-delà de 20 %', () => {
    const choukouya = MARCHE.carte.find(a => a.id === 'choukouya')!;
    expect(prixArticle(choukouya, .15)).toBe(1275);
    expect(prixArticle(choukouya, .5)).toBe(1200);
    expect(prixArticle(AZUR.carte[0], .2)).toBe(AZUR.carte[0].prix);
  });
});

describe('la pirogue et les tirs au but', () => {
  it('fait le tour du plan d’eau sur la lagune et revient à l’embarcadère', () => {
    const proche = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6;
    expect(proche(surLeTour(0).position, TOUR_PIROGUE[0])).toBe(true);
    expect(proche(surLeTour(1).position, TOUR_PIROGUE.at(-1)!)).toBe(true);
    for (let t = 0; t <= 1; t += .05) expect(surLeTour(t).position[1], `t=${t}`).toBeLessThan(-1.2);
  });
  it('décide les tirs au but : cinq chacun, puis mort subite', () => {
    expect(butMarque('gauche', 'droite')).toBe(true);
    expect(butMarque('centre', 'centre')).toBe(false);
    expect(issueTirs([true, true, true], [false, false, false])).toBe('nous');
    expect(issueTirs([true, true], [true])).toBeNull();
    expect(issueTirs([true, true, true, true, true], [true, true, true, true, true])).toBeNull();
    expect(issueTirs([true, true, true, true, true, true], [true, true, true, true, true, false])).toBe('nous');
    expect(issueTirs([false, false, false, true], [true, true, true, true])).toBe('eux');
    expect(new Set([0, 1, 2, 3, 4].map(m => coinAdverse(7, m))).size).toBeGreaterThan(1);
  });
  it('contourne les pontons : la coque (demi-largeur 0,5 m) ne touche jamais un ponton', () => {
    for (let t = 0; t <= 1; t += .005) {
      const [x, z] = surLeTour(t).position;
      for (const p of PONTONS) {
        const dx = Math.max(p.x1 - x, 0, x - p.x2), dz = Math.max(p.bout - z, 0, z + 1.2);
        expect(Math.hypot(dx, dz), `t=${t.toFixed(3)}`).toBeGreaterThanOrEqual(.55);
      }
    }
  });
  it('mène chaque service de la galerie à sa boutique, et chaque commande de la marina à son poste', () => {
    for (const a of GALERIE.carte) {
      expect(GALERIE.plan.stations[BOUTIQUE_DE[a.id]], a.id).toBeDefined();
      expect(BOUTIQUES[BOUTIQUE_DE[a.id]].pret, a.id).toBeTruthy();
    }
    for (const a of MARINA.carte) expect(MARINA.plan.stations[STATION_MARINA[a.id]], a.id).toBeDefined();
    for (const a of SPORT.carte.filter(x => x.id !== 'match-foot')) expect(SPORT.plan.stations[STATION_SPORT[a.id]], a.id).toBeDefined();
  });
});

describe('le complexe sportif', () => {
  const nav = creerNavigation(SPORT.plan);
  const parcourable = (depart: Point, points: Point[]) => {
    let depuis = depart;
    for (const p of points) {
      expect(nav.libre(p, .2), `${p}`).toBe(true);
      const trajet = nav.chemin(depuis, p);
      expect(trajet.length, `${depuis} → ${p}`).toBeGreaterThan(0);
      depuis = trajet.at(-1)!;
    }
  };
  it('fait le tour de piste du footing depuis la ligne de départ, et y revient', () => {
    parcourable(SPORT.plan.stations.piste, TOUR_FOOTING);
    expect(TOUR_FOOTING.at(-1)).toEqual(SPORT.plan.stations.piste);
  });
  it('fait courir le joueur sur le terrain pendant le match, puis le place au point de penalty', () => {
    parcourable(SPORT.plan.stations.terrain, [...PARCOURS_MATCH, [4.6, -6]]);
    for (const [x, z] of PARCOURS_MATCH) expect(Math.abs(x) < 9 && z < -1.2, `${x},${z}`).toBe(true);
  });
  it('mène 1 – 0, se fait rejoindre, et finit à 2 – 2 : les tirs au but départagent', () => {
    expect(scoreDuMatch(0)).toEqual([0, 0]);
    expect(scoreDuMatch(.3)).toEqual([1, 0]);
    expect(scoreDuMatch(.5)).toEqual([1, 1]);
    expect(scoreDuMatch(1)).toEqual([2, 2]);
  });
});

describe('le réseau du café', () => {
  it('chaque conversation a une seule bonne approche, et chaque professionnel trois conseils à débloquer', () => {
    for (const pro of PROFESSIONNELS) {
      expect(pro.conseils.map(x => x.seuil), pro.nom).toEqual([30, 60, 90]);
      for (const s of pro.conversations) {
        expect(s.choix, s.id).toHaveLength(3);
        expect(s.choix.filter(x => x.correct), s.id).toHaveLength(1);
      }
    }
  });
  it('change de sujet à chaque bonne approche, reprend le même après un faux pas', () => {
    const pro = PROFESSIONNELS[0];
    expect(conversationDu(pro, 0)).toBe(pro.conversations[0]);
    expect(conversationDu(pro, POINTS_RELATION.autre)).toBe(pro.conversations[0]);
    expect(conversationDu(pro, POINTS_RELATION.juste)).toBe(pro.conversations[1]);
    expect(conversationDu(pro, POINTS_RELATION.juste * 3)).toBe(pro.conversations[0]);
  });
  it('fait grandir la relation par paliers, conseils compris', () => {
    expect([0, 30, 60, 95].map(niveauRelation)).toEqual(['Connaissance', 'Contact', 'Allié', 'Mentor']);
    expect(conseilsObtenus(PROFESSIONNELS[1], 61)).toHaveLength(2);
  });
});
