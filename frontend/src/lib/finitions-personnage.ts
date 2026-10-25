import * as THREE from 'three';

/** Finitions du témoin de revue uniquement. Ne modifie ni les textures ni les matériaux du jeu. */
export function finitionPersonnage(source: THREE.MeshStandardMaterial): THREE.MeshPhysicalMaterial {
  const resultat = new THREE.MeshPhysicalMaterial();
  THREE.MeshStandardMaterial.prototype.copy.call(resultat, source);
  resultat.name = source.name;
  resultat.metalness = 0;
  if (/_head$/i.test(source.name)) {
    resultat.roughness = .64;
    resultat.normalScale.set(.7, .7);
    resultat.ior = 1.4;
    resultat.specularIntensity = .36;
    resultat.clearcoat = .04;
    resultat.clearcoatRoughness = .55;
  } else if (/_body$/i.test(source.name)) {
    resultat.roughness = .9;
    resultat.normalScale.set(.85, .85);
    resultat.sheen = .22;
    resultat.sheenRoughness = .85;
    resultat.sheenColor.set('#b7ada0');
  } else if (/_helmet$/i.test(source.name)) {
    resultat.roughness = .38;
    resultat.clearcoat = .3;
    resultat.clearcoatRoughness = .3;
  }
  return resultat;
}
