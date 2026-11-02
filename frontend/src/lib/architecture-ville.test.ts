import { describe, expect, it } from 'vitest';
import { assombrir, construireArchitecture, STYLES_LIEUX } from './architecture-ville';

describe('architecture regroupée', () => {
  it('conserve un volume de bâtiment et regroupe des centaines de détails en deux lots le jour', () => {
    const plan=construireArchitecture(17,8,12,'campus','#d8c092',false,false);
    expect(plan.solides[0]).toMatchObject({position:[0,4,0],taille:[17,8,12]});
    expect(plan.solides.length+plan.vitres.length).toBeGreaterThan(200);
    const lots=[plan.solides,plan.vitres,plan.lumieres,plan.fleurs];
    expect(lots.filter(lot=>lot.length).length).toBe(2);
    for(const lot of lots)for(const bloc of lot){
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
  it('coiffe maisons et petits commerces de tuiles, garde les tours à toit plat', () => {
    const maison=construireArchitecture(15,8,12,'maison','#abc',false,false);
    expect(maison.toit).toMatchObject({largeur:16.6,profondeur:13.6,y:8.25,couleur:'#c9652f'});
    expect(maison.toit!.hauteur).toBeGreaterThan(2);
    expect(construireArchitecture(10,4.6,8,'commerce','#abc',true,false,'#b83a2a').toit?.couleur).toBe('#b83a2a');
    expect(construireArchitecture(13,18,11,'tour','#abc',false,false).toit).toBeUndefined();
    expect(construireArchitecture(28,10,18,'commerce','#abc',true,false).toit).toBeUndefined();
  });
  it('fleurit les entrées sans bloquer la porte', () => {
    const plan=construireArchitecture(10,4.6,8,'commerce','#abc',true,false);
    expect(plan.fleurs.length).toBe(22);
    expect(plan.fleurs.every(f=>f.position[2]>4.9&&f.taille.every(n=>n>0))).toBe(true);
    expect(plan.fleurs.every(f=>Math.abs(f.position[0])>.7)).toBe(true);
    expect(construireArchitecture(17,8,12,'campus','#abc',false,false).fleurs).toEqual([]);
  });
  it('garde le chantier et sa grue dans un seul lot', () => {
    const plan=construireArchitecture(21,4,15,'chantier','#abc',false,false);
    expect(plan.solides.some(b=>b.taille[1]===14)).toBe(true);
    expect(plan.vitres).toEqual([]); expect(plan.lumieres).toEqual([]);
  });
  it('donne à chaque élément sa matière : béton des dalles et du socle, métal des menuiseries, bois de la porte', () => {
    const plan=construireArchitecture(15,8,12,'maison','#b45309',false,false);
    const matieres=new Set(plan.solides.map(b=>b.matiere??'enduit'));
    expect([...matieres].sort()).toEqual(['beton','bois','enduit','metal']);
    expect(plan.solides[0].matiere).toBeUndefined();
    expect(plan.solides.find(b=>b.couleur==='#233e45')?.matiere).toBe('bois');
    expect(plan.solides.filter(b=>b.couleur==='#bfc3b8').every(b=>b.matiere==='metal')).toBe(true);
    const chantier=construireArchitecture(21,4,15,'chantier','#abc',false,false);
    expect(chantier.solides.find(b=>b.taille[1]===14)?.matiere).toBe('metal');
  });
  it('soigne le pied du bâtiment : parvis de béton, soubassement assombri et descentes d’eau aux angles', () => {
    const plan=construireArchitecture(10,4.6,8,'commerce','#a0a0a0',false,false);
    expect(plan.solides.some(b=>b.taille[0]===13.4&&b.taille[2]===11.4&&b.matiere==='beton')).toBe(true);
    expect(plan.solides.some(b=>b.couleur===assombrir('#a0a0a0',.8))).toBe(true);
    expect(plan.solides.filter(b=>b.couleur==='#7d847f'&&b.matiere==='metal')).toHaveLength(4);
    expect(assombrir('#abc',.5)).toBe('#555e66');
  });
  it('varie les façades : claustras à la place des fenêtres d’angle, casquettes, lames et persiennes', () => {
    const nue=construireArchitecture(17,8,12,'campus','#d8c092',false,false);
    const claustras=construireArchitecture(17,8,12,'campus','#d8c092',false,false,undefined,{brise:'claustras'});
    // Deux fenêtres de façade principale remplacées à chacun des deux étages.
    expect(nue.vitres.length-claustras.vitres.length).toBe(4);
    const casquettes=construireArchitecture(17,8,12,'campus','#d8c092',false,false,undefined,{brise:'casquettes'});
    expect(casquettes.solides.length-nue.solides.length).toBe(nue.vitres.length);
    const lames=construireArchitecture(13,18,11,'tour','#53677a',false,false,undefined,{brise:'lames'});
    expect(lames.solides.filter(b=>b.couleur==='#a9b2b5'&&b.matiere==='metal'&&b.taille[1]>17).length).toBeGreaterThan(10);
    const persiennes=construireArchitecture(15,8,12,'maison','#b45309',false,false,undefined,{persiennes:'#3f6f5f'});
    const bois=persiennes.solides.filter(b=>b.couleur==='#3f6f5f');
    expect(bois.length).toBeGreaterThan(0);
    expect(bois.every(b=>b.matiere==='bois'&&b.position[1]>3)).toBe(true);
  });
  it('coiffe les toits-terrasses de citernes et d’un attique, jamais un toit de tuiles', () => {
    const tour=construireArchitecture(13,18,11,'tour','#53677a',false,false,undefined,{attique:true,citernes:2});
    expect(tour.solides.filter(b=>b.forme==='cylindre')).toHaveLength(2);
    expect(tour.vitres.some(b=>b.position[1]>18)).toBe(true);
    const maison=construireArchitecture(15,8,12,'maison','#b45309',false,false,undefined,{attique:true,citernes:2});
    expect(maison.solides.some(b=>b.forme==='cylindre')).toBe(false);
    expect(maison.vitres.some(b=>b.position[1]>8)).toBe(false);
  });
  it('équipe les entrées et les façades d’Abidjan : marquise sur poteaux, climatiseurs sous une fenêtre sur trois', () => {
    const plan=construireArchitecture(12,8,10,'campus','#d6bd75',false,false,undefined,{marquise:true,climatiseurs:true});
    expect(plan.solides.some(b=>b.taille[0]===3.8&&b.matiere==='beton')).toBe(true);
    const clims=plan.solides.filter(b=>b.couleur==='#e3e3dc');
    expect(clims.length).toBeGreaterThan(3);
    expect(clims.every(b=>b.matiere==='metal')).toBe(true);
    expect(STYLES_LIEUX.entreprise).toMatchObject({brise:'lames',attique:true});
    expect(STYLES_LIEUX.residence.persiennes).toBeDefined();
  });
});
