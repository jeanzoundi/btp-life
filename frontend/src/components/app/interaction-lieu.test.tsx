import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InteractionLieu } from './interaction-lieu';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function setup(demo: boolean) {
  const onDemo = vi.fn();
  const onEnter = vi.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><InteractionLieu slug="maquis" nom="Le Maquis" href="/app/lieu/maquis" demo={demo} onDemo={onDemo} onClose={() => {}} onEnter={onEnter} /></QueryClientProvider>);
  return { onDemo, onEnter, client };
}
describe('Interactions dans la ville', () => {
  it('isole les actions de démonstration du serveur', () => {
    const { onDemo } = setup(true);
    fireEvent.click(screen.getByRole('button', { name: /Manger un plat/ }));
    expect(onDemo).toHaveBeenCalledOnce();
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/connexion');
  });
  it('entre réellement dans le bâtiment au lieu d’afficher un aperçu', () => {
    const { onEnter } = setup(true);
    fireEvent.click(screen.getByRole('button', { name: /Entrer dans le bâtiment/ }));
    expect(onEnter).toHaveBeenCalledOnce();
    expect(screen.queryByText(/aperçu intérieur/i)).not.toBeInTheDocument();
  });
  it('affiche le coût et actualise la carrière après une action réelle', async () => {
    vi.mocked(api.post).mockResolvedValue({ message: 'Repas terminé', coutPaye: 1200 });
    const { client } = setup(false);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    expect(screen.getByText(/1\s200 FCFA virtuels/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Manger un plat/ }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Repas terminé'));
    expect(api.post).toHaveBeenCalledWith('/carriere/besoins/repas');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['carriere', 'me'] });
  });
  it('signale un échec sans afficher de réussite', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Solde insuffisant'));
    setup(false);
    fireEvent.click(screen.getByRole('button', { name: /Manger un plat/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Solde insuffisant'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
