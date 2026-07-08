import Link from 'next/link';
import { fetchCatalog } from '@/lib/api-server';
import { Reveal } from '@/components/public/reveal';
import { Compteur } from '@/components/public/compteur';
import { ChantierAnime } from '@/components/public/chantier-anime';

interface Profil {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  famille: string;
}

const ETAPES = [
  { num: '01', titre: 'Choisis ton métier', texte: 'Étudiant, stagiaire, dessinateur, chef chantier… pars du profil qui te ressemble.', icone: '🎯' },
  { num: '02', titre: 'Apprends en jouant', texte: 'Académie BTP, logiciels simulés, missions courtes — 5 à 20 minutes par session.', icone: '🎮' },
  { num: '03', titre: 'Sois évalué', texte: "Score sur 12 axes, corrections pédagogiques, jamais de cul-de-sac en cas d'échec.", icone: '📊' },
  { num: '04', titre: 'Construis ta carrière', texte: "XP, réputation, promotions, offres d'emploi — un CV virtuel qui se remplit tout seul.", icone: '🏗️' },
];

const METIERS_MARQUEE = [
  '👷 Chef chantier', '📐 Dessinateur BIM', '🧮 Métreur', '🏗️ Conducteur de travaux', '🔬 Géotechnicien',
  '📏 Topographe', '🦺 Responsable HSE', '💼 Entrepreneur', '🧱 Chef d\'équipe', '📊 Économiste',
  '🖥️ Projeteur', '⚙️ Ingénieur structure',
];

export default async function AccueilPage() {
  const profils = await fetchCatalog<{ items: Profil[] }>('/catalog/profils?pageSize=8');

  return (
    <div className="overflow-x-hidden">
      {/* Bandeau gratuit */}
      <div className="bg-olive px-4 py-2 text-center text-sm font-semibold text-ivoire">
        🎉 BTP Life est 100 % gratuit pendant le lancement — toutes les missions, tous les chantiers, sans carte bancaire.
      </div>

      {/* HERO */}
      <section className="texture-beton relative bg-gradient-to-b from-ivoire to-pierre px-4 pb-16 pt-14 md:pb-24 md:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="anim-fade-up mb-4 inline-block rounded-full bg-terracotta/10 px-4 py-1 text-sm font-semibold text-terracotta">
              Le simulateur de carrière BTP
            </p>
            <h1 className="anim-fade-up delai-1 font-display text-4xl font-bold leading-tight text-graphite md:text-6xl">
              Choisis ton métier.<br />
              Apprends. Travaille.<br />
              <span className="text-terracotta">Évolue.</span>
            </h1>
            <p className="anim-fade-up delai-2 mt-6 max-w-xl text-lg text-graphite/70">
              Construis ta carrière dans le BTP à travers des missions jouables, des chantiers virtuels et une
              académie complète — adaptée aux normes de ton pays.
            </p>
            <div className="anim-fade-up delai-3 mt-8 flex flex-wrap gap-4">
              <Link
                href="/inscription"
                className="anim-pulse-cta rounded-full bg-terracotta px-7 py-3.5 font-semibold text-ivoire transition-transform hover:scale-105 hover:bg-argile"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/metiers"
                className="rounded-full border border-graphite/20 px-7 py-3.5 font-semibold text-graphite transition-colors hover:border-terracotta hover:text-terracotta"
              >
                Découvrir les métiers
              </Link>
            </div>
            <p className="anim-fade-up delai-4 mt-4 text-xs text-graphite/50">
              ⚡ Ta première mission en moins de 3 minutes — aucun paiement demandé.
            </p>
          </div>
          <div className="anim-fade-up delai-2 flex justify-center">
            <ChantierAnime />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-pierre bg-white px-4 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 text-center md:grid-cols-4">
          {(
            [
              [29, '', 'profils métiers'],
              [14, '', 'types de missions'],
              [12, '', "axes d'évaluation"],
              [100, ' %', 'gratuit au lancement'],
            ] as const
          ).map(([cible, suffixe, label]) => (
            <Reveal key={label}>
              <p className="text-4xl text-terracotta">
                <Compteur cible={cible} suffixe={suffixe} />
              </p>
              <p className="mt-1 text-sm text-graphite/60">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="font-display text-2xl font-bold text-graphite md:text-3xl">Comment ça marche</h2>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {ETAPES.map((e, i) => (
            <Reveal key={e.num} delay={i * 120}>
              <div className="carte-vivante h-full rounded-2xl border border-pierre bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-bold text-pierre">{e.num}</span>
                  <span className="text-2xl">{e.icone}</span>
                </div>
                <p className="mt-3 font-display font-bold text-graphite">{e.titre}</p>
                <p className="mt-2 text-sm text-graphite/70">{e.texte}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MARQUEE MÉTIERS */}
      <section className="border-y border-pierre bg-graphite py-5">
        <div className="overflow-hidden">
          <div className="marquee-piste gap-8">
            {[...METIERS_MARQUEE, ...METIERS_MARQUEE].map((m, i) => (
              <span key={i} className="whitespace-nowrap text-sm font-medium text-ivoire/80">
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PROFILS */}
      <section className="bg-pierre px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="font-display text-2xl font-bold text-graphite md:text-3xl">Choisis ton profil de départ</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {(profils?.items ?? []).map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <div className="carte-vivante h-full rounded-xl border border-sable bg-ivoire p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-olive">{p.famille}</p>
                  <p className="mt-1 font-display font-bold text-graphite">{p.nom}</p>
                  <p className="mt-1 text-sm text-graphite/60">{p.description}</p>
                </div>
              </Reveal>
            ))}
            {!profils?.items?.length && (
              <p className="text-sm text-graphite/60">
                Les métiers apparaîtront ici dès que l&apos;API et la base de données seront démarrées et seedées.
              </p>
            )}
          </div>
          <Reveal className="mt-8 text-center">
            <Link href="/metiers" className="font-semibold text-terracotta hover:underline">
              Voir tous les métiers →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ARGUMENTS */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="carte-vivante h-full rounded-2xl border border-pierre bg-white p-8">
              <span className="text-3xl">🎮</span>
              <h2 className="mt-3 font-display text-2xl font-bold text-graphite">Apprendre en s&apos;amusant</h2>
              <p className="mt-3 text-graphite/70">
                Quiz, tests chronométrés, lecture de plans, calculs, décisions à conséquences, gestion humaine,
                simulations logicielles… 14 types de missions pour ne jamais s&apos;ennuyer, avec correction
                pédagogique à chaque étape.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="carte-vivante h-full rounded-2xl border border-pierre bg-white p-8">
              <span className="text-3xl">📱</span>
              <h2 className="mt-3 font-display text-2xl font-bold text-graphite">Emporte ta carrière partout</h2>
              <p className="mt-3 text-graphite/70">
                BTP Life est une application installable (PWA) : joue sur tes cours et missions, reçois des
                notifications, et retrouve ta progression sur mobile comme sur ordinateur.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="fond-anime px-4 py-20 text-center text-ivoire">
        <Reveal>
          <h2 className="font-display text-3xl font-bold md:text-4xl">Prêt à construire ta carrière ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ivoire/80">
            Ta première mission t&apos;attend moins de 3 minutes après ton inscription — et c&apos;est gratuit.
          </p>
          <Link
            href="/inscription"
            className="anim-pulse-cta mt-8 inline-block rounded-full bg-terracotta px-8 py-4 font-semibold text-ivoire transition-transform hover:scale-105 hover:bg-argile"
          >
            Créer mon compte gratuitement
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
