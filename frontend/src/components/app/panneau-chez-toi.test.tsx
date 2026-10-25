import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { programmeDuJour } from '@/lib/journee-joueur';
import { PanneauChezToi, PanneauMatin } from './panneau-chez-toi';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const avecClient = (ui: ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);
const JOUR = programmeDuJour(() => ({ etapes: 0, cycles: 0 }), true);

describe('chez soi', () => {
  it('au réveil, la journée commence par le chantier de Yao, avec les conseils des besoins', () => {
    const onAller = vi.fn();
    render(<PanneauMatin heure={6.5} rendezVous={JOUR} besoins={{ faim: 30, social: 80, moral: 80 }} onAller={onAller} onFermer={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Bonjour ! Il est 6 h 30' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Grand chantier');
    expect(screen.getByRole('button', { name: /Ventre creux/ })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Y aller' })[0]);
    expect(onAller).toHaveBeenCalledWith('chantier');
  });
  it('donne accès au courrier et à la garde-robe', () => {
    avecClient(<PanneauChezToi demo heure={10} rendezVous={JOUR} besoins={{ faim: 80, social: 80, moral: 80 }} onAller={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Courrier' }));
    expect(screen.getByText(/Connecte-toi pour lire les tiens/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Garde-robe' }));
    expect(screen.getByRole('dialog', { name: 'Cabine d’essayage' })).toBeInTheDocument();
  });
});
