// Jeu d'icônes maison, tracé au trait (style ligne 2px, viewBox 24), pour remplacer les emojis
// d'interface. Toutes en `currentColor` : elles héritent automatiquement de la couleur du texte
// parent (actif/inactif dans la nav), donc s'accordent à la palette sans réglage.

const CHEMINS: Record<string, React.ReactNode> = {
  // Accueil — maison
  accueil: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  // Missions — cible
  missions: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  // Chantiers — casque de chantier
  chantiers: (
    <>
      <path d="M3 17a9 9 0 0 1 18 0" />
      <path d="M2 17h20" />
      <path d="M9 8a3 3 0 0 1 6 0v1" />
      <path d="M12 5v4" />
    </>
  ),
  // Académie — chapeau de diplômé
  academie: (
    <>
      <path d="M2 8.5l10-4 10 4-10 4z" />
      <path d="M6 10.5V15c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5" />
      <path d="M22 8.5V13" />
    </>
  ),
  // Logiciels — écran
  logiciels: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </>
  ),
  // Compétences — étoile
  competences: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
  // Parcours — boussole
  parcours: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2.2 5.3-5.3 2.2 2.2-5.3z" />
    </>
  ),
  // Entreprise — immeuble
  entreprise: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
      <path d="M10 21v-3h4v3" />
    </>
  ),
  // CV — document
  cv: (
    <>
      <path d="M7 2h8l4 4v16H7z" />
      <path d="M15 2v4h4" />
      <path d="M10 12h6M10 16h6M10 8h2" />
    </>
  ),
  // Offres — mallette
  offres: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
      <path d="M3 12h18" />
    </>
  ),
  // Promotions — courbe qui monte
  promotions: (
    <>
      <path d="M3 17l5-5 4 4 8-8" />
      <path d="M15 8h5v5" />
    </>
  ),
  // Récompenses — médaille
  recompenses: (
    <>
      <circle cx="12" cy="15" r="6" />
      <path d="M9 9.5L6.5 3M15 9.5L17.5 3" />
      <path d="M12 12.5l1 2 2 .2-1.4 1.4.4 2-2-1-2 1 .4-2L9 14.7l2-.2z" />
    </>
  ),
  // Classement — trophée
  classement: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 13v4M8.5 21h7M9.5 21l.5-4h4l.5 4" />
    </>
  ),
  // Profil — utilisateur
  profil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  // Dressing — tee-shirt
  dressing: <path d="M8.5 3L5 6l2 3 1.5-1v11h7V8L18 9l2-3-3.5-3-2 2h-2z" />,
  // Inventaire — sac à dos
  inventaire: (
    <>
      <rect x="5" y="7" width="14" height="14" rx="3" />
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
      <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
    </>
  ),
  // Monde virtuel — carte
  monde: (
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  // Messages — bulle
  messages: <path d="M4 5h16v11H9l-5 4z" />,
  // Paramètres — engrenage
  parametres: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  // Menu — hamburger
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  // Déconnexion — bouton de sortie
  deconnexion: (
    <>
      <path d="M15 17l5-5-5-5" />
      <path d="M20 12H9" />
      <path d="M9 4H5v16h4" />
    </>
  ),
};

export function Icone({ nom, taille = 20, className }: { nom: string; taille?: number; className?: string }) {
  const chemin = CHEMINS[nom];
  if (!chemin) return null;
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {chemin}
    </svg>
  );
}
