import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { coutMateriaux, INTERVALLE_JOURNEE_DEMO_MS, metreJuste, RENOVATIONS } from '@/lib/patrimoine';
import { EcranTravaux, useTravauxMaison } from './renovation-maison';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] }); vi.setSystemTime(new Date('2026-10-26T12:00:00Z')); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const avecClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;

function Banc({ chezToi, depenser, journee }: { chezToi: boolean; depenser: (montant: number) => boolean; journee: () => void }) {
  const travaux = useTravauxMaison({ demo: true, argent: 100_000, depenserDemo: depenser, onJourneeDemo: journee });
  return <EcranTravaux travaux={travaux} chezToi={chezToi} />;
}

describe('les travaux chez soi, comme au serveur', () => {
  it('a les mêmes devis et la même tolérance de métré que backend/src/carriere/patrimoine.ts', () => {
    const peinture = RENOVATIONS.find(r => r.slug === 'peinture-sejour')!;
    expect(coutMateriaux(peinture)).toBe(23_500);
    expect(metreJuste(peinture, 41)).toBe(true);
    expect(metreJuste(peinture, 43.74)).toBe(false);
  });
});

describe('les travaux chez soi (démonstration)', () => {
  it('passe du métré au devis, commande au dépôt, puis fait les journées chez soi jusqu’au confort gagné', () => {
    const depenser = vi.fn().mockReturnValue(true), journee = vi.fn();
    render(<Banc chezToi depenser={depenser} journee={journee} />, { wrapper: avecClient });
    fireEvent.click(screen.getAllByRole('button', { name: 'Lancer' })[0]);
    expect(screen.getByText('4,50 m × 3,60 m')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Surface de murs à peindre'), { target: { value: '43,74' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByText('Pas tout à fait : reprends les cotes.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Surface de murs à peindre'), { target: { value: '40,4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByText(/Total : 23\s500\sF/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Commander' }));
    expect(depenser).toHaveBeenCalledWith(23_500);
    fireEvent.click(screen.getByRole('button', { name: 'Une journée de travaux' }));
    expect(journee).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Journée 2 sur 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Une journée de travaux' })).toBeDisabled();
    // Une journée du monde plus tard (une demi-minute en démonstration), l’écran se met à jour tout seul.
    act(() => { vi.advanceTimersByTime(INTERVALLE_JOURNEE_DEMO_MS); });
    fireEvent.click(screen.getByRole('button', { name: 'Une journée de travaux' }));
    expect(screen.getByText('Travaux finis : +2 de moral à chaque réveil chez toi.')).toBeInTheDocument();
    expect(screen.getByText('✓ Fait')).toBeInTheDocument();
  });
  it('renvoie les journées de travaux à la maison quand on regarde depuis le téléphone', () => {
    render(<Banc chezToi={false} depenser={() => true} journee={vi.fn()} />, { wrapper: avecClient });
    fireEvent.click(screen.getAllByRole('button', { name: 'Lancer' })[1]);
    fireEvent.change(screen.getByLabelText('Surface de sol à carreler'), { target: { value: '4,32' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    fireEvent.click(screen.getByRole('button', { name: 'Commander' }));
    expect(screen.queryByRole('button', { name: 'Une journée de travaux' })).not.toBeInTheDocument();
    expect(screen.getByText(/se font chez toi, à la Résidence Lagune/)).toBeInTheDocument();
  });
});
