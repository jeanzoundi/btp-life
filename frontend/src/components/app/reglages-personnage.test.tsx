import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReglagesPersonnage, type ReglagesJoueur } from './reglages-personnage';

afterEach(cleanup);
const DEPART: ReglagesJoueur = { personnage: 'combinaison', nom: 'Awa', stature: 'moyenne', silhouette: 'standard', casque: '#F5F0E6' };
function ouvrir(valeur: Partial<ReglagesJoueur> = {}) {
  const onChange = vi.fn();
  render(<ReglagesPersonnage valeur={{ ...DEPART, ...valeur }} onChange={onChange} />);
  return onChange;
}

describe('les réglages du personnage', () => {
  it('propose les sept modèles réalistes et change de modèle sans perdre les autres réglages', () => {
    const onChange = ouvrir({ stature: 'grande' });
    const modeles = within(screen.getByRole('radiogroup', { name: 'Personnages' }));
    expect(modeles.getAllByRole('radio')).toHaveLength(7);
    fireEvent.click(modeles.getByRole('radio', { name: /Tailleur sombre/ }));
    expect(onChange).toHaveBeenCalledWith({ ...DEPART, stature: 'grande', personnage: 'tailleur' });
  });
  it('règle la taille, la morphologie, le casque et le nom', () => {
    const onChange = ouvrir();
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Taille' })).getByRole('radio', { name: 'Petite' }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Morphologie' })).getByRole('radio', { name: 'Fine' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Casque orange' }));
    fireEvent.change(screen.getByLabelText('Nom du personnage'), { target: { value: 'Koffi' } });
    expect(onChange.mock.calls.map(([v]) => v)).toEqual([
      { ...DEPART, stature: 'petite' }, { ...DEPART, silhouette: 'fine' }, { ...DEPART, casque: '#E8742B' }, { ...DEPART, nom: 'Koffi' },
    ]);
  });
  it('dit où se voit le casque : sur le modèle 3D, ou seulement sur le portrait pour un modèle tête nue', () => {
    ouvrir();
    expect(screen.getByText(/Visible sur ton modèle 3D/)).toBeInTheDocument();
    cleanup();
    ouvrir({ personnage: 'costume' });
    expect(screen.getByText(/Ce modèle arrive tête nue/)).toBeInTheDocument();
  });
  it('garde un casque gagné au dressing, hors palette, comme casque actuel', () => {
    ouvrir({ casque: '#FFD700' });
    expect(screen.getByRole('radio', { name: 'Ton casque actuel' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/Ton casque gagné au dressing/)).toBeInTheDocument();
  });
});
