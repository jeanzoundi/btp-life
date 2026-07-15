import Link from 'next/link';
import { fetchCatalog } from '@/lib/api-server';
import { Reveal } from '@/components/public/reveal';
import { Compteur } from '@/components/public/compteur';
import { ChantierAnime } from '@/components/public/chantier-anime';
import { MondeTeaser } from '@/components/public/monde-teaser';

interface Profil {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  famille: string;
}

const ETAPES = [
  { num: '01', titre: 'Choisis ton métier', texte: 'Étudiant, stagiaire, dessinateur, chef de chantier… pars du profil qui te ressemble.', icone: '🎯' },
  { num: '02', titre: 'Apprends en jouant', texte: 'Académie BTP, logiciels simulés, missions courtes — 5 à 20 minutes par session.', icone: '🎮' },
  { num: '03', titre: 'Sois évalué', texte: "Score détaillé, corrections pédagogiques, jamais de cul-de-sac en cas d'échec.", icone: '📊' },
  { num: '04', titre: 'Construis ta carrière', texte: "XP, réputation, promotions, offres d'emploi — un CV virtuel qui se remplit tout seul.", icone: '🏗️' },
];

const METIERS_MARQUEE = [
  '👷 Chef de chantier', '📐 Dessinateur BIM', '🧮 Métreur', '🏗️ Conducteur de travaux', '🔬 Géotechnicien',
  '📏 Topographe', '🦺 Responsable HSE', '💼 Entrepreneur', '🧱 Chef d\'équipe', '📊 Économiste',
  '🖥️ Projeteur', '⚙️ Ingénieur structure',
];

const PREUVES = [
  { icone: '🇨🇮', texte: 'Adapté aux normes locales' },
  { icone: '🎓', texte: 'Académie + logiciels métier' },
  { icone: '📱', texte: 'Installable (PWA)' },
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
      <section className="texture-beton relative overflow-hidden bg-gradient-to-b from-ivoire to-pierre px-4 pb-16 pt-14 md:pb-24 md:pt-20">
        <div className="halo-hero" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="anim-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-terracotta/20 bg-terracotta/10 px-4 py-1.5 text-sm font-semibold text-terracotta">
              <span className="relative flex h-2 w-2">
                <span className="pulse-point absolute inline-flex h-full w-full rounded-full bg-terracotta" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta" />
              </span>
              Le simulateur de carrière BTP
            </p>
            <h1 className="anim-fade-up delai-1 font-display text-4xl font-bold leading-[1.05] tracking-tight text-graphite md:text-6xl">
              Choisis ton métier.<br />
              Apprends. Travaille.<br />
              <span className="texte-degrade">Évolue.</span>
            </h1>
            <p className="anim-fade-up delai-2 mt-6 max-w-xl text-lg leading-relaxed text-graphite/70">
              Construis ta carrière dans le BTP à travers des missions jouables, des chantiers virtuels et une
              académie complète — dans une ville vivante où tu croises de vrais autres joueurs.
            </p>
            <div className="anim-fade-up delai-3 mt-8 flex flex-wrap gap-3">
              <Link
                href="/inscription"
                className="anim-pulse-cta rounded-full bg-terracotta px-7 py-3.5 font-semibold text-ivoire shadow-lg shadow-terracotta/20 transition-transform hover:scale-105 hover:bg-argile"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/simulator"
                className="rounded-full border border-graphite/20 bg-white/60 px-7 py-3.5 font-semibold text-graphite backdrop-blur transition-colors hover:border-terracotta hover:text-terracotta"
              >
                Voir une démo
              </Link>
            </div>
            {/* Bandeau de preuves : rassure d'un coup d'œil sans surcharger */}
            <div className="anim-fade-up delai-4 mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {PREUVES.map((p) => (
                <span key={p.texte} className="flex items-center gap-1.5 text-sm font-medium text-graphite/60">
                  <span className="text-base">{p.icone}</span> {p.texte}
                </span>
              ))}
            </div>
            <p className="anim-fade-up delai-5 mt-5 text-xs text-graphite/50">
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
              [30, '', 'profils métiers'],
              [60, '', 'missions jouables'],
              [16, '', 'modules d\'académie'],
              [100, ' %', 'gratuit au lancement'],
            ] as const
          ).map(([cible, suffixe, label]) => (
            <Reveal key={label}>
              <p className="font-display text-4xl font-bold text-terracotta md:text-5xl">
                <Compteur cible={cible} suffixe={suffixe} />
              </p>
              <p className="mt-1 text-sm text-graphite/60">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-terracotta">Le parcours</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-graphite md:text-4xl">Quatre étapes, une carrière</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {ETAPES.map((e, i) => (
            <Reveal key={e.num} delay={i * 120}>
              <div className="carte-vivante group relative h-full overflow-hidden rounded-2xl border border-pierre bg-white p-6">
                <span className="absolute -right-3 -top-4 font-display text-7xl font-bold text-pierre/60 transition-colors group-hover:text-terracotta/15">
                  {e.num}
                </span>
                <div className="relative">
                  <span className="text-3xl">{e.icone}</span>
                  <p className="mt-4 font-display text-lg font-bold text-graphite">{e.titre}</p>
                  <p className="mt-2 text-sm leading-relaxed text-graphite/70">{e.texte}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MONDE VIRTUEL — le vrai différenciateur : pas des menus, une ville vivante et partagée */}
      <section className="relative border-y border-pierre bg-white px-4 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <Reveal className="order-2 flex justify-center md:order-1">
            <MondeTeaser />
          </Reveal>
          <Reveal className="order-1 md:order-2" delay={100}>
            <p className="mb-3 inline-block rounded-full bg-olive/10 px-4 py-1.5 text-sm font-semibold text-olive">
              Un vrai monde, pas juste des menus
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-graphite md:text-4xl">
              Ta carrière se joue dans une ville isométrique, façon jeu de simulation de vie
            </h2>
            <p className="mt-4 leading-relaxed text-graphite/70">
              Un centre-ville où chaque bâtiment ouvre une partie du jeu, un quartier résidentiel avec ta propre
              maison — et tu n&apos;y es jamais seul. Les avatars que tu croises sont de vrais autres joueurs, actifs
              récemment, que tu peux saluer et découvrir. On l&apos;explore en le glissant, du bout du doigt comme à la souris.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-graphite/75">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-base">🌗</span> Cycle jour/nuit dynamique, l&apos;ambiance change au fil des heures.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-base">😴</span> Des besoins façon Sims — énergie, faim, moral, social — à combler entre deux missions.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-base">🏗️</span> Des chantiers de plus en plus grands à mesure que tu montes en niveau.
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* MARQUEE MÉTIERS */}
      <section className="border-b border-pierre bg-graphite py-5">
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
      <section className="bg-pierre px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-terracotta">Ton point de départ</p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-graphite md:text-4xl">Choisis ton profil de départ</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {(profils?.items ?? []).map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <div className="carte-vivante h-full rounded-xl border border-sable bg-ivoire p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-olive">{p.famille}</p>
                  <p className="mt-1.5 font-display text-lg font-bold text-graphite">{p.nom}</p>
                  <p className="mt-1 text-sm leading-relaxed text-graphite/60">{p.description}</p>
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
            <Link href="/metiers" className="inline-flex items-center gap-1 font-semibold text-terracotta transition-transform hover:translate-x-0.5">
              Voir tous les métiers →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ARGUMENTS */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="carte-vivante h-full rounded-2xl border border-pierre bg-white p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-2xl">🎮</span>
              <h2 className="mt-4 font-display text-xl font-bold text-graphite md:text-2xl">Apprendre en s&apos;amusant</h2>
              <p className="mt-3 leading-relaxed text-graphite/70">
                Quiz, tests chronométrés, lecture de plans, calculs, décisions à conséquences, gestion humaine,
                simulations logicielles… une grande variété de missions pour ne jamais s&apos;ennuyer, avec correction
                pédagogique à chaque étape.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="carte-vivante h-full rounded-2xl border border-pierre bg-white p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-olive/10 text-2xl">📱</span>
              <h2 className="mt-4 font-display text-xl font-bold text-graphite md:text-2xl">Emporte ta carrière partout</h2>
              <p className="mt-3 leading-relaxed text-graphite/70">
                BTP Life est une application installable (PWA) : joue tes cours et tes missions, reçois des
                notifications, et retrouve ta progression sur mobile comme sur ordinateur.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="fond-anime relative overflow-hidden px-4 py-20 text-center text-ivoire md:py-24">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">Prêt à construire ta carrière ?</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ivoire/80">
            Ta première mission t&apos;attend moins de 3 minutes après ton inscription — et c&apos;est gratuit.
          </p>
          <Link
            href="/inscription"
            className="anim-pulse-cta mt-8 inline-block rounded-full bg-terracotta px-8 py-4 font-semibold text-ivoire shadow-xl shadow-black/20 transition-transform hover:scale-105 hover:bg-argile"
          >
            Créer mon compte gratuitement
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
