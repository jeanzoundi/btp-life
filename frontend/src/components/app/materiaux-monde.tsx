'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export type MatiereMonde = 'concrete_floor' | 'wood_floor' | 'asphalt_02' | 'painted_plaster_wall' | 'brick_pavement_02' | 'clay_roof_tiles_02' | 'corrugated_iron';

export function useCartesPBR(type: MatiereMonde) {
  const sources=useTexture([`/materials/${type}-color.jpg`,`/materials/${type}-normal.jpg`,`/materials/${type}-rough.jpg`]);
  return useMemo(()=>sources.map((map,i)=>{
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
    map.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;map.needsUpdate=true;return map;
  }),[sources[0],sources[1],sources[2]]);
}

/** Local CC0 scans. Texture instances are shared by material/scale, not by mesh. */
export function MateriauPBR({type='concrete_floor',couleur='#ffffff',repeat=1,metal=0}:{type?:MatiereMonde;couleur?:string;repeat?:number;metal?:number}) {
  const maps=useCartesPBR(type);
  // UV scale is a uniform: every floor shares the same three GPU textures.
  return <meshStandardMaterial color={couleur} map={maps[0]} normalMap={maps[1]} normalScale={[.35,.35]} roughnessMap={maps[2]} roughness={.85} metalness={metal} customProgramCacheKey={()=>'world-pbr-v1'} onBeforeCompile={shader=>{
    shader.uniforms.uWorldRepeat={value:repeat};
    shader.vertexShader='uniform float uWorldRepeat;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvMapUv *= uWorldRepeat;\nvNormalMapUv *= uWorldRepeat;\nvRoughnessMapUv *= uWorldRepeat;');
  }}/>;
}

/** Projette les textures selon la position dans le monde (face par face d'après la normale) :
 * un mètre de mur reste un mètre de texture, même sur des blocs instanciés et étirés. */
function projectionMonde(shader: THREE.WebGLProgramParametersWithUniforms, echelle: number) {
  shader.uniforms.uEchelleMonde = { value: 1 / echelle };
  shader.vertexShader = 'varying vec3 vPosMonde;\nvarying vec3 vNormMonde;\n' + shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
    vec4 posMonde = vec4(transformed, 1.0);
    vec3 normMonde = objectNormal;
    #ifdef USE_INSTANCING
      posMonde = instanceMatrix * posMonde;
      normMonde = mat3(instanceMatrix) * normMonde;
    #endif
    vPosMonde = (modelMatrix * posMonde).xyz;
    vNormMonde = normalize(mat3(modelMatrix) * normMonde);`);
  const remplacer = (chunk: string) => chunk.replaceAll('vMapUv', 'uvMonde').replaceAll('vNormalMapUv', 'uvMonde').replaceAll('vRoughnessMapUv', 'uvMonde');
  shader.fragmentShader = 'uniform float uEchelleMonde;\nvarying vec3 vPosMonde;\nvarying vec3 vNormMonde;\n' + shader.fragmentShader
    .replace('void main() {', `void main() {
      vec3 axe = abs(vNormMonde);
      vec2 uvMonde = (axe.y > .6 ? vPosMonde.xz : axe.x > axe.z ? vec2(vPosMonde.z, vPosMonde.y) : vPosMonde.xy) * uEchelleMonde;`)
    .replace('#include <map_fragment>', remplacer(THREE.ShaderChunk.map_fragment))
    // Le repère tangent du relief se calcule ici à partir des UV : il doit suivre la même projection.
    .replace('#include <normal_fragment_begin>', remplacer(THREE.ShaderChunk.normal_fragment_begin))
    .replace('#include <normal_fragment_maps>', remplacer(THREE.ShaderChunk.normal_fragment_maps))
    .replace('#include <roughnessmap_fragment>', remplacer(THREE.ShaderChunk.roughnessmap_fragment));
}

/** Matériau photographique en coordonnées monde : `echelle` = mètres couverts par une répétition de la texture. */
export function MateriauMonde({ type, couleur = '#ffffff', echelle = 2, relief = .6, rugosite = 1, metal = 0 }: { type: MatiereMonde; couleur?: string; echelle?: number; relief?: number; rugosite?: number; metal?: number }) {
  const maps = useCartesPBR(type);
  return <meshStandardMaterial color={couleur} map={maps[0]} normalMap={maps[1]} normalScale={[relief, relief]} roughnessMap={maps[2]} roughness={rugosite} metalness={metal}
    customProgramCacheKey={() => `monde-pbr-${type}-${echelle}`} onBeforeCompile={shader => projectionMonde(shader, echelle)} />;
}

export function Finition({couleur,metal=0}:{couleur:string;metal?:number}){
  // Enduit photographique (Poly Haven, CC0) éclairci : la teinte vient de chaque bloc, l'enduit apporte grain et nuances.
  if (metal) return <meshStandardMaterial color={couleur} roughness={.28} metalness={metal}/>;
  return <MateriauMonde type="painted_plaster_wall" couleur={couleur} echelle={2.6} relief={.45} rugosite={.95}/>;
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
