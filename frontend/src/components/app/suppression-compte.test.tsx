import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '@/lib/api';
import { SuppressionCompte } from './suppression-compte';

vi.mock('@/lib/api', async (original) => ({ ...(await original<typeof import('@/lib/api')>()), api: { post: vi.fn() } }));
afterEach(() => { cleanup(); vi.mocked(api.post).mockReset(); });

const ouvrir = () => {
  const onSupprime = vi.fn();
  render(<SuppressionCompte onSupprime={onSupprime} />);
  fireEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));
  return onSupprime;
};
const saisir = (motDePasse: string) => fireEvent.change(screen.getByLabelText(/Ton mot de passe/), { target: { value: motDePasse } });

describe('la suppression du compte', () => {
  it('dit ce qui disparaît et demande le mot de passe avant de supprimer', async () => {
    vi.mocked(api.post).mockResolvedValue({ supprime: true });
    const onSupprime = ouvrir();
    expect(screen.getByText(/C’est définitif/)).toBeInTheDocument();
    const confirmer = screen.getByRole('button', { name: 'Supprimer définitivement' });
    expect(confirmer).toBeDisabled();
    saisir('secret');
    fireEvent.click(confirmer);
    await waitFor(() => expect(onSupprime).toHaveBeenCalled());
    expect(api.post).toHaveBeenCalledWith('/users/me/suppression', { password: 'secret' });
  });

  it('montre le refus du serveur et garde le compte', async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(400, { message: 'Mot de passe incorrect' }));
    const onSupprime = ouvrir();
    saisir('mauvais');
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mot de passe incorrect');
    expect(onSupprime).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Supprimer définitivement' })).toBeEnabled();
  });

  it('demande d’attendre après trop d’essais, et se referme sur Annuler', async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(429, { message: 'ThrottlerException: Too Many Requests' }));
    ouvrir();
    saisir('encore');
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('attends une minute');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('form', { name: 'Supprimer ton compte' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Supprimer mon compte' })).toBeInTheDocument();
  });
});
