// Catalogue des lieux du monde virtuel — chaque lieu a sa fiche immersive et ses actions.
// Data-driven pour que la page /app/lieu/[slug] et le quartier iso partagent la même source.

export type ActionLieu =
  | { type: 'besoin'; besoin: 'repas' | 'social' | 'repos'; label: string; icone: string; description: string; cout: number }
  | { type: 'lien'; href: string; label: string; icone: string; description: string }
  | { type: 'info'; label: string; icone: string; description: string }
  | { type: 'epargne'; label: string; icone: string; description: string };

export interface Lieu {
  slug: string;
  nom: string;
  icone: string;
  couleur: string; // teinte de fond de l'en-tête
  role: string; // sous-titre : à quoi sert ce lieu
  intro: string; // paragraphe immersif
  ambiance: string[]; // 2-3 détails d'ambiance
  actions: ActionLieu[];
}

export const LIEUX: Record<string, Lieu> = {
  banque: {
    slug: 'banque',
    nom: 'La Banque',
    icone: '🏦',
    couleur: '#2E5FA3',
    role: 'Ton argent virtuel, tes financements',
    intro:
      "La banque BTP Life gère ton capital. Chaque mission réussie, chaque chantier livré et chaque prime y sont crédités. Dépose ton argent en épargne pour le faire fructifier, ou retire-le quand tu as besoin d'un apport personnel pour lancer un chantier ambitieux.",
    ambiance: ['Un guichet climatisé, rare luxe à midi', 'Le conseiller connaît ton dossier par cœur', 'Files d’attente le vendredi de paie'],
    actions: [
      { type: 'info', label: 'Mon solde', icone: '💰', description: 'Ton capital virtuel disponible, mis à jour en temps réel.' },
      { type: 'epargne', label: 'Mon épargne', icone: '🏦', description: "Dépose ou retire de l'argent — l'épargne rapporte un petit intérêt chaque jour." },
      { type: 'lien', href: '/app/chantiers', label: 'Investir dans un chantier', icone: '🏗️', description: "Démarrer un chantier exige un apport personnel, en plus du niveau requis." },
    ],
  },
  mairie: {
    slug: 'mairie',
    nom: 'La Mairie',
    icone: '🏛️',
    couleur: '#6B7A3F',
    role: 'Démarches, permis et parcours officiel',
    intro:
      "À la mairie, on ne construit rien sans autorisation. C'est le point de passage administratif : permis de construire, conformité, et le suivi officiel de ta progression de carrière dans la filière.",
    ambiance: ['Des tampons, encore des tampons', 'Le registre des permis affiché au mur', 'Un agent qui vérifie chaque dossier'],
    actions: [
      { type: 'lien', href: '/app/parcours', label: 'Mon parcours officiel', icone: '🧭', description: "L'arbre de ta carrière et tes prochaines étapes." },
      { type: 'lien', href: '/app/promotions', label: 'Déposer une promotion', icone: '📈', description: 'Fais valider ton passage au grade supérieur.' },
      { type: 'info', label: 'Permis de construire', icone: '📋', description: 'Chaque type de chantier débloqué correspond à un permis obtenu par ta progression.' },
    ],
  },
  laboratoire: {
    slug: 'laboratoire',
    nom: 'Le Laboratoire',
    icone: '🔬',
    couleur: '#8E44AD',
    role: 'Essais de sols et contrôle des matériaux',
    intro:
      "Le laboratoire teste tout ce qui se construit : portance des sols, résistance du béton, conformité des aciers. Un ingénieur géotechnique y passe ses journées entre éprouvettes et pénétromètre.",
    ambiance: ['Éprouvettes de béton alignées, datées', 'Le bruit de la presse d’écrasement', 'Odeur de terre et de ciment humide'],
    actions: [
      { type: 'lien', href: '/app/missions?type=CONTROLE_QUALITE', label: 'Passer un contrôle', icone: '✅', description: 'Missions de contrôle qualité et de réception.' },
      { type: 'lien', href: '/app/academie', label: 'Réviser la géotechnique', icone: '📚', description: 'Cours sur les sols et les essais.' },
      { type: 'info', label: 'Résultats d’essais', icone: '🧪', description: 'Slump test 5-9 cm, éprouvettes écrasées à 7 et 28 jours : les fondamentaux du contrôle.' },
    ],
  },
  maquis: {
    slug: 'maquis',
    nom: 'Le Maquis',
    icone: '🍲',
    couleur: '#C1502E',
    role: 'Pause déjeuner — restaure ta faim',
    intro:
      "Le maquis du coin, institution ivoirienne : garba, attiéké-poisson, alloco. C'est là que toute l'équipe se retrouve à midi. Un bon repas et tu repars d'attaque pour l'après-midi.",
    ambiance: ['Ambiance conviviale, télé au fond', 'La patronne connaît ta commande', 'Odeur d’alloco et de poisson braisé'],
    actions: [
      { type: 'besoin', besoin: 'repas', label: 'Manger un plat', icone: '🍛', description: 'Restaure complètement ta faim et remonte un peu ton moral.', cout: 1200 },
    ],
  },
  cafe: {
    slug: 'cafe',
    nom: 'Le Café des Bâtisseurs',
    icone: '☕',
    couleur: '#B87333',
    role: 'Retrouve les collègues — restaure ton social',
    intro:
      "Le café où se croisent chefs de chantier, dessinateurs et topographes après le travail. On y échange des tuyaux, des contacts, des histoires de chantier. Le réseau se construit ici autant que sur les fondations.",
    ambiance: ['Un express serré et des débats animés', 'Le tableau des annonces d’emploi', 'Les anciens racontent leurs plus gros chantiers'],
    actions: [
      { type: 'besoin', besoin: 'social', label: 'Discuter un moment', icone: '💬', description: 'Restaure complètement ton besoin social et remonte ton moral.', cout: 900 },
      { type: 'lien', href: '/app/monde', label: 'Croiser d’autres joueurs', icone: '👥', description: 'Retrouve les vrais joueurs dans le quartier.' },
    ],
  },
  residence: {
    slug: 'residence',
    nom: 'Ma Résidence',
    icone: '🏠',
    couleur: '#4A342A',
    role: 'Rentrer chez soi — restaure ton énergie',
    intro:
      "Ton logement, ton havre après une longue journée. Une bonne nuit de sommeil et tu récupères toute ton énergie — essentielle pour enchaîner les missions et les journées de chantier sans baisse de performance.",
    ambiance: ['Le ventilateur qui ronronne', 'Tes plans étalés sur la table', 'Le calme après le vacarme du chantier'],
    actions: [
      { type: 'besoin', besoin: 'repos', label: 'Dormir et récupérer', icone: '😴', description: 'Restaure complètement ton énergie et remonte ton moral. Gratuit — c\'est chez toi.', cout: 0 },
    ],
  },
};

export function lieuParSlug(slug: string): Lieu | undefined {
  return LIEUX[slug];
}
