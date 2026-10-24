'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { Besoins } from '@/lib/lieux-vie';
import { ASSISES_MAQUIS, COLLEGUES_PRESENTS, MAQUIS, NOUVELLES, nouvelleDuRepas, type Nouvelle } from '@/lib/lieux-vie/maquis';
import { DecorMaquis } from './decors-lieux-vie';
import { InterieurLieuVie } from './interieur-lieu-vie';
import { BandeauService, PanneauCarte, PanneauNouvelle } from './panneaux-lieux-vie';
import { useServiceLieu, type ProprietesServiceLieu } from './service-lieu';

type TableMaquis = 'table' | 'collegues';
const OU: Record<TableMaquis, string> = { table: 'à ta table', collegues: 'chez les collègues' };

/** Le maquis : commander au comptoir, manger à sa table ou avec les collègues du chantier, qui racontent les nouvelles du quartier. */
export function LieuMaquis({ demo, heure, besoins, argent, consommer, notifier, passerA, allerVers, onSortir, children }: ProprietesServiceLieu & {
  demo: boolean; heure: number; besoins: Besoins; argent: number;
  passerA: (heure: number) => void; allerVers: (slug: string) => void; onSortir: () => void; children?: ReactNode;
}) {
  const presents = COLLEGUES_PRESENTS(heure);
  const [carte, setCarte] = useState(false);
  const [avecCollegues, setAvecCollegues] = useState(true);
  const [nouvelle, setNouvelle] = useState<Nouvelle | null>(null);
  const [mainsLavees, setMainsLavees] = useState(false);
  const rang = useRef(Math.floor(Math.random() * NOUVELLES.length));
  const besoinsRef = useRef(besoins);
  besoinsRef.current = besoins;
  const service = useServiceLieu<TableMaquis>({
    hote: MAQUIS.hote.nom, consommer, notifier, libelleStation: s => OU[s],
    // À la table des collègues, le repas se finit sur la nouvelle du jour.
    onTermine: s => { if (s.options.tablee) setNouvelle(nouvelleDuRepas(besoinsRef.current, rang.current++)); },
  });
  const enCours = service.service;

  const surPoste = (station: string) => {
    if (station === 'mentor' || station === 'comptoir') {
      if (enCours) notifier(enCours.etape === 'preparation' ? 'C’est en cuisine, ça arrive !' : `Ton plat t’attend ${OU[enCours.station]}.`, 'info');
      else { service.setErreur(null); setCarte(true); }
      return;
    }
    if (station === 'lave-mains') { setMainsLavees(true); notifier('Mains lavées au savon : Tantie Bintou approuve.', 'succes'); return; }
    if (station !== 'table' && station !== 'collegues') return;
    if (enCours?.etape === 'servi') {
      if (!service.sAttabler(station)) notifier(`Ton plat t’attend ${OU[enCours.station]}.`, 'info');
      else if (!mainsLavees) notifier('« Les mains d’abord ! » lance Tantie Bintou en riant. Bon appétit quand même.', 'info');
      return;
    }
    if (station === 'collegues') notifier(presents ? 'Les collègues te font une place : commande au comptoir, « avec les collègues ».' : 'Les collègues sont au chantier : ils mangent ici à midi et après 17 h.', 'info');
    else notifier('Commande d’abord au comptoir, auprès de Tantie Bintou.', 'info');
  };
  const commander = async (article: Parameters<typeof service.commander>[0]) => {
    const tablee = avecCollegues && presents;
    if (await service.commander(article, tablee ? 'collegues' : 'table', { tablee })) setCarte(false);
  };
  const postes = enCours ? (enCours.etape === 'servi' ? [enCours.station] : enCours.etape === 'preparation' && !mainsLavees ? ['lave-mains'] : []) : ['mentor'];
  const assise = enCours?.etape === 'repas' ? ASSISES_MAQUIS[enCours.station] : null;
  const nuit = heure >= 18.5 || heure < 6;
  const servi = enCours && enCours.etape !== 'preparation' ? { station: enCours.station, article: enCours.article } : null;
  const decor = useMemo(() => <DecorMaquis nuit={nuit} collegues={presents} servi={servi} enCuisine={enCours?.etape === 'preparation'} />,
    [nuit, presents, servi?.station, servi?.article.id, enCours?.etape]); // eslint-disable-line react-hooks/exhaustive-deps
  const statut = enCours ? (enCours.etape === 'preparation' ? `🍳 Tantie Bintou prépare : ${enCours.article.nom.toLowerCase()}.` : enCours.etape === 'servi' ? `🍽 C’est servi ${OU[enCours.station]} !` : '😋 Bon appétit…')
    : presents ? '👷 Les collègues du chantier sont à leur table.' : 'Les collègues du chantier passent à midi et après 17 h.';
  const salutation = presents ? 'Bonjour ! Les gars du chantier sont déjà là. Qu’est-ce que je te sers aujourd’hui ?' : 'Bonjour ! Assieds-toi, je t’apporte ça. Qu’est-ce qui te ferait plaisir ?';
  const echap = () => {
    if (nouvelle) { setNouvelle(null); return true; }
    if (carte) { setCarte(false); return true; }
    return false;
  };
  const texteService = enCours && (enCours.etape === 'preparation' ? `En cuisine : ${enCours.article.nom.toLowerCase()}…` : enCours.etape === 'servi' ? `${enCours.article.nom} servi ${OU[enCours.station]} : va t’asseoir.` : `${enCours.article.nom} : bon appétit !`);
  return <InterieurLieuVie lieu={MAQUIS} heure={heure} decor={decor} hote={{ identite: 'fatou', nom: MAQUIS.hote.nom }} postes={postes} assise={assise} statut={statut}
    onPoste={surPoste} onSortir={() => { service.emporter(); onSortir(); }} onEchap={echap} onAttendre={() => passerA(MAQUIS.horaires.ouverture)}>
    {carte && <PanneauCarte lieu={MAQUIS} besoins={besoins} argent={argent} demo={demo} salutation={salutation} tablee={{ choisie: avecCollegues, presents }} onTablee={setAvecCollegues}
      enCours={service.enCours} erreur={service.erreur} onCommander={commander} onFermer={() => setCarte(false)} />}
    {enCours && texteService && <BandeauService texte={texteService} progression={service.progression} />}
    {nouvelle && <PanneauNouvelle nouvelle={nouvelle} onAller={() => { setNouvelle(null); allerVers(nouvelle.lieu); }} onFermer={() => setNouvelle(null)} />}
    {children}
  </InterieurLieuVie>;
}
