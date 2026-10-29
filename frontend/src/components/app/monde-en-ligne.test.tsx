import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { api } from '@/lib/api';
import { voisinsDemo } from '@/lib/en-ligne';
import { ChatQuartier, useMondeEnLigne } from './monde-en-ligne';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('./humain-monde', () => ({ HumainMonde: () => null }));
afterEach(cleanup);
const avecClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;

describe('le chat du quartier (démonstration)', () => {
  it('montre les voisins connectés et leurs messages, envoie celui du joueur et lance une émote', () => {
    const onEmote = vi.fn();
    render(<ChatQuartier demo moi="Koffi" voisins={voisinsDemo(0)} onEmote={onEmote} onFermer={vi.fn()} />, { wrapper: avecClient });
    expect(screen.getByText('3 voisins connectés')).toBeInTheDocument();
    expect(screen.getByText('Oui, il reste du ciment CPJ 42,5. Venez tôt, ça part vite.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Message au quartier'), { target: { value: '  Je passe au dépôt  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(screen.getByText('Je passe au dépôt')).toBeInTheDocument();
    expect(screen.getByLabelText('Message au quartier')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Émote : Bravo !' }));
    expect(onEmote).toHaveBeenCalledWith('bravo');
  });
});

describe('les équipes de quartier dans le chat', () => {
  it('invite un voisin, accepte ou refuse une invitation, montre l’équipe et permet de la quitter', async () => {
    const onInviter = vi.fn().mockResolvedValue(null), onRepondre = vi.fn().mockResolvedValue(null), onQuitter = vi.fn().mockResolvedValue(null);
    const voisins = voisinsDemo(0);
    const props = { demo: true, moi: 'Koffi', voisins, onEmote: vi.fn(), onFermer: vi.fn(), onInviter, onRepondre, onQuitter };
    const { rerender } = render(<ChatQuartier {...props} equipe={{ equipe: null, invitations: [{ id: 'i1', de: 'Kader' }] }} />, { wrapper: avecClient });
    expect(screen.getByText(/à deux dans le même lieu, chaque séance rapporte \+10 % d’XP/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Inviter Aya dans ton équipe' }));
    expect(onInviter).toHaveBeenCalledWith(voisins[0]);
    expect(await screen.findByText('Aya : invité')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));
    expect(onRepondre).toHaveBeenCalledWith({ id: 'i1', de: 'Kader' }, true);
    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));
    expect(onRepondre).toHaveBeenLastCalledWith({ id: 'i1', de: 'Kader' }, false);
    const equipe = { id: 'e1', chefId: 'demo-kader', membres: [{ userId: 'demo-kader', nom: 'Kader', enLigne: true, lieu: null }, { userId: 'u1', nom: 'Koffi', enLigne: true, lieu: null }] };
    rerender(<ChatQuartier {...props} equipe={{ equipe, invitations: [] }} />);
    expect(screen.getByText('Ton équipe (2/4)')).toBeInTheDocument();
    expect(screen.getByText('toi')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inviter Kader dans ton équipe' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitter l’équipe' }));
    await waitFor(() => expect(onQuitter).toHaveBeenCalled());
  });
  it('affiche l’erreur du serveur quand une invitation est refusée', async () => {
    const onInviter = vi.fn().mockResolvedValue('Ce voisin n’est plus connecté.');
    render(<ChatQuartier demo moi="Koffi" voisins={voisinsDemo(0)} onEmote={vi.fn()} onFermer={vi.fn()} equipe={{ equipe: null, invitations: [] }} onInviter={onInviter} onRepondre={vi.fn()} onQuitter={vi.fn()} />, { wrapper: avecClient });
    fireEvent.click(screen.getByRole('button', { name: 'Inviter Inès dans ton équipe' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce voisin n’est plus connecté.');
  });
});

describe('l’équipe de démonstration', () => {
  it('le voisin invité accepte après un instant, et Kader propose de faire équipe au bout de quarante secondes', async () => {
    vi.useFakeTimers();
    try {
      const position = { current: new THREE.Vector3() };
      const { result } = renderHook(() => useMondeEnLigne({ demo: true, position, lieu: null, nom: 'Koffi' }));
      await act(async () => { await result.current.inviter(voisinsDemo(0)[0]); });
      act(() => { vi.advanceTimersByTime(1600); });
      expect(result.current.equipe.equipe?.membres.map(m => m.nom)).toEqual(['Koffi', 'Aya']);
      await act(async () => { await result.current.quitter(); });
      expect(result.current.equipe.equipe).toBeNull();
      act(() => { vi.advanceTimersByTime(40_000); });
      expect(result.current.equipe.invitations).toEqual([{ id: 'demo-kader', de: 'Kader' }]);
      await act(async () => { await result.current.repondre(result.current.equipe.invitations[0], true); });
      expect(result.current.equipe.equipe?.membres.map(m => m.nom)).toEqual(['Kader', 'Koffi']);
      expect(result.current.equipe.invitations).toEqual([]);
    } finally { vi.useRealTimers(); }
  });
});

describe('signaler un message et masquer un joueur', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { vi.mocked(api.get).mockReset(); vi.mocked(api.post).mockReset(); });

  it('en démonstration, retire le message signalé, masque un joueur sur cet appareil et le réaffiche', () => {
    render(<ChatQuartier demo moi="Koffi" voisins={voisinsDemo(0)} onEmote={vi.fn()} onFermer={vi.fn()} />, { wrapper: avecClient });
    fireEvent.click(screen.getByRole('button', { name: 'Options du message de Kader' }));
    fireEvent.click(screen.getByRole('button', { name: '🚩 Signaler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Insulte' }));
    expect(screen.queryByText('Oui, il reste du ciment CPJ 42,5. Venez tôt, ça part vite.')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Signalement noté (en démonstration, rien n’est envoyé).');
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Options du message de Aya' }));
    fireEvent.click(screen.getByRole('button', { name: '🔇 Masquer Aya' }));
    expect(screen.queryByText('Bonjour le quartier ! Quelqu’un au dépôt ce matin ?')).not.toBeInTheDocument();
    expect(screen.getByText('🔇 Aya masqué sur cet appareil')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('btp-life:chat:masques')!)).toEqual([{ userId: 'demo-aya', nom: 'Aya' }]);
    fireEvent.click(screen.getByRole('button', { name: 'Réafficher' }));
    expect(screen.getByText('Bonjour le quartier ! Quelqu’un au dépôt ce matin ?')).toBeInTheDocument();
  });

  it('ne propose pas de signaler ses propres messages', () => {
    render(<ChatQuartier demo moi="Koffi" voisins={voisinsDemo(0)} onEmote={vi.fn()} onFermer={vi.fn()} />, { wrapper: avecClient });
    fireEvent.change(screen.getByLabelText('Message au quartier'), { target: { value: 'Je passe au dépôt' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(screen.getByText('Je passe au dépôt')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Options du message de Koffi' })).not.toBeInTheDocument();
  });

  it('connecté, envoie le signalement au serveur et prévient quand des mots ont été masqués', async () => {
    vi.mocked(api.get).mockResolvedValue([{ id: 'm2', userId: 'u2', nom: 'Kader', texte: 'Bande de ******', envoyeLe: '2026-10-29T08:00:00.000Z' }]);
    vi.mocked(api.post).mockResolvedValueOnce({ signale: true, retire: false });
    render(<ChatQuartier demo={false} moi="Koffi" voisins={[]} onEmote={vi.fn()} onFermer={vi.fn()} />, { wrapper: avecClient });
    fireEvent.click(await screen.findByRole('button', { name: 'Options du message de Kader' }));
    fireEvent.click(screen.getByRole('button', { name: '🚩 Signaler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Harcèlement' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/monde/chat/m2/signaler', { motif: 'harcelement' }));
    expect(await screen.findByRole('status')).toHaveTextContent('la modération va relire ce message');
    expect(screen.queryByText('Bande de ******')).not.toBeInTheDocument();

    vi.mocked(api.post).mockResolvedValueOnce({ id: 'm3', userId: 'u1', nom: 'Koffi', texte: 'Quel *******', envoyeLe: '2026-10-29T08:01:00.000Z', modere: true });
    fireEvent.change(screen.getByLabelText('Message au quartier'), { target: { value: 'Quel connard' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(await screen.findByText('Quel *******')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Certains mots ont été masqués');
  });
});
