import { DERNIERE_MISE_A_JOUR_LEGALE, PAGES_LEGALES, PAGES_LEGALES_D_ORIGINE } from '../../../prisma/seed-data/pages-legales-data';
import { actionPage } from '../../../scripts/publier-pages-legales';

const texte = (slug: string) => PAGES_LEGALES.find(p => p.slug === slug)!.texte;

describe('les pages légales du site', () => {
  it('couvrent les quatre pages, complètes, sans trou à remplir, avec l’éditeur et la date de mise à jour', () => {
    expect(PAGES_LEGALES.map(p => p.slug).sort()).toEqual(['cgu', 'confidentialite', 'cookies', 'mentions-legales']);
    expect(PAGES_LEGALES.filter(p => /\[À |à préciser|à compléter|TODO/i.test(p.texte)).map(p => p.slug)).toEqual([]);
    expect(PAGES_LEGALES.filter(p => p.texte.length < 800).map(p => p.slug)).toEqual([]);
    expect(PAGES_LEGALES.filter(p => !p.texte.trim().endsWith(`Dernière mise à jour : ${DERNIERE_MISE_A_JOUR_LEGALE}.`)).map(p => p.slug)).toEqual([]);
    expect(texte('mentions-legales')).toMatch(/édité par Mister JZ/);
    expect(texte('mentions-legales')).toMatch(/Directeur de la publication : Mister JZ/);
    expect(texte('confidentialite')).toMatch(/Mister JZ, éditeur de BTP Life, est responsable/);
    expect(texte('mentions-legales')).toMatch(/Vercel Inc\.[\s\S]*Supabase, Inc\./);
  });

  it('n’affiche qu’une adresse de contact publique, jamais une adresse personnelle', () => {
    const adresses = new Set(PAGES_LEGALES.flatMap(p => p.texte.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? []));
    expect([...adresses]).toEqual(['contact@btplife.com']);
  });

  it('n’emploie que la mise en forme des Pages CMS : intertitres « ## », listes « - », paragraphes', () => {
    const horsFormat = PAGES_LEGALES.flatMap(p => p.texte.split('\n').filter(l => /^(#\s|#{3,}|\*|\d+\.\s)/.test(l)).map(l => `${p.slug} : ${l}`));
    expect(horsFormat).toEqual([]);
  });

  it('ne remplace en production que les versions d’une ligne d’origine, jamais une page réécrite dans l’administration', () => {
    const cgu = texte('cgu');
    expect(actionPage('cgu', null, cgu)).toBe('creer');
    expect(actionPage('cgu', PAGES_LEGALES_D_ORIGINE.cgu, cgu)).toBe('remplacer');
    expect(actionPage('cgu', `${cgu}\n`, cgu)).toBe('a-jour');
    expect(actionPage('cgu', 'Nos conditions, réécrites par l’éditeur.', cgu)).toBe('laisser');
  });
});
