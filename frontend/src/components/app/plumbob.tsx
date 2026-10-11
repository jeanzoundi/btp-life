'use client';

const COULEURS = { bien: '#7dbb3b', moyen: '#e7b83e', mal: '#d9534f' } as const;

export function Plumbob({ taille = 22, humeur = 'bien' }: { taille?: number; humeur?: keyof typeof COULEURS }) {
  return <div aria-hidden="true" className="plumbob-bob"><div className="plumbob-spin rotate-45 border border-white/50 shadow" style={{ width: taille, height: taille, background: COULEURS[humeur] }} /></div>;
}
