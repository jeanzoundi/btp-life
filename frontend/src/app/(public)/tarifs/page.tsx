import Link from 'next/link';
import { Reveal } from '@/components/public/reveal';

const INCLUS = [
  'Onboarding et avatar personnalisé',
  'Toutes les missions (14 types) et examens',
  'Chantiers virtuels complets',
  'Académie BTP et académie logiciels',
  'CV virtuel auto-généré et exportable',
  'Badges et récompenses',
  "Offres d'emploi virtuelles et promotions",
  'Référentiels Côte d\'Ivoire et France',
];

const FUTURS = [
  { nom: 'Premium', desc: 'Certificats vérifiables PDF, contenus avancés, support prioritaire.' },
  { nom: 'Écoles', desc: 'Dashboard de suivi des classes, challenges inter-classes, examens supervisés.' },
  { nom: 'Entreprises', desc: 'Tests de compétences, campagnes de formation, suivi des équipes.' },
];

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs',
  description: 'Commence gratuitement sur BTP Life, passe au premium pour débloquer tout le contenu et aller plus loin.',
};

export default function TarifsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <Reveal>
          <p className="mb-4 inline-block rounded-full bg-olive/10 px-4 py-1 text-sm font-semibold text-olive">
            🎉 Offre de lancement
          </p>
          <h1 className="font-display text-4xl font-bold text-graphite">
            BTP Life est <span className="text-terracotta">100 % gratuit</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-graphite/70">
            Pendant la phase de lancement, toute la plateforme est ouverte à tous — sans carte bancaire,
            sans engagement, sans limite de missions.
          </p>
        </Reveal>
      </div>

      <Reveal className="mt-10">
        <div className="mx-auto max-w-2xl rounded-3xl border-2 border-terracotta bg-white p-8 shadow-lg">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-2xl font-bold text-graphite">Accès complet</p>
            <p className="font-display text-4xl font-bold text-terracotta">
              0 FCFA
            </p>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {INCLUS.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-graphite/80">
                <span className="mt-0.5 text-olive">✔</span> {point}
              </li>
            ))}
          </ul>
          <Link
            href="/inscription"
            className="anim-pulse-cta mt-8 block rounded-full bg-terracotta py-3.5 text-center font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile"
          >
            Créer mon compte gratuitement
          </Link>
        </div>
      </Reveal>

      <Reveal className="mt-14">
        <h2 className="text-center font-display text-xl font-bold text-graphite">Et plus tard ?</h2>
        <p className="mt-2 text-center text-sm text-graphite/60">
          Des offres Premium, Écoles et Entreprises arriveront après le lancement — les comptes gratuits
          garderont leurs acquis (XP, badges, CV, progression).
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {FUTURS.map((f) => (
            <div key={f.nom} className="rounded-2xl border border-dashed border-mineral/40 bg-pierre/30 p-5 text-center">
              <p className="font-display font-bold text-graphite/70">{f.nom}</p>
              <p className="mt-1 text-xs text-graphite/50">{f.desc}</p>
              <p className="mt-3 inline-block rounded-full bg-mineral/15 px-3 py-0.5 text-xs font-semibold text-mineral">
                Bientôt
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <p className="mt-10 text-center text-xs text-graphite/50">
        Les certificats BTP Life sont pédagogiques — ils ne constituent pas une habilitation officielle.
      </p>
    </div>
  );
}
