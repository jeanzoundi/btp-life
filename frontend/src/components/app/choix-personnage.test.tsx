import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
  it('transmet la taille, la morphologie et la couleur du casque sélectionnées', () => {
    const { onValider } = ouvrir();
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Taille' })).getByRole('radio', { name: 'Grande' }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Morphologie' })).getByRole('radio', { name: 'Large' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Casque jaune' }));
    fireEvent.click(screen.getByRole('button', { name: 'Garder ce personnage' }));
    expect(onValider).toHaveBeenCalledWith('combinaison', 'Kouassi', { stature: 'grande', silhouette: 'large', casque: '#F2C230' });
  });
  it('montre les sept personnages et le sur-mesure, celui proposé déjà coché, et le plateau 3D', () => {
    ouvrir();
    expect(within(screen.getByRole('radiogroup', { name: 'Personnages' })).getAllByRole('radio')).toHaveLength(8);
    expect(screen.getByRole('radio', { name: /Combinaison de chantier/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('plateau-3d')).toBeInTheDocument();
  });
  it('passe d’un personnage à l’autre aux flèches, et valide avec le nom', () => {
    const { onValider } = ouvrir({ nom: '  Yasmine ' });
    fireEvent.click(screen.getByRole('button', { name: 'Personnage suivant' }));
    expect(screen.getByRole('radio', { name: /Bleu de travail/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('radio', { name: /Sur mesure/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('radio', { name: /Costume/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: /Tailleur sombre/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Garder ce personnage' }));
    expect(onValider).toHaveBeenCalledWith('tailleur', 'Yasmine', { stature: 'moyenne', silhouette: 'standard', casque: '#F5F0E6' });
  });
  it('valide un personnage sur mesure avec son apparence', () => {
    const { onValider } = ouvrir();
    fireEvent.click(screen.getByRole('radio', { name: /Sur mesure/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Tresses' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Moustache' }));
    fireEvent.click(screen.getByRole('button', { name: 'Garder ce personnage' }));
    expect(onValider).toHaveBeenCalledWith('sur-mesure', 'Kouassi', expect.objectContaining({ apparence: expect.objectContaining({ coiffure: 'tresses', pilosite: 'moustache' }) }));
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
