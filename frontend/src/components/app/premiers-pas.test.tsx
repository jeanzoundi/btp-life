import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PanneauPremiersPas, usePremiersPas } from './premiers-pas';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
afterEach(cleanup);
const avecClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;

describe('le panneau des premiers pas', () => {
  it('montre l’avancée, détaille la prochaine étape, se replie et se masque', () => {
    const onBasculer = vi.fn(), onMasquer = vi.fn();
    render(<PanneauPremiersPas faites={['deplacement', 'telephone']} ouvert onBasculer={onBasculer} onMasquer={onMasquer} />);
    expect(screen.getByText('Premiers pas · 2/5')).toBeInTheDocument();
    expect(screen.getByText('Clique sur un bâtiment : tu t’y rends, puis tu entres.')).toBeInTheDocument();
    expect(screen.queryByText(/Touche T/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Replier le guide' }));
    expect(onBasculer).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Masquer le guide' }));
    expect(onMasquer).toHaveBeenCalled();
  });

  it('replié, garde seulement la prochaine étape en vue', () => {
    const onBasculer = vi.fn();
    render(<PanneauPremiersPas faites={['deplacement', 'telephone']} ouvert={false} onBasculer={onBasculer} onMasquer={vi.fn()} />);
    expect(screen.getByText('▸ Entre dans un lieu')).toBeInTheDocument();
    expect(screen.queryByText('Salue le quartier')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Masquer le guide' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Déplier le guide' }));
    expect(onBasculer).toHaveBeenCalled();
  });
});

describe('le guide en démonstration', () => {
  it('valide chaque étape une fois, récompense, et se termine avec le bonus de fin', async () => {
    const onEtape = vi.fn();
    const { result } = renderHook(() => usePremiersPas({ demo: true, onEtape }), { wrapper: avecClient });
    await act(async () => { await result.current.valider('telephone'); await result.current.valider('telephone'); });
    expect(result.current.faites).toEqual(['telephone']);
    expect(onEtape).toHaveBeenCalledTimes(1);
    expect(onEtape).toHaveBeenCalledWith('telephone', false, { argent: 500, xp: 15 });
    await act(async () => {
      // Plusieurs étapes coup sur coup ne s'écrasent pas.
      for (const etape of ['deplacement', 'lieu', 'seance', 'quartier'] as const) await result.current.valider(etape);
    });
    expect(result.current.faites).toEqual(['deplacement', 'telephone', 'lieu', 'seance', 'quartier']);
    expect(onEtape).toHaveBeenLastCalledWith('quartier', true, { argent: 2_500, xp: 65 });
    expect(result.current.afficher).toBe(false);
  });
});
