import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgrammesLieux, type EtatProgrammesLieux } from './programmes-lieux';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/api', () => ({ api }));

beforeEach(() => { localStorage.clear(); api.get.mockReset(); api.post.mockReset(); });
afterEach(cleanup);

const avecClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{children}</QueryClientProvider>;
const options = (o: Partial<Parameters<typeof useProgrammesLieux>[0]> = {}) => ({ cle: 'lieux-test', demo: false, heure: 10, notifier: vi.fn(), recompenser: vi.fn(), passerA: vi.fn(), ...o });

/** Fait chaque tâche de la séance à son poste, avec la bonne réponse ; renvoie les réponses brutes données. */
function toutFaire(result: { current: EtatProgrammesLieux }) {
  const donnees: Record<string, number | number[]> = {};
  for (const t of result.current.seance!.taches) {
    act(() => result.current.surStation(result.current.seance!.slug, t.zone));
    act(() => {
      const c = result.current.tache!.contenu;
      const reponse = c.type === 'mesure' ? c.mesure.reponse : c.type === 'situation'
        ? c.situation.choix.findIndex(o => o.correct) : c.selection.options.flatMap((o, i) => o.attendu ? [i] : []);
      donnees[result.current.tache!.id] = reponse;
      result.current.repondreTache(reponse);
      result.current.noterTache(100);
    });
    act(() => result.current.setTache(null));
  }
  return donnees;
}

describe('les séances des lieux, connecté', () => {
  it('envoie les réponses brutes de chaque tâche, jamais une note, et affiche la note corrigée par le serveur', async () => {
    api.get.mockResolvedValue({ laboratoire: { etapes: 2, cycles: 1, seances: 9, derniereRecompenseLe: null } });
    const { result } = renderHook(() => useProgrammesLieux(options()), { wrapper: avecClient });
    await waitFor(() => expect(result.current.progresDe('laboratoire')).toMatchObject({ etapes: 2, cycles: 1 }));

    act(() => result.current.commencer('laboratoire'));
    expect(result.current.seance).toMatchObject({ slug: 'laboratoire', etape: 2, cycle: 1 });
    const donnees = toutFaire(result);
    expect(Object.keys(donnees)).toHaveLength(result.current.seance!.taches.length);

    // Le serveur a trouvé une autre note que le jeu (version périmée, réponses trafiquées…) : c'est la sienne qui compte.
    api.post.mockResolvedValue({
      note: 70, progres: { etapes: 3, cycles: 1, seances: 10, derniereRecompenseLe: '2026-10-29T10:00:00.000Z' },
      gains: { xp: 38, argent: 1550, reputation: 1, facteurBesoins: 1, entrainement: false, prochaineRecompenseLe: '2026-10-29T10:20:00.000Z' },
    });
    act(() => result.current.faireLeBilan());
    await waitFor(() => expect(result.current.resultat).not.toBeNull());
    expect(api.post).toHaveBeenCalledWith('/carriere/lieux/laboratoire/seance', { etape: 2, reponses: donnees });
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('note');
    expect(result.current.resultat).toMatchObject({ recompenses: 'serveur', bilan: { note: 70, compte: true, mention: 'Bonne séance', paie: 1550, xp: 38 } });
    expect(result.current.progresDe('laboratoire')).toMatchObject({ etapes: 3, seances: 10 });
  });

  it('une nouvelle séance repart sans les réponses de la précédente', async () => {
    api.get.mockResolvedValue({ laboratoire: { etapes: 0, cycles: 0, seances: 0, derniereRecompenseLe: null } });
    const { result } = renderHook(() => useProgrammesLieux(options()), { wrapper: avecClient });
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    await waitFor(() => expect(result.current.progresDe('laboratoire').seances).toBe(0));

    act(() => result.current.commencer('laboratoire'));
    const premiere = result.current.seance!.taches[0];
    act(() => result.current.surStation('laboratoire', premiere.zone));
    act(() => { result.current.repondreTache(0); result.current.noterTache(100); });
    act(() => { result.current.setTache(null); result.current.abandonner(); });

    act(() => result.current.commencer('laboratoire'));
    const donnees = toutFaire(result);
    api.post.mockResolvedValue({ note: 100, progres: { etapes: 1, cycles: 0, seances: 1, derniereRecompenseLe: null }, gains: { xp: 50, argent: 2000, reputation: 1, facteurBesoins: 1, entrainement: false, prochaineRecompenseLe: '2026-10-29T10:20:00.000Z' } });
    act(() => result.current.faireLeBilan());
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(api.post.mock.calls[0][1]).toEqual({ etape: 0, reponses: donnees });
  });
});

describe('les séances des lieux, en démonstration', () => {
  it('corrige dans le navigateur sans rien envoyer', () => {
    const o = options({ demo: true });
    const { result } = renderHook(() => useProgrammesLieux(o), { wrapper: avecClient });
    act(() => result.current.commencer('laboratoire'));
    toutFaire(result);
    act(() => result.current.faireLeBilan());
    expect(api.get).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
    expect(result.current.resultat).toMatchObject({ recompenses: 'demo', bilan: { note: 100, compte: true } });
    expect(o.recompenser).toHaveBeenCalledWith(expect.objectContaining({ note: 100, paie: 2000, xp: 50 }));
  });
});
