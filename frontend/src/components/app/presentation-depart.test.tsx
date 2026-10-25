import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PresentationModes, SelectionProfilDepart } from './presentation-depart';
import { porteDuProfil, profilsPourPorte } from '@/lib/profils-depart';

afterEach(cleanup);
const profils = ['etudiant-be', 'ouvrier-qualifie', 'dessinateur-bim', 'chef-equipe', 'ingenieur-structure', 'aide-metreur', 'assistant-hse', 'topographe-confirme'].map(slug => ({ id: slug, slug, nom: slug, famille: 'BE', description: null }));
describe('accueil et portes de départ', () => {
  it('présente les deux modes sans créer deux progressions', () => {
    const changer = vi.fn();
    render(<PresentationModes mode="classique" onMode={changer} />);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    fireEvent.click(screen.getByRole('radio', { name: /Mode vivant/ }));
    expect(changer).toHaveBeenCalledWith('monde');
    expect(screen.getByText(/la même progression et le même argent/)).toBeInTheDocument();
  });
  it('offre cinq portes et les situations correspondantes', () => {
    render(<SelectionProfilDepart profils={profils} porte="etudiant" profilId="" onPorte={vi.fn()} onProfil={vi.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(within(screen.getByRole('combobox')).getAllByRole('option')).toHaveLength(2);
    expect(porteDuProfil('ingenieur-geotechnique')).toBe('ingenieur');
    expect(porteDuProfil('stagiaire-chantier')).toBe('etudiant');
  });
  it('ne supprime aucune spécialité dans la vue complète', () => {
    expect(profilsPourPorte(profils, null)).toEqual(profils);
    const changer = vi.fn();
    render(<SelectionProfilDepart profils={profils} porte={null} profilId="" onPorte={changer} onProfil={vi.fn()} />);
    expect(within(screen.getByRole('combobox')).getAllByRole('option')).toHaveLength(profils.length + 1);
    fireEvent.click(screen.getByRole('radio', { name: /Ouvrier du bâtiment/ }));
    expect(changer).toHaveBeenCalledWith('ouvrier');
  });
});
