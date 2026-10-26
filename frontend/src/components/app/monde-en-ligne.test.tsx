import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { voisinsDemo } from '@/lib/en-ligne';
import { ChatQuartier } from './monde-en-ligne';

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
