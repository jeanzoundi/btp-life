import {describe,it,expect} from 'vitest';
import {SALLES_CAMPUS,MURS_CAMPUS,MOBILIER_CAMPUS,libreCampus,trajetCampus,hauteurEscalier,HAUTEUR_CAMPUS} from './campus-universitaire';
describe('campus navigable',()=>{
  it('rejoint chaque salle depuis le hall sans traverser les murs ni le mobilier',()=>{
    for(const salle of SALLES_CAMPUS){
      expect(libreCampus(salle.x,salle.z,salle.etage),salle.id).toBe(true);
      const route=trajetCampus({x:0,z:10,etage:0},salle);
      expect(route.length,salle.id).toBeGreaterThan(0);
      expect(route.at(-1)).toMatchObject({x:salle.x,z:salle.z,etage:salle.etage});
      for(const p of route)expect(libreCampus(p.x,p.z,p.etage),`${salle.id}: ${p.x},${p.z}`).toBe(true);
      if(salle.etage===1)expect(route.some(p=>p.escalier)).toBe(true);
    }
  });
  it('permet de revenir au hall depuis toutes les salles',()=>{
    for(const s of SALLES_CAMPUS)expect(trajetCampus(s,{x:0,z:10,etage:0}).length,s.id).toBeGreaterThan(0);
  });
  it('bloque les centres des murs et du mobilier et les bords du campus',()=>{
    for(const o of [...MURS_CAMPUS,...MOBILIER_CAMPUS])expect(libreCampus(o.x,o.z,o.etage)).toBe(false);
    expect(libreCampus(25,10,0)).toBe(false);
  });
  it('raccorde exactement les deux planchers avec une pente continue',()=>{
    expect(hauteurEscalier(0,5)).toBe(0);expect(hauteurEscalier(0,-5)).toBe(HAUTEUR_CAMPUS);
    expect(hauteurEscalier(0,0)).toBe(HAUTEUR_CAMPUS/2);expect(hauteurEscalier(3,0)).toBeNull();
  });
});
