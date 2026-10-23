import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PanneauJourneeChantier, PanneauPlanning, PanneauRecrutement, TacheChantier } from './panneau-journee-chantier';
import { bilanJournee, CHANTIER_QUARTIER_INITIAL, nouvelleJournee, repondre, situation, SITUATION_EPI, type Journee } from '@/lib/journee-chantier';
import { budgetRecrutement, candidats, etatVisuel, type Metier } from '@/lib/programme-chantier';

afterEach(cleanup);
const GROS_OEUVRE: Metier[] = ['Chef d’équipe', 'Maçon', 'Manœuvre', 'Ferrailleur', 'Coffreur'];
const equipe = candidats(1, GROS_OEUVRE).filter(o => o.id.endsWith('-q'));
const actions = () => ({ onCommencer: vi.fn(), onBilan: vi.fn(), onTerminer: vi.fn(), onAbandonner: vi.fn(), onDiscuter: vi.fn(), onPlanning: vi.fn(), onFermer: vi.fn() });
const base = { nomJoueur: 'Jean', nomChantier: 'Résidence Lagune II', etat: etatVisuel(4), simulateur: false, demo: true, journee: null, resultat: null, enCours: false };
const journee = (jours: number) => nouvelleJournee({ ...CHANTIER_QUARTIER_INITIAL, jours, equipe });
const repondreTout = (j: Journee, correct: boolean) => { for (const t of j.taches) j = repondre(j, t.id, situation(t.id)!.choix.findIndex(c => c.correct === correct)); return j; };

describe('Yao et la journée de travail', () => {
  it('donne la consigne de l’étape du jour et propose de commencer', () => {
    const a = actions();
    render(<PanneauJourneeChantier {...base} {...a} statut="disponible" />);
    expect(screen.getByText(/Jour 5 sur 18 : semelles de fondation/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la journée' }));
    expect(a.onCommencer).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /Planning et équipe/ }));
    expect(a.onPlanning).toHaveBeenCalledOnce();
  });
  it('commence le premier jour par le recrutement', () => {
    render(<PanneauJourneeChantier {...base} {...actions()} etat={etatVisuel(0)} statut="disponible" />);
    expect(screen.getByText(/recrute au bureau un chef d’équipe/)).toBeInTheDocument();
  });
  it('suit les tâches du jour jusqu’au bilan', () => {
    render(<PanneauJourneeChantier {...base} {...actions()} statut="en_cours" journee={repondre(journee(4), 'epi', 0)} />);
    expect(screen.getByText('Béton de propreté')).toBeInTheDocument();
    expect(screen.getByText('Livraison d’aciers')).toBeInTheDocument();
    expect(screen.getByText('Bilan avec Yao')).toBeInTheDocument();
  });
  it('affiche le bilan, la suite du programme et les gains de démonstration', () => {
    const j = repondreTout(journee(4), true), a = actions();
    render(<PanneauJourneeChantier {...base} {...a} statut="resultat" journee={j} resultat={{ bilan: bilanJournee(j), avant: 22, apres: 28, recompenses: 'demo', etapeAvant: 'Semelles de fondation', etapeApres: 'Semelles de fondation' }} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Journée exemplaire')).toBeInTheDocument();
    expect(screen.getByText(/Demain : semelles de fondation, suite/)).toBeInTheDocument();
    expect(screen.getByText(/\+7\s000/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Terminer la journée' }));
    expect(a.onTerminer).toHaveBeenCalledOnce();
  });
  it('explique qu’une journée ratée est à refaire', () => {
    const j = repondreTout(journee(2), false);
    render(<PanneauJourneeChantier {...base} {...actions()} statut="resultat" journee={j} resultat={{ bilan: bilanJournee(j), avant: 11, apres: 11, recompenses: 'demo', etapeAvant: 'Terrassement et fouilles', etapeApres: 'Terrassement et fouilles' }} />);
    expect(screen.getByText(/Journée à refaire : terrassement et fouilles reprend demain/)).toBeInTheDocument();
  });
  it('montre le journal du simulateur, ou son refus avec le lien vers le chantier', () => {
    const j = repondreTout(journee(6), true);
    const { unmount } = render(<PanneauJourneeChantier {...base} {...actions()} statut="resultat" simulateur demo={false} journee={j} resultat={{ bilan: bilanJournee(j), avant: 30, apres: 36, recompenses: 'simulateur', evenements: [{ type: 'travail', texte: 'Journée de travail : Fondations avance de 6 %.' }] }} />);
    expect(screen.getByText(/Fondations avance de 6 %/)).toBeInTheDocument();
    expect(screen.getByText(/30 → 36 %/)).toBeInTheDocument();
    unmount();
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

describe('recrutement au bureau de chantier', () => {
  it('fait choisir un candidat par métier dans le budget, puis évalue l’équipe', () => {
    const metiers: Metier[] = ['Maçon', 'Manœuvre'];
    const onValider = vi.fn(), onFermer = vi.fn();
    render(<PanneauRecrutement graine={2} metiers={metiers} budget={budgetRecrutement(metiers)} onValider={onValider} onFermer={onFermer} />);
    expect(screen.getByRole('button', { name: /Choisis un candidat par métier \(0\/2\)/ })).toBeDisabled();
    const liste = candidats(2, metiers);
    const qualifie = (m: Metier) => liste.find(o => o.metier === m && o.id.endsWith('-q'))!;
    fireEvent.click(screen.getByLabelText(new RegExp(qualifie('Maçon').nom)));
    fireEvent.click(screen.getByLabelText(new RegExp(qualifie('Manœuvre').nom)));
    expect(screen.getByText(/23\s000 F \/ 26\s000 F/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Embaucher cette équipe' }));
    expect(onValider).toHaveBeenCalledWith([qualifie('Maçon'), qualifie('Manœuvre')], expect.objectContaining({ complete: true }));
    expect(screen.getByRole('status')).toHaveTextContent('Bonne équipe');
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(onFermer).toHaveBeenCalledOnce();
  });
  it('signale un profil à risque', () => {
    const metiers: Metier[] = ['Maçon'];
    render(<PanneauRecrutement graine={5} metiers={metiers} budget={budgetRecrutement(metiers)} onValider={vi.fn()} onFermer={vi.fn()} />);
    const risque = candidats(5, metiers).find(o => !o.fiable)!;
    fireEvent.click(screen.getByLabelText(new RegExp(risque.nom)));
    fireEvent.click(screen.getByRole('button', { name: 'Embaucher cette équipe' }));
    expect(screen.getByRole('status')).toHaveTextContent('Équipe à revoir');
    expect(screen.getByRole('status')).toHaveTextContent(risque.nom);
  });
});

describe('planning du chantier', () => {
  it('liste les étapes avec leur durée et l’équipe avec sa masse salariale', () => {
    render(<PanneauPlanning etat={etatVisuel(4)} equipe={equipe} onFermer={vi.fn()} />);
    expect(screen.getByText('Jour 5 sur 18')).toBeInTheDocument();
    expect(screen.getByText('Semelles de fondation')).toBeInTheDocument();
    expect(screen.getByText('en cours')).toBeInTheDocument();
    expect(screen.getAllByText('✓')).toHaveLength(3);
    expect(screen.getByText('Masse salariale du jour')).toBeInTheDocument();
  });
});
