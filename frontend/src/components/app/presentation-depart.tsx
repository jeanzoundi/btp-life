'use client';

import type { ModeExperience } from '@/lib/mode-experience-store';
import { PROFILS_DEPART, profilsPourPorte, type ProfilCatalogue, type ProfilDepart } from '@/lib/profils-depart';

// Les deux premières décisions du créateur, sur le fond sombre de l'écran de création : le mode de départ, puis la
// porte d'entrée dans le bâtiment (situation de départ).

const MODES = [
  { id: 'classique', icone: '📚', titre: 'Mode classique', description: 'Accède directement aux cours, missions, finances et à ta carrière.', points: ['Académie et missions', 'Tableau de bord, CV, offres'] },
  { id: 'monde', icone: '🌍', titre: 'Mode vivant', description: 'Incarne ton personnage, explore Abidjan et rejoins les lieux de ton parcours.', points: ['Ton personnage en 3D', 'Le quartier, ses lieux et ses mentors'] },
] as const;

export function PresentationModes({ mode, onMode }: { mode: ModeExperience; onMode: (mode: ModeExperience) => void }) {
  return <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Mode de départ">
      {MODES.map(m => <button type="button" role="radio" aria-checked={mode === m.id} key={m.id} onClick={() => onMode(m.id)}
        className={`rounded-2xl border p-4 text-left transition-colors ${mode === m.id ? 'border-jeu-or bg-jeu-or/[.12] ring-1 ring-jeu-or' : 'border-white/10 bg-white/[.04] hover:bg-white/[.08]'}`}>
        <span className="text-3xl" aria-hidden="true">{m.icone}</span>
        <span className="hud-titre mt-2 block text-lg">{m.titre}</span>
        <span className="mt-1.5 block text-[13px] leading-relaxed text-jeu-ivoire/70">{m.description}</span>
        <span className="mt-2 block space-y-0.5 text-[11.5px] font-semibold text-jeu-or">{m.points.map(p => <span key={p} className="block">✓ {p}</span>)}</span>
      </button>)}
    </div>
    <p className="rounded-xl bg-white/[.06] p-3 text-[12.5px] leading-relaxed text-jeu-ivoire/80">Un seul compte, un seul personnage, la même progression et le même argent. Tu pourras changer de mode sans recommencer.</p>
  </div>;
}

export function SelectionProfilDepart({ profils, porte, profilId, onPorte, onProfil }: {
  profils: ProfilCatalogue[]; porte: ProfilDepart | null; profilId: string;
  onPorte: (porte: ProfilDepart | null) => void; onProfil: (id: string) => void;
}) {
  const choix = PROFILS_DEPART.find(p => p.id === porte);
  const disponibles = profilsPourPorte(profils, porte);
  return <div className="space-y-3">
    <div role="radiogroup" aria-label="Cinq profils de départ" className="grid gap-2 sm:grid-cols-2">
      {PROFILS_DEPART.map(p => <button type="button" role="radio" aria-checked={porte === p.id} key={p.id} onClick={() => onPorte(p.id)}
        className={`rounded-xl border p-3.5 text-left transition-colors ${porte === p.id ? 'border-jeu-or bg-jeu-or/[.12] ring-1 ring-jeu-or' : 'border-white/10 bg-white/[.04] hover:bg-white/[.08]'}`}>
        <span className="block font-bold">{p.icone} {p.nom}</span>
        <span className="mt-1 block text-[12px] leading-relaxed text-jeu-ivoire/65">{p.description}</span>
      </button>)}
    </div>
    {choix && <p className="rounded-xl bg-white/[.06] p-3 text-[12.5px] text-jeu-ivoire/85"><strong className="text-jeu-or">Ton quotidien :</strong> {choix.quotidien}</p>}
    <button type="button" onClick={() => onPorte(null)} className="text-[12.5px] font-semibold text-jeu-or underline underline-offset-4">Explorer toutes les spécialités : métré, HSE, topographie…</button>
    <label className="block text-[13px] font-semibold">{porte ? 'Ta situation dans cette voie' : 'Toutes les situations du catalogue'}
      <select value={profilId} onChange={e => onProfil(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#12282a] p-3 font-normal text-jeu-ivoire focus:border-jeu-or focus:outline-none">
        <option value="">Choisir ma situation</option>
        {disponibles.map(p => <option key={p.id} value={p.id}>{p.nom} · {p.famille}</option>)}
      </select>
    </label>
    {!disponibles.length && <p role="status" className="text-[12.5px] text-jeu-ivoire/60">Aucune situation disponible dans cette voie. Consulte les autres spécialités.</p>}
  </div>;
}
