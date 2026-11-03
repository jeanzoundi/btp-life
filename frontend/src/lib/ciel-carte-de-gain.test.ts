import { DataUtils } from 'three';
import { describe, expect, it } from 'vitest';
import { recomposerCiel, type MetadonneesGain } from './ciel-carte-de-gain';

const O = 1 / 64;
const META: MetadonneesGain = { gainMapMin: [-.5, -.5, -.5], gainMapMax: [16, 15, 14], gamma: [.7, .7, .7], offsetSdr: [O, O, O], offsetHdr: [O, O, O] };
const lineaire = (octet: number) => { const c = octet / 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
/** Un pixel RGBA recomposé, relu en flottants. */
const pixel = (sdr: number[], gain: number[], meta = META) => [...recomposerCiel([...sdr, 255], [...gain, 255], meta, 1)].map(DataUtils.fromHalfFloat);

describe('ciel recomposé depuis sa carte de gain', () => {
  it('applique le gain minimal et maximal de chaque canal', () => {
    const [r, g, b] = pixel([200, 200, 200], [0, 255, 255]);
    expect(r).toBeCloseTo((lineaire(200) + O) * 2 ** -.5 - O, 3);
    expect(g / ((lineaire(200) + O) * 2 ** 15 - O)).toBeCloseTo(1, 2);
    expect(b / ((lineaire(200) + O) * 2 ** 14 - O)).toBeCloseTo(1, 2);
  });
  it('interpole le gain selon le gamma de la carte', () => {
    const [r] = pixel([255, 0, 0], [128, 0, 0]);
    const t = Math.pow(128 / 255, 1 / .7);
    expect(r / ((1 + O) * 2 ** (-.5 + 16.5 * t) - O)).toBeCloseTo(1, 2);
  });
  it('reste dans les demi-flottants positifs, opaque', () => {
    const [r, g, , a] = pixel([255, 0, 0], [255, 0, 0], { ...META, gainMapMax: [20, 15, 14], gainMapMin: [-.5, -9, -.5] });
    expect(r).toBe(65504);
    expect(g).toBe(0);
    expect(a).toBe(1);
  });
});
