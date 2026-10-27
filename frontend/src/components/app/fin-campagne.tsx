'use client';

// La fin du fil rouge : une fois la Résidence Akwaba livrée et son plan de caméra passé, un écran salue le parcours,
// oriente vers la suite du jeu (carrière, chantiers, équipes) et annonce le prochain ouvrage. Il ne s'affiche qu'une fois.

export const TEASER_CAMPAGNE = 'Bientôt, un nouvel ouvrage à suivre de bout en bout… et Serge n’a pas dit son dernier mot.';

/** L'écran de fin se montre quand la campagne est finie, la progression chargée, le joueur libre, et seulement une fois. */
export function finCampagneAMontrer({ chapitres, total, pret, dejaVue, occupe }: { chapitres: number; total: number; pret: boolean; dejaVue: boolean; occupe: boolean }) {
  return pret && !dejaVue && !occupe && chapitres >= total;
}

const SUITES = [
  { id: 'carriere', icone: '📈', titre: 'Ta carrière', texte: 'Vise la prochaine promotion, puis les métiers experts au-delà du niveau 20.', bouton: 'Voir mon parcours' },
  { id: 'chantiers', icone: '🏗️', titre: 'Tes chantiers', texte: 'Pilote un chantier complet : budget, équipe, matériaux et imprévus.', bouton: 'Choisir un chantier' },
  { id: 'equipe', icone: '🤝', titre: 'Faire équipe', texte: 'Invite un voisin connecté : à deux dans le même lieu, chaque séance rapporte +10 % d’XP.', bouton: 'Ouvrir le chat' },
] as const;
export type SuiteCampagne = (typeof SUITES)[number]['id'];

export function PanneauFinCampagne({ nomJoueur, onSuite, onFermer }: { nomJoueur: string; onSuite: (suite: SuiteCampagne) => void; onFermer: () => void }) {
  return <section role="dialog" aria-label="Fin du fil rouge" className="hud-verre pointer-events-auto absolute left-1/2 top-1/2 z-40 w-[440px] max-w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5 text-jeu-ivoire">
    <p className="hud-legende text-jeu-or">Fil rouge terminé · 9 chapitres</p>
    <h2 className="hud-titre mt-1 text-[20px]">La Résidence Akwaba est livrée !</h2>
    <p className="mt-2 text-[13px] leading-relaxed text-jeu-ivoire/80">
      Bravo {nomJoueur} : du marché clé en main à la réception avec Mme Touré, tu as suivi l’immeuble de bout en bout. Ses huit familles s’installent, et Mme Touré te recommande à tout le Plateau.
    </p>
    <h3 className="mt-4 text-[12.5px] font-bold uppercase tracking-wide text-jeu-ivoire/60">Et maintenant ?</h3>
    <ul className="mt-2 space-y-2">
      {SUITES.map(s => <li key={s.id} className="flex items-center gap-3 rounded-xl bg-white/[.06] p-2.5">
        <span aria-hidden className="text-[22px]">{s.icone}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold">{s.titre}</p>
          <p className="text-[11.5px] leading-snug text-jeu-ivoire/70">{s.texte}</p>
        </div>
        <button type="button" onClick={() => onSuite(s.id)} className="shrink-0 rounded-lg bg-jeu-or/20 px-2.5 py-1.5 text-[11.5px] font-bold text-jeu-or hover:bg-jeu-or/30">{s.bouton}</button>
      </li>)}
    </ul>
    <p className="mt-4 rounded-lg bg-jeu-or/[.1] px-3 py-2 text-[12px] italic text-jeu-or/90">{TEASER_CAMPAGNE}</p>
    <button type="button" onClick={onFermer} className="hud-bouton hud-bouton-principal mt-4 w-full p-2.5 text-[13px]">Continuer à jouer</button>
  </section>;
}
