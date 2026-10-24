'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { ArticleCarte, Besoins } from '@/lib/lieux-vie';
import { ASSISES_CAFE, CAFE, conseilsObtenus, conversationDu, POINTS_RELATION, POINTS_TOURNEE, PROFESSIONNELS, RESEAU_PRESENT, type Professionnel } from '@/lib/lieux-vie/cafe';
import type { SituationTerrain } from '@/lib/programme-chantier';
import { DecorCafe } from './decors-lieux-vie';
import { InterieurLieuVie } from './interieur-lieu-vie';
import { TacheChantier } from './panneau-journee-chantier';
import { BandeauService, PanneauAnnonces, PanneauCarte, PanneauReseau } from './panneaux-lieux-vie';
import { useServiceLieu, type ProprietesServiceLieu } from './service-lieu';

type TableCafe = 'table' | 'reseau';
const OU: Record<TableCafe, string> = { table: 'à ta table', reseau: 'à la table du réseau' };

/** Le café : une boisson au comptoir, le tableau des vraies offres d'emploi, et la table où l'on se fait un réseau. */
export function LieuCafe({ demo, heure, besoins, argent, niveau, relations, onRelation, consommer, notifier, passerA, onSortir, children }: ProprietesServiceLieu & {
  demo: boolean; heure: number; besoins: Besoins; argent: number; niveau: number;
  /** Relations du joueur (gardées dans l'état du monde) et leur mise à jour. */
  relations: Record<string, number>; onRelation: (nom: string, valeur: number) => void;
  passerA: (heure: number) => void; onSortir: () => void; children?: ReactNode;
}) {
  const presents = RESEAU_PRESENT(heure);
  const [panneau, setPanneau] = useState<'carte' | 'reseau' | 'annonces' | null>(null);
  const [conversation, setConversation] = useState<{ pro: Professionnel; situation: SituationTerrain } | null>(null);
  const [dejaVus, setDejaVus] = useState<string[]>([]);
  const relationsRef = useRef(relations);
  relationsRef.current = relations;
  const service = useServiceLieu<TableCafe>({
    hote: CAFE.hote.nom, consommer, notifier, libelleStation: s => OU[s],
    onTermine: s => {
      if (s.article.id !== 'tournee') return;
      for (const pro of PROFESSIONNELS) onRelation(pro.nom, Math.min(100, (relationsRef.current[pro.nom] ?? 0) + POINTS_TOURNEE));
      notifier(`Toute la table trinque avec toi : +${POINTS_TOURNEE} de relation avec chacun.`, 'succes');
    },
  });
  const enCours = service.service;

  const surPoste = (station: string) => {
    if (station === 'mentor' || station === 'comptoir') {
      if (enCours) notifier(enCours.etape === 'preparation' ? 'Kader s’en occupe, ça arrive.' : `C’est servi ${OU[enCours.station]}.`, 'info');
      else { service.setErreur(null); setPanneau('carte'); }
      return;
    }
    if (station === 'annonces') { setPanneau('annonces'); return; }
    if (station !== 'table' && station !== 'reseau') return;
    if (enCours?.etape === 'servi') { if (!service.sAttabler(station)) notifier(`C’est servi ${OU[enCours.station]}.`, 'info'); return; }
    if (station === 'reseau') { if (presents) setPanneau('reseau'); else notifier('La table du réseau est vide : ils passent à midi et après 17 h.', 'info'); return; }
    notifier('Commande d’abord au comptoir, auprès de Kader.', 'info');
  };
  const commander = async (article: ArticleCarte) => {
    const tournee = article.id === 'tournee';
    if (tournee && !presents) { service.setErreur('Personne à la table du réseau pour l’instant : ils passent à midi et après 17 h.'); return; }
    if (await service.commander(article, tournee ? 'reseau' : 'table')) setPanneau(null);
  };
  const parler = (pro: Professionnel) => { setConversation({ pro, situation: conversationDu(pro, relations[pro.nom] ?? 0) }); setPanneau(null); };
  const repondre = (choix: number) => {
    if (!conversation) return;
    const { pro, situation } = conversation, avant = relations[pro.nom] ?? 0;
    const apres = Math.min(100, avant + (situation.choix[choix]?.correct ? POINTS_RELATION.juste : POINTS_RELATION.autre));
    onRelation(pro.nom, apres);
    setDejaVus(v => [...v, pro.nom]);
    if (conseilsObtenus(pro, apres).length > conseilsObtenus(pro, avant).length) notifier(`${pro.nom.split(' ')[0]} te confie un conseil : regarde la table du réseau.`, 'succes');
  };
  const postes = enCours ? (enCours.etape === 'servi' ? [enCours.station] : []) : ['mentor', 'annonces', ...(presents ? ['reseau'] : [])];
  const assise = enCours?.etape === 'repas' ? ASSISES_CAFE[enCours.station] : null;
  const soir = heure >= 18 || heure < 7;
  const servi = enCours && enCours.etape !== 'preparation' ? { station: enCours.station, article: enCours.article } : null;
  const decor = useMemo(() => <DecorCafe soir={soir} servi={servi} professionnels={presents ? PROFESSIONNELS : []} />,
    [soir, presents, servi?.station, servi?.article.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const statut = enCours ? (enCours.etape === 'preparation' ? `☕ Kader prépare : ${enCours.article.nom.toLowerCase()}.` : enCours.etape === 'servi' ? `C’est servi ${OU[enCours.station]} !` : 'Un moment pour souffler…')
    : presents ? '🤝 L’architecte, le patron de PME et l’ingénieure sont à la table du réseau.' : 'Les pros du réseau passent à midi et après 17 h.';
  const echap = () => {
    if (conversation) { setConversation(null); setPanneau('reseau'); return true; }
    if (panneau) { setPanneau(null); return true; }
    return false;
  };
  const texteService = enCours && (enCours.etape === 'preparation' ? `Au comptoir : ${enCours.article.nom.toLowerCase()}…` : enCours.etape === 'servi' ? `${enCours.article.nom} servi ${OU[enCours.station]} : va t’asseoir.` : `${enCours.article.nom} : savoure.`);
  return <InterieurLieuVie lieu={CAFE} heure={heure} decor={decor} hote={{ identite: 'koffi', nom: CAFE.hote.nom }} postes={postes} assise={assise} statut={statut}
    onPoste={surPoste} onSortir={() => { service.emporter(); onSortir(); }} onEchap={echap} onAttendre={() => passerA(CAFE.horaires.ouverture)}>
    {panneau === 'carte' && <PanneauCarte lieu={CAFE} besoins={besoins} argent={argent} demo={demo} salutation={presents ? 'Salut ! La table du réseau est pleine ce soir. Je te sers quoi ?' : 'Salut ! Installe-toi, je te sers quoi ?'}
      enCours={service.enCours} erreur={service.erreur} onCommander={commander} onFermer={() => setPanneau(null)} />}
    {panneau === 'reseau' && <PanneauReseau professionnels={PROFESSIONNELS} relations={relations} dejaVus={dejaVus} onParler={parler} onFermer={() => setPanneau(null)} />}
    {panneau === 'annonces' && <PanneauAnnonces niveau={niveau} demo={demo} onFermer={() => setPanneau(null)} />}
    {conversation && <TacheChantier key={conversation.situation.id} etape={`Réseau · ${conversation.pro.nom}, ${conversation.pro.metier.toLowerCase()}`} situation={conversation.situation} onRepondre={repondre}
      onFermer={() => { setConversation(null); setPanneau('reseau'); }} />}
    {enCours && texteService && <BandeauService texte={texteService} progression={service.progression} />}
    {children}
  </InterieurLieuVie>;
}
