'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { ArticleCarte, Besoins } from '@/lib/lieux-vie';
import { ASSISE_BANC, ETALS, MARCHE } from '@/lib/lieux-vie/marche';
import { DecorMarche } from './decors-loisirs';
import { InterieurLieuVie } from './interieur-lieu-vie';
import { PanneauEtal } from './panneaux-loisirs';
import { BandeauService } from './panneaux-lieux-vie';
import { useServiceLieu, type ProprietesServiceLieu } from './service-lieu';

/** L'étal qui vend un article, et le prénom de sa vendeuse. */
const etalDe = (article: ArticleCarte) => Object.entries(ETALS).find(([, e]) => e.articles.includes(article.id))?.[0] ?? 'mentor';
const vendeuseDe = (article: ArticleCarte) => ETALS[etalDe(article)].vendeuse.split(',')[0];

/** Le marché : on salue, on choisit à l'étal, on marchande, puis on mange sur le banc. */
export function LieuMarche({ demo, heure, besoins, argent, consommer, notifier, passerA, onSortir, children }: ProprietesServiceLieu & {
  demo: boolean; heure: number; besoins: Besoins; argent: number;
  passerA: (heure: number) => void; onSortir: () => void; children?: ReactNode;
}) {
  const [etal, setEtal] = useState<string | null>(null);
  const [salues, setSalues] = useState<string[]>([]);
  const [fachees, setFachees] = useState<string[]>([]);
  const service = useServiceLieu<'banc'>({
    hote: vendeuseDe, consommer, notifier, libelleStation: () => 'sur le banc',
    annonceServi: s => `${s.article.nom} : c’est emballé. Va manger sur le banc.`,
  });
  const enCours = service.service;

  const surPoste = (station: string) => {
    if (station === 'banc') {
      if (enCours?.etape === 'servi') service.sAttabler('banc');
      else if (!enCours) notifier('Achète d’abord à un étal : on mange ici, sur le banc.', 'info');
      return;
    }
    if (!ETALS[station]) return;
    if (enCours) { notifier(enCours.etape === 'preparation' ? `${vendeuseDe(enCours.article)} prépare ta commande.` : 'Ta commande t’attend : va t’asseoir sur le banc.', 'info'); return; }
    service.setErreur(null); setEtal(station);
  };
  const acheter = async (article: ArticleCarte, remise: number) => {
    if (await service.commander(article, 'banc', { remise })) setEtal(null);
  };
  const finDeJournee = heure >= 17;
  const postes = enCours ? (enCours.etape === 'servi' ? ['banc'] : []) : Object.keys(ETALS);
  const assise = enCours?.etape === 'repas' ? ASSISE_BANC : null;
  const preparation = enCours?.etape === 'preparation' ? etalDe(enCours.article) : null;
  const servi = enCours && enCours.etape !== 'preparation' ? enCours.article : null;
  const decor = useMemo(() => <DecorMarche preparation={preparation} servi={servi} />, [preparation, servi?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const statut = enCours ? (enCours.etape === 'preparation' ? `🧺 ${vendeuseDe(enCours.article)} prépare : ${enCours.article.nom.toLowerCase()}.` : enCours.etape === 'servi' ? '🪑 C’est emballé : le banc t’attend.' : '😋 Bon appétit, sur le banc du marché.')
    : finDeJournee ? '🌇 Fin de marché : les vendeuses sont plus arrangeantes.' : '👋 Salue avant de parler prix : ici, tout se discute.';
  const echap = () => { if (etal) { setEtal(null); return true; } return false; };
  const texteService = enCours && (enCours.etape === 'preparation' ? `${vendeuseDe(enCours.article)} prépare ta commande…` : enCours.etape === 'servi' ? `${enCours.article.nom} : va t’asseoir sur le banc.` : `${enCours.article.nom} : bon appétit !`);
  return <InterieurLieuVie lieu={MARCHE} heure={heure} decor={decor} hote={{ prof: false, variante: 1, nom: MARCHE.hote.nom }} postes={postes} assise={assise} statut={statut}
    libelleHote={`🥭 Étal de fruits · ${MARCHE.hote.nom}`} onPoste={surPoste} onSortir={() => { service.emporter(); onSortir(); }} onEchap={echap} onAttendre={() => passerA(MARCHE.horaires.ouverture)}>
    {etal && <PanneauEtal key={etal} vendeuse={ETALS[etal].vendeuse} articles={MARCHE.carte.filter(a => ETALS[etal].articles.includes(a.id))} besoins={besoins} argent={argent} heure={heure} demo={demo}
      salue={salues.includes(etal)} fachee={fachees.includes(etal)} enCours={service.enCours} erreur={service.erreur}
      onSaluer={() => setSalues(s => [...s, etal])} onFacher={() => setFachees(f => [...f, etal])} onAcheter={acheter} onFermer={() => setEtal(null)} />}
    {enCours && texteService && <BandeauService texte={texteService} progression={service.progression} />}
    {children}
  </InterieurLieuVie>;
}
