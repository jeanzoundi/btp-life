'use client';

import { PERSONNAGES, type IdPersonnage } from '@/lib/personnages-joueur';
import { SILHOUETTES, STATURES, type GabaritPersonnage } from '@/lib/gabarit-personnage';
import { CASQUES, estCouleurCasque } from '@/lib/casques';
import { AvatarBtp } from './avatar-btp';

// Les réglages du personnage, partagés par le créateur de l'inscription et le choix du personnage dans le monde :
// le modèle réaliste, sa taille, sa morphologie, la couleur de son casque et son nom. Chaque réglage se voit aussitôt
// sur le modèle 3D et sur le portrait du mode classique.

export interface ReglagesJoueur extends GabaritPersonnage { personnage: IdPersonnage; nom: string; casque: string }

export const nomValide = (nom: string) => { const propre = nom.trim(); return propre.length >= 2 && propre.length <= 24; };

function Segments<T extends string>({ titre, options, valeur, onChange, desactive }: {
  titre: string; options: [T, string][]; valeur: T; onChange: (valeur: T) => void; desactive: boolean;
}) {
  return <div role="radiogroup" aria-label={titre}>
    <p className="hud-legende mb-1.5">{titre}</p>
    <div className="grid grid-cols-3 gap-1.5">
      {options.map(([id, nom]) => <button key={id} type="button" role="radio" aria-checked={valeur === id} disabled={desactive} onClick={() => onChange(id)}
        className={`rounded-xl px-2 py-2 text-[12.5px] font-semibold transition-colors ${valeur === id ? 'bg-jeu-or text-[#2A1C0E]' : 'bg-white/[.06] text-jeu-ivoire/80 hover:bg-white/10'}`}>{nom}</button>)}
    </div>
  </div>;
}

export function ReglagesPersonnage({ valeur, onChange, avatarConfig, desactive = false, libelleNom = 'Nom du personnage' }: {
  valeur: ReglagesJoueur; onChange: (valeur: ReglagesJoueur) => void;
  /** Configuration de l'avatar 2D (dressing compris) : chaque carte montre le portrait classique avec ce personnage. */
  avatarConfig?: unknown; desactive?: boolean; libelleNom?: string;
}) {
  const base = avatarConfig && typeof avatarConfig === 'object' ? avatarConfig : {};
  const maj = (partiel: Partial<ReglagesJoueur>) => onChange({ ...valeur, ...partiel });
  const modele = PERSONNAGES.find(p => p.id === valeur.personnage) ?? PERSONNAGES[0];
  const casque = CASQUES.find(c => c.couleur === valeur.casque);
  return <div className="space-y-4">
    <div role="radiogroup" aria-label="Personnages" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
      {PERSONNAGES.map(p => <button key={p.id} type="button" role="radio" aria-checked={p.id === valeur.personnage} disabled={desactive} onClick={() => maj({ personnage: p.id })}
        className={`flex items-center gap-2 rounded-xl p-2 text-left transition-colors ${p.id === valeur.personnage ? 'bg-jeu-or/[.16] ring-2 ring-jeu-or' : 'bg-white/[.06] hover:bg-white/10'}`}>
        <AvatarBtp config={{ ...base, casque: valeur.casque, personnage: p.id }} taille={44} className="!rounded-full" />
        <span className="min-w-0">
          <span className="block text-[12.5px] font-bold leading-tight">{p.titre}</span>
          <span className="text-[10.5px] text-jeu-ivoire/55">{p.casque ? 'Casque compris' : p.design.feminin ? 'Femme' : 'Homme'}</span>
        </span>
      </button>)}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <Segments titre="Taille" desactive={desactive} valeur={valeur.stature} onChange={stature => maj({ stature })}
        options={Object.entries(STATURES).map(([id, s]) => [id as GabaritPersonnage['stature'], s.nom])} />
      <Segments titre="Morphologie" desactive={desactive} valeur={valeur.silhouette} onChange={silhouette => maj({ silhouette })}
        options={Object.entries(SILHOUETTES).map(([id, s]) => [id as GabaritPersonnage['silhouette'], s.nom])} />
    </div>
    <div role="radiogroup" aria-label="Couleur du casque">
      <p className="hud-legende mb-1.5">Casque de chantier</p>
      <div className="flex flex-wrap gap-2">
        {!estCouleurCasque(valeur.casque) && <button type="button" role="radio" aria-checked aria-label="Ton casque actuel" title="Ton casque actuel (dressing)" disabled={desactive}
          className="h-9 w-9 rounded-full ring-2 ring-jeu-or ring-offset-2 ring-offset-[#12282a]" style={{ backgroundColor: valeur.casque }} />}
        {CASQUES.map(c => <button key={c.couleur} type="button" role="radio" aria-checked={valeur.casque === c.couleur} aria-label={`Casque ${c.nom.toLowerCase()}`} title={`${c.nom} · ${c.usage}`}
          disabled={desactive} onClick={() => maj({ casque: c.couleur })}
          className={`h-9 w-9 rounded-full border border-black/20 transition-transform hover:scale-110 ${valeur.casque === c.couleur ? 'ring-2 ring-jeu-or ring-offset-2 ring-offset-[#12282a]' : ''}`} style={{ backgroundColor: c.couleur }} />)}
      </div>
      <p className="mt-1.5 text-[11.5px] leading-snug text-jeu-ivoire/60">
        {casque ? `${casque.nom} · ${casque.usage} (les usages varient d’un chantier à l’autre). ` : 'Ton casque gagné au dressing. '}
        {modele.casque ? 'Visible sur ton modèle 3D et sur ton portrait.' : 'Ce modèle arrive tête nue : la couleur habille ton portrait et ton casque vu de loin sur le chantier.'}
      </p>
    </div>
    <label className="block">
      <span className="hud-legende">{libelleNom}</span>
      <input aria-label={libelleNom} value={valeur.nom} onChange={e => maj({ nom: e.target.value })} maxLength={24} placeholder="Ex. Kouassi" disabled={desactive}
        className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-jeu-ivoire outline-none focus:border-jeu-or" />
    </label>
  </div>;
}
