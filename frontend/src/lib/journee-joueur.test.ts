import { describe, expect, it } from 'vitest';
import { conseilsDuMatin, dormirJusquAuMatin, programmeDuJour } from './journee-joueur';
import { LIEUX_PROGRAMME } from './lieux-programme';

describe('la journée vue de chez soi', () => {
  it('met le chantier de Yao en tête, puis chaque programme dans l’ordre des ouvertures', () => {
    const jour = programmeDuJour(() => ({ etapes: 0, cycles: 0 }), true);
    expect(jour[0]).toMatchObject({ slug: 'chantier', ouverture: 6 });
    expect(jour).toHaveLength(Object.keys(LIEUX_PROGRAMME).length + 1);
    const ouvertures = jour.slice(1).map(r => r.ouverture);
    expect(ouvertures).toEqual([...ouvertures].sort((a, b) => a - b));
    expect(programmeDuJour(() => ({ etapes: 0, cycles: 0 }), false)[0].slug).not.toBe('chantier');
  });
  it('annonce l’étape qui attend dans chaque lieu, sans dépasser la dernière', () => {
    const jour = programmeDuJour(slug => ({ etapes: slug === 'banque' ? 2 : slug === 'mairie' ? 99 : 0, cycles: 0 }), false);
    expect(jour.find(r => r.slug === 'banque')).toMatchObject({ titre: 'Monter le dossier de crédit', detail: 'Financer son projet · étape 3/5' });
    expect(jour.find(r => r.slug === 'mairie')?.detail).toBe('Permis de construire · étape 6/6');
    expect(jour.find(r => r.slug === 'jardins-residence')?.nom).toBe('Résidences des Jardins');
  });
  it('conseille selon les besoins, et ne fait sauter la nuit que le soir', () => {
    expect(conseilsDuMatin({ faim: 30, social: 80, moral: 80 }).map(c => c.slug)).toEqual(['cafe']);
    expect(conseilsDuMatin({ faim: 90, social: 20, moral: 30 }).map(c => c.slug)).toEqual(['sports', 'marina']);
    expect([22, 2, 19, 14, 6.5].map(dormirJusquAuMatin)).toEqual([true, true, true, false, false]);
  });
});
