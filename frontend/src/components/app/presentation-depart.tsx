'use client';

import type { ModeExperience } from '@/lib/mode-experience-store';
import { PROFILS_DEPART, profilsPourPorte, type ProfilCatalogue, type ProfilDepart } from '@/lib/profils-depart';

export function PresentationModes({ mode, onMode }: { mode: ModeExperience; onMode: (mode: ModeExperience) => void }) {
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Mode de départ">
      {([
        ['classique', '📚', 'Mode classique', 'Accède directement aux cours, missions, finances et à ta carrière.'],
        ['monde', '🌍', 'Mode vivant', 'Incarne ton personnage, explore Abidjan et rejoins les lieux de ton parcours.'],
      ] as const).map(([id, icone, titre, description]) => <button type="button" role="radio" aria-checked={mode === id} key={id} onClick={() => onMode(id)}
        className={`rounded-2xl border-2 p-5 text-left transition-colors ${mode === id ? 'border-terracotta bg-terracotta/10' : 'border-pierre bg-white hover:border-sable'}`}>
        <span className="text-3xl" aria-hidden="true">{icone}</span>
        <span className="mt-3 block font-display text-lg font-bold text-graphite">{titre}</span>
        <span className="mt-2 block text-sm leading-relaxed text-graphite/70">{description}</span>
      </button>)}
    </div>
    <p className="rounded-xl bg-olive/10 p-3 text-sm text-graphite">Un seul compte, un seul personnage, la même progression et le même argent. Tu pourras changer de mode sans recommencer.</p>
  </div>;
}

export function SelectionProfilDepart({ profils, porte, profilId, onPorte, onProfil }: {
  profils: ProfilCatalogue[]; porte: ProfilDepart | null; profilId: string;
  onPorte: (porte: ProfilDepart | null) => void; onProfil: (id: string) => void;
}) {
  const choix = PROFILS_DEPART.find(p => p.id === porte);
  const disponibles = profilsPourPorte(profils, porte);
  return <div className="space-y-4">
    <div role="radiogroup" aria-label="Cinq profils de départ" className="grid gap-2 sm:grid-cols-2">
      {PROFILS_DEPART.map(p => <button type="button" role="radio" aria-checked={porte === p.id} key={p.id} onClick={() => onPorte(p.id)}
        className={`rounded-xl border-2 p-4 text-left transition-colors ${porte === p.id ? 'border-terracotta bg-terracotta/10' : 'border-pierre bg-white hover:border-sable'}`}>
        <span className="block font-display font-bold text-graphite">{p.icone} {p.nom}</span>
        <span className="mt-1 block text-xs leading-relaxed text-graphite/70">{p.description}</span>
      </button>)}
    </div>
    {choix && <p className="rounded-xl bg-olive/10 p-3 text-sm text-graphite"><strong>Ton quotidien :</strong> {choix.quotidien}</p>}
    <button type="button" onClick={() => onPorte(null)} className="text-sm font-semibold text-terracotta underline underline-offset-4">Explorer toutes les spécialités : métré, HSE, topographie…</button>
    <label className="block text-sm font-semibold text-graphite">{porte ? 'Ta situation dans cette voie' : 'Toutes les situations du catalogue'}
      <select value={profilId} onChange={e => onProfil(e.target.value)} className="mt-2 w-full rounded-xl border-2 border-pierre bg-white p-3 font-normal focus:border-terracotta focus:outline-none">
        <option value="">Choisir ma situation</option>
        {disponibles.map(p => <option key={p.id} value={p.id}>{p.nom} · {p.famille}</option>)}
      </select>
    </label>
    {!disponibles.length && <p role="status" className="text-sm text-graphite/60">Aucune situation disponible dans cette voie. Consulte les autres spécialités.</p>}
  </div>;
}
