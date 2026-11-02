// Les objectifs durables de chaque parcours, au-delà de la journée : une qualification, un outil, un meilleur logement,
// des responsabilités, puis sa propre entreprise. Chacun se mesure sur l'état réel du joueur (certificats, patrimoine,
// niveau, chantier, lieux à mentor, diplôme). Sans React : l'appli Carrière du téléphone les affiche, les tests les vérifient.
import type { NiveauLogement } from './patrimoine';
import type { ProfilDepart } from './profils-depart';

export type CategorieObjectif = 'qualification' | 'outil' | 'logement' | 'responsabilite' | 'entreprise';
export interface EtatCarriereJoueur {
  niveau: number; porte: ProfilDepart | null;
  /** Slugs des certificats obtenus. */
  certificats: readonly string[];
  /** Slugs des outils achetés. */
  outils: readonly string[];
  logement: NiveauLogement;
  entreprise: boolean;
  journees: number; livraisons: number;
  /** Le diplôme du cursus (étudiant). */
  diplome: boolean;
}
export interface ObjectifCarriere { id: string; categorie: CategorieObjectif; titre: string; detail: string; atteint: boolean; progression?: { fait: number; requis: number } }

const RANG_LOGEMENT: Record<NiveauLogement, number> = { chambre: 0, studio: 1, f2: 2, villa: 3 };
const NOM_LOGEMENT: Record<NiveauLogement, string> = { chambre: 'une chambre', studio: 'un studio', f2: 'un deux-pièces', villa: 'une villa' };

/** Ce que chaque parcours vise, catégorie par catégorie (le parcours par défaut est celui de l'ouvrier). */
const VISEES: Record<ProfilDepart, { qualification: { certificat?: string; titre: string; detail: string }; outil: { slug: string; nom: string }; logement: NiveauLogement; poste: string }> = {
  etudiant: { qualification: { titre: 'Obtenir ton diplôme', detail: 'Semestres, examens et stages de ton cursus, à l’université et au chantier.' }, outil: { slug: 'metre-laser', nom: 'Mètre laser' }, logement: 'studio', poste: 'premier poste qualifié' },
  ouvrier: { qualification: { certificat: 'attestation-securite-chantier', titre: 'Attestation Sécurité chantier', detail: 'Tous les cours du module HSE lus à l’Académie.' }, outil: { slug: 'epi-complet', nom: 'EPI haut de gamme' }, logement: 'f2', poste: 'chef d’équipe' },
  dessinateur: { qualification: { certificat: 'attestation-autocad-plans', titre: 'Attestation AutoCAD', detail: 'Tous les cours du module AutoCAD lus à l’Académie.' }, outil: { slug: 'ordinateur-bim', nom: 'Ordinateur portable et logiciels' }, logement: 'f2', poste: 'projeteur confirmé' },
  encadrant: { qualification: { certificat: 'attestation-planification-chantier', titre: 'Attestation Planification', detail: 'Tous les cours du module de planification lus.' }, outil: { slug: 'tablette-chantier', nom: 'Tablette de chantier' }, logement: 'f2', poste: 'conducteur de travaux' },
  ingenieur: { qualification: { certificat: 'attestation-geotechnique-sols', titre: 'Attestation Géotechnique', detail: 'Tous les cours du module Géotechnique et sols lus.' }, outil: { slug: 'niveau-laser', nom: 'Niveau laser rotatif' }, logement: 'villa', poste: 'ingénieur confirmé' },
};

/** Le niveau qui marque une prise de responsabilités. */
export const NIVEAU_RESPONSABILITES = 10;

export function objectifsCarriere(e: EtatCarriereJoueur): ObjectifCarriere[] {
  const v = VISEES[e.porte ?? 'ouvrier'];
  const q = v.qualification;
  return [
    { id: 'qualification', categorie: 'qualification', titre: q.titre, detail: q.detail, atteint: q.certificat ? e.certificats.includes(q.certificat) : e.diplome },
    { id: 'outil', categorie: 'outil', titre: `S’équiper : ${v.outil.nom}`, detail: 'À acheter dans Patrimoine, sur ton téléphone : il rend ton travail plus efficace.', atteint: e.outils.includes(v.outil.slug) },
    { id: 'logement', categorie: 'logement', titre: `Habiter ${NOM_LOGEMENT[v.logement]}`, detail: 'Un logement plus grand redonne du moral à chaque réveil ; le loyer suit.', atteint: RANG_LOGEMENT[e.logement] >= RANG_LOGEMENT[v.logement] },
    e.porte === 'encadrant'
      ? { id: 'responsabilite', categorie: 'responsabilite', titre: 'Livrer un ouvrage avec ton équipe', detail: 'Mener le Grand chantier jusqu’à la réception.', atteint: e.livraisons >= 1, progression: { fait: Math.min(e.livraisons, 1), requis: 1 } }
      : { id: 'responsabilite', categorie: 'responsabilite', titre: `Devenir ${v.poste}`, detail: `Le niveau ${NIVEAU_RESPONSABILITES} ouvre les postes à responsabilités, par promotion ou embauche.`, atteint: e.niveau >= NIVEAU_RESPONSABILITES, progression: { fait: Math.min(e.niveau, NIVEAU_RESPONSABILITES), requis: NIVEAU_RESPONSABILITES } },
    { id: 'entreprise', categorie: 'entreprise', titre: 'Créer ton entreprise', detail: 'Ton nom sur une entreprise du quartier : des chantiers, une équipe, des comptes.', atteint: e.entreprise },
  ];
}

/** Le prochain objectif à viser : le premier qui n'est pas encore atteint. */
export const prochainObjectif = (objectifs: readonly ObjectifCarriere[]) => objectifs.find(o => !o.atteint) ?? null;
