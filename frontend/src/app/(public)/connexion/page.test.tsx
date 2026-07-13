import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnexionPage from './page';

const { push, setSession, post } = vi.hoisted(() => ({
  push: vi.fn(),
  setSession: vi.fn(),
  post: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/auth-store', () => ({
  useAuthStore: (selector: (s: { setSession: typeof setSession }) => unknown) => selector({ setSession }),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, api: { ...actual.api, post } };
});

describe('ConnexionPage', () => {
  beforeEach(() => {
    push.mockClear();
    setSession.mockClear();
    post.mockClear();
  });

  it('connecte le joueur et redirige vers /app en cas de succès', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ accessToken: 'a', refreshToken: 'b', user: { id: 'u1' } });
    render(<ConnexionPage />);

    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => expect(setSession).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'joueur@btplife.com', password: 'motdepasse123' });
    expect(push).toHaveBeenCalledWith('/app');
  });

  it("affiche le message d'erreur de l'API en cas d'identifiants invalides, sans jamais rediriger ni ouvrir de session", async () => {
    const { ApiError } = await import('@/lib/api');
    const user = userEvent.setup();
    post.mockRejectedValue(new ApiError(401, { message: 'Identifiants invalides' }));
    render(<ConnexionPage />);

    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'mauvais');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByText('Identifiants invalides')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
  });

  it('désactive le bouton pendant la requête pour éviter une double soumission', async () => {
    const user = userEvent.setup();
    let resoudre: (v: unknown) => void = () => {};
    post.mockReturnValue(new Promise((resolve) => { resoudre = resolve; }));
    render(<ConnexionPage />);

    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(screen.getByRole('button', { name: /connexion…/i })).toBeDisabled();
    resoudre({ accessToken: 'a', refreshToken: 'b', user: { id: 'u1' } });
    await waitFor(() => expect(push).toHaveBeenCalled());
  });
});
