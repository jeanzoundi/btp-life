import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useModeExperienceStore } from '@/lib/mode-experience-store';
import { MenuMondeMobile } from './menu-monde-mobile';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/app/monde' }));
beforeEach(() => useModeExperienceStore.setState({ mode: 'monde', lieuMonde: null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const RACCOURCIS = [
  { href: '/app/missions', icon: '🎯', label: 'Missions' },
  { href: '/app/profil', icon: '👤', label: 'Profil' },
];

describe('le menu du monde vivant sur téléphone', () => {
  it('tient le choix du mode et les raccourcis derrière un seul bouton', () => {
    render(<MenuMondeMobile raccourcis={RACCOURCIS} />);
    expect(screen.queryByRole('link', { name: /Missions/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(screen.getByRole('link', { name: /Missions/ })).toHaveAttribute('href', '/app/missions');
    expect(screen.getByRole('link', { name: /Profil/ })).toHaveAttribute('href', '/app/profil');
    // Les libellés des modes restent lisibles sur téléphone.
    expect(screen.getByText('Classique')).not.toHaveClass('hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Mode Classique' }));
    expect(push).toHaveBeenCalledWith('/app');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le menu' }));
    expect(screen.queryByRole('link', { name: /Missions/ })).not.toBeInTheDocument();
  });
});
