import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAPITRES, PARCELLE_AKWABA } from '@/lib/campagne';
import { PanneauxFilRouge, useCampagne, type EtatCampagne } from './fil-rouge';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/api', () => ({ api }));

beforeEach(() => { localStorage.clear(); api.get.mockReset(); api.post.mockReset(); });
afterEach(cleanup);

const avecClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{children}</QueryClientProvider>;
const options = (o: Partial<Parameters<typeof useCampagne>[0]> = {}) => ({ cle: 'campagne-test', demo: true, heure: 9, notifier: vi.fn(), recompenser: vi.fn(), occupe: null, ...o });
/** Fait toutes les tâches de la séance en cours, chacune à son poste, avec le score donné. */
function toutFaire(result: { current: EtatCampagne }, score = 100) {
  for (const t of result.current.seance!.taches) {
    act(() => { if (!result.current.surStation(result.current.seance!.slug, t.zone)) result.current.ouvrirTache(t.id); });
    act(() => {
      const c = result.current.tache!.contenu;
      const reponse = c.type === 'mesure' ? c.mesure.reponse : c.type === 'situation'
        ? c.situation.choix.findIndex(o => o.correct) : c.selection.options.flatMap((o, i) => o.attendu ? [i] : []);
      result.current.repondreTache(reponse);
      result.current.noterTache(score);
    });
    act(() => result.current.setTache(null));
  }
}

describe('le fil rouge en démonstration', () => {
  it('joue un chapitre aux postes du lieu, le valide au bilan et annonce le rendez-vous suivant', () => {
    const o = options();
    const { result } = renderHook(() => useCampagne(o), { wrapper: avecClient });
    expect(result.current.chapitre?.id).toBe('offre');
    expect(result.current.statut('entreprise')).toBe('disponible');
    expect(result.current.statut('mairie')).toBe('ailleurs');
    expect(result.current.concerne('entreprise')).toBe(true);
    expect(result.current.postes('entreprise')).toBeNull();

    act(() => result.current.commencer());
    expect(result.current.seance).toMatchObject({ slug: 'entreprise', etape: 0 });
    expect(result.current.postes('entreprise')).toEqual(['finances', 'bureaux', 'direction']);
    expect(o.notifier).toHaveBeenLastCalledWith(expect.stringMatching(/chapitre 1 : le marché clé en main/), 'trajet');
    // Un poste sans tâche du chapitre est laissé au lieu (ses services, ses consignes).
    expect(result.current.surStation('entreprise', 'marches')).toBe(false);

    toutFaire(result);
    expect(result.current.statut('entreprise')).toBe('bilan');
    expect(result.current.postes('entreprise')).toEqual(['mentor']);
    act(() => { expect(result.current.surStation('entreprise', 'mentor')).toBe(true); });
    expect(result.current.panneau).toBe('entreprise');

    act(() => result.current.faireLeBilan());
    expect(result.current.resultat).toMatchObject({ index: 0, recompenses: 'demo', bilan: { note: 100, reussi: true, argent: 2500 } });
    expect(o.recompenser).toHaveBeenCalledWith(expect.objectContaining({ xp: 80, argent: 2500 }));
    expect(result.current.progres.chapitres).toBe(1);
    expect(JSON.parse(localStorage.getItem('campagne-test')!)).toEqual({ chapitres: 1, termineeLe: null });

    act(() => result.current.terminer());
    expect(o.notifier).toHaveBeenLastCalledWith(expect.stringMatching(/Prochain rendez-vous : Laboratoire des matériaux, avec Adjoua Ehui/), 'succes');
    expect(result.current.seance).toBeNull();
    expect(result.current.chapitre?.id).toBe('sol');
  });

  it('ne valide pas un chapitre raté : rien n’est payé, il se rejoue', () => {
    const o = options();
    const { result } = renderHook(() => useCampagne(o), { wrapper: avecClient });
    act(() => result.current.commencer());
    toutFaire(result, 0);
    act(() => result.current.faireLeBilan());
    expect(result.current.resultat?.bilan.reussi).toBe(false);
    expect(o.recompenser).not.toHaveBeenCalled();
    act(() => result.current.terminer());
    expect(result.current.chapitre?.id).toBe('offre');
    expect(o.notifier).toHaveBeenLastCalledWith(expect.stringMatching(/chapitre à reprendre/), 'alerte');
  });

  it('attend la fin d’une séance de lieu, et les heures d’ouverture du mentor', () => {
    const occupe = options({ occupe: 'Hôtel de ville' });
    const { result } = renderHook(() => useCampagne(occupe), { wrapper: avecClient });
    expect(result.current.statut('entreprise')).toBe('occupe');
    act(() => result.current.commencer());
    expect(result.current.seance).toBeNull();
    expect(occupe.notifier).toHaveBeenCalledWith('Termine d’abord ta séance en cours (Hôtel de ville).', 'alerte');
    const nuit = renderHook(() => useCampagne(options({ heure: 21 })), { wrapper: avecClient });
    expect(nuit.result.current.statut('entreprise')).toBe('ferme');
  });
});

describe('le fil rouge connecté', () => {
  it('fait valider la réception par le serveur, qui paie et livre l’immeuble', async () => {
    api.get.mockResolvedValue({ chapitres: 8, termineeLe: null });
    api.post.mockResolvedValue({ note: 100, progres: { chapitres: 9, termineeLe: '2026-10-26T15:00:00.000Z' }, gains: { reussi: true, xp: 266, argent: 25_000, reputation: 15, facteurBesoins: .95 } });
    const o = options({ demo: false });
    const { result } = renderHook(() => useCampagne(o), { wrapper: avecClient });
    await waitFor(() => expect(result.current.chapitre?.id).toBe('reception'));
    expect(result.current.statut(PARCELLE_AKWABA.slug)).toBe('disponible');
    act(() => result.current.commencer());
    // À la réception, les vérifications se font depuis le panneau de Mme Touré : aucun poste dans un lieu.
    expect(result.current.seance?.slug).toBe(PARCELLE_AKWABA.slug);
    toutFaire(result);
    act(() => result.current.faireLeBilan());
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/carriere/campagne/chapitre', { chapitre: 8, reponses: { reserves: [0, 1, 2, 3], 'proces-verbal': 0, 'retenue-finale': 7.625 } }));
    await waitFor(() => expect(result.current.resultat?.gains?.argent).toBe(25_000));
    expect(o.recompenser).not.toHaveBeenCalled();
    act(() => result.current.terminer());
    expect(o.notifier).toHaveBeenLastCalledWith(expect.stringMatching(/Résidence Akwaba livrée/), 'succes');
    expect(result.current.chapitre).toBeNull();
    expect(result.current.statut(PARCELLE_AKWABA.slug)).toBe('termine');
  });

  it('dit pourquoi un chapitre n’a pas été enregistré', async () => {
    api.get.mockResolvedValue({ chapitres: 0, termineeLe: null });
    api.post.mockRejectedValue(new Error('Ce chapitre n’est plus celui en cours : actualise la page.'));
    const { result } = renderHook(() => useCampagne(options({ demo: false })), { wrapper: avecClient });
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    act(() => result.current.commencer());
    toutFaire(result);
    act(() => result.current.faireLeBilan());
    await waitFor(() => expect(result.current.resultat?.erreur).toMatch(/actualise la page/));
  });
});

/** Le hook et ses panneaux, comme dans la ville ou dans un intérieur. */
function Banc({ ici, onAller = vi.fn(), ...o }: Partial<Parameters<typeof useCampagne>[0]> & { ici: string; onAller?: (lieu: string) => void }) {
  const campagne = useCampagne(options(o));
  return <>
    <button onClick={() => campagne.ouvrir(ici)}>ouvrir</button>
    <PanneauxFilRouge ici={ici} campagne={campagne} nomJoueur="Jean" demo={o.demo ?? true} onAller={onAller} onAttendre={vi.fn()} />
  </>;
}

describe('le panneau du fil rouge', () => {
  it('chez le mentor du chapitre : sa consigne et le bouton pour commencer', () => {
    render(<Banc ici="entreprise" />, { wrapper: avecClient });
    fireEvent.click(screen.getByRole('button', { name: 'ouvrir' }));
    const panneau = screen.getByRole('dialog', { name: /Joseph Amani/ });
    expect(panneau).toHaveTextContent('Bonjour Jean ! Mme Touré a une parcelle au Plateau Nord');
    expect(panneau).toHaveTextContent('Chapitre 1 · Le marché clé en main');
    expect(screen.getByRole('button', { name: 'Commencer le chapitre' })).toBeInTheDocument();
  });

  it('devant la parcelle : la fiche du projet, et le chemin vers le prochain rendez-vous', () => {
    const onAller = vi.fn();
    render(<Banc ici={PARCELLE_AKWABA.slug} onAller={onAller} />, { wrapper: avecClient });
    fireEvent.click(screen.getByRole('button', { name: 'ouvrir' }));
    const fiche = screen.getByRole('dialog', { name: 'Fil rouge : Résidence Akwaba' });
    expect(fiche).toHaveTextContent('Sur la parcelle : Parcelle bornée');
    expect(fiche).toHaveTextContent('Le marché clé en main : Tour BTP Life, avec Joseph Amani');
    expect(screen.getAllByRole('listitem')).toHaveLength(CHAPITRES.length);
    fireEvent.click(screen.getByRole('button', { name: 'Y aller · Tour BTP Life' }));
    expect(onAller).toHaveBeenCalledWith('entreprise');
  });

  it('à la réception : les vérifications s’ouvrent depuis le panneau de Mme Touré', () => {
    localStorage.setItem('campagne-test', JSON.stringify({ chapitres: 8, termineeLe: null }));
    render(<Banc ici={PARCELLE_AKWABA.slug} />, { wrapper: avecClient });
    fireEvent.click(screen.getByRole('button', { name: 'ouvrir' }));
    expect(screen.getByRole('dialog', { name: /Mme Touré/ })).toHaveTextContent('Le grand jour !');
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la visite de réception' }));
    expect(screen.getAllByText('Vérifier →')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: /Le tour des réserves/ }));
    expect(screen.getByRole('dialog', { name: 'Sélection : Le tour des réserves' })).toBeInTheDocument();
  });
});
