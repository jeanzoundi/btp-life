import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DOSSIERS } from '@/lib/campagne';
import { CLOTURE_CAMPAGNE, PanneauFinCampagne, TEASER_CAMPAGNE, cleFinDossier, finCampagneAMontrer, finDuDossier } from './fin-campagne';

afterEach(cleanup);

describe('la fin d’un dossier du fil rouge', () => {
  it('ne s’affiche qu’une fois le dossier clos, la progression chargée, le joueur libre, et jamais deux fois', () => {
    const base = { chapitres: 9, total: 9, pret: true, dejaVue: false, occupe: false };
    expect(finCampagneAMontrer(base)).toBe(true);
    expect(finCampagneAMontrer({ ...base, chapitres: 8 })).toBe(false);
    expect(finCampagneAMontrer({ ...base, pret: false })).toBe(false);
    expect(finCampagneAMontrer({ ...base, occupe: true })).toBe(false);
    expect(finCampagneAMontrer({ ...base, dejaVue: true })).toBe(false);
  });
  it('garde la clé d’Akwaba d’avant les dossiers suivants : un joueur qui l’a vue ne la revoit pas', () => {
    expect(cleFinDossier(DOSSIERS[0], 'u1')).toBe('btp-life-fin-campagne:u1');
    expect(cleFinDossier(DOSSIERS[1], 'u1')).toBe('btp-life-fin-campagne:u1:residence-roniers');
  });
  it('salue le joueur au bout d’Akwaba, propose la suite et annonce le R+5 de Daouda Touré', () => {
    const onSuite = vi.fn(), onFermer = vi.fn();
    render(<PanneauFinCampagne dossier={DOSSIERS[0]} nomJoueur="Koffi" onSuite={onSuite} onFermer={onFermer} />);
    expect(screen.getByRole('heading', { name: 'La Résidence Akwaba est bouclée !' })).toBeInTheDocument();
    expect(screen.getByText('Dossier clos · 12 chapitres')).toBeInTheDocument();
    expect(screen.getByText(/Bravo Koffi/)).toBeInTheDocument();
    expect(screen.getByText(/le R\+5 de Daouda Touré/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voir mon parcours' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choisir un chantier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le chat' }));
    expect(onSuite.mock.calls.map(c => c[0])).toEqual(['carriere', 'chantiers', 'equipe']);
    fireEvent.click(screen.getByRole('button', { name: 'Continuer à jouer' }));
    expect(onFermer).toHaveBeenCalled();
  });
  it('au bout des Rôniers, salue le R+5 et annonce le groupement avec Bâti-Express', () => {
    render(<PanneauFinCampagne dossier={DOSSIERS[1]} nomJoueur="Koffi" onSuite={vi.fn()} onFermer={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'La Résidence Les Rôniers est livrée !' })).toBeInTheDocument();
    expect(screen.getByText(TEASER_CAMPAGNE)).toBeInTheDocument();
    expect(TEASER_CAMPAGNE).toBe(finDuDossier(DOSSIERS[1]).teaser);
    expect(CLOTURE_CAMPAGNE).toMatch(/Résidence Les Rôniers/);
  });
});
