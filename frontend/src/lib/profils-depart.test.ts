import { describe, expect, it } from 'vitest';
import { NIVEAU_DEPART_MAX, primeInstallation, profilsPourPorte, type ProfilCatalogue } from './profils-depart';

const profil = (slug: string, niveauDepart?: number): ProfilCatalogue => ({ id: slug, slug, nom: slug, famille: 'CHANTIER', description: null, niveauDepart });

describe('les postes proposés à la création', () => {
  it('écarte les échelons experts, qui se gagnent par promotion, avec ou sans porte choisie', () => {
    const catalogue = [profil('chef-equipe', 4), profil('conducteur-travaux', NIVEAU_DEPART_MAX), profil('chef-projet-structure', 24), profil('directeur-travaux', 28)];
    expect(profilsPourPorte(catalogue, 'encadrant').map(p => p.slug)).toEqual(['chef-equipe', 'conducteur-travaux']);
    expect(profilsPourPorte(catalogue, null).map(p => p.slug)).toEqual(['chef-equipe', 'conducteur-travaux']);
  });
  it('garde les profils dont le catalogue ne donne pas le niveau de départ', () => {
    expect(profilsPourPorte([profil('etudiant-chantier')], 'etudiant')).toHaveLength(1);
  });
});

describe('la prime d’installation', () => {
  it('suit le barème du serveur : modeste pour un étudiant, plus forte avec l’expérience', () => {
    expect([
      primeInstallation(profil('etudiant-bim', 1)), primeInstallation(profil('stagiaire-chantier', 2)), primeInstallation(profil('aide-topographe', 1)),
      primeInstallation(profil('projeteur', 4)), primeInstallation(profil('conducteur-travaux', 9)), primeInstallation({ slug: '' }),
    ]).toEqual([15_000, 15_000, 25_000, 40_000, 60_000, 25_000]);
  });
});
