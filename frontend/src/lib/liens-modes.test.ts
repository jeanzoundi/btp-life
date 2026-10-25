import { describe, expect, it } from 'vitest';
import { adresseMonde, lieuDuMonde, LIEUX_MONDE, pageClassique } from './liens-modes';
import { LIEUX_PROGRAMME } from './lieux-programme';

describe('les liens entre le monde vivant et le mode classique', () => {
  it('ouvre la page classique d’un lieu, et l’accueil pour un lieu inconnu', () => {
    expect(pageClassique('banque')).toBe('/app/lieu/banque');
    expect(pageClassique('agence')).toBe('/app/offres');
    expect(pageClassique('inconnu')).toBe('/app');
    expect(pageClassique(null)).toBe('/app');
  });
  it('retrouve le lieu du quartier d’une page classique, sous-pages comprises', () => {
    expect(lieuDuMonde('/app/offres')).toBe('agence');
    expect(lieuDuMonde('/app/lieu/banque')).toBe('banque');
    expect(lieuDuMonde('/app/chantiers/abc123?onglet=journal')).toBe('chantier');
    expect(lieuDuMonde('/app/academie/')).toBe('universite');
    expect(lieuDuMonde('/app/profil')).toBeNull();
    expect(lieuDuMonde('/app')).toBeNull();
  });
  it('fait l’aller-retour : la page d’un lieu ramène à un lieu qui partage cette page', () => {
    for (const slug of Object.keys(LIEUX_MONDE)) {
      const page = pageClassique(slug), retour = lieuDuMonde(page);
      expect(retour, slug).not.toBeNull();
      expect(pageClassique(retour), slug).toBe(page);
    }
  });
  it('chaque lieu à programme a sa page classique et son adresse dans le monde', () => {
    for (const slug of Object.keys(LIEUX_PROGRAMME)) {
      expect(LIEUX_MONDE[slug], slug).toBeDefined();
      expect(adresseMonde(slug)).toBe(`/app/monde?lieu=${slug}`);
    }
    expect(adresseMonde('inconnu')).toBe('/app/monde');
    expect(adresseMonde()).toBe('/app/monde');
  });
});
