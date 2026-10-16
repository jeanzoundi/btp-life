'use client';

import { useState } from 'react';

const FICHES: Record<string, { titre: string; points: string[] }> = {
  accueil: { titre: 'Préparer sa visite', points: ['Identifier le projet et son interlocuteur', 'Vérifier la version du dossier', 'Préparer les questions à transmettre'] },
  poste: { titre: 'Revue du dossier projet', points: ['Vérifier les unités et les cotes', 'Comparer les plans architecture et structure', 'Repérer les points à faire valider par le responsable'] },
  reunion: { titre: 'Briefing de coordination', points: ['Comparer avancement et planning', 'Lister les interfaces entre les lots', 'Attribuer un responsable et une échéance à chaque action'] },
  plans: { titre: 'Lecture du plan pédagogique', points: ['Repérer les accès et la circulation', 'Contrôler la concordance des cotes', 'Signaler les réservations et conflits entre les lots'] },
  archives: { titre: 'Traçabilité du dossier', points: ['Relever la référence et la date', 'Identifier la version et le statut de validation', 'Associer la fiche technique ou le compte rendu correspondant'] },
  cours: { titre: 'Séquence de formation', points: ['Identifier l’objectif du cours', 'Consulter le support pédagogique', 'Noter les points à réviser'] },
  atelier: { titre: 'Exercice pratique', points: ['Lire la consigne avant manipulation', 'Choisir les outils adaptés', 'Contrôler le résultat obtenu'] },
  ressources: { titre: 'Documentation métier', points: ['Vérifier la date du document', 'Identifier sa source', 'Comparer avec la référence officielle applicable'] },
  comptoir: { titre: 'Accueil et service', points: ['Identifier la demande', 'Vérifier le service disponible', 'Confirmer le coût virtuel avant action'] },
  salle: { titre: 'Espace partagé', points: ['Repérer les places libres', 'Respecter les autres usagers', 'Laisser la zone propre'] },
  cuisine: { titre: 'Hygiène alimentaire', points: ['Nettoyer le plan de travail', 'Séparer les produits crus et cuits', 'Contrôler la conservation'] },
  terrasse: { titre: 'Espace extérieur', points: ['Maintenir les circulations libres', 'Contrôler la stabilité du mobilier', 'Signaler tout équipement endommagé'] },
  rayons: { titre: 'Choix des équipements', points: ['Comparer la fonction des produits', 'Vérifier les caractéristiques', 'Choisir selon le besoin réel'] },
  caisse: { titre: 'Validation de l’achat', points: ['Vérifier le produit sélectionné', 'Contrôler le prix virtuel', 'Confirmer avant la transaction'] },
  stock: { titre: 'Gestion du stock', points: ['Identifier la référence', 'Contrôler la quantité et l’état', 'Assurer la traçabilité du mouvement'] },
  guichet: { titre: 'Démarche au guichet', points: ['Préparer les pièces nécessaires', 'Vérifier les informations du dossier', 'Conserver la référence de suivi'] },
  conseil: { titre: 'Entretien conseil', points: ['Présenter clairement la demande', 'Noter les conditions proposées', 'Vérifier avant toute décision'] },
  essais: { titre: 'Contrôle des matériaux', points: ['Identifier l’échantillon', 'Suivre le protocole pédagogique', 'Consigner les observations sans inventer de résultat'] },
  analyse: { titre: 'Analyse pédagogique', points: ['Vérifier l’unité de mesure', 'Comparer aux critères du cours', 'Faire valider toute conclusion technique'] },
  briefing: { titre: 'Briefing chantier', points: ['Identifier les risques du jour', 'Vérifier les EPI nécessaires', 'Répartir les responsabilités'] },
  materiel: { titre: 'Contrôle du matériel', points: ['Faire un contrôle visuel', 'Vérifier les protections', 'Mettre hors service tout matériel douteux'] },
  controle: { titre: 'Inspection de zone', points: ['Sécuriser le périmètre', 'Comparer au plan et aux consignes', 'Consigner les écarts à faire valider'] },
  preparation: { titre: 'Préparation de commande', points: ['Lire la référence demandée', 'Contrôler la quantité', 'Préparer la zone d’expédition'] },
  expedition: { titre: 'Contrôle d’expédition', points: ['Comparer commande et colis', 'Vérifier l’état du chargement', 'Enregistrer la sortie'] },
  activite: { titre: 'Pratique de l’activité', points: ['Prendre connaissance des règles', 'Vérifier l’état des équipements', 'Respecter les autres participants'] },
  detente: { titre: 'Espace détente', points: ['Choisir une zone disponible', 'Garder les passages dégagés', 'Respecter la propreté du lieu'] },
  service: { titre: 'Services du lieu', points: ['Identifier le service recherché', 'Vérifier ses conditions', 'Utiliser l’activité depuis le panneau principal'] },
  amphi: { titre: 'Cours magistral', points: ['Identifier le thème du cours', 'Noter les notions essentielles', 'Préparer les questions au professeur'] },
  administration: { titre: 'Dossier étudiant', points: ['Vérifier les informations du dossier', 'Identifier les pièces manquantes', 'Conserver la référence de suivi'] },
  classe: { titre: 'Travail en classe', points: ['Lire l’objectif de la séance', 'Participer à l’exercice', 'Noter les points à approfondir'] },
  bim: { titre: 'Atelier BIM', points: ['Vérifier les unités de la maquette', 'Contrôler les niveaux et les objets', 'Signaler les conflits à faire valider'] },
  bibliotheque: { titre: 'Recherche documentaire', points: ['Définir le sujet recherché', 'Vérifier la source et la date', 'Comparer avec les références applicables'] },
};

export function FichePosteBureau({ station, onFermer }: { station: string; onFermer: () => void }) {
  const [coches, setCoches] = useState<number[]>([]);
  const fiche = FICHES[station] ?? FICHES.accueil;
  return <section aria-label={fiche.titre} className="mt-3 border-t border-white/20 pt-3">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-amber-200">{fiche.titre}</h3><button aria-label="Fermer la fiche" onClick={onFermer}>✕</button></div>
    {fiche.points.map((point, i) => <label key={point} className="mt-2 flex cursor-pointer items-start gap-2 text-xs leading-relaxed"><input className="mt-1" type="checkbox" checked={coches.includes(i)} onChange={() => setCoches(v => v.includes(i) ? v.filter(n => n !== i) : [...v, i])} />{point}</label>)}
    <p role="status" className="mt-2 text-xs text-amber-200">{coches.length} / {fiche.points.length} points parcourus</p>
    <p className="mt-2 text-[11px] text-white/60">Fiche pédagogique locale, non sauvegardée. Ne valide aucune mission et n’accorde aucune récompense.</p>
  </section>;
}
