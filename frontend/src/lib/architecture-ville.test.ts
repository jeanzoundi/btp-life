import { describe, expect, it } from 'vitest';
import { construireArchitecture } from './architecture-ville';

describe('architecture regroupée', () => {
  it('conserve un volume de bâtiment et regroupe des centaines de détails en deux lots le jour', () => {
    const plan=construireArchitecture(17,8,12,'campus','#d8c092',false,false);
    expect(plan.solides[0]).toMatchObject({position:[0,4,0],taille:[17,8,12]});
    expect(plan.solides.length+plan.vitres.length).toBeGreaterThan(200);
    expect(Object.values(plan).filter(lot=>lot.length).length).toBe(2);
    for(const lot of Object.values(plan))for(const bloc of lot){
      expect(bloc.position.every(Number.isFinite)).toBe(true);
      expect(bloc.taille.every(n=>n>0)).toBe(true);
    }
  });
  it('préserve les quatre faces sans déplacer les fenêtres', () => {
    const plan=construireArchitecture(10,4.6,8,'commerce','#abc',false,false);
    expect(plan.vitres.some(b=>Math.abs(b.position[2]-4.14)<1e-8)).toBe(true);
    expect(plan.vitres.some(b=>Math.abs(b.position[2]+4.14)<1e-8)).toBe(true);
    expect(plan.vitres.some(b=>Math.abs(b.position[0]-5.14)<1e-8)).toBe(true);
    expect(plan.vitres.some(b=>Math.abs(b.position[0]+5.14)<1e-8)).toBe(true);
  });
  it('dégage la devanture et conserve les autres faces', () => {
    const avant=construireArchitecture(10,4.6,8,'commerce','#abc',false,false);
    const apres=construireArchitecture(10,4.6,8,'commerce','#abc',true,false);
    expect(avant.vitres.length-apres.vitres.length).toBe(4);
    expect(apres.vitres.some(b=>Math.abs(b.position[2]-4.14)<1e-8)).toBe(false);
  });
  it('sépare les fenêtres éclairées sans perdre de fenêtres la nuit', () => {
    const jour=construireArchitecture(13,18,11,'tour','#abc',false,false);
    const nuit=construireArchitecture(13,18,11,'tour','#abc',false,true);
    expect(nuit.lumieres.length).toBeGreaterThan(0);
    expect(nuit.lumieres.length+nuit.vitres.length).toBe(jour.vitres.length);
  });
  it('garde le chantier et sa grue dans un seul lot', () => {
    const plan=construireArchitecture(21,4,15,'chantier','#abc',false,false);
    expect(plan.solides.some(b=>b.taille[1]===14)).toBe(true);
    expect(plan.vitres).toEqual([]); expect(plan.lumieres).toEqual([]);
  });
});
