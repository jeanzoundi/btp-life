'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ArticleCarte, Besoins } from '@/lib/lieux-vie';
import { ASSISES_SPORT, DUREE_MATCH, PARCOURS_MATCH, scoreDuMatch, SPORT, STATION_SPORT, TOUR_FOOTING } from '@/lib/lieux-vie/sport';
import { DecorSport } from './decors-loisirs';
import { InterieurLieuVie, type CommandesLieu } from './interieur-lieu-vie';
import { PanneauTirsAuBut } from './panneaux-loisirs';
import { BandeauService, PanneauCarte } from './panneaux-lieux-vie';
import { useServiceLieu, type ProprietesServiceLieu } from './service-lieu';

type PosteSport = 'muscu' | 'piste' | 'buvette';
const OU: Record<PosteSport, string> = { muscu: 'à la musculation', piste: 'sur la piste', buvette: 'à la buvette' };
const MATCH = SPORT.carte.find(a => a.id === 'match-foot')!;

/** Le complexe sportif : Coach Aya organise ; muscu, footing et buvette se paient d'avance, le match se règle à la fin,
 * avec le bonus si l'on gagne aux tirs au but. */
export function LieuSport({ demo, heure, besoins, argent, consommer, notifier, passerA, onSortir, children }: ProprietesServiceLieu & {
  demo: boolean; heure: number; besoins: Besoins; argent: number;
  passerA: (heure: number) => void; onSortir: () => void; children?: ReactNode;
}) {
  const commandes = useRef<CommandesLieu | null>(null);
  const [carte, setCarte] = useState(false);
  const [match, setMatch] = useState<{ etape: 'rassemblement' | 'jeu' | 'tirs'; depuis: number; graine: number } | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const service = useServiceLieu<PosteSport>({
    hote: a => a.id === 'jus-buvette' ? 'La buvette' : SPORT.hote.nom, consommer, notifier, libelleStation: s => OU[s],
    annonceServi: s => s.station === 'muscu' ? 'Le banc est libre : va à la musculation.' : s.station === 'piste' ? 'La piste est à toi : rejoins la ligne de départ.' : 'Ton jus t’attend à la buvette.',
  });
  const enCours = service.service;

  // Le match se joue en temps réel : le score avance, puis les tirs au but départagent.
  const avancement = match?.etape === 'jeu' ? Math.min(1, (maintenant - match.depuis) / (DUREE_MATCH * 1000)) : match?.etape === 'tirs' ? 1 : 0;
  useEffect(() => {
    if (match?.etape !== 'jeu') return;
    const minuteur = window.setInterval(() => setMaintenant(Date.now()), 250);
    return () => window.clearInterval(minuteur);
  }, [match?.etape]);
  useEffect(() => {
    if (match?.etape !== 'jeu' || avancement < 1) return;
    setMatch({ ...match, etape: 'tirs' });
    commandes.current?.parcourir([[4.6, -6]]);
    notifier('2 – 2 au coup de sifflet : place aux tirs au but !', 'info');
  }, [avancement, match, notifier]);

  const surPoste = (station: string) => {
    if (station === 'terrain') {
      if (match?.etape === 'rassemblement') {
        const depuis = Date.now();
        setMaintenant(depuis); setMatch({ ...match, etape: 'jeu', depuis });
        commandes.current?.parcourir(PARCOURS_MATCH);
        notifier('Coup d’envoi ! Tu joues avec les collègues du chantier contre l’équipe du dépôt.', 'info');
      } else if (!match) notifier('Le terrain est libre : demande un match à cinq à Coach Aya.', 'info');
      return;
    }
    if (match) { if (match.etape === 'rassemblement') notifier('Rejoins le terrain : le match va commencer.', 'info'); return; }
    if (station === 'mentor' || (!enCours && (station === 'muscu' || station === 'piste' || station === 'buvette'))) {
      if (enCours) notifier(enCours.etape === 'servi' ? `C’est prêt ${OU[enCours.station]}.` : 'Coach Aya prépare ta séance.', 'info');
      else { service.setErreur(null); setCarte(true); }
      return;
    }
    if (station !== 'muscu' && station !== 'piste' && station !== 'buvette') return;
    if (enCours?.etape === 'servi') {
      if (!service.sAttabler(station)) notifier(`C’est prêt ${OU[enCours.station]}.`, 'info');
      else if (station === 'piste') commandes.current?.parcourir(TOUR_FOOTING);
    }
  };
  const commander = async (article: ArticleCarte) => {
    if (article.id === MATCH.id) {
      setCarte(false); setMatch({ etape: 'rassemblement', depuis: 0, graine: Math.floor(Math.random() * 1000) });
      notifier('Coach Aya siffle le rassemblement : rejoins le terrain. Le match se paie à la fin.', 'trajet');
      return;
    }
    if (await service.commander(article, STATION_SPORT[article.id] ?? 'buvette')) setCarte(false);
  };
  const finirMatch = async (victoire: boolean) => {
    try {
      const conso = await consommer(MATCH, { victoire });
      conso.appliquer();
      notifier(conso.message, 'succes');
    } catch (e) {
      notifier((e as Error).message || 'Le match n’a pas pu être réglé.', 'alerte');
    } finally { setMatch(null); }
  };
  const sortir = () => {
    if (match) notifier('Tu quittes le match avant la fin : rien n’est payé.', 'info');
    service.emporter(); onSortir();
  };

  const score = scoreDuMatch(avancement);
  const phase = match?.etape === 'jeu' ? 'match' : match?.etape === 'tirs' ? 'tirs' : 'libre';
  const nuit = heure >= 18.5 || heure < 6.5;
  const jusServi = enCours?.station === 'buvette' && enCours.etape !== 'preparation';
  const decor = useMemo(() => <DecorSport phase={phase} depuisMatch={match?.depuis ?? 0} score={score} nuit={nuit} jusServi={jusServi} />,
    [phase, match?.depuis, score[0], score[1], nuit, jusServi]); // eslint-disable-line react-hooks/exhaustive-deps
  const postes = match ? (match.etape === 'rassemblement' ? ['terrain'] : []) : enCours ? (enCours.etape === 'servi' ? [enCours.station] : []) : ['mentor', 'terrain'];
  const assise = !match && enCours?.etape === 'repas' && enCours.station !== 'piste' ? ASSISES_SPORT[enCours.station] : null;
  const statut = match ? (match.etape === 'rassemblement' ? '📣 Rejoins le terrain : le match va commencer.' : match.etape === 'jeu' ? `⚽ Match en cours · ${score[0]} – ${score[1]}` : '🥅 Tirs au but : à toi de jouer.')
    : enCours ? (enCours.etape === 'preparation' ? `⏱ ${enCours.station === 'buvette' ? 'La buvette presse ton jus' : 'Coach Aya prépare ta séance'}.` : enCours.etape === 'servi' ? `C’est prêt ${OU[enCours.station]} !` : enCours.station === 'piste' ? '🏃 Un tour de piste…' : 'Effort en cours…')
    : nuit ? '💡 Les projecteurs sont allumés : les équipes du quartier jouent le soir.' : '⚽ Le terrain à cinq, la muscu, la piste : Coach Aya organise tout.';
  const echap = () => { if (carte) { setCarte(false); return true; } return false; };
  const texteService = !match && enCours && (enCours.etape === 'preparation' ? 'Préparation…' : enCours.etape === 'servi' ? `C’est prêt ${OU[enCours.station]}.` : `${enCours.article.nom}…`);
  return <InterieurLieuVie lieu={SPORT} heure={heure} decor={decor} hote={{ prof: false, variante: 1, nom: SPORT.hote.nom }} postes={postes} assise={assise} statut={statut} commandes={commandes}
    libelleHote={`📋 Voir le programme · ${SPORT.hote.nom}`} onPoste={surPoste} onSortir={sortir} onEchap={echap} onAttendre={() => passerA(SPORT.horaires.ouverture)}>
    {carte && <PanneauCarte lieu={SPORT} besoins={besoins} argent={argent} demo={demo} libelleAction={a => a.categorie === 'activite' ? 'Choisir' : 'Commander'}
      salutation={nuit ? 'Bonsoir ! Les projecteurs sont allumés, l’équipe du dépôt cherche des adversaires. Tu en es ?' : 'Salut ! Match à cinq avec les collègues, muscu, footing ou un jus frais : qu’est-ce qui te tente ?'}
      enCours={service.enCours} erreur={service.erreur} onCommander={commander} onFermer={() => setCarte(false)} />}
    {match?.etape === 'tirs' && <PanneauTirsAuBut graine={match.graine} onFin={finirMatch} />}
    {texteService && <BandeauService texte={texteService} progression={service.progression} />}
    {children}
  </InterieurLieuVie>;
}
