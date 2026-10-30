import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EntreprisePage from './page';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('@/lib/api', () => ({ api, ApiError: class ApiError extends Error {} }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const avecClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
const marche = (surcharge: Record<string, unknown>) => ({
  id: 'c1', slug: 'marche-prive-extension-riviera', nom: 'Extension de villa', description: 'Client particulier', budget: 4_500_000, devise: 'F', delaiJours: 18,
  typeMarche: 'PRIVE', niveauRequis: 30, reputationRequise: 200, verrouille: false, entrepreneurRequis: false, dejaObtenu: false, nouvelAppelLe: null,
  prixMin: 2_700_000, prixMax: 5_175_000, ...surcharge,
});

describe('les marchés de l’entreprise', () => {
  it('remplace le formulaire d’offre par la date du prochain appel d’offres quand le marché a été perdu', async () => {
    api.get.mockImplementation((chemin: string) => Promise.resolve(
      chemin === '/carriere/me' ? { niveau: 32, profilActuel: { nom: 'Gérant', famille: 'ENTREPRENEUR' }, nomEntreprise: 'BTP Excellence' }
        : chemin === '/carriere/prochaine-etape' ? { entreprise: { dejaEntrepreneur: true, eligible: true, niveauRequis: 30 } }
          : [marche({}), marche({ id: 'c2', nom: 'Immeuble de bureaux', nouvelAppelLe: '2026-10-31T09:30:00.000Z' })],
    ));
    render(<EntreprisePage />, { wrapper: avecClient });
    expect(await screen.findByText('Immeuble de bureaux')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Soumettre l’offre'.replace('’', "'") })).toHaveLength(1);
    expect(screen.getByText(/Attribué à un concurrent · nouvel appel d'offres/)).toBeInTheDocument();
  });
});
