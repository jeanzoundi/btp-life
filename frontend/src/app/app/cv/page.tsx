'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CvContenu {
  identite?: { nom?: string; pays?: string; referentiel?: string };
  profilActuel?: string | null;
  metierCible?: string | null;
  niveau?: number;
  xp?: number;
  reputation?: number;
  competences?: Array<{ nom: string; niveau: number }>;
  logiciels?: Array<{ nom: string; niveau: number }>;
  experiences?: Array<{ chantier: string; note: string | null; termineLe: string | null }>;
  badges?: Array<{ nom: string; rarete: string }>;
  certificats?: Array<{ nom: string; numero: string }>;
}

export default function CvPage() {
  const queryClient = useQueryClient();
  const { data: cv } = useQuery({
    queryKey: ['cv', 'me'],
    queryFn: () => api.get<{ contenu: CvContenu; majLe: string }>('/cv/me'),
  });

  async function regenerer() {
    await api.post('/cv/me/regenerer');
    queryClient.invalidateQueries({ queryKey: ['cv', 'me'] });
  }

  const c = cv?.contenu ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-graphite">Mon CV virtuel</h1>
          <p className="text-sm text-graphite/60">Généré automatiquement à partir de ta carrière — jamais rédigé à la main.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={regenerer} className="rounded-full border border-graphite/20 px-4 py-2 text-sm font-semibold text-graphite hover:bg-graphite/5">
            Actualiser
          </button>
          <button onClick={() => window.print()} className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-ivoire hover:bg-argile">
            Exporter (imprimer)
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-pierre bg-white p-6 print:border-0">
        <div className="border-b border-pierre pb-4">
          <p className="font-display text-xl font-bold text-graphite">{c.identite?.nom ?? '—'}</p>
          <p className="text-sm text-graphite/60">
            {c.profilActuel ?? 'Profil non défini'} → objectif : {c.metierCible ?? '—'}
          </p>
          <p className="mt-1 text-xs text-graphite/50">
            Niveau {c.niveau ?? 1} · {c.xp ?? 0} XP · Réputation {c.reputation ?? 500}/1000 · Référentiel : {c.identite?.referentiel ?? 'Générique'}
          </p>
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="font-display font-bold text-graphite">Compétences</h2>
            <ul className="mt-2 space-y-1">
              {(c.competences ?? []).map((comp) => (
                <li key={comp.nom} className="flex items-center justify-between text-sm">
                  <span className="text-graphite/80">{comp.nom}</span>
                  <span className="font-mono text-xs text-cuivre">{'★'.repeat(comp.niveau)}{'☆'.repeat(Math.max(0, 5 - comp.niveau))}</span>
                </li>
              ))}
              {!(c.competences ?? []).length && <li className="text-sm text-graphite/50">Aucune compétence validée pour l&apos;instant.</li>}
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-graphite">Logiciels</h2>
            <ul className="mt-2 space-y-1">
              {(c.logiciels ?? []).map((l) => (
                <li key={l.nom} className="flex items-center justify-between text-sm">
                  <span className="text-graphite/80">{l.nom}</span>
                  <span className="font-mono text-xs text-cuivre">Niv. {l.niveau}</span>
                </li>
              ))}
              {!(c.logiciels ?? []).length && <li className="text-sm text-graphite/50">Aucun logiciel validé pour l&apos;instant.</li>}
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-graphite">Expériences chantier</h2>
            <ul className="mt-2 space-y-1">
              {(c.experiences ?? []).map((e, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-graphite/80">{e.chantier}</span>
                  {e.note && <span className="rounded bg-cuivre/10 px-2 text-xs font-bold text-cuivre">Note {e.note}</span>}
                </li>
              ))}
              {!(c.experiences ?? []).length && <li className="text-sm text-graphite/50">Aucun chantier livré pour l&apos;instant.</li>}
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-graphite">Badges & certificats</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {(c.badges ?? []).map((b) => (
                <span key={b.nom} className="rounded-full bg-pierre px-3 py-1 text-xs font-medium text-graphite">
                  🏅 {b.nom}
                </span>
              ))}
              {(c.certificats ?? []).map((ct) => (
                <span key={ct.numero} className="rounded-full bg-cuivre/10 px-3 py-1 text-xs font-medium text-cuivre">
                  📜 {ct.nom}
                </span>
              ))}
              {!(c.badges ?? []).length && !(c.certificats ?? []).length && (
                <span className="text-sm text-graphite/50">Rien pour l&apos;instant — joue des missions !</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
