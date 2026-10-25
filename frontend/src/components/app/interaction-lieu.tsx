'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { lieuParSlug, type ActionLieu } from '@/lib/lieux';
import { DUREE_SIESTE } from '@/lib/objets-interieurs';
import { AZUR } from '@/lib/lieux-vie/azur';
import { GALERIE } from '@/lib/lieux-vie/galerie';
import { MARCHE } from '@/lib/lieux-vie/marche';
import { MARINA } from '@/lib/lieux-vie/marina';
import { SPORT } from '@/lib/lieux-vie/sport';
import type { BesoinsJoueur } from './quartier-3d';

type ActionBesoin = Extract<ActionLieu, { type: 'besoin' }>;
/** Les lieux qui ont leur intérieur : leur accroche présente le lieu avant d'entrer. */
const ACCROCHES: Record<string, string> = {
  ...Object.fromEntries([MARCHE, MARINA, SPORT, AZUR, GALERIE].map(l => [l.slug, l.accroche])),
  'jardins-residence': 'Une fuite, une prise qui chauffe, une fissure : Gustave, le gardien, t’envoie dépanner les voisins. Chaque réparation paie et forme une compétence.',
  'construction-nord': 'Un immeuble en R+3 et son échafaudage : avec Ibrahim, le coordinateur sécurité, tu traques les risques un à un jusqu’au rapport d’inspection.',
};
export function InteractionLieu({ slug, nom, href, demo, onDemo, onFait, onClose, onEnter, sieste = false }: {
  slug: string; nom: string; href: string; demo: boolean;
  onDemo: (action: ActionBesoin) => void;
  /** Action validée par le serveur (dormir le soir fait passer la nuit, par exemple). */
  onFait?: (action: ActionBesoin) => void;
  onClose: () => void; onEnter?: () => void;
  /** Dans le monde, en journée : dormir est une sieste de deux heures (l'article « sieste-maison »), pas une nuit. */
  sieste?: boolean;
}) {
  const client = useQueryClient();
  const alias: Record<string, string> = {};
  const lieu = lieuParSlug(alias[slug] ?? slug);
  const enSieste = (action: ActionBesoin) => sieste && action.besoin === 'repos';
  const agir = useMutation({
    mutationFn: (action: ActionBesoin) => enSieste(action)
      ? api.post<{ message: string; carriere: BesoinsJoueur; coutPaye: number }>(`/carriere/besoins/${action.besoin}`, { article: 'sieste-maison' })
      : api.post<{ message: string; carriere: BesoinsJoueur; coutPaye: number }>(`/carriere/besoins/${action.besoin}`),
    onSuccess: (res, action) => {
      client.setQueryData(['carriere', 'me'], (ancienne: Record<string, unknown> | undefined) => ({ ...ancienne, ...res.carriere }));
      client.invalidateQueries({ queryKey: ['carriere', 'me'] });
      onFait?.(action);
    },
  });
  const roles: Record<string, string> = { universite: 'Formation et compétences', entreprise: 'Votre entreprise et vos équipes', chantier: 'Missions et gestion de chantier', fournisseur: 'Matériaux et approvisionnement', 'bureau-etudes': 'Ingénierie et compétences', atelier: 'Formation aux logiciels du métier', logistique: 'Stocks et approvisionnement', agence: 'Offres et opportunités de carrière', 'centre-azur': 'Boutiques, équipement et restauration', 'galerie-palmiers': 'Commerces et services du quartier', marina: 'Promenade, café et activités nautiques', sports: 'Sport, détente et récompenses', marche: 'Fruits, grillades et marchandage', 'jardins-residence': 'Dépannages chez les voisins', 'construction-nord': 'Inspection sécurité du chantier' };
  return <section aria-label={`Interactions : ${nom}`} className="hud-verre absolute inset-x-3 bottom-3 z-20 mx-auto max-h-[60%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[360px]">
    <div className="flex items-start justify-between gap-3"><div><p className="hud-legende text-jeu-or">Lieu sélectionné</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{nom}</h2></div><button aria-label="Fermer les interactions" onClick={onClose} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button></div>
    <div className="hud-separateur mt-3" />
    <p className="mt-3 text-sm font-bold">{lieu?.role ?? roles[slug]}</p>
    <p className="mt-1.5 text-xs leading-relaxed text-jeu-ivoire/70">{lieu?.intro ?? ACCROCHES[slug] ?? 'Ouvrez cet établissement pour retrouver les activités de votre carrière.'}</p>
    {onEnter && <button type="button" onClick={onEnter} className="hud-bouton hud-bouton-principal mt-3 w-full justify-start p-3 text-left text-sm">🚪 Entrer dans le bâtiment</button>}
    <div className="mt-3 space-y-2">{lieu?.actions.filter((a): a is ActionBesoin => a.type === 'besoin').map(action => <button key={action.besoin} disabled={agir.isPending} onClick={() => demo ? onDemo(action) : agir.mutate(action)} className="hud-bouton hud-bouton-verre w-full flex-col items-start p-3 text-left text-sm">
      {action.icone} {agir.isPending ? 'Action en cours…' : enSieste(action) ? `Faire une sieste (${DUREE_SIESTE} h)` : action.label}<span className="mt-1 block text-[11.5px] font-semibold text-jeu-or">{demo ? 'Essai gratuit · non sauvegardé' : enSieste(action) ? 'Gratuit · un peu d’énergie' : action.cout ? `${action.cout.toLocaleString('fr-FR')} FCFA virtuels` : 'Gratuit'}</span>
    </button>)}</div>
    {agir.isSuccess && <p role="status" className="mt-3 text-sm font-bold text-jeu-lagune">{agir.data.message}{agir.data.coutPaye > 0 && ` (−${agir.data.coutPaye} F)`}</p>}
    {agir.isError && <p role="alert" className="mt-3 text-sm font-bold text-jeu-terre">{agir.error.message || 'Action impossible. Réessayez.'}</p>}
    <Link href={demo ? '/connexion' : href} className="hud-bouton hud-bouton-or mt-4 flex w-full p-3 text-center text-sm">{demo ? 'Se connecter pour jouer et sauvegarder' : 'Ouvrir les activités de carrière →'}</Link>
    <p className="mt-3 text-[10.5px] text-jeu-ivoire/55">{demo ? 'Démonstration : aucun compte modifié.' : 'Les actions validées sont enregistrées dans votre carrière.'}</p>
  </section>;
}
