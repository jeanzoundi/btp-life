'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UserCompetence {
  id: string;
  niveauActuel: number;
  xp: number;
  competence: { nom: string; domaine: string };
}
interface Competence {
  id: string;
  nom: string;
  domaine: string;
}

export default function CompetencesPage() {
  const { data: miennes } = useQuery({
    queryKey: ['competences', 'mine'],
    queryFn: () => api.get<UserCompetence[]>('/users/me/competences'),
  });
  const { data: toutes } = useQuery({
    queryKey: ['catalog', 'competences'],
    queryFn: () => api.get<{ items: Competence[] }>('/catalog/competences?pageSize=100'),
  });

  const acquisesParNom = new Map((miennes ?? []).map((uc) => [uc.competence.nom, uc]));
  const domaines = [...new Set((toutes?.items ?? []).map((c) => c.domaine))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite">Arbre de compétences</h1>
        <p className="text-sm text-graphite/60">Chaque compétence se valide par des missions et des examens, niveau par niveau (1–5).</p>
      </div>

      {domaines.map((domaine) => (
        <section key={domaine}>
          <h2 className="font-display text-lg font-bold capitalize text-graphite">{domaine}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(toutes?.items ?? [])
              .filter((c) => c.domaine === domaine)
              .map((c) => {
                const acquise = acquisesParNom.get(c.nom);
                const niveau = acquise?.niveauActuel ?? 0;
                return (
                  <div key={c.id} className={`rounded-2xl border p-4 ${niveau > 0 ? 'border-olive/40 bg-white' : 'border-pierre bg-pierre/20'}`}>
                    <p className="font-medium text-graphite">{c.nom}</p>
                    <p className="mt-1 font-mono text-sm text-cuivre">
                      {'★'.repeat(niveau)}
                      {'☆'.repeat(Math.max(0, 5 - niveau))}
                    </p>
                    <p className="mt-1 text-xs text-graphite/50">
                      {niveau > 0 ? `Niveau ${niveau} — ${acquise?.xp ?? 0} XP` : 'Non validée — joue des missions liées'}
                    </p>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
