'use client';

// Quartier isométrique interactif façon jeu de simulation : chaque bâtiment est
// dessiné en vraie 3D isométrique (3 faces), cliquable, avec le joueur debout
// dans la rue sous son plumbob. 100 % SVG, palette du brief.
//
// Règle d'or : un bâtiment = une destination UNIQUE. Pas de doublons (une seule
// École, un seul accès par section). Les types d'écoles différenciés et les
// quartiers avancés arriveront en phase 2, avec de vrais cours.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AvatarBtp } from './avatar-btp';
import { besoinCritique, humeurDepuisBesoins } from './besoins';
import { AutresJoueurs, CarteJoueur, NB_EMPLACEMENTS_CENTRE_VILLE, type JoueurActif } from './autres-joueurs';
import { MaisonsJoueursSvg } from './maisons-joueurs';
import { jouerSon } from '@/lib/sons';
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
}

// Centre-ville épuré : 13 bâtiments, 13 destinations DISTINCTES. Aucun doublon.
const BATIMENTS: BatimentDef[] = [
  { slug: 'ECOLE', nom: 'École BTP', href: '/app/academie', ox: 190, oy: 96, w: 72, d: 54, h: 58, couleur: '#D9B382', props: 'drapeau' },
  { slug: 'CENTRE_FORMATION', nom: 'Formation logiciels', href: '/app/logiciels', ox: 392, oy: 66, w: 62, d: 48, h: 50, couleur: '#C9A984', props: 'enseigne-livre' },
  { slug: 'BUREAU_ETUDES', nom: "Bureau d'études", href: '/app/competences', ox: 584, oy: 96, w: 66, d: 48, h: 76, couleur: '#B8C4C9', props: 'fenetres' },
  { slug: 'CAFE', nom: '☕ Café', href: '/app/lieu/cafe', ox: 455, oy: 150, w: 46, d: 36, h: 40, couleur: '#B87333', props: 'enseigne-livre' },
  { slug: 'MAQUIS', nom: '🍲 Maquis', href: '/app/lieu/maquis', ox: 690, oy: 120, w: 50, d: 38, h: 38, couleur: '#C1502E', props: 'maison' },
  { slug: 'MAIRIE', nom: 'Mairie', href: '/app/lieu/mairie', ox: 108, oy: 236, w: 88, d: 58, h: 56, couleur: '#E8DCC8', props: 'colonnes' },
  { slug: 'LABORATOIRE', nom: 'Laboratoire', href: '/app/lieu/laboratoire', ox: 306, oy: 210, w: 58, d: 44, h: 48, couleur: '#DCE5DC', props: 'flasque' },
  { slug: 'ENTREPRISE', nom: 'Mon entreprise', href: '/app/entreprise', ox: 742, oy: 196, w: 64, d: 50, h: 92, couleur: '#C9C4BA', props: 'fenetres' },
  { slug: 'BANQUE', nom: 'Banque', href: '/app/lieu/banque', ox: 96, oy: 402, w: 76, d: 52, h: 54, couleur: '#E5D9B8', props: 'colonnes' },
  { slug: 'FOURNISSEUR', nom: 'Fournisseur', href: '/app/fournisseur', ox: 292, oy: 438, w: 84, d: 58, h: 42, couleur: '#D9B382', props: 'entrepot' },
  { slug: 'BUREAU_CONTROLE', nom: 'Récompenses', href: '/app/recompenses', ox: 470, oy: 470, w: 58, d: 44, h: 46, couleur: '#CFCAC0', props: 'controle' },
  { slug: 'DEPOT', nom: 'Dépôt', href: '/app/depot', ox: 636, oy: 438, w: 74, d: 52, h: 38, couleur: '#C9A984', props: 'caisses' },
  { slug: 'CLIENT', nom: "Offres d'emploi", href: '/app/offres', ox: 796, oy: 406, w: 56, d: 44, h: 42, couleur: '#E8DCC8', props: 'maison' },
  // Prestigieuse et distincte (couleur, hauteur) : c'est le nouveau pôle BTS2, séparé de l'École de base.
  { slug: 'GRANDE_ECOLE', nom: '🎓 Grande École du Bâtiment', href: '/app/academie?ecole=grande-ecole-batiment', ox: 850, oy: 300, w: 78, d: 54, h: 84, couleur: '#8B9DC3', props: 'colonnes' },
];

function Batiment({ def, onOuvre }: { def: BatimentDef; onOuvre: (def: BatimentDef) => void }) {
  const { ox, oy, w, d, h, couleur } = def;
  const f = facesIso(ox, oy, w, d, h);
  const solY = f.F.y + h;

  return (
    <g className="batiment-iso" onClick={() => onOuvre(def)} role="link" aria-label={def.nom}>
      {/* Ombre au sol */}
      <ellipse cx={f.F.x} cy={solY + 4} rx={(w + d) * 0.62} ry={(w + d) * 0.17} fill="rgba(43,43,46,0.14)" />

      {/* Corps du bâtiment */}
      <polygon points={f.gauche} fill={couleur} />
      <polygon points={f.droite} fill={assombrir(couleur, 0.78)} />
      <polygon points={f.top} fill={assombrir(couleur, 0.95)} stroke={assombrir(couleur, 0.7)} strokeWidth="0.8" />
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

// Scène resserrée sur le centre-ville + le quartier résidentiel (plus de campus ni de zone
// industrielle vides sur la droite) — la carte remplit le cadre, aucune bande morte.
const SCENE_W = 940;
const SCENE_H = 990;

// PNJ animés : de vrais avatars stylés (pas des pastilles), qui arpentent les routes en boucle.
// Chaque trajet est décrit en coordonnées de scène et suivi via CSS offset-path.
const PNJS: { config: Record<string, string>; taille: number; path: string; dur: number; delay: number }[] = [
  { config: { peau: '#C68642', casque: '#D9B382', couleurTenue: '#6B7A3F', fond: '#EAF0E2', typeTenue: 'gilet' }, taille: 44, path: 'M 140 270 L 760 580 L 140 270', dur: 36, delay: 0 },
  { config: { peau: '#8D5524', casque: '#C1502E', couleurTenue: '#2B2B2E', fond: '#EAF0E2', typeTenue: 'bleu' }, taille: 42, path: 'M 740 255 L 180 545 L 740 255', dur: 44, delay: 2 },
  { config: { peau: '#E0AC69', casque: '#B87333', couleurTenue: '#B87333', fond: '#EAF0E2', typeTenue: 'chemise' }, taille: 40, path: 'M 300 350 L 560 480 L 300 350', dur: 28, delay: 6 },
  { config: { peau: '#C68642', casque: '#6B7A3F', couleurTenue: '#4A342A', fond: '#EAF0E2', typeTenue: 'gilet' }, taille: 43, path: 'M 200 320 L 820 610 L 200 320', dur: 32, delay: 3 },
  { config: { peau: '#8D5524', casque: '#B87333', couleurTenue: '#DCE5DC', fond: '#EAF0E2', typeTenue: 'bleu' }, taille: 41, path: 'M 680 230 L 120 500 L 680 230', dur: 40, delay: 10 },
];

/** Mini-carte façon jeu de gestion : repère les quartiers d'un coup d'œil, clic = recentrer. */
function MiniCarte({ pos, onAller }: { pos: { xPct: number; yPct: number }; onAller: (xPct: number, yPct: number) => void }) {
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
      className="relative h-[70px] w-[92px] cursor-pointer overflow-hidden rounded-lg border border-white/40 bg-graphite/80 shadow"
    >
      <div className="absolute rounded-[2px] bg-terracotta/55" style={{ left: '2%', top: '2%', width: '96%', height: '58%' }} title="Centre-ville" />
      <div className="absolute rounded-[2px] bg-cuivre/55" style={{ left: '2%', top: '66%', width: '96%', height: '32%' }} title="Quartier résidentiel" />
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
  const [maisonSelectionnee, setMaisonSelectionnee] = useState<JoueurActif | null>(null);

  // Caméra : le quartier est un vrai monde explorable — on le GLISSE au doigt (mobile) ou à la
  // souris pour le parcourir. Pas de zoom : l'échelle « couvre » toujours le cadre (jamais de
  // bande vide), et le débordement se parcourt en glissant.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState({ w: 0, h: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [glisse, setGlisse] = useState(false);
  const [indiceVisible, setIndiceVisible] = useState(true);
  const glisseInfo = useRef<{ x: number; y: number; panX: number; panY: number; bouge: boolean } | null>(null);
  const dragueRef = useRef(false);
  const centreInit = useRef(false);

  // Les vrais autres joueurs actifs, récupérés une seule fois puis répartis entre ceux qui se
  // promènent en centre-ville et ceux dont on affiche la maison — pensé pour rester léger même
  // avec plusieurs milliers de comptes.
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

  // Mesure du cadre visible pour l'échelle « couvre ».
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

  // « cover » : on prend la plus grande échelle qui remplit le cadre — l'excédent se parcourt en glissant.
  const echelle = taille.w && taille.h ? Math.max(taille.w / SCENE_W, taille.h / SCENE_H) : 0;

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
      centrerSur((pos.xPct / 100) * SCENE_W, (pos.yPct / 100) * SCENE_H, echelle);
      return;
    }
    setPan((p) => limiterPan(p.x, p.y, echelle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taille.w, taille.h]);

  useEffect(() => {
    const t = setTimeout(() => setIndiceVisible(false), 4500);
    return () => clearTimeout(t);
  }, []);

  function recentrer() {
    jouerSon('clic');
    centrerSur((pos.xPct / 100) * SCENE_W, (pos.yPct / 100) * SCENE_H, echelle);
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

  // Humeur du plumbob et bulle de pensée dérivées de l'état du personnage.
  const humeur = besoins ? humeurDepuisBesoins(besoins) : 'bien';
  const pensee = besoins ? besoinCritique(besoins) : null;

  // Points d'entrée pour les cibles appelées directement par leur href (pas via un bâtiment
  // précis) : le chantier spécial du centre-ville et ta maison.
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
      // Durée proportionnelle à la distance à parcourir (un petit déplacement reste rapide,
      // une traversée du quartier prend visiblement plus longtemps).
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

  function ouvreBatiment(def: BatimentDef) {
    const f = facesIso(def.ox, def.oy, def.w, def.d, def.h);
    marcherVers({ x: f.F.x, y: f.F.y + def.h + 14 }, def.href);
  }

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
        onClickCapture={surClicCapture}
        className={`absolute inset-0 touch-none select-none ${glisse ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: SCENE_W,
            height: SCENE_H,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${echelle || 1})`,
            transformOrigin: '0 0',
            transition: glisse ? 'none' : 'transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        >
        <svg width={SCENE_W} height={SCENE_H} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className="block select-none">
          {/* Soleil / lune + nuages */}
          {phase === 'nuit' ? (
            <>
              <circle cx="838" cy="52" r="22" fill="#E8DCC8" opacity="0.9" />
              <circle cx="830" cy="45" r="18" fill="#2B2B45" opacity="0.55" />
              {[[120, 70], [260, 40], [400, 90], [620, 50], [760, 100], [500, 30], [880, 60]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={1.6} fill="#F5F0E6" opacity="0.8" />
              ))}
            </>
          ) : (
            <circle cx="838" cy="52" r="26" fill={phase === 'jour' ? '#D9B382' : '#E8A050'} opacity="0.85" />
          )}
          <g className="nuage-drift" opacity={phase === 'nuit' ? 0.25 : 0.8}>
            <ellipse cx="180" cy="48" rx="42" ry="14" fill="#F5F0E6" />
            <ellipse cx="215" cy="40" rx="28" ry="11" fill="#F5F0E6" />
          </g>
          <g className="nuage-drift-lent" opacity={phase === 'nuit' ? 0.2 : 0.7}>
            <ellipse cx="560" cy="34" rx="36" ry="12" fill="#F5F0E6" />
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
            <Batiment key={b.slug} def={b} onOuvre={ouvreBatiment} />
          ))}

          {/* Étiquettes de zone, pour repérer la ville d'un coup d'œil */}
          <g opacity="0.85">
            <text x="450" y="24" textAnchor="middle" fontSize="15" fontWeight="700" fill="#4A342A" opacity="0.55">
              🏙️ Centre-ville
            </text>
            <text x="450" y="712" textAnchor="middle" fontSize="15" fontWeight="700" fill="#4A342A" opacity="0.55">
              🏘️ Quartier résidentiel
            </text>
          </g>

          {/* Chemin reliant le quartier résidentiel au centre-ville */}
          <g stroke="#F5F0E6" strokeWidth="10" strokeLinecap="round" opacity="0.35">
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

          {/* Voile d'ambiance jour/nuit — assombrit toute la scène en soirée */}
          {ambiance.opaciteOverlay > 0 && (
            <rect width={SCENE_W} height={SCENE_H} fill={ambiance.overlay} opacity={ambiance.opaciteOverlay} style={{ transition: 'opacity 1s ease' }} />
          )}
        </svg>

        {/* PNJ : de vrais avatars stylés qui arpentent les routes en boucle (CSS offset-path) */}
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{ opacity: phase === 'nuit' ? 0.6 : 1 }}>
          {PNJS.map((p, i) => (
            <div
              key={i}
              className="pnj-marche absolute left-0 top-0"
              style={{ offsetPath: `path('${p.path}')`, offsetRotate: '0deg', offsetAnchor: '50% 90%', animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` } as React.CSSProperties}
            >
              <span className="anim-float block">
                <AvatarBtp config={p.config} taille={p.taille} className="!rounded-full shadow-md ring-2 ring-white/60" />
              </span>
            </div>
          ))}
        </div>

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

      {/* HUD superposé, hors de la couche caméra (jamais déplacé par le glisser) */}
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
          <MiniCarte pos={pos} onAller={allerVersMinimap} />
        </div>

        {/* Recentrer sur le joueur (pas de zoom : on explore en glissant) */}
        <div className="pointer-events-auto absolute bottom-3 right-3">
          <button
            onClick={recentrer}
            title="Recentrer sur toi"
            aria-label="Recentrer sur toi"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta text-lg text-ivoire shadow-lg transition-transform hover:scale-105"
          >
            🎯
          </button>
        </div>

        {/* Indice d'exploration, s'efface après quelques secondes ou dès la première interaction */}
        {indiceVisible && (
          <div className="anim-fade-up pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-graphite/80 px-3 py-1.5 text-[11px] font-semibold text-ivoire shadow">
            🖐️ Glisse pour explorer le quartier
          </div>
        )}
      </div>
    </div>
  );
}
