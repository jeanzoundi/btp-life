'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export type MatiereMonde = 'concrete_floor' | 'wood_floor' | 'asphalt_02';

/** Local CC0 scans. Texture instances are shared by material/scale, not by mesh. */
export function MateriauPBR({type='concrete_floor',couleur='#ffffff',repeat=1,metal=0}:{type?:MatiereMonde;couleur?:string;repeat?:number;metal?:number}) {
  const sources=useTexture([`/materials/${type}-color.jpg`,`/materials/${type}-normal.jpg`,`/materials/${type}-rough.jpg`]);
  const maps=useMemo(()=>sources.map((map,i)=>{
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
    map.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;map.needsUpdate=true;return map;
  }),[sources[0],sources[1],sources[2]]);
  // UV scale is a uniform: every floor shares the same three GPU textures.
  return <meshStandardMaterial color={couleur} map={maps[0]} normalMap={maps[1]} normalScale={[.35,.35]} roughnessMap={maps[2]} roughness={.85} metalness={metal} customProgramCacheKey={()=>'world-pbr-v1'} onBeforeCompile={shader=>{
    shader.uniforms.uWorldRepeat={value:repeat};
    shader.vertexShader='uniform float uWorldRepeat;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvMapUv *= uWorldRepeat;\nvNormalMapUv *= uWorldRepeat;\nvRoughnessMapUv *= uWorldRepeat;');
  }}/>;
}

/** Fine plaster relief for all interior walls, without downloading extra assets. */
let plaster:THREE.DataTexture|undefined;
function grainPlatre(){
  if(plaster)return plaster;
  const data=new Uint8Array(128*128*4);
  for(let i=0;i<128*128;i++){const n=160+((i*73+(i>>7)*31)%75);data.set([n,n,n,255],i*4);}
  plaster=new THREE.DataTexture(data,128,128);plaster.wrapS=plaster.wrapT=THREE.RepeatWrapping;plaster.repeat.set(6,6);plaster.needsUpdate=true;
  return plaster;
}
export function Finition({couleur,metal=0}:{couleur:string;metal?:number}){
  return <meshStandardMaterial color={couleur} roughness={metal?.28:.78} metalness={metal} bumpMap={metal?undefined:grainPlatre()} bumpScale={.018}/>;
}

export function SurfaceBloc({dimensions:s,couleur,metal=0}:{dimensions:[number,number,number];couleur:string;metal?:number}){
  const sol=s[1]<.5&&s[0]>2&&s[2]>1;
  if(sol&&!metal){
    const rgb=new THREE.Color(couleur);
    const bois=rgb.r>rgb.b*1.7&&s[0]<35;
    const route=couleur==='#555d60';
    return <MateriauPBR type={route?'asphalt_02':bois?'wood_floor':'concrete_floor'} couleur={route?'#c2c9cf':bois?'#dfcbb3':'#e0dbcd'} repeat={Math.max(1,Math.min(32,Math.max(s[0],s[2])/3))}/>;
  }
  return <Finition couleur={couleur} metal={metal}/>;
}
