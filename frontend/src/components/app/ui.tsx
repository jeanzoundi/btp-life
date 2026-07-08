'use client';

// Petits composants partagés de l'application (jauges, squelettes, confettis…).

export const ICONES_TYPE: Record<string, string> = {
  QUIZ: '🧠',
  CHRONO: '⏱️',
  ANALYSE_IMAGE: '🔍',
  LECTURE_PLAN: '📐',
  CALCUL: '🧮',
  METRE: '📏',
  DEVIS: '🧾',
  RAPPORT: '📝',
  DECISION: '⚖️',
  GESTION_HUMAINE: '🤝',
  SIMULATION_LOGICIEL: '💻',
  CONTROLE_QUALITE: '✅',
  CHANTIER_COMPLET: '🏗️',
  EXAMEN: '🎓',
};

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/* Jauge XP "immeuble en élévation" : chaque niveau = un étage (§16.2 du brief). */
export function JaugeImmeuble({ progressionPct, etages = 6 }: { progressionPct: number; etages?: number }) {
  const pleins = Math.round((progressionPct / 100) * etages);
  return (
    <svg viewBox={`0 0 26 ${etages * 7 + 4}`} className="h-10 w-auto" aria-label={`Progression ${progressionPct}%`}>
      {Array.from({ length: etages }).map((_, i) => {
        const depuisLeBas = etages - 1 - i;
        const plein = depuisLeBas < pleins;
        return (
          <rect
            key={i}
            x="2"
            y={i * 7 + 2}
            width="22"
            height="5"
            rx="1"
            fill={plein ? '#C1502E' : '#E8DCC8'}
            className={plein ? 'etage-plein' : undefined}
            style={plein ? { animationDelay: `${depuisLeBas * 0.08}s` } : undefined}
          />
        );
      })}
    </svg>
  );
}

/* Anneau de progression circulaire (score, complétion). */
export function AnneauProgression({
  valeur,
  max = 100,
  taille = 120,
  epaisseur = 10,
  couleur = '#C1502E',
  children,
}: {
  valeur: number;
  max?: number;
  taille?: number;
  epaisseur?: number;
  couleur?: string;
  children?: React.ReactNode;
}) {
  const rayon = (taille - epaisseur) / 2;
  const circonference = 2 * Math.PI * rayon;
  const offset = circonference * (1 - Math.min(1, valeur / max));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} className="anneau-score">
        <circle cx={taille / 2} cy={taille / 2} r={rayon} fill="none" stroke="#E8DCC8" strokeWidth={epaisseur} />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke={couleur}
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* Radar de compétences par domaine (0–5), façon feuille de personnage RPG. */
export function RadarCompetences({
  axes,
  taille = 260,
}: {
  axes: Array<{ label: string; valeur: number }>;
  taille?: number;
}) {
  const n = Math.max(3, axes.length);
  const centre = taille / 2;
  const rayonMax = taille / 2 - 42;

  const point = (index: number, valeur: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (valeur / 5) * rayonMax;
    return [centre + r * Math.cos(angle), centre + r * Math.sin(angle)] as const;
  };

  const polygone = axes.map((a, i) => point(i, Math.min(5, Math.max(0, a.valeur))).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${taille} ${taille}`} className="mx-auto h-auto w-full max-w-xs">
      {/* Grille */}
      {[1, 2, 3, 4, 5].map((niveau) => (
        <polygon
          key={niveau}
          points={axes.map((_, i) => point(i, niveau).join(',')).join(' ')}
          fill="none"
          stroke="#E8DCC8"
          strokeWidth={niveau === 5 ? 2 : 1}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, 5);
        return <line key={i} x1={centre} y1={centre} x2={x} y2={y} stroke="#E8DCC8" strokeWidth="1" />;
      })}

      {/* Valeurs */}
      <polygon points={polygone} fill="rgba(193,80,46,0.25)" stroke="#C1502E" strokeWidth="2.5" strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = point(i, Math.min(5, Math.max(0, a.valeur)));
        return <circle key={i} cx={x} cy={y} r="4" fill="#C1502E" />;
      })}

      {/* Étiquettes */}
      {axes.map((a, i) => {
        const [x, y] = point(i, 6.4);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="600"
            fill="#2B2B2E"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

/* Pluie de confettis "poussière dorée" (célébration sobre, §11.1). */
const COULEURS_CONFETTI = ['#C1502E', '#B87333', '#D9B382', '#6B7A3F', '#A85F4C'];

export function Confettis({ nombre = 44 }: { nombre?: number }) {
  return (
    <>
      {Array.from({ length: nombre }).map((_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${(i * 97) % 100}%`,
            backgroundColor: COULEURS_CONFETTI[i % COULEURS_CONFETTI.length],
            animationDuration: `${2.2 + ((i * 13) % 18) / 10}s`,
            animationDelay: `${((i * 7) % 12) / 10}s`,
          }}
        />
      ))}
    </>
  );
}
