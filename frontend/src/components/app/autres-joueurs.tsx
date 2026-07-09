'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AvatarBtp } from './avatar-btp';
import { traitParSlug } from '@/lib/traits';
import { jouerSon } from '@/lib/sons';

export const NB_EMPLACEMENTS_CENTRE_VILLE = 9;

export interface JoueurActif {
  userId: string;
  nom: string;
  avatarConfig: unknown;
  profil: string | null;
  niveau: number;
  reputation: number;
}
interface ProfilPublic {
  nom: string;
  avatarConfig: unknown;
  niveau: number;
  xp: number;
  reputation: number;
  profil: string | null;
  metierCible: string | null;
  traits: string[];
  nbBadges: number;
  nbCertificats: number;
}

// Emplacements fixes dans la scène (pourcentages, relatifs au canvas 1500x1050 de la ville) où
// les autres joueurs peuvent apparaître — répartis dans le centre-ville, distincts de la
// position par défaut du joueur principal.
const EMPLACEMENTS = [
  { xPct: 16.2, yPct: 35.4 },
  { xPct: 37.8, yPct: 28.3 },
  { xPct: 33.6, yPct: 41.3 },
  { xPct: 21.6, yPct: 26.0 },
  { xPct: 42.0, yPct: 37.2 },
  { xPct: 13.2, yPct: 28.3 },
  { xPct: 30.6, yPct: 13.6 },
  { xPct: 6.6, yPct: 29.3 },
  { xPct: 33.3, yPct: 20.0 },
];

/** Vraies avatars d'autres joueurs, plantés dans le quartier — le monde est partagé, pas solo. */
export function AutresJoueurs({ joueurs }: { joueurs: JoueurActif[] }) {
  const [selectionne, setSelectionne] = useState<JoueurActif | null>(null);

  return (
    <>
      {joueurs.map((j, i) => {
        const spot = EMPLACEMENTS[i % EMPLACEMENTS.length];
        return (
          <button
            key={j.userId}
            onClick={() => {
              jouerSon('clic');
              setSelectionne(j);
            }}
            className="absolute flex -translate-x-1/2 flex-col items-center transition-transform hover:scale-110"
            style={{ left: `${spot.xPct}%`, top: `${spot.yPct}%` }}
            aria-label={`Voir le profil de ${j.nom}`}
          >
            {/* Léger balancement latéral (désynchronisé par joueur) pour ne pas les figer sur place */}
            <span
              className="anim-sway flex flex-col items-center"
              style={{ animationDelay: `${(i % 5) * 0.35}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}
            >
              <span className="anim-float block">
                <AvatarBtp config={j.avatarConfig} taille={46} className="!rounded-full shadow-md ring-2 ring-cuivre/50" />
              </span>
              <span className="mt-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-graphite shadow">
                {j.nom} · Niv.{j.niveau}
              </span>
            </span>
          </button>
        );
      })}

      {selectionne && <CarteJoueur joueur={selectionne} onFermer={() => setSelectionne(null)} />}
    </>
  );
}

export function CarteJoueur({ joueur, onFermer }: { joueur: JoueurActif; onFermer: () => void }) {
  const queryClient = useQueryClient();
  const [salue, setSalue] = useState(false);

  const { data: profil, isLoading } = useQuery({
    queryKey: ['carriere', 'joueur', joueur.userId],
    queryFn: () => api.get<ProfilPublic>(`/carriere/joueurs/${joueur.userId}`),
  });

  const saluer = useMutation({
    mutationFn: () => api.post<{ message: string }>('/carriere/besoins/social'),
    onSuccess: () => {
      jouerSon('succes');
      setSalue(true);
      queryClient.invalidateQueries({ queryKey: ['carriere', 'me'] });
    },
    onError: () => setSalue(true),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/50 p-4" onClick={onFermer}>
      <div
        className="anim-fade-up w-full max-w-sm rounded-3xl border-2 border-cuivre/30 bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="anim-float inline-block">
          <AvatarBtp config={profil?.avatarConfig ?? joueur.avatarConfig} taille={88} className="!rounded-full shadow-lg ring-4 ring-cuivre/20" />
        </div>
        <p className="mt-3 font-display text-lg font-bold text-graphite">{profil?.nom ?? joueur.nom}</p>
        <p className="text-sm text-graphite/60">
          {profil?.profil ?? joueur.profil ?? 'Profil à choisir'}
          {profil?.metierCible && <> → {profil.metierCible}</>}
        </p>

        {isLoading ? (
          <p className="mt-4 text-xs text-graphite/40">Chargement…</p>
        ) : (
          <>
            <div className="mt-4 flex justify-center gap-2 text-xs">
              <span className="rounded-full bg-olive/10 px-3 py-1 font-semibold text-olive">Niv. {profil?.niveau ?? joueur.niveau}</span>
              <span className="rounded-full bg-cuivre/10 px-3 py-1 font-semibold text-cuivre">🏅 {profil?.reputation ?? joueur.reputation}</span>
              <span className="rounded-full bg-pierre px-3 py-1 font-semibold text-graphite/60">🏆 {profil?.nbBadges ?? 0} badges</span>
            </div>
            {!!(profil?.traits ?? []).length && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {(profil?.traits ?? []).map((slug) => {
                  const t = traitParSlug(slug);
                  return t ? (
                    <span key={slug} className="rounded-full bg-terracotta/10 px-2.5 py-0.5 text-xs font-semibold text-terracotta">
                      {t.icone} {t.nom}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => saluer.mutate()}
            disabled={salue || saluer.isPending}
            className="flex-1 rounded-full bg-terracotta py-2.5 text-sm font-semibold text-ivoire transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {salue ? '👋 Salué !' : '👋 Saluer'}
          </button>
          <button onClick={onFermer} className="rounded-full border border-graphite/20 px-4 py-2.5 text-sm font-semibold text-graphite">
            Fermer
          </button>
        </div>
        <p className="mt-2 text-[10px] text-graphite/40">Un autre vrai joueur de BTP Life, actif récemment.</p>
      </div>
    </div>
  );
}
