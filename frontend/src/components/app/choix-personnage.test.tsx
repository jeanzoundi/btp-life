import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChoixPersonnage } from './choix-personnage';

// La scène 3D n'a pas de WebGL sous jsdom : le plateau tournant est remplacé par un témoin.
vi.mock('@react-three/fiber', () => ({ Canvas: () => <div data-testid="plateau-3d" />, useFrame: () => undefined, useThree: () => ({}) }));
vi.mock('./humain-monde', () => ({ HumainMonde: () => null }));
vi.mock('@/lib/polices-jeu', () => ({ POLICES_JEU: '' }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function ouvrir(options: { premierChoix?: boolean; nom?: string } = {}) {
  const rappels = { onValider: vi.fn(), onAnnuler: vi.fn() };
  render(<ChoixPersonnage initial="combinaison" nomInitial={options.nom ?? 'Kouassi'} avatarConfig={{ couleurTenue: '#C1502E' }} premierChoix={options.premierChoix ?? false} demo={false}
    enCours={false} erreur={null} onValider={rappels.onValider} onAnnuler={options.premierChoix ? undefined : rappels.onAnnuler} />);
  return rappels;
}

describe('le choix du personnage', () => {
  it('montre les sept personnages, celui proposé déjà coché, et le plateau 3D', () => {
    ouvrir();
    expect(screen.getAllByRole('radio')).toHaveLength(7);
    expect(screen.getByRole('radio', { name: /Combinaison de chantier/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('plateau-3d')).toBeInTheDocument();
  });
  it('passe d’un personnage à l’autre aux flèches, et valide avec le nom', () => {
    const { onValider } = ouvrir({ nom: '  Yasmine ' });
    fireEvent.click(screen.getByRole('button', { name: 'Personnage suivant' }));
    expect(screen.getByRole('radio', { name: /Bleu de travail/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('radio', { name: /Costume/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: /Tailleur sombre/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Garder ce personnage' }));
    expect(onValider).toHaveBeenCalledWith('tailleur', 'Yasmine');
  });
  it('demande un nom d’au moins deux lettres', () => {
    ouvrir({ nom: 'K' });
    expect(screen.getByRole('button', { name: 'Garder ce personnage' })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Ex. Kouassi'), { target: { value: 'Ko' } });
    expect(screen.getByRole('button', { name: 'Garder ce personnage' })).toBeEnabled();
  });
  it('au premier pas dans le monde, on entre en validant, sans annulation possible', () => {
    ouvrir({ premierChoix: true });
    expect(screen.getByRole('button', { name: 'Entrer dans le quartier' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Annuler' })).toBeNull();
  });
  it('se referme à Échap quand on l’a ouvert soi-même', () => {
    const { onAnnuler } = ouvrir();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onAnnuler).toHaveBeenCalledOnce();
  });
});
