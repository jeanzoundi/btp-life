// Une seule échelle pour la ville : les personnages sont dessinés 10 % plus grands que nature pour rester lisibles vus
// d'en haut ; véhicules et mobilier de rue suivent le même facteur, pour que les proportions restent celles de la vraie vie
// (une voiture arrive à l'épaule d'un piéton, un bus le dépasse de près du double).

export const ECHELLE_PERSONNAGES = 1.1;
/** Taille réelle d'un adulte, avant l'échelle de la ville. */
export const TAILLE_ADULTE = 1.75;

/** Gabarits réels (en mètres) des véhicules de la ville, avant l'échelle : longueur, largeur, hauteur. */
export const GABARITS_VEHICULES = {
  voiture: { longueur: 4.1, largeur: 1.75, hauteur: 1.45 },
  taxi: { longueur: 4.1, largeur: 1.75, hauteur: 1.75 },
  gbaka: { longueur: 5.2, largeur: 1.9, hauteur: 2.3 },
  bus: { longueur: 11, largeur: 2.5, hauteur: 3.25 },
  moto: { longueur: 1.8, largeur: .7, hauteur: 1.1 },
} as const;
export type TypeVehicule = keyof typeof GABARITS_VEHICULES;

/** Rapport de hauteur entre un véhicule et un adulte, le même dans le jeu et dans la vraie vie. */
export const rapportHauteur = (type: TypeVehicule) => GABARITS_VEHICULES[type].hauteur / TAILLE_ADULTE;
