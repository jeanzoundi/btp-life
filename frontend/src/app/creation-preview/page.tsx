'use client';

import { CreationVie } from '@/components/app/creation-vie';

// Aperçu de l'écran de création, sans compte : rien ne part au serveur, le personnage reste dans ce navigateur et le
// monde de démonstration le reprend.
export default function CreationPreview() {
  return <CreationVie demo />;
}
