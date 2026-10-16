import { describe, expect, it } from 'vitest';
import { ZONES_MUSICALES, zoneMusicaleProche } from './zones-musicales';

describe('zones musicales', () => {
  it('identifie chacune des quatre zones à proximité', () => {
    for (const zone of ZONES_MUSICALES) expect(zoneMusicaleProche(zone.position)?.id).toBe(zone.id);
  });
  it('ne déclenche aucune musique en dehors des zones', () => expect(zoneMusicaleProche([120, -120])).toBeNull());
  it('respecte la limite du rayon', () => {
    const zone = ZONES_MUSICALES[0];
    expect(zoneMusicaleProche([zone.position[0] + zone.rayon, zone.position[1]])?.id).toBe(zone.id);
    expect(zoneMusicaleProche([zone.position[0] + zone.rayon + .1, zone.position[1]])).toBeNull();
  });
});
