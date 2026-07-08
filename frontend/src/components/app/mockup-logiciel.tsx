'use client';

// Mockups d'interfaces logicielles — reconstitutions originales évoquant les
// conventions visuelles réelles (rubans, palettes, grilles) sans logos protégés.

function Fenetre({ titreBarre, couleur, children }: { titreBarre: string; couleur: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-pierre shadow-sm">
      <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ backgroundColor: couleur }}>
        <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
        <span className="ml-2 text-xs font-semibold text-white/90">{titreBarre}</span>
      </div>
      {children}
    </div>
  );
}

export function MockupLogiciel({ logiciel, taille = 'normal' }: { logiciel: string; taille?: 'normal' | 'compact' }) {
  const h = taille === 'compact' ? 180 : 240;

  if (logiciel === 'word') {
    return (
      <Fenetre titreBarre="RJ_2026-07-05.docx — Word" couleur="#2B579C">
        <div className="flex" style={{ height: h }}>
          <div className="w-full bg-white p-0">
            <div className="flex gap-4 border-b border-pierre bg-[#F3F2F1] px-3 py-1.5 text-[10px] font-medium text-graphite/70">
              <span className="rounded bg-white px-2 py-0.5 shadow-sm">Accueil</span>
              <span>Insertion</span>
              <span>Mise en page</span>
              <span>Révision</span>
            </div>
            <div className="flex gap-1 border-b border-pierre bg-white px-3 py-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="h-5 w-5 rounded-sm bg-[#EAEAEA]" />
              ))}
            </div>
            <div className="mx-auto mt-3 w-[85%] rounded-sm bg-white p-4 shadow-[0_0_0_1px_#e8dcc8]">
              <div className="mb-2 h-2.5 w-2/3 rounded-sm bg-[#2B579C]/70" />
              <div className="h-1.5 w-full rounded-sm bg-graphite/15" />
              <div className="mt-1 h-1.5 w-full rounded-sm bg-graphite/15" />
              <div className="mt-1 h-1.5 w-4/5 rounded-sm bg-graphite/15" />
              <div className="mt-3 h-1.5 w-1/2 rounded-sm bg-graphite/25" />
              <div className="mt-2 h-1.5 w-full rounded-sm bg-graphite/15" />
              <div className="mt-1 h-1.5 w-3/4 rounded-sm bg-graphite/15" />
            </div>
          </div>
        </div>
      </Fenetre>
    );
  }

  if (logiciel === 'excel') {
    const cols = ['', 'A', 'B', 'C', 'D', 'E'];
    const data = [
      ['1', 'Désignation', 'Unité', 'Qté', 'PU', 'Montant'],
      ['2', 'Béton dalle', 'm³', '3,00', '65 000', '=C2*D2'],
      ['3', 'Agglos 15', 'u', '620', '350', '=C3*D3'],
      ['4', 'Ferraillage', 'kg', '210', '900', '=C4*D4'],
    ];
    return (
      <Fenetre titreBarre="Devis_chambre.xlsx — Excel" couleur="#1D6F42">
        <div className="bg-white" style={{ height: h }}>
          <div className="flex gap-1 border-b border-pierre bg-[#F3F2F1] px-3 py-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="h-5 w-5 rounded-sm bg-[#E2EFDA]" />
            ))}
          </div>
          <div className="flex items-center gap-2 border-b border-pierre bg-white px-2 py-1 font-mono text-[10px] text-graphite/60">
            <span className="rounded bg-[#EAEAEA] px-1.5">C4</span>
            <span className="text-graphite/30">fx</span>
            <span>=C3*D3</span>
          </div>
          <table className="w-full border-collapse text-[10px]">
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`border border-[#E8DCC8] px-2 py-1 ${i === 0 ? 'bg-[#E2EFDA] font-semibold text-graphite' : j === 0 ? 'bg-[#F3F2F1] text-graphite/40' : 'text-graphite/80'}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Fenetre>
    );
  }

  if (logiciel === 'pdf') {
    return (
      <Fenetre titreBarre="Plan_coffrage_R+1.pdf" couleur="#4A4A4A">
        <div className="flex bg-[#525659]" style={{ height: h }}>
          <div className="hidden w-14 flex-col gap-2 border-r border-black/20 bg-[#3A3A3D] p-2 sm:flex">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`h-10 rounded-sm ${n === 1 ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          <div className="flex flex-1 items-center justify-center p-3">
            <svg viewBox="0 0 160 110" className="h-full w-full rounded-sm bg-white shadow-lg">
              <rect x="10" y="10" width="140" height="90" fill="none" stroke="#2B2B2E" strokeWidth="1.5" />
              <line x1="10" y1="50" x2="150" y2="50" stroke="#2B2B2E" strokeWidth="1" />
              <line x1="80" y1="10" x2="80" y2="100" stroke="#2B2B2E" strokeWidth="1" />
              <circle cx="20" cy="20" r="4" fill="none" stroke="#C1502E" strokeWidth="1.5" />
              <circle cx="140" cy="20" r="4" fill="none" stroke="#C1502E" strokeWidth="1.5" />
              <circle cx="20" cy="90" r="4" fill="none" stroke="#C1502E" strokeWidth="1.5" />
              <circle cx="140" cy="90" r="4" fill="none" stroke="#C1502E" strokeWidth="1.5" />
              <text x="80" y="8" textAnchor="middle" fontSize="4" fill="#8A8680" fontFamily="monospace">1/50</text>
            </svg>
          </div>
          <div className="hidden w-10 flex-col items-center gap-2 border-l border-black/20 bg-[#3A3A3D] p-2 sm:flex">
            <span className="h-4 w-4 rounded-sm bg-white/60" />
            <span className="h-4 w-4 rounded-sm bg-white/60" />
            <span className="text-[9px] font-bold text-white/70">+</span>
            <span className="text-[9px] font-bold text-white/70">−</span>
          </div>
        </div>
      </Fenetre>
    );
  }

  if (logiciel === 'autocad') {
    return (
      <Fenetre titreBarre="Coffrage_P3.dwg — AutoCAD" couleur="#2B2B2E">
        <div className="relative bg-[#1E1E20]" style={{ height: h }}>
          <div className="flex gap-3 border-b border-white/10 px-3 py-1 text-[9px] text-white/50">
            <span className="rounded bg-white/10 px-2 py-0.5 text-white">Accueil</span>
            <span>Insertion</span>
            <span>Annoter</span>
          </div>
          <svg viewBox="0 0 200 130" className="h-[70%] w-full">
            <line x1="20" y1="65" x2="180" y2="65" stroke="#3a3a3d" strokeWidth="0.5" />
            <line x1="100" y1="10" x2="100" y2="120" stroke="#3a3a3d" strokeWidth="0.5" />
            <rect x="40" y="30" width="16" height="70" fill="none" stroke="#B87333" strokeWidth="1.2" />
            <rect x="144" y="30" width="16" height="70" fill="none" stroke="#B87333" strokeWidth="1.2" />
            <line x1="56" y1="45" x2="144" y2="45" stroke="#8A8680" strokeWidth="1" />
            <line x1="56" y1="85" x2="144" y2="85" stroke="#8A8680" strokeWidth="1" />
            <g stroke="#C1502E" strokeWidth="0.6">
              <line x1="40" y1="112" x2="160" y2="112" />
              <line x1="40" y1="108" x2="40" y2="116" />
              <line x1="160" y1="108" x2="160" y2="116" />
            </g>
            <text x="100" y="122" textAnchor="middle" fontSize="6" fill="#C1502E" fontFamily="monospace">3.60</text>
            <circle cx="70" cy="20" r="2.4" fill="#00D4FF" />
            <line x1="60" y1="10" x2="80" y2="30" stroke="#00D4FF" strokeWidth="0.6" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/60 px-3 py-1.5 font-mono text-[9px] text-[#7CFC7C]">
            Commande : _dist point1 point2 ▮
          </div>
        </div>
      </Fenetre>
    );
  }

  if (logiciel === 'revit' || logiciel === 'archicad') {
    const accent = logiciel === 'revit' ? '#0C6ED1' : '#009EE3';
    const nom = logiciel === 'revit' ? 'Villa_R1.rvt — Revit' : 'Villa_R1.pln — ArchiCAD';
    return (
      <Fenetre titreBarre={nom} couleur={accent}>
        <div className="flex bg-[#F3F2F1]" style={{ height: h }}>
          <div className="hidden w-20 flex-col gap-1 border-r border-pierre bg-white p-2 text-[9px] text-graphite/60 sm:flex">
            <p className="font-semibold text-graphite">Étages</p>
            <span className="rounded bg-pierre px-1 py-0.5">RDC</span>
            <span className="rounded px-1 py-0.5">R+1</span>
            <span className="rounded px-1 py-0.5">Toiture</span>
          </div>
          <div className="flex flex-1 items-center justify-center p-2">
            <svg viewBox="0 0 160 110" className="h-full">
              <polygon points="30,80 90,60 150,80 150,100 30,100" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1" />
              <polygon points="30,80 90,60 150,80 90,68" fill="#D9B382" stroke="#2B2B2E" strokeWidth="1" />
              <rect x="60" y="80" width="14" height="20" fill={accent} opacity="0.5" />
              <rect x="100" y="80" width="14" height="20" fill={accent} opacity="0.5" />
              <line x1="30" y1="100" x2="150" y2="100" stroke="#8A8680" strokeWidth="0.8" />
            </svg>
          </div>
          <div className="hidden w-24 flex-col gap-1 border-l border-pierre bg-white p-2 text-[9px] text-graphite/60 md:flex">
            <p className="font-semibold text-graphite">Propriétés</p>
            <p>Mur — 20cm</p>
            <p>Niveau : RDC</p>
            <p>Surface : 84 m²</p>
          </div>
        </div>
      </Fenetre>
    );
  }

  if (logiciel === 'msproject' || logiciel === 'primavera') {
    const accent = logiciel === 'msproject' ? '#217346' : '#E4602F';
    const nom = logiciel === 'msproject' ? 'Planning_villa.mpp — MS Project' : 'Planning_lots.xer — Primavera P6';
    const taches = [
      { nom: 'Terrassement', debut: 5, largeur: 15, critique: true },
      { nom: 'Fondations', debut: 20, largeur: 20, critique: true },
      { nom: 'Élévation', debut: 40, largeur: 30, critique: true },
      { nom: 'Toiture', debut: 70, largeur: 20, critique: false },
      { nom: 'Finitions', debut: 85, largeur: 10, critique: false },
    ];
    return (
      <Fenetre titreBarre={nom} couleur={accent}>
        <div className="bg-white p-2" style={{ height: h }}>
          <div className="flex h-full gap-2">
            <div className="w-24 shrink-0 space-y-1.5 border-r border-pierre pr-2 text-[9px] text-graphite/70">
              {taches.map((t) => (
                <p key={t.nom} className="truncate">{t.nom}</p>
              ))}
            </div>
            <div className="relative flex-1 space-y-1.5">
              <div className="absolute inset-y-0 left-[45%] w-px bg-terracotta/60" />
              {taches.map((t) => (
                <div key={t.nom} className="relative h-4">
                  <div
                    className="absolute h-4 rounded-sm"
                    style={{ left: `${t.debut}%`, width: `${t.largeur}%`, backgroundColor: t.critique ? '#C1502E' : accent }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Fenetre>
    );
  }

  if (logiciel === 'robot') {
    return (
      <Fenetre titreBarre="Poutre_P3.rtd — Robot Structural" couleur="#8E44AD">
        <div className="bg-white p-4" style={{ height: h }}>
          <svg viewBox="0 0 200 100" className="h-full w-full">
            <defs>
              <linearGradient id="stress" x1="0" x2="1">
                <stop offset="0%" stopColor="#2E5FA3" />
                <stop offset="50%" stopColor="#D9B382" />
                <stop offset="100%" stopColor="#C1502E" />
              </linearGradient>
            </defs>
            <path d="M20 55 Q100 75 180 55 L180 62 Q100 82 20 62 Z" fill="url(#stress)" opacity="0.85" />
            <line x1="20" y1="55" x2="180" y2="55" stroke="#2B2B2E" strokeWidth="2" />
            <polygon points="20,55 12,68 28,68" fill="#8A8680" />
            <polygon points="180,55 172,68 188,68" fill="#8A8680" />
            {[60, 100, 140].map((x) => (
              <line key={x} x1={x} y1="30" x2={x} y2="52" stroke="#6B7A3F" strokeWidth="1.5" markerEnd="url(#arrow)" />
            ))}
            <text x="100" y="20" textAnchor="middle" fontSize="8" fill="#6B7A3F" fontFamily="monospace">charges G+Q</text>
            <text x="100" y="90" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2B2B2E" fontFamily="monospace">
              M = 85 kN·m → 3HA16
            </text>
          </svg>
        </div>
      </Fenetre>
    );
  }

  if (logiciel === 'covadis' || logiciel === 'qgis') {
    const accent = logiciel === 'qgis' ? '#589632' : '#005A9C';
    const nom = logiciel === 'qgis' ? 'Cadastre_terrain.qgz — QGIS' : 'Profil_voirie.dwg — Covadis';
    return (
      <Fenetre titreBarre={nom} couleur={accent}>
        <div className="flex bg-white" style={{ height: h }}>
          <div className="hidden w-20 flex-col gap-1 border-r border-pierre p-2 text-[9px] text-graphite/60 sm:flex">
            <p className="font-semibold text-graphite">Couches</p>
            <span>☑ Cadastre</span>
            <span>☑ Réseaux</span>
            <span>☐ Courbes</span>
          </div>
          <div className="flex flex-1 items-center justify-center bg-[#EAF3E6] p-2">
            <svg viewBox="0 0 160 100" className="h-full w-full">
              <polygon points="20,20 70,15 75,60 25,70" fill="#D9B382" opacity="0.6" stroke="#4A342A" strokeWidth="0.8" />
              <polygon points="75,60 140,50 145,85 30,90" fill="#C9C4BA" opacity="0.6" stroke="#4A342A" strokeWidth="0.8" />
              {[20, 35, 50].map((y) => (
                <path key={y} d={`M10 ${y} Q80 ${y - 10} 150 ${y}`} fill="none" stroke={accent} strokeWidth="0.6" opacity="0.5" />
              ))}
              <text x="50" y="45" fontSize="6" fill="#4A342A" fontFamily="monospace">Parc. 112</text>
            </svg>
          </div>
        </div>
      </Fenetre>
    );
  }

  if (logiciel === 'sketchup') {
    return (
      <Fenetre titreBarre="Muret_cloture.skp — SketchUp" couleur="#005F9E">
        <div className="bg-[#F0F0F0]" style={{ height: h }}>
          <div className="flex gap-1 border-b border-pierre bg-white px-2 py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="h-4 w-4 rounded-sm bg-[#E0E0E0]" />
            ))}
          </div>
          <div className="flex h-[calc(100%-28px)] items-center justify-center">
            <svg viewBox="0 0 160 110" className="h-full w-full">
              <line x1="20" y1="90" x2="140" y2="90" stroke="#C1502E" strokeWidth="1.2" />
              <line x1="20" y1="90" x2="55" y2="60" stroke="#6B7A3F" strokeWidth="1.2" />
              <line x1="20" y1="90" x2="20" y2="30" stroke="#2E5FA3" strokeWidth="1.2" />
              <polygon points="60,75 100,75 100,45 60,45" fill="#E8DCC8" stroke="#2B2B2E" strokeWidth="1" opacity="0.9" />
              <polygon points="60,75 95,65 95,35 60,45" fill="#D9B382" stroke="#2B2B2E" strokeWidth="1" opacity="0.9" />
              <polygon points="100,75 95,65 95,35 100,45" fill="#C9A984" stroke="#2B2B2E" strokeWidth="1" opacity="0.9" />
            </svg>
          </div>
        </div>
      </Fenetre>
    );
  }

  return null;
}
