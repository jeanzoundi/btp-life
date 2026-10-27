import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
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
