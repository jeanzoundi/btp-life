'use client';

import { AuthGuard } from '@/components/app/auth-guard';
import { CreationVie } from '@/components/app/creation-vie';

// Juste après l'inscription : créer sa vie dans le BTP (mode, personnage réaliste et ses réglages, caractère, départ,
// métier visé). Un joueur déjà installé y retrouve ses choix sans rien perdre.
export default function OnboardingPage() {
  return (
    <AuthGuard>
      <CreationVie />
    </AuthGuard>
  );
}
