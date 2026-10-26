import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { offresAuPlusPres, Telephone, type DestinationTelephone } from './telephone';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
afterEach(cleanup);

const DESTINATIONS: DestinationTelephone[] = [
  { slug: 'entreprise', nom: 'Tour BTP Life', quartier: 'Les Palmiers', porte: [29, -16.5] },
  { slug: 'mairie', nom: 'Hôtel de ville', quartier: 'Plateau Nord', porte: [-26, -82.5] },
  { slug: 'cafe', nom: 'Café social', quartier: 'Les Palmiers', porte: [12, -28] },
];
describe('les offres du téléphone', () => {
  it('montre d’abord les offres à la portée du joueur, les plus hautes en tête, puis les plus proches de son niveau', () => {
    const offres = [2, 30, 7, 14, 4, 13, 18, 26, 6, 12, 50].map(n => ({ id: `o${n}`, niveauMin: n }));
    expect(offresAuPlusPres(offres, 13).map(o => o.niveauMin)).toEqual([13, 12, 7, 6, 4, 14, 18, 26]);
    expect(offresAuPlusPres(offres, undefined, 3).map(o => o.niveauMin)).toEqual([2, 30, 7]);
  });
});

const avecClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
function ouvrir(props: Partial<Parameters<typeof Telephone>[0]> = {}) {
  const actions = { onAller: vi.fn(), onVoyager: vi.fn().mockResolvedValue(null), onEpargneDemo: vi.fn().mockReturnValue(null), onFermer: vi.fn() };
  render(<Telephone demo heure="08:30" meteo="Ensoleillé" pluie={false} position={[10, -26]} destinations={DESTINATIONS} argent={20_000} epargne={10_000}
    appels={[{ id: 'a', de: 'Adjoua Ehui', role: 'Responsable du laboratoire', message: 'Les sondages sont prêts.', lieu: 'laboratoire', nomLieu: 'Laboratoire des matériaux' }]}
    rendezVous={[{ slug: 'mairie', nom: 'Hôtel de ville', ouverture: 7.5, fermeture: 16, titre: 'Fil rouge · Le permis', detail: 'Chapitre 4/9' }]}
    filRouge={{ chapitre: 4, total: 9, titre: 'Le permis de construire', resume: 'Déposer un dossier complet.', lieu: 'mairie', nomLieu: 'Hôtel de ville', interlocuteur: 'Akissi Gnahoré' }}
    {...actions} {...props} />, { wrapper: avecClient });
  return actions;
}

describe('le téléphone du joueur', () => {
  it('affiche l’heure du monde et ses applications, avec les pastilles du moment', () => {
    ouvrir();
    expect(screen.getAllByText('08:30').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Messages (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Appels (1)' })).toBeInTheDocument();
  });

  it('lit les messages et les appels, et mène au lieu d’un mentor', () => {
    const a = ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Messages (1)' }));
    expect(screen.getByText(/J’ai une parcelle au Plateau Nord/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retour à l’accueil du téléphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Appels (1)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Y aller · Laboratoire des matériaux' }));
    expect(a.onAller).toHaveBeenCalledWith('laboratoire');
  });

  it('commande un taxi avec son prix, et rappelle que le gbaka coûte moins cher', async () => {
    const a = ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Taxi · Gbaka' }));
    fireEvent.click(screen.getByRole('button', { name: /Hôtel de ville/ }));
    // 92,5 m par les rues, soit 2,3 km : 300 + 2,3 × 250 ≈ 900 F en taxi, le forfait de 200 F en gbaka.
    expect(screen.getByText(/^900\sF$/)).toBeInTheDocument();
    expect(screen.getByText(/^200\sF$/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Commander le taxi' }));
    await waitFor(() => expect(a.onVoyager).toHaveBeenCalledWith('taxi', 'mairie'));
  });

  it('dit pourquoi une course est refusée', async () => {
    ouvrir({ onVoyager: vi.fn().mockResolvedValue('Pas assez d’argent pour ce trajet : 1 050 F.') });
    fireEvent.click(screen.getByRole('button', { name: 'Taxi · Gbaka' }));
    fireEvent.click(screen.getByRole('button', { name: /Hôtel de ville/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Commander le taxi' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Pas assez d’argent');
  });

  it('propose d’y aller à pied quand c’est à deux pas, et bloque une course trop chère', () => {
    ouvrir({ argent: 500 });
    fireEvent.click(screen.getByRole('button', { name: 'Taxi · Gbaka' }));
    fireEvent.click(screen.getByRole('button', { name: /Café social/ }));
    expect(screen.getByText('C’est à deux pas : vas-y à pied.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '‹ Autre destination' }));
    fireEvent.click(screen.getByRole('button', { name: /Hôtel de ville/ }));
    expect(screen.getByRole('button', { name: 'Solde insuffisant' })).toBeDisabled();
  });

  it('épargne en démonstration, et ouvre le fil rouge et l’agenda', () => {
    const a = ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Banque' }));
    fireEvent.click(screen.getByRole('button', { name: 'Épargner 5 000 F' }));
    expect(a.onEpargneDemo).toHaveBeenCalledWith('deposer', 5000);
    fireEvent.click(screen.getByRole('button', { name: 'Retour à l’accueil du téléphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fil rouge (1)' }));
    expect(screen.getByText('Le permis de construire')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Y aller' }));
    expect(a.onAller).toHaveBeenCalledWith('mairie');
  });
});
