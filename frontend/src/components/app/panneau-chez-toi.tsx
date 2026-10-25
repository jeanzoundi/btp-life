'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { conseilsDuMatin, type RendezVous } from '@/lib/journee-joueur';
import { heureLisible } from './panneau-programme-lieu';
import { PanneauCabine } from './panneaux-loisirs';

// Chez soi, à la Résidence Lagune : la journée qui attend (programmes, chantier, conseils des besoins), le vrai
// courrier du joueur et sa garde-robe ; au réveil, le même programme s'affiche de lui-même.

interface Message { id: string; contenu: string; lu: boolean; createdAt: string; pnj: { nom: string; role: string } }
interface Besoins { faim: number; social: number; moral: number }

function EnTete({ surtitre, titre, onFermer }: { surtitre: string; titre: string; onFermer?: () => void }) {
  return <div className="flex items-start justify-between gap-3">
    <div><p className="hud-legende text-jeu-or">{surtitre}</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{titre}</h2></div>
    {onFermer && <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>}
  </div>;
}

/** Les rendez-vous du jour, avec l'heure d'ouverture et l'étape qui attend ; puis ce que les besoins conseillent. */
function ContenuJournee({ heure, rendezVous, besoins, onAller }: { heure: number; rendezVous: RendezVous[]; besoins: Besoins; onAller: (slug: string) => void }) {
  const conseils = conseilsDuMatin(besoins);
  return <>
    <ul className="mt-3 space-y-1.5">{rendezVous.map(r => {
      const ouvert = heure >= r.ouverture && heure < r.fermeture;
      return <li key={r.slug} className="flex items-center gap-3 rounded-xl bg-white/[.05] p-2.5">
        <span className={`hud-chiffre w-[78px] shrink-0 text-[12px] ${ouvert ? 'text-jeu-lagune' : 'text-jeu-or'}`}>{heureLisible(r.ouverture)} – {heureLisible(r.fermeture)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold">{r.nom}</span>
          <span className="block truncate text-[11px] text-jeu-ivoire/60">{r.titre} · {r.detail}</span>
        </span>
        <button type="button" onClick={() => onAller(r.slug)} className="hud-bouton hud-bouton-verre shrink-0 px-2.5 py-1.5 text-[11.5px]">{ouvert ? 'Y aller' : 'Itinéraire'}</button>
      </li>;
    })}</ul>
    {conseils.length > 0 && <div className="mt-3 rounded-xl bg-black/20 p-3">
      <p className="hud-legende mb-1">Tes besoins conseillent</p>
      {conseils.map(c => <button key={c.slug} type="button" onClick={() => onAller(c.slug)} className="block w-full py-1 text-left text-[12px] leading-snug text-jeu-ivoire/80 hover:text-jeu-or">{c.texte} →</button>)}
    </div>}
  </>;
}

/** Au réveil, après une nuit dans son lit : la journée qui commence. */
export function PanneauMatin({ heure, rendezVous, besoins, onAller, onFermer }: {
  heure: number; rendezVous: RendezVous[]; besoins: Besoins; onAller: (slug: string) => void; onFermer: () => void;
}) {
  return <section role="dialog" aria-label="Ta journée" className="hud-verre fixed inset-x-3 bottom-3 z-[120] mx-auto max-h-[80%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-5 sm:mx-0 sm:w-[440px]">
    <EnTete surtitre="Résidence Lagune · réveil" titre={`Bonjour ! Il est ${heureLisible(heure)}`} onFermer={onFermer} />
    <p className="mt-2 text-[12.5px] leading-relaxed text-jeu-ivoire/75">Une nuit complète : ton énergie est au maximum. Voici ce qui t’attend aujourd’hui dans le quartier.</p>
    <ContenuJournee heure={heure} rendezVous={rendezVous} besoins={besoins} onAller={onAller} />
    <button type="button" onClick={onFermer} className="hud-bouton hud-bouton-principal mt-3 w-full p-3 text-sm">Commencer la journée</button>
  </section>;
}

/** Les activités de chez soi : la journée, le courrier (les vrais messages du joueur), la garde-robe (le vrai dressing). */
export function PanneauChezToi({ demo, heure, rendezVous, besoins, onAller }: {
  demo: boolean; heure: number; rendezVous: RendezVous[]; besoins: Besoins; onAller: (slug: string) => void;
}) {
  const [onglet, setOnglet] = useState<'journee' | 'courrier'>('journee');
  const [garde, setGarde] = useState(false);
  const { data: messages } = useQuery({ queryKey: ['messages', 'mine'], queryFn: () => api.get<Message[]>('/users/me/messages'), enabled: !demo, staleTime: 30_000 });
  const nonLus = (messages ?? []).filter(m => !m.lu).length;
  if (garde) return <PanneauCabine demo={demo} onFermer={() => setGarde(false)} />;
  const classeOnglet = (actif: boolean) => `rounded-xl px-2 py-2 text-[12px] font-semibold ${actif ? 'bg-jeu-or text-[#2A1C0E]' : 'bg-white/[.06] text-jeu-ivoire/80'}`;
  return <section role="dialog" aria-label="Chez toi" className="hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-h-[70%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[430px]">
    <EnTete surtitre="Résidence Lagune" titre="Chez toi" />
    <div role="tablist" aria-label="Chez toi" className="mt-3 grid grid-cols-3 gap-1.5">
      <button type="button" role="tab" aria-selected={onglet === 'journee'} onClick={() => setOnglet('journee')} className={classeOnglet(onglet === 'journee')}>Ta journée</button>
      <button type="button" role="tab" aria-selected={onglet === 'courrier'} onClick={() => setOnglet('courrier')} className={classeOnglet(onglet === 'courrier')}>Courrier{nonLus ? ` · ${nonLus}` : ''}</button>
      <button type="button" onClick={() => setGarde(true)} className={classeOnglet(false)}>Garde-robe</button>
    </div>
    {onglet === 'journee' ? <ContenuJournee heure={heure} rendezVous={rendezVous} besoins={besoins} onAller={onAller} />
      : demo ? <p className="mt-3 text-[12.5px] leading-relaxed text-jeu-ivoire/75">Les messages de Yao, de tes formateurs et des employeurs arrivent ici. Connecte-toi pour lire les tiens.</p>
      : !messages?.length ? <p className="mt-3 text-[12.5px] text-jeu-ivoire/70">Boîte aux lettres vide pour l’instant.</p>
      : <ul className="mt-3 space-y-1.5">{messages.slice(0, 4).map(m => <li key={m.id} className={`rounded-xl p-2.5 ${m.lu ? 'bg-white/[.04]' : 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40'}`}>
        <p className="text-[12.5px] font-bold">{m.pnj.nom} <span className="text-[11px] font-semibold text-jeu-ivoire/55">· {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span></p>
        <p className="line-clamp-2 text-[12px] leading-snug text-jeu-ivoire/75">{m.contenu}</p>
      </li>)}</ul>}
    {onglet === 'courrier' && !demo && <Link href="/app/messages" className="hud-bouton hud-bouton-or mt-3 flex w-full p-2.5 text-center text-[12.5px]">Tout lire →</Link>}
    <p className="mt-2 text-[10.5px] leading-snug text-jeu-ivoire/50">Le lit fait passer la nuit jusqu’à 6 h 30. Cuisiner et recevoir un voisin coûtent moins cher que le maquis et le café.</p>
  </section>;
}
