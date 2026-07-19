'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SchemaTechnique } from './schema-technique';
import { MockupLogiciel } from './mockup-logiciel';
import { AutoEvaluation, CartesRecall, ListeCascade, enPoints } from './cours-interactif';
import { jouerSon } from '@/lib/sons';

export interface BlocCours {
  type: string;
  valeur: string;
}

const TITRES_BLOC: Record<string, { titre: string; icone: string }> = {
  texte: { titre: 'Le cours', icone: '📖' },
  exemple: { titre: 'Cas pratique', icone: '🧪' },
  astuce: { titre: 'Astuce de chantier', icone: '💡' },
  attention: { titre: 'Point de vigilance', icone: '⚠️' },
  schema: { titre: 'Schéma technique', icone: '📐' },
  logiciel: { titre: "Interface du logiciel", icone: '🖥️' },
  retenir: { titre: 'À retenir', icone: '📌' },
};

/** Diapositives pédagogiques plein écran : 1 idée par slide, navigation clavier et tactile. */
export function LecteurSlides({
  titre,
  sousTitre,
  dureeMin,
  blocs,
  missionPratiqueId,
  onClose,
}: {
  titre: string;
  sousTitre?: string;
  dureeMin?: number | null;
  blocs: BlocCours[];
  missionPratiqueId?: string | null;
  onClose: () => void;
}) {
  // Slide 0 = couverture (avec objectifs si présents) · 1 bloc = 1 slide · une slide « Teste-toi »
  // interactive juste avant · dernière = félicitations.
  const objectifs = blocs.find((b) => b.type === 'objectifs');
  const contenu = useMemo(() => blocs.filter((b) => b.type !== 'objectifs'), [blocs]);
  // Points de rappel actif pour l'auto-évaluation : les « à retenir » en priorité, sinon les objectifs.
  const pointsRecall = useMemo(() => {
    const retenir = blocs.find((b) => b.type === 'retenir');
    const source = retenir?.valeur ?? objectifs?.valeur ?? '';
    return enPoints(source);
  }, [blocs, objectifs]);
  const aTesteToi = pointsRecall.length >= 2;
  const idxTesteToi = contenu.length + 1; // juste après le dernier bloc de contenu
  const totalSlides = contenu.length + 2 + (aTesteToi ? 1 : 0);
  const [index, setIndex] = useState(0);
  const suivant = () => setIndex((i) => Math.min(totalSlides - 1, i + 1));
  const precedent = () => setIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') suivant();
      if (e.key === 'ArrowLeft') precedent();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totalSlides, onClose]);

  // Balayage tactile : geste horizontal net (> vertical et > seuil) pour changer de slide.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    if (dx < 0) suivant();
    else precedent();
  }

  useEffect(() => {
    if (index === totalSlides - 1) jouerSon('succes');
  }, [index, totalSlides]);

  const bloc = index >= 1 && index <= contenu.length ? contenu[index - 1] : null;
  const meta = bloc ? TITRES_BLOC[bloc.type] ?? TITRES_BLOC.texte : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-ivoire">
      {/* En-tête */}
      <header className="flex items-center justify-between gap-2 border-b border-pierre bg-white px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-graphite sm:text-base">{titre}</p>
          {sousTitre && <p className="truncate text-xs text-graphite/50">{sousTitre}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="rounded-full bg-pierre px-2.5 py-1 font-mono text-xs font-semibold text-graphite/60 sm:px-3">
            {index + 1}/{totalSlides}
          </span>
          <button onClick={onClose} className="rounded-full border border-graphite/20 px-3 py-1.5 text-xs font-semibold text-graphite hover:border-terracotta hover:text-terracotta sm:px-4 sm:text-sm">
            ✕
          </button>
        </div>
      </header>

      {/* Barre de progression */}
      <div className="h-1.5 shrink-0 bg-pierre">
        <div className="barre-progression h-full bg-terracotta" style={{ width: `${((index + 1) / totalSlides) * 100}%` }} />
      </div>

      {/* Slide — le swipe tactile change de diapositive */}
      <main
        key={index}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="anim-fade-up flex flex-1 items-center justify-center overflow-x-hidden overflow-y-auto px-3 py-6 sm:px-4 sm:py-8"
      >
        <div className="w-full max-w-2xl overflow-x-hidden">
          {/* Couverture */}
          {index === 0 && (
            <div className="text-center">
              <p className="text-4xl sm:text-5xl">📚</p>
              <h1 className="mt-4 font-display text-2xl font-bold text-graphite sm:text-3xl">{titre}</h1>
              {dureeMin && <p className="mt-2 text-sm text-graphite/50">⏱ Environ {dureeMin} minutes · {contenu.length} étapes</p>}
              {objectifs && (
                <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-pierre bg-white p-4 text-left sm:p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-olive">🎯 À la fin de ce cours, tu sauras :</p>
                  <div className="mt-2">
                    <ListeCascade points={enPoints(objectifs.valeur)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bloc de contenu */}
          {bloc && meta && (
            <div>
              <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-graphite/40 sm:tracking-[0.3em]">
                {meta.icone} {meta.titre}
              </p>
              <div className="mt-4 sm:mt-5">
                {(bloc.type === 'schema' || bloc.type === 'logiciel') && (
                  <div className="schema-entree max-w-full overflow-x-auto [-webkit-overflow-scrolling:touch]">
                    {bloc.type === 'schema' && <SchemaTechnique nom={bloc.valeur} />}
                    {bloc.type === 'logiciel' && <MockupLogiciel logiciel={bloc.valeur} />}
                  </div>
                )}
                {bloc.type === 'retenir' && (
                  <div>
                    <p className="mb-3 text-center text-sm text-graphite/50">Essaie de te rappeler, puis tape chaque carte 👇</p>
                    <CartesRecall points={enPoints(bloc.valeur)} />
                  </div>
                )}
                {bloc.type === 'exemple' && (
                  <div className="rounded-2xl border-l-8 border-cuivre bg-cuivre/5 p-5 sm:rounded-3xl sm:p-8">
                    <p className="text-base leading-relaxed text-graphite/90 sm:text-lg">{bloc.valeur}</p>
                  </div>
                )}
                {bloc.type === 'astuce' && (
                  <div className="rounded-2xl border-l-8 border-olive bg-olive/5 p-5 sm:rounded-3xl sm:p-8">
                    <p className="text-base leading-relaxed text-graphite/90 sm:text-lg">{bloc.valeur}</p>
                  </div>
                )}
                {bloc.type === 'attention' && (
                  <div className="rounded-2xl border-l-8 border-terracotta bg-terracotta/5 p-5 sm:rounded-3xl sm:p-8">
                    <p className="text-base leading-relaxed text-graphite/90 sm:text-lg">{bloc.valeur}</p>
                  </div>
                )}
                {!['schema', 'logiciel', 'retenir', 'exemple', 'astuce', 'attention'].includes(bloc.type) && (
                  <div className="rounded-2xl border border-pierre bg-white p-5 sm:rounded-3xl sm:p-8">
                    <p className="text-base leading-relaxed text-graphite/90 sm:text-lg">{bloc.valeur}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slide interactive « Teste-toi » — auto-évaluation active avant la fin */}
          {aTesteToi && index === idxTesteToi && (
            <div>
              <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-graphite/40 sm:tracking-[0.3em]">
                🧠 Teste-toi
              </p>
              <h2 className="mt-3 text-center font-display text-xl font-bold text-graphite sm:text-2xl">
                Vérifie ce que tu retiens
              </h2>
              <div className="mt-5">
                <AutoEvaluation points={pointsRecall} />
              </div>
            </div>
          )}

          {/* Slide finale */}
          {index === totalSlides - 1 && (
            <div className="text-center">
              <p className="anim-float inline-block text-5xl sm:text-6xl">🎓</p>
              <h2 className="mt-4 font-display text-2xl font-bold text-graphite sm:text-3xl">Cours terminé !</h2>
              <p className="mx-auto mt-3 max-w-md text-graphite/60">
                La théorie est posée — maintenant on la met en pratique, c&apos;est là que ça rentre vraiment.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3">
                {missionPratiqueId && (
                  <Link
                    href={`/app/missions/${missionPratiqueId}`}
                    className="anim-pulse-cta rounded-full bg-terracotta px-8 py-3.5 font-semibold text-ivoire transition-transform hover:scale-105 hover:bg-argile"
                  >
                    🎯 Passer à la mission pratique
                  </Link>
                )}
                <button onClick={onClose} className="rounded-full border border-graphite/20 px-6 py-2.5 text-sm font-semibold text-graphite hover:border-terracotta hover:text-terracotta">
                  Revenir à la liste
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Navigation */}
      <footer className="shrink-0 border-t border-pierre bg-white px-3 py-2.5 sm:px-4 sm:py-3">
        {/* Points : rangée dédiée, défilement horizontal contenu (jamais la page) */}
        <div className="mb-2 flex justify-center gap-1.5 overflow-x-auto px-2 [-webkit-overflow-scrolling:touch]">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2.5 shrink-0 rounded-full transition-all ${i === index ? 'w-6 bg-terracotta' : i < index ? 'w-2.5 bg-olive' : 'w-2.5 bg-pierre'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={precedent}
            disabled={index === 0}
            className="rounded-full border border-graphite/20 px-4 py-2 text-xs font-semibold text-graphite transition-colors hover:border-terracotta disabled:opacity-30 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            ← Précédent
          </button>
          <button
            onClick={suivant}
            disabled={index === totalSlides - 1}
            className="rounded-full bg-graphite px-4 py-2 text-xs font-semibold text-ivoire transition-colors hover:bg-brun disabled:opacity-30 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Suivant →
          </button>
        </div>
      </footer>
    </div>
  );
}
