import { describe, expect, it } from 'vitest';
import {
  appliquerChapitre, bilanChapitre, CHAPITRES, CHAPITRES_LIVRAISON, chapitreCourant, contenuTacheChapitre, dossierDe, dossierDeParcelle, DOSSIERS, faitsDossier, gainsChapitreJeu,
  lireProgresCampagne, NOTE_CHAPITRE, nouvelleSeanceChapitre, PARCELLE_AKWABA, PARCELLE_RONIERS, PROGRES_CAMPAGNE_INITIAL, stadeAkwaba, STADES_AKWABA, stadeRoniers,
} from './campagne';
import { LIEUX_PROGRAMME } from './lieux-programme';
import { ordreChoix } from './programme-chantier';
import { noter, scoreMesure, scoreSelection, scoreSituation, seanceFaite, tacheALaZoneLieu, type ContenuTache, type SeanceLieu } from './programme-lieu';

/** Score parfait pour un contenu : la bonne réponse, la valeur exacte, ou toutes les pièces attendues. */
const parfait = (c: ContenuTache) => c.type === 'situation' ? scoreSituation(c.situation, c.situation.choix.findIndex(x => x.correct))
  : c.type === 'mesure' ? scoreMesure(c.mesure, c.mesure.reponse)
  : scoreSelection(c.selection, c.selection.options.flatMap((o, i) => o.attendu ? [i] : []));
const jouer = (s: SeanceLieu, scores: number[]) => s.taches.reduce((x, t, i) => noter(x, t.id, scores[i]), s);
const mesure = (chapitre: string, tache: string) => {
  const c = CHAPITRES.find(x => x.id === chapitre)!.taches.find(t => t.id === tache)!.contenu;
  if (c.type !== 'mesure') throw new Error(`${tache} n’est pas une mesure`);
  return c.mesure;
};

describe('les chapitres du fil rouge', () => {
  it('suivent l’immeuble de lieu en lieu, de l’offre à la réception sur la parcelle, puis jusqu’au retour d’expérience', () => {
    const [akwaba] = DOSSIERS;
    expect(akwaba.chapitres).toHaveLength(12);
    expect(new Set(CHAPITRES.map(c => c.id)).size).toBe(CHAPITRES.length);
    expect(akwaba.chapitres.map(c => c.lieu)).toEqual(['entreprise', 'laboratoire', 'bureau-etudes', 'mairie', 'banque', 'fournisseur', 'logistique', 'construction-nord', PARCELLE_AKWABA.slug,
      'laboratoire', 'banque', 'entreprise']);
    expect(CHAPITRES[CHAPITRES_LIVRAISON - 1].id).toBe('reception');
  });

  it('enchaîne le R+5 des Rôniers après Akwaba, par de nouveaux lieux, jusqu’à sa réception et au groupement', () => {
    const [akwaba, roniers] = DOSSIERS;
    expect(CHAPITRES).toHaveLength(DOSSIERS.reduce((n, d) => n + d.chapitres.length, 0));
    expect(roniers).toMatchObject({ id: 'residence-roniers', debut: 12, livraison: 11, client: 'M. Touré' });
    expect(roniers.chapitres.map(c => c.lieu)).toEqual(['entreprise', 'laboratoire', 'bureau-etudes', 'mairie', 'jardins-residence', 'banque', 'atelier', 'logistique', 'fournisseur',
      'construction-nord', PARCELLE_RONIERS.slug, 'entreprise']);
    expect(CHAPITRES[roniers.debut + roniers.livraison - 1].id).toBe('reception-r5');
    expect(dossierDe(11).id).toBe('residence-akwaba');
    expect(dossierDe(12).id).toBe('residence-roniers');
    expect(dossierDe(23).id).toBe('residence-roniers');
    expect(dossierDe(999).id).toBe('chateau-eau');
    expect(dossierDeParcelle(PARCELLE_RONIERS.slug)).toBe(roniers);
    expect(dossierDeParcelle('mairie')).toBeNull();
    expect([0, 5, 12, 15, 24].map(n => faitsDossier(roniers, n))).toEqual([0, 0, 0, 3, 12]);
  });

  for (const chapitre of CHAPITRES) {
    it(`${chapitre.id} : tâches aux vrais postes du lieu, contenus justes`, () => {
      expect(chapitre.taches.length).toBe(3);
      expect(new Set(chapitre.taches.map(t => t.id)).size).toBe(3);
      const lieu = LIEUX_PROGRAMME[chapitre.lieu];
      for (const tache of chapitre.taches) {
        if (lieu) {
          // Un vrai poste du plan, ni le mentor (il fait le bilan), ni un service ouvert à tout moment (il doit rester libre).
          expect(lieu.plan.stations[tache.zone], `${chapitre.id}/${tache.id}`).toBeDefined();
          expect(tache.zone).not.toBe('mentor');
          expect(lieu.services?.some(s => s.station === tache.zone) ?? false, tache.id).toBe(false);
        } else expect(tache.zone).toBe('parcelle');
        const c = tache.contenu;
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
    });
  }

  it('place la bonne réponse des situations à des rangs variés', () => {
    const rangs = new Set(CHAPITRES.flatMap(c => c.taches.flatMap(t => t.contenu.type === 'situation' ? [ordreChoix(t.contenu.situation).indexOf(0)] : [])));
    expect(rangs.size).toBeGreaterThan(1);
  });

  it('garde les mêmes chiffres d’un chapitre à l’autre', () => {
    // Le sol du laboratoire sert au bureau d'études ; les semelles du bureau d'études sont celles commandées au dépôt.
    expect(mesure('sol', 'admissible').reponse).toBe(200);
    expect(mesure('structure', 'descente').reponse).toBe(768);
    expect(mesure('structure', 'semelle').reponse).toBeCloseTo(1.96, 2);
    expect(mesure('commande', 'beton-semelles').reponse).toBe(32);
    expect(mesure('coulage', 'rotations').reponse).toBe(4);
    // L'offre TTC tient dans le budget de Mme Touré, et la retenue de la réception porte sur le marché hors taxes.
    expect(mesure('offre', 'montant-offre').reponse).toBeCloseTo(179.95, 2);
    expect(mesure('reception', 'retenue-finale').reponse).toBeCloseTo(152.5 * .05, 3);
    expect(mesure('financement', 'apport').reponse).toBeCloseTo(54, 6);
    // Après la livraison : la retenue rendue suit les travaux exécutés (avenant compris), la marge le coût réel.
    expect(mesure('garantie', 'ouverture-fissure').reponse).toBeCloseTo(.04, 6);
    expect(mesure('decompte', 'retenue-rendue').reponse).toBeCloseTo((152.5 + 4.2) * .05, 3);
    expect(mesure('retour-experience', 'marge-reelle').reponse).toBeCloseTo(15.8, 1);
  });

  it('enchaîne ensuite cinq dossiers de huit chapitres : école, centre de santé, marché couvert, résidence universitaire, château d’eau', () => {
    const suite = DOSSIERS.slice(2);
    expect(suite.map(d => d.id)).toEqual(['groupe-scolaire', 'centre-sante', 'marche-couvert', 'residence-universitaire', 'chateau-eau']);
    for (const d of suite) {
      expect(d.chapitres, d.id).toHaveLength(8);
      expect(d.livraison, d.id).toBe(7);
      expect(d.stades, d.id).toHaveLength(9);
      // La réception se joue sur la parcelle du dossier, avec son client ; le dossier s'ouvre et se clôt à l'entreprise ou à la banque.
      expect(d.chapitres[d.livraison - 1].lieu, d.id).toBe(d.parcelle.slug);
      expect(dossierDeParcelle(d.parcelle.slug), d.id).toBe(d);
      expect(d.chapitres[0].lieu, d.id).toBe('entreprise');
      // Chaque dossier rapporte plus que le précédent.
      const avant = DOSSIERS[DOSSIERS.indexOf(d) - 1];
      expect(d.bareme.argent.livraison, d.id).toBeGreaterThan(avant.bareme.argent.livraison);
    }
    // Un lieu pour la recherche d'emploi rejoint le fil rouge : l'agence des talents, pour l'équipe du centre de santé.
    expect(CHAPITRES.some(c => c.lieu === 'agence')).toBe(true);
  });

  it('garde des chiffres justes dans les cinq derniers dossiers', () => {
    expect(mesure('marche-ecole', 'prix-ecole').reponse).toBeCloseTo(150 * 1.08 * 1.1 * 1.06, 6);
    expect(mesure('terrain-ecole', 'compactage').reponse).toBeCloseTo(92.31, 2);
    expect(mesure('ecole-pour-tous', 'unites-passage').reponse).toBe(2);
    expect(mesure('securite-groupement', 'etais-ecole').reponse).toBe(112);
    expect(mesure('reseaux-sante', 'groupe-electrogene').reponse).toBeCloseTo(28.125, 6);
    expect(mesure('surfaces-sante', 'carrelage-soins').reponse).toBe(105);
    expect(mesure('decompte-sante', 'solde-sante').reponse).toBeCloseTo(6.875, 6);
    expect(mesure('levage-marche', 'effort-elingue').reponse).toBeCloseTo(421.5, 1);
    expect(mesure('acier-marche', 'peinture-acier').reponse).toBe(27);
    expect(mesure('bilan-marche', 'reste-entretien').reponse).toBe(100_000);
    expect(mesure('beton-usine', 'resistance-eprouvette').reponse).toBeCloseTo(30, 0);
    expect(mesure('econome-residence', 'brise-soleil').reponse).toBeCloseTo(.546, 3);
    // Le château d'eau : la cuve de 500 m³ donne 5,26 m d'eau, dont l'essai d'étanchéité admet 1/500.
    expect(mesure('cuve-chateau', 'hauteur-eau').reponse).toBeCloseTo(5.26, 2);
    expect(mesure('mise-en-service', 'essai-etancheite').reponse).toBeCloseTo(mesure('cuve-chateau', 'hauteur-eau').reponse * 1000 / 500, 6);
    expect(mesure('bilan-chateau', 'taux-frequence').reponse).toBe(8);
  });

  it('garde les mêmes chiffres d’un chapitre à l’autre dans le R+5', () => {
    // Le coût réel d'Akwaba, ramené au m², estime le R+5 ; ses 840 m² font le COS du permis et la charge des pieux.
    expect(mesure('offre-r5', 'estimation-r5').reponse).toBeCloseTo(128.4 / 432 * 840, 6);
    expect(mesure('permis-r5', 'cos-r5').reponse).toBeCloseTo(840 / 234, 6);
    expect(mesure('permis-r5', 'cos-r5').reponse).toBeLessThan(3.6);
    // Un étage de plus (980 m²) dépasserait le COS : c'est la réponse attendue à la banque.
    expect(980 / 234).toBeGreaterThan(3.6);
    expect(mesure('pieux', 'nombre-pieux').reponse).toBe(23);
    expect(mesure('pieux', 'longueur-pieu').reponse).toBe(13.5);
    // Les vingt-quatre pieux du plan, forés à trois par jour : les huit jours annoncés aux voisins.
    expect(mesure('voisins', 'duree-forage').reponse).toBe(8);
    expect(mesure('vente-plans', 'appel-fonds').reponse).toBeCloseTo(33.6, 6);
    expect(mesure('planchers', 'hourdis').reponse).toBe(1076);
    expect(mesure('facades', 'ancrages').reponse).toBe(23);
    expect(mesure('reception-r5', 'mise-en-eau').reponse).toBe(7);
    expect(mesure('bilan-r5', 'revision-prix').reponse).toBeCloseTo(42.73, 2);
  });

  it('accepte une semelle arrondie à 2,00 m à moitié, et pas une erreur d’unité', () => {
    const semelle = mesure('structure', 'semelle');
    expect(scoreMesure(semelle, 1.96)).toBe(100);
    expect(scoreMesure(semelle, 2)).toBe(50);
    expect(scoreMesure(semelle, 196)).toBe(0);
  });
});

describe('séance et bilan d’un chapitre', () => {
  it('se joue comme une séance de lieu, aux postes du chapitre', () => {
    const s = nouvelleSeanceChapitre(2);
    expect(s).toMatchObject({ slug: 'bureau-etudes', etape: 2, cycle: 0, scores: {} });
    expect(s.taches.map(t => t.type)).toEqual(CHAPITRES[2].taches.map(t => t.contenu.type));
    expect(tacheALaZoneLieu(s, 'calcul')?.id).toBe('descente');
    expect(contenuTacheChapitre(2, 'semelle')?.type).toBe('mesure');
    expect(contenuTacheChapitre(2, 'inconnue')).toBeNull();
    expect(seanceFaite(jouer(s, [100, 100, 100]))).toBe(true);
  });

  it('paie la clôture du dossier un peu plus qu’un chapitre ordinaire, moins que la livraison', () => {
    expect(bilanChapitre(jouer(nouvelleSeanceChapitre(9), [100, 100, 100]))).toMatchObject({ xp: 80, argent: 2_500, reputation: 2 });
    expect(bilanChapitre(jouer(nouvelleSeanceChapitre(11), [100, 100, 100]))).toMatchObject({ xp: 180, argent: 10_000, reputation: 8 });
  });

  it('valide à 50, paie comme le serveur, et bien plus à la réception', () => {
    const parfaite = bilanChapitre(jouer(nouvelleSeanceChapitre(0), [100, 100, 100]));
    expect(parfaite).toMatchObject({ note: 100, reussi: true, reussies: 3, xp: 80, argent: 2500, reputation: 2, mention: 'Chapitre sans faute' });
    // Une bonne réponse et une à moitié : 10 + 90 × 150 / 300 = 55, validé de justesse.
    expect(bilanChapitre(jouer(nouvelleSeanceChapitre(4), [100, 50, 0]))).toMatchObject({ note: 55, reussi: true, xp: 58 });
    const ratee = bilanChapitre(jouer(nouvelleSeanceChapitre(4), [100, 0, 0]));
    expect(ratee).toMatchObject({ note: 40, reussi: false, xp: 0, argent: 0, reputation: 0 });
    expect(ratee.note).toBeLessThan(NOTE_CHAPITRE);
    expect(bilanChapitre(jouer(nouvelleSeanceChapitre(8), [100, 100, 100]))).toMatchObject({ xp: 280, argent: 25_000, reputation: 15 });
  });

  it('paie le R+5 à son barème, comme le serveur : plus qu’Akwaba, livraison au onzième chapitre du dossier', () => {
    expect(gainsChapitreJeu(12, 100)).toEqual({ argent: 4_000, xp: 90, reputation: 3 });
    expect(gainsChapitreJeu(22, 100)).toEqual({ argent: 40_000, xp: 340, reputation: 20 });
    expect(gainsChapitreJeu(23, 100)).toEqual({ argent: 15_000, xp: 210, reputation: 10 });
    expect(gainsChapitreJeu(23, 49)).toEqual({ argent: 0, xp: 0, reputation: 0 });
    expect(bilanChapitre(jouer(nouvelleSeanceChapitre(16), [100, 100, 100]))).toMatchObject({ note: 100, argent: 4_000, xp: 90 });
    expect(nouvelleSeanceChapitre(16)).toMatchObject({ slug: 'jardins-residence', etape: 16 });
  });

  it('paie l’école, livrée au septième chapitre de son dossier, et la clôture du château d’eau', () => {
    expect(gainsChapitreJeu(24, 100)).toEqual({ argent: 5_000, xp: 100, reputation: 4 });
    expect(gainsChapitreJeu(30, 100)).toEqual({ argent: 50_000, xp: 360, reputation: 25 });
    expect(gainsChapitreJeu(31, 100)).toEqual({ argent: 18_000, xp: 230, reputation: 12 });
    expect(gainsChapitreJeu(CHAPITRES.length - 1, 100)).toEqual({ argent: 30_000, xp: 300, reputation: 18 });
  });
});

describe('progression de la campagne', () => {
  it('relit une sauvegarde abîmée comme le serveur', () => {
    expect(lireProgresCampagne(null)).toEqual(PROGRES_CAMPAGNE_INITIAL);
    expect(lireProgresCampagne({ chapitres: 999, termineeLe: 'hier' })).toEqual({ chapitres: CHAPITRES.length, termineeLe: null });
    expect(lireProgresCampagne({ chapitres: 3.8 })).toEqual({ chapitres: 3, termineeLe: null });
  });

  it('reprend à l’année de garantie une campagne finie à la livraison, et au R+5 une campagne finie avec Akwaba', () => {
    const fin = '2026-10-26T15:00:00.000Z';
    expect(lireProgresCampagne({ chapitres: 9, termineeLe: fin })).toEqual({ chapitres: 9, termineeLe: null });
    expect(chapitreCourant(lireProgresCampagne({ chapitres: 9, termineeLe: fin }))?.id).toBe('garantie');
    // Qui avait bouclé Akwaba avant les Rôniers retrouve le fil rouge au premier chapitre du R+5.
    expect(lireProgresCampagne({ chapitres: 12, termineeLe: fin })).toEqual({ chapitres: 12, termineeLe: null });
    expect(chapitreCourant({ chapitres: 12 })?.id).toBe('offre-r5');
    expect(lireProgresCampagne({ chapitres: CHAPITRES.length, termineeLe: fin })).toEqual({ chapitres: CHAPITRES.length, termineeLe: fin });
  });

  it('avance d’un chapitre réussi, livre l’immeuble à la réception, passe au dossier suivant, et ne bouge pas sur un échec', () => {
    const maintenant = new Date('2026-10-26T10:00:00.000Z');
    expect(appliquerChapitre({ chapitres: 2, termineeLe: null }, false, maintenant)).toEqual({ chapitres: 2, termineeLe: null });
    expect(appliquerChapitre({ chapitres: 2, termineeLe: null }, true, maintenant)).toEqual({ chapitres: 3, termineeLe: null });
    const livre = appliquerChapitre({ chapitres: 8, termineeLe: null }, true, maintenant);
    expect(livre).toEqual({ chapitres: CHAPITRES_LIVRAISON, termineeLe: null });
    expect(chapitreCourant(livre)?.id).toBe('garantie');
    const akwabaClose = appliquerChapitre({ chapitres: 11, termineeLe: null }, true, maintenant);
    expect(akwabaClose).toEqual({ chapitres: 12, termineeLe: null });
    expect(chapitreCourant(akwabaClose)?.id).toBe('offre-r5');
    const clos = appliquerChapitre({ chapitres: CHAPITRES.length - 1, termineeLe: null }, true, maintenant);
    expect(clos).toEqual({ chapitres: CHAPITRES.length, termineeLe: maintenant.toISOString() });
    expect(appliquerChapitre(clos, true, new Date())).toBe(clos);
    expect(chapitreCourant(clos)).toBeNull();
    expect(chapitreCourant({ chapitres: 3 })?.id).toBe('permis');
  });

  it('nomme ce qu’on voit sur chaque parcelle à chaque stade', () => {
    expect(STADES_AKWABA).toHaveLength(DOSSIERS[0].chapitres.length + 1);
    expect(stadeAkwaba({ chapitres: 0 })).toBe('Parcelle bornée');
    expect(stadeAkwaba({ chapitres: 4 })).toBe('Permis affiché');
    expect(stadeAkwaba({ chapitres: 9 })).toBe('Immeuble livré');
    expect(stadeAkwaba({ chapitres: 12 })).toBe('Référence de l’entreprise');
    expect(stadeAkwaba({ chapitres: 20 })).toBe('Référence de l’entreprise');
    expect(DOSSIERS[1].stades).toHaveLength(DOSSIERS[1].chapitres.length + 1);
    expect(stadeRoniers({ chapitres: 3 })).toBe('Terrain à bâtir');
    expect(stadeRoniers({ chapitres: 18 })).toBe('Pieux forés');
    expect(stadeRoniers({ chapitres: 23 })).toBe('Immeuble livré');
    expect(stadeRoniers({ chapitres: 24 })).toBe('Référence de l’entreprise');
  });
});
