'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { ArticleCarte, Besoins } from '@/lib/lieux-vie';
import { ASSISE_AZUR, AZUR } from '@/lib/lieux-vie/azur';
import { DecorAzur } from './decors-loisirs';
import { InterieurLieuVie } from './interieur-lieu-vie';
import { PanneauCabine } from './panneaux-loisirs';
import { BandeauService, PanneauCarte } from './panneaux-lieux-vie';
import { useServiceLieu, type ProprietesServiceLieu } from './service-lieu';

/** Le centre commercial : l'espace restauration de Mireille, et la cabine d'essayage branchée sur ta vraie garde-robe. */
export function LieuAzur({ demo, heure, besoins, argent, consommer, notifier, passerA, onSortir, children }: ProprietesServiceLieu & {
  demo: boolean; heure: number; besoins: Besoins; argent: number;
  passerA: (heure: number) => void; onSortir: () => void; children?: ReactNode;
}) {
  const [panneau, setPanneau] = useState<'carte' | 'cabine' | null>(null);
  const service = useServiceLieu<'table'>({ hote: AZUR.hote.nom, consommer, notifier, libelleStation: () => 'à ta table' });
  const enCours = service.service;

  const surPoste = (station: string) => {
    if (station === 'mentor' || station === 'comptoir') {
      if (enCours) notifier(enCours.etape === 'preparation' ? 'Mireille s’en occupe, ça arrive.' : 'C’est servi à ta table.', 'info');
      else { service.setErreur(null); setPanneau('carte'); }
      return;
    }
    if (station === 'cabine') { setPanneau('cabine'); return; }
    if (station !== 'table') return;
    if (enCours?.etape === 'servi') service.sAttabler('table');
    else if (!enCours) notifier('Commande d’abord à l’espace restauration, auprès de Mireille.', 'info');
  };
  const commander = async (article: ArticleCarte) => {
    if (await service.commander(article, 'table')) setPanneau(null);
  };
  const postes = enCours ? (enCours.etape === 'servi' ? ['table'] : []) : ['mentor', 'cabine'];
  const assise = enCours?.etape === 'repas' ? ASSISE_AZUR : null;
  const servi = enCours && enCours.etape !== 'preparation' ? enCours.article : null;
  const decor = useMemo(() => <DecorAzur servi={servi} />, [servi?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const statut = enCours ? (enCours.etape === 'preparation' ? `🍽 Mireille prépare : ${enCours.article.nom.toLowerCase()}.` : enCours.etape === 'servi' ? 'C’est servi à ta table !' : 'Une pause au frais…')
    : '🛍 Espace restauration au fond, Boutique Lagune et sa cabine d’essayage à gauche.';
  const echap = () => { if (panneau) { setPanneau(null); return true; } return false; };
  const texteService = enCours && (enCours.etape === 'preparation' ? `En préparation : ${enCours.article.nom.toLowerCase()}…` : enCours.etape === 'servi' ? `${enCours.article.nom} servi à ta table : va t’asseoir.` : `${enCours.article.nom} : savoure.`);
  return <InterieurLieuVie lieu={AZUR} heure={heure} decor={decor} hote={{ prof: true, variante: 0, nom: AZUR.hote.nom }} postes={postes} assise={assise} statut={statut}
    onPoste={surPoste} onSortir={() => { service.emporter(); onSortir(); }} onEchap={echap} onAttendre={() => passerA(AZUR.horaires.ouverture)}>
    {panneau === 'carte' && <PanneauCarte lieu={AZUR} besoins={besoins} argent={argent} demo={demo} salutation="Bonjour ! Installe-toi au frais : qu’est-ce qui te ferait plaisir ?"
      enCours={service.enCours} erreur={service.erreur} onCommander={commander} onFermer={() => setPanneau(null)} />}
    {panneau === 'cabine' && <PanneauCabine demo={demo} onFermer={() => setPanneau(null)} />}
    {enCours && texteService && <BandeauService texte={texteService} progression={service.progression} />}
    {children}
  </InterieurLieuVie>;
}
