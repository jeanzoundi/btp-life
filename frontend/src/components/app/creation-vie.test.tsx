import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreationVie } from './creation-vie';

const mocks = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), post: vi.fn(), push: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: mocks }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
// La scène 3D (chargée à la demande) n'a pas de WebGL sous jsdom.
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('./mentor', () => ({ MentorBulle: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/lib/polices-jeu', () => ({ POLICES_JEU: '' }));
vi.mock('@/lib/mode-experience-store', () => ({ useModeExperienceStore: (fn: (s: unknown) => unknown) => fn({ setMode: vi.fn() }) }));

function ouvrir() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><CreationVie demo /></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
afterEach(cleanup);

async function jusquAuDepart() {
  fireEvent.click(screen.getByRole('radio', { name: /Mode vivant/ }));
  fireEvent.click(screen.getByRole('button', { name: /Créer mon personnage/ }));
  fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Personnages' })).getByRole('radio', { name: /Bleu de travail/ }));
  fireEvent.click(screen.getByRole('radio', { name: 'Casque jaune' }));
  fireEvent.click(screen.getByRole('button', { name: /Continuer/ }));
  await screen.findByRole('heading', { name: 'Ta personnalité' });
  fireEvent.click(screen.getByRole('button', { name: /Leader né/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
  await screen.findByRole('radiogroup', { name: 'Cinq profils de départ' });
}

describe('l’écran de création, en aperçu', () => {
  it('va du mode au métier sans appeler le serveur, et garde le personnage pour le monde de démonstration', async () => {
    ouvrir();
    await jusquAuDepart();
    expect(JSON.parse(localStorage.getItem('btp-life-personnage-demo')!)).toMatchObject({ personnage: 'bleu-travail', nom: 'Kouassi', casque: '#F2C230' });
    fireEvent.click(screen.getByRole('radio', { name: /Encadrant de chantier/ }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'chef-equipe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    await screen.findByRole('heading', { name: 'Ton métier cible' });
    fireEvent.click(screen.getByRole('button', { name: /Conducteur de travaux/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Générer mon parcours' }));
    await screen.findByRole('heading', { name: 'Ton parcours est prêt !' });
    fireEvent.click(screen.getByRole('button', { name: /Entrer dans le monde vivant/ }));
    expect(mocks.push).toHaveBeenCalledWith('/simulation-preview?lieu=chantier');
    expect([mocks.get, mocks.patch, mocks.post].every(f => f.mock.calls.length === 0)).toBe(true);
  });
  it('garde le personnage et ses choix à l’écran, et rouvre une étape passée depuis la frise', async () => {
    ouvrir();
    await jusquAuDepart();
    const carte = within(screen.getByRole('complementary', { name: 'Ton personnage' }));
    expect(carte.getByText('Kouassi')).toBeInTheDocument();
    expect(carte.getByText(/Bleu de travail/)).toBeInTheDocument();
    expect(carte.getByText(/Leader né/)).toBeInTheDocument();
    const frise = within(screen.getByRole('list', { name: 'Étapes de la création' }));
    expect(frise.getByRole('button', { name: /Métier/ })).toBeDisabled();
    fireEvent.click(frise.getByRole('button', { name: /Personnage/ }));
    expect(screen.getByRole('heading', { name: 'Ton personnage, dans les deux modes' })).toBeInTheDocument();
    expect(within(screen.getByRole('radiogroup', { name: 'Personnages' })).getByRole('radio', { name: /Bleu de travail/ })).toHaveAttribute('aria-checked', 'true');
  });
  it('en mode classique, l’aperçu invite à créer un compte', async () => {
    ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Créer mon personnage/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }));
    await screen.findByRole('heading', { name: 'Ta personnalité' });
    fireEvent.click(screen.getByRole('button', { name: /Curieux/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    await screen.findByRole('radiogroup', { name: 'Cinq profils de départ' });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'etudiant-be' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    await screen.findByRole('heading', { name: 'Ton métier cible' });
    fireEvent.click(screen.getByRole('button', { name: /Ingénieur structure/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Générer mon parcours' }));
    fireEvent.click(await screen.findByRole('button', { name: /Créer mon compte pour jouer/ }));
    expect(mocks.push).toHaveBeenCalledWith('/inscription');
  });
});
