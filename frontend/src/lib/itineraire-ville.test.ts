import {describe,it,expect} from 'vitest';
import {itineraireVille,passageLibre,phaseSignal} from './itineraire-ville';
describe('circulation du monde',()=>{
  const obstacles=[{x:0,z:0,largeur:12,profondeur:8},{x:18,z:4,largeur:8,profondeur:8}];
  it('contourne plusieurs bâtiments sans couper leurs angles',()=>{
    const start:[number,number]=[-15,0],end:[number,number]=[30,0];
    const trajet=itineraireVille(start,end,obstacles);expect(trajet.length).toBeGreaterThan(1);expect(trajet.at(-1)).toEqual(end);
    let p=start;for(const suivant of trajet){expect(passageLibre(p,suivant,obstacles)).toBe(true);p=suivant;}
  });
  it('refuse une destination à l’intérieur d’un bâtiment',()=>expect(itineraireVille([-15,0],[0,0],obstacles)).toEqual([]));
  it('garde un chemin direct quand le passage est libre',()=>expect(itineraireVille([-15,15],[30,15],obstacles)).toEqual([[30,15]]));
  it('n’ouvre jamais les deux axes et laisse une seconde de dégagement',()=>{
    for(let t=0;t<32;t+=.1)expect(phaseSignal(t,'horizontal')==='vert'&&phaseSignal(t,'vertical')==='vert').toBe(false);
    expect(phaseSignal(7.5,'horizontal')).toBe('rouge');expect(phaseSignal(7.5,'vertical')).toBe('rouge');
  });
});
