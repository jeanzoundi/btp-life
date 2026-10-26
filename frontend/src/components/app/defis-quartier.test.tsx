import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aReclamer, cleJour, defisDemo, etatDemo, imprevuDemo } from '@/lib/defis';
import { EcranDefis, PanneauImprevu, useDefisQuartier } from './defis-quartier';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => localStorage.clear());
afterEach(cleanup);
const avecClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;

describe('les défis de démonstration', () => {
  it('partent d’un instantané du jour, et repartent à zéro le lendemain', () => {
    const maintenant = new Date('2026-10-26T09:00:00Z');
    const e = etatDemo(null, maintenant, { seances: 4, chapitres: 1, trajets: 0 });
    expect(e).toEqual({ jour: '2026-10-26', base: { seances: 4, chapitres: 1, trajets: 0 }, reclames: [], imprevu: null });
    const defis = defisDemo(e, { seances: 5, chapitres: 1, trajets: 2 });
    expect(defis.find(d => d.slug === 'seance-du-jour')).toMatchObject({ progres: 1, reclame: false });
    expect(defis.find(d => d.slug === 'en-route')?.progres).toBe(1);
    expect(defis.find(d => d.slug === 'le-fil-rouge-avance')?.progres).toBe(0);
    expect(aReclamer(defis)).toBe(2);
    expect(etatDemo({ ...e, reclames: ['en-route'] }, new Date('2026-10-27T09:00:00Z'), { seances: 9, chapitres: 2, trajets: 3 }).reclames).toEqual([]);
  });
  it('change d’imprévu selon le jour', () => {
    expect(new Set(['2026-10-26', '2026-10-27'].map(j => imprevuDemo(j).slug)).size).toBe(2);
  });
});

describe('les défis dans le jeu', () => {
  it('réclame un défi réussi et verse la récompense de démonstration, une seule fois', async () => {
    const recompenserDemo = vi.fn();
    const totaux = { seances: 0, chapitres: 0, trajets: 0 };
    const { result, rerender } = renderHook(({ t }) => useDefisQuartier({ demo: true, totauxDemo: t, recompenserDemo }), { wrapper: avecClient, initialProps: { t: totaux } });
    rerender({ t: { ...totaux, trajets: 1 } });
    expect(result.current.aReclamer).toBe(1);
    await act(async () => { expect(await result.current.reclamer('en-route')).toBeNull(); });
    expect(recompenserDemo).toHaveBeenCalledWith({ xp: 10, argent: 300 });
    expect(result.current.defis.find(d => d.slug === 'en-route')?.reclame).toBe(true);
    await act(async () => { expect(await result.current.reclamer('en-route')).toMatch(/pas encore réussi/); });
    expect(JSON.parse(localStorage.getItem('btp-life-defis:demo')!).jour).toBe(cleJour(new Date()));
  });

  it('affiche les défis dans le téléphone et règle l’imprévu au chantier, avec ses conséquences', async () => {
    const recompenserDemo = vi.fn();
    function Banc() {
      const etat = useDefisQuartier({ demo: true, totauxDemo: { seances: 0, chapitres: 0, trajets: 0 }, recompenserDemo });
      return <><EcranDefis etat={etat} onChantier={vi.fn()} /><PanneauImprevu etat={etat} onFermer={vi.fn()} /></>;
    }
    render(<Banc />, { wrapper: avecClient });
    expect(screen.getByText('Défis du jour')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Réclamer' })[0]).toBeDisabled();
    const imprevu = imprevuDemo(cleJour(new Date()));
    const panneau = screen.getByRole('dialog', { name: `Imprévu : ${imprevu.titre}` });
    expect(panneau).toHaveTextContent(imprevu.description);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: imprevu.options[0] })); });
    expect(recompenserDemo).toHaveBeenCalledWith({ xp: imprevu.decisions[0].effets.xp, argent: imprevu.decisions[0].effets.argent });
    expect(screen.getByRole('status', { name: '' })).toBeTruthy();
    expect(screen.getAllByText(imprevu.decisions[0].retour).length).toBeGreaterThan(0);
  });
});
