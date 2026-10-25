'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { PresentationModes, SelectionProfilDepart } from '@/components/app/presentation-depart';
import { AvatarBtp } from '@/components/app/avatar-btp';
import { MentorBulle } from '@/components/app/mentor';
import { type ModeExperience } from '@/lib/mode-experience-store';
import { type ProfilCatalogue, type ProfilDepart } from '@/lib/profils-depart';
import { type IdPersonnage } from '@/lib/personnages-joueur';
import { gabaritDepuis } from '@/lib/gabarit-personnage';

const ChoixPersonnage = dynamic(() => import('@/components/app/choix-personnage').then(m => m.ChoixPersonnage), { ssr: false });
// Exemples du catalogue : cette page n'appelle jamais l'API et ne modifie aucun compte.
const EXEMPLES: ProfilCatalogue[] = [
  ['etudiant-chantier', 'Étudiant BTP', 'CHANTIER'], ['etudiant-be', 'Étudiant Bureau d’études', 'BE'],
  ['ouvrier-qualifie', 'Ouvrier qualifié', 'ENTREPRENEUR'], ['dessinateur-junior', 'Dessinateur junior', 'BE'],
  ['dessinateur-bim', 'Dessinateur BIM', 'BIM'], ['chef-equipe', 'Chef d’équipe', 'CHANTIER'],
  ['ingenieur-structure', 'Ingénieur structure', 'BE'], ['aide-metreur', 'Aide métreur', 'METRE'],
].map(([slug, nom, famille]) => ({ id: slug, slug, nom, famille, description: null }));

export default function CreationPreview() {
  const [mode, setMode] = useState<ModeExperience>('classique');
  const [porte, setPorte] = useState<ProfilDepart | null>('etudiant');
  const [profil, setProfil] = useState('');
  const [personnage, setPersonnage] = useState<IdPersonnage>('combinaison');
  const [nom, setNom] = useState('Kouassi');
  const [gabarit, setGabarit] = useState(() => gabaritDepuis(null));
  const [atelier, setAtelier] = useState(false);
  return <main className="min-h-screen bg-ivoire px-4 py-8 text-graphite sm:py-12">
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="rounded-full bg-olive/10 px-3 py-2 font-semibold text-olive">Aperçu · aucun compte modifié</span>
        <Link href="/simulation-preview" className="font-semibold text-terracotta">← Démonstration du monde</Link>
      </div>
      <header className="space-y-3"><p className="text-xs font-bold uppercase tracking-widest text-terracotta">BTP Life · Crée ta vie</p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Une vie à construire.<br /><span className="text-terracotta">Deux façons de la jouer.</span></h1>
        <p className="text-sm text-graphite/70">Teste le nouvel accueil et le créateur. Les exemples de profils ne créent ni carrière, ni logement, ni prime.</p>
      </header>
      <PresentationModes mode={mode} onMode={setMode} />
      <section className="rounded-2xl border border-pierre bg-white p-5">
        <div className="flex items-center gap-4"><AvatarBtp config={{ personnage }} taille={76} />
          <div><h2 className="font-display text-xl font-bold">Ton personnage · {nom}</h2><p className="mt-1 text-sm text-graphite/60">Même identité, dans les deux modes.</p></div>
        </div>
        <button onClick={() => setAtelier(true)} className="mt-4 w-full rounded-full bg-terracotta px-5 py-3 font-semibold text-ivoire hover:bg-argile">Personnaliser mon personnage en 3D</button>
      </section>
      <section className="space-y-4"><h2 className="font-display text-2xl font-bold">D’où commence ton histoire ?</h2>
        <SelectionProfilDepart profils={EXEMPLES} porte={porte} profilId={profil} onPorte={p => { setPorte(p); setProfil(''); }} onProfil={setProfil} />
      </section>
      <MentorBulle>Ton apparence ne décide pas de ton métier. Dans le jeu, tu choisis ensuite ta situation, ton objectif et ton parcours.</MentorBulle>
      <Link href="/onboarding" className="block rounded-full border-2 border-terracotta px-5 py-3 text-center font-semibold text-terracotta">Ouvrir l’accueil de mon compte</Link>
    </div>
    {atelier && <ChoixPersonnage initial={personnage} nomInitial={nom} avatarConfig={{ personnage, ...gabarit }} premierChoix={false} demo enCours={false} erreur={null} brouillon
      onAnnuler={() => setAtelier(false)} onValider={(id, nom, g) => { setPersonnage(id); setNom(nom); setGabarit(g); setAtelier(false); }} />}
  </main>;
}
