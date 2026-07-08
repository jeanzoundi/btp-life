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
