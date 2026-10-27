import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PanneauFinCampagne, TEASER_CAMPAGNE, finCampagneAMontrer } from './fin-campagne';

afterEach(cleanup);

describe('la fin du fil rouge', () => {
  it('ne s’affiche qu’une fois la campagne finie, la progression chargée, le joueur libre, et jamais deux fois', () => {
    const base = { chapitres: 9, total: 9, pret: true, dejaVue: false, occupe: false };
    expect(finCampagneAMontrer(base)).toBe(true);
    expect(finCampagneAMontrer({ ...base, chapitres: 8 })).toBe(false);
    expect(finCampagneAMontrer({ ...base, pret: false })).toBe(false);
    expect(finCampagneAMontrer({ ...base, occupe: true })).toBe(false);
    expect(finCampagneAMontrer({ ...base, dejaVue: true })).toBe(false);
  });
  it('salue le joueur, propose la suite et annonce le prochain ouvrage', () => {
    const onSuite = vi.fn(), onFermer = vi.fn();
    render(<PanneauFinCampagne nomJoueur="Koffi" onSuite={onSuite} onFermer={onFermer} />);
    expect(screen.getByRole('heading', { name: 'La Résidence Akwaba est livrée !' })).toBeInTheDocument();
    expect(screen.getByText(/Bravo Koffi/)).toBeInTheDocument();
    expect(screen.getByText(TEASER_CAMPAGNE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voir mon parcours' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choisir un chantier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le chat' }));
    expect(onSuite.mock.calls.map(c => c[0])).toEqual(['carriere', 'chantiers', 'equipe']);
    fireEvent.click(screen.getByRole('button', { name: 'Continuer à jouer' }));
    expect(onFermer).toHaveBeenCalled();
  });
});
