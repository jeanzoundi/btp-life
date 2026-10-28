import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CapObjectif, HorlogeMonde, PileNotifications } from './hud-monde';

afterEach(cleanup);
const horloge = { heure: '17:05', meteo: { icone: '⛅', nom: 'Nuageux · Petite saison des pluies' }, vitesse: 1, vitesses: [1, 2, 3] };

describe('le HUD de la ville', () => {
  it('sur grand écran, l’horloge règle la vitesse du temps', () => {
    const onVitesse = vi.fn();
    render(<HorlogeMonde {...horloge} pause={false} onPause={vi.fn()} onVitesse={onVitesse} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vitesse 2x' }));
    expect(onVitesse).toHaveBeenCalledWith(2);
    expect(screen.getByTestId('meteo-monde')).toHaveAttribute('title', 'Nuageux · Petite saison des pluies');
  });

  it('sur téléphone, l’horloge garde l’heure et la météo, et signale seulement la pause', () => {
    const { rerender } = render(<HorlogeMonde {...horloge} pause={false} onPause={vi.fn()} onVitesse={vi.fn()} compacte />);
    expect(screen.getByText('17:05')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Vitesse du temps' })).not.toBeInTheDocument();
    expect(screen.queryByText('Temps en pause')).not.toBeInTheDocument();
    rerender(<HorlogeMonde {...horloge} pause onPause={vi.fn()} onVitesse={vi.fn()} compacte />);
    expect(screen.getByText('Temps en pause')).toBeInTheDocument();
  });

  it('sur téléphone, l’objectif reste lisible et ouvre le planning', () => {
    const onClick = vi.fn();
    render(<CapObjectif texte="Journée de travail avec Yao" etiquette="2/5" cible={null} joueur={{ current: { x: 0, z: 0 } as THREE.Vector3 }} vue={{ current: { azimut: 0 } }} ouvert={false} onClick={onClick} compacte />);
    expect(screen.getByText('Journée de travail avec Yao')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Objectif : Journée de travail avec Yao' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('ne garde que la dernière notification quand la place manque', () => {
    const notifications = [{ id: 1, texte: 'Première nouvelle', type: 'info' as const }, { id: 2, texte: 'Dernière nouvelle', type: 'succes' as const }];
    const { rerender } = render(<PileNotifications notifications={notifications} onFermer={vi.fn()} max={1} />);
    expect(screen.queryByText('Première nouvelle')).not.toBeInTheDocument();
    expect(screen.getByText('Dernière nouvelle')).toBeInTheDocument();
    rerender(<PileNotifications notifications={notifications} onFermer={vi.fn()} />);
    expect(screen.getByText('Première nouvelle')).toBeInTheDocument();
  });
});
