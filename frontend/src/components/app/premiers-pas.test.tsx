import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { PanneauPremiersPas, RELANCE_PREMIERS_PAS_MS, usePremiersPas } from './premiers-pas';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  ApiError: class ApiError extends Error { constructor(public status: number) { super(`HTTP ${status}`); } },
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers(); });
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

describe('le guide sur un réseau lent', () => {
  const ETAT = { faites: [], termineLe: null, etapes: [], afficher: true, recompenses: {} };
  const REPONSE = { ...ETAT, faites: ['telephone'], recompense: { argentVirtuel: 500, xp: 15 } };

  it('garde un geste fait avant le chargement du guide, puis le valide une fois chargé', async () => {
    let charger: (etat: unknown) => void = () => undefined;
    vi.mocked(api.get).mockReturnValue(new Promise(resoudre => { charger = resoudre; }) as never);
    vi.mocked(api.post).mockResolvedValue(REPONSE as never);
    const { result } = renderHook(() => usePremiersPas({ demo: false }), { wrapper: avecClient });
    await act(async () => { await result.current.valider('telephone'); });
    expect(api.post).not.toHaveBeenCalled();
    await act(async () => { charger(ETAT); });
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/monde/premiers-pas/telephone'));
  });

  it('retente un envoi coupé par le réseau, mais pas un refus du serveur', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { ApiError } = await import('@/lib/api') as unknown as { ApiError: new (status: number) => Error };
    vi.mocked(api.get).mockResolvedValue(ETAT as never);
    vi.mocked(api.post).mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(REPONSE as never)
      .mockRejectedValueOnce(new ApiError(400));
    const { result } = renderHook(() => usePremiersPas({ demo: false }), { wrapper: avecClient });
    await waitFor(() => expect(result.current.afficher).toBe(true));
    await act(async () => { await result.current.valider('telephone'); });
    expect(api.post).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(RELANCE_PREMIERS_PAS_MS); });
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    // Un refus (400) n'est pas retenté.
    await act(async () => { await result.current.valider('seance'); });
    await act(async () => { vi.advanceTimersByTime(RELANCE_PREMIERS_PAS_MS * 2); });
    expect(api.post).toHaveBeenCalledTimes(3);
  });
});
