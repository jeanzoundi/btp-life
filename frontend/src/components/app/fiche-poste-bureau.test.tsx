import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { FichePosteBureau } from './fiche-poste-bureau';

it('permet de parcourir la fiche sans prétendre valider une mission', () => {
  const fermer = vi.fn();
  render(<FichePosteBureau station="plans" onFermer={fermer} />);
  fireEvent.click(screen.getByLabelText('Repérer les accès et la circulation'));
  expect(screen.getByRole('status')).toHaveTextContent('1 / 3');
  expect(screen.getByText(/Ne valide aucune mission/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Fermer la fiche' }));
  expect(fermer).toHaveBeenCalledOnce();
});
