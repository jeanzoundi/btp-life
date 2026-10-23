import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PanneauJourneeChantier, TacheChantier } from './panneau-journee-chantier';
import { bilanJournee, etatVisuel, nouvelleJournee, repondre, situation, SITUATION_EPI } from '@/lib/journee-chantier';

afterEach(cleanup);
const actions = () => ({ onCommencer: vi.fn(), onBilan: vi.fn(), onTerminer: vi.fn(), onAbandonner: vi.fn(), onDiscuter: vi.fn(), onFermer: vi.fn() });
const base = { nomJoueur: 'Jean', nomChantier: 'Résidence Lagune II', etat: etatVisuel(24), simulateur: false, demo: true, journee: null, resultat: null, enCours: false };
const bonnesReponses = (numero: number) => {
  let j = nouvelleJournee(numero);
  for (const id of ['epi', ...j.securite, j.livraison]) j = repondre(j, id, situation(id)!.choix.findIndex(c => c.correct));
  return j;
};

describe('Yao et la journée de travail', () => {
  it('propose de commencer la journée quand le chantier est ouvert', () => {
    const a = actions();
    render(<PanneauJourneeChantier {...base} {...a} statut="disponible" />);
    expect(screen.getByText(/fondations sur Résidence Lagune II/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la journée' }));
    expect(a.onCommencer).toHaveBeenCalledOnce();
  });
  it('suit les étapes en cours, avec le compte des points de sécurité', () => {
    let j = repondre(nouvelleJournee(2), 'epi', 0);
    j = repondre(j, j.securite[0], 0);
    render(<PanneauJourneeChantier {...base} {...actions()} statut="en_cours" journee={j} />);
    expect(screen.getByText('Fais le tour de sécurité')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });
  it('affiche le bilan de démonstration avec salaire et expérience', () => {
    const j = bonnesReponses(0), bilan = bilanJournee(j), a = actions();
    render(<PanneauJourneeChantier {...base} {...a} statut="resultat" journee={j} resultat={{ bilan, avant: 24, apres: 24 + bilan.avancement, recompenses: 'demo' }} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Journée exemplaire')).toBeInTheDocument();
    expect(screen.getByText(/\+7\s000/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Terminer la journée' }));
    expect(a.onTerminer).toHaveBeenCalledOnce();
  });
  it('montre le journal du simulateur après une vraie journée', () => {
    const j = bonnesReponses(1);
    render(<PanneauJourneeChantier {...base} {...actions()} statut="resultat" simulateur demo={false} journee={j} resultat={{ bilan: bilanJournee(j), avant: 30, apres: 36, recompenses: 'simulateur', evenements: [{ type: 'travail', texte: 'Journée de travail : Fondations avance de 6 %.' }] }} />);
    expect(screen.getByText(/Fondations avance de 6 %/)).toBeInTheDocument();
    expect(screen.getByText(/30 → 36 %/)).toBeInTheDocument();
  });
  it('explique un refus du simulateur et renvoie vers la gestion du chantier', () => {
    const j = nouvelleJournee(0);
    render(<PanneauJourneeChantier {...base} {...actions()} statut="resultat" simulateur demo={false} journee={j} resultat={{ bilan: bilanJournee(j), avant: 30, apres: 30, recompenses: 'simulateur', erreur: 'Aucun ouvrier actif', idChantier: 'uc1' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Aucun ouvrier actif');
    expect(screen.getByRole('link', { name: 'Gérer le chantier' })).toHaveAttribute('href', '/app/chantiers/uc1');
  });
  it('ferme le chantier hors des horaires', () => {
    render(<PanneauJourneeChantier {...base} {...actions()} statut="ferme" />);
    expect(screen.getByText(/entre 6 h et 18 h/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Commencer la journée' })).not.toBeInTheDocument();
  });
});

describe('situation de terrain', () => {
  it('garde le retour affiché après la réponse, jusqu’à « Continuer »', () => {
    const onRepondre = vi.fn(), onFermer = vi.fn();
    render(<TacheChantier etape="Équipement" situation={SITUATION_EPI} onRepondre={onRepondre} onFermer={onFermer} />);
    fireEvent.click(screen.getByRole('button', { name: /Juste le casque/ }));
    expect(onRepondre).toHaveBeenCalledWith(1);
    expect(screen.getByRole('status')).toHaveTextContent('Pas la bonne décision');
    expect(screen.queryByRole('button', { name: /Juste le casque/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(onFermer).toHaveBeenCalledOnce();
  });
});
