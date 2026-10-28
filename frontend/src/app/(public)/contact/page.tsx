'use client';

import { useState } from 'react';

const ADRESSE_CONTACT = 'contact@btplife.com';

export default function ContactPage() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' });
  const [envoye, setEnvoye] = useState(false);

  // Le site n'envoie pas encore les messages lui-même : la messagerie du visiteur s'ouvre avec le message prêt à partir.
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const corps = `${form.message}\n\n— ${form.nom} (${form.email})`;
    window.location.href = `mailto:${ADRESSE_CONTACT}?subject=${encodeURIComponent(form.sujet)}&body=${encodeURIComponent(corps)}`;
    setEnvoye(true);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-graphite">Contact</h1>
      <p className="mt-2 text-graphite/70">
        Une question, une école à équiper, un partenariat ? Écris-nous à{' '}
        <a href={`mailto:${ADRESSE_CONTACT}`} className="font-semibold text-terracotta underline">{ADRESSE_CONTACT}</a>.
        Le formulaire ci-dessous prépare ton message dans ta messagerie : il te reste à l&apos;envoyer.
      </p>

      {envoye ? (
        <div className="mt-8 rounded-2xl border border-olive bg-olive/5 p-6 text-center">
          <p className="font-display font-bold text-olive">Ta messagerie s&apos;est ouverte ✔</p>
          <p className="mt-2 text-sm text-graphite/70">
            Ton message y est prêt : envoie-le pour qu&apos;il nous parvienne. Rien ne s&apos;est ouvert ? Écris-nous
            directement à {ADRESSE_CONTACT}.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-graphite">Nom</label>
              <input required value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-graphite">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-graphite">Sujet</label>
            <input required value={form.sujet} onChange={(e) => setForm((f) => ({ ...f, sujet: e.target.value }))} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-graphite">Message</label>
            <textarea required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
          </div>
          <button type="submit" className="w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire hover:bg-argile">
            Préparer le message dans ma messagerie
          </button>
        </form>
      )}
    </div>
  );
}
