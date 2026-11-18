import { EntreeParMail } from '@/components/public/entree-par-mail';

// Plus de formulaire à huit champs : l'adresse mail suffit, le reste (nom du personnage, métier…) se choisit dans le jeu.
export default function InscriptionPage() {
  return <EntreeParMail mode="inscription" />;
}
