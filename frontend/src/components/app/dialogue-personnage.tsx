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
  return <section role="dialog" aria-label={`Conversation avec ${nom}`} className="absolute bottom-24 right-3 z-20 max-h-[65%] w-80 max-w-[calc(100%_-_24px)] overflow-y-auto rounded-2xl border border-amber-200/30 bg-[#152b30]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold" style={{ backgroundColor: habitant.couleur }}>{nom[0]}</span><div className="flex-1"><h2 className="font-bold">{nom}</h2><p className="text-xs text-white/60">{habitant.metier}</p></div><button aria-label="Terminer la conversation" onClick={onClose} className="rounded-lg bg-white/10 px-3 py-2">✕</button></div>
    <p className="mt-3 text-xs text-amber-200">{affinite === 0 ? 'Première rencontre' : affinite < 3 ? 'Connaissance' : 'Relation amicale'} · Affinité {affinite}/100</p>
    <p role="status" className="my-4 rounded-xl bg-white/10 p-3 text-sm leading-relaxed">{reponse}</p>
    <div className="space-y-2">
      <button disabled={salue} onClick={() => { setSalue(true); onLien(); setReponse('Merci de prendre le temps de discuter ! À bientôt dans le quartier.'); }} className="w-full rounded-xl bg-amber-200 p-3 text-left text-sm font-semibold text-slate-900 disabled:opacity-50">{salue ? 'Salutations échangées' : 'Faire connaissance'}</button>
      <button onClick={() => setReponse(habitant.conseil)} className="w-full rounded-xl border border-white/20 p-3 text-left text-sm hover:bg-white/10">Demander un conseil</button>
      {sujet && <button onClick={() => { setSituation(v => !v); setReponse(sujet.question); }} aria-expanded={situation} className="w-full rounded-xl border border-amber-200/40 p-3 text-left text-sm hover:bg-white/10">Discuter d’une situation du quartier</button>}
      {situation && sujet && <div className="space-y-2 rounded-xl bg-white/5 p-3"><p className="text-xs text-white/60">Choisis ta réponse · exercice de dialogue</p>{sujet.choix.map((texte, index) => <button key={texte} disabled={choixFait !== null} onClick={() => { setChoixFait(index); setReponse(sujet.reponses[index]); }} className="block w-full rounded-lg border border-white/20 p-3 text-left text-sm disabled:opacity-60">{choixFait === index ? '✓ ' : ''}{texte}</button>)}</div>}
      <button onClick={() => onLieu(habitant.lieu)} className="w-full rounded-xl border border-white/20 p-3 text-left text-sm hover:bg-white/10">Découvrir son activité →</button>
      <button onClick={onClose} className="w-full p-2 text-sm text-white/60">À bientôt !</button>
    </div>
  </section>;
}
