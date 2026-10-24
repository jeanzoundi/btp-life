import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROFESSIONNELS } from '@/lib/lieux-vie/cafe';
import { MAQUIS } from '@/lib/lieux-vie/maquis';
import { PanneauCarte, PanneauReseau } from './panneaux-lieux-vie';
import { useServiceLieu } from './service-lieu';

afterEach(() => { cleanup(); vi.useRealTimers(); });
const BESOINS = { energie: 60, faim: 30, social: 50, moral: 50 };
const garba = MAQUIS.carte.find(a => a.id === 'garba')!;

describe('la carte du maquis', () => {
  it('commande un plat, et refuse ce qui est trop cher ou inutile', () => {
    const onCommander = vi.fn();
    render(<PanneauCarte lieu={MAQUIS} besoins={{ ...BESOINS, faim: 99 }} argent={1200} demo={false} salutation="Bonjour !" enCours={false} erreur={null} onCommander={onCommander} onFermer={vi.fn()} />);
    // Faim pleine : les plats ne servent à rien ; les boissons touchent encore l'énergie ou le social.
    expect(screen.getByRole('button', { name: /1\s000\sF\s*Pas besoin/ })).toBeDisabled();
    const boissons = screen.getAllByRole('button', { name: /300\sF\s*Commander/ });
    expect(boissons).toHaveLength(2);
    fireEvent.click(boissons[1]);
    expect(onCommander).toHaveBeenCalledWith(expect.objectContaining({ id: 'gingembre' }));
  });
  it('propose la table des collègues seulement quand ils sont là, avec son bonus social', () => {
    const onTablee = vi.fn();
    const { rerender } = render(<PanneauCarte lieu={MAQUIS} besoins={BESOINS} argent={5000} demo salutation="Bonjour !" tablee={{ choisie: true, presents: false }} onTablee={onTablee} enCours={false} erreur={null} onCommander={vi.fn()} onFermer={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /Avec les collègues/ })).toBeDisabled();
    expect(screen.getByText(/mangent ici à midi et après 17 h/)).toBeInTheDocument();
    rerender(<PanneauCarte lieu={MAQUIS} besoins={BESOINS} argent={5000} demo salutation="Bonjour !" tablee={{ choisie: true, presents: true }} onTablee={onTablee} enCours={false} erreur={null} onCommander={vi.fn()} onFermer={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /Avec les collègues · 💬 \+20/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByText(/💬 \+20 social/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('radio', { name: 'À ma table' }));
    expect(onTablee).toHaveBeenCalledWith(false);
  });
  it('trop cher pour le solde : le bouton le dit', () => {
    render(<PanneauCarte lieu={MAQUIS} besoins={BESOINS} argent={800} demo={false} salutation="Bonjour !" enCours={false} erreur="Pas assez d’argent" onCommander={vi.fn()} onFermer={vi.fn()} />);
    expect(screen.getByRole('button', { name: /1\s000\sF\s*Trop cher/ })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Pas assez d’argent');
  });
});

describe('le service', () => {
  it('paie, prépare, sert, puis applique les effets une fois le plat mangé', async () => {
    vi.useFakeTimers();
    const appliquer = vi.fn(), notifier = vi.fn(), onTermine = vi.fn();
    const consommer = vi.fn().mockResolvedValue({ message: 'Délicieux.', coutPaye: 1000, appliquer });
    const { result } = renderHook(() => useServiceLieu<'table' | 'collegues'>({ hote: 'Tantie Bintou', consommer, notifier, libelleStation: s => s, onTermine }));
    await act(async () => { expect(await result.current.commander(garba, 'collegues', { tablee: true })).toBe(true); });
    expect(consommer).toHaveBeenCalledWith(garba, { tablee: true });
    expect(result.current.service?.etape).toBe('preparation');
    expect(result.current.sAttabler('collegues')).toBe(false);
    await act(async () => { vi.advanceTimersByTime(garba.preparation * 1000 + 400); });
    expect(result.current.service?.etape).toBe('servi');
    act(() => { expect(result.current.sAttabler('table')).toBe(false); });
    act(() => { expect(result.current.sAttabler('collegues')).toBe(true); });
    expect(appliquer).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(6400); });
    expect(appliquer).toHaveBeenCalledOnce();
    expect(notifier).toHaveBeenLastCalledWith('Délicieux.', 'succes');
    expect(onTermine).toHaveBeenCalledWith(expect.objectContaining({ options: { tablee: true }, station: 'collegues' }));
    expect(result.current.service).toBeNull();
  });
  it('partir avant la fin : ce qui est payé est emporté, ses effets comptent', async () => {
    const appliquer = vi.fn();
    const { result } = renderHook(() => useServiceLieu<'table'>({ hote: 'Kader', consommer: vi.fn().mockResolvedValue({ message: '', coutPaye: 300, appliquer }), notifier: vi.fn(), libelleStation: () => 'à ta table' }));
    await act(async () => { await result.current.commander(garba, 'table'); });
    act(() => result.current.emporter());
    expect(appliquer).toHaveBeenCalledOnce();
    expect(result.current.service).toBeNull();
  });
  it('un refus du serveur reste affiché, rien ne part en cuisine', async () => {
    const { result } = renderHook(() => useServiceLieu<'table'>({ hote: 'Kader', consommer: vi.fn().mockRejectedValue(new Error('Pas assez d’argent')), notifier: vi.fn(), libelleStation: () => '' }));
    await act(async () => { expect(await result.current.commander(garba, 'table')).toBe(false); });
    expect(result.current.erreur).toBe('Pas assez d’argent');
    expect(result.current.service).toBeNull();
  });
});

describe('la table du réseau', () => {
  it('montre la relation, le dernier conseil obtenu, et une conversation par visite', () => {
    const onParler = vi.fn();
    render(<PanneauReseau professionnels={PROFESSIONNELS} relations={{ 'Aminata Koné': 35 }} dejaVus={['Serge Aka']} onParler={onParler} onFermer={vi.fn()} />);
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText(/dossier complet passe deux fois plus vite/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Déjà discuté aujourd’hui' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Discuter avec Aminata' }));
    expect(onParler).toHaveBeenCalledWith(PROFESSIONNELS[0]);
  });
});
