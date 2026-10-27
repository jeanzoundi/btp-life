'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ETAPES_PREMIERS_PAS, RECOMPENSES_PREMIERS_PAS, ajouterEtape, prochaineEtape, recompenseEtape, type EtapePremiersPas, type EtatPremiersPas,
} from '@/lib/premiers-pas';
import { francs } from '@/lib/patrimoine';

// Le premier quart d'heure guidé, dans la ville : le serveur tient les étapes faites et verse les récompenses ; en
// démonstration, le navigateur joue le même guide.

/** Les étapes du guide et leur validation ; `onEtape` reçoit chaque étape réussie, avec sa récompense. */
export function usePremiersPas({ demo, onEtape }: {
  demo: boolean; onEtape?: (etape: EtapePremiersPas, termine: boolean, recompense: { argent: number; xp: number }) => void;
}) {
  const client = useQueryClient();
  const { data } = useQuery({ queryKey: ['monde', 'premiers-pas'], queryFn: () => api.get<EtatPremiersPas>('/monde/premiers-pas'), enabled: !demo, staleTime: 300_000 });
  const [faitesDemo, setFaitesDemo] = useState<EtapePremiersPas[]>([]);
  // La liste de démonstration la plus récente : deux étapes validées coup sur coup ne s'écrasent pas.
  const demoRef = useRef<EtapePremiersPas[]>([]);
  const faites = demo ? faitesDemo : data?.faites ?? [];
  const afficher = demo ? faitesDemo.length < ETAPES_PREMIERS_PAS.length : Boolean(data?.afficher);
  // Les étapes déjà faites ou en cours d'envoi, lues à jour par les effets de la ville.
  const vues = useRef(new Set<EtapePremiersPas>());
  faites.forEach(e => vues.current.add(e));
  const pret = demo || data !== undefined;

  const valider = useCallback(async (etape: EtapePremiersPas) => {
    if (!pret || !afficher || vues.current.has(etape)) return;
    vues.current.add(etape);
    if (demo) {
      const suivantes = ajouterEtape(demoRef.current, etape), termine = suivantes.length === ETAPES_PREMIERS_PAS.length;
      demoRef.current = suivantes;
      setFaitesDemo(suivantes);
      onEtape?.(etape, termine, recompenseEtape(termine));
      return;
    }
    try {
      const r = await api.post<EtatPremiersPas & { recompense: { argentVirtuel: number; xp: number } | null }>(`/monde/premiers-pas/${etape}`);
      client.setQueryData(['monde', 'premiers-pas'], r);
      client.invalidateQueries({ queryKey: ['carriere', 'me'] });
      if (r.recompense) onEtape?.(etape, Boolean(r.termineLe), { argent: r.recompense.argentVirtuel, xp: r.recompense.xp });
    } catch { vues.current.delete(etape); }
  }, [pret, afficher, demo, onEtape, client]);

  return { faites, afficher, valider };
}

/** Le panneau du guide : les cinq étapes, la prochaine détaillée, et ce qu'elles rapportent ; replié, la prochaine étape reste affichée. */
export function PanneauPremiersPas({ faites, ouvert, onBasculer, onMasquer }: {
  faites: readonly EtapePremiersPas[]; ouvert: boolean; onBasculer: () => void; onMasquer: () => void;
}) {
  const prochaine = prochaineEtape(faites);
  const { etape, finale } = RECOMPENSES_PREMIERS_PAS;
  return <section aria-label="Premiers pas" className="hud-verre pointer-events-auto min-h-0 overflow-y-auto rounded-2xl p-3 text-jeu-ivoire">
    <header className="flex items-center gap-2">
      <h3 className="hud-titre flex-1 text-[13.5px]">Premiers pas · {faites.length}/{ETAPES_PREMIERS_PAS.length}</h3>
      <button type="button" aria-expanded={ouvert} aria-label={ouvert ? 'Replier le guide' : 'Déplier le guide'} onClick={onBasculer} className="rounded-full px-2 text-[15px] leading-none hover:bg-white/10">{ouvert ? '−' : '+'}</button>
    </header>
    {!ouvert && prochaine && <p className="mt-1 truncate text-[12px] font-semibold text-jeu-or">▸ {prochaine.titre}</p>}
    {ouvert && <>
      <ol className="mt-2 space-y-1.5">
        {ETAPES_PREMIERS_PAS.map(e => {
          const fait = faites.includes(e.id), courante = e.id === prochaine?.id;
          return <li key={e.id} className={`flex gap-2 rounded-lg px-2 py-1 ${courante ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40' : ''}`}>
            <span aria-hidden className={`text-[12px] ${fait ? 'text-jeu-lagune' : courante ? 'text-jeu-or' : 'text-jeu-ivoire/35'}`}>{fait ? '✓' : courante ? '▸' : '○'}</span>
            <div>
              <p className={`text-[12px] font-semibold ${fait ? 'text-jeu-ivoire/55 line-through' : ''}`}>{e.titre}</p>
              {courante && <p className="text-[11px] leading-snug text-jeu-ivoire/70">{e.detail}</p>}
            </div>
          </li>;
        })}
      </ol>
      <p className="mt-2 text-[10.5px] leading-snug text-jeu-ivoire/55">+{francs(etape.argent)} et +{etape.xp} XP à chaque étape ; +{francs(finale.argent)} et +{finale.xp} XP de plus à la fin.</p>
      <button type="button" onClick={onMasquer} className="mt-1 text-[10.5px] text-jeu-ivoire/45 hover:underline">Masquer le guide</button>
    </>}
  </section>;
}
