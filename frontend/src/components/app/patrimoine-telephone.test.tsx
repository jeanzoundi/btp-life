import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { previsionJournee } from '@/lib/patrimoine';
import { EcranPatrimoine } from './patrimoine-telephone';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
afterEach(cleanup);
const avecClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;

describe('la journée d’une entreprise, comme au serveur', () => {
  it('donne les mêmes chiffres que backend/src/monde/entreprise.service.ts', () => {
    expect(previsionJournee(50, ['macon', 'macon', 'macon'])).toEqual({ chiffre: 19_500, charges: 11_500, resultat: 8_000 });
    expect(previsionJournee(50, [])).toEqual({ chiffre: 0, charges: 2_500, resultat: -2_500 });
  });
});

describe('le patrimoine dans le téléphone (démonstration)', () => {
  it('achète un outil, emménage dans un logement plus grand et refuse ce qui est trop cher', () => {
    const depenser = vi.fn().mockReturnValue(true);
    render(<EcranPatrimoine demo argent={150_000} depenserDemo={depenser} />, { wrapper: avecClient });
    fireEvent.click(screen.getByRole('button', { name: /Emménager · 50\s000\sF/ }));
    expect(depenser).toHaveBeenCalledWith(50_000);
    expect(screen.getByText('✓ Ton logement')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '🧰 Outils' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Acheter' })[0]);
    expect(depenser).toHaveBeenLastCalledWith(18_000);
    expect(screen.getByText('✓ Acheté')).toBeInTheDocument();
  });
  it('crée une entreprise, embauche et montre la journée prévue', () => {
    const depenser = vi.fn().mockReturnValue(true);
    render(<EcranPatrimoine demo argent={300_000} depenserDemo={depenser} />, { wrapper: avecClient });
    fireEvent.click(screen.getByRole('button', { name: '🏢 Entreprise' }));
    fireEvent.change(screen.getByLabelText('Nom de l’entreprise'), { target: { value: 'Bâti-Lagune' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer avec 100\s000\sF/ }));
    expect(depenser).toHaveBeenCalledWith(100_000);
    expect(screen.getByText('Bâti-Lagune')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Embaucher' })[0]);
    expect(screen.getByText(/Équipe \(1\/12\)/)).toBeInTheDocument();
    // Un maçon : 6 500 F de chiffre, 90 000/30 + 2 500 = 5 500 F de charges, soit +1 000 F par jour.
    expect(screen.getByText(/^\+1\s000\sF$/)).toBeInTheDocument();
  });
});
