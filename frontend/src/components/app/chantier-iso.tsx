'use client';

// Vue isométrique du chantier qui évolue avec l'avancement (terrain → fondations →
// murs → toiture → fini). 100 % SVG, palette du brief, aucune image externe.

export function ChantierIso({ avancement, taille = 280 }: { avancement: number; taille?: number }) {
  const pct = Math.max(0, Math.min(100, avancement));
  const etape = pct >= 100 ? 4 : pct >= 70 ? 3 : pct >= 35 ? 2 : pct >= 10 ? 1 : 0;

  return (
    <svg viewBox="0 0 320 240" width={taille} height={(taille * 240) / 320} aria-label={`Chantier à ${pct}%`}>
      {/* Ciel / fond */}
      <rect width="320" height="240" rx="16" fill="#F5F0E6" />
      <circle cx="270" cy="42" r="18" fill="#D9B382" opacity="0.8" />

      {/* Terrain isométrique */}
      <polygon points="160,150 300,185 160,220 20,185" fill="#D9B382" opacity="0.55" />
      <polygon points="160,146 300,181 160,216 20,181" fill="#E8DCC8" />

      {/* Clôture de chantier */}
      <g stroke="#B87333" strokeWidth="2" opacity="0.7">
        <line x1="24" y1="180" x2="60" y2="171" />
        <line x1="24" y1="174" x2="24" y2="184" />
        <line x1="60" y1="165" x2="60" y2="175" />
      </g>

      {/* ÉTAPE 0 : terrain + piquets d'implantation */}
      {etape === 0 && (
        <g>
          <line x1="120" y1="170" x2="200" y2="190" stroke="#C1502E" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="200" y1="190" x2="160" y2="205" stroke="#C1502E" strokeWidth="1.5" strokeDasharray="4 3" />
          {[[120, 170], [200, 190], [160, 205], [90, 183]].map(([x, y], i) => (
            <g key={i}>
              <line x1={x} y1={y - 12} x2={x} y2={y} stroke="#4A342A" strokeWidth="3" />
              <rect x={x - 4} y={y - 16} width="8" height="5" fill="#C1502E" />
            </g>
          ))}
          <text x="160" y="120" textAnchor="middle" fontSize="11" fill="#8A8680" fontFamily="monospace">implantation…</text>
        </g>
      )}

      {/* ÉTAPE 1 : fondations / semelles */}
      {etape >= 1 && etape < 4 && (
        <g>
          <polygon points="160,168 230,185 160,203 90,185" fill="#8A8680" opacity="0.5" />
          <polygon points="160,164 230,181 160,199 90,181" fill="#A85F4C" opacity={etape === 1 ? 1 : 0.9} />
        </g>
      )}

      {/* ÉTAPE 2 : murs en élévation */}
      {etape >= 2 && (
        <g>
          <polygon points="90,181 90,130 160,147 160,199" fill="#D9B382" />
          <polygon points="230,181 230,130 160,147 160,199" fill="#C9A984" />
          {/* Fenêtres */}
          <polygon points="110,168 110,148 130,153 130,173" fill="#2B2B2E" opacity="0.7" />
          <polygon points="175,153 175,133 200,139 200,159" fill="#2B2B2E" opacity="0.7" />
          {etape === 2 && (
            <>
              {/* Rangée d'agglos en cours */}
              <polygon points="90,130 90,124 160,141 160,147" fill="#E8DCC8" opacity="0.9" />
              <polygon points="230,130 230,124 160,141 160,147" fill="#DBC7A8" opacity="0.9" />
            </>
          )}
        </g>
      )}

      {/* ÉTAPE 3 : toiture */}
      {etape >= 3 && (
        <g>
          <polygon points="85,132 160,102 235,132 160,150" fill="#C1502E" />
          <polygon points="85,132 160,150 160,158 85,140" fill="#A8431F" />
          <polygon points="235,132 160,150 160,158 235,140" fill="#933A1B" />
        </g>
      )}

      {/* ÉTAPE 4 : fini — drapeau, porte, végétation */}
      {etape >= 4 && (
        <g>
          <polygon points="90,181 90,130 160,147 160,199" fill="#E8DCC8" />
          <polygon points="230,181 230,130 160,147 160,199" fill="#D9B382" />
          <polygon points="85,132 160,102 235,132 160,150" fill="#C1502E" />
          <polygon points="85,132 160,150 160,158 85,140" fill="#A8431F" />
          <polygon points="235,132 160,150 160,158 235,140" fill="#933A1B" />
          <polygon points="110,168 110,148 130,153 130,173" fill="#6B7A3F" opacity="0.5" />
          <polygon points="175,153 175,133 200,139 200,159" fill="#6B7A3F" opacity="0.5" />
          <polygon points="140,190 140,165 155,169 155,194" fill="#4A342A" />
          <line x1="160" y1="102" x2="160" y2="82" stroke="#4A342A" strokeWidth="2" />
          <polygon points="160,82 178,86 160,92" fill="#6B7A3F">
            <animateTransform attributeName="transform" type="skewY" values="0;4;0;-3;0" dur="3s" repeatCount="indefinite" />
          </polygon>
          <circle cx="60" cy="196" r="8" fill="#6B7A3F" />
          <rect x="58" y="196" width="4" height="10" fill="#4A342A" />
          <circle cx="262" cy="200" r="6" fill="#6B7A3F" />
        </g>
      )}

      {/* Grue (présente tant que le chantier n'est pas fini) */}
      {etape < 4 && (
        <g className="anim-grue">
          <rect x="250" y="60" width="6" height="122" fill="#B87333" />
          <rect x="196" y="55" width="92" height="6" rx="2" fill="#B87333" />
          <rect x="245" y="46" width="16" height="14" rx="3" fill="#4A342A" />
          <line x1="206" y1="61" x2="206" y2={etape >= 2 ? 110 : 150} stroke="#4A342A" strokeWidth="2" />
          <rect x="199" y={etape >= 2 ? 110 : 150} width="14" height="10" rx="2" fill="#C1502E">
            <animate attributeName="y" values={etape >= 2 ? '110;130;110' : '150;170;150'} dur="6s" repeatCount="indefinite" />
          </rect>
        </g>
      )}

      {/* Ouvriers */}
      <g>
        <circle cx="70" cy="205" r="6" fill="#C1502E" />
        <rect x="65" y="210" width="10" height="11" rx="3" fill="#6B7A3F" />
        {etape >= 1 && etape < 4 && (
          <>
            <circle cx="250" cy="208" r="6" fill="#D9B382" />
            <rect x="245" y="213" width="10" height="11" rx="3" fill="#2B2B2E" />
          </>
        )}
      </g>

      {/* Tas de matériaux (visible pendant les travaux) */}
      {etape >= 1 && etape < 4 && (
        <g>
          <ellipse cx="52" cy="172" rx="16" ry="6" fill="#D9B382" />
          <ellipse cx="52" cy="169" rx="12" ry="5" fill="#C9A984" />
          <rect x="272" y="168" width="22" height="6" rx="1" fill="#A85F4C" />
          <rect x="274" y="162" width="22" height="6" rx="1" fill="#C1502E" />
        </g>
      )}

      {/* Panneau de chantier */}
      <g>
        <rect x="28" y="128" width="34" height="22" rx="3" fill="#F5F0E6" stroke="#B87333" strokeWidth="1.5" />
        <line x1="45" y1="150" x2="45" y2="164" stroke="#4A342A" strokeWidth="3" />
        <text x="45" y="142" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#C1502E" fontFamily="monospace">
          {pct}%
        </text>
      </g>
    </svg>
  );
}
