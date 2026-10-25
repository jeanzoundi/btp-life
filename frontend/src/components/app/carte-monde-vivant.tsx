'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { adresseMonde, LIEUX_MONDE } from '@/lib/liens-modes';
import { LIEUX_PROGRAMME } from '@/lib/lieux-programme';
import { useModeExperienceStore } from '@/lib/mode-experience-store';
import { personnageChoisi, personnageDe, personnageProche } from '@/lib/personnages-joueur';
import type { ProgresLieuServeur } from '@/lib/programme-lieu';
import { AvatarBtp } from './avatar-btp';
import { ChoixPersonnage, useEnregistrerPersonnage } from './choix-personnage';

/** Le monde vivant vu depuis l'accueil classique : le même personnage, et où l'on en est dans les lieux du quartier. */
export function CarteMondeVivant({ avatar }: { avatar?: { nomPersonnage?: string; config?: unknown } | null }) {
  const router = useRouter();
  const setMode = useModeExperienceStore((s) => s.setMode);
  const [choix, setChoix] = useState(false);
  const enregistrer = useEnregistrerPersonnage(false);
  const { data: progres } = useQuery({
    queryKey: ['carriere', 'lieux'], queryFn: () => api.get<Record<string, ProgresLieuServeur>>('/carriere/lieux'), staleTime: 60_000, retry: 1,
  });
  const choisi = personnageChoisi(avatar?.config);
  const personnage = personnageDe(avatar?.config);
  const entrer = (slug?: string) => { setMode('monde'); router.push(adresseMonde(slug)); };
  const lieux = Object.entries(progres ?? {}).filter(([slug]) => LIEUX_PROGRAMME[slug] && LIEUX_MONDE[slug]).map(([slug, p]) => ({
    slug, nom: LIEUX_MONDE[slug].nom, titre: LIEUX_PROGRAMME[slug].programme.titre, total: LIEUX_PROGRAMME[slug].programme.etapes.length, ...p,
  }));
  const commences = lieux.filter(l => l.seances > 0 || l.etapes > 0 || l.cycles > 0).sort((a, b) => b.seances - a.seances);
  // Rien de commencé : trois portes d'entrée pour découvrir le quartier.
  const affiches = commences.length ? commences.slice(0, 4) : lieux.filter(l => ['laboratoire', 'banque', 'agence'].includes(l.slug));
  return <section className="rounded-2xl border border-pierre bg-white p-4 sm:p-5" aria-label="Monde vivant">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <AvatarBtp config={avatar?.config} taille={56} className="shrink-0 !rounded-full ring-2 ring-terracotta/30" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">Monde vivant</p>
          <h2 className="truncate font-display text-lg font-bold text-graphite">{choisi ? `${avatar?.nomPersonnage ?? 'Ton personnage'} · ${personnage.titre}` : 'Choisis ton personnage'}</h2>
          <p className="text-xs text-graphite/60">{choisi
            ? 'Le même personnage marche dans le quartier : ce que tu y fais compte ici, et inversement.'
            : 'Il marchera dans le quartier en 3D, et ton avatar prendra son teint et ses cheveux.'}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setChoix(true)} className="rounded-full border border-pierre px-4 py-2 text-xs font-semibold text-graphite hover:border-terracotta">{choisi ? 'Changer de personnage' : 'Choisir mon personnage'}</button>
        <button type="button" onClick={() => entrer()} className="rounded-full bg-terracotta px-4 py-2 text-xs font-semibold text-ivoire">🌍 Entrer dans le quartier</button>
      </div>
    </div>
    {affiches.length > 0 && <ul className="mt-4 grid gap-2 sm:grid-cols-2">{affiches.map(l => {
      const commence = l.seances > 0 || l.etapes > 0 || l.cycles > 0;
      const cycles = l.cycles ? ` · ${l.cycles} ${l.cycles > 1 ? 'cycles bouclés' : 'cycle bouclé'}` : '';
      return <li key={l.slug}>
        <button type="button" onClick={() => entrer(l.slug)} className="carte-vivante flex w-full items-center justify-between gap-3 rounded-xl border border-pierre px-3 py-2.5 text-left">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-graphite">{l.nom}</span>
            <span className="block truncate text-[11px] text-graphite/55">{l.titre} · {commence ? `étape ${Math.min(l.etapes + 1, l.total)}/${l.total}${cycles}` : 'à découvrir'}</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-terracotta">Y aller →</span>
        </button>
      </li>;
    })}</ul>}
    {choix && <ChoixPersonnage initial={choisi ?? personnageProche(avatar?.config)} nomInitial={avatar?.nomPersonnage ?? ''} avatarConfig={avatar?.config} premierChoix={false} demo={false}
      enCours={enregistrer.isPending} erreur={enregistrer.error ? (enregistrer.error as Error).message || 'Enregistrement impossible pour l’instant.' : null}
      onAnnuler={() => setChoix(false)} onValider={(id, nom) => enregistrer.mutate({ personnage: id, nom }, { onSuccess: () => setChoix(false) })} />}
  </section>;
}
