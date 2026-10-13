'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BanniereHub } from '@/components/app/banniere-hub';
import { Skeleton } from '@/components/app/ui';

type TypeEvenement = 'PROMOTION' | 'EMBAUCHE' | 'STAGE' | 'DIPLOME' | 'CREATION_ENTREPRISE' | 'CHANTIER_LIVRE';

interface EvenementCarriere {
  id: string;
  type: TypeEvenement;
  dateVirtuelle: string;
  details: Record<string, unknown> | null;
  profil: { nom: string; famille: string } | null;
}

const PRESENTATION: Record<TypeEvenement, { icone: string; titre: string; couleur: string }> = {
  PROMOTION: { icone: '📈', titre: 'Promotion obtenue', couleur: 'bg-olive' },
  EMBAUCHE: { icone: '💼', titre: 'Nouvelle embauche', couleur: 'bg-cuivre' },
  STAGE: { icone: '🦺', titre: 'Stage commencé', couleur: 'bg-sable' },
  DIPLOME: { icone: '🎓', titre: 'Diplôme obtenu', couleur: 'bg-terracotta' },
  CREATION_ENTREPRISE: { icone: '🏢', titre: 'Entreprise créée', couleur: 'bg-graphite' },
  CHANTIER_LIVRE: { icone: '🏗️', titre: 'Chantier livré', couleur: 'bg-olive' },
};

function texteDetails(evenement: EvenementCarriere) {
  const details = evenement.details ?? {};
  const nom = details.nomEntreprise ?? details.chantierNom ?? details.offreTitre;
  if (typeof nom === 'string' && nom.trim()) return nom;
  if (evenement.profil?.nom) return evenement.profil.nom;
  return 'Une nouvelle étape a été ajoutée à ta carrière.';
}

export default function ChronologiePage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['carriere', 'chronologie'],
    queryFn: () => api.get<EvenementCarriere[]>('/carriere/chronologie'),
  });

  const groupes = data.reduce<Record<string, EvenementCarriere[]>>((acc, evenement) => {
    const annee = new Date(evenement.dateVirtuelle).getFullYear().toString();
    (acc[annee] ??= []).push(evenement);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BanniereHub titre="Chronologie de carrière" soustitre="Tes promotions, emplois, entreprises et chantiers livrés, dans leur ordre réel." emoji="🕰️" />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-pierre bg-white p-4"><p className="text-xs font-bold uppercase tracking-widest text-graphite/40">Étapes enregistrées</p><p className="mt-2 font-display text-3xl font-bold text-graphite">{data.length}</p></div>
        <div className="rounded-2xl border border-pierre bg-white p-4"><p className="text-xs font-bold uppercase tracking-widest text-graphite/40">Dernière activité</p><p className="mt-2 font-display text-lg font-bold text-graphite">{data[0] ? new Date(data[0].dateVirtuelle).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p></div>
        <div className="rounded-2xl border border-pierre bg-white p-4"><p className="text-xs font-bold uppercase tracking-widest text-graphite/40">Chantiers livrés</p><p className="mt-2 font-display text-3xl font-bold text-olive">{data.filter((e) => e.type === 'CHANTIER_LIVRE').length}</p></div>
      </section>

      {isLoading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>}
      {isError && <p role="alert" className="rounded-2xl border border-terracotta/20 bg-terracotta/10 p-5 text-sm font-medium text-terracotta">La chronologie n&apos;a pas pu être synchronisée. Réessaie dans quelques instants.</p>}
      {!isLoading && !isError && data.length === 0 && <div className="rounded-3xl border border-dashed border-pierre bg-white p-10 text-center"><p className="text-4xl">🧭</p><h2 className="mt-3 font-display text-xl font-bold text-graphite">Ton histoire commence ici</h2><p className="mx-auto mt-2 max-w-md text-sm text-graphite/55">Termine une mission, décroche un poste ou livre un chantier : chaque grande étape apparaîtra automatiquement.</p></div>}

      {Object.entries(groupes).map(([annee, evenements]) => (
        <section key={annee} aria-labelledby={`annee-${annee}`}>
          <div className="mb-4 flex items-center gap-4"><h2 id={`annee-${annee}`} className="font-display text-2xl font-bold text-graphite">{annee}</h2><span className="h-px flex-1 bg-pierre" /></div>
          <ol className="relative ml-5 border-l-2 border-pierre pl-7">
            {evenements.map((evenement) => {
              const presentation = PRESENTATION[evenement.type];
              return (
                <li key={evenement.id} className="relative mb-5 last:mb-0">
                  <span className={`absolute -left-[2.55rem] top-5 flex h-8 w-8 items-center justify-center rounded-full text-sm text-white ring-4 ring-ivoire ${presentation.couleur}`} aria-hidden="true">{presentation.icone}</span>
                  <article className="carte-vivante rounded-2xl border border-pierre bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-widest text-terracotta">{presentation.titre}</p><h3 className="mt-1 font-display text-lg font-bold text-graphite">{texteDetails(evenement)}</h3></div><time className="rounded-full bg-pierre/60 px-3 py-1 text-xs font-semibold text-graphite/55" dateTime={evenement.dateVirtuelle}>{new Date(evenement.dateVirtuelle).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</time></div>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
