import { describe, expect, it } from 'vitest';
import { routeAccueilPourMode } from './mode-experience-store';

describe('routeAccueilPourMode', () => {
  it('fait du monde vivant la destination immersive', () => {
    expect(routeAccueilPourMode('monde')).toBe('/app/monde');
  });

  it('conserve le tableau de bord pour le mode classique', () => {
    expect(routeAccueilPourMode('classique')).toBe('/app');
  });
});
