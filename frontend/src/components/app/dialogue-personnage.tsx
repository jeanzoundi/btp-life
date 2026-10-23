'use client';

import { useState } from 'react';

export const HABITANTS = [
  { nom: 'Awa', metier: 'Architecte', couleur: '#b86c62', lieu: 'universite', conseil: 'Commence par comprendre les usages du bâtiment avant de dessiner. À l’université, tu peux renforcer tes compétences.', accueil: 'Bonjour ! Je prépare les plans d’un nouvel équipement pour le quartier.' },
  { nom: 'Yao', metier: 'Chef de chantier', couleur: '#4f76a1', lieu: 'chantier', conseil: 'Avant de lancer le travail, vérifie les accès, les protections et les consignes de l’équipe. Retrouve-moi au chantier.', accueil: 'Salut ! Une bonne préparation fait gagner beaucoup de temps sur le terrain.' },
  { nom: 'Mariam', metier: 'Entrepreneuse', couleur: '#886eaa', lieu: 'entreprise', conseil: 'Suis ton budget et organise tes équipes. La tour BTP Life rassemble les activités de ton entreprise.', accueil: 'Bienvenue ! Tu cherches à développer ton activité dans le quartier ?' },
  { nom: 'Koffi', metier: 'Fournisseur', couleur: '#4b8b79', lieu: 'fournisseur', conseil: 'Anticipe les quantités et les délais de livraison. Le dépôt te permet de préparer les approvisionnements.', accueil: 'Bonjour ! Je viens de passer au dépôt pour vérifier les livraisons.' },
  { nom: 'Fatou', metier: 'Voisine du quartier', couleur: '#d99b45', lieu: 'cafe', conseil: 'Pense aussi à souffler ! Un repas au maquis, du repos chez toi et des échanges au café font partie de la journée.', accueil: 'Salut ! Ça fait plaisir de croiser quelqu’un sur la place.' },
];

const SITUATIONS: Record<string, { question: string; choix: [string, string]; reponses: [string, string] }> = {
  Awa: { question: 'Les habitants demandent une place ombragée. Comment commencer le projet ?', choix: ['Écouter les usages et repérer les arbres existants', 'Dessiner immédiatement un grand parking'], reponses: ['Bonne approche : rencontrons les habitants avant de figer le plan. Retrouve les formations au campus.', 'Le stationnement peut être utile, mais il faut d’abord comprendre les besoins de la place.'] },
  Yao: { question: 'Une livraison arrive pendant que les piétons traversent l’accès au chantier.', choix: ['Suspendre la manœuvre et organiser le passage', 'Faire entrer le camion rapidement'], reponses: ['Exact. Il faut séparer les circulations et coordonner la manœuvre avant de reprendre.', 'Gagner quelques secondes ne justifie pas d’exposer les piétons. Reprenons l’organisation des accès.'] },
  Mariam: { question: 'Un nouveau contrat paraît intéressant, mais ton équipe est déjà occupée.', choix: ['Vérifier les capacités et négocier le planning', 'Promettre une livraison sans vérifier'], reponses: ['C’est une base solide : charge, budget et calendrier doivent rester cohérents.', 'Une promesse non vérifiée peut fragiliser les autres chantiers. Évaluons la capacité disponible.'] },
  Koffi: { question: 'Le matériau prévu est en rupture. Que faire avant un remplacement ?', choix: ['Faire valider une solution équivalente', 'Acheter le produit le moins cher'], reponses: ['Oui : compatibilité, exigences du projet et validation technique avant de commander.', 'Le prix seul ne suffit pas. Un remplacement doit respecter les exigences techniques.'] },
  Fatou: { question: 'Le quartier veut organiser une activité sur la promenade.', choix: ['Prévoir accès, ombre et collecte des déchets', 'Installer les stands au milieu du passage'], reponses: ['Merci ! Une activité réussie laisse une place à tout le monde. Le café est notre point de rencontre.', 'Gardons un passage accessible et dégagé. Nous pouvons revoir l’implantation ensemble.'] },
};

export function DialoguePersonnage({ nom, affinite, onLien, onLieu, onClose }: { nom: string; affinite: number; onLien: () => void; onLieu: (slug: string) => void; onClose: () => void }) {
  const habitant = HABITANTS.find(p => p.nom === nom)!;
  const [reponse, setReponse] = useState(habitant.accueil);
  const [salue, setSalue] = useState(false);
  const [situation, setSituation] = useState(false);
  const [choixFait, setChoixFait] = useState<number | null>(null);
  const sujet = SITUATIONS[nom];
  return <section role="dialog" aria-label={`Conversation avec ${nom}`} className="hud-verre absolute inset-x-3 bottom-3 z-20 mx-auto max-h-[65%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[360px]">
    <div className="flex items-center gap-3"><span className="hud-titre flex h-12 w-12 items-center justify-center rounded-full text-lg text-white ring-2 ring-jeu-or/60" style={{ backgroundColor: habitant.couleur }}>{nom[0]}</span><div className="flex-1"><h2 className="hud-titre text-lg leading-tight">{nom}</h2><p className="text-[12px] font-semibold text-jeu-ivoire/65">{habitant.metier}</p></div><button aria-label="Terminer la conversation" onClick={onClose} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button></div>
    <p className="hud-legende mt-3 text-jeu-or">{affinite === 0 ? 'Première rencontre' : affinite < 3 ? 'Connaissance' : 'Relation amicale'} · Affinité {affinite}/100</p>
    <p role="status" className="my-3 rounded-2xl rounded-tl-sm bg-white/[.08] p-3 text-sm leading-relaxed">{reponse}</p>
    <div className="space-y-2">
      <button disabled={salue} onClick={() => { setSalue(true); onLien(); setReponse('Merci de prendre le temps de discuter ! À bientôt dans le quartier.'); }} className="hud-bouton hud-bouton-principal w-full justify-start p-3 text-left text-sm">{salue ? 'Salutations échangées' : 'Faire connaissance'}</button>
      <button onClick={() => setReponse(habitant.conseil)} className="hud-bouton hud-bouton-verre w-full justify-start p-3 text-left text-sm">Demander un conseil</button>
      {sujet && <button onClick={() => { setSituation(v => !v); setReponse(sujet.question); }} aria-expanded={situation} className="hud-bouton hud-bouton-verre w-full justify-start p-3 text-left text-sm">Discuter d’une situation du quartier</button>}
      {situation && sujet && <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3"><p className="hud-legende">Choisis ta réponse · exercice de dialogue</p>{sujet.choix.map((texte, index) => <button key={texte} disabled={choixFait !== null} onClick={() => { setChoixFait(index); setReponse(sujet.reponses[index]); }} className="block w-full rounded-xl border border-white/15 bg-white/[.06] p-3 text-left text-sm font-semibold hover:border-jeu-or/50 disabled:opacity-60">{choixFait === index ? '✓ ' : ''}{texte}</button>)}</div>}
      <button onClick={() => onLieu(habitant.lieu)} className="hud-bouton hud-bouton-or w-full justify-start p-3 text-left text-sm">Découvrir son activité →</button>
      <button onClick={onClose} className="w-full p-2 text-sm font-semibold text-jeu-ivoire/55 hover:text-jeu-ivoire">À bientôt !</button>
    </div>
  </section>;
}
