import type { Config } from 'tailwindcss';

// Palette "Matière & Élévation" — voir CONCEPTION.md §16.1.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        terracotta: '#C1502E',
        olive: '#6B7A3F',
        cuivre: '#B87333',
        // HUD du monde 3D, style « Lagune » : verre sombre et chaud, or, terre cuite vive, eau de la lagune.
        jeu: { nuit: '#1C1511', or: '#E8B04A', terre: '#E2653C', lagune: '#4CC3A5', ivoire: '#FBF5EA' },
        ivoire: '#F5F0E6',
        graphite: '#2B2B2E',
        pierre: '#E8DCC8',
        sable: '#D9B382',
        mineral: '#8A8680',
        brun: '#4A342A',
        argile: '#A85F4C',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
