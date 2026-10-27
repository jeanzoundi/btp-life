import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROGRAMME_LABORATOIRE as LAB } from '@/lib/lieux-programme/laboratoire';
import { bilanSeance, nouvelleSeance, noter, PROGRES_INITIAL, type TacheSelection } from '@/lib/programme-lieu';
import { PanneauMentor, TacheSelectionLieu, type ResultatSeance } from './panneau-programme-lieu';

afterEach(cleanup);
const actions = () => ({ onCommencer: vi.fn(), onBilan: vi.fn(), onTerminer: vi.fn(), onAbandonner: vi.fn(), onProgramme: vi.fn(), onAttendre: vi.fn(), onFermer: vi.fn() });
const seance = nouvelleSeance(LAB, PROGRES_INITIAL);
const faite = seance.taches.reduce((s, t) => noter(s, t.id, 100), seance);
const base = { programme: LAB, nomJoueur: 'Jean', etape: 0, cycle: 0, seance: null, resultat: null, demo: false };
const resultat = (r: Partial<ResultatSeance>): ResultatSeance => ({ bilan: bilanSeance(faite), etapeAvant: 'Réception des échantillons', etapeApres: 'Essai d’affaissement', cycleBoucle: false, recompenses: 'serveur', ...r });
const gains = { xp: 41, argent: 2000, reputation: 1, facteurBesoins: .82, entrainement: false, prochaineRecompenseLe: '2026-10-24T10:20:00.000Z' };

describe('le mentor du lieu', () => {
  it('rappelle le chapitre du fil rouge qui l’attend, sauf pendant un bilan', () => {
    const onOuvrir = vi.fn();
    const { rerender } = render(<PanneauMentor {...base} {...actions()} statut="disponible" filRouge={{ libelle: 'Chapitre 2 · Ce que dit le sol', onOuvrir }} />);
    fireEvent.click(screen.getByRole('button', { name: /Fil rouge · Résidence Akwaba\s*Chapitre 2 · Ce que dit le sol/ }));
    expect(onOuvrir).toHaveBeenCalledOnce();
    rerender(<PanneauMentor {...base} {...actions()} statut="resultat" resultat={resultat({})} filRouge={{ libelle: 'Chapitre 2 · Ce que dit le sol', onOuvrir }} />);
    expect(screen.queryByText(/Fil rouge/)).not.toBeInTheDocument();
  });
  it('annonce une séance payée quand le joueur est connecté', () => {
    const a = actions();
    render(<PanneauMentor {...base} {...a} statut="disponible" />);
    expect(screen.getByText(/jusqu’à 2 000 F et 50 XP/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la séance' }));
    expect(a.onCommencer).toHaveBeenCalledOnce();
  });
  it('bloque le bilan pendant l’enregistrement', () => {
    render(<PanneauMentor {...base} {...actions()} statut="bilan" seance={faite} enregistrement />);
    expect(screen.getByRole('button', { name: 'Enregistrement de la séance…' })).toBeDisabled();
  });
  it('montre ce que le serveur a versé, et la forme du personnage quand elle rogne l’XP', () => {
    render(<PanneauMentor {...base} {...actions()} statut="resultat" resultat={resultat({ gains })} />);
    expect(screen.getByText('+2 000')).toBeInTheDocument();
    expect(screen.getByText('+41')).toBeInTheDocument();
    expect(screen.getByText(/\+1 de réputation/)).toBeInTheDocument();
    expect(screen.getByText(/Forme du moment : 82 %/)).toBeInTheDocument();
    expect(screen.queryByText(/Démonstration/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Travail d’équipe/)).not.toBeInTheDocument();
  });
  it('dit quand un coéquipier présent a valu un bonus d’XP', () => {
    render(<PanneauMentor {...base} {...actions()} statut="resultat" resultat={resultat({ gains: { ...gains, xp: 45, equipe: { coequipiers: ['Kader'], bonus: .1 } } })} />);
    expect(screen.getByText('🤝 Travail d’équipe avec Kader : +10 % d’XP')).toBeInTheDocument();
  });
  it('explique l’entraînement quand la séance n’est pas payée', () => {
    render(<PanneauMentor {...base} {...actions()} statut="resultat" resultat={resultat({ gains: { ...gains, xp: 13, argent: 0, reputation: 0, facteurBesoins: 1, entrainement: true } })} />);
    expect(screen.getByText(/Entraînement : la progression avance/)).toBeInTheDocument();
    expect(screen.getByText('+0')).toBeInTheDocument();
  });
  it('signale une séance que le serveur n’a pas pu enregistrer', () => {
    render(<PanneauMentor {...base} {...actions()} statut="resultat" resultat={resultat({ erreur: 'Cette étape n’est plus celle du jour : actualise la page.' })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Séance non enregistrée');
    expect(screen.queryByText(/Étape validée/)).not.toBeInTheDocument();
  });
  it('propose de passer le temps quand le lieu est fermé', () => {
    const a = actions();
    render(<PanneauMentor {...base} {...a} statut="ferme" />);
    fireEvent.click(screen.getByRole('button', { name: /Attendre l’ouverture · 7 h/ }));
    expect(a.onAttendre).toHaveBeenCalledOnce();
  });
});

describe('pièces à choisir', () => {
  it('note la sélection sur les pièces d’origine, quel que soit l’ordre affiché', () => {
    const selection: TacheSelection = { titre: 'Pièces du dossier', enonce: 'Prépare le dossier.', consigne: 'Coche les pièces exigées', options: [
      { texte: 'Plan de masse', attendu: true, explication: 'Exigé.' }, { texte: 'Titre foncier', attendu: true, explication: 'Exigé.' }, { texte: 'Photo de vacances', attendu: false, explication: 'Hors sujet.' },
    ] };
    const onScore = vi.fn();
    render(<TacheSelectionLieu etape="Dossier" selection={selection} onScore={onScore} onFermer={vi.fn()} />);
    fireEvent.click(screen.getByText('Plan de masse'));
    fireEvent.click(screen.getByText('Titre foncier'));
    fireEvent.click(screen.getByRole('button', { name: /Valider \(2 cochés\)/ }));
    expect(onScore).toHaveBeenCalledWith(100);
    expect(screen.getByRole('status')).toHaveTextContent('Sélection parfaite');
  });
});
