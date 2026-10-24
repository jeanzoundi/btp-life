'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { ArticleCarte, Besoins, LieuVie } from '@/lib/lieux-vie';
import { ASSISE_COIFFEUR, BOUTIQUE_DE, BOUTIQUES, GALERIE, type BoutiqueGalerie } from '@/lib/lieux-vie/galerie';
import { DecorGalerie } from './decors-loisirs';
import { InterieurLieuVie } from './interieur-lieu-vie';
import { PanneauVitrine } from './panneaux-loisirs';
import { BandeauService, PanneauCarte } from './panneaux-lieux-vie';
import { useServiceLieu, type ProprietesServiceLieu } from './service-lieu';

const ACCUEILS: Record<BoutiqueGalerie, string> = {
  coiffeur: 'Installe-toi, on va te faire une coupe nette pour lundi.',
  telephonie: 'Du crédit pour appeler la famille ? Je te charge ça tout de suite.',
  pressing: 'Une tenue à faire repasser ? Elle sera prête avant que tu repartes.',
  patisserie: 'Bienvenue à la galerie ! Un café, une coupe, du crédit : tout se règle ici.',
};
const estBoutique = (station: string): station is BoutiqueGalerie => station in BOUTIQUES;

/** La galerie marchande : coiffeur, téléphonie, pressing, pâtisserie, et la vitrine qui expose tes vrais badges et certificats. */
export function LieuGalerie({ demo, heure, besoins, argent, niveau, consommer, notifier, passerA, onSortir, children }: ProprietesServiceLieu & {
  demo: boolean; heure: number; besoins: Besoins; argent: number; niveau: number;
  passerA: (heure: number) => void; onSortir: () => void; children?: ReactNode;
}) {
  const [panneau, setPanneau] = useState<{ type: 'carte'; boutique: BoutiqueGalerie | null } | { type: 'vitrine' } | null>(null);
  const { data: badges } = useQuery({ queryKey: ['badges', 'mine'], queryFn: () => api.get<unknown[]>('/users/me/badges'), enabled: !demo });
  const { data: certificats } = useQuery({ queryKey: ['certificats', 'mine'], queryFn: () => api.get<unknown[]>('/users/me/certificats'), enabled: !demo });
  const recompenses = demo ? 0 : (badges?.length ?? 0) + (certificats?.length ?? 0);
  const service = useServiceLieu<BoutiqueGalerie>({
    hote: a => BOUTIQUES[BOUTIQUE_DE[a.id]].nom, consommer, notifier, libelleStation: s => BOUTIQUES[s].role,
    annonceServi: s => BOUTIQUES[s.station].pret,
  });
  const enCours = service.service;

  const ouvrir = (boutique: BoutiqueGalerie | null) => {
    if (enCours) { notifier(enCours.etape === 'preparation' ? `${BOUTIQUES[enCours.station].nom} s’occupe de toi.` : BOUTIQUES[enCours.station].pret, 'info'); return; }
    service.setErreur(null); setPanneau({ type: 'carte', boutique });
  };
  const surPoste = (station: string) => {
    if (station === 'vitrine') { setPanneau({ type: 'vitrine' }); return; }
    // Madame Brou tient la pâtisserie : son comptoir est aussi celui où l'on récupère sa commande.
    const boutique = station === 'mentor' ? 'patisserie' : station;
    if (!estBoutique(boutique)) return;
    if (enCours?.etape === 'servi' && enCours.station === boutique) { service.sAttabler(boutique); return; }
    ouvrir(station === 'mentor' ? null : boutique);
  };
  const commander = async (article: ArticleCarte) => {
    if (await service.commander(article, BOUTIQUE_DE[article.id])) setPanneau(null);
  };
  const lieuCarte = (boutique: BoutiqueGalerie | null): LieuVie => !boutique ? GALERIE
    : { ...GALERIE, hote: { nom: BOUTIQUES[boutique].nom, role: BOUTIQUES[boutique].role }, carte: GALERIE.carte.filter(a => BOUTIQUE_DE[a.id] === boutique) };
  const postes = enCours ? (enCours.etape === 'servi' ? [enCours.station] : []) : ['mentor', 'coiffeur', 'pressing', 'telephonie', 'vitrine'];
  const assise = enCours?.etape === 'repas' && enCours.station === 'coiffeur' ? ASSISE_COIFFEUR : null;
  const pret = enCours && enCours.etape !== 'preparation' ? { boutique: enCours.station, article: enCours.article } : null;
  const decor = useMemo(() => <DecorGalerie recompenses={recompenses} pret={pret} />, [recompenses, pret?.boutique, pret?.article.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const statut = enCours ? (enCours.etape === 'preparation' ? `✂️ ${BOUTIQUES[enCours.station].nom} s’occupe de toi : ${enCours.article.nom.toLowerCase()}.` : enCours.etape === 'servi' ? BOUTIQUES[enCours.station].pret : `${enCours.article.nom}…`)
    : recompenses ? `🏅 ${recompenses} réussite${recompenses > 1 ? 's' : ''} exposée${recompenses > 1 ? 's' : ''} dans la vitrine.` : '🏅 La vitrine des réussites attend ta première médaille.';
  const echap = () => { if (panneau) { setPanneau(null); return true; } return false; };
  const texteService = enCours && (enCours.etape === 'preparation' ? `${BOUTIQUES[enCours.station].nom} : ${enCours.article.nom.toLowerCase()}…` : enCours.etape === 'servi' ? BOUTIQUES[enCours.station].pret : `${enCours.article.nom} : un moment…`);
  return <InterieurLieuVie lieu={GALERIE} heure={heure} decor={decor} hote={{ prof: false, variante: 1, nom: GALERIE.hote.nom }} postes={postes} assise={assise} statut={statut}
    libelleHote={`🧾 Voir les services · ${GALERIE.hote.nom}`} onPoste={surPoste} onSortir={() => { service.emporter(); onSortir(); }} onEchap={echap} onAttendre={() => passerA(GALERIE.horaires.ouverture)}>
    {panneau?.type === 'carte' && <PanneauCarte lieu={lieuCarte(panneau.boutique)} besoins={besoins} argent={argent} demo={demo} salutation={ACCUEILS[panneau.boutique ?? 'patisserie']}
      libelleAction={a => a.categorie === 'service' ? 'Demander' : 'Commander'} enCours={service.enCours} erreur={service.erreur} onCommander={commander} onFermer={() => setPanneau(null)} />}
    {panneau?.type === 'vitrine' && <PanneauVitrine demo={demo} niveau={niveau} onFermer={() => setPanneau(null)} />}
    {enCours && texteService && <BandeauService texte={texteService} progression={service.progression} />}
    {children}
  </InterieurLieuVie>;
}
