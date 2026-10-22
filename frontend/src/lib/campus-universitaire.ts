export type NiveauCampus = 0 | 1;
export type PointCampus = { x: number; z: number; etage: NiveauCampus; escalier?: boolean };
export type UsageCampus = 'cours' | 'bim' | 'livres' | 'bureau' | 'cafe' | 'atelier' | 'jardin' | 'sante' | 'sanitaires' | 'club';
export type SalleCampus = PointCampus & { id: string; label: string; detail: string; usage: UsageCampus; responsable: string; couleur: string; cx: number; cz: number; largeur: number; profondeur: number };
export const HAUTEUR_CAMPUS = 4.8;
function salle(id:string,label:string,usage:UsageCampus,cx:number,cz:number,etage:NiveauCampus,responsable:string,couleur:string):SalleCampus {
  return {id,label,usage,cx,cz,etage,responsable,couleur,largeur:16,profondeur:14,x:cx<0?-10:10,z:cz,detail:`${label} · ${responsable}`};
}
export const SALLES_CAMPUS:SalleCampus[] = [
  salle('accueil','Accueil & scolarité','bureau',-16,10,0,'Mme Amani · orientation','#c5a36b'),
  salle('amphi','Amphithéâtre A','cours',-16,-10,0,'Pr Kouamé · structures','#4a8085'),
  salle('atelier','Laboratoire matériaux','atelier',16,-10,0,'Pr Traoré · matériaux','#bc8159'),
  salle('cafeteria','Restaurant universitaire','cafe',16,10,0,'Aïcha · restauration','#8a9e6b'),
  salle('sante','Infirmerie','sante',-16,26,0,'Mme Koné · accueil santé','#7badab'),
  salle('sanitaires','Sanitaires & vestiaires','sanitaires',16,26,0,'Services du campus','#8b9ca9'),
  {id:'cour',label:'Jardin & agora',usage:'jardin',cx:0,cz:22,largeur:12,profondeur:12,x:0,z:18,etage:0,responsable:'Fatou · association étudiante',couleur:'#77966b',detail:'Jardin & agora · Fatou, association étudiante'},
  salle('classe','TD 101 · génie civil','cours',-16,-10,1,'Pr Diallo · génie civil','#4a8085'),
  salle('bim','Laboratoire BIM','bim',16,-10,1,'Pr N’Guessan · coordination BIM','#578aa9'),
  salle('bibliotheque','Bibliothèque & lecture','livres',16,10,1,'Mme Bamba · documentation','#af9569'),
  salle('cowork','Atelier architecture','atelier',-16,10,1,'Pr Coulibaly · conception','#b58a71'),
  salle('profs','Salle des professeurs','bureau',-16,26,1,'Pr Yao · tutorat','#9087a9'),
  salle('club','Maison des étudiants','club',16,26,1,'Koffi · projets étudiants','#aa7c6d'),
  {id:'administration',label:'Direction pédagogique',usage:'bureau',cx:0,cz:-14,largeur:12,profondeur:8,x:0,z:-11,etage:0,responsable:'Dr Assi · direction',couleur:'#b49d76',detail:'Direction pédagogique · Dr Assi'},
  {id:'informatique',label:'Salle informatique',usage:'bim',cx:0,cz:-14,largeur:12,profondeur:8,x:0,z:-11,etage:1,responsable:'M. Bakayoko · informatique',couleur:'#688ca3',detail:'Salle informatique · M. Bakayoko'},
  {id:'terrasse',label:'Terrasse de lecture',usage:'jardin',cx:0,cz:22,largeur:12,profondeur:12,x:0,z:18,etage:1,responsable:'Espace calme',couleur:'#77966b',detail:'Terrasse de lecture · Espace calme'},
];
export type ObstacleCampus={x:number;z:number;w:number;d:number;etage:NiveauCampus;type:'mur'|'meuble';h:number;couleur:string};
export type MeubleCampus=ObstacleCampus & {typeMeuble:'table'|'rayon'|'comptoir'|'lit'|'casier'|'banc'|'plante'|'lavabo'};
export function mobilierCampus(s:SalleCampus):MeubleCampus[]{
  const items:MeubleCampus[]=[];
  const ajouter=(x:number,z:number,w:number,d:number,h:number,typeMeuble:MeubleCampus['typeMeuble'],couleur='#b89a73')=>items.push({x:s.cx+x,z:s.cz+z,w,d,h,etage:s.etage,type:'meuble',typeMeuble,couleur});
  if(s.usage==='cours'||s.usage==='bim'||s.usage==='atelier'){
    const compact=s.largeur<14;
    for(const x of compact?[-3,3]:[-4,0,4])for(const z of compact?[0]:[-3,3])ajouter(x,z,2.5,1.2,.78,'table');
    if(!compact)ajouter(0,-5.5,3,1,.8,'table','#6a838b');
  }else if(s.usage==='livres'){
    for(const x of [-4,0,4])ajouter(x,-3,2.5,.8,2.3,'rayon');
    for(const x of [-3,3])ajouter(x,3,2.4,1.2,.78,'table');
  }else if(s.usage==='bureau'){
    ajouter(0,0,3.2,1.3,1,'comptoir');ajouter(3,-2,2.2,.7,2,'rayon');
  }else if(s.usage==='cafe'||s.usage==='club'){
    for(const x of [-3,3])for(const z of [-2,3])ajouter(x,z,2,1.2,.78,'table');
    ajouter(0,-5,6,1.3,1.1,'comptoir');
  }else if(s.usage==='sante'){
    for(const x of [-3,3])ajouter(x,-2,1.4,2.6,.6,'lit','#dde9e4');ajouter(2,4,2,1,.8,'table');
  }else if(s.usage==='sanitaires'){
    for(const x of [-4,0,4]){ajouter(x,-4,2,2,2.3,'casier','#80989b');ajouter(x,3,1.2,.8,.85,'lavabo','#e5ebe7');}
  }else{
    ajouter(0,1,2.2,2.2,2.6,'plante','#77966b');for(const x of [-3,3])ajouter(x,0,1,3,.45,'banc');
  }
  return items;
}
export const MOBILIER_CAMPUS=SALLES_CAMPUS.flatMap(mobilierCampus);
export const MURS_CAMPUS:ObstacleCampus[]=SALLES_CAMPUS.filter(s=>s.usage!=='jardin').flatMap(s=>{
  const mur=(x:number,z:number,w:number,d:number):ObstacleCampus=>({x,z,w,d,h:3.5,etage:s.etage,type:'mur',couleur:'#e2dfd2'});
  const l=s.largeur/2,p=s.profondeur/2;
  const murs=[mur(s.cx,s.cz-p,s.largeur,.25),mur(s.cx-l,s.cz,.25,s.profondeur),mur(s.cx+l,s.cz,.25,s.profondeur),mur(s.cx,s.cz+p,s.largeur,.25)];
  if(s.cx!==0){murs.splice(s.cx<0?2:1,1);const x=s.cx+(s.cx<0?l:-l);murs.push(mur(x,s.cz-(p+1.5)/2,.25,p-1.5),mur(x,s.cz+(p+1.5)/2,.25,p-1.5));}
  else{murs.pop();murs.push(mur(s.cx-(l+1.5)/2,s.cz+p,l-1.5,.25),mur(s.cx+(l+1.5)/2,s.cz+p,l-1.5,.25));}
  return murs;
});
const OBSTACLES=[...MURS_CAMPUS,...MOBILIER_CAMPUS];
export function libreCampus(x:number,z:number,etage:NiveauCampus,rayon=.32):boolean{
  if(x< -23.5+rayon||x>23.5-rayon||z< -17.5+rayon||z>32.5-rayon)return false;
  return !OBSTACLES.some(o=>o.etage===etage&&Math.abs(x-o.x)<o.w/2+rayon&&Math.abs(z-o.z)<o.d/2+rayon);
}
export function hauteurEscalier(x:number,z:number):number|null{return Math.abs(x)<=1.25&&z>=-5&&z<=5?(5-z)/10*HAUTEUR_CAMPUS:null;}
function cheminSol(depart:PointCampus,arrivee:PointCampus):PointCampus[]{
  const sx=Math.round(depart.x),sz=Math.round(depart.z),tx=Math.round(arrivee.x),tz=Math.round(arrivee.z),cle=(x:number,z:number)=>`${x},${z}`;
  const queue:Array<[number,number]>=[[sx,sz]],parents=new Map<string,[number,number]|null>([[cle(sx,sz),null]]);
  let trouve=false;
  for(let i=0;i<queue.length;i++){
    const [x,z]=queue[i];if(x===tx&&z===tz){trouve=true;break;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=cle(nx,nz);
      if(parents.has(k)||!libreCampus(nx,nz,depart.etage,.4))continue;
      if(Math.abs(nx)<2&&nz>-5&&nz<5)continue;
      parents.set(k,[x,z]);queue.push([nx,nz]);
    }
  }
  if(!trouve)return [];
  const route:PointCampus[]=[];let c:[number,number]|null=[tx,tz];
  while(c){route.unshift({x:c[0],z:c[1],etage:depart.etage});c=parents.get(cle(c[0],c[1]))??null;}
  route.shift();return route;
}
export function trajetCampus(depart:PointCampus,cible:PointCampus):PointCampus[]{
  if(depart.etage===cible.etage)return cheminSol(depart,cible);
  const entree:PointCampus={x:0,z:depart.etage===0?5:-5,etage:depart.etage};
  const sortie:PointCampus={x:0,z:cible.etage===1?-5:5,etage:cible.etage};
  const approche=cheminSol(depart,entree),suite=cheminSol(sortie,cible);
  if((!approche.length&&Math.hypot(depart.x-entree.x,depart.z-entree.z)>.5)||(!suite.length&&Math.hypot(cible.x-sortie.x,cible.z-sortie.z)>.5))return [];
  return [...approche,{...sortie,escalier:true},...suite];
}
