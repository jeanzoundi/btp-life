'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CURSUS, type CursusServeur, type EtapeCursus, type Formation } from '@/lib/cursus';
import { objectifsCarriere, prochainObjectif } from '@/lib/objectifs-carriere';
import { SIGNATURES_PARCOURS } from '@/lib/parcours';
import type { NiveauLogement } from '@/lib/patrimoine';
import { PROFILS_DEPART, type ProfilDepart } from '@/lib/profils-depart';

interface VuePatrimoine { logement: { niveau: NiveauLogement }; outils: { slug: string; possede: boolean }[] }
interface VueEntreprise { entreprise: unknown | null }

const ICONES_ETAPES: Record<EtapeCursus['statut'], string> = { valide: '✓', 'en-cours': '▸', verrouille: '🔒' };
const ICONES_OBJECTIFS = { qualification: '🎓', outil: '🧰', logement: '🏠', responsabilite: '👷', entreprise: '🏢' } as const;

/** Une ligne d'avancement d'une étape du cursus : cours lus, examen réussi, journées ou étapes de stage. */
function detailEtape(e: EtapeCursus) {
  if (e.stage) return `${e.stage.fait}/${e.stage.requis}`;
  if (e.cours) return `cours ${e.cours.lus}/${e.cours.total}${e.examen?.total ? ` · examen ${e.examen.reussis}/${e.examen.total}` : ''}`;
  return '';
}

/** L'appli Carrière : le parcours et son activité signature, le cursus de l'étudiant (semestres, examens, stages, diplôme)
 * et les objectifs durables — qualification, outil, logement, responsabilités, entreprise. Connecté, tout vient du serveur ;
 * en démonstration, le chemin s'affiche sur les données du navigateur. */
export function EcranCarriere({ demo, niveau, porte, formation, journees, livraisons, logementDemo, seulementCursus = false }: {
  demo: boolean; niveau: number; porte: ProfilDepart | null; formation: Formation | null; journees: number; livraisons: number; logementDemo: NiveauLogement;
  /** Le seul bloc du cursus (chez le doyen, à l'université). */
  seulementCursus?: boolean;
}) {
  const { data: certificats } = useQuery({ queryKey: ['certificats', 'mine'], queryFn: () => api.get<{ certificat: { slug: string } }[]>('/users/me/certificats'), enabled: !demo });
  const { data: patrimoine } = useQuery({ queryKey: ['monde', 'patrimoine'], queryFn: () => api.get<VuePatrimoine>('/monde/patrimoine'), enabled: !demo });
  const { data: entreprise } = useQuery({ queryKey: ['monde', 'entreprise'], queryFn: () => api.get<VueEntreprise>('/monde/entreprise'), enabled: !demo });
  const { data: cursusServeur } = useQuery({ queryKey: ['carriere', 'cursus'], queryFn: () => api.get<CursusServeur>('/carriere/cursus'), enabled: !demo && Boolean(formation) });
  const profil = porte ? PROFILS_DEPART.find(p => p.id === porte) : null, signature = porte ? SIGNATURES_PARCOURS[porte] : null;
  const cursus = cursusServeur?.cursus ?? null;
  const objectifs = objectifsCarriere({
    niveau, porte, journees, livraisons,
    certificats: (certificats ?? []).map(c => c.certificat.slug),
    outils: (patrimoine?.outils ?? []).filter(o => o.possede).map(o => o.slug),
    logement: demo ? logementDemo : patrimoine?.logement.niveau ?? 'studio',
    entreprise: Boolean(entreprise?.entreprise),
    diplome: Boolean(cursus?.diplome.obtenu),
  });
  const prochain = prochainObjectif(objectifs);
  return <div className="space-y-3 p-4 text-[12.5px]">
    {!seulementCursus && <section className="rounded-2xl bg-white/[.07] p-3">
      <p className="hud-legende text-jeu-or">Ton parcours</p>
      <strong className="mt-0.5 block text-[15px]">{profil ? `${profil.icone} ${profil.nom}` : 'Parcours libre'}</strong>
      {signature ? <p className="mt-1 leading-snug text-jeu-ivoire/75">{signature.activite} : <b className="text-jeu-lagune">{signature.bonus}</b>.</p>
        : <p className="mt-1 leading-snug text-jeu-ivoire/70">Choisis un poste de départ pour donner à ton parcours son activité signature.</p>}
    </section>}
    {formation && <section className="rounded-2xl bg-white/[.07] p-3" aria-label="Ton cursus">
      <p className="hud-legende text-jeu-or">Ton cursus</p>
      <strong className="mt-0.5 block text-[14px]">{cursus?.titre ?? CURSUS[formation].titre}</strong>
      {cursus ? <ol className="mt-2 space-y-1">{cursus.etapes.map(e => <li key={e.id} className={`flex items-baseline gap-2 ${e.statut === 'verrouille' ? 'text-jeu-ivoire/45' : ''}`}>
        <span aria-hidden className={e.statut === 'valide' ? 'text-jeu-lagune' : e.statut === 'en-cours' ? 'text-jeu-or' : ''}>{ICONES_ETAPES[e.statut]}</span>
        <span className="min-w-0 flex-1 leading-snug">{e.nom}{detailEtape(e) && <span className="block text-[11px] text-jeu-ivoire/55">{detailEtape(e)}</span>}</span>
      </li>)}</ol>
        : <ol className="mt-2 space-y-1 text-jeu-ivoire/70">{[...CURSUS[formation].semestres.map(s => s.nom), ...CURSUS[formation].stages.map(s => s.nom), CURSUS[formation].diplome.nom].map(n => <li key={n}>· {n}</li>)}</ol>}
      <p className="mt-2 text-[11px] leading-snug text-jeu-ivoire/55">{demo ? 'Les examens se passent dans le jeu complet : les missions pratiques des cours, notées par le serveur.' : 'Chaque semestre se valide par ses cours (Académie, université) et son examen : les missions pratiques de ses cours. Les stages se font au Grand chantier et au bureau d’études.'}</p>
    </section>}
    {!seulementCursus && <section className="rounded-2xl bg-white/[.07] p-3" aria-label="Objectifs de carrière">
      <p className="hud-legende text-jeu-or">Tes objectifs durables</p>
      {prochain && <p className="mt-1 rounded-xl bg-jeu-or/[.12] p-2 leading-snug ring-1 ring-jeu-or/40"><b>Prochain : {prochain.titre}</b><span className="block text-[11px] text-jeu-ivoire/70">{prochain.detail}</span></p>}
      <ul className="mt-2 space-y-1.5">{objectifs.map(o => <li key={o.id} className="flex items-start gap-2">
        <span aria-hidden>{ICONES_OBJECTIFS[o.categorie]}</span>
        <span className={`min-w-0 flex-1 leading-snug ${o.atteint ? 'text-jeu-ivoire/55 line-through' : ''}`}>{o.titre}{o.progression && !o.atteint && <span className="ml-1 text-[11px] text-jeu-ivoire/55">({o.progression.fait}/{o.progression.requis})</span>}</span>
        {o.atteint && <span className="text-jeu-lagune" aria-label="atteint">✓</span>}
      </li>)}</ul>
    </section>}
  </div>;
}
