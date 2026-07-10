'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

type TypeBloc = 'texte' | 'exemple' | 'astuce' | 'attention' | 'retenir' | 'objectifs';
interface Option { id: string; label: string; }
interface Question { enonce: string; options: Option[]; bonneReponse: string; correctionPedagogique: string; }
interface Exercice { titre: string; questions: Question[]; }
interface Bloc { type: TypeBloc; valeur: string; }
interface Chapitre { titre: string; dureeMin: number; blocs: Bloc[]; exercice: Exercice | null; }
interface PreviewModule { titre: string; domaine: string; chapitres: Chapitre[]; avertissements: string[]; }
interface ResultatPublication { module: { id: string; slug: string; titre: string }; chapitres: { id: string; titre: string }[] }

const LABELS_TYPE_BLOC: Record<TypeBloc, string> = {
  texte: 'Texte',
  exemple: 'Exemple',
  astuce: 'Astuce',
  attention: 'Attention',
  retenir: 'À retenir',
  objectifs: 'Objectifs',
};

export default function GenererCoursPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nomFichier, setNomFichier] = useState<string | null>(null);
  const [enAnalyse, setEnAnalyse] = useState(false);
  const [preview, setPreview] = useState<PreviewModule | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enPublication, setEnPublication] = useState(false);
  const [resultat, setResultat] = useState<ResultatPublication | null>(null);

  async function analyserFichier(fichier: File) {
    setErreur(null);
    setResultat(null);
    setEnAnalyse(true);
    setNomFichier(fichier.name);
    try {
      const formData = new FormData();
      formData.append('fichier', fichier);
      const data = await api.upload<PreviewModule>('/admin/academie-generateur/analyser', formData);
      setPreview(data);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'analyse du document");
      setPreview(null);
    } finally {
      setEnAnalyse(false);
    }
  }

  function majChapitre(i: number, patch: Partial<Chapitre>) {
    setPreview((p) => (p ? { ...p, chapitres: p.chapitres.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) } : p));
  }
  function majBloc(iChap: number, iBloc: number, patch: Partial<Bloc>) {
    setPreview((p) =>
      p
        ? {
            ...p,
            chapitres: p.chapitres.map((c, idx) =>
              idx === iChap ? { ...c, blocs: c.blocs.map((b, j) => (j === iBloc ? { ...b, ...patch } : b)) } : c,
            ),
          }
        : p,
    );
  }
  function supprimerBloc(iChap: number, iBloc: number) {
    setPreview((p) =>
      p
        ? { ...p, chapitres: p.chapitres.map((c, idx) => (idx === iChap ? { ...c, blocs: c.blocs.filter((_, j) => j !== iBloc) } : c)) }
        : p,
    );
  }
  function ajouterBloc(iChap: number) {
    setPreview((p) =>
      p
        ? {
            ...p,
            chapitres: p.chapitres.map((c, idx) => (idx === iChap ? { ...c, blocs: [...c.blocs, { type: 'texte', valeur: '' }] } : c)),
          }
        : p,
    );
  }
  function majQuestion(iChap: number, iQ: number, patch: Partial<Question>) {
    setPreview((p) =>
      p
        ? {
            ...p,
            chapitres: p.chapitres.map((c, idx) => {
              if (idx !== iChap || !c.exercice) return c;
              const questions = c.exercice.questions.map((q, j) => (j === iQ ? { ...q, ...patch } : q));
              return { ...c, exercice: { ...c.exercice, questions } };
            }),
          }
        : p,
    );
  }
  function majOption(iChap: number, iQ: number, iOpt: number, label: string) {
    setPreview((p) =>
      p
        ? {
            ...p,
            chapitres: p.chapitres.map((c, idx) => {
              if (idx !== iChap || !c.exercice) return c;
              const questions = c.exercice.questions.map((q, j) =>
                j === iQ ? { ...q, options: q.options.map((o, k) => (k === iOpt ? { ...o, label } : o)) } : q,
              );
              return { ...c, exercice: { ...c.exercice, questions } };
            }),
          }
        : p,
    );
  }

  async function publier(publie: boolean) {
    if (!preview) return;
    setErreur(null);
    setEnPublication(true);
    try {
      const data = await api.post<ResultatPublication>('/admin/academie-generateur/publier', { ...preview, publie });
      setResultat(data);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Échec de la publication');
    } finally {
      setEnPublication(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite">📄 Générer un cours depuis un document</h1>
        <p className="mt-1 text-sm text-graphite/60">
          Dépose un PDF, un .docx ou un fichier texte : il est découpé automatiquement en chapitres, avec un quiz
          généré quand des définitions sont détectées. C&apos;est un découpage <strong>programmatique</strong> (règles
          + expressions régulières), pas une IA générative — relis et corrige avant de publier.
        </p>
      </div>

      {!resultat && (
        <section className="carte-vivante rounded-2xl border border-pierre bg-white p-5">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void analyserFichier(f);
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={enAnalyse}
            className="w-full rounded-xl border-2 border-dashed border-pierre py-8 text-center text-sm font-semibold text-graphite/70 transition-colors hover:border-terracotta disabled:opacity-50"
          >
            {enAnalyse ? `Analyse de « ${nomFichier} »…` : nomFichier ? `📎 ${nomFichier} — cliquer pour changer` : '📎 Choisir un document (PDF, .docx, .txt, .md)'}
          </button>
          {erreur && <p className="mt-3 text-sm font-semibold text-terracotta">{erreur}</p>}
        </section>
      )}

      {resultat && (
        <section className="carte-vivante rounded-2xl border border-olive bg-olive/5 p-5 text-center">
          <p className="text-lg font-bold text-graphite">✅ Matière publiée : {resultat.module.titre}</p>
          <p className="mt-1 text-sm text-graphite/60">{resultat.chapitres.length} chapitre(s) créé(s).</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/admin/contenus/modules-academie" className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-ivoire">
              Voir dans Académie
            </Link>
            <button
              onClick={() => {
                setResultat(null);
                setPreview(null);
                setNomFichier(null);
              }}
              className="rounded-full border border-pierre px-5 py-2 text-sm font-semibold text-graphite"
            >
              Générer un autre cours
            </button>
          </div>
        </section>
      )}

      {preview && !resultat && (
        <>
          {preview.avertissements.length > 0 && (
            <section className="rounded-2xl border border-terracotta/40 bg-terracotta/5 p-4">
              <p className="text-sm font-semibold text-terracotta">⚠ À vérifier avant publication</p>
              <ul className="mt-1.5 space-y-1">
                {preview.avertissements.map((a) => (
                  <li key={a} className="text-xs text-graphite/70">
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="carte-vivante rounded-2xl border border-pierre bg-white p-5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-graphite/50">Titre de la matière</label>
            <input
              value={preview.titre}
              onChange={(e) => setPreview({ ...preview, titre: e.target.value })}
              className="mt-1 w-full rounded-lg border border-pierre px-3 py-2 font-display text-lg font-bold text-graphite"
            />
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-graphite/50">Domaine</label>
            <input
              value={preview.domaine}
              onChange={(e) => setPreview({ ...preview, domaine: e.target.value })}
              className="mt-1 w-full rounded-lg border border-pierre px-3 py-2 text-sm text-graphite"
            />
          </section>

          {preview.chapitres.map((chapitre, iChap) => (
            <section key={iChap} className="carte-vivante rounded-2xl border border-pierre bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={chapitre.titre}
                  onChange={(e) => majChapitre(iChap, { titre: e.target.value })}
                  className="flex-1 rounded-lg border border-pierre px-3 py-1.5 font-display font-bold text-graphite"
                />
                <label className="flex items-center gap-1.5 text-xs text-graphite/60">
                  Durée
                  <input
                    type="number"
                    min={1}
                    value={chapitre.dureeMin}
                    onChange={(e) => majChapitre(iChap, { dureeMin: Number(e.target.value) || 1 })}
                    className="w-16 rounded-lg border border-pierre px-2 py-1 text-center"
                  />
                  min
                </label>
              </div>

              <div className="mt-3 space-y-2">
                {chapitre.blocs.map((bloc, iBloc) => (
                  <div key={iBloc} className="rounded-lg border border-pierre/60 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={bloc.type}
                        onChange={(e) => majBloc(iChap, iBloc, { type: e.target.value as TypeBloc })}
                        className="rounded-md border border-pierre px-2 py-1 text-xs font-semibold text-olive"
                      >
                        {(Object.keys(LABELS_TYPE_BLOC) as TypeBloc[]).map((t) => (
                          <option key={t} value={t}>
                            {LABELS_TYPE_BLOC[t]}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => supprimerBloc(iChap, iBloc)} className="text-xs font-semibold text-terracotta hover:underline">
                        Supprimer
                      </button>
                    </div>
                    <textarea
                      value={bloc.valeur}
                      onChange={(e) => majBloc(iChap, iBloc, { valeur: e.target.value })}
                      rows={2}
                      className="mt-1.5 w-full resize-y rounded-md border border-pierre/60 px-2 py-1.5 text-sm text-graphite"
                    />
                  </div>
                ))}
                <button onClick={() => ajouterBloc(iChap)} className="text-xs font-semibold text-olive hover:underline">
                  + Ajouter un bloc
                </button>
              </div>

              {chapitre.exercice ? (
                <div className="mt-4 rounded-xl bg-pierre/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-graphite/50">🎯 {chapitre.exercice.titre}</p>
                  {chapitre.exercice.questions.map((q, iQ) => (
                    <div key={iQ} className="mt-2.5 rounded-lg border border-pierre bg-white p-3">
                      <input
                        value={q.enonce}
                        onChange={(e) => majQuestion(iChap, iQ, { enonce: e.target.value })}
                        className="w-full rounded-md border border-pierre/60 px-2 py-1 text-sm font-semibold text-graphite"
                      />
                      <div className="mt-2 space-y-1.5">
                        {q.options.map((opt, iOpt) => (
                          <label key={opt.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`bonne-reponse-${iChap}-${iQ}`}
                              checked={q.bonneReponse === opt.id}
                              onChange={() => majQuestion(iChap, iQ, { bonneReponse: opt.id })}
                            />
                            <input
                              value={opt.label}
                              onChange={(e) => majOption(iChap, iQ, iOpt, e.target.value)}
                              className="flex-1 rounded-md border border-pierre/60 px-2 py-1"
                            />
                          </label>
                        ))}
                      </div>
                      <textarea
                        value={q.correctionPedagogique}
                        onChange={(e) => majQuestion(iChap, iQ, { correctionPedagogique: e.target.value })}
                        rows={1}
                        placeholder="Correction pédagogique"
                        className="mt-2 w-full resize-y rounded-md border border-pierre/60 px-2 py-1 text-xs text-graphite/70"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-terracotta/5 p-3 text-xs text-terracotta">Aucun exercice généré pour ce chapitre.</p>
              )}
            </section>
          ))}

          {erreur && <p className="text-sm font-semibold text-terracotta">{erreur}</p>}

          <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur">
            <button
              onClick={() => publier(false)}
              disabled={enPublication}
              className="rounded-full border border-pierre px-5 py-2.5 text-sm font-semibold text-graphite disabled:opacity-50"
            >
              Enregistrer en brouillon
            </button>
            <button
              onClick={() => publier(true)}
              disabled={enPublication}
              className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-ivoire disabled:opacity-50"
            >
              {enPublication ? 'Publication…' : 'Publier la matière'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
