'use client';

import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';

type Item = Record<string, unknown> & { id: string };

// Champs masqués dans le tableau (trop verbeux) mais conservés dans l'éditeur JSON.
const COLONNES_MASQUEES = new Set(['contenus', 'variantesPays', 'cours', 'niveaux', 'exercices', 'phases', 'ressources']);

export default function AdminResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = use(params);
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<Item | null>(null);
  const [creation, setCreation] = useState(false);
  const [brouillon, setBrouillon] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['admin', resource],
    queryFn: () => api.get<{ items: Item[]; total: number }>(`/admin/${resource}?pageSize=100`),
  });

  const items = data?.items ?? [];
  const colonnes = items.length
    ? Object.keys(items[0]).filter((k) => !COLONNES_MASQUEES.has(k) && typeof items[0][k] !== 'object').slice(0, 6)
    : [];

  function ouvrirEdition(item: Item) {
    setCreation(false);
    setSelection(item);
    setErreur(null);
    const { id: _id, ...rest } = item;
    setBrouillon(JSON.stringify(rest, null, 2));
  }

  function ouvrirCreation() {
    setSelection(null);
    setCreation(true);
    setErreur(null);
    setBrouillon('{\n  \n}');
  }

  async function sauvegarder() {
    setErreur(null);
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(brouillon);
    } catch {
      setErreur('JSON invalide');
      return;
    }
    // Les relations imbriquées ne sont pas éditables via ce formulaire générique.
    for (const cle of COLONNES_MASQUEES) delete payload[cle];
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.majLe;
    try {
      if (creation) {
        await api.post(`/admin/${resource}`, payload);
      } else if (selection) {
        await api.patch(`/admin/${resource}/${selection.id}`, payload);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', resource] });
      setSelection(null);
      setCreation(false);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur de sauvegarde');
    }
  }

  async function supprimer() {
    if (!selection) return;
    if (!window.confirm(`Supprimer définitivement cet élément de "${resource}" ?`)) return;
    try {
      await api.delete(`/admin/${resource}/${selection.id}`);
      queryClient.invalidateQueries({ queryKey: ['admin', resource] });
      setSelection(null);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Suppression impossible (références existantes ?)');
    }
  }

  const editionOuverte = creation || selection !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold capitalize text-graphite">
          {resource.replaceAll('-', ' ')} ({data?.total ?? 0})
        </h1>
        <button onClick={ouvrirCreation} className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-ivoire hover:bg-argile">
          + Créer
        </button>
      </div>

      <div className={`grid gap-6 ${editionOuverte ? 'lg:grid-cols-2' : ''}`}>
        <div className="overflow-x-auto rounded-2xl border border-pierre bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pierre text-left text-xs uppercase tracking-wide text-graphite/50">
                {colonnes.map((c) => (
                  <th key={c} className="px-3 py-2">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => ouvrirEdition(item)}
                  className={`cursor-pointer border-b border-pierre/50 hover:bg-pierre/30 ${selection?.id === item.id ? 'bg-terracotta/5' : ''}`}
                >
                  {colonnes.map((c) => (
                    <td key={c} className="max-w-48 truncate px-3 py-2 text-graphite/80">
                      {String(item[c] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td className="px-3 py-6 text-center text-graphite/50">Aucun élément.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {editionOuverte && (
          <div className="rounded-2xl border border-pierre bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-graphite">{creation ? 'Nouvel élément' : `Édition — ${selection?.id}`}</p>
              <button onClick={() => { setSelection(null); setCreation(false); }} className="text-sm text-graphite/50 hover:text-graphite">
                ✕ Fermer
              </button>
            </div>
            <textarea
              value={brouillon}
              onChange={(e) => setBrouillon(e.target.value)}
              rows={20}
              spellCheck={false}
              className="mt-3 w-full rounded-lg border border-pierre p-3 font-mono text-xs focus:border-terracotta focus:outline-none"
            />
            {erreur && <p className="mt-2 text-sm text-terracotta">{erreur}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={sauvegarder} className="flex-1 rounded-full bg-terracotta py-2 text-sm font-semibold text-ivoire hover:bg-argile">
                Sauvegarder
              </button>
              {!creation && (
                <button onClick={supprimer} className="rounded-full border border-terracotta px-4 py-2 text-sm font-semibold text-terracotta hover:bg-terracotta/5">
                  Supprimer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
