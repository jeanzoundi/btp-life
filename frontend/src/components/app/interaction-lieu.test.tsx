import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InteractionLieu } from './interaction-lieu';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function setup(demo: boolean, slug = 'residence') {
  const onDemo = vi.fn();
  const onFait = vi.fn();
  const onEnter = vi.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><InteractionLieu slug={slug} nom="Résidence Lagune" href={`/app/lieu/${slug}`} demo={demo} onDemo={onDemo} onFait={onFait} onClose={() => {}} onEnter={onEnter} /></QueryClientProvider>);
  return { onDemo, onFait, onEnter, client };
}
describe('Interactions dans la ville', () => {
  it('isole les actions de démonstration du serveur', () => {
    const { onDemo } = setup(true);
    fireEvent.click(screen.getByRole('button', { name: /Dormir et récupérer/ }));
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
    vi.mocked(api.post).mockResolvedValue({ message: 'Bien dormi', coutPaye: 0 });
    const { client, onFait } = setup(false);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    expect(screen.getByText('Gratuit')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Dormir et récupérer/ }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Bien dormi'));
    expect(api.post).toHaveBeenCalledWith('/carriere/besoins/repos');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['carriere', 'me'] });
    // Le monde en est prévenu : dormir le soir y fait passer la nuit.
    expect(onFait).toHaveBeenCalledWith(expect.objectContaining({ besoin: 'repos' }));
  });
  it('signale un échec sans afficher de réussite', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Serveur indisponible'));
    const { onFait } = setup(false);
    fireEvent.click(screen.getByRole('button', { name: /Dormir et récupérer/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Serveur indisponible'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onFait).not.toHaveBeenCalled();
  });
  it('le maquis renvoie à sa carte : plus de repas à prix unique sur la fiche de la ville', () => {
    setup(false, 'maquis');
    expect(screen.queryByRole('button', { name: /Manger un plat/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrer dans le bâtiment/ })).toBeInTheDocument();
  });
  it('présente le marché pour lui-même : on y entre pour marchander, sans le repas du maquis', () => {
    render(<QueryClientProvider client={new QueryClient()}><InteractionLieu slug="marche" nom="Marché des Jardins" href="/app/lieu/marche" demo onDemo={vi.fn()} onClose={() => {}} onEnter={vi.fn()} /></QueryClientProvider>);
    expect(screen.getByText('Fruits, grillades et marchandage')).toBeInTheDocument();
    expect(screen.getByText(/tout se discute/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Manger un plat/ })).not.toBeInTheDocument();
  });
});
