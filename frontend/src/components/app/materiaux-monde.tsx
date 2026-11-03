'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
// Toutes les scènes 3D passent par ce module : on y fixe aussi la police locale des textes 3D.
import '@/lib/police-textes-3d';
import { cheminTexture, type MatiereMonde } from '@/lib/ressources-legeres';

export type { MatiereMonde };

/** Couleur, relief et rugosité en WebP ; 512 px au lieu de 1024 sur téléphone (ressources-legeres.ts). */
export function useCartesPBR(type: MatiereMonde) {
  const sources=useTexture([cheminTexture(type,'color'),cheminTexture(type,'normal'),cheminTexture(type,'rough')]);
  return useMemo(()=>sources.map((map,i)=>{
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
    map.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;map.needsUpdate=true;return map;
  }),[sources[0],sources[1],sources[2]]);
}

/** Humidité des sols de la ville (0 sec, 1 détrempé), partagée par tous les matériaux mouillables : la pluie l'élève et le
 * beau temps la fait retomber (sols-mouilles.tsx). Un seul uniforme pour tous : aucune recompilation quand il change. */
export const HUMIDITE_SOLS = { value: 0 };

/** Un sol mouillé fonce et devient presque miroir ; un mur ne fait que foncer un peu (`mouille`, calculé en tête du shader). */
function mouiller(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.uniforms.uHumidite = HUMIDITE_SOLS;
  shader.fragmentShader = 'uniform float uHumidite;\n' + shader.fragmentShader
    .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb *= 1.0 - .38 * mouille;')
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, .07, mouille * .85);');
}

/** Local CC0 scans. Texture instances are shared by material/scale, not by mesh. `mouillable` : un sol de la ville, que la pluie mouille. */
export function MateriauPBR({type='concrete_floor',couleur='#ffffff',repeat=1,metal=0,mouillable=false}:{type?:MatiereMonde;couleur?:string;repeat?:number;metal?:number;mouillable?:boolean}) {
  const maps=useCartesPBR(type);
  // UV scale is a uniform: every floor shares the same three GPU textures.
  return <meshStandardMaterial color={couleur} map={maps[0]} normalMap={maps[1]} normalScale={[.35,.35]} roughnessMap={maps[2]} roughness={.85} metalness={metal} customProgramCacheKey={()=>mouillable?'world-pbr-v1-mouille':'world-pbr-v1'} onBeforeCompile={shader=>{
    shader.uniforms.uWorldRepeat={value:repeat};
    shader.vertexShader='uniform float uWorldRepeat;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvMapUv *= uWorldRepeat;\nvNormalMapUv *= uWorldRepeat;\nvRoughnessMapUv *= uWorldRepeat;');
    if(mouillable){shader.fragmentShader=shader.fragmentShader.replace('void main() {','void main() {\n  float mouille = uHumidite;');mouiller(shader);}
  }}/>;
}

/** Projette les textures selon la position dans le monde (face par face d'après la normale) :
 * un mètre de mur reste un mètre de texture, même sur des blocs instanciés et étirés. */
function projectionMonde(shader: THREE.WebGLProgramParametersWithUniforms, echelle: number, mouillable = false) {
  // L'humidité s'accroche derrière les inclusions de couleur et de rugosité, avant qu'on les remplace par la projection.
  if (mouillable) mouiller(shader);
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
      vec2 uvMonde = (axe.y > .6 ? vPosMonde.xz : axe.x > axe.z ? vec2(vPosMonde.z, vPosMonde.y) : vPosMonde.xy) * uEchelleMonde;${mouillable ? `
      float mouille = uHumidite * (axe.y > .6 ? 1.0 : .3);` : ''}`)
    .replace('#include <map_fragment>', remplacer(THREE.ShaderChunk.map_fragment))
    // Le repère tangent du relief se calcule ici à partir des UV : il doit suivre la même projection.
    .replace('#include <normal_fragment_begin>', remplacer(THREE.ShaderChunk.normal_fragment_begin))
    .replace('#include <normal_fragment_maps>', remplacer(THREE.ShaderChunk.normal_fragment_maps))
    .replace('#include <roughnessmap_fragment>', remplacer(THREE.ShaderChunk.roughnessmap_fragment));
}

/** Un matériau par combinaison de réglages, partagé par tous les blocs (et entre la ville et les intérieurs) :
 * des centaines de murs ne coûtent plus des centaines d'envois d'uniformes au GPU. */
const materiauxPartages = new Map<string, THREE.MeshStandardMaterial>();

/** Matériau photographique en coordonnées monde : `echelle` = mètres couverts par une répétition de la texture.
 * `mouillable` : la pluie fonce et fait briller ses faces horizontales, et fonce un peu ses murs. */
export function MateriauMonde({ type, couleur = '#ffffff', echelle = 2, relief = .6, rugosite = 1, metal = 0, mouillable = false }: { type: MatiereMonde; couleur?: string; echelle?: number; relief?: number; rugosite?: number; metal?: number; mouillable?: boolean }) {
  const maps = useCartesPBR(type);
  const materiau = useMemo(() => {
    const cle = `${type}|${couleur}|${echelle}|${relief}|${rugosite}|${metal}|${mouillable}`;
    let m = materiauxPartages.get(cle);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color: couleur, map: maps[0], normalMap: maps[1], normalScale: new THREE.Vector2(relief, relief), roughnessMap: maps[2], roughness: rugosite, metalness: metal });
      // Le code du shader ne dépend que de `mouillable` : matière et échelle passent par les textures et un uniforme propres
      // à chaque matériau. Une clé plus fine compilerait un programme par matière et par échelle, autant d'attente au
      // premier chargement (de l'ordre d'un dixième de seconde chacun sur un téléphone).
      m.customProgramCacheKey = () => `monde-pbr${mouillable ? '-mouille' : ''}`;
      m.onBeforeCompile = shader => projectionMonde(shader, echelle, mouillable);
      materiauxPartages.set(cle, m);
    }
    return m;
  }, [type, couleur, echelle, relief, rugosite, metal, mouillable, maps]);
  return <primitive object={materiau} attach="material" dispose={null} />;
}

export function Finition({couleur,metal=0,mouillable=false}:{couleur:string;metal?:number;mouillable?:boolean}){
  // Enduit photographique (Poly Haven, CC0) éclairci : la teinte vient de chaque bloc, l'enduit apporte grain et nuances.
  if (metal) return <meshStandardMaterial color={couleur} roughness={.28} metalness={metal}/>;
  return <MateriauMonde type="painted_plaster_wall" couleur={couleur} echelle={2.6} relief={.45} rugosite={.95} mouillable={mouillable}/>;
}

/** Un bloc posé au sol prend une matière de sol (asphalte, bois ou béton) ; les autres, l'enduit. `mouillable` : en ville. */
export function SurfaceBloc({dimensions:s,couleur,metal=0,mouillable=false}:{dimensions:[number,number,number];couleur:string;metal?:number;mouillable?:boolean}){
  const sol=s[1]<.5&&s[0]>2&&s[2]>1;
  if(sol&&!metal){
    const rgb=new THREE.Color(couleur);
    const bois=rgb.r>rgb.b*1.7&&s[0]<35;
    const route=couleur==='#555d60';
    return <MateriauPBR type={route?'asphalt_02':bois?'wood_floor':'concrete_floor'} couleur={route?'#c2c9cf':bois?'#dfcbb3':'#e0dbcd'} repeat={Math.max(1,Math.min(32,Math.max(s[0],s[2])/3))} mouillable={mouillable}/>;
  }
  return <Finition couleur={couleur} metal={metal} mouillable={mouillable}/>;
}
