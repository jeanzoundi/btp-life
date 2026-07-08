'use client';

// Le quartier résidentiel : chaque joueur (toi inclus) a sa propre maison, assignée de façon
// stable via un hash de son id — pas besoin de la stocker côté serveur, elle est toujours la
// même à chaque connexion. Réutilise le rendu iso de quartier-iso.tsx.

import { facesIso, pt, assombrir } from '@/lib/iso-geometrie';
import { type JoueurActif } from './autres-joueurs';
import { RESID_PLOTS, MAISON_W, MAISON_D, MAISON_H, plotPosition, monPlotIndex, plotIndexPour } from '@/lib/residence-plots';

function MaisonMini({ ox, oy, nom, moi, onClick }: { ox: number; oy: number; nom: string; moi: boolean; onClick: () => void }) {
  const w = MAISON_W;
  const d = MAISON_D;
  const h = MAISON_H;
  const f = facesIso(ox, oy, w, d, h);
  const solY = f.F.y + h;
  const couleur = moi ? '#C1854F' : '#8A6D52';

  return (
    <g className="batiment-iso" onClick={onClick} role="link" aria-label={nom}>
      <ellipse cx={f.F.x} cy={solY + 3} rx={(w + d) * 0.55} ry={(w + d) * 0.15} fill="rgba(43,43,46,0.13)" />
      <polygon points={f.gauche} fill={couleur} />
      <polygon points={f.droite} fill={assombrir(couleur, 0.78)} />
      <polygon points={f.top} fill={assombrir(couleur, 0.95)} stroke={assombrir(couleur, 0.7)} strokeWidth="0.7" />
      {/* Toit terre cuite en pente */}
      <polygon
        points={`${pt(ox - d, oy + d * 0.5)} ${pt(ox, oy - 11)} ${pt(ox + w, oy + w * 0.5 - 11)} ${pt(f.F.x, f.F.y)}`}
        fill={moi ? '#C1502E' : '#A8431F'}
      />
      <polygon
        points={`${pt(ox, oy - 11)} ${pt(ox + w, oy + w * 0.5 - 11)} ${pt(ox + w, oy + w * 0.5)} ${pt(ox, oy)}`}
        fill={moi ? '#A8431F' : '#8A351A'}
      />
      {/* Porte */}
      <polygon
        points={`${pt(f.F.x - d * 0.3, f.F.y + d * 0.15 + h - 14)} ${pt(f.F.x - d * 0.08, f.F.y + d * 0.03 + h - 14)} ${pt(f.F.x - d * 0.08, f.F.y + d * 0.03 + h)} ${pt(f.F.x - d * 0.3, f.F.y + d * 0.15 + h)}`}
        fill="#4A342A"
      />
      {moi && (
        <polygon points={`${pt(ox + w * 0.32, oy - 30)} ${pt(ox + w * 0.4, oy - 22)} ${pt(ox + w * 0.24, oy - 22)}`} fill="#D9B382" />
      )}
      <g>
        <rect x={f.F.x - 40} y={solY + 8} width="80" height="16" rx="8" fill={moi ? '#B87333' : '#2B2B2E'} opacity="0.88" />
        <text x={f.F.x} y={solY + 19.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#F5F0E6">
          {moi ? '🏠 Chez toi' : nom}
        </text>
      </g>
    </g>
  );
}

/**
 * Uniquement des éléments SVG (des `<g>`) — doit être rendu à l'intérieur du `<svg>` du
 * quartier iso. La fiche de profil d'un autre joueur (HTML, en dehors du SVG) est gérée par
 * le parent via `onSelectionner`, voir `<CarteJoueur>` dans quartier-iso.tsx.
 */
export function MaisonsJoueursSvg({
  userId,
  nomJoueur,
  joueurs,
  onOuvre,
  onSelectionner,
}: {
  userId?: string;
  nomJoueur?: string;
  joueurs: JoueurActif[];
  onOuvre: (href: string) => void;
  onSelectionner: (joueur: JoueurActif) => void;
}) {
  const pris = new Set<number>();
  const monPlot = monPlotIndex(userId);
  pris.add(monPlot);
  const autresAvecPlot = joueurs.slice(0, RESID_PLOTS - 1).map((j) => ({
    joueur: j,
    plot: plotIndexPour(j.userId, pris),
  }));

  return (
    <>
      {(() => {
        const { x, y } = plotPosition(monPlot);
        return <MaisonMini ox={x} oy={y} nom={nomJoueur ?? 'Toi'} moi onClick={() => onOuvre('/app/lieu/residence')} />;
      })()}
      {autresAvecPlot.map(({ joueur, plot }) => {
        const { x, y } = plotPosition(plot);
        return <MaisonMini key={joueur.userId} ox={x} oy={y} nom={joueur.nom} moi={false} onClick={() => onSelectionner(joueur)} />;
      })}
    </>
  );
}
