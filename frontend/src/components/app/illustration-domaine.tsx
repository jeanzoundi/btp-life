'use client';

// Vignettes SVG par domaine de l'académie — style plan technique, palette du brief.

export function IllustrationDomaine({ domaine, taille = 56 }: { domaine: string; taille?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={taille} height={taille} className="shrink-0 rounded-2xl" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#E8DCC8" />
      {domaine === 'general' && (
        <g>
          {/* Immeuble en élévation */}
          <rect x="18" y="26" width="28" height="26" fill="#D9B382" />
          <rect x="22" y="30" width="6" height="5" fill="#2B2B2E" opacity="0.7" />
          <rect x="32" y="30" width="6" height="5" fill="#2B2B2E" opacity="0.7" />
          <rect x="22" y="39" width="6" height="5" fill="#2B2B2E" opacity="0.7" />
          <rect x="32" y="39" width="6" height="5" fill="#2B2B2E" opacity="0.7" />
          <rect x="14" y="52" width="36" height="4" rx="2" fill="#8A8680" />
          <line x1="46" y1="20" x2="46" y2="52" stroke="#B87333" strokeWidth="3" />
          <line x1="30" y1="18" x2="56" y2="18" stroke="#B87333" strokeWidth="3" />
          <line x1="52" y1="20" x2="52" y2="28" stroke="#4A342A" strokeWidth="1.5" />
        </g>
      )}
      {domaine === 'hse' && (
        <g>
          {/* Casque + triangle sécurité */}
          <path d="M16 40 Q16 24 32 24 Q48 24 48 40 L48 42 L16 42 Z" fill="#C1502E" />
          <rect x="12" y="41" width="40" height="5" rx="2.5" fill="#C1502E" />
          <rect x="29" y="26" width="6" height="15" fill="rgba(43,43,46,0.15)" />
          <path d="M44 14 L52 28 L36 28 Z" fill="#D9B382" stroke="#4A342A" strokeWidth="1.5" />
          <text x="44" y="26" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2B2B2E">!</text>
        </g>
      )}
      {domaine === 'technique' && (
        <g>
          {/* Plan + équerre + compas */}
          <rect x="12" y="14" width="32" height="38" rx="2" fill="#F5F0E6" stroke="#B87333" strokeWidth="1.5" />
          <line x1="17" y1="22" x2="39" y2="22" stroke="#8A8680" strokeWidth="1.5" />
          <line x1="17" y1="28" x2="33" y2="28" stroke="#8A8680" strokeWidth="1.5" />
          <rect x="19" y="34" width="12" height="10" fill="none" stroke="#C1502E" strokeWidth="1.5" />
          <circle cx="25" cy="39" r="2" fill="#C1502E" />
          <path d="M40 30 L54 52 L40 52 Z" fill="#D9B382" opacity="0.9" stroke="#4A342A" strokeWidth="1.2" />
        </g>
      )}
      {domaine === 'gestion' && (
        <g>
          {/* Gantt + pièce */}
          <rect x="12" y="16" width="40" height="34" rx="3" fill="#F5F0E6" stroke="#B87333" strokeWidth="1.5" />
          <rect x="16" y="22" width="18" height="5" rx="2.5" fill="#C1502E" />
          <rect x="22" y="30" width="20" height="5" rx="2.5" fill="#6B7A3F" />
          <rect x="30" y="38" width="16" height="5" rx="2.5" fill="#B87333" />
          <circle cx="48" cy="48" r="9" fill="#D9B382" stroke="#B87333" strokeWidth="1.5" />
          <text x="48" y="52" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#4A342A">F</text>
        </g>
      )}
      {domaine === 'logiciel' && (
        <g>
          {/* Écran avec courbe + plan */}
          <rect x="12" y="16" width="40" height="28" rx="3" fill="#2B2B2E" />
          <polyline points="17,38 25,30 32,34 40,24 47,28" fill="none" stroke="#6B7A3F" strokeWidth="2" strokeLinecap="round" />
          <rect x="17" y="20" width="10" height="6" rx="1" fill="#C1502E" opacity="0.85" />
          <rect x="26" y="46" width="12" height="3" rx="1.5" fill="#8A8680" />
          <rect x="20" y="49" width="24" height="3" rx="1.5" fill="#8A8680" />
        </g>
      )}
      {domaine === 'management' && (
        <g>
          {/* Trois personnages, chef au centre */}
          <circle cx="20" cy="30" r="6" fill="#D9B382" />
          <rect x="14" y="36" width="12" height="12" rx="4" fill="#6B7A3F" />
          <circle cx="44" cy="30" r="6" fill="#C9A984" />
          <rect x="38" y="36" width="12" height="12" rx="4" fill="#4A342A" />
          <circle cx="32" cy="24" r="7" fill="#C68642" />
          <path d="M24 22 Q24 14 32 14 Q40 14 40 22 L40 23 L24 23 Z" fill="#C1502E" />
          <rect x="25" y="31" width="14" height="15" rx="4" fill="#B87333" />
        </g>
      )}
      {!['general', 'hse', 'technique', 'gestion', 'logiciel', 'management'].includes(domaine) && (
        <text x="32" y="40" textAnchor="middle" fontSize="24">📚</text>
      )}
    </svg>
  );
}
