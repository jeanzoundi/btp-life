import Link from 'next/link';
import { fetchCatalog } from '@/lib/api-server';
import { Reveal } from '@/components/public/reveal';
import { Compteur } from '@/components/public/compteur';
import { ChantierAnime } from '@/components/public/chantier-anime';
import { MondeTeaser } from '@/components/public/monde-teaser';
import { AvatarBtp } from '@/components/app/avatar-btp';
import { IDEES_SUR_MESURE } from '@/lib/personnages-joueur';

interface Profil {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  famille: string;
}

const ETAPES = [
  { num: '01', titre: 'Crée ton personnage', texte: 'Un modèle réaliste ou ton personnage sur mesure, puis ton profil de départ : étudiant, ouvrier, dessinateur, ingénieur…', icone: '🧍' },
  { num: '02', titre: 'Apprends en jouant', texte: 'Académie BTP, logiciels simulés, séances avec les mentors du quartier — 5 à 20 minutes par session.', icone: '🎮' },
  { num: '03', titre: 'Travaille sur le terrain', texte: 'Missions, chantiers avec budget et imprévus, et le fil rouge de la Résidence Akwaba de bout en bout.', icone: '🏗️' },
  { num: '04', titre: 'Fais carrière', texte: "XP, promotions, offres d'emploi, attestations : un CV virtuel qui se remplit au fil de ta vie de bâtisseur.", icone: '📈' },
];

// Les dernières nouveautés du monde vivant, telles qu'elles se jouent aujourd'hui.
const NOUVEAUTES = [
  { icone: '🧑🏾‍🔧', titre: 'Ton personnage sur mesure', texte: 'Coiffure, barbe, teint, lunettes, tenue et couleurs : compose ton bâtisseur, le même dans les deux modes.' },
  { icone: '🤝', titre: 'Les équipes de quartier', texte: 'Invite jusqu’à trois voisins : à deux dans le même lieu, chaque séance rapporte 10 % d’XP en plus.' },
  { icone: '🧭', titre: 'Un premier quart d’heure guidé', texte: 'Cinq premiers pas récompensés et une prime d’installation de 25 000 F pour démarrer sereinement.' },
  { icone: '🏢', titre: 'Le fil rouge Akwaba', texte: 'Neuf chapitres pour suivre un immeuble du marché clé en main jusqu’à la réception avec la cliente.' },
  { icone: '🌦️', titre: 'La météo des saisons', texte: 'Harmattan, grande et petite saisons des pluies : un ciel qui change au hasard des saisons ivoiriennes.' },
  { icone: '📱', titre: 'Jouable sur téléphone', texte: 'Un écran pensé pour le pouce : objectif lisible, commandes à portée, un menu pour le reste.' },
];

const METIERS_MARQUEE = [
  '👷 Chef de chantier', '📐 Dessinateur BIM', '🧮 Métreur', '🏗️ Conducteur de travaux', '🔬 Géotechnicien',
  '📏 Topographe', '🦺 Responsable HSE', '💼 Entrepreneur', '🧱 Chef d\'équipe', '📊 Économiste',
  '🖥️ Projeteur', '⚙️ Ingénieur structure',
];

/** Le drapeau ivoirien dessiné : les émojis drapeaux ne s'affichent pas sous Windows. */
function DrapeauCI() {
  return <svg viewBox="0 0 3 2" width="18" height="12" aria-hidden className="inline-block rounded-[2px] ring-1 ring-black/10"><rect width="1" height="2" fill="#F77F00" /><rect x="1" width="1" height="2" fill="#FFFFFF" /><rect x="2" width="1" height="2" fill="#009E60" /></svg>;
}

/** Le nombre d'éléments publiés d'une ressource du catalogue, ou la valeur connue si l'API ne répond pas. */
async function total(ressource: string, repli: number) {
  const r = await fetchCatalog<{ total?: number }>(`/catalog/${ressource}?pageSize=1`, 3600);
  return typeof r?.total === 'number' && r.total > 0 ? r.total : repli;
}

export default async function AccueilPage() {
  const [profils, nbProfils, nbModules, nbChantiers, nbOffres] = await Promise.all([
    fetchCatalog<{ items: Profil[] }>('/catalog/profils?pageSize=8'),
    total('profils', 46), total('modules-academie', 23), total('chantiers', 16), total('offres-emploi', 28),
  ]);

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
              Crée ton personnage, installe-toi aux Palmiers et construis ta carrière dans le BTP : missions,
              chantiers, académie et une ville vivante où tu fais équipe avec d&apos;autres joueurs.
            </p>
            <div className="anim-fade-up delai-3 mt-8 flex flex-wrap gap-3">
              <Link
                href="/inscription"
                className="anim-pulse-cta rounded-full bg-terracotta px-7 py-3.5 font-semibold text-ivoire shadow-lg shadow-terracotta/20 transition-transform hover:scale-105 hover:bg-argile"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/simulation-preview"
                className="rounded-full border border-graphite/20 bg-white/60 px-7 py-3.5 font-semibold text-graphite backdrop-blur transition-colors hover:border-terracotta hover:text-terracotta"
              >
                Essayer la ville sans compte
              </Link>
            </div>
            {/* Bandeau de preuves : rassure d'un coup d'œil sans surcharger */}
            <div className="anim-fade-up delai-4 mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-graphite/60">
              <span className="flex items-center gap-1.5"><DrapeauCI /> Normes et quotidien ivoiriens</span>
              <span className="flex items-center gap-1.5"><span className="text-base">🎓</span> Académie + logiciels métier</span>
              <span className="flex items-center gap-1.5"><span className="text-base">📱</span> Sur téléphone comme sur ordinateur</span>
            </div>
            <p className="anim-fade-up delai-5 mt-5 text-xs text-graphite/50">
              ⚡ Premiers pas guidés et prime d&apos;installation de 25 000 F à ton arrivée — aucun paiement demandé.
            </p>
          </div>
          <div className="anim-fade-up delai-2 flex justify-center">
            <ChantierAnime />
          </div>
        </div>
      </section>

      {/* CHIFFRES : lus dans le catalogue publié */}
      <section className="border-y border-pierre bg-white px-4 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 text-center md:grid-cols-4">
          {(
            [
              [nbProfils, 'métiers à jouer'],
              [nbModules, 'modules d\'académie'],
              [nbChantiers, 'chantiers virtuels'],
              [nbOffres, 'offres d\'emploi'],
            ] as const
          ).map(([cible, label]) => (
            <Reveal key={label}>
              <p className="font-display text-4xl font-bold text-terracotta md:text-5xl">
                <Compteur cible={cible} />
              </p>
              <p className="mt-1 text-sm text-graphite/60">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* NOUVEAUTÉS */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-terracotta">Nouveau dans BTP Life</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-graphite md:text-4xl">Le monde vivant a grandi</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NOUVEAUTES.map((n, i) => (
            <Reveal key={n.titre} delay={i * 80}>
              <div className="carte-vivante h-full rounded-2xl border border-pierre bg-white p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta/10 text-2xl" aria-hidden>{n.icone}</span>
                <p className="mt-4 font-display text-lg font-bold text-graphite">{n.titre}</p>
                <p className="mt-2 text-sm leading-relaxed text-graphite/70">{n.texte}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MONDE VIRTUEL — le vrai différenciateur : pas des menus, une ville vivante et partagée */}
      <section id="monde-3d" className="relative border-y border-pierre bg-white px-4 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <Reveal className="order-2 flex justify-center md:order-1">
            <MondeTeaser />
          </Reveal>
          <Reveal className="order-1 md:order-2" delay={100}>
            <p className="mb-3 inline-block rounded-full bg-olive/10 px-4 py-1.5 text-sm font-semibold text-olive">
              Un vrai monde, pas juste des menus
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-graphite md:text-4xl">
              Vis aux Palmiers et construis ta vie dans le BTP
            </h2>
            <p className="mt-4 leading-relaxed text-graphite/70">
              Un quartier inspiré d&apos;Abidjan : résidence, université, banque, maquis, chantier et dépôt de
              matériaux. Tu y croises les joueurs connectés, tu discutes dans le chat du quartier et tu formes ton
              équipe. Quand peu de monde est en ligne, des joueurs passés récemment se promènent sur la place.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-graphite/75">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-base">🌗</span> Jour, nuit et météo des saisons : l&apos;ambiance et la ville changent au fil des heures.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-base">😴</span> Des besoins façon Sims — énergie, faim, moral, social — à combler entre deux missions.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-base">🚕</span> Taxi et gbaka, loyer, épargne et travaux chez toi : une vraie vie de quartier.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 text-base">🎉</span> Niveau, promotion, certificat, équipe formée : chaque grand moment se fête et se partage.
              </li>
            </ul>
            <Link href="/simulation-preview" className="mt-6 inline-flex items-center gap-1 font-semibold text-terracotta transition-transform hover:translate-x-0.5">
              Faire un tour dans le quartier →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* PERSONNAGE SUR MESURE */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-terracotta">Ton personnage</p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-graphite md:text-4xl">À ton image, dans les deux modes</h2>
            <p className="mt-4 leading-relaxed text-graphite/70">
              Choisis l&apos;un des sept personnages réalistes, ou compose le tien sur mesure : silhouette, teint,
              coiffure, couleur des cheveux, moustache, barbe ou bouc, lunettes, tenue et couleurs. Il marche
              dans le monde vivant, et ton avatar du mode classique prend le même visage.
            </p>
            <Link href="/creation-preview" className="mt-6 inline-flex items-center gap-1 font-semibold text-terracotta transition-transform hover:translate-x-0.5">
              Essayer le créateur de personnage →
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <ul className="grid grid-cols-3 gap-3" aria-label="Exemples de personnages sur mesure">
              {IDEES_SUR_MESURE.map(({ nom, apparence }) => (
                <li key={nom} className="carte-vivante flex flex-col items-center rounded-2xl border border-pierre bg-white p-3 text-center">
                  <AvatarBtp
                    config={{ personnage: 'sur-mesure', apparence, casqueStyle: apparence.casque ? 'standard' : 'aucun', couleurTenue: apparence.haut, fond: '#E8DCC8' }}
                    taille={72}
                    className="!rounded-full"
                  />
                  <span className="mt-2 text-xs font-semibold leading-tight text-graphite/75">{nom}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* LE PARCOURS */}
      <section className="border-t border-pierre bg-white px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-terracotta">Le parcours</p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-graphite md:text-4xl">Quatre étapes, une carrière</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {ETAPES.map((e, i) => (
              <Reveal key={e.num} delay={i * 120}>
                <div className="carte-vivante group relative h-full overflow-hidden rounded-2xl border border-pierre bg-ivoire p-6">
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
              <p className="text-sm text-graphite/60">Les métiers se chargent… reviens dans un instant, ou découvre-les sur la page dédiée.</p>
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
                BTP Life s&apos;installe comme une application (PWA) : joue tes cours, tes missions et ta vie de
                quartier sur téléphone comme sur ordinateur, et retrouve ta progression partout.
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
            Crée ton personnage, fais tes premiers pas aux Palmiers et touche ta prime d&apos;installation — c&apos;est gratuit.
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
