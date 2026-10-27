import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DUREE_CELEBRATION_MS, EcranCelebration, celebrationsEntre, celebrer, useCelebrations } from './celebration';

vi.mock('@/lib/sons', () => ({ jouerSon: vi.fn() }));
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('ce qui se célèbre', () => {
  it('le niveau gagné, la promotion et l’équipe formée, jamais au chargement', () => {
    expect(celebrationsEntre(null, { niveau: 12, poste: 'Chef de chantier', coequipiers: 3 })).toEqual([]);
    const liste = celebrationsEntre({ niveau: 11, poste: 'Chef d’équipe', coequipiers: 1 }, { niveau: 12, poste: 'Chef de chantier', coequipiers: 2, avec: ['Aya'] });
    expect(liste.map(c => c.titre)).toEqual(['Niveau 12 !', 'Promotion !', 'Équipe formée !']);
    expect(liste[0].partage).toContain('niveau 12');
    expect(liste[2].sousTitre).toContain('Avec Aya.');
    expect(celebrationsEntre({ niveau: 12, poste: 'Chef de chantier', coequipiers: 2 }, { niveau: 12, poste: 'Chef de chantier', coequipiers: 3 })).toEqual([]);
  });
});

describe('la file des célébrations', () => {
  it('montre les célébrations annoncées l’une après l’autre', () => {
    const { result } = renderHook(() => useCelebrations());
    act(() => { celebrer({ icone: '⭐', titre: 'Niveau 4 !' }); celebrer({ icone: '📜', titre: 'Certificat obtenu !' }); });
    expect(result.current.courante?.titre).toBe('Niveau 4 !');
    act(() => result.current.fermer());
    expect(result.current.courante?.titre).toBe('Certificat obtenu !');
    act(() => result.current.fermer());
    expect(result.current.courante).toBeNull();
  });
});

describe('l’écran de célébration', () => {
  it('se partage, et se ferme seul au bout de quelques secondes', async () => {
    vi.useFakeTimers();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const onFermer = vi.fn();
    render(<EcranCelebration celebration={{ icone: '⭐', titre: 'Niveau 12 !', sousTitre: 'Bravo', partage: 'J’ai atteint le niveau 12 sur BTP Life' }} onFermer={onFermer} />);
    expect(screen.getByRole('heading', { name: 'Niveau 12 !' })).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Partager' })); });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: 'J’ai atteint le niveau 12 sur BTP Life' }));
    act(() => { vi.advanceTimersByTime(DUREE_CELEBRATION_MS); });
    expect(onFermer).toHaveBeenCalled();
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
  it('n’offre pas de partage quand il n’y a rien à partager', () => {
    render(<EcranCelebration celebration={{ icone: '🤝', titre: 'Équipe formée !' }} onFermer={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Partager' })).not.toBeInTheDocument();
  });
});
