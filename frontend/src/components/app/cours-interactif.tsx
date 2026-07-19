'use client';

import { useMemo, useState } from 'react';
import { jouerSon } from '@/lib/sons';

// Découpe un bloc multi-lignes en points nettoyés (une puce par ligne non vide).
export function enPoints(valeur: string): string[] {
  return valeur
    .split('\n')
    .map((l) => l.replace(/^[-•▸★*]\s*/, '').trim())
    .filter(Boolean);
}

/** Liste qui apparaît point par point (cascade). Purement visuel — rend la lecture vivante. */
export function ListeCascade({ points, couleur = 'text-olive' }: { points: string[]; couleur?: string }) {
  return (
    <ul className="space-y-2">
      {points.map((p, i) => (
        <li key={i} className="cours-reveal flex items-start gap-2 text-graphite/85" style={{ '--i': i } as React.CSSProperties}>
          <span className={`mt-0.5 shrink-0 ${couleur}`}>▸</span>
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * « À retenir » en mémorisation active : chaque point est caché derrière une carte. On tape pour le
 * révéler (rappel actif = on essaie de se souvenir avant de voir) — bien plus efficace que lire.
 */
export function CartesRecall({ points }: { points: string[] }) {
  const [reveles, setReveles] = useState<Set<number>>(new Set());
  const tousReveles = reveles.size === points.length;

  function reveler(i: number) {
    if (reveles.has(i)) return;
    jouerSon('clic');
    setReveles((prev) => {
      const s = new Set(prev);
      s.add(i);
      if (s.size === points.length) setTimeout(() => jouerSon('succes'), 150);
      return s;
    });
  }

  return (
    <div>
      <div className="space-y-2.5">
        {points.map((p, i) => {
          const ouvert = reveles.has(i);
          return (
            <button
              key={i}
              onClick={() => reveler(i)}
              disabled={ouvert}
              className={`block w-full rounded-2xl border-2 p-4 text-left transition-all sm:p-5 ${
                ouvert
                  ? 'cours-pop border-cuivre/40 bg-graphite text-ivoire'
                  : 'border-dashed border-graphite/25 bg-white text-graphite/50 hover:border-cuivre hover:text-graphite'
              }`}
            >
              {ouvert ? (
                <span className="flex items-start gap-2.5 text-base sm:text-lg">
                  <span className="mt-0.5 shrink-0 text-cuivre">★</span> {p}
                </span>
              ) : (
                <span className="flex items-center gap-2.5 text-sm font-semibold">
                  <span className="text-lg">👆</span> Point clé {i + 1} — tape pour révéler
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!tousReveles && (
        <button
          onClick={() => { jouerSon('clic'); setReveles(new Set(points.map((_, i) => i))); }}
          className="mt-3 w-full rounded-full border border-graphite/20 py-2 text-xs font-semibold text-graphite/60 hover:border-terracotta hover:text-terracotta"
        >
          Tout afficher
        </button>
      )}
      {tousReveles && (
        <p className="cours-pop mt-3 text-center text-sm font-semibold text-olive">✓ Bien joué, tu as tout parcouru !</p>
      )}
    </div>
  );
}

/**
 * Slide « Teste-toi » : auto-évaluation active en fin de cours. On revoit chaque point clé un par un
 * et on s'auto-note (Acquis / À revoir) — façon carte de révision Duolingo/Anki. Motivant et actif.
 */
export function AutoEvaluation({ points }: { points: string[] }) {
  const items = useMemo(() => points.slice(0, 8), [points]);
  const [i, setI] = useState(0);
  const [acquis, setAcquis] = useState(0);
  const [aRevoir, setARevoir] = useState(0);
  const [fini, setFini] = useState(false);

  function repondre(ok: boolean) {
    jouerSon(ok ? 'succes' : 'clic');
    if (ok) setAcquis((n) => n + 1);
    else setARevoir((n) => n + 1);
    if (i + 1 >= items.length) {
      setTimeout(() => { setFini(true); jouerSon('niveau'); }, 200);
    } else {
      setI((n) => n + 1);
    }
  }

  if (!items.length) return null;

  if (fini) {
    const pct = Math.round((acquis / items.length) * 100);
    return (
      <div className="cours-pop text-center">
        <p className="text-5xl">{pct >= 70 ? '🏆' : pct >= 40 ? '💪' : '📚'}</p>
        <h3 className="mt-3 font-display text-xl font-bold text-graphite sm:text-2xl">
          {pct >= 70 ? 'Tu maîtrises !' : pct >= 40 ? 'Bien parti !' : 'À consolider'}
        </h3>
        <p className="mt-2 text-graphite/70">
          {acquis} acquis · {aRevoir} à revoir
        </p>
        {aRevoir > 0 && (
          <p className="mx-auto mt-3 max-w-sm text-sm text-graphite/50">
            Pas de souci pour ce qui reste à revoir — relis les points du cours, puis la mission pratique ancrera tout ça.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-center text-xs font-semibold text-graphite/50">Point {i + 1} / {items.length}</p>
      <div className="mt-3 rounded-2xl border border-pierre bg-white p-5 text-center shadow-sm sm:p-8">
        <p className="text-base leading-relaxed text-graphite/90 sm:text-lg">{items[i]}</p>
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-graphite/60">Tu avais retenu ce point ?</p>
      <div className="mt-3 flex gap-3">
        <button
          onClick={() => repondre(false)}
          className="flex-1 rounded-full border-2 border-terracotta/40 py-3 font-semibold text-terracotta transition-transform hover:scale-105 hover:bg-terracotta/5"
        >
          🔁 À revoir
        </button>
        <button
          onClick={() => repondre(true)}
          className="flex-1 rounded-full bg-olive py-3 font-semibold text-ivoire transition-transform hover:scale-105"
        >
          ✅ Acquis
        </button>
      </div>
    </div>
  );
}
