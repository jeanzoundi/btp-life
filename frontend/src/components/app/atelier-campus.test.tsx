import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AtelierCampus } from './atelier-campus';

afterEach(cleanup);

describe('activités du campus', () => {
  it('ne valide que la bonne réponse et ne compte pas deux fois un exercice', () => {
    const reussite = vi.fn();
    render(<AtelierCampus station="bim" onReussite={reussite} />);
    fireEvent.click(screen.getByText('Commencer un exercice guidé'));
    fireEvent.click(screen.getByText('Percer directement la poutre'));
    expect(reussite).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Réessayez');
    const bonneReponse = screen.getByText('Coordonner un nouveau passage avec le bureau structure');
    fireEvent.click(bonneReponse);
    fireEvent.click(bonneReponse);
    expect(reussite).toHaveBeenCalledTimes(1);
    expect(bonneReponse).toBeDisabled();
  });

  it('conserve le verrouillage quand on revient dans une salle déjà terminée', () => {
    const reussite = vi.fn();
    render(<AtelierCampus station="bim" dejaReussi onReussite={reussite} />);
    fireEvent.click(screen.getByText('Revoir l’exercice réussi'));
    expect(screen.getByText('Coordonner un nouveau passage avec le bureau structure')).toBeDisabled();
    expect(reussite).not.toHaveBeenCalled();
  });

  it('propose un dialogue de restauration, pas un faux cours au restaurant', () => {
    render(<AtelierCampus station="cafeteria" onReussite={vi.fn()} />);
    expect(screen.queryByText('Commencer un exercice guidé')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Parler au responsable'));
    expect(screen.getByText(/Bienvenue au restaurant/)).toBeInTheDocument();
  });
});
