export type V3 = [number, number, number];
export type BlocArchitecture = { position: V3; taille: V3; couleur: string; rotation: number };
export type PlanArchitecture = { solides: BlocArchitecture[]; vitres: BlocArchitecture[]; lumieres: BlocArchitecture[] };

/** Data-only shell: all opaque boxes share one draw call, including balconies. */
export function construireArchitecture(w: number, h: number, d: number, kind: string, color: string, devanture: boolean, nuit: boolean): PlanArchitecture {
  const plan: PlanArchitecture = { solides: [], vitres: [], lumieres: [] };
  const ajouter = (position: V3, taille: V3, couleur: string, rotation = 0, lot: keyof PlanArchitecture = 'solides') => plan[lot].push({ position, taille, couleur, rotation });
  if (kind === 'chantier') {
    ajouter([0, .18, 0], [w, .36, d], '#a89980');
    for (const y of [0, 3.3, 6.6]) {
      ajouter([0, y + .3, 0], [w * .85, .3, d * .8], '#b2b0a7');
      for (const x of [-1, 1]) for (const z of [-1, 0, 1]) ajouter([x * w * .38, y + 1.8, z * d * .34], [.45, 3, .45], '#aaa99c');
    }
    ajouter([w / 2 - 1, 7, 0], [.6, 14, .6], '#edb43c');
    ajouter([w / 2 - 6, 14, 0], [17, .5, .5], '#edb43c');
    ajouter([-3, 10.5, 0], [.06, 7, .06], '#35434c');
    for (const x of [-1, 0, 1]) ajouter([x * 3, .7, d / 2 + 2], [2.2, 1.4, 1.4], '#bf744e');
    return plan;
  }
  ajouter([0, h / 2, 0], [w, h, d], color);
  ajouter([0, .22, 0], [w + 1.2, .44, d + 1.2], '#c7c0ad');
  for (let f = 0; f < Math.max(1, Math.floor(h / 3)); f++) {
    ajouter([0, f * 3 + .35, 0], [w + .6, .24, d + .6], '#e8d9bd');
    for (let side = 0; side < 4; side++) {
      if (devanture && side === 0 && f === 0) continue;
      const r = side * Math.PI / 2, span = side % 2 ? d : w, offset = (side % 2 ? w : d) / 2;
      const count = Math.max(2, Math.floor(span / 2.5));
      const local = (x: number, y: number, z: number, taille: V3, couleur: string, lot: keyof PlanArchitecture = 'solides') => {
        ajouter([x * Math.cos(r) + z * Math.sin(r), y, -x * Math.sin(r) + z * Math.cos(r)], taille, couleur, r, lot);
      };
      for (let k = 0; k < count; k++) {
        const x = (k - (count - 1) / 2) * span / count, y = f * 3 + 1.8, z = offset + .05;
        local(x, y, z, [1.6, 2.1, .15], '#e9ddc5');
        const allumee = nuit && (k + f + side) % 3 !== 0;
        local(x, y, z + .09, [1.35, 1.85, .1], allumee ? '#b39360' : '#36515f', allumee ? 'lumieres' : 'vitres');
        local(x, y, z + .16, [.065, 1.85, .05], '#bfc3b8');
        if (f > 0 && kind !== 'tour') {
          local(x, y - 1.12, z + .47, [1.95, .16, 1.1], '#e8d9bd');
          local(x, y - .45, z + .95, [1.9, .06, .06], '#35464a');
          for (const barre of [-.85, 0, .85]) local(x + barre, y - .8, z + .95, [.055, .7, .055], '#35464a');
        }
      }
    }
  }
  ajouter([0, h + .1, 0], [w + .8, .3, d + .8], '#e8d9bd');
  ajouter([0, h + .4, 0], [w - .8, .3, d - .8], '#697268');
  ajouter([w * .25, h + .9, 0], [2, .7, 1.4], '#aeb6ae');
  // Rooftop vents and recessed parapets give silhouettes a less toy-like finish.
  for (const x of [-w / 2 + .25, w / 2 - .25]) ajouter([x, h + .65, 0], [.22, .8, d], '#d2c5ad');
  for (let i = 0; i < 6; i++) ajouter([w * .25 - .8 + i * .32, h + 1.27, 0], [.08, .025, 1.15], '#566164');
  if (!devanture) ajouter([0, 1.25, d / 2 + .18], [2, 2.5, .25], '#233e45');
  if (kind === 'commerce') for (let i = 0; i < 10; i++) ajouter([(i - 4.5) * w / 10, 3.72, d / 2 + .8], [w / 10, .12, 1.4], i % 2 ? '#f6e7c6' : '#355b51');
  if (kind === 'campus') for (const x of [-w * .35, w * .35]) ajouter([x, 1.7, d / 2 + 1], [.6, 3.4, .6], '#e8d9bd');
  return plan;
}
