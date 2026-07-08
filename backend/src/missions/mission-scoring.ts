// Moteur de correction des missions — voir CONCEPTION.md §8 et §10.
// Chaque MissionContenu porte un typeQuestion qui détermine comment
// `bonnesReponses` et `options` sont interprétés (contrat fixé ici et
// respecté par prisma/seed.ts).

export interface ScoredOption {
  id: string;
  label: string;
  points?: number;
  consequences?: { reputation?: number; budget?: number; securite?: boolean };
  [key: string]: unknown;
}

export interface ContenuAEvaluer {
  id: string;
  typeQuestion: string;
  bonnesReponses: unknown;
  options: unknown;
  consequences: unknown;
  tolerance?: number | null;
}

export interface ResultatItem {
  contenuId: string;
  correct: boolean;
  pointsObtenus: number; // sur 100
  reputationDelta: number;
  budgetDelta: number;
  securiteEchec: boolean;
}

function setsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((v) => setB.has(v));
}

export function evaluerReponse(contenu: ContenuAEvaluer, reponse: unknown): ResultatItem {
  const options = (contenu.options as ScoredOption[] | null) ?? [];
  let correct = false;
  let pointsObtenus = 0;
  let reputationDelta = 0;
  let budgetDelta = 0;
  let securiteEchec = false;

  switch (contenu.typeQuestion) {
    case 'QCM': {
      const attendu = (contenu.bonnesReponses as string[]) ?? [];
      const donne = Array.isArray(reponse) ? (reponse as string[]) : [];
      correct = setsEqual(attendu, donne);
      pointsObtenus = correct ? 100 : 0;
      break;
    }
    case 'NUMERIQUE': {
      const attendu = Number(contenu.bonnesReponses);
      const tolerance = contenu.tolerance ?? 0;
      const donne = Number(reponse);
      correct = !Number.isNaN(donne) && Math.abs(donne - attendu) <= tolerance;
      pointsObtenus = correct ? 100 : 0;
      break;
    }
    case 'ZONE_IMAGE': {
      const attendu = (contenu.bonnesReponses as string[]) ?? [];
      const donne = Array.isArray(reponse) ? (reponse as string[]) : [];
      correct = setsEqual(attendu, donne);
      pointsObtenus = correct ? 100 : 0;
      break;
    }
    case 'ORDONNANCEMENT': {
      const attendu = (contenu.bonnesReponses as string[]) ?? [];
      const donne = Array.isArray(reponse) ? (reponse as string[]) : [];
      correct = JSON.stringify(attendu) === JSON.stringify(donne);
      if (correct) {
        pointsObtenus = 100;
      } else if (donne.length === attendu.length) {
        const bonnesPositions = attendu.filter((v, i) => v === donne[i]).length;
        pointsObtenus = Math.round((bonnesPositions / attendu.length) * 100);
      }
      break;
    }
    case 'CHOIX_CONSEQUENCE': {
      const optionId = String(reponse);
      const option = options.find((o) => o.id === optionId);
      // Le seed stocke la meilleure option en scalaire ('a') ou en tableau (['a']) : accepter les deux.
      const meilleureOptionId = Array.isArray(contenu.bonnesReponses)
        ? String((contenu.bonnesReponses as unknown[])[0])
        : String(contenu.bonnesReponses);
      correct = optionId === meilleureOptionId;
      pointsObtenus = option?.points ?? (correct ? 100 : 0);
      reputationDelta = option?.consequences?.reputation ?? 0;
      budgetDelta = option?.consequences?.budget ?? 0;
      securiteEchec = Boolean(option?.consequences?.securite) && !correct;
      break;
    }
    case 'TEXTE': {
      const motsCles = (contenu.bonnesReponses as string[]) ?? [];
      const texte = String(reponse ?? '').toLowerCase();
      correct = motsCles.length === 0 || motsCles.some((mot) => texte.includes(mot.toLowerCase()));
      pointsObtenus = correct ? 100 : 40; // le texte libre n'est jamais un échec sec
      break;
    }
    default:
      pointsObtenus = 0;
  }

  return {
    contenuId: contenu.id,
    correct,
    pointsObtenus,
    reputationDelta,
    budgetDelta,
    securiteEchec,
  };
}

export interface ResultatMission {
  score: number;
  reussie: boolean;
  items: ResultatItem[];
  reputationDelta: number;
  budgetDelta: number;
  securiteEchec: boolean;
  bonusChrono: number;
}

export function calculerScoreMission(params: {
  contenus: ContenuAEvaluer[];
  reponses: Record<string, unknown>;
  scoreMax: number;
  conditionReussite: number;
  dureeLimiteSec?: number | null;
  tempsUtiliseSec?: number | null;
}): ResultatMission {
  const { contenus, reponses, scoreMax, conditionReussite, dureeLimiteSec, tempsUtiliseSec } = params;

  const items = contenus.map((contenu) => evaluerReponse(contenu, reponses[contenu.id]));
  const moyenne = items.length
    ? items.reduce((sum, item) => sum + item.pointsObtenus, 0) / items.length
    : 0;

  let bonusChrono = 0;
  if (dureeLimiteSec && typeof tempsUtiliseSec === 'number' && tempsUtiliseSec <= dureeLimiteSec) {
    const resteRatio = (dureeLimiteSec - tempsUtiliseSec) / dureeLimiteSec;
    bonusChrono = Math.min(10, Math.round(resteRatio * 10));
  }

  let score = Math.round((moyenne / 100) * scoreMax) + bonusChrono;
  score = Math.min(scoreMax, Math.max(0, score));

  const securiteEchec = items.some((item) => item.securiteEchec);
  if (securiteEchec) {
    score = Math.min(score, 50);
  }

  const reputationDelta = items.reduce((sum, item) => sum + item.reputationDelta, 0);
  const budgetDelta = items.reduce((sum, item) => sum + item.budgetDelta, 0);
  const reussie = score >= conditionReussite;

  return { score, reussie, items, reputationDelta, budgetDelta, securiteEchec, bonusChrono };
}
