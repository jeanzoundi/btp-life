import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingPage from './page';

const mocks = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), post: vi.fn(), push: vi.fn(), mode: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: mocks }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/components/app/auth-guard', () => ({ AuthGuard: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/components/app/mentor', () => ({ MentorBulle: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/lib/mode-experience-store', () => ({ useModeExperienceStore: (fn: (s: unknown) => unknown) => fn({ setMode: mocks.mode }) }));

const profil = { id: 'p1', slug: 'etudiant-be', nom: 'Étudiant Bureau d’études', famille: 'BE', description: null };
const metier = { id: 'm1', slug: 'ingenieur-structure', nom: 'Ingénieur structure', famille: 'BE', description: null };
const parcours = { etapes: [{ nom: 'Études', ordre: 1, complete: true }] };
function ouvrir(existant = false) {
  const carriere = existant ? { avatar: { nomPersonnage: 'Awa', config: { personnage: 'tailleur', stature: 'grande', silhouette: 'fine' } }, traits: ['curieux'], profilActuel: profil, metierCible: metier, parcours } : {};
  mocks.get.mockImplementation(async (path: string) => path === '/carriere/me' ? carriere : { items: path.includes('metiers-cibles') ? [metier] : [profil] });
  mocks.patch.mockResolvedValue({});
  mocks.post.mockResolvedValue(parcours);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><OnboardingPage /></QueryClientProvider>);
}
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('accueil unifié', () => {
  it('présente les modes puis les cinq profils et conserve les réglages du joueur existant', async () => {
    ouvrir(true);
    fireEvent.click(await screen.findByRole('button', { name: /Retrouver mon personnage/ }));
    expect(screen.getByLabelText('Nom du personnage')).toHaveValue('Awa');
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }));
    await screen.findByRole('heading', { name: 'Ta personnalité' });
    expect(mocks.patch).toHaveBeenCalledWith('/carriere/avatar/personnage', { personnage: 'tailleur', nomPersonnage: 'Awa', stature: 'grande', silhouette: 'fine' });
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    await screen.findByText(/Tu poursuis comme/);
    expect(screen.queryByRole('radiogroup', { name: 'Cinq profils de départ' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    await screen.findByRole('heading', { name: 'Ton métier cible' });
    fireEvent.click(screen.getByRole('button', { name: 'Générer mon parcours' }));
    await screen.findByRole('heading', { name: 'Ton parcours est prêt !' });
    expect(mocks.patch.mock.calls.some(([p]) => p === '/carriere/profil-actuel' || p === '/carriere/metier-cible')).toBe(false);
    expect(mocks.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le mode classique/ }));
    expect(mocks.mode).toHaveBeenCalledWith('classique');
    expect(mocks.push).toHaveBeenCalledWith('/app');
  });
  it('un nouveau joueur choisit une voie et un objectif de formation sans recevoir de faux gains', async () => {
    ouvrir();
    fireEvent.click(await screen.findByRole('radio', { name: /Mode vivant/ }));
    fireEvent.click(screen.getByRole('button', { name: /Créer mon personnage/ }));
    fireEvent.change(screen.getByLabelText('Nom du personnage'), { target: { value: 'Koffi' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }));
    await screen.findByRole('heading', { name: 'Ta personnalité' });
    fireEvent.click(screen.getByRole('button', { name: /Curieux/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    await screen.findByRole('radiogroup', { name: 'Cinq profils de départ' });
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText(/Ton objectif de formation/), { target: { value: 'ingenieur' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    await screen.findByRole('heading', { name: 'Ton métier cible' });
    expect(mocks.patch).toHaveBeenCalledWith('/carriere/avatar', { nomPersonnage: 'Koffi', config: { voieDepart: 'etudiant', formationDepart: 'ingenieur' } });
    fireEvent.click(screen.getByRole('button', { name: /Ingénieur structure/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Générer mon parcours' }));
    await screen.findByText(/Aucun logement ni argent supplémentaire/);
    fireEvent.click(screen.getByRole('button', { name: /Entrer dans le monde vivant/ }));
    expect(mocks.push).toHaveBeenCalledWith('/app/monde?lieu=universite');
  });
  it('reste sur l’étape et affiche une erreur quand la sauvegarde échoue', async () => {
    ouvrir(true);
    fireEvent.click(await screen.findByRole('button', { name: /Retrouver mon personnage/ }));
    mocks.patch.mockRejectedValueOnce(new Error('Connexion interrompue'));
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connexion interrompue'));
    expect(screen.getByLabelText('Nom du personnage')).toHaveValue('Awa');
    expect(screen.getByRole('button', { name: /Continuer/ })).toBeEnabled();
  });
});
