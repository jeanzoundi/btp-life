'use client';

// Quartier isométrique interactif façon jeu de simulation : chaque bâtiment est
// dessiné en vraie 3D isométrique (3 faces), cliquable, avec le joueur debout
// dans la rue sous son plumbob. 100 % SVG, palette du brief.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AvatarBtp } from './avatar-btp';
import { besoinCritique, humeurDepuisBesoins } from './besoins';
import { AutresJoueurs, CarteJoueur, NB_EMPLACEMENTS_CENTRE_VILLE, type JoueurActif } from './autres-joueurs';
import { MaisonsJoueursSvg } from './maisons-joueurs';
import { jouerSon } from '@/lib/sons';
import { hashStable } from '@/lib/hash';
import { monPlotIndex, plotPosition, MAISON_W, MAISON_D, MAISON_H } from '@/lib/residence-plots';
import { pt, facesIso, assombrir } from '@/lib/iso-geometrie';

interface BatimentDef {
  slug: string;
  nom: string;
  href: string;
  ox: number;
  oy: number; // coin arrière du TOIT (le sol est à oy + h)
  w: number;
  d: number;
  h: number;
  couleur: string; // face claire (gauche)
  props?: 'drapeau' | 'colonnes' | 'enseigne-livre' | 'fenetres' | 'entrepot' | 'maison' | 'flasque' | 'controle' | 'caisses';
  /** Identifiant d'une école du campus — sert à repérer celle assignée au joueur (hash stable). */
  ecole?: string;
  /** Zone verrouillable à laquelle appartient ce bâtiment (voir ZONES). Absent = toujours ouvert. */
  zone?: string;
}

const BATIMENTS: BatimentDef[] = [
  // ─── Centre-ville ───
  { slug: 'ECOLE', nom: 'École BTP', href: '/app/academie', ox: 190, oy: 96, w: 72, d: 54, h: 58, couleur: '#D9B382', props: 'drapeau' },
  { slug: 'CENTRE_FORMATION', nom: 'Formation', href: '/app/logiciels', ox: 392, oy: 66, w: 62, d: 48, h: 50, couleur: '#C9A984', props: 'enseigne-livre' },
  { slug: 'BUREAU_ETUDES', nom: "Bureau d'études", href: '/app/competences', ox: 584, oy: 96, w: 66, d: 48, h: 76, couleur: '#B8C4C9', props: 'fenetres' },
  { slug: 'CAFE', nom: '☕ Café', href: '/app/lieu/cafe', ox: 455, oy: 150, w: 46, d: 36, h: 40, couleur: '#B87333', props: 'enseigne-livre' },
  { slug: 'MAQUIS', nom: '🍲 Maquis', href: '/app/lieu/maquis', ox: 690, oy: 120, w: 50, d: 38, h: 38, couleur: '#C1502E', props: 'maison' },
  { slug: 'MAIRIE', nom: 'Mairie', href: '/app/lieu/mairie', ox: 108, oy: 236, w: 88, d: 58, h: 56, couleur: '#E8DCC8', props: 'colonnes' },
  { slug: 'LABORATOIRE', nom: 'Laboratoire', href: '/app/lieu/laboratoire', ox: 306, oy: 210, w: 58, d: 44, h: 48, couleur: '#DCE5DC', props: 'flasque' },
  { slug: 'ENTREPRISE', nom: 'Entreprise', href: '/app/profil', ox: 742, oy: 196, w: 64, d: 50, h: 92, couleur: '#C9C4BA', props: 'fenetres' },
  { slug: 'BANQUE', nom: 'Banque', href: '/app/lieu/banque', ox: 96, oy: 402, w: 76, d: 52, h: 54, couleur: '#E5D9B8', props: 'colonnes' },
  { slug: 'FOURNISSEUR', nom: 'Fournisseur', href: '/app/fournisseur', ox: 292, oy: 438, w: 84, d: 58, h: 42, couleur: '#D9B382', props: 'entrepot' },
  { slug: 'BUREAU_CONTROLE', nom: 'Contrôle', href: '/app/recompenses', ox: 470, oy: 470, w: 58, d: 44, h: 46, couleur: '#CFCAC0', props: 'controle' },
  { slug: 'DEPOT', nom: 'Dépôt', href: '/app/depot', ox: 636, oy: 438, w: 74, d: 52, h: 38, couleur: '#C9A984', props: 'caisses' },
  { slug: 'CLIENT', nom: 'Client', href: '/app/offres', ox: 796, oy: 406, w: 56, d: 44, h: 42, couleur: '#E8DCC8', props: 'maison' },

  // ─── Campus universitaire (toujours ouvert) — plusieurs écoles, une seule est la tienne ───
  { slug: 'ECOLE_1', ecole: 'e1', nom: 'Institut Abidjan-Nord', href: '/app/academie', ox: 1030, oy: 70, w: 66, d: 50, h: 56, couleur: '#D9B382', props: 'drapeau' },
  { slug: 'ECOLE_2', ecole: 'e2', nom: 'ETP Yopougon', href: '/app/academie', ox: 1220, oy: 60, w: 64, d: 48, h: 54, couleur: '#C9A984', props: 'enseigne-livre' },
  { slug: 'ECOLE_3', ecole: 'e3', nom: 'CFA Cocody', href: '/app/academie', ox: 1150, oy: 200, w: 62, d: 46, h: 50, couleur: '#B8C4C9', props: 'fenetres' },
  { slug: 'ECOLE_4', ecole: 'e4', nom: 'Lycée Pro Bâtiment', href: '/app/academie', ox: 1350, oy: 190, w: 60, d: 46, h: 48, couleur: '#DCE5DC', props: 'colonnes' },

  // ─── Zone industrielle (verrouillée jusqu'au niveau requis) ───
  { slug: 'USINE_1', zone: 'industrielle', nom: 'Cimenterie', href: '/app/chantiers', ox: 1040, oy: 520, w: 92, d: 60, h: 70, couleur: '#9A968E', props: 'entrepot' },
  { slug: 'USINE_2', zone: 'industrielle', nom: 'Préfabrication', href: '/app/depot', ox: 1260, oy: 560, w: 78, d: 54, h: 52, couleur: '#B8967A', props: 'caisses' },
  { slug: 'USINE_3', zone: 'industrielle', nom: 'Grand chantier', href: '/app/chantiers', ox: 1180, oy: 700, w: 70, d: 50, h: 46, couleur: '#C9A984', props: 'controle' },
];

interface ZoneDef {
  id: string;
  nom: string;
  icone: string;
  niveauRequis: number;
  region: { x: number; y: number; w: number; h: number };
}

const ZONES: ZoneDef[] = [
  { id: 'industrielle', nom: 'Zone industrielle', icone: '🏭', niveauRequis: 5, region: { x: 960, y: 470, w: 480, h: 340 } },
];

function Batiment({
  def,
  onOuvre,
  verrouille,
  highlight,
}: {
  def: BatimentDef;
  onOuvre: (def: BatimentDef) => void;
  verrouille?: boolean;
  highlight?: boolean;
}) {
  const { ox, oy, w, d, h, couleur } = def;
  const f = facesIso(ox, oy, w, d, h);
  const solY = f.F.y + h;

  return (
    <g
      className="batiment-iso"
      onClick={() => onOuvre(def)}
      role="link"
      aria-label={def.nom}
      opacity={verrouille ? 0.5 : 1}
    >
      {/* Ombre au sol */}
      <ellipse cx={f.F.x} cy={solY + 4} rx={(w + d) * 0.62} ry={(w + d) * 0.17} fill="rgba(43,43,46,0.14)" />

      {/* Corps du bâtiment */}
      <polygon points={f.gauche} fill={couleur} />
      <polygon points={f.droite} fill={assombrir(couleur, 0.78)} />
      <polygon points={f.top} fill={assombrir(couleur, 1.12 > 1 ? 0.95 : 0.95)} stroke={assombrir(couleur, 0.7)} strokeWidth="0.8" />
      <polygon points={f.top} fill="#F5F0E6" opacity="0.35" />

      {/* Porte (face gauche, près du coin avant) */}
      <polygon
        points={`${pt(f.F.x - d * 0.32, f.F.y + d * 0.16 + h - 22)} ${pt(f.F.x - d * 0.08, f.F.y + d * 0.04 + h - 22)} ${pt(f.F.x - d * 0.08, f.F.y + d * 0.04 + h)} ${pt(f.F.x - d * 0.32, f.F.y + d * 0.16 + h)}`}
        fill="#4A342A"
      />

      {/* Accessoires distinctifs */}
      {def.props === 'drapeau' && (
        <g>
          <line x1={ox + 6} y1={oy + 3} x2={ox + 6} y2={oy - 24} stroke="#4A342A" strokeWidth="2" />
          <polygon points={`${pt(ox + 6, oy - 24)} ${pt(ox + 24, oy - 20)} ${pt(ox + 6, oy - 15)}`} fill="#C1502E" />
        </g>
      )}
      {def.props === 'colonnes' && (
        <g fill="#F5F0E6">
          {[0.2, 0.45, 0.7].map((t) => (
            <rect key={t} x={f.L.x + (f.F.x - f.L.x) * t - 2.5} y={f.L.y + (f.F.y - f.L.y) * t + 8} width="5" height={h - 12} rx="2" />
          ))}
        </g>
      )}
      {def.props === 'enseigne-livre' && (
        <g>
          <rect x={f.F.x - 20} y={f.F.y + h * 0.32} width="26" height="16" rx="3" fill="#6B7A3F" />
          <text x={f.F.x - 7} y={f.F.y + h * 0.32 + 12} textAnchor="middle" fontSize="11" fill="#F5F0E6">📚</text>
        </g>
      )}
      {def.props === 'fenetres' && (
        <g fill="#2B2B2E" opacity="0.55">
          {[0, 1, 2].map((ligne) =>
            [0.22, 0.52].map((t) => (
              <polygon
                key={`${ligne}-${t}`}
                points={`${pt(f.L.x + (f.F.x - f.L.x) * t, f.L.y + (f.F.y - f.L.y) * t + 10 + ligne * 22)} ${pt(f.L.x + (f.F.x - f.L.x) * (t + 0.18), f.L.y + (f.F.y - f.L.y) * (t + 0.18) + 10 + ligne * 22)} ${pt(f.L.x + (f.F.x - f.L.x) * (t + 0.18), f.L.y + (f.F.y - f.L.y) * (t + 0.18) + 22 + ligne * 22)} ${pt(f.L.x + (f.F.x - f.L.x) * t, f.L.y + (f.F.y - f.L.y) * t + 22 + ligne * 22)}`}
              />
            )),
          ).flat()}
        </g>
      )}
      {def.props === 'entrepot' && (
        <polygon
          points={`${pt(f.L.x + (f.F.x - f.L.x) * 0.25, f.L.y + (f.F.y - f.L.y) * 0.25 + h - 30)} ${pt(f.L.x + (f.F.x - f.L.x) * 0.75, f.L.y + (f.F.y - f.L.y) * 0.75 + h - 30)} ${pt(f.L.x + (f.F.x - f.L.x) * 0.75, f.L.y + (f.F.y - f.L.y) * 0.75 + h)} ${pt(f.L.x + (f.F.x - f.L.x) * 0.25, f.L.y + (f.F.y - f.L.y) * 0.25 + h)}`}
          fill="#8A8680"
        />
      )}
      {def.props === 'maison' && (
        <g>
          {/* Toit terre cuite en pente */}
          <polygon points={`${pt(ox - d, oy + d * 0.5)} ${pt(ox, oy - 14)} ${pt(ox + w, oy + w * 0.5 - 14)} ${pt(f.F.x, f.F.y)}`} fill="#C1502E" />
          <polygon points={`${pt(ox, oy - 14)} ${pt(ox + w, oy + w * 0.5 - 14)} ${pt(ox + w, oy + w * 0.5)} ${pt(ox, oy)}`} fill="#A8431F" />
        </g>
      )}
      {def.props === 'flasque' && (
        <g>
          <rect x={f.F.x - 22} y={f.F.y + h * 0.3} width="18" height="18" rx="3" fill="#F5F0E6" stroke="#6B7A3F" strokeWidth="1.5" />
          <text x={f.F.x - 13} y={f.F.y + h * 0.3 + 14} textAnchor="middle" fontSize="12">🧪</text>
        </g>
      )}
      {def.props === 'controle' && (
        <g>
          <circle cx={f.F.x - 12} cy={f.F.y + h * 0.35} r="9" fill="#6B7A3F" />
          <text x={f.F.x - 12} y={f.F.y + h * 0.35 + 4} textAnchor="middle" fontSize="11" fill="#F5F0E6">✓</text>
        </g>
      )}
      {def.props === 'caisses' && (
        <g>
          <rect x={f.F.x + 8} y={solY - 16} width="16" height="16" fill="#B87333" stroke="#8A5A26" />
          <rect x={f.F.x + 20} y={solY - 12} width="12" height="12" fill="#D9B382" stroke="#B08D5E" />
        </g>
      )}

      {/* Étiquette (largeur adaptée à la longueur du nom) */}
      <g>
        <rect x={f.F.x - Math.max(70, def.nom.length * 6.3) / 2} y={solY + 10} width={Math.max(70, def.nom.length * 6.3)} height="18" rx="9" fill="#2B2B2E" opacity="0.82" />
        <text x={f.F.x} y={solY + 22.5} textAnchor="middle" fontSize="11" fontWeight="600" fill="#F5F0E6">
          {def.nom}
        </text>
      </g>

      {/* Halo doré : c'est TON école, assignée de façon stable */}
      {highlight && (
        <g>
          <ellipse cx={f.F.x} cy={oy - 6} rx={w * 0.55} ry="8" fill="none" stroke="#D9B382" strokeWidth="2" opacity="0.9" />
          <text x={f.F.x} y={oy - 20} textAnchor="middle" fontSize="16">⭐</text>
        </g>
      )}

      {/* Voile de verrouillage : dimming + cadenas, la zone n'est pas encore débloquée */}
      {verrouille && (
        <g>
          <polygon points={f.gauche} fill="#1A1A1C" opacity="0.45" />
          <polygon points={f.droite} fill="#1A1A1C" opacity="0.5" />
          <polygon points={f.top} fill="#1A1A1C" opacity="0.35" />
          <text x={f.F.x} y={oy + h * 0.35} textAnchor="middle" fontSize="18">🔒</text>
        </g>
      )}
    </g>
  );
}

/** Le losange iconique au-dessus du joueur — sa couleur reflète l'humeur (vert / orange / rouge). */
const COULEURS_PLUMBOB: Record<'bien' | 'moyen' | 'mal', { base: string; clair: string; sombre: string }> = {
  bien: { base: '#6B7A3F', clair: '#8CA050', sombre: '#55622F' },
  moyen: { base: '#B87333', clair: '#D9925B', sombre: '#8A5A26' },
  mal: { base: '#C1502E', clair: '#D97553', sombre: '#933A1B' },
};

export function Plumbob({ taille = 22, humeur = 'bien' }: { taille?: number; humeur?: 'bien' | 'moyen' | 'mal' }) {
  const c = COULEURS_PLUMBOB[humeur];
  return (
    <div className="plumbob-bob" style={{ width: taille, height: taille * 1.5 }}>
      <div className="plumbob-spin h-full w-full">
        <svg viewBox="0 0 20 30" width={taille} height={taille * 1.5}>
          <polygon points="10,0 20,15 10,30 0,15" fill={c.base} />
          <polygon points="10,0 20,15 10,15" fill={c.clair} />
          <polygon points="10,30 0,15 10,15" fill={c.sombre} />
        </svg>
      </div>
    </div>
  );
}

type PhaseJour = 'nuit' | 'aube' | 'jour' | 'crepuscule';

function phaseDuJour(heure: number): PhaseJour {
  if (heure >= 21 || heure < 5) return 'nuit';
  if (heure < 8) return 'aube';
  if (heure < 18) return 'jour';
  return 'crepuscule';
}

const AMBIANCE: Record<PhaseJour, { ciel: string; overlay: string; opaciteOverlay: number }> = {
  jour: { ciel: 'from-[#EAF0E2] to-[#DFE6CE]', overlay: '#000000', opaciteOverlay: 0 },
  aube: { ciel: 'from-[#F5D9C0] to-[#DCE6CE]', overlay: '#C1502E', opaciteOverlay: 0.08 },
  crepuscule: { ciel: 'from-[#E8B88F] to-[#C9A5A8]', overlay: '#A85F4C', opaciteOverlay: 0.16 },
  nuit: { ciel: 'from-[#2B2B45] to-[#1E2233]', overlay: '#0A0A1A', opaciteOverlay: 0.4 },
};

type ModeAmbiance = 'auto' | 'jour' | 'nuit';
const CLE_MODE_AMBIANCE = 'btplife_mode_ambiance';

/** Petite bulle qui apparaît pendant la marche vers un lieu qui comble un besoin précis. */
const ICONES_ACTION: Record<string, string> = {
  '/app/lieu/maquis': '🍲',
  '/app/lieu/cafe': '☕',
  '/app/lieu/residence': '😴',
  '/app/lieu/banque': '💰',
};

const SCENE_W = 1500;
const SCENE_H = 1050;
const ZOOM_MIN = 1;
const ZOOM_MAX = 2.2;
const ZOOM_DEFAUT = 1.4;

/** Mini-carte façon jeu de gestion : repère les quartiers d'un coup d'œil, clic = recentrer. */
function MiniCarte({
  pos,
  industrielleVerrouillee,
  onAller,
}: {
  pos: { xPct: number; yPct: number };
  industrielleVerrouillee: boolean;
  onAller: (xPct: number, yPct: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function surClic(e: ReactMouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    onAller(((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <div
      ref={ref}
      onClick={surClic}
      title="Cliquer pour t'y déplacer"
      className="relative h-[72px] w-[104px] cursor-pointer overflow-hidden rounded-lg border border-white/40 bg-graphite/80 shadow"
    >
      <div className="absolute rounded-[2px] bg-terracotta/55" style={{ left: '0%', top: '0%', width: '60%', height: '62%' }} title="Centre-ville" />
      <div className="absolute rounded-[2px] bg-olive/55" style={{ left: '63%', top: '2%', width: '35%', height: '36%' }} title="Campus" />
      <div className="absolute rounded-[2px] bg-cuivre/55" style={{ left: '0%', top: '67%', width: '60%', height: '31%' }} title="Quartier résidentiel" />
      <div
        className={`absolute rounded-[2px] ${industrielleVerrouillee ? 'bg-white/15' : 'bg-pierre/60'}`}
        style={{ left: '64%', top: '45%', width: '32%', height: '32%' }}
        title="Zone industrielle"
      />
      <div
        className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ivoire ring-2 ring-terracotta"
        style={{ left: `${pos.xPct}%`, top: `${pos.yPct}%` }}
      />
    </div>
  );
}

export function QuartierIso({
  avatarConfig,
  nomJoueur,
  besoins,
  niveau,
  userId,
}: {
  avatarConfig?: unknown;
  nomJoueur?: string;
  besoins?: { energie: number; moral: number; faim: number; social: number };
  niveau?: number;
  userId?: string;
}) {
  const router = useRouter();
  const [pos, setPos] = useState({ xPct: 27.6, yPct: 33.1 });
  const [enMarche, setEnMarche] = useState(false);
  const [dureeMarche, setDureeMarche] = useState(620);
  const [actionIcone, setActionIcone] = useState<string | null>(null);
  const [phase, setPhase] = useState<PhaseJour>('jour');
  const [mode, setMode] = useState<ModeAmbiance>('auto');
  const [avertissement, setAvertissement] = useState<string | null>(null);
  const [maisonSelectionnee, setMaisonSelectionnee] = useState<JoueurActif | null>(null);

  // Caméra : le quartier est un vrai monde explorable (glisser pour déplacer, molette/boutons
  // pour zoomer), pas une simple image figée dans une fenêtre étroite.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(ZOOM_DEFAUT);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [glisse, setGlisse] = useState(false);
  const [indiceVisible, setIndiceVisible] = useState(true);
  const glisseInfo = useRef<{ x: number; y: number; panX: number; panY: number; bouge: boolean } | null>(null);
  const dragueRef = useRef(false);
  const centreInit = useRef(false);

  // Les vrais autres joueurs actifs, récupérés une seule fois puis répartis entre ceux qui se
  // promènent en centre-ville et ceux dont on affiche la maison — pensé pour rester léger même
  // avec plusieurs milliers de comptes : le backend ne renvoie jamais qu'un échantillon borné
  // et tournant, on ne rend jamais plus d'éléments que de places disponibles dans la scène.
  const { data: joueursActifs } = useQuery({
    queryKey: ['carriere', 'joueurs-actifs'],
    queryFn: () => api.get<JoueurActif[]>('/carriere/joueurs-actifs'),
    staleTime: 45_000,
    refetchInterval: 45_000,
  });
  const joueursCentreVille = (joueursActifs ?? []).slice(0, NB_EMPLACEMENTS_CENTRE_VILLE);
  const joueursResidentiel = (joueursActifs ?? []).slice(NB_EMPLACEMENTS_CENTRE_VILLE);

  useEffect(() => {
    const sauvegarde = (window.localStorage.getItem(CLE_MODE_AMBIANCE) as ModeAmbiance) || 'auto';
    setMode(sauvegarde);
  }, []);

  useEffect(() => {
    if (mode === 'jour') setPhase('jour');
    else if (mode === 'nuit') setPhase('nuit');
    else setPhase(phaseDuJour(new Date().getHours()));
  }, [mode]);

  function changerMode(m: ModeAmbiance) {
    setMode(m);
    window.localStorage.setItem(CLE_MODE_AMBIANCE, m);
    jouerSon('clic');
  }

  // Mesure du cadre visible pour calculer l'échelle "plein cadre" (aucun vide autour de la scène).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setTaille({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseScale = taille.w && taille.h ? Math.min(taille.w / SCENE_W, taille.h / SCENE_H) : 0;
  const echelle = baseScale * zoom;

  function limiterPan(x: number, y: number, s: number) {
    if (!taille.w || !taille.h || !s) return { x: 0, y: 0 };
    const minX = Math.min(0, taille.w - SCENE_W * s);
    const minY = Math.min(0, taille.h - SCENE_H * s);
    return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  }

  function centrerSur(px: number, py: number, s: number) {
    if (!taille.w || !taille.h) return;
    setPan(limiterPan(taille.w / 2 - px * s, taille.h / 2 - py * s, s));
  }

  // Centrage initial sur le joueur dès que le cadre est mesuré, puis recadrage silencieux
  // à chaque redimensionnement pour ne jamais laisser de bande vide sur les côtés.
  useEffect(() => {
    if (!taille.w || !taille.h) return;
    if (!centreInit.current) {
      centreInit.current = true;
      centrerSur((pos.xPct / 100) * SCENE_W, (pos.yPct / 100) * SCENE_H, baseScale * zoom);
      return;
    }
    setPan((p) => limiterPan(p.x, p.y, baseScale * zoom));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taille.w, taille.h]);

  useEffect(() => {
    const t = setTimeout(() => setIndiceVisible(false), 4500);
    return () => clearTimeout(t);
  }, []);

  // Zoome en gardant le point visé (ancre, en pixels écran) immobile — sans ça, le décor
  // dérive vers le coin haut-gauche à chaque zoom puisque le pan reste fixe pendant que
  // l'échelle change. Par défaut l'ancre est le centre du cadre (boutons +/−) ; la molette
  // vise plutôt le curseur.
  function zoomer(delta: number, ancre?: { x: number; y: number }) {
    jouerSon('clic');
    setZoom((z) => {
      const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100));
      const s1 = baseScale * z;
      const s2 = baseScale * nz;
      const cx = ancre?.x ?? taille.w / 2;
      const cy = ancre?.y ?? taille.h / 2;
      setPan((p) => {
        if (!s1) return limiterPan(p.x, p.y, s2);
        const sceneX = (cx - p.x) / s1;
        const sceneY = (cy - p.y) / s1;
        return limiterPan(cx - sceneX * s2, cy - sceneY * s2, s2);
      });
      return nz;
    });
  }

  function recentrer() {
    jouerSon('clic');
    setZoom(ZOOM_DEFAUT);
    centrerSur((pos.xPct / 100) * SCENE_W, (pos.yPct / 100) * SCENE_H, baseScale * ZOOM_DEFAUT);
  }

  function allerVersMinimap(xPct: number, yPct: number) {
    jouerSon('clic');
    centrerSur((xPct / 100) * SCENE_W, (yPct / 100) * SCENE_H, echelle);
  }

  function surPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    glisseInfo.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, bouge: false };
    setGlisse(true);
    setIndiceVisible(false);
  }
  function surPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const info = glisseInfo.current;
    if (!info) return;
    const dx = e.clientX - info.x;
    const dy = e.clientY - info.y;
    if (!info.bouge && Math.hypot(dx, dy) > 5) {
      info.bouge = true;
      dragueRef.current = true;
    }
    if (info.bouge) setPan(limiterPan(info.panX + dx, info.panY + dy, echelle));
  }
  function surPointerFin() {
    glisseInfo.current = null;
    setGlisse(false);
  }
  function surClicCapture(e: ReactMouseEvent<HTMLDivElement>) {
    if (dragueRef.current) {
      e.preventDefault();
      e.stopPropagation();
      dragueRef.current = false;
    }
  }
  function surMolette(e: ReactWheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    const ancre = rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : undefined;
    zoomer(e.deltaY > 0 ? -0.15 : 0.15, ancre);
  }

  // Humeur du plumbob et bulle de pensée dérivées de l'état du personnage.
  const humeur = besoins ? humeurDepuisBesoins(besoins) : 'bien';
  const pensee = besoins ? besoinCritique(besoins) : null;

  // Points d'entrée pour les cibles appelées directement par leur href (pas via un bâtiment
  // précis) : le chantier spécial du centre-ville et ta maison. Les bâtiments, eux, calculent
  // leur propre cible de marche (voir ouvreBatiment) — plusieurs écoles partagent le même href
  // /app/academie, il ne faut donc jamais viser un point d'entrée générique par href seul.
  const pointsEntree = useMemo(() => {
    const monPlot = plotPosition(monPlotIndex(userId));
    const fMaison = facesIso(monPlot.x, monPlot.y, MAISON_W, MAISON_D, MAISON_H);
    return {
      '/app/chantiers': { x: 620, y: 464 },
      '/app/lieu/residence': { x: fMaison.F.x, y: fMaison.F.y + MAISON_H + 12 },
    } as Record<string, { x: number; y: number }>;
  }, [userId]);

  function marcherVers(cible: { x: number; y: number } | undefined, href: string) {
    jouerSon('clic');
    if (cible) {
      // Durée proportionnelle à la distance à parcourir (en unités de scène) : un petit
      // déplacement reste rapide, une traversée du quartier prend visiblement plus longtemps —
      // sans ça le perso donnait l'impression de "sauter" instantanément vers sa cible.
      const actuel = { x: (pos.xPct / 100) * SCENE_W, y: (pos.yPct / 100) * SCENE_H };
      const distance = Math.hypot(cible.x - actuel.x, cible.y - actuel.y);
      const duree = Math.round(Math.min(1400, Math.max(400, 320 + distance * 0.55)));
      setDureeMarche(duree);
      setActionIcone(ICONES_ACTION[href] ?? null);
      setEnMarche(true);
      setPos({ xPct: (cible.x / SCENE_W) * 100, yPct: (cible.y / SCENE_H) * 100 });
      centrerSur(cible.x, cible.y, echelle);
      setTimeout(() => router.push(href), duree);
    } else {
      router.push(href);
    }
  }

  function ouvre(href: string) {
    marcherVers(pointsEntree[href], href);
  }

  // Un bâtiment de zone verrouillée n'ouvre rien : on prévient plutôt à quel niveau elle se débloque.
  function ouvreBatiment(def: BatimentDef) {
    const zone = def.zone ? ZONES.find((z) => z.id === def.zone) : undefined;
    if (zone && (niveau ?? 1) < zone.niveauRequis) {
      jouerSon('clic');
      setAvertissement(`${zone.icone} ${zone.nom} — se débloque au niveau ${zone.niveauRequis}`);
      setTimeout(() => setAvertissement(null), 2600);
      return;
    }
    const f = facesIso(def.ox, def.oy, def.w, def.d, def.h);
    marcherVers({ x: f.F.x, y: f.F.y + def.h + 14 }, def.href);
  }

  // École assignée de façon stable (hash de l'id) — la même à chaque connexion.
  const ECOLES_SLUGS = ['e1', 'e2', 'e3', 'e4'];
  const monEcole = ECOLES_SLUGS[hashStable(userId ?? 'moi') % ECOLES_SLUGS.length];

  // Peintre : dessiner du fond vers l'avant (tri par la pointe avant au sol)
  const batimentsTries = [...BATIMENTS].sort(
    (a, b) => a.oy + (a.w + a.d) * 0.5 + a.h - (b.oy + (b.w + b.d) * 0.5 + b.h),
  );

  const ambiance = AMBIANCE[phase];

  return (
    <div
      className={`relative h-[58vh] max-h-[560px] min-h-[400px] overflow-hidden rounded-3xl border-2 border-pierre/50 bg-gradient-to-b shadow-xl ${ambiance.ciel} transition-colors duration-1000 sm:h-[68vh] sm:min-h-[480px] sm:max-h-[760px] lg:max-h-[840px]`}
    >
      <div
        ref={viewportRef}
        onPointerDown={surPointerDown}
        onPointerMove={surPointerMove}
        onPointerUp={surPointerFin}
        onPointerCancel={surPointerFin}
        onPointerLeave={surPointerFin}
        onWheel={surMolette}
        onClickCapture={surClicCapture}
        className={`absolute inset-0 touch-none select-none ${glisse ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: SCENE_W,
            height: SCENE_H,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${echelle || baseScale || 1})`,
            transformOrigin: '0 0',
            transition: glisse ? 'none' : 'transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        >
        <svg width={SCENE_W} height={SCENE_H} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className="block select-none">
          {/* Soleil / lune + nuages */}
          {phase === 'nuit' ? (
            <>
              <circle cx="1420" cy="52" r="22" fill="#E8DCC8" opacity="0.9" />
              <circle cx="1412" cy="45" r="18" fill="#2B2B45" opacity="0.55" />
              {[[120, 70], [260, 40], [400, 90], [620, 50], [760, 100], [500, 30], [980, 60], [1180, 40], [1350, 110]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={1.6} fill="#F5F0E6" opacity="0.8" />
              ))}
            </>
          ) : (
            <circle cx="1420" cy="52" r="26" fill={phase === 'jour' ? '#D9B382' : '#E8A050'} opacity="0.85" />
          )}
          <g className="nuage-drift" opacity={phase === 'nuit' ? 0.25 : 0.8}>
            <ellipse cx="180" cy="48" rx="42" ry="14" fill="#F5F0E6" />
            <ellipse cx="215" cy="40" rx="28" ry="11" fill="#F5F0E6" />
          </g>
          <g className="nuage-drift-lent" opacity={phase === 'nuit' ? 0.2 : 0.7}>
            <ellipse cx="560" cy="34" rx="36" ry="12" fill="#F5F0E6" />
          </g>
          <g className="nuage-drift" opacity={phase === 'nuit' ? 0.2 : 0.65}>
            <ellipse cx="1100" cy="90" rx="38" ry="13" fill="#F5F0E6" />
          </g>

          {/* Routes isométriques qui se croisent */}
          <polygon points="60,196 900,616 900,668 60,248" fill="#8A8680" opacity="0.85" />
          <polygon points="840,196 0,616 0,668 840,248" fill="#8A8680" opacity="0.85" />
          {/* Marquage central */}
          <g stroke="#F5F0E6" strokeWidth="3" strokeDasharray="16 14" opacity="0.7">
            <line x1="80" y1="232" x2="880" y2="632" />
            <line x1="820" y1="232" x2="20" y2="632" />
          </g>

          {/* Arbres et buissons */}
          {[
            [70, 150], [320, 168], [530, 62], [688, 130], [46, 340], [872, 330], [190, 560], [700, 570],
          ].map(([x, y], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y + 26} rx="14" ry="5" fill="rgba(43,43,46,0.12)" />
              <rect x={x - 2.5} y={y + 8} width="5" height="17" fill="#4A342A" />
              <circle cx={x} cy={y} r="13" fill="#6B7A3F" />
              <circle cx={x - 8} cy={y + 6} r="9" fill="#7A8B4C" />
              <circle cx={x + 8} cy={y + 6} r="9" fill="#5B6935" />
            </g>
          ))}

          {/* Chantier en cours (parcelle spéciale, en haut à droite du croisement) */}
          <g className="batiment-iso" onClick={() => ouvre('/app/chantiers')} role="link" aria-label="Chantier">
            <polygon points="600,330 730,395 640,440 510,375" fill="#D9B382" opacity="0.7" />
            <polygon points="600,330 730,395 640,440 510,375" fill="none" stroke="#B87333" strokeWidth="2" strokeDasharray="8 6" />
            {/* Dalle + murs partiels */}
            <polygon points="590,362 660,397 620,417 550,382" fill="#C9C4BA" />
            <polygon points="590,362 590,342 660,377 660,397" fill="#E8DCC8" />
            <polygon points="590,342 550,362 550,382 590,362" fill="#DBC7A8" />
            {/* Grue animée */}
            <g className="anim-grue">
              <rect x="676" y="268" width="7" height="112" fill="#B87333" />
              <rect x="618" y="262" width="112" height="7" rx="2" fill="#B87333" />
              <rect x="670" y="252" width="19" height="14" rx="3" fill="#4A342A" />
              <line x1="630" y1="269" x2="630" y2="322" stroke="#4A342A" strokeWidth="2" />
              <rect x="622" y="322" width="16" height="11" rx="2" fill="#C1502E">
                <animate attributeName="y" values="322;348;322" dur="6s" repeatCount="indefinite" />
              </rect>
            </g>
            {/* Tas de sable + agglos */}
            <ellipse cx="545" cy="410" rx="18" ry="7" fill="#D9B382" />
            <ellipse cx="545" cy="406" rx="13" ry="5" fill="#C9A984" />
            <rect x="655" y="420" width="22" height="7" fill="#A85F4C" />
            <rect x="658" y="413" width="22" height="7" fill="#C1502E" />
            <g>
              <rect x="576" y="446" width="88" height="18" rx="9" fill="#2B2B2E" opacity="0.82" />
              <text x="620" y="458.5" textAnchor="middle" fontSize="11" fontWeight="600" fill="#F5F0E6">Chantier</text>
            </g>
          </g>

          {/* Bâtiments (ordre peintre) */}
          {batimentsTries.map((b) => (
            <Batiment
              key={b.slug}
              def={b}
              onOuvre={ouvreBatiment}
              verrouille={!!b.zone && (niveau ?? 1) < (ZONES.find((z) => z.id === b.zone)?.niveauRequis ?? 0)}
              highlight={b.ecole === monEcole}
            />
          ))}

          {/* Zones à débloquer : voile de brume + étiquette sur toute la parcelle si verrouillée */}
          {ZONES.map((zone) => {
            const verrouillee = (niveau ?? 1) < zone.niveauRequis;
            if (!verrouillee) return null;
            return (
              <g key={zone.id} opacity="0.9">
                <rect x={zone.region.x} y={zone.region.y} width={zone.region.w} height={zone.region.h} rx="18" fill="#1A1A1C" opacity="0.16" />
                <rect
                  x={zone.region.x + zone.region.w / 2 - 110}
                  y={zone.region.y + 14}
                  width="220"
                  height="30"
                  rx="15"
                  fill="#2B2B2E"
                  opacity="0.85"
                />
                <text x={zone.region.x + zone.region.w / 2} y={zone.region.y + 34} textAnchor="middle" fontSize="13" fontWeight="700" fill="#F5F0E6">
                  🔒 {zone.nom} — Niveau {zone.niveauRequis}
                </text>
              </g>
            );
          })}

          {/* Étiquettes de zone toujours ouvertes, pour repérer la ville d'un coup d'œil */}
          <g opacity="0.85">
            <text x="450" y="24" textAnchor="middle" fontSize="15" fontWeight="700" fill="#4A342A" opacity="0.55">
              🏙️ Centre-ville
            </text>
            <text x="1220" y="24" textAnchor="middle" fontSize="15" fontWeight="700" fill="#4A342A" opacity="0.55">
              🎓 Campus
            </text>
            <text x="450" y="726" textAnchor="middle" fontSize="15" fontWeight="700" fill="#4A342A" opacity="0.55">
              🏘️ Quartier résidentiel
            </text>
          </g>

          {/* Chemins reliant les nouveaux quartiers au centre-ville */}
          <g stroke="#F5F0E6" strokeWidth="10" strokeLinecap="round" opacity="0.35">
            <line x1="860" y1="180" x2="1010" y2="150" />
            <line x1="430" y1="640" x2="430" y2="720" />
          </g>

          {/* Le quartier résidentiel : ta maison, toujours au même endroit + celles des autres joueurs */}
          <MaisonsJoueursSvg
            userId={userId}
            nomJoueur={nomJoueur}
            joueurs={joueursResidentiel}
            onOuvre={ouvre}
            onSelectionner={setMaisonSelectionnee}
          />

          {/* Passage piéton près du joueur */}
          <g fill="#F5F0E6" opacity="0.85">
            {[0, 1, 2, 3].map((i) => (
              <polygon
                key={i}
                points={`${pt(404 + i * 18, 402 + i * 9)} ${pt(418 + i * 18, 395 + i * 9)} ${pt(428 + i * 18, 400 + i * 9)} ${pt(414 + i * 18, 407 + i * 9)}`}
              />
            ))}
          </g>

          {/* PNJ qui se promènent le long des routes (aller-retour permanent) */}
          <g opacity={phase === 'nuit' ? 0.55 : 1}>
            <g>
              <circle cx="0" cy="-14" r="6" fill="#C68642" />
              <path d="M-6 -22 Q-6 -30 0 -30 Q6 -30 6 -22 L6 -20 L-6 -20 Z" fill="#D9B382" />
              <rect x="-6" y="-9" width="12" height="13" rx="4" fill="#6B7A3F" />
              <animateMotion dur="34s" repeatCount="indefinite" path="M 140,270 L 760,580 L 140,270" />
            </g>
            <g>
              <circle cx="0" cy="-14" r="6" fill="#8D5524" />
              <path d="M-6 -22 Q-6 -30 0 -30 Q6 -30 6 -22 L6 -20 L-6 -20 Z" fill="#C1502E" />
              <rect x="-6" y="-9" width="12" height="13" rx="4" fill="#2B2B2E" />
              <animateMotion dur="42s" repeatCount="indefinite" path="M 740,255 L 180,545 L 740,255" />
            </g>
            <g>
              <circle cx="0" cy="-14" r="5.5" fill="#E0AC69" />
              <rect x="-5.5" y="-9" width="11" height="12" rx="4" fill="#B87333" />
              <animateMotion dur="26s" repeatCount="indefinite" path="M 300,350 L 560,480 L 300,350" begin="6s" />
            </g>
            <g>
              <circle cx="0" cy="-14" r="6" fill="#C68642" />
              <path d="M-6 -22 Q-6 -30 0 -30 Q6 -30 6 -22 L6 -20 L-6 -20 Z" fill="#6B7A3F" />
              <rect x="-6" y="-9" width="12" height="13" rx="4" fill="#4A342A" />
              <animateMotion dur="30s" repeatCount="indefinite" path="M 200,320 L 820,610 L 200,320" begin="3s" />
            </g>
            <g>
              <circle cx="0" cy="-14" r="5.5" fill="#8D5524" />
              <path d="M-5.5 -22 Q-5.5 -29 0 -29 Q5.5 -29 5.5 -22 L5.5 -20 L-5.5 -20 Z" fill="#B87333" />
              <rect x="-5.5" y="-9" width="11" height="12" rx="4" fill="#DCE5DC" />
              <animateMotion dur="38s" repeatCount="indefinite" path="M 680,230 L 120,500 L 680,230" begin="10s" />
            </g>
          </g>

          {/* Voile d'ambiance jour/nuit — assombrit toute la scène en soirée */}
          {ambiance.opaciteOverlay > 0 && (
            <rect width={SCENE_W} height={SCENE_H} fill={ambiance.overlay} opacity={ambiance.opaciteOverlay} style={{ transition: 'opacity 1s ease' }} />
          )}
        </svg>

        {/* Le joueur : marche jusqu'au bâtiment visé avant d'y entrer — la durée de la marche
            est proportionnelle à la distance (voir marcherVers), pas un pas fixe pour tout. */}
        <div
          className="absolute flex -translate-x-1/2 flex-col items-center ease-in-out"
          style={{ left: `${pos.xPct}%`, top: `${pos.yPct}%`, transitionProperty: 'left, top', transitionDuration: `${dureeMarche}ms` }}
        >
          {/* Bulle de pensée façon Sims quand un besoin est bas */}
          {pensee && !enMarche && (
            <div className="anim-fade-up relative mb-1 rounded-2xl bg-white px-2.5 py-1 text-sm shadow-md">
              <span title={pensee.label}>{pensee.icone}</span>
              <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
            </div>
          )}
          {/* Bulle d'action : ce que le perso va faire, visible pendant qu'il marche vers un lieu de vie */}
          {enMarche && actionIcone && (
            <div className="anim-fade-up relative mb-1 rounded-2xl bg-white px-2.5 py-1 text-sm shadow-md">
              <span>{actionIcone}</span>
              <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
            </div>
          )}
          <Plumbob taille={20} humeur={humeur} />
          <div className={enMarche ? 'avatar-marche' : 'anim-float'}>
            <AvatarBtp config={avatarConfig} taille={58} className="!rounded-full shadow-lg ring-2 ring-white/70" />
          </div>
          {nomJoueur && (
            <span className="mt-1 rounded-full bg-graphite/85 px-2.5 py-0.5 text-[10px] font-bold text-ivoire shadow">
              {nomJoueur}
            </span>
          )}
        </div>

        {/* Les autres vrais joueurs de BTP Life, actifs récemment — le monde est partagé */}
        <AutresJoueurs joueurs={joueursCentreVille} />
        </div>
      </div>

      {/* Fiche de profil d'un voisin du quartier résidentiel (HTML, hors du SVG) */}
      {maisonSelectionnee && <CarteJoueur joueur={maisonSelectionnee} onFermer={() => setMaisonSelectionnee(null)} />}

      {/* HUD superposé, hors de la couche caméra (jamais déplacé par le glisser/zoom) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Contrôle d'ambiance : Auto suit l'heure réelle, Jour/Nuit forcent la scène */}
        <div className="pointer-events-auto absolute right-2 top-2 flex gap-0.5 rounded-full bg-white/85 p-1 shadow backdrop-blur">
          {(
            [
              ['auto', '⏰', "Suivre l'heure réelle"],
              ['jour', '☀️', 'Toujours en plein jour'],
              ['nuit', '🌙', 'Toujours de nuit'],
            ] as const
          ).map(([m, icone, titre]) => (
            <button
              key={m}
              onClick={() => changerMode(m)}
              title={titre}
              className={`rounded-full px-2 py-1 text-sm transition-all ${mode === m ? 'bg-terracotta shadow-sm' : 'opacity-60 hover:opacity-100'}`}
            >
              {icone}
            </button>
          ))}
        </div>

        {/* Mini-carte de la ville — repère les quartiers et clique pour t'y déplacer */}
        <div className="pointer-events-auto absolute bottom-3 left-3">
          <MiniCarte
            pos={pos}
            industrielleVerrouillee={(niveau ?? 1) < (ZONES.find((z) => z.id === 'industrielle')?.niveauRequis ?? 0)}
            onAller={allerVersMinimap}
          />
        </div>

        {/* Contrôles caméra : zoomer/dézoomer/recentrer sur le joueur */}
        <div className="pointer-events-auto absolute bottom-3 right-3 flex flex-col gap-1.5 rounded-2xl bg-white/85 p-1.5 shadow backdrop-blur">
          <button
            onClick={() => zoomer(0.2)}
            disabled={zoom >= ZOOM_MAX}
            title="Zoomer"
            aria-label="Zoomer"
            className="h-8 w-8 rounded-xl bg-white text-base font-bold text-graphite shadow-sm transition-transform hover:scale-105 disabled:opacity-40"
          >
            +
          </button>
          <button
            onClick={recentrer}
            title="Recentrer sur toi"
            aria-label="Recentrer sur toi"
            className="h-8 w-8 rounded-xl bg-terracotta text-sm text-ivoire shadow-sm transition-transform hover:scale-105"
          >
            🎯
          </button>
          <button
            onClick={() => zoomer(-0.2)}
            disabled={zoom <= ZOOM_MIN}
            title="Dézoomer"
            aria-label="Dézoomer"
            className="h-8 w-8 rounded-xl bg-white text-base font-bold text-graphite shadow-sm transition-transform hover:scale-105 disabled:opacity-40"
          >
            −
          </button>
        </div>

        {/* Indice d'exploration, s'efface après quelques secondes ou dès la première interaction */}
        {indiceVisible && !avertissement && (
          <div className="anim-fade-up pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-graphite/80 px-3 py-1.5 text-[11px] font-semibold text-ivoire shadow">
            🖐️ Glisse pour explorer · molette pour zoomer
          </div>
        )}

        {/* Avertissement de zone verrouillée */}
        {avertissement && (
          <div className="anim-fade-up pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-terracotta px-3.5 py-1.5 text-[11px] font-semibold text-ivoire shadow-lg">
            {avertissement}
          </div>
        )}
      </div>
    </div>
  );
}
