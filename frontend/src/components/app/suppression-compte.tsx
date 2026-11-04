'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

/** Supprimer son compte depuis les paramètres. Un premier clic ouvre la confirmation : elle dit ce qui disparaît et demande
 * le mot de passe, que le serveur vérifie (il refuse aussi les comptes d'administration et École ou Entreprise). */
export function SuppressionCompte({ onSupprime }: { onSupprime: () => void | Promise<void> }) {
  const [ouvert, setOuvert] = useState(false);
  const [motDePasse, setMotDePasse] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function annuler() {
    setOuvert(false); setMotDePasse(''); setErreur(null);
  }

  async function supprimer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true); setErreur(null);
    try {
      await api.post('/users/me/suppression', { password: motDePasse });
    } catch (err) {
      setErreur(err instanceof ApiError
        ? err.status === 429 ? 'Trop d’essais : attends une minute avant de réessayer.' : err.message
        : 'Suppression impossible pour le moment : vérifie ta connexion et réessaie.');
      setEnvoi(false);
      return;
    }
    await onSupprime();
  }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className="w-full rounded-full py-3 text-sm font-semibold text-terracotta hover:bg-terracotta/5">
        Supprimer mon compte
      </button>
    );
  }
  return (
    <form onSubmit={supprimer} aria-label="Supprimer ton compte" className="space-y-3 rounded-2xl border border-terracotta/40 bg-terracotta/5 p-6">
      <h2 className="font-display text-base font-bold text-graphite">Supprimer ton compte</h2>
      <p className="text-sm text-graphite/75">
        C’est définitif : ton personnage, ta progression, tes certificats, tes messages et ta place dans ton équipe disparaissent,
        sans retour possible. Si tu diriges une équipe, ton plus ancien coéquipier en devient le chef.
      </p>
      <label className="block text-sm font-medium text-graphite">
        Ton mot de passe, pour confirmer
        <input
          type="password"
          autoComplete="current-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="mt-1 w-full rounded-lg border border-pierre bg-white px-4 py-2 font-normal focus:border-terracotta focus:outline-none"
        />
      </label>
      {erreur && <p role="alert" className="text-sm font-semibold text-terracotta">{erreur}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={annuler} className="flex-1 rounded-full border border-graphite/20 py-2.5 text-sm font-semibold text-graphite hover:bg-graphite/5">
          Annuler
        </button>
        <button type="submit" disabled={!motDePasse || envoi} className="flex-1 rounded-full bg-terracotta py-2.5 text-sm font-semibold text-ivoire hover:bg-argile disabled:opacity-50">
          {envoi ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
      </div>
    </form>
  );
}
