import { validate } from 'class-validator';
import { ChoisirPersonnageDto } from './carriere.dto';

describe('ChoisirPersonnageDto', () => {
  it('accepte un ancien client sans proportions', async () => {
    expect(await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'jean' }))).toHaveLength(0);
  });
  it('accepte un casque de la palette du créateur, refuse toute autre couleur', async () => {
    expect(await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'combinaison', casque: '#F2C230' }))).toHaveLength(0);
    const erreurs = await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'combinaison', casque: '#FFD700' }));
    expect(erreurs.map(e => e.property)).toEqual(['casque']);
  });
  it('rejette les proportions inconnues', async () => {
    const erreurs = await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'jean', stature: 999, silhouette: 'inconnue' }));
    expect(erreurs.map(e => e.property).sort()).toEqual(['silhouette', 'stature']);
  });
});
