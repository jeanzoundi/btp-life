'use client';

// La fin d'un dossier du fil rouge : une fois l'immeuble livré et le dossier clos, et son plan de caméra passé, un écran
// salue le parcours, oriente vers la suite du jeu (carrière, chantiers, équipes) et annonce la suite. Il ne s'affiche
// qu'une fois par dossier.
import { DOSSIERS, type DossierCampagne } from '@/lib/campagne';

/** Ce que dit l'écran de fin de chaque dossier : le titre, le parcours accompli et la suite annoncée. */
const FINS: Record<string, { titre: string; parcours: string; teaser: string }> = {
  'residence-akwaba': {
    titre: 'La Résidence Akwaba est bouclée !',
    parcours: 'du marché clé en main à la réception définitive, tu as suivi l’immeuble de bout en bout, garantie et décompte compris. Ses huit familles y vivent, et Mme Touré te recommande à tout le Plateau.',
    teaser: 'Un nouveau dossier t’attend : le R+5 de Daouda Touré, le frère de Mme Touré… et Serge n’a pas dit son dernier mot.',
  },
  'residence-roniers': {
    titre: 'La Résidence Les Rôniers est livrée !',
    parcours: 'du sol mou des Jardins à la révision des prix, tu as mené un R+5 de bout en bout : pieux, voisins, vente sur plans, grue et façades compris. Dix familles y vivent, et deux commerces y ouvrent.',
    teaser: 'Prochain défi : le groupe scolaire de la mairie, en groupement avec Bâti-Express.',
  },
  'groupe-scolaire': {
    titre: 'Le Groupe scolaire des Palmiers est ouvert !',
    parcours: 'de l’appel d’offres public à la réception en commission, tu as mené une école en groupement, sans céder ni à la corruption ni sur la sécurité des enfants. Six classes accueillent les élèves du quartier.',
    teaser: 'La mairie lance un centre de santé… et cette fois, BTP Life répond seule.',
  },
  'centre-sante': {
    titre: 'Le Centre de santé de la Lagune est ouvert !',
    parcours: 'de la nappe sous les fouilles à la réception, tu as bâti un lieu de soins : circuits propres, eau et électricité secourues, surfaces qui se lavent. Le Dr Fofana reçoit ses premiers patients.',
    teaser: 'Tantie Bintou et les commerçantes rêvent d’un marché couvert…',
  },
  'marche-couvert': {
    titre: 'Le Marché couvert du Plateau est ouvert !',
    parcours: 'des massifs à la couverture, tu as monté une halle métallique : portiques levés sans incident, eaux de pluie maîtrisées, étals attribués sans passe-droit. Soixante commerçantes vendent à l’abri.',
    teaser: 'L’université veut une résidence pour ses étudiants, avant la rentrée…',
  },
  'residence-universitaire': {
    titre: 'La Résidence universitaire des Bâtisseurs est ouverte !',
    parcours: 'de l’usine de préfabrication à la rentrée, tu as tenu un délai serré : béton contrôlé, chambres accessibles, eau chaude solaire. Quarante-huit étudiants y vivent.',
    teaser: 'La Régie des eaux prépare un château d’eau de trente mètres…',
  },
  'chateau-eau': {
    titre: 'Le Château d’eau des Jardins est en service !',
    parcours: 'du radier à la mise en service, tu as élevé un réservoir de 500 m³ à 25 mètres : coffrage grimpant, cuve étanche, eau potable analysée. Six mille habitants en dépendent.',
    teaser: 'Sept ouvrages bouclés : Joseph te confie les grands projets de l’entreprise… et Serge te propose de monter une entreprise avec lui. À suivre.',
  },
};
export const finDuDossier = (d: DossierCampagne) => FINS[d.id] ?? { titre: `${d.nom} : dossier bouclé !`, parcours: 'tu as mené ce dossier de bout en bout.', teaser: '' };

const DERNIER = DOSSIERS[DOSSIERS.length - 1];
/** Une fois tout le fil rouge joué : ce que devient le dernier immeuble, et la suite annoncée (téléphone). */
export const CLOTURE_CAMPAGNE = DERNIER.cloture;
export const TEASER_CAMPAGNE = finDuDossier(DERNIER).teaser;

/** L'écran de fin se montre quand le dossier est clos, la progression chargée, le joueur libre, et seulement une fois. */
export function finCampagneAMontrer({ chapitres, total, pret, dejaVue, occupe }: { chapitres: number; total: number; pret: boolean; dejaVue: boolean; occupe: boolean }) {
  return pret && !dejaVue && !occupe && chapitres >= total;
}
/** La clé qui retient que l'écran de fin d'un dossier a été vu (celle d'Akwaba date d'avant les dossiers suivants). */
export const cleFinDossier = (d: DossierCampagne, joueur: string) => d.debut === 0 ? `btp-life-fin-campagne:${joueur}` : `btp-life-fin-campagne:${joueur}:${d.id}`;

const SUITES = [
  { id: 'carriere', icone: '📈', titre: 'Ta carrière', texte: 'Vise la prochaine promotion, puis les métiers experts au-delà du niveau 20.', bouton: 'Voir mon parcours' },
  { id: 'chantiers', icone: '🏗️', titre: 'Tes chantiers', texte: 'Pilote un chantier complet : budget, équipe, matériaux et imprévus.', bouton: 'Choisir un chantier' },
  { id: 'equipe', icone: '🤝', titre: 'Faire équipe', texte: 'Invite un voisin connecté : à deux dans le même lieu, chaque séance rapporte +10 % d’XP.', bouton: 'Ouvrir le chat' },
] as const;
export type SuiteCampagne = (typeof SUITES)[number]['id'];

export function PanneauFinCampagne({ dossier, nomJoueur, onSuite, onFermer }: { dossier: DossierCampagne; nomJoueur: string; onSuite: (suite: SuiteCampagne) => void; onFermer: () => void }) {
  const fin = finDuDossier(dossier);
  return <section role="dialog" aria-label="Fin du dossier du fil rouge" className="hud-verre pointer-events-auto absolute left-1/2 top-1/2 z-40 w-[440px] max-w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5 text-jeu-ivoire">
    <p className="hud-legende text-jeu-or">Dossier clos · {dossier.chapitres.length} chapitres</p>
    <h2 className="hud-titre mt-1 text-[20px]">{fin.titre}</h2>
    <p className="mt-2 text-[13px] leading-relaxed text-jeu-ivoire/80">Bravo {nomJoueur} : {fin.parcours}</p>
    <h3 className="mt-4 text-[12.5px] font-bold uppercase tracking-wide text-jeu-ivoire/60">Et maintenant ?</h3>
    <ul className="mt-2 space-y-2">
      {SUITES.map(s => <li key={s.id} className="flex items-center gap-3 rounded-xl bg-white/[.06] p-2.5">
        <span aria-hidden className="text-[22px]">{s.icone}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold">{s.titre}</p>
          <p className="text-[11.5px] leading-snug text-jeu-ivoire/70">{s.texte}</p>
        </div>
        <button type="button" onClick={() => onSuite(s.id)} className="shrink-0 rounded-lg bg-jeu-or/20 px-2.5 py-1.5 text-[11.5px] font-bold text-jeu-or hover:bg-jeu-or/30">{s.bouton}</button>
      </li>)}
    </ul>
    {fin.teaser && <p className="mt-4 rounded-lg bg-jeu-or/[.1] px-3 py-2 text-[12px] italic text-jeu-or/90">{fin.teaser}</p>}
    <button type="button" onClick={onFermer} className="hud-bouton hud-bouton-principal mt-4 w-full p-2.5 text-[13px]">Continuer à jouer</button>
  </section>;
}
