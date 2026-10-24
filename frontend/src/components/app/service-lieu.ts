'use client';

import { useEffect, useState } from 'react';
import type { ArticleCarte, OptionsArticle } from '@/lib/lieux-vie';
import type { TypeNotification } from './hud-monde';

/** Article payé : ce que le serveur (ou la démonstration) a répondu, et de quoi appliquer ses effets aux jauges une fois consommé. */
export interface ConsommationLieu { message: string; coutPaye: number; appliquer: () => void }

/** Ce qu'il faut à un lieu de vie : payer un article (serveur ou démonstration), prévenir le joueur. */
export interface ProprietesServiceLieu {
  consommer: (article: ArticleCarte, options: OptionsArticle) => Promise<ConsommationLieu>;
  notifier: (texte: string, type?: TypeNotification) => void;
}

export type EtapeService = 'preparation' | 'servi' | 'repas';
export interface ServiceEnCours<S extends string> { article: ArticleCarte; station: S; options: OptionsArticle; etape: EtapeService; depuis: number; conso: ConsommationLieu }

/** Durée d'un repas, d'une boisson ou d'une activité, en secondes réelles. */
export const dureeConsommation = (article: ArticleCarte) => article.duree ?? (article.categorie === 'plat' ? 6 : article.categorie === 'activite' ? 8 : 4);

/** Le service d'un lieu de vie : on paie au comptoir, l'hôte prépare, c'est servi à la table choisie, on s'assoit et on consomme.
 * Les jauges ne bougent qu'une fois l'article consommé (ou emporté si l'on part avant). */
export function useServiceLieu<S extends string>({ hote, consommer, notifier, libelleStation, annonceServi, onTermine }: ProprietesServiceLieu & {
  /** Qui prépare : un nom, ou selon l'article quand chaque étal ou boutique a le sien. */
  hote: string | ((article: ArticleCarte) => string);
  libelleStation: (station: S) => string;
  /** Ce qu'on annonce quand c'est prêt (par défaut : « servi à ta table : va t'asseoir »). */
  annonceServi?: (service: ServiceEnCours<S>) => string;
  onTermine?: (service: ServiceEnCours<S>) => void;
}) {
  const [service, setService] = useState<ServiceEnCours<S> | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    if (!service) return;
    const minuteur = window.setInterval(() => setMaintenant(Date.now()), 200);
    return () => window.clearInterval(minuteur);
  }, [service]);
  const ecoule = service ? Math.max(0, (maintenant - service.depuis) / 1000) : 0;
  useEffect(() => {
    if (!service) return;
    if (service.etape === 'preparation' && ecoule >= service.article.preparation) {
      setService({ ...service, etape: 'servi', depuis: Date.now() });
      notifier(annonceServi?.(service) ?? `${service.article.nom} servi ${libelleStation(service.station)} : va t’asseoir.`, 'trajet');
    } else if (service.etape === 'repas' && ecoule >= dureeConsommation(service.article)) {
      service.conso.appliquer();
      notifier(service.conso.message, 'succes');
      setService(null);
      onTermine?.(service);
    }
  }, [ecoule, service]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Paie l'article ; renvoie vrai si la commande est partie en cuisine. */
  const commander = async (article: ArticleCarte, station: S, options: OptionsArticle = {}) => {
    if (service || enCours) return false;
    setEnCours(true); setErreur(null);
    try {
      const conso = await consommer(article, options);
      const maintenantCommande = Date.now();
      setMaintenant(maintenantCommande);
      setService({ article, station, options, etape: 'preparation', depuis: maintenantCommande, conso });
      notifier(`${typeof hote === 'function' ? hote(article) : hote} prépare : ${article.nom.toLowerCase()} (−${conso.coutPaye.toLocaleString('fr-FR')} F).`, 'trajet');
      return true;
    } catch (e) {
      setErreur((e as Error).message || 'Commande impossible pour l’instant.');
      return false;
    } finally { setEnCours(false); }
  };
  /** Le joueur arrive à la table où l'attend son plat. */
  const sAttabler = (station: S) => {
    if (service?.etape !== 'servi' || service.station !== station) return false;
    setMaintenant(Date.now());
    setService({ ...service, etape: 'repas', depuis: Date.now() });
    return true;
  };
  /** On part avant d'avoir fini : ce qui est payé est emporté, ses effets comptent quand même. */
  const emporter = () => {
    if (!service) return;
    service.conso.appliquer();
    notifier(`Tu emportes ton ${service.article.nom.toLowerCase()}.`, 'info');
    setService(null);
  };
  const progression = !service ? null : service.etape === 'preparation' ? Math.min(1, ecoule / Math.max(.5, service.article.preparation))
    : service.etape === 'repas' ? Math.min(1, ecoule / dureeConsommation(service.article)) : null;
  return { service, enCours, erreur, setErreur, commander, sAttabler, emporter, progression };
}
