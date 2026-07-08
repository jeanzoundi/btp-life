'use client';

import { AvatarBtp } from './avatar-btp';
import { AVATAR_AKISSI } from './mentor';

// Akissi — la mentor virtuelle qui conseille le joueur sur son chantier.
// Analyse l'état réel (stock vs besoins, équipe, budget, délais) et
// priorise 3 conseils actionnables maximum.

interface Ouvrier {
  poste: string;
  nom: string;
  fatigue: number;
  statut: string;
  salaireJournalier: number;
}
interface Phase {
  nom: string;
  besoins: { joursEstimes?: number; equipeMin?: number; materiaux?: Record<string, number> } | null;
}
interface EtatChantier {
  statut: string;
  phaseCourante: number;
  budgetRestant: number;
  joursRestants: number;
  moralEquipe: number;
  securite: number;
  noteFinale: string | null;
  stock: Record<string, number> | null;
  avancementPhases: Record<string, number> | null;
  ouvriers: Ouvrier[];
  chantier: { phases: Phase[] };
}

interface Conseil {
  icone: string;
  texte: string;
  urgence: number; // plus haut = plus urgent
}

function analyser(uc: EtatChantier): Conseil[] {
  const conseils: Conseil[] = [];

  if (uc.statut !== 'en_cours') {
    const messages: Record<string, string> = {
      A: 'Note A — chantier exemplaire ! Qualité, délais, budget : tout y est. Les recruteurs adorent ça sur un CV.',
      B: 'Note B — très bon chantier. Regarde le journal : un poil plus d\'anticipation sur les commandes et le A est à toi.',
      C: 'Note C — chantier livré, c\'est l\'essentiel. Analyse ce qui a pêché (délai ? stock ?) et retente sur le prochain.',
      D: 'Note D — dur… mais c\'est comme ça qu\'on apprend. Repars sur un chantier plus petit et applique les leçons.',
    };
    return [{ icone: '🏁', texte: messages[uc.noteFinale ?? ''] ?? 'Chantier terminé — bravo d\'être allé au bout !', urgence: 0 }];
  }

  const phase = uc.chantier.phases[uc.phaseCourante];
  const besoins = phase?.besoins ?? {};
  const joursEstimes = besoins.joursEstimes ?? 5;
  const equipeMin = besoins.equipeMin ?? 2;
  const pctPhase = uc.avancementPhases?.[String(uc.phaseCourante)] ?? 0;
  const stock = uc.stock ?? {};
  const actifs = uc.ouvriers.filter((o) => o.statut === 'actif');

  // 1. Matériaux pour finir la phase
  const fractionRestante = Math.max(0, 1 - pctPhase / 100);
  for (const [nom, total] of Object.entries(besoins.materiaux ?? {})) {
    const restantNecessaire = Math.ceil(total * fractionRestante);
    const enStock = stock[nom] ?? 0;
    if (enStock < restantNecessaire * 0.4) {
      conseils.push({
        icone: '📦',
        texte: `Stock de ${nom} trop bas pour la phase « ${phase?.nom} » : il en faut encore ~${restantNecessaire}, tu en as ${enStock}. Commande avant de lancer la journée, sinon l'équipe tournera au ralenti.`,
        urgence: 90,
      });
    }
  }

  // 2. Équipe
  if (actifs.length === 0) {
    conseils.push({ icone: '👷', texte: 'Aucun ouvrier actif ! Embauche ou remets ton équipe au travail avant de lancer une journée.', urgence: 100 });
  } else if (actifs.length < equipeMin) {
    conseils.push({
      icone: '👷',
      texte: `Ton équipe active (${actifs.length}) est sous l'effectif recommandé pour cette phase (${equipeMin}). Embauche un maçon ou un manœuvre pour tenir la cadence.`,
      urgence: 70,
    });
  }
  const epuises = uc.ouvriers.filter((o) => o.statut === 'actif' && o.fatigue >= 70);
  for (const o of epuises.slice(0, 2)) {
    conseils.push({
      icone: '😮‍💨',
      texte: `${o.nom} est à ${o.fatigue} de fatigue — un ouvrier épuisé travaille mal et finit par se blesser. Mets-le au repos une journée (payé à moitié), il reviendra en forme.`,
      urgence: 60 + o.fatigue / 5,
    });
  }

  // 3. Budget vs jours de salaires restants
  const salairesJour = actifs.reduce((s, o) => s + o.salaireJournalier, 0) +
    Math.round(uc.ouvriers.filter((o) => o.statut === 'repos').reduce((s, o) => s + o.salaireJournalier, 0) / 2);
  if (salairesJour > 0) {
    const joursDeBudget = Math.floor(uc.budgetRestant / salairesJour);
    if (joursDeBudget < 5) {
      conseils.push({
        icone: '💰',
        texte: `Alerte budget : il te reste ~${joursDeBudget} jour${joursDeBudget > 1 ? 's' : ''} de salaires (${salairesJour.toLocaleString('fr-FR')} F/jour). Réduis l'équipe ou termine vite — un chantier à sec s'arrête.`,
        urgence: 85,
      });
    }
  }

  // 4. Délai vs travail restant
  const phases = uc.chantier.phases;
  const joursRestantsEstimes = phases.reduce((somme, p, i) => {
    const je = p.besoins?.joursEstimes ?? 5;
    if (i < uc.phaseCourante) return somme;
    if (i === uc.phaseCourante) return somme + je * fractionRestante;
    return somme + je;
  }, 0);
  if (uc.joursRestants < joursRestantsEstimes) {
    conseils.push({
      icone: '⏰',
      texte: `Le délai est serré : ~${Math.ceil(joursRestantsEstimes)} jours de travail estimés pour ${uc.joursRestants} jours contractuels restants. Renforce l'équipe active ou chaque jour de retard coûtera des points à la note.`,
      urgence: 75,
    });
  } else if (uc.joursRestants > joursRestantsEstimes + 3 && pctPhase > 0) {
    conseils.push({ icone: '✅', texte: `Bon rythme : ~${Math.ceil(joursRestantsEstimes)} jours de travail restants pour ${uc.joursRestants} jours de délai. Continue comme ça et la prime de délai est pour toi.`, urgence: 10 });
  }

  // 5. Moral & sécurité
  if (uc.moralEquipe < 55) {
    conseils.push({ icone: '📉', texte: `Le moral de l'équipe est bas (${uc.moralEquipe}/100). Évite les licenciements, accorde des repos, et garde le stock plein : rien ne démoralise plus que d'attendre les matériaux.`, urgence: 65 });
  }
  if (uc.securite < 70) {
    conseils.push({ icone: '🦺', texte: `La sécurité se dégrade (${uc.securite}/100) — souvent le signe d'une équipe fatiguée. Fais tourner les repos avant l'accident grave.`, urgence: 80 });
  }

  // 6. Rien d'urgent → encourager l'action
  if (!conseils.some((c) => c.urgence > 50)) {
    conseils.push({
      icone: '🔨',
      texte: `Tout est en ordre : stock correct, équipe en forme. Lance la journée de travail pour faire avancer « ${phase?.nom} » (${Math.round(pctPhase)} %).`,
      urgence: 20,
    });
  }

  return conseils.sort((a, b) => b.urgence - a.urgence).slice(0, 3);
}

export function AssistantChantier({ uc }: { uc: EtatChantier }) {
  const conseils = analyser(uc);
  return (
    <section className="rounded-2xl border-2 border-cuivre/40 bg-gradient-to-br from-white to-cuivre/5 p-5">
      <div className="flex items-start gap-4">
        <div className="anim-float shrink-0">
          <AvatarBtp config={AVATAR_AKISSI} taille={64} className="!rounded-full shadow-md ring-2 ring-cuivre/30" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-graphite">
            Akissi <span className="text-xs font-normal text-graphite/50">· ta mentor de chantier</span>
          </p>
          <div className="mt-2 space-y-2">
            {conseils.map((c, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-xl p-2.5 text-sm ${c.urgence >= 70 ? 'bg-terracotta/10 text-graphite' : c.urgence >= 40 ? 'bg-sable/40 text-graphite/90' : 'bg-olive/10 text-graphite/80'}`}>
                <span className="shrink-0 text-base">{c.icone}</span>
                <p className="leading-snug">{c.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
