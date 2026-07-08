// Illustration SVG animée : immeuble en élévation + grue — 100 % CSS, palette du brief.
export function ChantierAnime() {
  return (
    <svg viewBox="0 0 420 340" className="h-auto w-full max-w-md" aria-hidden="true">
      {/* Sol */}
      <rect x="0" y="310" width="420" height="8" rx="4" fill="#8A8680" opacity="0.35" />

      {/* Grue */}
      <g className="anim-grue">
        <rect x="330" y="80" width="10" height="230" fill="#B87333" />
        <rect x="240" y="72" width="150" height="10" rx="3" fill="#B87333" />
        <rect x="322" y="60" width="26" height="26" rx="4" fill="#4A342A" />
        <line x1="256" y1="82" x2="256" y2="150" stroke="#4A342A" strokeWidth="3" />
        <rect x="246" y="150" width="20" height="16" rx="2" fill="#C1502E">
          <animate attributeName="y" values="150;190;150" dur="7s" repeatCount="indefinite" />
        </rect>
        <line x1="335" y1="90" x2="250" y2="76" stroke="#4A342A" strokeWidth="2" opacity="0.6" />
      </g>

      {/* Immeuble : les étages montent un à un */}
      <g>
        <rect className="anim-etage delai-1" x="60" y="270" width="180" height="40" fill="#D9B382" />
        <rect className="anim-etage delai-2" x="60" y="228" width="180" height="40" fill="#E8DCC8" />
        <rect className="anim-etage delai-3" x="60" y="186" width="180" height="40" fill="#D9B382" />
        <rect className="anim-etage delai-4" x="60" y="144" width="180" height="40" fill="#E8DCC8" />
        <rect className="anim-etage delai-5" x="60" y="102" width="180" height="40" fill="#C1502E" opacity="0.9" />
        {/* Fenêtres */}
        {[0, 1, 2, 3].map((etage) => (
          <g key={etage} className={`anim-etage delai-${etage + 2}`}>
            {[0, 1, 2, 3].map((col) => (
              <rect key={col} x={76 + col * 42} y={278 - etage * 42} width="22" height="18" rx="2" fill="#2B2B2E" opacity="0.75" />
            ))}
          </g>
        ))}
        {/* Ferraillage au sommet */}
        <g className="anim-etage delai-6">
          <line x1="80" y1="102" x2="80" y2="84" stroke="#4A342A" strokeWidth="3" />
          <line x1="120" y1="102" x2="120" y2="78" stroke="#4A342A" strokeWidth="3" />
          <line x1="160" y1="102" x2="160" y2="86" stroke="#4A342A" strokeWidth="3" />
        </g>
      </g>

      {/* Personnages stylisés */}
      <g className="anim-float">
        <circle cx="285" cy="288" r="9" fill="#C1502E" />
        <rect x="278" y="296" width="14" height="16" rx="4" fill="#6B7A3F" />
      </g>
      <g className="anim-float" style={{ animationDelay: '1.2s' }}>
        <circle cx="38" cy="292" r="9" fill="#B87333" />
        <rect x="31" y="300" width="14" height="14" rx="4" fill="#2B2B2E" />
      </g>

      {/* Cotes façon plan technique */}
      <g stroke="#8A8680" strokeWidth="1" opacity="0.6">
        <line x1="48" y1="102" x2="48" y2="310" />
        <line x1="44" y1="102" x2="52" y2="102" />
        <line x1="44" y1="310" x2="52" y2="310" />
      </g>
      <text x="26" y="210" fontSize="11" fill="#8A8680" fontFamily="monospace" transform="rotate(-90 26 210)">
        R+4 · 15,20 m
      </text>
    </svg>
  );
}
