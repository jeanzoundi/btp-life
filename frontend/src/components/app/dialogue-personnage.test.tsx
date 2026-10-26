import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DialoguePersonnage } from './dialogue-personnage';

afterEach(cleanup);
const actions = () => ({ onLien: vi.fn(), onLieu: vi.fn(), onClose: vi.fn() });

describe('la conversation avec un habitant', () => {
  it('affiche le palier, ce qui manque pour le suivant, et rapproche à chaque échange', () => {
    const a = actions();
    render(<DialoguePersonnage nom="Koffi" affinite={12} {...a} />);
    expect(screen.getByText('Connaissance · Affinité 12/100')).toBeInTheDocument();
    expect(screen.getByText(/Encore 8 points pour « Bonne entente »/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Faire connaissance' }));
    expect(a.onLien).toHaveBeenCalledWith(4);
    fireEvent.click(screen.getByRole('button', { name: 'Discuter d’une situation du quartier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Faire valider une solution équivalente' }));
    expect(a.onLien).toHaveBeenLastCalledWith(6);
  });
  it('partage un conseil de métier en bonne entente', () => {
    render(<DialoguePersonnage nom="Koffi" affinite={25} {...actions()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Demander un conseil de métier' }));
    expect(screen.getByRole('status')).toHaveTextContent('palettes entières');
  });
});
