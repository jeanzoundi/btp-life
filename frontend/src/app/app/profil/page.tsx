'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  AvatarBtp,
  AVATAR_DEFAUT,
  avatarAleatoire,
  configDepuis,
  OPTIONS_AVATAR,
  PRESETS_AVATAR,
  type AvatarConfig,
} from '@/components/app/avatar-btp';
import { jouerSon } from '@/lib/sons';
import { AnneauProgression, JaugeImmeuble, RadarCompetences, Skeleton } from '@/components/app/ui';
import { TRAITS, traitParSlug } from '@/lib/traits';

interface CarriereMe {
  niveau: number;
  xp: number;
  reputation: number;
  argentVirtuel: number;
  ancienneteVirtuelleJours: number;
  profilActuel?: { nom: string } | null;
  metierCible?: { nom: string } | null;
  avatar?: { nomPersonnage: string; config: unknown } | null;
  referentielPays?: { nom: string } | null;
  traits?: string[] | null;
}
interface UserCompetence {
  niveauActuel: number;
  competence: { nom: string; domaine: string };
}
interface UserBadge {
  id: string;
  badge: { nom: string; rarete: string };
}
interface Me {
  nom: string;
  pseudo: string | null;
  email: string;
  ville: string | null;
  niveauEtude: string | null;
  domaineBtp: string | null;
  plan: string;
}

const LIBELLES_DOMAINE: Record<string, string> = {
  general: 'Général',
  hse: 'Sécurité',
  technique: 'Technique',
  gestion: 'Gestion',
  logiciel: 'Logiciels',
  management: 'Management',
};

const ONGLETS = [
  { id: 'avatar', label: '🎨 Avatar' },
  { id: 'infos', label: '📇 Informations' },
  { id: 'stats', label: '📊 Statistiques' },
] as const;

export default function ProfilPage() {
  const queryClient = useQueryClient();
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]['id']>('avatar');
  const [sousOnglet, setSousOnglet] = useState<'visage' | 'tenue' | 'extras'>('visage');

  const { data: carriere, isLoading } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<CarriereMe>('/carriere/me'),
  });
  const { data: competences } = useQuery({
    queryKey: ['competences', 'mine'],
    queryFn: () => api.get<UserCompetence[]>('/users/me/competences'),
  });
  const { data: badges } = useQuery({
    queryKey: ['badges', 'mine'],
    queryFn: () => api.get<UserBadge[]>('/users/me/badges'),
  });

  /* ── Éditeur d'avatar ── */
  const [config, setConfig] = useState<AvatarConfig>(AVATAR_DEFAUT);
  const [nomPersonnage, setNomPersonnage] = useState('');
  const [sauvegardeAvatar, setSauvegardeAvatar] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    if (carriere?.avatar) {
      setConfig(configDepuis(carriere.avatar.config));
      setNomPersonnage(carriere.avatar.nomPersonnage ?? '');
    }
  }, [carriere?.avatar]);

  async function enregistrerAvatar() {
    setEnregistrement(true);
    setSauvegardeAvatar(null);
    try {
      await api.patch('/carriere/avatar', {
        nomPersonnage: nomPersonnage || 'Aventurier BTP',
        tenue: config.typeTenue,
        equipement: 'casque',
        config,
      });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      jouerSon('succes');
      setSauvegardeAvatar('Avatar enregistré ✔');
    } catch {
      setSauvegardeAvatar("Erreur d'enregistrement");
    } finally {
      setEnregistrement(false);
    }
  }

  /* ── Formulaire infos ── */
  const [form, setForm] = useState({ nom: '', pseudo: '', ville: '', niveauEtude: '', domaineBtp: '' });
  const [email, setEmail] = useState('');
  const [sauvegardeInfos, setSauvegardeInfos] = useState<string | null>(null);
  const [traitsEdition, setTraitsEdition] = useState<string[]>([]);
  const [sauvegardeTraits, setSauvegardeTraits] = useState<string | null>(null);

  useEffect(() => {
    if (carriere?.traits) setTraitsEdition(carriere.traits);
  }, [carriere?.traits]);

  function toggleTraitEdition(slug: string) {
    setTraitsEdition((t) => (t.includes(slug) ? t.filter((s) => s !== slug) : t.length < 3 ? [...t, slug] : t));
  }

  async function enregistrerTraits() {
    setSauvegardeTraits(null);
    await api.patch('/carriere/traits', { traits: traitsEdition });
    queryClient.invalidateQueries({ queryKey: ['carriere'] });
    jouerSon('succes');
    setSauvegardeTraits('Traits mis à jour ✔');
  }

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
    });
  }, []);

  async function enregistrerInfos(e: React.FormEvent) {
    e.preventDefault();
    setSauvegardeInfos(null);
    await api.patch('/users/me', form);
    queryClient.invalidateQueries({ queryKey: ['carriere'] });
    setSauvegardeInfos('Informations mises à jour ✔');
  }

  /* ── Radar par domaine ── */
  const parDomaine = new Map<string, { total: number; n: number }>();
  for (const uc of competences ?? []) {
    const d = parDomaine.get(uc.competence.domaine) ?? { total: 0, n: 0 };
    d.total += uc.niveauActuel;
    d.n += 1;
    parDomaine.set(uc.competence.domaine, d);
  }
  const axesRadar = Object.entries(LIBELLES_DOMAINE).map(([domaine, label]) => {
    const d = parDomaine.get(domaine);
    return { label, valeur: d ? d.total / d.n : 0 };
  });

  const pctNiveau = (() => {
    const niveau = carriere?.niveau ?? 1;
    const xp = carriere?.xp ?? 0;
    const haut = (niveau * (niveau + 1) * 100) / 2;
    const bas = ((niveau - 1) * niveau * 100) / 2;
    return haut > bas ? Math.min(100, Math.round(((xp - bas) / (haut - bas)) * 100)) : 0;
  })();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Bandeau héro du profil ── */}
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <section className="fond-anime flex flex-wrap items-center gap-6 rounded-3xl p-6 text-ivoire md:p-8">
          <div className="anim-float">
            <AvatarBtp config={carriere?.avatar?.config} taille={112} className="shadow-xl ring-4 ring-ivoire/20" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold md:text-3xl">
              {carriere?.avatar?.nomPersonnage ?? 'Aventurier BTP'}
            </h1>
            <p className="mt-1 text-sm text-ivoire/80">
              {carriere?.profilActuel?.nom ?? 'Profil à choisir'} → {carriere?.metierCible?.nom ?? 'objectif à définir'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-2 rounded-full bg-ivoire/15 px-3 py-1.5 font-semibold">
                <JaugeImmeuble progressionPct={pctNiveau} /> Niveau {carriere?.niveau ?? 1} · {pctNiveau}%
              </span>
              <span className="rounded-full bg-ivoire/15 px-3 py-1.5 font-semibold">🏅 {carriere?.reputation ?? 50}/100</span>
              <span className="rounded-full bg-ivoire/15 px-3 py-1.5 font-mono font-semibold">
                💰 {(carriere?.argentVirtuel ?? 0).toLocaleString('fr-FR')} F
              </span>
              {carriere?.referentielPays && (
                <span className="rounded-full bg-ivoire/15 px-3 py-1.5 font-semibold">🌍 {carriere.referentielPays.nom}</span>
              )}
            </div>
            {!!(carriere?.traits ?? []).length && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(carriere?.traits ?? []).map((slug) => {
                  const t = traitParSlug(slug);
                  return t ? (
                    <span key={slug} title={t.description} className="rounded-full bg-cuivre/20 px-2.5 py-1 text-xs font-semibold text-sable">
                      {t.icone} {t.nom}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {(badges ?? []).slice(0, 3).map((b) => (
              <span key={b.id} title={b.badge.nom} className="anim-float text-2xl" style={{ animationDelay: `${Math.random()}s` }}>
                🏅
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Onglets ── */}
      <div className="flex gap-2">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              onglet === o.id ? 'bg-graphite text-ivoire shadow' : 'bg-white text-graphite/60 hover:bg-pierre'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── AVATAR ── */}
      {onglet === 'avatar' && (
        <div className="anim-fade-up space-y-4">
          {/* Presets + aléatoire */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-graphite/40">Styles rapides :</span>
            {PRESETS_AVATAR.map((p) => (
              <button
                key={p.nom}
                onClick={() => {
                  setConfig({ ...p.config });
                  jouerSon('clic');
                }}
                className="flex items-center gap-2 rounded-full border border-pierre bg-white px-3 py-1.5 text-xs font-semibold text-graphite transition-all hover:-translate-y-0.5 hover:border-terracotta"
              >
                <AvatarBtp config={p.config} taille={22} className="!rounded-full" />
                {p.nom}
              </button>
            ))}
            <button
              onClick={() => {
                setConfig(avatarAleatoire());
                jouerSon('clic');
              }}
              className="rounded-full bg-graphite px-4 py-1.5 text-xs font-bold text-ivoire transition-transform hover:scale-105"
            >
              🎲 Aléatoire
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Aperçu */}
            <div className="flex flex-col items-center justify-center rounded-3xl border border-pierre bg-white p-8 lg:col-span-2">
              <div className="anim-float">
                <AvatarBtp config={config} taille={210} className="shadow-2xl" />
              </div>
              <input
                value={nomPersonnage}
                onChange={(e) => setNomPersonnage(e.target.value)}
                placeholder="Nom du personnage"
                className="mt-6 w-full rounded-full border-2 border-pierre px-5 py-2.5 text-center font-display font-bold text-graphite transition-colors focus:border-terracotta focus:outline-none"
              />
              <button
                onClick={enregistrerAvatar}
                disabled={enregistrement}
                className="anim-pulse-cta mt-4 w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile disabled:opacity-60"
              >
                {enregistrement ? 'Enregistrement…' : '💾 Enregistrer mon avatar'}
              </button>
              {sauvegardeAvatar && <p className="mt-2 text-sm font-semibold text-olive">{sauvegardeAvatar}</p>}
            </div>

            {/* Options par catégorie */}
            <div className="rounded-3xl border border-pierre bg-white p-6 lg:col-span-3">
              <div className="mb-4 flex gap-2">
                {(
                  [
                    ['visage', '🙂 Visage'],
                    ['tenue', '🦺 Tenue'],
                    ['extras', '✨ Extras'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setSousOnglet(id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                      sousOnglet === id ? 'bg-terracotta text-ivoire shadow' : 'bg-pierre/60 text-graphite/60 hover:bg-pierre'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {sousOnglet === 'visage' && (
                <div className="anim-fade-up space-y-5">
                  <ChoixCouleur titre="🖐 Teint de peau" options={OPTIONS_AVATAR.peau} valeur={config.peau} onChange={(v) => setConfig((c) => ({ ...c, peau: v }))} />
                  <ChoixCouleur titre="👁 Couleur des yeux" options={OPTIONS_AVATAR.yeux} valeur={config.yeux} onChange={(v) => setConfig((c) => ({ ...c, yeux: v }))} />
                  <ChoixPuces
                    titre="😀 Expression"
                    options={[
                      ['sourire', 'Sourire'],
                      ['grand-sourire', 'Grand sourire'],
                      ['neutre', 'Concentré'],
                      ['determine', 'Déterminé'],
                    ]}
                    valeur={config.expression}
                    onChange={(v) => setConfig((c) => ({ ...c, expression: v as AvatarConfig['expression'] }))}
                  />
                  <ChoixPuces
                    titre="🧔 Pilosité"
                    options={[
                      ['aucune', 'Aucune'],
                      ['moustache', 'Moustache'],
                      ['barbe', 'Barbe'],
                      ['bouc', 'Bouc'],
                    ]}
                    valeur={config.pilosite}
                    onChange={(v) => setConfig((c) => ({ ...c, pilosite: v as AvatarConfig['pilosite'] }))}
                  />
                  <ChoixPuces
                    titre="🕶 Lunettes"
                    options={[
                      ['aucune', 'Aucune'],
                      ['securite', 'Sécurité'],
                      ['soleil', 'Soleil'],
                    ]}
                    valeur={config.lunettes}
                    onChange={(v) => setConfig((c) => ({ ...c, lunettes: v as AvatarConfig['lunettes'] }))}
                  />
                </div>
              )}

              {sousOnglet === 'tenue' && (
                <div className="anim-fade-up space-y-5">
                  <ChoixPuces
                    titre="⛑ Casque"
                    options={[
                      ['standard', 'Standard'],
                      ['visiere', 'Avec visière'],
                      ['aucun', 'Sans casque (bureau)'],
                    ]}
                    valeur={config.casqueStyle}
                    onChange={(v) => setConfig((c) => ({ ...c, casqueStyle: v as AvatarConfig['casqueStyle'] }))}
                  />
                  {config.casqueStyle !== 'aucun' ? (
                    <ChoixCouleur titre="🎨 Couleur du casque" options={OPTIONS_AVATAR.casque} valeur={config.casque} onChange={(v) => setConfig((c) => ({ ...c, casque: v }))} />
                  ) : (
                    <>
                      <ChoixPuces
                        titre="💇 Coiffure"
                        options={[
                          ['court', 'Court'],
                          ['afro', 'Afro'],
                          ['tresses', 'Tresses'],
                          ['chauve', 'Chauve'],
                        ]}
                        valeur={config.cheveux}
                        onChange={(v) => setConfig((c) => ({ ...c, cheveux: v as AvatarConfig['cheveux'] }))}
                      />
                      {config.cheveux !== 'chauve' && (
                        <ChoixCouleur titre="🎨 Couleur des cheveux" options={OPTIONS_AVATAR.couleurCheveux} valeur={config.couleurCheveux} onChange={(v) => setConfig((c) => ({ ...c, couleurCheveux: v }))} />
                      )}
                    </>
                  )}
                  <ChoixPuces
                    titre="🦺 Tenue"
                    options={[
                      ['gilet', 'Gilet haute visibilité'],
                      ['bleu', 'Bleu de travail'],
                      ['chemise', 'Chemise bureau'],
                    ]}
                    valeur={config.typeTenue}
                    onChange={(v) => setConfig((c) => ({ ...c, typeTenue: v as AvatarConfig['typeTenue'] }))}
                  />
                  <ChoixCouleur titre="🎽 Couleur de la tenue" options={OPTIONS_AVATAR.couleurTenue} valeur={config.couleurTenue} onChange={(v) => setConfig((c) => ({ ...c, couleurTenue: v }))} />
                </div>
              )}

              {sousOnglet === 'extras' && (
                <div className="anim-fade-up space-y-5">
                  <ChoixPuces
                    titre="🔧 Outil en main"
                    options={[
                      ['aucun', 'Aucun'],
                      ['marteau', 'Marteau'],
                      ['cle', 'Clé à molette'],
                      ['metre', 'Mètre ruban'],
                      ['tablette', 'Tablette BIM'],
                      ['plan', 'Plan roulé'],
                    ]}
                    valeur={config.outil}
                    onChange={(v) => setConfig((c) => ({ ...c, outil: v as AvatarConfig['outil'] }))}
                  />
                  <ChoixPuces
                    titre="🎖 Écusson de poitrine"
                    options={[
                      ['aucun', 'Aucun'],
                      ['etoile', 'Étoile'],
                      ['eclair', 'Éclair'],
                      ['truelle', 'Truelle'],
                      ['grue', 'Grue'],
                    ]}
                    valeur={config.ecusson}
                    onChange={(v) => setConfig((c) => ({ ...c, ecusson: v as AvatarConfig['ecusson'] }))}
                  />
                  <ChoixCouleur titre="🎨 Fond" options={OPTIONS_AVATAR.fond} valeur={config.fond} onChange={(v) => setConfig((c) => ({ ...c, fond: v }))} />
                  <ChoixPuces
                    titre="🏆 Cadre"
                    options={[
                      ['aucun', 'Aucun'],
                      ['bronze', 'Bronze'],
                      ['argent', 'Argent'],
                      ['or', 'Or'],
                    ]}
                    valeur={config.cadre}
                    onChange={(v) => setConfig((c) => ({ ...c, cadre: v as AvatarConfig['cadre'] }))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── INFORMATIONS ── */}
      {onglet === 'infos' && (
        <form onSubmit={enregistrerInfos} className="anim-fade-up max-w-xl space-y-4 rounded-3xl border border-pierre bg-white p-6">
          <p className="text-sm text-graphite/50">
            Compte : <span className="font-mono">{email}</span>
          </p>
          {(
            [
              ['nom', 'Nom complet'],
              ['pseudo', 'Pseudo (affiché sur le CV)'],
              ['ville', 'Ville'],
              ['niveauEtude', "Niveau d'étude"],
              ['domaineBtp', 'Domaine BTP'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-semibold text-graphite">{label}</label>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-xl border-2 border-pierre px-4 py-2.5 transition-colors focus:border-terracotta focus:outline-none"
              />
            </div>
          ))}
          {sauvegardeInfos && <p className="text-sm font-semibold text-olive">{sauvegardeInfos}</p>}
          <button type="submit" className="w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile">
            💾 Enregistrer
          </button>
          <p className="text-center text-xs text-graphite/40">
            Gestion du compte (déconnexion…) dans{' '}
            <Link href="/app/parametres" className="font-semibold text-terracotta hover:underline">
              Paramètres
            </Link>
          </p>
        </form>
      )}

      {onglet === 'infos' && (
        <div className="anim-fade-up max-w-xl space-y-3 rounded-3xl border border-pierre bg-white p-6">
          <h2 className="font-display font-bold text-graphite">🎭 Mes traits de personnalité</h2>
          <p className="text-xs text-graphite/50">Choisis 1 à 3 traits — ils s&apos;affichent sur ton profil et ton CV.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {TRAITS.map((t) => {
              const choisi = traitsEdition.includes(t.slug);
              return (
                <button
                  key={t.slug}
                  onClick={() => toggleTraitEdition(t.slug)}
                  className={`rounded-xl border p-2.5 text-left text-sm transition-all ${choisi ? 'border-terracotta bg-terracotta/10' : 'border-pierre hover:border-sable'}`}
                >
                  <p className="font-medium text-graphite">{t.icone} {t.nom}</p>
                </button>
              );
            })}
          </div>
          {sauvegardeTraits && <p className="text-sm font-semibold text-olive">{sauvegardeTraits}</p>}
          <button
            onClick={enregistrerTraits}
            disabled={!traitsEdition.length}
            className="w-full rounded-full bg-graphite py-2.5 text-sm font-semibold text-ivoire transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            💾 Enregistrer mes traits
          </button>
        </div>
      )}

      {/* ── STATISTIQUES ── */}
      {onglet === 'stats' && (
        <div className="anim-fade-up grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-pierre bg-white p-6">
            <h2 className="font-display font-bold text-graphite">🕸 Radar de compétences</h2>
            <p className="text-xs text-graphite/50">Moyenne de tes niveaux (0–5) par domaine.</p>
            <div className="mt-4">
              <RadarCompetences axes={axesRadar} />
            </div>
            <Link href="/app/competences" className="mt-3 block text-center text-sm font-semibold text-terracotta hover:underline">
              Voir le détail des compétences →
            </Link>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ['⚡ XP total', carriere?.xp ?? 0],
                  ['🏅 Réputation', `${carriere?.reputation ?? 50}/100`],
                  ['💰 Argent virtuel', `${(carriere?.argentVirtuel ?? 0).toLocaleString('fr-FR')} F`],
                  ['📅 Ancienneté', `${carriere?.ancienneteVirtuelleJours ?? 0} j`],
                ] as const
              ).map(([label, valeur]) => (
                <div key={label} className="carte-vivante rounded-2xl border border-pierre bg-white p-4 text-center">
                  <p className="text-xs text-graphite/50">{label}</p>
                  <p className="mt-1 font-display text-xl font-bold text-graphite">{valeur}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-pierre bg-white p-6 text-center">
              <h2 className="font-display font-bold text-graphite">🏅 Badges obtenus</h2>
              <div className="mt-3 flex justify-center">
                <AnneauProgression valeur={(badges ?? []).length} max={10} taille={100} couleur="#B87333">
                  <p className="font-display text-2xl font-bold text-graphite">{(badges ?? []).length}</p>
                </AnneauProgression>
              </div>
              <Link href="/app/recompenses" className="mt-3 inline-block text-sm font-semibold text-terracotta hover:underline">
                Voir ma collection →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChoixPuces({
  titre,
  options,
  valeur,
  onChange,
}: {
  titre: string;
  options: Array<readonly [string, string]>;
  valeur: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-graphite">{titre}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, label]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
              valeur === id ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-pierre text-graphite/60 hover:border-sable'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoixCouleur({
  titre,
  options,
  valeur,
  onChange,
}: {
  titre: string;
  options: string[];
  valeur: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-graphite">{titre}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((couleur) => (
          <button
            key={couleur}
            onClick={() => onChange(couleur)}
            aria-label={couleur}
            className={`h-9 w-9 rounded-full border-4 transition-transform hover:scale-110 ${
              valeur === couleur ? 'border-graphite shadow-md' : 'border-white shadow'
            }`}
            style={{ backgroundColor: couleur }}
          />
        ))}
      </div>
    </div>
  );
}
