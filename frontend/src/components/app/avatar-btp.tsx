'use client';

// Avatar BTP vectoriel — personnalisation profonde façon RPG (12 catégories),
// rétro-compatible avec les configs v1 (accessoire → pilosité/lunettes).

export interface AvatarConfig {
  peau: string;
  casqueStyle: 'standard' | 'visiere' | 'aucun';
  casque: string;
  cheveux: 'court' | 'afro' | 'tresses' | 'chauve';
  couleurCheveux: string;
  yeux: string;
  expression: 'sourire' | 'grand-sourire' | 'neutre' | 'determine';
  pilosite: 'aucune' | 'moustache' | 'barbe' | 'bouc';
  lunettes: 'aucune' | 'securite' | 'soleil';
  typeTenue: 'gilet' | 'bleu' | 'chemise';
  couleurTenue: string;
  outil: 'aucun' | 'marteau' | 'cle' | 'metre' | 'tablette' | 'plan';
  ecusson: 'aucun' | 'etoile' | 'eclair' | 'truelle' | 'grue';
  fond: string;
  cadre: 'aucun' | 'bronze' | 'argent' | 'or';
}

export const OPTIONS_AVATAR = {
  peau: ['#8D5524', '#A9713C', '#C68642', '#E0AC69', '#F1C27D'],
  casqueStyle: ['standard', 'visiere', 'aucun'] as const,
  casque: ['#F5F0E6', '#C1502E', '#D9B382', '#6B7A3F', '#B87333', '#2B2B2E'],
  cheveux: ['court', 'afro', 'tresses', 'chauve'] as const,
  couleurCheveux: ['#2B2B2E', '#4A342A', '#8A8680', '#A85F4C'],
  yeux: ['#2B2B2E', '#4A342A', '#6B7A3F', '#8A8680'],
  expression: ['sourire', 'grand-sourire', 'neutre', 'determine'] as const,
  pilosite: ['aucune', 'moustache', 'barbe', 'bouc'] as const,
  lunettes: ['aucune', 'securite', 'soleil'] as const,
  typeTenue: ['gilet', 'bleu', 'chemise'] as const,
  couleurTenue: ['#C1502E', '#6B7A3F', '#B87333', '#2B2B2E', '#A85F4C', '#4A342A'],
  outil: ['aucun', 'marteau', 'cle', 'metre', 'tablette', 'plan'] as const,
  ecusson: ['aucun', 'etoile', 'eclair', 'truelle', 'grue'] as const,
  fond: ['#E8DCC8', '#D9B382', '#F5F0E6', '#C1502E', '#6B7A3F', '#2B2B2E'],
  cadre: ['aucun', 'bronze', 'argent', 'or'] as const,
};

export const AVATAR_DEFAUT: AvatarConfig = {
  peau: '#C68642',
  casqueStyle: 'standard',
  casque: '#F5F0E6',
  cheveux: 'court',
  couleurCheveux: '#2B2B2E',
  yeux: '#2B2B2E',
  expression: 'sourire',
  pilosite: 'aucune',
  lunettes: 'aucune',
  typeTenue: 'gilet',
  couleurTenue: '#6B7A3F',
  outil: 'aucun',
  ecusson: 'aucun',
  fond: '#E8DCC8',
  cadre: 'aucun',
};

export const PRESETS_AVATAR: Array<{ nom: string; config: AvatarConfig }> = [
  {
    nom: 'Chef de chantier',
    config: { ...AVATAR_DEFAUT, casque: '#F5F0E6', typeTenue: 'gilet', couleurTenue: '#C1502E', outil: 'plan', ecusson: 'grue', expression: 'determine', pilosite: 'barbe' },
  },
  {
    nom: 'Ingénieur·e BE',
    config: { ...AVATAR_DEFAUT, casqueStyle: 'aucun', cheveux: 'tresses', typeTenue: 'chemise', couleurTenue: '#2B2B2E', outil: 'tablette', lunettes: 'securite', fond: '#F5F0E6' },
  },
  {
    nom: 'Topographe',
    config: { ...AVATAR_DEFAUT, casque: '#D9B382', typeTenue: 'bleu', couleurTenue: '#4A342A', outil: 'metre', lunettes: 'soleil', fond: '#D9B382' },
  },
  {
    nom: 'Ouvrier qualifié',
    config: { ...AVATAR_DEFAUT, casque: '#6B7A3F', typeTenue: 'bleu', couleurTenue: '#2B2B2E', outil: 'marteau', expression: 'grand-sourire', ecusson: 'truelle' },
  },
];

export function avatarAleatoire(): AvatarConfig {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return {
    peau: pick(OPTIONS_AVATAR.peau),
    casqueStyle: pick(OPTIONS_AVATAR.casqueStyle),
    casque: pick(OPTIONS_AVATAR.casque),
    cheveux: pick(OPTIONS_AVATAR.cheveux),
    couleurCheveux: pick(OPTIONS_AVATAR.couleurCheveux),
    yeux: pick(OPTIONS_AVATAR.yeux),
    expression: pick(OPTIONS_AVATAR.expression),
    pilosite: pick(OPTIONS_AVATAR.pilosite),
    lunettes: pick(OPTIONS_AVATAR.lunettes),
    typeTenue: pick(OPTIONS_AVATAR.typeTenue),
    couleurTenue: pick(OPTIONS_AVATAR.couleurTenue),
    outil: pick(OPTIONS_AVATAR.outil),
    ecusson: pick(OPTIONS_AVATAR.ecusson),
    fond: pick(OPTIONS_AVATAR.fond),
    cadre: 'aucun',
  };
}

export function configDepuis(config: unknown): AvatarConfig {
  if (!config || typeof config !== 'object') return AVATAR_DEFAUT;
  const c = config as Partial<AvatarConfig> & { accessoire?: string };
  return {
    ...AVATAR_DEFAUT,
    ...Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined && v !== null)),
    // Rétro-compat v1 : "accessoire" unique → champs dédiés
    ...(c.accessoire === 'lunettes' && !c.lunettes ? { lunettes: 'securite' as const } : {}),
    ...(c.accessoire === 'barbe' && !c.pilosite ? { pilosite: 'barbe' as const } : {}),
    ...(c.accessoire === 'moustache' && !c.pilosite ? { pilosite: 'moustache' as const } : {}),
  };
}

const CADRES: Record<Exclude<AvatarConfig['cadre'], 'aucun'>, { couleur: string; brillance: string }> = {
  bronze: { couleur: '#B87333', brillance: '#D9B382' },
  argent: { couleur: '#8A8680', brillance: '#E8DCC8' },
  or: { couleur: '#C9A227', brillance: '#F1C27D' },
};

export function AvatarBtp({ config, taille = 96, className = '' }: { config?: unknown; taille?: number; className?: string }) {
  const c = configDepuis(config);
  const fondSombre = ['#2B2B2E', '#6B7A3F', '#C1502E'].includes(c.fond);
  const cadre = c.cadre !== 'aucun' ? CADRES[c.cadre] : null;
  const sansCasque = c.casqueStyle === 'aucun';

  return (
    <svg viewBox="0 0 120 120" width={taille} height={taille} className={`rounded-2xl ${className}`} aria-label="Avatar">
      <rect width="120" height="120" fill={c.fond} />
      <circle cx="60" cy="130" r="52" fill={fondSombre ? 'rgba(245,240,230,0.12)' : 'rgba(43,43,46,0.06)'} />

      {/* ── Corps / tenue ── */}
      <path d="M28 120 L28 96 Q28 82 44 80 L76 80 Q92 82 92 96 L92 120 Z" fill={c.couleurTenue} />
      {c.typeTenue === 'gilet' && (
        <>
          <rect x="40" y="82" width="7" height="38" fill="#D9B382" />
          <rect x="73" y="82" width="7" height="38" fill="#D9B382" />
          <rect x="28" y="100" width="64" height="6" fill="#D9B382" opacity="0.85" />
        </>
      )}
      {c.typeTenue === 'chemise' && (
        <>
          <path d="M52 80 L60 92 L68 80 Z" fill="#F5F0E6" />
          <path d="M52 80 L48 88 L56 86 Z" fill="#E8DCC8" />
          <path d="M68 80 L72 88 L64 86 Z" fill="#E8DCC8" />
          <circle cx="60" cy="100" r="1.8" fill="#F5F0E6" />
          <circle cx="60" cy="110" r="1.8" fill="#F5F0E6" />
        </>
      )}
      {c.typeTenue === 'bleu' && (
        <>
          <rect x="50" y="94" width="20" height="14" rx="2" fill="rgba(245,240,230,0.25)" />
          <rect x="42" y="80" width="6" height="14" fill="rgba(43,43,46,0.25)" />
          <rect x="72" y="80" width="6" height="14" fill="rgba(43,43,46,0.25)" />
        </>
      )}

      {/* Écusson de poitrine */}
      {c.ecusson !== 'aucun' && (
        <g transform="translate(38, 90)">
          <circle r="7" fill="#F5F0E6" stroke="#B87333" strokeWidth="1.5" />
          {c.ecusson === 'etoile' && (
            <path d="M0,-4 L1.2,-1.2 L4,-1.2 L1.8,0.8 L2.6,3.8 L0,2 L-2.6,3.8 L-1.8,0.8 L-4,-1.2 L-1.2,-1.2 Z" fill="#C1502E" />
          )}
          {c.ecusson === 'eclair' && <path d="M1,-4 L-2.5,0.5 L-0.5,0.5 L-1,4 L2.5,-0.5 L0.5,-0.5 Z" fill="#B87333" />}
          {c.ecusson === 'truelle' && (
            <g>
              <path d="M-3,-2 L3,-2 L0,3 Z" fill="#6B7A3F" />
              <rect x="-0.7" y="-4.5" width="1.4" height="2.8" fill="#4A342A" />
            </g>
          )}
          {c.ecusson === 'grue' && (
            <g stroke="#2B2B2E" strokeWidth="1.2" fill="none">
              <line x1="-1" y1="4" x2="-1" y2="-3" />
              <line x1="-4" y1="-3" x2="4" y2="-3" />
              <line x1="3" y1="-3" x2="3" y2="0" />
            </g>
          )}
        </g>
      )}

      {/* ── Bras + outil ── */}
      {c.outil !== 'aucun' && (
        <g>
          <path d="M88 92 Q100 88 102 78" stroke={c.couleurTenue} strokeWidth="9" fill="none" strokeLinecap="round" />
          <circle cx="103" cy="76" r="5.5" fill={c.peau} />
          {c.outil === 'marteau' && (
            <g transform="translate(103, 68)">
              <rect x="-1.5" y="-14" width="3" height="16" rx="1" fill="#4A342A" />
              <rect x="-8" y="-18" width="16" height="6" rx="2" fill="#8A8680" />
            </g>
          )}
          {c.outil === 'cle' && (
            <g transform="translate(103, 66) rotate(20)">
              <rect x="-1.5" y="-12" width="3" height="15" rx="1.5" fill="#8A8680" />
              <circle cx="0" cy="-13" r="4.5" fill="none" stroke="#8A8680" strokeWidth="3" />
            </g>
          )}
          {c.outil === 'metre' && (
            <g transform="translate(103, 70)">
              <rect x="-5" y="-9" width="10" height="9" rx="2" fill="#D9B382" stroke="#B87333" strokeWidth="1" />
              <rect x="-1" y="0" width="2" height="6" fill="#E8DCC8" />
            </g>
          )}
          {c.outil === 'tablette' && (
            <g transform="translate(104, 66) rotate(-8)">
              <rect x="-6" y="-9" width="12" height="16" rx="2" fill="#2B2B2E" />
              <rect x="-4.5" y="-7" width="9" height="11" rx="1" fill="#6B7A3F" opacity="0.7" />
            </g>
          )}
          {c.outil === 'plan' && (
            <g transform="translate(103, 66) rotate(25)">
              <rect x="-2.5" y="-13" width="5" height="17" rx="2.5" fill="#F5F0E6" stroke="#B87333" strokeWidth="1" />
              <line x1="-2.5" y1="-8" x2="2.5" y2="-8" stroke="#B87333" strokeWidth="0.8" />
              <line x1="-2.5" y1="-3" x2="2.5" y2="-3" stroke="#B87333" strokeWidth="0.8" />
            </g>
          )}
        </g>
      )}

      {/* ── Cou et tête ── */}
      <rect x="52" y="68" width="16" height="14" rx="6" fill={c.peau} />
      <circle cx="60" cy="50" r="24" fill={c.peau} />
      <circle cx="36" cy="52" r="5" fill={c.peau} />
      <circle cx="84" cy="52" r="5" fill={c.peau} />

      {/* ── Cheveux (si pas de casque) ── */}
      {sansCasque && c.cheveux !== 'chauve' && (
        <>
          {c.cheveux === 'court' && <path d="M36 46 Q36 26 60 26 Q84 26 84 46 Q84 38 74 36 Q62 33 48 37 Q38 40 36 46 Z" fill={c.couleurCheveux} />}
          {c.cheveux === 'afro' && (
            <g fill={c.couleurCheveux}>
              <circle cx="60" cy="32" r="16" />
              <circle cx="44" cy="38" r="10" />
              <circle cx="76" cy="38" r="10" />
              <circle cx="38" cy="48" r="7" />
              <circle cx="82" cy="48" r="7" />
            </g>
          )}
          {c.cheveux === 'tresses' && (
            <g fill={c.couleurCheveux}>
              <path d="M36 46 Q36 26 60 26 Q84 26 84 46 Q84 38 74 36 Q62 33 48 37 Q38 40 36 46 Z" />
              {[40, 48, 56, 64, 72, 80].map((x) => (
                <rect key={x} x={x - 1.6} y="28" width="3.2" height="12" rx="1.6" transform={`rotate(${(x - 60) * 0.8} ${x} 34)`} />
              ))}
              <circle cx="38" cy="58" r="3" />
              <circle cx="82" cy="58" r="3" />
              <rect x="35" y="46" width="6" height="14" rx="3" />
              <rect x="79" y="46" width="6" height="14" rx="3" />
            </g>
          )}
        </>
      )}

      {/* ── Casque ── */}
      {!sansCasque && (
        <>
          <path d="M34 46 Q34 22 60 22 Q86 22 86 46 L86 48 L34 48 Z" fill={c.casque} />
          <rect x="30" y="45" width="60" height="6" rx="3" fill={c.casque} />
          <rect x="56" y="24" width="8" height="22" fill="rgba(43,43,46,0.12)" />
          {c.casqueStyle === 'visiere' && (
            <path d="M34 51 Q60 60 86 51 L86 55 Q60 65 34 55 Z" fill="#2B2B2E" opacity="0.35" />
          )}
        </>
      )}

      {/* ── Yeux ── */}
      <circle cx="51" cy="54" r="3" fill={c.yeux} />
      <circle cx="69" cy="54" r="3" fill={c.yeux} />
      <circle cx="52" cy="53" r="1" fill="#F5F0E6" />
      <circle cx="70" cy="53" r="1" fill="#F5F0E6" />
      {c.expression === 'determine' && (
        <g stroke="#2B2B2E" strokeWidth="2" strokeLinecap="round">
          <line x1="46" y1="47" x2="55" y2="49.5" />
          <line x1="74" y1="47" x2="65" y2="49.5" />
        </g>
      )}

      {/* ── Lunettes ── */}
      {c.lunettes === 'securite' && (
        <g stroke="#2B2B2E" strokeWidth="2.5" fill="none">
          <circle cx="51" cy="54" r="7" />
          <circle cx="69" cy="54" r="7" />
          <line x1="58" y1="54" x2="62" y2="54" />
          <line x1="44" y1="52" x2="38" y2="50" />
          <line x1="76" y1="52" x2="82" y2="50" />
        </g>
      )}
      {c.lunettes === 'soleil' && (
        <g>
          <rect x="43" y="49" width="15" height="10" rx="4" fill="#2B2B2E" />
          <rect x="62" y="49" width="15" height="10" rx="4" fill="#2B2B2E" />
          <line x1="58" y1="53" x2="62" y2="53" stroke="#2B2B2E" strokeWidth="2.5" />
          <line x1="43" y1="52" x2="37" y2="50" stroke="#2B2B2E" strokeWidth="2.5" />
          <line x1="77" y1="52" x2="83" y2="50" stroke="#2B2B2E" strokeWidth="2.5" />
        </g>
      )}

      {/* ── Pilosité ── */}
      {c.pilosite === 'barbe' && <path d="M44 58 Q44 76 60 76 Q76 76 76 58 Q76 70 60 70 Q44 70 44 58 Z" fill={sansCasque ? c.couleurCheveux : '#2B2B2E'} opacity="0.85" />}
      {c.pilosite === 'moustache' && <path d="M50 63 Q55 60 60 63 Q65 60 70 63 Q65 67 60 64.5 Q55 67 50 63 Z" fill={sansCasque ? c.couleurCheveux : '#2B2B2E'} opacity="0.85" />}
      {c.pilosite === 'bouc' && (
        <g fill={sansCasque ? c.couleurCheveux : '#2B2B2E'} opacity="0.85">
          <path d="M50 63 Q55 60 60 63 Q65 60 70 63 Q65 67 60 64.5 Q55 67 50 63 Z" />
          <path d="M54 68 Q60 66 66 68 Q66 74 60 74 Q54 74 54 68 Z" />
        </g>
      )}

      {/* ── Bouche ── */}
      {c.expression === 'sourire' && <path d="M53 63 Q60 68 67 63" stroke="#2B2B2E" strokeWidth="2" fill="none" strokeLinecap="round" />}
      {c.expression === 'grand-sourire' && <path d="M51 61 Q60 72 69 61 Q60 66 51 61 Z" fill="#2B2B2E" />}
      {c.expression === 'neutre' && <line x1="54" y1="64" x2="66" y2="64" stroke="#2B2B2E" strokeWidth="2" strokeLinecap="round" />}
      {c.expression === 'determine' && <path d="M54 65 Q60 62.5 66 65" stroke="#2B2B2E" strokeWidth="2" fill="none" strokeLinecap="round" />}

      {/* ── Cadre de rareté ── */}
      {cadre && (
        <>
          <rect x="2" y="2" width="116" height="116" rx="14" fill="none" stroke={cadre.couleur} strokeWidth="5" />
          <rect x="5" y="5" width="110" height="110" rx="11" fill="none" stroke={cadre.brillance} strokeWidth="1.2" opacity="0.7" />
          {[[12, 12], [108, 12], [12, 108], [108, 108]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill={cadre.brillance} />
          ))}
        </>
      )}
    </svg>
  );
}
