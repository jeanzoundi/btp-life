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
  it('annonce la prime et le logement du poste choisi avant de valider, comme au serveur', () => {
    const { rerender } = render(<SelectionProfilDepart profils={profils} porte="etudiant" profilId="" onPorte={vi.fn()} onProfil={vi.fn()} />);
    expect(screen.queryByText(/À ton arrivée/)).toBeNull();
    rerender(<SelectionProfilDepart profils={profils} porte="etudiant" profilId="etudiant-be" onPorte={vi.fn()} onProfil={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(/prime d’installation de 15\s000\sF, et ton logement : chambre en cité universitaire \(5\s000\sF la semaine\)/);
    const ingenieur = [{ id: 'i', slug: 'ingenieur-structure', nom: 'Ingénieur structure', famille: 'BE', description: null, niveauDepart: 7 }];
    rerender(<SelectionProfilDepart profils={ingenieur} porte="ingenieur" profilId="i" onPorte={vi.fn()} onProfil={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(/prime d’installation de 60\s000\sF, et ton logement : studio à la résidence lagune \(12\s000\sF la semaine\)/);
  });
});
