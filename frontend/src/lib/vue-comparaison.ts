import { METEOS, type Meteo } from './meteo-monde';

// Un point de vue fixe de la démonstration, pour comparer le rendu avant et après un changement, depuis les mêmes endroits,
// à la même heure et sous le même ciel (scripts/captures-monde.mjs) : `/simulation-preview?vue=x,z&heure=21&meteo=averse`.

export interface VueComparaison { position?: [number, number]; heure?: number; meteo?: Meteo }

export function vueDeComparaison(recherche: string): VueComparaison {
  const p = new URLSearchParams(recherche);
  const vue = p.get('vue')?.split(',').map(Number);
  const heure = p.get('heure') ? Number(p.get('heure')) : Number.NaN;
  const meteo = p.get('meteo');
  return {
    ...(vue?.length === 2 && vue.every(Number.isFinite) ? { position: [vue[0], vue[1]] as [number, number] } : {}),
    ...(Number.isFinite(heure) && heure >= 0 && heure < 24 ? { heure } : {}),
    ...(meteo && (METEOS as string[]).includes(meteo) ? { meteo: meteo as Meteo } : {}),
  };
}
