'use client';

// Schémas techniques pédagogiques dessinés en SVG — style plan d'exécution,
// cotations comprises. Utilisés dans les cours via les blocs { type: 'schema' }.

function Cartouche({ titre }: { titre: string }) {
  return (
    <text x="200" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#2B2B2E" fontFamily="monospace">
      {titre}
    </text>
  );
}

export function SchemaTechnique({ nom }: { nom: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-pierre bg-white p-2">
      {nom === 'semelle' && (
        <svg viewBox="0 0 400 230" className="h-auto w-full">
          <Cartouche titre="COUPE — SEMELLE FILANTE SOUS MUR" />
          {/* Terrain */}
          <rect x="20" y="120" width="360" height="90" fill="#D9B382" opacity="0.35" />
          <line x1="20" y1="120" x2="380" y2="120" stroke="#8A8680" strokeWidth="1.5" />
          {/* hachures terrain */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={30 + i * 30} y1="120" x2={20 + i * 30} y2="132" stroke="#8A8680" strokeWidth="1" opacity="0.6" />
          ))}
          {/* Béton de propreté */}
          <rect x="130" y="185" width="140" height="10" fill="#E8DCC8" stroke="#8A8680" strokeWidth="1" />
          {/* Semelle */}
          <rect x="140" y="155" width="120" height="30" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          {/* Aciers de semelle */}
          {[155, 180, 205, 230].map((x) => (
            <circle key={x} cx={x + 5} cy="176" r="3" fill="none" stroke="#C1502E" strokeWidth="2" />
          ))}
          <line x1="152" y1="165" x2="248" y2="165" stroke="#C1502E" strokeWidth="2" />
          {/* Mur */}
          <rect x="180" y="55" width="40" height="100" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1.5" />
          <line x1="180" y1="80" x2="220" y2="80" stroke="#8A8680" strokeWidth="0.8" />
          <line x1="180" y1="105" x2="220" y2="105" stroke="#8A8680" strokeWidth="0.8" />
          <line x1="180" y1="130" x2="220" y2="130" stroke="#8A8680" strokeWidth="0.8" />
          {/* Cotes */}
          <g stroke="#B87333" strokeWidth="1" fill="#B87333">
            <line x1="140" y1="215" x2="260" y2="215" />
            <line x1="140" y1="210" x2="140" y2="220" />
            <line x1="260" y1="210" x2="260" y2="220" />
            <text x="200" y="228" textAnchor="middle" fontSize="10" fontFamily="monospace">largeur 50-60 cm</text>
            <line x1="285" y1="155" x2="285" y2="185" />
            <line x1="280" y1="155" x2="290" y2="155" />
            <line x1="280" y1="185" x2="290" y2="185" />
            <text x="296" y="173" fontSize="10" fontFamily="monospace">h 30</text>
          </g>
          <text x="52" y="150" fontSize="9" fill="#8A8680" fontFamily="monospace">fond de fouille</text>
          <text x="130" y="205" fontSize="9" fill="#8A8680" fontFamily="monospace">béton de propreté 5 cm</text>
          <text x="228" y="70" fontSize="9" fill="#8A8680" fontFamily="monospace">mur</text>
          <text x="264" y="150" fontSize="9" fill="#C1502E" fontFamily="monospace">aciers</text>
        </svg>
      )}

      {nom === 'poutre-flexion' && (
        <svg viewBox="0 0 400 220" className="h-auto w-full">
          <Cartouche titre="POUTRE EN FLEXION — OÙ PLACER LES ACIERS ?" />
          {/* Appuis */}
          <polygon points="60,140 75,160 45,160" fill="#8A8680" />
          <polygon points="340,140 355,160 325,160" fill="#8A8680" />
          {/* Poutre fléchie (exagérée) */}
          <path d="M45 125 Q200 150 355 125 L355 140 Q200 165 45 140 Z" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1.5" />
          {/* Charge */}
          {[120, 160, 200, 240, 280].map((x) => (
            <g key={x} stroke="#6B7A3F" strokeWidth="2">
              <line x1={x} y1="85" x2={x} y2={108 + (x - 200) * (x - 200) * 0.0004} />
              <polygon points={`${x - 4},${104 + (x - 200) * (x - 200) * 0.0004} ${x + 4},${104 + (x - 200) * (x - 200) * 0.0004} ${x},${112 + (x - 200) * (x - 200) * 0.0004}`} fill="#6B7A3F" />
            </g>
          ))}
          <text x="200" y="78" textAnchor="middle" fontSize="10" fill="#6B7A3F" fontFamily="monospace">charges ↓</text>
          {/* Zone comprimée / tendue */}
          <text x="200" y="138" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">— COMPRESSION (le béton travaille) —</text>
          <path d="M60 152 Q200 176 340 152" fill="none" stroke="#C1502E" strokeWidth="3" strokeDasharray="none" />
          <text x="200" y="192" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#C1502E" fontFamily="monospace">TRACTION → aciers principaux EN BAS</text>
          <text x="200" y="210" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">(balcon/console : c'est l'inverse — aciers en haut !)</text>
        </svg>
      )}

      {nom === 'cone-abrams' && (
        <svg viewBox="0 0 400 230" className="h-auto w-full">
          <Cartouche titre="SLUMP TEST — CÔNE D'ABRAMS" />
          {/* Étape 1 : cône rempli */}
          <g>
            <polygon points="60,60 120,60 105,170 75,170" fill="none" stroke="#2B2B2E" strokeWidth="2" transform="scale(1,-1) translate(0,-230)" />
            <polygon points="75,60 105,60 120,170 60,170" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="2" />
            <rect x="40" y="170" width="100" height="6" fill="#8A8680" />
            <text x="90" y="195" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">1. remplir en 3 couches</text>
            <text x="90" y="207" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">piquées 25 coups</text>
          </g>
          {/* Flèche */}
          <g stroke="#B87333" strokeWidth="2" fill="#B87333">
            <line x1="155" y1="115" x2="185" y2="115" />
            <polygon points="185,110 195,115 185,120" />
          </g>
          {/* Étape 2 : affaissement */}
          <g>
            <path d="M225 170 Q235 120 250 105 Q270 92 290 105 Q305 120 315 170 Z" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="2" />
            <rect x="210" y="170" width="120" height="6" fill="#8A8680" />
            {/* Cône vide à côté */}
            <polygon points="335,95 365,95 375,170 325,170" fill="none" stroke="#8A8680" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* Cote affaissement */}
            <g stroke="#C1502E" strokeWidth="1.5" fill="#C1502E">
              <line x1="255" y1="95" x2="255" y2="103" strokeDasharray="2 2" />
              <line x1="240" y1="95" x2="270" y2="95" strokeDasharray="2 2" stroke="#8A8680" />
              <text x="262" y="90" fontSize="10" fontWeight="bold" fontFamily="monospace">affaissement</text>
            </g>
            <text x="270" y="195" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">2. soulever, mesurer</text>
            <text x="270" y="207" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">5-9 cm = plastique OK</text>
          </g>
        </svg>
      )}

      {nom === 'enrobage' && (
        <svg viewBox="0 0 400 210" className="h-auto w-full">
          <Cartouche titre="ENROBAGE DES ACIERS — COUPE DE POTEAU" />
          {/* Coffrage */}
          <rect x="130" y="45" width="140" height="140" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="2" />
          {/* Cadres */}
          <rect x="155" y="70" width="90" height="90" rx="6" fill="none" stroke="#C1502E" strokeWidth="2.5" />
          {/* Aciers longitudinaux */}
          {[[162, 77], [238, 77], [162, 153], [238, 153]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#C1502E" />
          ))}
          {/* Cale */}
          <rect x="132" y="108" width="21" height="10" rx="2" fill="#6B7A3F" />
          <text x="94" y="116" fontSize="9" fill="#6B7A3F" fontFamily="monospace" textAnchor="end">cale</text>
          {/* Cote enrobage */}
          <g stroke="#B87333" strokeWidth="1.5" fill="#B87333">
            <line x1="130" y1="200" x2="155" y2="200" />
            <line x1="130" y1="195" x2="130" y2="205" />
            <line x1="155" y1="195" x2="155" y2="205" />
          </g>
          <text x="200" y="203" fontSize="10" fontWeight="bold" fill="#B87333" fontFamily="monospace">enrobage ≥ 3 cm (5 cm bord de mer)</text>
          <text x="290" y="60" fontSize="9" fill="#8A8680" fontFamily="monospace">coffrage</text>
          <text x="200" y="40" textAnchor="middle" fontSize="9" fill="#C1502E" fontFamily="monospace">sans enrobage : rouille → éclatement du béton</text>
        </svg>
      )}

      {nom === 'triangle-345' && (
        <svg viewBox="0 0 400 230" className="h-auto w-full">
          <Cartouche titre="VÉRIFIER UN ANGLE DROIT — MÉTHODE 3-4-5" />
          {/* Triangle */}
          <polygon points="80,190 320,190 80,40" fill="#D9B382" opacity="0.25" stroke="none" />
          <line x1="80" y1="190" x2="320" y2="190" stroke="#2B2B2E" strokeWidth="2.5" />
          <line x1="80" y1="190" x2="80" y2="40" stroke="#2B2B2E" strokeWidth="2.5" />
          <line x1="80" y1="40" x2="320" y2="190" stroke="#C1502E" strokeWidth="2.5" strokeDasharray="7 4" />
          {/* Angle droit */}
          <rect x="80" y="170" width="20" height="20" fill="none" stroke="#6B7A3F" strokeWidth="2" />
          {/* Piquets */}
          {[[80, 190], [320, 190], [80, 40]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#4A342A" />
          ))}
          {/* Cotes */}
          <text x="200" y="208" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2B2B2E" fontFamily="monospace">4,00 m</text>
          <text x="62" y="120" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2B2B2E" fontFamily="monospace" transform="rotate(-90 62 120)">3,00 m</text>
          <text x="215" y="105" fontSize="12" fontWeight="bold" fill="#C1502E" fontFamily="monospace" transform="rotate(32 215 105)">diagonale = 5,00 m</text>
          <text x="200" y="225" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">3² + 4² = 5² → si la diagonale fait 5,00 m, l'angle est droit</text>
        </svg>
      )}

      {nom === 'phases-du-sol' && (
        <svg viewBox="0 0 400 220" className="h-auto w-full">
          <Cartouche titre="LES TROIS PHASES DU SOL — DIAGRAMME POIDS-VOLUME" />
          {/* Colonne volumes */}
          <rect x="70" y="35" width="90" height="35" fill="#DCE5DC" stroke="#2B2B2E" strokeWidth="1.5" />
          <rect x="70" y="70" width="90" height="45" fill="#B8C4C9" stroke="#2B2B2E" strokeWidth="1.5" />
          <rect x="70" y="115" width="90" height="70" fill="#C9A984" stroke="#2B2B2E" strokeWidth="1.5" />
          <text x="115" y="56" textAnchor="middle" fontSize="10" fontFamily="monospace">Air — Va</text>
          <text x="115" y="96" textAnchor="middle" fontSize="10" fontFamily="monospace">Eau — Vw</text>
          <text x="115" y="153" textAnchor="middle" fontSize="10" fontFamily="monospace">Grains — Vs</text>
          <text x="115" y="200" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">Volumes (V)</text>
          {/* accolade vides */}
          <path d="M55 35 Q45 52 55 70" fill="none" stroke="#B87333" strokeWidth="1.5" />
          <text x="30" y="56" fontSize="9" fill="#B87333" fontFamily="monospace" textAnchor="middle">Vv</text>
          {/* Colonne poids */}
          <rect x="230" y="70" width="90" height="45" fill="#B8C4C9" stroke="#2B2B2E" strokeWidth="1.5" />
          <rect x="230" y="115" width="90" height="70" fill="#C9A984" stroke="#2B2B2E" strokeWidth="1.5" />
          <text x="275" y="96" textAnchor="middle" fontSize="10" fontFamily="monospace">Eau — Ww</text>
          <text x="275" y="153" textAnchor="middle" fontSize="10" fontFamily="monospace">Grains — Ws</text>
          <text x="275" y="200" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">Poids (W), Wair ≈ 0</text>
          <g stroke="#C1502E" strokeWidth="1.8" fill="#C1502E">
            <line x1="345" y1="35" x2="345" y2="185" />
            <line x1="340" y1="35" x2="350" y2="35" />
            <line x1="340" y1="185" x2="350" y2="185" />
            <text x="358" y="113" fontSize="10" fontWeight="bold" fontFamily="monospace">W = Ws+Ww</text>
          </g>
          <text x="200" y="14" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">γ = W/V · ω = Ww/Ws · e = Vv/Vs</text>
        </svg>
      )}

      {nom === 'courbe-granulometrique' && (
        <svg viewBox="0 0 400 220" className="h-auto w-full">
          <Cartouche titre="COURBE GRANULOMÉTRIQUE (ÉCHELLE SEMI-LOG)" />
          <line x1="45" y1="180" x2="370" y2="180" stroke="#2B2B2E" strokeWidth="1.5" />
          <line x1="45" y1="30" x2="45" y2="180" stroke="#2B2B2E" strokeWidth="1.5" />
          {[45, 100, 155, 210, 265, 320].map((x, i) => (
            <line key={x} x1={x} y1="176" x2={x} y2="184" stroke="#8A8680" strokeWidth="1" />
          ))}
          <text x="45" y="196" fontSize="8" fill="#8A8680" fontFamily="monospace" textAnchor="middle">0,001</text>
          <text x="155" y="196" fontSize="8" fill="#8A8680" fontFamily="monospace" textAnchor="middle">0,08</text>
          <text x="265" y="196" fontSize="8" fill="#8A8680" fontFamily="monospace" textAnchor="middle">2</text>
          <text x="355" y="196" fontSize="8" fill="#8A8680" fontFamily="monospace" textAnchor="middle">20 mm</text>
          <text x="207" y="212" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">Diamètre des grains D (log)</text>
          <text x="20" y="105" fontSize="9" fill="#8A8680" fontFamily="monospace" transform="rotate(-90 20 105)">% Tamisats</text>
          <path d="M55 175 Q120 172 155 155 Q220 100 265 55 Q320 35 365 32" fill="none" stroke="#C1502E" strokeWidth="2.5" />
          <line x1="155" y1="30" x2="155" y2="180" stroke="#6B7A3F" strokeWidth="1" strokeDasharray="4 3" />
          <line x1="265" y1="30" x2="265" y2="180" stroke="#6B7A3F" strokeWidth="1" strokeDasharray="4 3" />
          <text x="100" y="45" fontSize="9" fill="#6B7A3F" fontFamily="monospace">argiles/limons</text>
          <text x="180" y="45" fontSize="9" fill="#6B7A3F" fontFamily="monospace">sables</text>
          <text x="290" y="45" fontSize="9" fill="#6B7A3F" fontFamily="monospace">graviers</text>
        </svg>
      )}

      {nom === 'limites-atterberg' && (
        <svg viewBox="0 0 400 150" className="h-auto w-full">
          <Cartouche titre="ÉTATS DE CONSISTANCE DU SOL — LIMITES D'ATTERBERG" />
          <line x1="30" y1="90" x2="370" y2="90" stroke="#2B2B2E" strokeWidth="2" />
          {[30, 143, 256, 370].map((x) => (
            <line key={x} x1={x} y1="83" x2={x} y2="97" stroke="#2B2B2E" strokeWidth="1.5" />
          ))}
          <text x="86" y="112" textAnchor="middle" fontSize="9" fontFamily="monospace">SOLIDE</text>
          <text x="200" y="112" textAnchor="middle" fontSize="9" fontFamily="monospace">SEMI-SOLIDE</text>
          <text x="313" y="112" textAnchor="middle" fontSize="9" fontFamily="monospace">PLASTIQUE</text>
          <text x="200" y="30" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">teneur en eau croissante →</text>
          <text x="143" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#B87333" fontFamily="monospace">Wp</text>
          <text x="256" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#C1502E" fontFamily="monospace">Wl</text>
          <text x="370" y="112" textAnchor="middle" fontSize="9" fontFamily="monospace">LIQUIDE</text>
          <g stroke="#B87333" strokeWidth="1.5" fill="#B87333">
            <line x1="30" y1="130" x2="143" y2="130" />
            <text x="86" y="143" textAnchor="middle" fontSize="8" fontFamily="monospace">retrait</text>
          </g>
          <g stroke="#C1502E" strokeWidth="1.5" fill="#C1502E">
            <line x1="143" y1="130" x2="256" y2="130" />
            <text x="200" y="143" textAnchor="middle" fontSize="8" fontFamily="monospace">indice de plasticité Ip = Wl − Wp</text>
          </g>
        </svg>
      )}

      {nom === 'courbe-proctor' && (
        <svg viewBox="0 0 400 210" className="h-auto w-full">
          <Cartouche titre="ESSAI PROCTOR — OPTIMUM DE COMPACTAGE" />
          <line x1="45" y1="170" x2="360" y2="170" stroke="#2B2B2E" strokeWidth="1.5" />
          <line x1="45" y1="30" x2="45" y2="170" stroke="#2B2B2E" strokeWidth="1.5" />
          <text x="200" y="196" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">teneur en eau ω (%)</text>
          <text x="20" y="100" fontSize="9" fill="#8A8680" fontFamily="monospace" transform="rotate(-90 20 100)">γd (poids vol. sec)</text>
          <path d="M60 155 Q140 60 200 48 Q260 60 340 145" fill="none" stroke="#C1502E" strokeWidth="2.5" />
          <line x1="200" y1="30" x2="200" y2="170" stroke="#6B7A3F" strokeWidth="1" strokeDasharray="4 3" />
          <circle cx="200" cy="48" r="4" fill="#6B7A3F" />
          <text x="200" y="190" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#6B7A3F" fontFamily="monospace">ωopt</text>
          <text x="245" y="42" fontSize="9" fontWeight="bold" fill="#6B7A3F" fontFamily="monospace">γd max — Optimum Proctor</text>
          <text x="80" y="120" fontSize="8" fill="#8A8680" fontFamily="monospace">versant sec</text>
          <text x="280" y="120" fontSize="8" fill="#8A8680" fontFamily="monospace">versant mouillé</text>
        </svg>
      )}

      {nom === 'schema-prix-vente' && (
        <svg viewBox="0 0 400 300" className="h-auto w-full">
          <Cartouche titre="DE LA DÉPENSE AU PRIX DE VENTE" />
          {/* DS */}
          <rect x="90" y="26" width="220" height="30" rx="4" fill="#F5F0E6" stroke="#2B2B2E" strokeWidth="1.5" />
          <text x="200" y="46" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace">D.S — Déboursés secs</text>
          <text x="320" y="46" fontSize="9" fill="#8A8680" fontFamily="monospace">mat. + m.o + matériel</text>
          {/* + FC */}
          <text x="200" y="68" textAnchor="middle" fontSize="10" fill="#6B7A3F" fontFamily="monospace">+ F.C (frais de chantier)</text>
          <line x1="200" y1="56" x2="200" y2="80" stroke="#8A8680" strokeWidth="1.5" />
          {/* DT / CR */}
          <rect x="70" y="80" width="260" height="30" rx="4" fill="#F5F0E6" stroke="#2B2B2E" strokeWidth="1.5" />
          <text x="200" y="100" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace">D.T / C.R — Coût de réalisation</text>
          {/* + FG + FM */}
          <text x="200" y="124" textAnchor="middle" fontSize="10" fill="#6B7A3F" fontFamily="monospace">+ F.G (généraux) + F.M (marché)</text>
          <line x1="200" y1="110" x2="200" y2="136" stroke="#8A8680" strokeWidth="1.5" />
          {/* PR */}
          <rect x="90" y="136" width="220" height="30" rx="4" fill="#F5F0E6" stroke="#2B2B2E" strokeWidth="1.5" />
          <text x="200" y="156" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace">P.R — Prix de revient HT</text>
          {/* + B */}
          <text x="200" y="180" textAnchor="middle" fontSize="10" fill="#6B7A3F" fontFamily="monospace">+ B (bénéfice)</text>
          <line x1="200" y1="166" x2="200" y2="192" stroke="#8A8680" strokeWidth="1.5" />
          {/* PVHT */}
          <rect x="70" y="192" width="260" height="32" rx="4" fill="#E8DCC8" stroke="#C1502E" strokeWidth="2" />
          <text x="200" y="213" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#C1502E" fontFamily="monospace">P.V.H.T — Prix de vente hors taxe</text>
          {/* + TVA */}
          <text x="200" y="240" textAnchor="middle" fontSize="10" fill="#6B7A3F" fontFamily="monospace">+ T.V.A</text>
          <line x1="200" y1="224" x2="200" y2="250" stroke="#8A8680" strokeWidth="1.5" />
          {/* PVTTC */}
          <rect x="60" y="250" width="280" height="32" rx="4" fill="#E8DCC8" stroke="#C1502E" strokeWidth="2" />
          <text x="200" y="271" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#C1502E" fontFamily="monospace">P.V.T.T.C — Toutes taxes comprises</text>
          <text x="200" y="296" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">P.V.H.T = D.S + F.C + F.M + F.G + B</text>
        </svg>
      )}

      {nom === 'escalier-blondel' && (
        <svg viewBox="0 0 400 230" className="h-auto w-full">
          <Cartouche titre="ESCALIER DROIT — GIRON, HAUTEUR, FORMULE DE BLONDEL" />
          {/* Marches en coupe (profil d'escalier) */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={60 + i * 45} y={175 - i * 22} width="45" height="10" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1.2" />
          ))}
          {/* cote giron sur une marche */}
          <g stroke="#B87333" strokeWidth="1" fill="#B87333">
            <line x1="150" y1="132" x2="195" y2="132" />
            <line x1="150" y1="128" x2="150" y2="136" />
            <line x1="195" y1="128" x2="195" y2="136" />
            <text x="172" y="124" textAnchor="middle" fontSize="9" fontFamily="monospace">giron g (25-32cm)</text>
          </g>
          {/* cote hauteur sur une marche */}
          <g stroke="#C1502E" strokeWidth="1" fill="#C1502E">
            <line x1="200" y1="110" x2="200" y2="132" />
            <line x1="196" y1="110" x2="204" y2="110" />
            <line x1="196" y1="132" x2="204" y2="132" />
            <text x="212" y="124" fontSize="9" fontFamily="monospace">h (14-18cm)</text>
          </g>
          <text x="200" y="205" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6B7A3F" fontFamily="monospace">Formule de Blondel : 60 cm ≤ 2h + g ≤ 66 cm</text>
          <text x="200" y="220" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">toujours un giron de moins que de hauteurs de marche</text>
        </svg>
      )}

      {nom === 'pente-vrd' && (
        <svg viewBox="0 0 400 230" className="h-auto w-full">
          <Cartouche titre="TRANCHÉE TYPE — RÉSEAU ENTERRÉ" />
          {/* Terrain */}
          <rect x="20" y="50" width="360" height="160" fill="#D9B382" opacity="0.3" />
          {/* Tranchée */}
          <polygon points="120,50 280,50 260,200 140,200" fill="#F5F0E6" stroke="#8A8680" strokeWidth="1.5" />
          {/* Remblai compacté */}
          {[70, 95, 120].map((y) => (
            <line key={y} x1={128 + (y - 50) * 0.13} y1={y} x2={272 - (y - 50) * 0.13} y2={y} stroke="#B87333" strokeWidth="1" strokeDasharray="6 4" />
          ))}
          <text x="200" y="90" textAnchor="middle" fontSize="9" fill="#B87333" fontFamily="monospace">remblai par couches de 30 cm</text>
          {/* Grillage avertisseur */}
          <line x1="140" y1="140" x2="260" y2="140" stroke="#C1502E" strokeWidth="3" strokeDasharray="8 4" />
          <text x="270" y="143" fontSize="9" fill="#C1502E" fontFamily="monospace">grillage avertisseur</text>
          {/* Enrobage sable */}
          <rect x="142" y="152" width="116" height="38" fill="#E8DCC8" />
          <text x="290" y="172" fontSize="9" fill="#8A8680" fontFamily="monospace">sable d&apos;enrobage</text>
          {/* Canalisation */}
          <circle cx="200" cy="175" r="13" fill="#F5F0E6" stroke="#2B2B2E" strokeWidth="2.5" />
          {/* Lit de pose */}
          <rect x="142" y="190" width="116" height="10" fill="#D9B382" />
          <text x="290" y="198" fontSize="9" fill="#8A8680" fontFamily="monospace">lit de pose 10 cm</text>
          {/* Flèche pente */}
          <g stroke="#6B7A3F" strokeWidth="2" fill="#6B7A3F">
            <line x1="60" y1="215" x2="340" y2="222" />
            <polygon points="340,217 350,223 339,227" />
          </g>
          <text x="200" y="215" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6B7A3F" fontFamily="monospace">pente ≥ 1 % → auto-curage</text>
        </svg>
      )}

      {nom === 'fouilles-types' && (
        <svg viewBox="0 0 400 210" className="h-auto w-full">
          <Cartouche titre="TYPES DE FOUILLES — LARGEUR / PROFONDEUR" />
          {/* Rigole */}
          <g>
            <rect x="20" y="90" width="60" height="30" fill="#F5F0E6" stroke="#2B2B2E" strokeWidth="1.5" />
            <text x="50" y="135" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Rigole</text>
            <text x="50" y="147" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">l≤2m h≤1m</text>
          </g>
          {/* Tranchée */}
          <g>
            <rect x="115" y="70" width="55" height="70" fill="#F5F0E6" stroke="#2B2B2E" strokeWidth="1.5" />
            <text x="142" y="155" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Tranchée</text>
            <text x="142" y="167" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">l≤2m h&gt;1m</text>
          </g>
          {/* Excavation */}
          <g>
            <rect x="205" y="105" width="100" height="35" fill="#F5F0E6" stroke="#2B2B2E" strokeWidth="1.5" />
            <text x="255" y="155" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Excavation</text>
            <text x="255" y="167" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">l&gt;2m h&lt;l/2</text>
          </g>
          {/* Puits */}
          <g>
            <rect x="340" y="50" width="35" height="90" fill="#F5F0E6" stroke="#2B2B2E" strokeWidth="1.5" />
            <text x="357" y="155" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Puits</text>
            <text x="357" y="167" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">l≤2m h≤8m</text>
          </g>
          <line x1="10" y1="140" x2="390" y2="140" stroke="#8A8680" strokeWidth="1.5" />
          <text x="200" y="195" textAnchor="middle" fontSize="9" fill="#C1502E" fontFamily="monospace">plus la fouille est étroite et profonde, plus elle se rapproche du « puits »</text>
        </svg>
      )}

      {nom === 'essais-sol-dispositif' && (
        <svg viewBox="0 0 400 210" className="h-auto w-full">
          <Cartouche titre="ESSAIS IN SITU — PÉNÉTROMÈTRE / PRESSIOMÈTRE" />
          {/* Terrain */}
          <rect x="20" y="60" width="170" height="130" fill="#D9B382" opacity="0.3" />
          <rect x="210" y="60" width="170" height="130" fill="#D9B382" opacity="0.3" />
          {/* Pénétromètre */}
          <line x1="90" y1="30" x2="90" y2="170" stroke="#2B2B2E" strokeWidth="4" />
          <polygon points="90,170 82,185 98,185" fill="#2B2B2E" />
          <rect x="75" y="20" width="30" height="16" fill="#C1502E" />
          <text x="90" y="12" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">battage/pression</text>
          <text x="90" y="200" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Pénétromètre</text>
          {/* Pressiomètre */}
          <rect x="255" y="60" width="14" height="90" fill="#F5F0E6" stroke="#2B2B2E" strokeWidth="1.5" />
          <rect x="250" y="95" width="24" height="30" rx="10" fill="none" stroke="#6B7A3F" strokeWidth="2.5" />
          <text x="290" y="105" fontSize="8" fill="#6B7A3F" fontFamily="monospace">membrane</text>
          <text x="290" y="118" fontSize="8" fill="#6B7A3F" fontFamily="monospace">gonflable</text>
          <line x1="262" y1="60" x2="262" y2="30" stroke="#2B2B2E" strokeWidth="2" />
          <text x="262" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">forage préalable</text>
          <text x="262" y="200" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Pressiomètre</text>
        </svg>
      )}

      {nom === 'ferraillage-masse-lineique' && (
        <svg viewBox="0 0 400 190" className="h-auto w-full">
          <Cartouche titre="MASSE LINÉIQUE — CALCUL PAR REPÈRE" />
          <line x1="60" y1="70" x2="340" y2="70" stroke="#C1502E" strokeWidth="4" />
          <circle cx="60" cy="70" r="5" fill="#C1502E" />
          <circle cx="340" cy="70" r="5" fill="#C1502E" />
          <g stroke="#B87333" strokeWidth="1" fill="#B87333">
            <line x1="60" y1="95" x2="340" y2="95" />
            <line x1="60" y1="90" x2="60" y2="100" />
            <line x1="340" y1="90" x2="340" y2="100" />
            <text x="200" y="112" textAnchor="middle" fontSize="10" fontFamily="monospace">L dev. (longueur développée d&apos;une barre)</text>
          </g>
          <text x="200" y="45" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2B2B2E" fontFamily="monospace">n barres identiques par repère</text>
          <rect x="70" y="140" width="260" height="34" rx="6" fill="#E8DCC8" stroke="#C1502E" strokeWidth="1.5" />
          <text x="200" y="161" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#C1502E" fontFamily="monospace">M/repère = L dev. × n × masse linéique</text>
        </svg>
      )}

      {nom === 'beton-ouvrages-elementaires' && (
        <svg viewBox="0 0 400 210" className="h-auto w-full">
          <Cartouche titre="VOLUME DE BÉTON — SECTION CONSTANTE" />
          {/* Longrine horizontale */}
          <rect x="30" y="60" width="160" height="30" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <g stroke="#B87333" strokeWidth="1" fill="#B87333">
            <line x1="30" y1="105" x2="190" y2="105" />
            <line x1="30" y1="100" x2="30" y2="110" />
            <line x1="190" y1="100" x2="190" y2="110" />
            <text x="110" y="122" textAnchor="middle" fontSize="9" fontFamily="monospace">longueur</text>
          </g>
          <text x="110" y="45" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">Longrine / poutre / linteau</text>
          <rect x="80" y="145" width="180" height="26" rx="5" fill="#E8DCC8" stroke="#C1502E" strokeWidth="1.5" />
          <text x="170" y="163" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#C1502E" fontFamily="monospace">Cube = section × longueur</text>
          {/* Poteau vertical */}
          <rect x="270" y="30" width="30" height="110" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <g stroke="#B87333" strokeWidth="1" fill="#B87333">
            <line x1="315" y1="30" x2="315" y2="140" />
            <line x1="310" y1="30" x2="320" y2="30" />
            <line x1="310" y1="140" x2="320" y2="140" />
          </g>
          <text x="345" y="88" fontSize="9" fill="#B87333" fontFamily="monospace" transform="rotate(90 345 88)">hauteur</text>
          <text x="285" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">Poteau / voile</text>
          <text x="200" y="195" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6B7A3F" fontFamily="monospace">Cube = section × hauteur</text>
        </svg>
      )}

      {nom === 'charpente-nomenclature' && (
        <svg viewBox="0 0 400 200" className="h-auto w-full">
          <Cartouche titre="CHARPENTE TRADITIONNELLE — NOMENCLATURE" />
          {/* Murs */}
          <rect x="50" y="120" width="20" height="60" fill="#D9B382" />
          <rect x="330" y="120" width="20" height="60" fill="#D9B382" />
          {/* Fermes (triangle) */}
          <polygon points="60,120 200,50 340,120" fill="none" stroke="#2B2B2E" strokeWidth="2.5" />
          <line x1="60" y1="120" x2="340" y2="120" stroke="#2B2B2E" strokeWidth="2.5" />
          <line x1="200" y1="120" x2="200" y2="50" stroke="#B87333" strokeWidth="2" />
          <text x="205" y="85" fontSize="9" fill="#B87333" fontFamily="monospace">poinçon</text>
          <text x="130" y="80" fontSize="9" fill="#2B2B2E" fontFamily="monospace" transform="rotate(-22 130 80)">arbalétrier</text>
          <text x="60" y="115" fontSize="9" fill="#2B2B2E" fontFamily="monospace">entrait</text>
          {/* Pannes (points le long des arbalétriers) */}
          {[0.25, 0.5, 0.75].map((t, i) => {
            const x = 60 + t * 280;
            const y = 120 - t * 70 + (t > 0.5 ? (t - 0.5) * 140 : 0);
            return <circle key={i} cx={x} cy={t <= 0.5 ? 120 - t * 140 : 120 - (1 - t) * 140} r="4" fill="#C1502E" />;
          })}
          <text x="120" y="45" fontSize="9" fill="#C1502E" fontFamily="monospace">pannes</text>
          {/* Chevrons + liteaux (hachures sur le versant) */}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1={90 + i * 20} y1={120 - i * 17.5} x2={90 + i * 20} y2={104 - i * 17.5} stroke="#6B7A3F" strokeWidth="1.5" />
          ))}
          <text x="90" y="185" fontSize="9" fill="#6B7A3F" fontFamily="monospace">chevrons (40-60cm d&apos;écart) + liteaux</text>
        </svg>
      )}

      {nom === 'couverture-toiture-versants' && (
        <svg viewBox="0 0 400 200" className="h-auto w-full">
          <Cartouche titre="TOITURE EN PLAN — VERSANTS ET ACCESSOIRES" />
          <polygon points="50,150 200,40 350,150" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1.5" />
          <line x1="200" y1="40" x2="200" y2="150" stroke="#C1502E" strokeWidth="3" strokeDasharray="8 3" />
          <text x="200" y="30" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#C1502E" fontFamily="monospace">faîtière</text>
          <text x="115" y="105" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">Versant 1</text>
          <text x="285" y="105" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">Versant 2</text>
          <line x1="90" y1="150" x2="140" y2="80" stroke="#6B7A3F" strokeWidth="3" />
          <text x="70" y="130" fontSize="9" fill="#6B7A3F" fontFamily="monospace" transform="rotate(-58 70 130)">arêtier</text>
          <line x1="260" y1="150" x2="230" y2="90" stroke="#B87333" strokeWidth="3" strokeDasharray="4 3" />
          <text x="270" y="130" fontSize="9" fill="#B87333" fontFamily="monospace" transform="rotate(58 270 130)">noue</text>
          <text x="200" y="185" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">arêtier = angle saillant · noue = angle rentrant (évacue l&apos;eau)</text>
        </svg>
      )}

      {nom === 'beton-arme-precontraint' && (
        <svg viewBox="0 0 400 220" className="h-auto w-full">
          <Cartouche titre="BÉTON PUR / ARMÉ / PRÉCONTRAINT — 3 COMPORTEMENTS" />
          {/* Béton pur */}
          <path d="M30 60 Q100 78 170 60 L170 72 Q100 90 30 72 Z" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <text x="100" y="45" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Béton pur</text>
          <text x="100" y="98" textAnchor="middle" fontSize="8" fill="#C1502E" fontFamily="monospace">rupture brutale en traction</text>
          {/* Béton armé */}
          <path d="M230 60 Q300 78 370 60 L370 72 Q300 90 230 72 Z" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <line x1="235" y1="86" x2="365" y2="86" stroke="#C1502E" strokeWidth="3" />
          <text x="300" y="45" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Béton armé</text>
          <text x="300" y="105" textAnchor="middle" fontSize="8" fill="#6B7A3F" fontFamily="monospace">aciers en zone tendue</text>
          {/* Béton précontraint */}
          <path d="M100 165 Q200 150 300 165 L300 177 Q200 162 100 177 Z" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <line x1="105" y1="171" x2="295" y2="171" stroke="#B87333" strokeWidth="3" />
          <g stroke="#B87333" strokeWidth="1.5" fill="#B87333">
            <line x1="105" y1="171" x2="90" y2="171" />
            <polygon points="90,171 98,167 98,175" />
            <line x1="295" y1="171" x2="310" y2="171" />
            <polygon points="310,171 302,167 302,175" />
          </g>
          <text x="200" y="135" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Béton précontraint</text>
          <text x="200" y="195" textAnchor="middle" fontSize="8" fill="#B87333" fontFamily="monospace">câble tendu → béton toujours comprimé</text>
        </svg>
      )}

      {nom === 'fondations-profondes' && (
        <svg viewBox="0 0 400 210" className="h-auto w-full">
          <Cartouche titre="PUITS / PIEUX — FONDATIONS PROFONDES" />
          <rect x="20" y="20" width="360" height="170" fill="#D9B382" opacity="0.25" />
          {/* Puits */}
          <rect x="90" y="30" width="45" height="110" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <path d="M90 140 L70 155 L155 155 L135 140 Z" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <text x="112" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Puits</text>
          <text x="112" y="170" textAnchor="middle" fontSize="8" fill="#6B7A3F" fontFamily="monospace">patte d&apos;éléphant</text>
          <text x="112" y="182" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">≤ 8 m</text>
          {/* Pieux */}
          <rect x="260" y="30" width="24" height="160" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <rect x="310" y="30" width="24" height="160" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <rect x="245" y="18" width="105" height="16" fill="#B87333" />
          <text x="297" y="12" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">semelle sur pieux</text>
          <g stroke="#C1502E" strokeWidth="1" fill="#C1502E">
            {[60, 100, 140].map((y) => (
              <line key={y} x1="284" y1={y} x2="310" y2={y} strokeDasharray="2 2" />
            ))}
          </g>
          <text x="297" y="200" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">20-40 m, frottement latéral + pointe</text>
        </svg>
      )}

      {nom === 'drainage-mur' && (
        <svg viewBox="0 0 400 210" className="h-auto w-full">
          <Cartouche titre="DRAINAGE D&apos;UN MUR ENTERRÉ" />
          <rect x="20" y="20" width="380" height="190" fill="#D9B382" opacity="0.25" />
          <rect x="150" y="20" width="60" height="150" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1.5" />
          <text x="180" y="12" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">mur de soubassement</text>
          {/* Tranchée drainante */}
          <polygon points="210,60 260,60 250,180 220,180" fill="#F5F0E6" stroke="#8A8680" strokeWidth="1.5" />
          {Array.from({ length: 5 }).map((_, i) => (
            <circle key={i} cx={220 + (i % 3) * 12} cy={140 + Math.floor(i / 3) * 14} r="3" fill="#B87333" opacity="0.6" />
          ))}
          <text x="290" y="150" fontSize="9" fill="#8A8680" fontFamily="monospace">tranchée drainante</text>
          {/* Drain */}
          <circle cx="235" cy="165" r="8" fill="none" stroke="#C1502E" strokeWidth="2.5" />
          <text x="290" y="168" fontSize="9" fontWeight="bold" fill="#C1502E" fontFamily="monospace">drain (face sup.)</text>
          {/* Exutoire */}
          <line x1="235" y1="173" x2="235" y2="200" stroke="#6B7A3F" strokeWidth="2.5" />
          <line x1="235" y1="200" x2="380" y2="200" stroke="#6B7A3F" strokeWidth="2.5" />
          <polygon points="380,200 372,196 372,204" fill="#6B7A3F" />
          <text x="300" y="192" fontSize="9" fontWeight="bold" fill="#6B7A3F" fontFamily="monospace">exutoire</text>
          {/* Arase étanche */}
          <rect x="150" y="55" width="60" height="6" fill="#C1502E" />
          <text x="70" y="58" fontSize="8" fill="#C1502E" fontFamily="monospace">arase étanche +15cm</text>
        </svg>
      )}

      {nom === 'dallage-terre-plein' && (
        <svg viewBox="0 0 400 190" className="h-auto w-full">
          <Cartouche titre="DALLAGE SUR TERRE-PLEIN — CONSTITUTION" />
          <rect x="60" y="140" width="280" height="30" fill="#D9B382" />
          <text x="345" y="158" fontSize="8" fill="#8A8680" fontFamily="monospace">remblai tout-venant</text>
          <rect x="60" y="120" width="280" height="20" fill="#F1C27D" />
          <text x="345" y="133" fontSize="8" fill="#8A8680" fontFamily="monospace">sable drainant</text>
          <rect x="60" y="113" width="280" height="7" fill="#2B2B2E" />
          <text x="345" y="119" fontSize="8" fill="#8A8680" fontFamily="monospace">film polyane</text>
          <rect x="60" y="90" width="280" height="23" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1" />
          <text x="345" y="104" fontSize="8" fontWeight="bold" fill="#2B2B2E" fontFamily="monospace">dalle béton 350kg/m³</text>
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={i} x1={70 + i * 22} y1="95" x2={70 + i * 22} y2="108" stroke="#8A8680" strokeWidth="0.6" />
          ))}
          <text x="200" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">De bas en haut :</text>
          <text x="200" y="50" textAnchor="middle" fontSize="9" fill="#6B7A3F" fontFamily="monospace">tout-venant → sable → polyane → dalle armée</text>
        </svg>
      )}

      {nom === 'plancher-corps-creux' && (
        <svg viewBox="0 0 400 190" className="h-auto w-full">
          <Cartouche titre="PLANCHER À CORPS CREUX — DÉSIGNATION « 16+4 »" />
          <rect x="40" y="100" width="320" height="16" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1" />
          <text x="370" y="112" fontSize="8" fill="#C1502E" fontWeight="bold" fontFamily="monospace">4</text>
          <text x="200" y="80" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#C1502E" fontFamily="monospace">dalle de compression (4cm, treillis soudé)</text>
          {[60, 150, 240, 330].map((x, i) => (
            <rect key={i} x={x} y={40} width="18" height="76" fill="#2B2B2E" />
          ))}
          <text x="105" y="35" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2B2B2E" fontFamily="monospace">poutrelles</text>
          <rect x="80" y="40" width="65" height="76" fill="#E8DCC8" opacity="0.8" />
          <text x="112" y="150" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">entrevous</text>
          <text x="370" y="60" fontSize="8" fill="#B87333" fontFamily="monospace">16</text>
          <g stroke="#B87333" strokeWidth="1" fill="#B87333">
            <line x1="385" y1="40" x2="385" y2="116" />
            <line x1="380" y1="40" x2="390" y2="40" />
            <line x1="380" y1="116" x2="390" y2="116" />
          </g>
          <text x="200" y="175" textAnchor="middle" fontSize="9" fill="#8A8680" fontFamily="monospace">16 = hauteur entrevous (cm) · 4 = épaisseur dalle compression (cm)</text>
        </svg>
      )}

      {nom === 'toiture-terrasse-couches' && (
        <svg viewBox="0 0 400 220" className="h-auto w-full">
          <Cartouche titre="TOITURE-TERRASSE — 5 COUCHES" />
          {[
            { y: 165, h: 30, c: '#C9C4BA', label: 'Élément porteur (dalle B.A.)' },
            { y: 150, h: 15, c: '#D9B382', label: 'Forme de pente (béton 250kg/m³)' },
            { y: 130, h: 20, c: '#E8DCC8', label: 'Isolant thermique' },
            { y: 118, h: 12, c: '#2B2B2E', label: 'Revêtement d’étanchéité' },
            { y: 100, h: 18, c: '#F1C27D', label: 'Protection (gravillons/dalles)' },
          ].map((c, i) => (
            <g key={i}>
              <rect x="90" y={c.y} width="220" height={c.h} fill={c.c} stroke="#8A8680" strokeWidth="0.6" />
              <text x="320" y={c.y + c.h / 2 + 3} fontSize="8.5" fill="#2B2B2E" fontFamily="monospace">{c.label}</text>
            </g>
          ))}
          <text x="200" y="40" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#C1502E" fontFamily="monospace">Fonction non négociable : l&apos;étanchéité</text>
          <line x1="200" y1="50" x2="200" y2="90" stroke="#C1502E" strokeWidth="1.5" markerEnd="none" />
          <polygon points="200,90 195,80 205,80" fill="#C1502E" />
        </svg>
      )}

      {nom === 'enduit-3-couches' && (
        <svg viewBox="0 0 400 190" className="h-auto w-full">
          <Cartouche titre="ENDUIT TRADITIONNEL — 3 COUCHES" />
          <rect x="60" y="130" width="280" height="30" fill="#C9C4BA" stroke="#2B2B2E" strokeWidth="1" />
          <text x="200" y="149" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">support (maçonnerie)</text>
          <rect x="60" y="115" width="280" height="15" fill="#B87333" />
          <text x="345" y="126" fontSize="8" fill="#8A8680" fontFamily="monospace">gobetis 2-5mm · 500-600kg/m³</text>
          <rect x="60" y="90" width="280" height="25" fill="#D9B382" />
          <text x="345" y="105" fontSize="8" fill="#8A8680" fontFamily="monospace">corps d&apos;enduit 8-12mm · 400-500kg/m³</text>
          <rect x="60" y="75" width="280" height="15" fill="#E8DCC8" />
          <text x="345" y="86" fontSize="8" fill="#8A8680" fontFamily="monospace">finition 5-7mm · 300-400kg/m³</text>
          <text x="200" y="45" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#6B7A3F" fontFamily="monospace">dosage dégressif : gobetis (fort) → finition (faible)</text>
          <text x="200" y="180" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">48h entre 1ère et 2ème couche · 4-7j avant la finition</text>
        </svg>
      )}

      {nom === 'fissures-pathologie' && (
        <svg viewBox="0 0 400 200" className="h-auto w-full">
          <Cartouche titre="LECTURE D&apos;UNE FISSURE — DIAGNOSTIC" />
          <rect x="30" y="30" width="150" height="130" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1.5" />
          <path d="M50 150 L110 90 L160 40" fill="none" stroke="#C1502E" strokeWidth="2.5" />
          <text x="105" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#C1502E" fontFamily="monospace">fissure diagonale</text>
          <text x="105" y="180" textAnchor="middle" fontSize="8" fill="#C1502E" fontFamily="monospace">→ cisaillement (tassement différentiel)</text>
          <rect x="220" y="30" width="150" height="130" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1.5" />
          <line x1="295" y1="35" x2="295" y2="155" stroke="#6B7A3F" strokeWidth="2.5" />
          <text x="295" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#6B7A3F" fontFamily="monospace">fissure verticale</text>
          <text x="295" y="180" textAnchor="middle" fontSize="8" fill="#6B7A3F" fontFamily="monospace">→ traction directe</text>
        </svg>
      )}

      {nom === 'corrosion-armature' && (
        <svg viewBox="0 0 400 200" className="h-auto w-full">
          <Cartouche titre="CORROSION DE L&apos;ARMATURE — 2 PHASES" />
          {/* Incubation */}
          <rect x="30" y="60" width="150" height="50" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1.5" />
          <circle cx="105" cy="85" r="8" fill="#8A8680" />
          <text x="105" y="45" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">Incubation</text>
          <text x="105" y="130" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">CO₂/chlorures pénètrent</text>
          <text x="105" y="142" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">— rien de visible —</text>
          <polygon points="190,85 215,85 215,78 235,90 215,102 215,95 190,95" fill="#B87333" />
          {/* Développement */}
          <rect x="245" y="60" width="150" height="50" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1.5" />
          <circle cx="320" cy="85" r="8" fill="#C1502E" />
          <path d="M320 60 L326 75 L314 75 Z" fill="#C1502E" opacity="0.6" />
          <text x="320" y="45" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#C1502E" fontFamily="monospace">Développement</text>
          <text x="320" y="130" textAnchor="middle" fontSize="8" fill="#C1502E" fontFamily="monospace">rouille, éclats, fissures</text>
          <text x="320" y="142" textAnchor="middle" fontSize="8" fill="#C1502E" fontFamily="monospace">réparation lourde</text>
          <text x="200" y="180" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#6B7A3F" fontFamily="monospace">perte de section &gt; 10 % → renforcement nécessaire</text>
        </svg>
      )}

      {nom === 'granulats-classification' && (
        <svg viewBox="0 0 400 170" className="h-auto w-full">
          <Cartouche titre="CLASSIFICATION DES GRANULATS PAR TAILLE" />
          {[
            { label: 'Argile', taille: '< 2 μm', c: '#4A342A', w: 20 },
            { label: 'Limon', taille: '2-20 μm', c: '#8A8680', w: 30 },
            { label: 'Sable', taille: '20 μm-2mm', c: '#D9B382', w: 60 },
            { label: 'Gravier', taille: '2-20mm', c: '#B87333', w: 80 },
            { label: 'Cailloux', taille: '> 20mm', c: '#6B7A3F', w: 100 },
          ].reduce<{ x: number; el: React.ReactNode[] }>((acc, g, i) => {
            const x = acc.x;
            acc.el.push(
              <g key={i}>
                <rect x={x} y="60" width={g.w} height="40" fill={g.c} />
                <text x={x + g.w / 2} y="115" textAnchor="middle" fontSize="8.5" fontWeight="bold" fontFamily="monospace">{g.label}</text>
                <text x={x + g.w / 2} y="127" textAnchor="middle" fontSize="7.5" fill="#8A8680" fontFamily="monospace">{g.taille}</text>
              </g>,
            );
            acc.x += g.w;
            return acc;
          }, { x: 20, el: [] }).el}
          <text x="200" y="30" textAnchor="middle" fontSize="9" fill="#2B2B2E" fontFamily="monospace">taille croissante des particules →</text>
        </svg>
      )}

      {nom === 'murs-classification' && (
        <svg viewBox="0 0 400 200" className="h-auto w-full">
          <Cartouche titre="NOMENCLATURE DES MURS DU BÂTIMENT" />
          <polygon points="60,150 200,60 340,150" fill="none" stroke="#8A8680" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="60" y="130" width="280" height="20" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1" />
          <rect x="60" y="60" width="20" height="90" fill="#C1502E" opacity="0.7" />
          <text x="30" y="105" fontSize="8" fill="#C1502E" fontFamily="monospace" transform="rotate(-90 30 105)">goutterot (façade)</text>
          <rect x="195" y="70" width="10" height="80" fill="#6B7A3F" opacity="0.7" />
          <text x="200" y="60" textAnchor="middle" fontSize="8" fill="#6B7A3F" fontFamily="monospace">pignon</text>
          <rect x="140" y="110" width="10" height="40" fill="#B87333" opacity="0.7" />
          <text x="145" y="165" textAnchor="middle" fontSize="8" fill="#B87333" fontFamily="monospace">refend</text>
          <rect x="250" y="110" width="10" height="40" fill="#2B2B2E" opacity="0.7" />
          <text x="255" y="165" textAnchor="middle" fontSize="8" fill="#2B2B2E" fontFamily="monospace">échiffre</text>
          <text x="200" y="185" textAnchor="middle" fontSize="8" fill="#8A8680" fontFamily="monospace">refend = contreventement · échiffre = support d&apos;escalier</text>
        </svg>
      )}
    </div>
  );
}
