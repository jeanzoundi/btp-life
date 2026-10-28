import Link from 'next/link';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BTP Life pour les entreprises',
  description: 'Formez et évaluez vos équipes sur les métiers du bâtiment avec un simulateur de carrière engageant.',
};

export default function EntreprisesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold text-graphite">BTP Life pour les entreprises</h1>
      <p className="mt-4 text-lg text-graphite/70">
        Formez vos équipes chantier sans immobiliser un seul engin : missions, chantiers simulés et académie sont
        ouverts dès aujourd&apos;hui. Les outils propres aux entreprises se construisent avec nos premiers partenaires.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {[
          ['Onboarding accéléré', 'Vos nouvelles recrues s’entraînent sur les missions et les chantiers simulés avant même le premier jour sur site.', ''],
          ['Tests de compétences', "Évaluez objectivement un candidat ou un employé sur la sécurité, la lecture de plans, le métré ou la décision chantier.", 'En préparation'],
          ['Campagnes de formation', 'Assignez des parcours ciblés (HSE, qualité, logiciels) et suivez leur complétion.', 'En préparation'],
          ['Suivi des équipes', 'Tableaux de bord par équipe : forces, faiblesses et progression sur 12 axes.', 'En préparation'],
        ].map(([titre, texte, statut]) => (
          <div key={titre} className="rounded-2xl border border-pierre bg-white p-6">
            <p className="flex flex-wrap items-center gap-2 font-display font-bold text-terracotta">{titre}{statut && <span className="rounded-full bg-sable/60 px-2 py-0.5 font-sans text-[11px] font-semibold text-graphite/70">{statut}</span>}</p>
            <p className="mt-2 text-sm text-graphite/70">{texte}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-graphite p-8 text-center text-ivoire">
        <p className="font-display text-xl font-bold">Parlons de vos besoins de formation</p>
        <Link href="/contact" className="mt-4 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-ivoire hover:bg-argile">
          Contacter l&apos;équipe
        </Link>
      </div>
    </div>
  );
}
