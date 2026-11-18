import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnexionPage from './page';
import InscriptionPage from '../inscription/page';

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

describe('Entrer par code reçu par mail (connexion et inscription)', () => {
  beforeEach(() => {
    push.mockClear();
    setSession.mockClear();
    post.mockReset();
  });

  it("l'inscription ne demande plus que l'adresse mail", () => {
    render(<InscriptionPage />);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.queryByLabelText('Mot de passe')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recevoir mon code/i })).toBeInTheDocument();
  });

  it('un nouveau joueur reçoit un code, le tape, et part créer son personnage', async () => {
    const user = userEvent.setup();
    post.mockResolvedValueOnce({ envoye: true })
      .mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'b', user: { id: 'u1' }, nouveau: true });
    render(<InscriptionPage />);

    await user.type(screen.getByLabelText('Email'), ' nouveau@mail.ci ');
    await user.click(screen.getByRole('button', { name: /recevoir mon code/i }));
    expect(post).toHaveBeenCalledWith('/auth/code', { email: 'nouveau@mail.ci' });
    expect(await screen.findByText('nouveau@mail.ci')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /renvoyer le code \(60 s\)/i })).toBeDisabled();

    // Six chiffres suffisent : la vérification part seule, sans bouton à chercher sur un téléphone.
    await user.type(screen.getByLabelText('Code reçu'), '04 21 37');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/onboarding'));
    expect(post).toHaveBeenLastCalledWith('/auth/code/verifier', { email: 'nouveau@mail.ci', code: '042137' });
    expect(setSession).toHaveBeenCalledTimes(1);
  });

  it('un joueur déjà inscrit retourne dans le jeu', async () => {
    const user = userEvent.setup();
    post.mockResolvedValueOnce({ envoye: true })
      .mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'b', user: { id: 'u1' }, nouveau: false });
    render(<ConnexionPage />);
    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.click(screen.getByRole('button', { name: /recevoir mon code/i }));
    await user.type(await screen.findByLabelText('Code reçu'), '123456');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/app'));
  });

  it('un mauvais code affiche le message du serveur, vide le champ et n’ouvre aucune session', async () => {
    const { ApiError } = await import('@/lib/api');
    const user = userEvent.setup();
    post.mockResolvedValueOnce({ envoye: true })
      .mockRejectedValueOnce(new ApiError(400, { message: 'Code incorrect. Encore 4 essais.' }));
    render(<ConnexionPage />);
    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.click(screen.getByRole('button', { name: /recevoir mon code/i }));
    await user.type(await screen.findByLabelText('Code reçu'), '999999');

    expect(await screen.findByText('Code incorrect. Encore 4 essais.')).toBeInTheDocument();
    expect(screen.getByLabelText('Code reçu')).toHaveValue('');
    expect(setSession).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('montre le code à l’écran en mode local, et permet de changer d’adresse', async () => {
    const user = userEvent.setup();
    post.mockResolvedValueOnce({ envoye: true, codeDeveloppement: '314159' });
    render(<ConnexionPage />);
    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.click(screen.getByRole('button', { name: /recevoir mon code/i }));
    expect(await screen.findByText('314159')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /changer d'adresse/i }));
    expect(screen.getByLabelText('Email')).toHaveValue('joueur@btplife.com');
  });

  it("dit pourquoi le code n'est pas parti, sans changer d'écran", async () => {
    const { ApiError } = await import('@/lib/api');
    const user = userEvent.setup();
    post.mockRejectedValueOnce(new ApiError(429, { message: "Un code vient de partir : attends 42 s avant d'en redemander un." }));
    render(<ConnexionPage />);
    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.click(screen.getByRole('button', { name: /recevoir mon code/i }));
    expect(await screen.findByText(/attends 42 s/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Code reçu')).not.toBeInTheDocument();
  });
});

describe('Entrer avec un mot de passe (comptes plus anciens, administration)', () => {
  beforeEach(() => {
    push.mockClear();
    setSession.mockClear();
    post.mockReset();
  });

  async function ouvrir() {
    const user = userEvent.setup();
    render(<ConnexionPage />);
    await user.click(screen.getByRole('button', { name: /j'ai un mot de passe/i }));
    return user;
  }

  it('connecte le joueur et redirige vers /app en cas de succès', async () => {
    post.mockResolvedValue({ accessToken: 'a', refreshToken: 'b', user: { id: 'u1' } });
    const user = await ouvrir();
    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => expect(setSession).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'joueur@btplife.com', password: 'motdepasse123' });
    expect(push).toHaveBeenCalledWith('/app');
  });

  it("affiche le message d'erreur de l'API en cas d'identifiants invalides, sans jamais rediriger ni ouvrir de session", async () => {
    const { ApiError } = await import('@/lib/api');
    post.mockRejectedValue(new ApiError(401, { message: 'Identifiants invalides' }));
    const user = await ouvrir();
    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'mauvais');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByText('Identifiants invalides')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
  });

  it('désactive le bouton pendant la requête pour éviter une double soumission', async () => {
    let resoudre: (v: unknown) => void = () => {};
    post.mockReturnValue(new Promise((resolve) => { resoudre = resolve; }));
    const user = await ouvrir();
    await user.type(screen.getByLabelText('Email'), 'joueur@btplife.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(screen.getByRole('button', { name: /connexion…/i })).toBeDisabled();
    resoudre({ accessToken: 'a', refreshToken: 'b', user: { id: 'u1' } });
    await waitFor(() => expect(push).toHaveBeenCalled());
  });
});
