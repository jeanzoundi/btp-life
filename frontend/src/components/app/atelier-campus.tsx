'use client';
import { useState } from 'react';
import { SALLES_CAMPUS } from '@/lib/campus-universitaire';

const EXERCICES: Record<string, { question: string; choix: string[]; correct: number; explication: string }> = {
  bim: { question: 'Une gaine traverse une poutre porteuse. Quelle décision prendre ?', choix: ['Percer directement la poutre', 'Coordonner un nouveau passage avec le bureau structure', 'Masquer la gaine dans la vue'], correct: 1, explication: 'Un conflit géométrique doit être coordonné avec les disciplines concernées. Modifier une poutre exige une validation structurelle.' },
  atelier: { question: 'À quoi sert un essai de compression sur une éprouvette de béton ?', choix: ['Mesurer sa résistance à la compression', 'Mesurer uniquement sa couleur', 'Déterminer la longueur des armatures'], correct: 0, explication: 'La charge de rupture rapportée à la surface chargée permet de déterminer la résistance à la compression.' },
  default: { question: 'Avant de modifier un élément porteur, que faut-il faire ?', choix: ['Suivre uniquement son intuition', 'Vérifier les plans et obtenir une validation structurelle', 'Commencer et contrôler après'], correct: 1, explication: 'Les plans, les charges et les conséquences sur la structure doivent être examinés avant intervention.' },
};

export function AtelierCampus({ station, onReussite, dejaReussi=false }: { station: string; onReussite: () => void; dejaReussi?:boolean }) {
  const [onglet, setOnglet] = useState<'choix'|'dialogue'|'exercice'|'horaire'>('choix');
  const [reponse, setReponse] = useState<number|null>(null);
  const [termine, setTermine] = useState(dejaReussi);
  const salle=SALLES_CAMPUS.find(s=>s.id===station);
  const enseignement=!!salle&&['cours','bim','atelier','livres'].includes(salle.usage);
  const exercice = EXERCICES[station] ?? EXERCICES.default;
  const bouton = 'mt-2 w-full rounded-lg border border-white/20 bg-white/10 p-3 text-left text-sm hover:bg-white/20';
  return <div className="mt-3 rounded-xl border border-amber-200/30 p-3">
    <p className="text-sm font-bold text-amber-200">Sur place · Que souhaitez-vous faire ?</p>
    {onglet === 'choix' ? <>
      <button className={bouton} onClick={()=>setOnglet('dialogue')}>Parler au responsable</button>
      {enseignement&&<button className={bouton} onClick={()=>setOnglet('exercice')}>{termine?'Revoir l’exercice réussi':'Commencer un exercice guidé'}</button>}
      <button className={bouton} onClick={()=>setOnglet('horaire')}>Consulter le programme</button>
    </> : <>
      {onglet === 'dialogue' && <><p className="mt-3 text-sm">{salle?.responsable??'Responsable'} : « {salle?.usage==='cafe'?'Bienvenue au restaurant. Les étudiants se retrouvent ici entre les cours. La bibliothèque et les espaces de projet sont à l’étage.':salle?.usage==='sante'?'Bienvenue à l’infirmerie du campus. Cet espace de jeu représente le service de santé étudiant.':salle?.usage==='sanitaires'?'Les vestiaires et lavabos sont disponibles dans cette aile. Le couloir central dessert le restaurant et le jardin.':salle?.usage==='jardin'||salle?.usage==='club'?'Notre association organise des rencontres et des projets collectifs. Retrouvez les ateliers et les professeurs grâce au plan du campus.':'Bienvenue. Vous pouvez découvrir le programme ou mettre vos connaissances en pratique.'} »</p>{enseignement&&<button className={bouton} onClick={()=>setOnglet('exercice')}>Je veux pratiquer</button>}<button className={bouton} onClick={()=>setOnglet('horaire')}>Quels sont les prochains rendez-vous ?</button></>}
      {onglet === 'horaire' && <p className="mt-3 text-sm leading-7">Programme de démonstration<br/>09 h · Structures et matériaux<br/>11 h · Travaux dirigés<br/>14 h · Atelier BIM<br/>16 h · Revue de projets</p>}
      {onglet === 'exercice' && <><p className="mt-3 text-sm">{exercice.question}</p>{exercice.choix.map((texte,index)=><button key={texte} disabled={termine} className={bouton} onClick={()=>{setReponse(index); if(index===exercice.correct&&!termine){setTermine(true);onReussite();}}}>{texte}</button>)}{reponse!==null && <p role="status" className="mt-3 text-sm text-amber-100">{reponse===exercice.correct ? `Bonne réponse. ${exercice.explication}` : 'Cette décision ne convient pas. Réessayez en tenant compte de la sécurité structurelle.'}</p>}</>}
      <button className={bouton} onClick={()=>setOnglet('choix')}>Revenir aux options</button>
    </>}
    <p className="mt-3 text-[10px] text-white/50">Activités de démonstration ; réussites limitées à cette visite.</p>
  </div>;
}
