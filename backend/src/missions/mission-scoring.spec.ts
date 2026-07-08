import { calculerScoreMission, evaluerReponse, type ContenuAEvaluer } from './mission-scoring';

function contenu(overrides: Partial<ContenuAEvaluer>): ContenuAEvaluer {
  return {
    id: 'c1',
    typeQuestion: 'QCM',
    bonnesReponses: [],
    options: [],
    consequences: null,
    ...overrides,
  };
}

describe('evaluerReponse', () => {
  it('QCM : correct quand les ensembles de réponses correspondent, peu importe l’ordre', () => {
    const c = contenu({ typeQuestion: 'QCM', bonnesReponses: ['a', 'b'] });
    expect(evaluerReponse(c, ['b', 'a']).correct).toBe(true);
    expect(evaluerReponse(c, ['a']).correct).toBe(false);
    expect(evaluerReponse(c, ['a', 'b', 'c']).correct).toBe(false);
  });

  it('NUMERIQUE : accepte dans la tolérance, refuse en dehors', () => {
    const c = contenu({ typeQuestion: 'NUMERIQUE', bonnesReponses: 100, tolerance: 5 });
    expect(evaluerReponse(c, 103).correct).toBe(true);
    expect(evaluerReponse(c, 96).correct).toBe(true);
    expect(evaluerReponse(c, 110).correct).toBe(false);
    expect(evaluerReponse(c, 'pas un nombre').correct).toBe(false);
  });

  it('ORDONNANCEMENT : score partiel proportionnel aux positions correctes', () => {
    const c = contenu({ typeQuestion: 'ORDONNANCEMENT', bonnesReponses: ['a', 'b', 'c', 'd'] });
    expect(evaluerReponse(c, ['a', 'b', 'c', 'd']).pointsObtenus).toBe(100);
    // 2 positions sur 4 correctes (a et c) → 50
    expect(evaluerReponse(c, ['a', 'x', 'c', 'y']).pointsObtenus).toBe(50);
    expect(evaluerReponse(c, ['a', 'b', 'c', 'd']).correct).toBe(true);
  });

  it('CHOIX_CONSEQUENCE : applique les conséquences de l’option choisie, accepte bonnesReponses en scalaire ou tableau', () => {
    const options = [
      { id: 'a', label: 'Prudent', points: 80, consequences: { reputation: 2, budget: -500 } },
      { id: 'b', label: 'Risqué', points: 40, consequences: { reputation: -5, budget: 0, securite: true } },
    ];
    const scalaire = contenu({ typeQuestion: 'CHOIX_CONSEQUENCE', bonnesReponses: 'a', options });
    const tableau = contenu({ typeQuestion: 'CHOIX_CONSEQUENCE', bonnesReponses: ['a'], options });

    const resultatA = evaluerReponse(scalaire, 'a');
    expect(resultatA.correct).toBe(true);
    expect(resultatA.pointsObtenus).toBe(80);
    expect(resultatA.reputationDelta).toBe(2);
    expect(resultatA.budgetDelta).toBe(-500);

    expect(evaluerReponse(tableau, 'a').correct).toBe(true);

    const resultatB = evaluerReponse(scalaire, 'b');
    expect(resultatB.correct).toBe(false);
    expect(resultatB.securiteEchec).toBe(true);
  });

  it('TEXTE : n’est jamais un échec sec (40 points minimum) même sans mot-clé trouvé', () => {
    const c = contenu({ typeQuestion: 'TEXTE', bonnesReponses: ['sécurité', 'casque'] });
    expect(evaluerReponse(c, 'je porte mon casque').pointsObtenus).toBe(100);
    expect(evaluerReponse(c, 'réponse hors sujet').pointsObtenus).toBe(40);
  });
});

describe('calculerScoreMission', () => {
  const contenus: ContenuAEvaluer[] = [
    contenu({ id: 'c1', typeQuestion: 'QCM', bonnesReponses: ['a'] }),
    contenu({ id: 'c2', typeQuestion: 'QCM', bonnesReponses: ['b'] }),
  ];

  it('calcule le score proportionnellement à scoreMax et détermine la réussite via conditionReussite', () => {
    const resultat = calculerScoreMission({
      contenus,
      reponses: { c1: ['a'], c2: ['b'] },
      scoreMax: 100,
      conditionReussite: 60,
    });
    expect(resultat.score).toBe(100);
    expect(resultat.reussie).toBe(true);
  });

  it('échoue proprement sous le seuil de réussite sans jamais aller sous 0', () => {
    const resultat = calculerScoreMission({
      contenus,
      reponses: { c1: ['x'], c2: ['y'] },
      scoreMax: 100,
      conditionReussite: 60,
    });
    expect(resultat.score).toBe(0);
    expect(resultat.reussie).toBe(false);
  });

  it('ajoute un bonus chrono borné à 10 points quand la mission est terminée dans les temps', () => {
    const resultat = calculerScoreMission({
      contenus,
      reponses: { c1: ['a'], c2: ['b'] },
      scoreMax: 90,
      conditionReussite: 50,
      dureeLimiteSec: 100,
      tempsUtiliseSec: 0, // tout le temps restant → bonus maximal
    });
    // moyenne 100 % de 90 = 90, + bonus chrono plafonné à 10 → 100, mais jamais au-delà de scoreMax
    expect(resultat.score).toBe(90);
    expect(resultat.bonusChrono).toBeLessThanOrEqual(10);
  });

  it('plafonne le score à 50 en cas d’échec sécurité, même avec un bon score', () => {
    const contenuRisque = contenu({
      id: 'c1',
      typeQuestion: 'CHOIX_CONSEQUENCE',
      bonnesReponses: 'a',
      options: [{ id: 'b', label: 'Risqué', points: 90, consequences: { securite: true } }],
    });
    const resultat = calculerScoreMission({
      contenus: [contenuRisque],
      reponses: { c1: 'b' },
      scoreMax: 100,
      conditionReussite: 60,
    });
    expect(resultat.securiteEchec).toBe(true);
    expect(resultat.score).toBeLessThanOrEqual(50);
  });

  it('additionne les deltas de réputation et de budget sur tous les items', () => {
    const contenusConsequences: ContenuAEvaluer[] = [
      contenu({
        id: 'c1',
        typeQuestion: 'CHOIX_CONSEQUENCE',
        bonnesReponses: 'a',
        options: [{ id: 'a', label: 'A', points: 100, consequences: { reputation: 3, budget: 100 } }],
      }),
      contenu({
        id: 'c2',
        typeQuestion: 'CHOIX_CONSEQUENCE',
        bonnesReponses: 'a',
        options: [{ id: 'a', label: 'A', points: 100, consequences: { reputation: 2, budget: 50 } }],
      }),
    ];
    const resultat = calculerScoreMission({
      contenus: contenusConsequences,
      reponses: { c1: 'a', c2: 'a' },
      scoreMax: 100,
      conditionReussite: 50,
    });
    expect(resultat.reputationDelta).toBe(5);
    expect(resultat.budgetDelta).toBe(150);
  });
});
