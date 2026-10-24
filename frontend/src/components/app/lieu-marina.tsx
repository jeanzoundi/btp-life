'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { ArticleCarte, Besoins } from '@/lib/lieux-vie';
import { ASSISE_TERRASSE, CAP_AMARRE, MARINA, STATION_MARINA, TOUR_PIROGUE } from '@/lib/lieux-vie/marina';
import type { Assise } from '@/lib/navigation-plan';
import { DecorMarina } from './decors-loisirs';
import { InterieurLieuVie } from './interieur-lieu-vie';
import { BandeauService, PanneauCarte } from './panneaux-lieux-vie';
import { dureeConsommation, useServiceLieu, type ProprietesServiceLieu } from './service-lieu';

type PosteMarina = 'kiosque' | 'terrasse' | 'ponton';
const OU: Record<PosteMarina, string> = { kiosque: 'au kiosque', terrasse: 'en terrasse', ponton: 'au bout du ponton' };

/** La marina : une coco au kiosque, des brochettes en terrasse, et le tour de la lagune en pirogue avec le capitaine. */
export function LieuMarina({ demo, heure, besoins, argent, consommer, notifier, passerA, onSortir, children }: ProprietesServiceLieu & {
  demo: boolean; heure: number; besoins: Besoins; argent: number;
  passerA: (heure: number) => void; onSortir: () => void; children?: ReactNode;
}) {
  const [carte, setCarte] = useState(false);
  // L'assise du joueur dans la pirogue : le décor la déplace à chaque image pendant la balade.
  const assisePirogue = useRef<Assise>({ position: [TOUR_PIROGUE[0][0], TOUR_PIROGUE[0][1]], rotation: CAP_AMARRE }).current;
  const service = useServiceLieu<PosteMarina>({
    hote: a => a.id === 'pirogue' ? MARINA.hote.nom : a.id === 'coco' ? 'Le neveu du capitaine' : 'La cuisine de la terrasse',
    consommer, notifier, libelleStation: s => OU[s],
    annonceServi: s => s.article.id === 'pirogue' ? 'La pirogue est prête : embarque au bout du grand ponton.' : `${s.article.nom} : c’est servi ${OU[s.station]}.`,
  });
  const enCours = service.service;

  const surPoste = (station: string) => {
    if (station === 'mentor') {
      if (enCours) notifier(enCours.etape === 'preparation' ? 'Le capitaine s’en occupe, ça arrive.' : enCours.station === 'ponton' ? 'Ta pirogue t’attend au bout du grand ponton.' : `C’est servi ${OU[enCours.station]}.`, 'info');
      else { service.setErreur(null); setCarte(true); }
      return;
    }
    if (station !== 'kiosque' && station !== 'terrasse' && station !== 'ponton') return;
    if (enCours?.etape === 'servi') { if (!service.sAttabler(station)) notifier(enCours.station === 'ponton' ? 'Ta pirogue t’attend au bout du grand ponton.' : `C’est servi ${OU[enCours.station]}.`, 'info'); return; }
    if (!enCours && station === 'kiosque') { service.setErreur(null); setCarte(true); return; }
    if (!enCours) notifier(station === 'ponton' ? 'Les balades se réservent auprès du capitaine Désiré.' : 'Commande auprès du capitaine Désiré : il tient aussi la terrasse.', 'info');
  };
  const commander = async (article: ArticleCarte) => {
    if (await service.commander(article, STATION_MARINA[article.id] ?? 'terrasse')) setCarte(false);
  };
  const enBalade = enCours?.etape === 'repas' && enCours.station === 'ponton';
  const postes = enCours ? (enCours.etape === 'servi' ? [enCours.station] : []) : ['mentor', 'kiosque'];
  const assise = enCours?.etape !== 'repas' ? null : enCours.station === 'ponton' ? assisePirogue : enCours.station === 'terrasse' ? ASSISE_TERRASSE : null;
  const servi = enCours && enCours.etape !== 'preparation' && enCours.station !== 'ponton' ? { station: enCours.station, article: enCours.article } : null;
  const decor = useMemo(() => <DecorMarina balade={enBalade && enCours ? { depuis: enCours.depuis, duree: dureeConsommation(enCours.article), assise: assisePirogue } : null} servi={servi} />,
    [enBalade, enCours?.depuis, servi?.station, servi?.article.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const statut = enCours ? (enCours.etape === 'preparation' ? (enCours.station === 'ponton' ? '🛶 Le capitaine prépare la pirogue et les gilets.' : `🥥 On prépare : ${enCours.article.nom.toLowerCase()}.`)
    : enCours.etape === 'servi' ? (enCours.station === 'ponton' ? '🛶 La pirogue est à quai : embarque.' : `C’est servi ${OU[enCours.station]} !`) : enBalade ? '🌊 Le tour de la lagune…' : 'Un moment face à la lagune…')
    : '🛶 Le capitaine Désiré emmène faire le tour de la lagune en pirogue.';
  const echap = () => { if (carte) { setCarte(false); return true; } return false; };
  const texteService = enCours && (enCours.etape === 'preparation' ? `En préparation : ${enCours.article.nom.toLowerCase()}…`
    : enCours.etape === 'servi' ? (enCours.station === 'ponton' ? 'La pirogue t’attend au bout du grand ponton.' : `${enCours.article.nom} servi ${OU[enCours.station]}.`)
    : enBalade ? 'En pirogue sur la lagune…' : `${enCours.article.nom} : savoure.`);
  return <InterieurLieuVie lieu={MARINA} heure={heure} decor={decor} hote={{ prof: false, variante: 3, nom: MARINA.hote.nom }} postes={postes} assise={assise} statut={statut}
    libelleHote={`🛶 Voir le capitaine · ${MARINA.hote.nom}`} onPoste={surPoste} onSortir={() => { service.emporter(); onSortir(); }} onEchap={echap} onAttendre={() => passerA(MARINA.horaires.ouverture)}>
    {carte && <PanneauCarte lieu={MARINA} besoins={besoins} argent={argent} demo={demo} libelleAction={a => a.id === 'pirogue' ? 'Réserver' : 'Commander'}
      salutation="Bienvenue à bord ! Une coco bien fraîche, des brochettes en terrasse, ou le tour de la lagune avec moi ?"
      enCours={service.enCours} erreur={service.erreur} onCommander={commander} onFermer={() => setCarte(false)} />}
    {enCours && texteService && <BandeauService texte={texteService} progression={service.progression} />}
    {children}
  </InterieurLieuVie>;
}
