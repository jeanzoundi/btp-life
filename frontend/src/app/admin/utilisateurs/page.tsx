'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  nom: string;
  pseudo: string | null;
  role: string;
  plan: string;
  banni: boolean;
  createdAt: string;
}

export default function AdminUtilisateursPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');

  const { data } = useQuery({
    queryKey: ['admin', 'users', q],
    queryFn: () => api.get<{ items: AdminUser[]; total: number }>(`/admin/users?q=${encodeURIComponent(q)}`),
  });

  async function toggleBan(u: AdminUser) {
    await api.patch(`/admin/users/${u.id}`, { banni: !u.banni });
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-graphite">Utilisateurs ({data?.total ?? 0})</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher email ou nom…"
          className="rounded-lg border border-pierre px-4 py-2 text-sm focus:border-terracotta focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-pierre bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pierre text-left text-xs uppercase tracking-wide text-graphite/50">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((u) => (
              <tr key={u.id} className={`border-b border-pierre/50 ${u.banni ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-mono text-xs text-graphite">{u.email}</td>
                <td className="px-4 py-3 text-graphite">{u.pseudo ?? u.nom}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-terracotta/10 text-terracotta' : 'bg-pierre text-graphite/60'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-graphite/70">{u.plan}</td>
                <td className="px-4 py-3 text-graphite/50">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleBan(u)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${u.banni ? 'bg-olive/10 text-olive' : 'bg-terracotta/10 text-terracotta'}`}
                  >
                    {u.banni ? 'Réactiver' : 'Suspendre'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
