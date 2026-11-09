// Ce que les habitants disent en premier quand on leur parle : une réplique qui tient compte de ce qu'ils font à cette
// heure, du temps qu'il fait, et de ce que le joueur a fait (sa dernière journée, ses journées avec Yao, son niveau, sa
// première journée, le fil rouge, sa fatigue ou sa faim). Sans React : le dialogue l'affiche, les tests la vérifient.
import { dossierDe, faitsDossier } from './campagne';
import { etapePnj } from './journee-pnj';
import type { Meteo } from './meteo-monde';

export interface ContexteDialogue {
  heure: number; meteo: Meteo; niveau: number; poste?: string;
  /** Journées faites avec Yao au Grand chantier. */
  journees: number;
  /** La dernière activité notée du joueur dans cette partie (journée de chantier ou séance chez un mentor). */
  derniere?: { type: 'journee' | 'seance'; note: number; lieu?: string } | null;
  /** Étapes faites de la première journée guidée, et si le guide est fini. */
  premiereJournee: { faites: readonly string[]; finie: boolean };
  chapitresFilRouge: number;
  faim: number; energie: number;
}

const pluie = (m: Meteo) => m === 'averse' || m === 'orage';

/** La réplique d'accueil de l'habitant, ou rien : il garde alors son accueil habituel. */
export function repliqueAccueil(nom: string, c: ContexteDialogue): string | null {
  const activite = etapePnj(nom, c.heure)?.activite ?? null;
  const note = c.derniere?.note;
  switch (nom) {
    case 'Yao':
      if (c.derniere?.type === 'journee' && note !== undefined) return note >= 80
        ? `Belle journée : ${note}/100. Continue comme ça, je te confierai bientôt plus de responsabilités.`
        : note < 50 ? `La dernière journée n’était pas fameuse (${note}/100). On reprend les bases : équipement, consignes, puis le travail.`
        : `${note}/100 pour ta dernière journée : du bon travail, on peut encore gagner en rigueur.`;
      if (pluie(c.meteo)) return 'Avec cette pluie, on sécurise les échafaudages avant tout. Personne ne monte sans harnais.';
      if (activite === 'Au maquis') return c.journees ? 'Assieds-toi ! On parle du chantier de demain autour d’un garba.' : 'Tu es nouveau dans le quartier ? Viens me voir au chantier demain matin, à 6 h.';
      if (c.journees === 0) return 'Tu cherches du travail ? Une journée avec moi au Grand chantier, c’est jusqu’à 7 000 F. Rejoins-moi devant la base vie.';
      if (c.journees >= 5) return `Déjà ${c.journees} journées ensemble : l’équipe te connaît, maintenant. On attaque ?`;
      return null;
    case 'Koffi':
      if (activite === 'Déjeune au maquis') return 'Le garba de Tantie est le meilleur du quartier ! Assieds-toi, la pause est sacrée.';
      if (c.premiereJournee.finie && c.niveau < 6) return 'Alors, ce premier salaire, tu en fais quoi ? Un bon outil, c’est un investissement : regarde le patrimoine sur ton téléphone.';
      if (c.niveau >= 5) return 'Avec ton expérience, tu pourrais préparer toi-même les commandes du dépôt. Passe me voir aux heures d’ouverture.';
      return null;
    case 'Awa':
      if (activite === 'Au café') return 'Une soirée au café, ça fait du bien après les cours. Tu as pensé à réviser pour ton prochain examen ?';
      if (c.derniere?.type === 'seance' && note !== undefined && note >= 70) return `J’ai su pour ta séance : ${note}/100 ! Continue, les étapes suivantes t’ouvriront le diplôme.`;
      if (/étudiant/i.test(c.poste ?? '') || c.niveau <= 3) return 'Les cours du campus préparent au BTS comme à l’école d’ingénieurs. Viens à l’université : chaque étape compte.';
      return null;
    case 'Mariam':
      if (c.niveau >= 8) return 'Tu as le profil pour monter ta propre entreprise. La Tour BTP Life t’attend pour en parler.';
      if (c.chapitresFilRouge > 0) {
        // Le dossier dont on parle : celui du dernier chapitre validé, compté dans son dossier.
        const d = dossierDe(c.chapitresFilRouge - 1), faits = faitsDossier(d, c.chapitresFilRouge);
        return `${d.nom} : ${faits} chapitre${faits > 1 ? 's' : ''} déjà validé${faits > 1 ? 's' : ''}. ${d.accueil.nom} parle de toi.`;
      }
      return null;
    case 'Fatou':
      if (c.faim < 30) return 'Tu as l’air affamé ! Le maquis sert du garba à toute heure, va manger un morceau.';
      if (c.energie < 25) return 'Tu tombes de fatigue… Rentre te reposer un peu, le quartier sera encore là demain.';
      if (!c.premiereJournee.faites.includes('logement')) return 'Tu viens d’arriver ? Ma Résidence est juste là, à l’ouest de la place : commence par poser tes affaires.';
      return null;
    default:
      return null;
  }
}
