import Link from 'next/link';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BTP Life pour les écoles',
  description: 'Un outil pédagogique clé en main pour former vos élèves aux métiers du bâtiment de façon ludique.',
};

export default function EcolesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold text-graphite">BTP Life pour les écoles</h1>
      <p className="mt-4 text-lg text-graphite/70">
        Offrez à vos étudiants un terrain d&apos;entraînement virtuel : missions pratiques, chantiers simulés,
        académie et monde vivant, dès aujourd&apos;hui. Les outils propres aux écoles se construisent avec nos écoles pilotes.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {[
          ['Zéro logistique', 'Une application installable sur tout téléphone — aucune salle informatique requise.', ''],
          ['Dashboard de suivi', 'Progression détaillée par étudiant et par classe : missions jouées, taux de réussite, compétences validées.', 'En préparation'],
          ['Challenges inter-classes', 'Motivez vos promotions avec des défis collectifs et des classements internes.', 'En préparation'],
          ['Examens supervisés', 'Tests chronométrés avec conditions contrôlées pour évaluer objectivement.', 'En préparation'],
        ].map(([titre, texte, statut]) => (
          <div key={titre} className="rounded-2xl border border-pierre bg-white p-6">
            <p className="flex flex-wrap items-center gap-2 font-display font-bold text-terracotta">{titre}{statut && <span className="rounded-full bg-sable/60 px-2 py-0.5 font-sans text-[11px] font-semibold text-graphite/70">{statut}</span>}</p>
            <p className="mt-2 text-sm text-graphite/70">{texte}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-graphite p-8 text-center text-ivoire">
        <p className="font-display text-xl font-bold">Programme pilote — écoles d&apos;Abidjan</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ivoire/70">
          Nous cherchons des écoles partenaires pour la bêta fermée. Accès gratuit pour la première promotion.
        </p>
        <Link href="/contact" className="mt-4 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-ivoire hover:bg-argile">
          Demander une démo
        </Link>
      </div>
    </div>
  );
}
