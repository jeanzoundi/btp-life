'use client';

import {
  BAS_SUR_MESURE, CHEVEUX_SUR_MESURE, COIFFURES_SUR_MESURE, HAUTS_SUR_MESURE, ID_SUR_MESURE, IDEES_SUR_MESURE, PERSONNAGES, PILOSITES, personnageDuChoix,
  TEINTS_SUR_MESURE, TENUES_SUR_MESURE, type ApparenceSurMesure, type IdPersonnage, type PersonnageJoueur,
} from '@/lib/personnages-joueur';
import { SILHOUETTES, STATURES, type GabaritPersonnage } from '@/lib/gabarit-personnage';
import { CASQUES, estCouleurCasque } from '@/lib/casques';
import { AvatarBtp } from './avatar-btp';

// Les réglages du personnage, partagés par le créateur de l'inscription et le choix du personnage dans le monde :
// un modèle réaliste ou le personnage sur mesure (coiffure, barbe, teint, tenue…), sa taille, sa morphologie, la couleur
// de son casque et son nom. Chaque réglage se voit aussitôt sur le modèle 3D et sur le portrait du mode classique.

export interface ReglagesJoueur extends GabaritPersonnage {
  personnage: IdPersonnage; nom: string; casque: string;
  /** Le réglage du personnage sur mesure, gardé même quand un modèle réaliste est choisi. */
  apparence: ApparenceSurMesure;
}

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

/** Une rangée de choix qui passe à la ligne (coiffures, barbes, tenues…). */
function Choix<T extends string>({ titre, options, valeur, onChange, desactive }: {
  titre: string; options: [T, string][]; valeur: T; onChange: (valeur: T) => void; desactive: boolean;
}) {
  return <div role="radiogroup" aria-label={titre}>
    <p className="hud-legende mb-1.5">{titre}</p>
    <div className="flex flex-wrap gap-1.5">
      {options.map(([id, nom]) => <button key={id} type="button" role="radio" aria-checked={valeur === id} disabled={desactive} onClick={() => onChange(id)}
        className={`rounded-xl px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${valeur === id ? 'bg-jeu-or text-[#2A1C0E]' : 'bg-white/[.06] text-jeu-ivoire/80 hover:bg-white/10'}`}>{nom}</button>)}
    </div>
  </div>;
}

/** Des pastilles de couleur, chacune nommée pour les lecteurs d'écran. */
function Nuancier({ titre, couleurs, valeur, onChange, desactive }: {
  titre: string; couleurs: [string, string][]; valeur: string; onChange: (couleur: string) => void; desactive: boolean;
}) {
  return <div role="radiogroup" aria-label={titre}>
    <p className="hud-legende mb-1.5">{titre}</p>
    <div className="flex flex-wrap gap-2">
      {couleurs.map(([couleur, nom]) => <button key={couleur} type="button" role="radio" aria-checked={valeur === couleur} aria-label={`${titre} : ${nom.toLowerCase()}`} title={nom} disabled={desactive}
        onClick={() => onChange(couleur)} style={{ backgroundColor: couleur }}
        className={`h-8 w-8 rounded-full border border-black/25 transition-transform hover:scale-110 ${valeur === couleur ? 'ring-2 ring-jeu-or ring-offset-2 ring-offset-[#12282a]' : ''}`} />)}
    </div>
  </div>;
}

/** Le réglage du personnage sur mesure : idées de départ, puis chaque trait. */
function EditeurSurMesure({ apparence: a, onChange, desactive }: { apparence: ApparenceSurMesure; onChange: (apparence: ApparenceSurMesure) => void; desactive: boolean }) {
  const maj = (partiel: Partial<ApparenceSurMesure>) => onChange({ ...a, ...partiel });
  return <div role="group" aria-label="Personnage sur mesure" className="space-y-3 rounded-2xl bg-white/[.04] p-3">
    <div>
      <p className="hud-legende mb-1.5">Idées de départ</p>
      <div className="flex flex-wrap gap-1.5">
        {IDEES_SUR_MESURE.map(idee => <button key={idee.nom} type="button" disabled={desactive} onClick={() => onChange(idee.apparence)}
          className="rounded-full border border-jeu-or/40 px-2.5 py-1 text-[11.5px] font-semibold text-jeu-or transition-colors hover:bg-jeu-or/15">{idee.nom}</button>)}
      </div>
    </div>
    <Choix titre="Silhouette" desactive={desactive} options={[['homme', 'Homme'], ['femme', 'Femme']]} valeur={a.feminin ? 'femme' : 'homme'} onChange={v => maj({ feminin: v === 'femme' })} />
    <Nuancier titre="Teint" desactive={desactive} couleurs={TEINTS_SUR_MESURE} valeur={a.peau} onChange={peau => maj({ peau })} />
    <Choix titre="Coiffure" desactive={desactive} options={COIFFURES_SUR_MESURE} valeur={a.coiffure} onChange={coiffure => maj({ coiffure })} />
    <Nuancier titre="Cheveux" desactive={desactive} couleurs={CHEVEUX_SUR_MESURE} valeur={a.couleurCheveux} onChange={couleurCheveux => maj({ couleurCheveux })} />
    <Choix titre="Barbe et moustache" desactive={desactive} options={PILOSITES} valeur={a.pilosite} onChange={pilosite => maj({ pilosite })} />
    <div className="grid grid-cols-2 gap-3">
      <Choix titre="Lunettes" desactive={desactive} options={[['sans', 'Sans'], ['avec', 'Avec']]} valeur={a.lunettes ? 'avec' : 'sans'} onChange={v => maj({ lunettes: v === 'avec' })} />
      <Choix titre="Casque en ville" desactive={desactive} options={[['porte', 'Porté'], ['nu', 'Tête nue']]} valeur={a.casque ? 'porte' : 'nu'} onChange={v => maj({ casque: v === 'porte' })} />
    </div>
    <Choix titre="Tenue" desactive={desactive} options={TENUES_SUR_MESURE} valeur={a.tenue} onChange={tenue => maj({ tenue })} />
    <Nuancier titre="Haut" desactive={desactive} couleurs={HAUTS_SUR_MESURE} valeur={a.haut} onChange={haut => maj({ haut })} />
    <Nuancier titre="Bas" desactive={desactive} couleurs={BAS_SUR_MESURE} valeur={a.bas} onChange={bas => maj({ bas })} />
  </div>;
}

export function ReglagesPersonnage({ valeur, onChange, avatarConfig, desactive = false, libelleNom = 'Nom du personnage' }: {
  valeur: ReglagesJoueur; onChange: (valeur: ReglagesJoueur) => void;
  /** Configuration de l'avatar 2D (dressing compris) : chaque carte montre le portrait classique avec ce personnage. */
  avatarConfig?: unknown; desactive?: boolean; libelleNom?: string;
}) {
  const base = avatarConfig && typeof avatarConfig === 'object' ? avatarConfig : {};
  const maj = (partiel: Partial<ReglagesJoueur>) => onChange({ ...valeur, ...partiel });
  const surMesure = valeur.personnage === ID_SUR_MESURE;
  const choisi = personnageDuChoix(valeur.personnage, valeur.apparence);
  const casque = CASQUES.find(c => c.couleur === valeur.casque);
  const cartes: PersonnageJoueur[] = [...PERSONNAGES, personnageDuChoix(ID_SUR_MESURE, valeur.apparence)];
  // Chaque vignette montre le personnage lui-même : son teint, ses cheveux, sa tenue, et son casque s'il en porte un.
  const vignette = (p: PersonnageJoueur) => ({ ...base, casque: valeur.casque, personnage: p.id, apparence: valeur.apparence, casqueStyle: p.casque ? 'standard' : 'aucun', couleurTenue: p.design.haut });
  return <div className="space-y-4">
    <div role="radiogroup" aria-label="Personnages" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
      {cartes.map(p => <button key={p.id} type="button" role="radio" aria-checked={p.id === valeur.personnage} disabled={desactive} onClick={() => maj({ personnage: p.id })}
        className={`flex items-center gap-2 rounded-xl p-2 text-left transition-colors ${p.id === valeur.personnage ? 'bg-jeu-or/[.16] ring-2 ring-jeu-or' : 'bg-white/[.06] hover:bg-white/10'}`}>
        <AvatarBtp config={vignette(p)} taille={44} className="!rounded-full" />
        <span className="min-w-0">
          <span className="block text-[12.5px] font-bold leading-tight">{p.titre}</span>
          <span className="text-[10.5px] text-jeu-ivoire/55">{p.id === ID_SUR_MESURE ? 'Coiffure, barbe, tenue…' : p.casque ? 'Casque compris' : p.design.feminin ? 'Femme' : 'Homme'}</span>
        </span>
      </button>)}
    </div>
    {surMesure && <EditeurSurMesure apparence={valeur.apparence} onChange={apparence => maj({ apparence })} desactive={desactive} />}
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
        {surMesure
          ? choisi.casque ? 'Visible sur ton personnage en ville et au chantier, et sur ton portrait.' : 'Tête nue choisie : la couleur habille ton portrait.'
          : choisi.casque ? 'Visible sur ton modèle 3D et sur ton portrait.' : 'Ce modèle arrive tête nue : la couleur habille ton portrait et ton casque vu de loin sur le chantier.'}
      </p>
    </div>
    <label className="block">
      <span className="hud-legende">{libelleNom}</span>
      <input aria-label={libelleNom} value={valeur.nom} onChange={e => maj({ nom: e.target.value })} maxLength={24} placeholder="Ex. Kouassi" disabled={desactive}
        className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-jeu-ivoire outline-none focus:border-jeu-or" />
    </label>
  </div>;
}
