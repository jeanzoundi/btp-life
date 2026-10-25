import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useModeExperienceStore } from '@/lib/mode-experience-store';
import { SelecteurModeExperience } from './selecteur-mode-experience';

const push = vi.fn();
let chemin = '/app';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => chemin }));
beforeEach(() => useModeExperienceStore.setState({ mode: 'classique', lieuMonde: null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('la bascule entre les deux modes', () => {
  it('des offres d’emploi, le monde vivant ouvre l’Agence des talents', () => {
    chemin = '/app/offres';
    render(<SelecteurModeExperience />);
    fireEvent.click(screen.getByRole('button', { name: 'Mode Monde vivant' }));
    expect(push).toHaveBeenCalledWith('/app/monde?lieu=agence');
    expect(useModeExperienceStore.getState().mode).toBe('monde');
  });
  it('dans la banque du monde, le mode classique ouvre la page de la banque', () => {
    chemin = '/app/monde';
    useModeExperienceStore.setState({ mode: 'monde', lieuMonde: 'banque' });
    render(<SelecteurModeExperience />);
    fireEvent.click(screen.getByRole('button', { name: 'Mode Classique' }));
    expect(push).toHaveBeenCalledWith('/app/lieu/banque');
  });
  it('sans lieu en cours, chaque mode retrouve son accueil', () => {
    chemin = '/app/profil';
    render(<SelecteurModeExperience />);
    fireEvent.click(screen.getByRole('button', { name: 'Mode Monde vivant' }));
    expect(push).toHaveBeenLastCalledWith('/app/monde');
    chemin = '/app/monde';
    fireEvent.click(screen.getByRole('button', { name: 'Mode Classique' }));
    expect(push).toHaveBeenLastCalledWith('/app');
  });
});
