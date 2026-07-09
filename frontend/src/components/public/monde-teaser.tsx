import { pt, facesIso, assombrir } from '@/lib/iso-geometrie';

// Aperçu du monde virtuel pour la page publique — mêmes helpers iso que le vrai quartier
// (frontend/src/components/app/quartier-iso.tsx), en miniature, pour donner un vrai avant-goût
// sans dupliquer toute la logique de caméra/besoins réservée à l'app connectée.
function BatimentMini({ ox, oy, w, d, h, couleur }: { ox: number; oy: number; w: number; d: number; h: number; couleur: string }) {
  const f = facesIso(ox, oy, w, d, h);
  return (
    <g>
      <ellipse cx={f.F.x} cy={f.F.y + h + 4} rx={(w + d) * 0.6} ry={(w + d) * 0.16} fill="rgba(43,43,46,0.12)" />
      <polygon points={f.gauche} fill={couleur} />
      <polygon points={f.droite} fill={assombrir(couleur, 0.78)} />
      <polygon points={f.top} fill={assombrir(couleur, 0.95)} stroke={assombrir(couleur, 0.7)} strokeWidth="0.8" />
    </g>
  );
}

function AvatarMini({ x, y, couleur }: { x: number; y: number; couleur: string }) {
  return (
    <g className="anim-float">
      <polygon points={`${pt(x, y - 20)} ${pt(x + 6, y - 12)} ${pt(x, y - 6)} ${pt(x - 6, y - 12)}`} fill="#6B7A3F" opacity="0.9" />
      <circle cx={x} cy={y - 2} r="7" fill={couleur} />
      <rect x={x - 6} y={y + 4} width="12" height="13" rx="4" fill="#2B2B2E" />
    </g>
  );
}

export function MondeTeaser() {
  return (
    <svg viewBox="0 0 420 300" className="h-auto w-full max-w-md" aria-hidden="true">
      {/* Ciel dégradé jour/nuit — clin d'œil au cycle réel du jeu */}
      <defs>
        <linearGradient id="monde-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF0E2" />
          <stop offset="100%" stopColor="#DFE6CE" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="420" height="300" rx="18" fill="url(#monde-ciel)" />

      {/* Routes */}
      <polygon points="20,140 400,260 400,278 20,158" fill="#8A8680" opacity="0.5" />

      {/* Bâtiments (ordre peintre approximatif) */}
      <BatimentMini ox={70} oy={70} w={54} d={40} h={44} couleur="#D9B382" />
      <BatimentMini ox={190} oy={50} w={48} d={38} h={58} couleur="#B8C4C9" />
      <BatimentMini ox={300} oy={90} w={42} d={32} h={36} couleur="#C1502E" />
      <BatimentMini ox={130} oy={150} w={38} d={30} h={30} couleur="#E8DCC8" />

      {/* Le joueur + deux vrais autres joueurs, façon Sims */}
      <AvatarMini x={110} y={200} couleur="#C68642" />
      <AvatarMini x={230} y={185} couleur="#8D5524" />
      <AvatarMini x={330} y={205} couleur="#E0AC69" />

      {/* Bulle sociale */}
      <g>
        <rect x="245" y="150" width="60" height="24" rx="12" fill="#FFFFFF" opacity="0.92" />
        <text x="275" y="166" textAnchor="middle" fontSize="14">💬</text>
      </g>
    </svg>
  );
}
