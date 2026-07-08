'use client';

import { AvatarBtp, AVATAR_DEFAUT, type AvatarConfig } from './avatar-btp';

// Akissi — la mentor virtuelle du joueur, présente de l'onboarding aux chantiers.
export const AVATAR_AKISSI: AvatarConfig = {
  ...AVATAR_DEFAUT,
  peau: '#8D5524',
  casqueStyle: 'aucun',
  cheveux: 'tresses',
  couleurCheveux: '#2B2B2E',
  typeTenue: 'gilet',
  couleurTenue: '#C1502E',
  expression: 'sourire',
  lunettes: 'aucune',
  fond: '#D9B382',
  outil: 'tablette',
  pilosite: 'aucune',
  yeux: '#2B2B2E',
  ecusson: 'etoile',
  cadre: 'aucun',
};

/** Bulle de dialogue façon JRPG : avatar de la mentor + texte, avec pointe vers l'avatar. */
export function MentorBulle({
  children,
  taille = 56,
  nom = 'Akissi',
  role,
  className = '',
}: {
  children: React.ReactNode;
  taille?: number;
  nom?: string;
  role?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="anim-float shrink-0">
        <AvatarBtp config={AVATAR_AKISSI} taille={taille} className="!rounded-full shadow-md ring-2 ring-cuivre/30" />
      </div>
      <div className="relative min-w-0 flex-1 rounded-2xl rounded-tl-none border-2 border-cuivre/30 bg-white p-3.5 shadow-sm">
        <span className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 border-b-2 border-l-2 border-cuivre/30 bg-white" />
        <p className="text-xs font-bold text-cuivre">
          {nom} {role && <span className="font-normal text-graphite/40">· {role}</span>}
        </p>
        <div className="mt-1 text-sm leading-relaxed text-graphite/80">{children}</div>
      </div>
    </div>
  );
}
