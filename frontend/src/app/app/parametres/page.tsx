'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface Me {
  nom: string;
  pseudo: string | null;
  email: string;
  ville: string | null;
  niveauEtude: string | null;
  domaineBtp: string | null;
  plan: string;
}

export default function ParametresPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  const [form, setForm] = useState({ nom: '', pseudo: '', ville: '', niveauEtude: '', domaineBtp: '' });
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('FREE');
  const [sauvegarde, setSauvegarde] = useState<string | null>(null);

  useEffect(() => {
    api.get<Me>('/auth/me').then((me) => {
      setForm({
        nom: me.nom ?? '',
        pseudo: me.pseudo ?? '',
        ville: me.ville ?? '',
        niveauEtude: me.niveauEtude ?? '',
        domaineBtp: me.domaineBtp ?? '',
      });
      setEmail(me.email);
      setPlan(me.plan);
    });
  }, []);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setSauvegarde(null);
    await api.patch('/users/me', form);
    queryClient.invalidateQueries({ queryKey: ['carriere'] });
    setSauvegarde('Profil mis à jour ✔');
  }

  function deconnexion() {
    clear();
    router.push('/');
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite">Profil & paramètres</h1>
        <p className="text-sm text-graphite/60">{email} · Plan {plan}</p>
      </div>

      <form onSubmit={enregistrer} className="space-y-4 rounded-2xl border border-pierre bg-white p-6">
        {(
          [
            ['nom', 'Nom'],
            ['pseudo', 'Pseudo'],
            ['ville', 'Ville'],
            ['niveauEtude', "Niveau d'étude"],
            ['domaineBtp', 'Domaine BTP'],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-graphite">{label}</label>
            <input
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none"
            />
          </div>
        ))}
        {sauvegarde && <p className="text-sm text-olive">{sauvegarde}</p>}
        <button type="submit" className="w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire hover:bg-argile">
          Enregistrer
        </button>
      </form>

      <button onClick={deconnexion} className="w-full rounded-full border border-graphite/20 py-3 font-semibold text-graphite hover:bg-graphite/5">
        Se déconnecter
      </button>
    </div>
  );
}
