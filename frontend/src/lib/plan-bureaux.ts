import type { PointInterieur } from './navigation-interieur';

export type TypeBureau = 'entreprise' | 'bureau-etudes';
export type MobilierBureau = { id: string; type: 'accueil' | 'poste' | 'reunion' | 'plans' | 'archives' | 'cloison'; x: number; z: number; largeur: number; profondeur: number };
export type StationBureau = PointInterieur & { id: string; label: string; detail: string };

export const MOBILIER_BUREAUX: Record<TypeBureau, MobilierBureau[]> = {
  entreprise: [
    { id: 'accueil', type: 'accueil', x: -3.5, z: 2.3, largeur: 2.8, profondeur: 1 },
    { id: 'poste', type: 'poste', x: -3.5, z: -2.5, largeur: 2.4, profondeur: 1.8 },
    { id: 'reunion', type: 'reunion', x: 3, z: -2.5, largeur: 3.4, profondeur: 2.4 },
    { id: 'archives', type: 'archives', x: 4.9, z: 2.2, largeur: .7, profondeur: 2.3 },
    { id: 'cloison', type: 'cloison', x: -3.8, z: -.4, largeur: 3.6, profondeur: .15 },
  ],
  'bureau-etudes': [
    { id: 'accueil', type: 'accueil', x: -3.7, z: 2.5, largeur: 2.4, profondeur: .9 },
    { id: 'plans', type: 'plans', x: 3.1, z: 1.6, largeur: 3, profondeur: 1.8 },
    { id: 'poste', type: 'poste', x: -3.2, z: -2.5, largeur: 2.6, profondeur: 1.8 },
    { id: 'archives', type: 'archives', x: 4.9, z: -2.7, largeur: .7, profondeur: 2.5 },
    { id: 'cloison', type: 'cloison', x: -3.8, z: -.4, largeur: 3.6, profondeur: .15 },
  ],
};
export const STATIONS_BUREAUX: Record<TypeBureau, StationBureau[]> = {
  entreprise: [
    { id: 'accueil', label: 'Accueil', x: -3.4, z: 3.4, detail: 'Accueil · Retrouvez les activités de carrière dans Services et activités.' },
    { id: 'poste', label: 'Bureau projets', x: -3.4, z: -1, detail: 'Bureau projets · Poste de travail et suivi des opérations.' },
    { id: 'reunion', label: 'Salle de réunion', x: 3, z: -.6, detail: 'Salle de réunion · Consultez le briefing de coordination.' },
    { id: 'archives', label: 'Archives', x: 3.8, z: 2.4, detail: 'Archives · Consultez les étapes de classement du dossier.' },
  ],
  'bureau-etudes': [
    { id: 'accueil', label: 'Accueil', x: -3.6, z: 3.6, detail: 'Accueil · Bureau d’études et coordination technique.' },
    { id: 'poste', label: 'Poste CAO', x: -3.2, z: -1, detail: 'Poste CAO · Consultez les points de contrôle de la maquette.' },
    { id: 'plans', label: 'Table à plans', x: 3, z: 3, detail: 'Table à plans · Examinez le plan pédagogique et ses points de vigilance.' },
    { id: 'archives', label: 'Matériauthèque', x: 3.8, z: -2.6, detail: 'Matériauthèque · Comparez les échantillons et leur traçabilité.' },
  ],
};

export function navigationBureau(type: TypeBureau) {
  const libreAvecMarge = ({ x, z }: PointInterieur, marge: number) => Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= 5.4 && Math.abs(z) <= 4.4 &&
    !MOBILIER_BUREAUX[type].some(m => Math.abs(x - m.x) < m.largeur / 2 + marge && Math.abs(z - m.z) < m.profondeur / 2 + marge);
  const libre = (p: PointInterieur) => libreAvecMarge(p, .25);
  const avancer = (p: PointInterieur, dx: number, dz: number, delta: number): PointInterieur => {
    const distance = Math.hypot(dx, dz);
    if (!distance) return p;
    const pas = Math.min(Math.max(delta, 0), .05) * 2.1;
    const x = p.x + dx / distance * pas, z = p.z + dz / distance * pas;
    const suivant = { x: libre({ x, z: p.z }) ? x : p.x, z: p.z };
    if (libre({ x: suivant.x, z })) suivant.z = z;
    return suivant;
  };
  const chemin = (depart: PointInterieur, cible: PointInterieur): PointInterieur[] => {
    if (!libre(depart) || !libre(cible)) return [];
    const cellule = (p: PointInterieur) => ({ x: Math.round(p.x * 5), z: Math.round(p.z * 5) });
    const cle = (p: PointInterieur) => `${p.x},${p.z}`;
    const debut = cellule(depart), fin = cellule(cible), file = [debut];
    const parents = new Map<string, PointInterieur | null>([[cle(debut), null]]);
    for (let i = 0; i < file.length; i++) {
      const courant = file[i];
      if (cle(courant) === cle(fin)) {
        const resultat: PointInterieur[] = [];
        let p: PointInterieur | null = courant;
        while (p && cle(p) !== cle(debut)) { resultat.unshift({ x: p.x / 5, z: p.z / 5 }); p = parents.get(cle(p)) ?? null; }
        return resultat;
      }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const voisin = { x: courant.x + dx, z: courant.z + dz };
        // Extra clearance covers arrival tolerance and rounded turns at desk corners.
        if (!parents.has(cle(voisin)) && libreAvecMarge({ x: voisin.x / 5, z: voisin.z / 5 }, .35)) {
          parents.set(cle(voisin), courant); file.push(voisin);
        }
      }
    }
    return [];
  };
  return { libre, avancer, chemin };
}
