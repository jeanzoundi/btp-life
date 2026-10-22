export type PointVille=[number,number];
export type EmpriseVille={x:number;z:number;largeur:number;profondeur:number};

/** Swept segment / expanded building rectangle: never cut diagonally through a corner. */
export function passageLibre(a:PointVille,b:PointVille,obstacles:EmpriseVille[],marge=.85){
  return !obstacles.some(o=>{
    const min=[o.x-o.largeur/2-marge,o.z-o.profondeur/2-marge];
    const max=[o.x+o.largeur/2+marge,o.z+o.profondeur/2+marge];
    let entree=0,sortie=1;
    for(let axe=0;axe<2;axe++){
      const d=b[axe]-a[axe];
      if(Math.abs(d)<1e-9){if(a[axe]<min[axe]||a[axe]>max[axe])return false;}
      else{const t1=(min[axe]-a[axe])/d,t2=(max[axe]-a[axe])/d;entree=Math.max(entree,Math.min(t1,t2));sortie=Math.min(sortie,Math.max(t1,t2));if(entree>sortie)return false;}
    }
    return sortie>=0&&entree<=1;
  });
}

export function itineraireVille(depart:PointVille,arrivee:PointVille,obstacles:EmpriseVille[]):PointVille[]{
  if(!passageLibre(arrivee,arrivee,obstacles)||!passageLibre(depart,depart,obstacles))return [];
  if(passageLibre(depart,arrivee,obstacles))return [arrivee];
  const points:PointVille[]=[depart,arrivee];
  for(const o of obstacles)for(const x of [-1,1])for(const z of [-1,1]){
    const p:PointVille=[o.x+x*(o.largeur/2+.95),o.z+z*(o.profondeur/2+.95)];
    if(passageLibre(p,p,obstacles))points.push(p);
  }
  const distances=points.map(()=>Infinity),parents=points.map(()=>-1),vus=new Set<number>();distances[0]=0;
  for(let tour=0;tour<points.length;tour++){
    let courant=-1;
    for(let i=0;i<points.length;i++)if(!vus.has(i)&&(courant<0||distances[i]<distances[courant]))courant=i;
    if(courant<0||!Number.isFinite(distances[courant]))return [];
    if(courant===1){const resultat:PointVille[]=[];for(let i=1;i!==0;i=parents[i]){if(i<0)return [];resultat.unshift(points[i]);}return resultat;}
    vus.add(courant);
    for(let j=0;j<points.length;j++)if(!vus.has(j)&&passageLibre(points[courant],points[j],obstacles)){
      const d=distances[courant]+Math.hypot(points[j][0]-points[courant][0],points[j][1]-points[courant][1]);
      if(d<distances[j]){distances[j]=d;parents[j]=courant;}
    }
  }
  return [];
}

export function phaseSignal(secondes:number,axe:'horizontal'|'vertical'):'vert'|'orange'|'rouge'{
  const t=((secondes%16)+16)%16;
  const phase=axe==='horizontal'?t:(t+8)%16;
  return phase<6?'vert':phase<7?'orange':'rouge';
}
