import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { MARCHE } from '@/lib/lieux-vie/marche';
import { butMarque, coinAdverse, issueTirs } from '@/lib/lieux-vie/sport';
import { PanneauCabine, PanneauEtal, PanneauTirsAuBut, PanneauVitrine } from './panneaux-loisirs';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const avecClient = (ui: ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{ui}</QueryClientProvider>);
const BESOINS = { energie: 60, faim: 30, social: 50, moral: 50 };
const choukouya = MARCHE.carte.find(a => a.id === 'choukouya')!;

function etal(options: { salue?: boolean; fachee?: boolean } = {}) {
  const rappels = { onSaluer: vi.fn(), onFacher: vi.fn(), onAcheter: vi.fn() };
  render(<PanneauEtal vendeuse="Ibrahim, le braiseur" articles={[choukouya]} besoins={BESOINS} argent={5000} heure={10} demo={false} salue={options.salue ?? false} fachee={options.fachee ?? false}
    enCours={false} erreur={null} {...rappels} onFermer={vi.fn()} />);
  return rappels;
}

describe('le marchandage à l’étal', () => {
  it('sans salut, la vendeuse contre-propose à peine moins cher', () => {
    const { onAcheter } = etal();
    fireEvent.click(screen.getByRole('button', { name: /Proposer 1\s350\sF/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/Je te le fais à 1\s425\sF/);
    fireEvent.click(screen.getByRole('button', { name: /Marché conclu/ }));
    expect(onAcheter).toHaveBeenCalledWith(choukouya, .05);
  });
  it('après le salut, elle accepte l’offre raisonnable', () => {
    const { onAcheter } = etal({ salue: true });
    fireEvent.click(screen.getByRole('button', { name: /Proposer 1\s350\sF/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/D’accord, 1\s350\sF/);
    fireEvent.click(screen.getByRole('button', { name: /Marché conclu · 1\s350\sF/ }));
    expect(onAcheter).toHaveBeenCalledWith(choukouya, .1);
  });
  it('trop demander la fâche : elle ne vend plus qu’au prix affiché', () => {
    const { onFacher, onSaluer } = etal();
    fireEvent.click(screen.getByRole('button', { name: /Saluer/ }));
    expect(onSaluer).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /−35 %/ }));
    expect(onFacher).toHaveBeenCalledOnce();
    cleanup();
    etal({ fachee: true });
    expect(screen.queryByRole('button', { name: /Proposer/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Payer 1\s500\sF/ })).toBeEnabled();
  });
});

describe('les tirs au but', () => {
  it('alterne tir et arrêt jusqu’au vainqueur, puis règle le match', () => {
    const graine = 41, onFin = vi.fn();
    render(<PanneauTirsAuBut graine={graine} onFin={onFin} />);
    // On tire toujours à gauche et on plonge toujours à gauche : le vainqueur se calcule d'avance.
    const nous: boolean[] = [], eux: boolean[] = [];
    while (!issueTirs(nous, eux)) {
      if (nous.length === eux.length) { nous.push(butMarque('gauche', coinAdverse(graine, nous.length * 2))); fireEvent.click(screen.getByRole('button', { name: 'Tirer à gauche' })); }
      else { eux.push(butMarque(coinAdverse(graine, eux.length * 2 + 1), 'gauche')); fireEvent.click(screen.getByRole('button', { name: 'Plonger à gauche' })); }
    }
    fireEvent.click(screen.getByRole('button', { name: /Fêter la victoire|Serrer la main/ }));
    expect(onFin).toHaveBeenCalledWith(issueTirs(nous, eux) === 'nous');
  });
});

describe('la cabine et la vitrine', () => {
  it('porte ce qu’on possède ; le reste se débloque en progressant', async () => {
    vi.mocked(api.get).mockResolvedValue([
      { id: 'a', nom: 'Casque blanc', description: null, categorie: 'CASQUE', rarete: 'COMMUN', metierRequis: null, niveauRequis: 1, possede: true, equipe: true, eligible: true },
      { id: 'b', nom: 'Gilet orange', description: null, categorie: 'TENUE', rarete: 'COMMUN', metierRequis: null, niveauRequis: 1, possede: true, equipe: false, eligible: true },
      { id: 'c', nom: 'Casque doré', description: null, categorie: 'CASQUE', rarete: 'LEGENDAIRE', metierRequis: null, niveauRequis: 12, possede: false, equipe: false, eligible: false },
    ]);
    vi.mocked(api.post).mockResolvedValue({});
    avecClient(<PanneauCabine demo={false} onFermer={vi.fn()} />);
    expect(await screen.findByText('Porté')).toBeInTheDocument();
    expect(screen.getByText('Niveau 12')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Porter' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/carriere/avatar/equiper', { itemId: 'b' }));
  });
  it('en démonstration, la cabine n’appelle pas le serveur', () => {
    avecClient(<PanneauCabine demo onFermer={vi.fn()} />);
    expect(api.get).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/connexion');
  });
  it('expose les vrais badges et certificats du joueur', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => url.endsWith('badges')
      ? [{ id: 'u1', obtenuLe: '2026-10-01T10:00:00Z', badge: { nom: 'Première mission', description: null, rarete: 'BRONZE' } }]
      : [{ id: 'u2', numeroUnique: 'BTP-0042', delivreLe: '2026-10-12T10:00:00Z', certificat: { nom: 'Sécurité niveau 1' } }]);
    avecClient(<PanneauVitrine demo={false} niveau={7} onFermer={vi.fn()} />);
    expect(await screen.findByText(/Première mission/)).toBeInTheDocument();
    expect(await screen.findByText(/Sécurité niveau 1/)).toBeInTheDocument();
    expect(screen.getByText(/n° BTP-0042/)).toBeInTheDocument();
  });
});
