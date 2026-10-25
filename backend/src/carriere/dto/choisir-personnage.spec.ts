import { validate } from 'class-validator';
import { ChoisirPersonnageDto } from './carriere.dto';

describe('ChoisirPersonnageDto', () => {
  it('accepte un ancien client sans proportions', async () => {
    expect(await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'jean' }))).toHaveLength(0);
  });
  it('rejette les proportions inconnues', async () => {
    const erreurs = await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'jean', stature: 999, silhouette: 'inconnue' }));
    expect(erreurs.map(e => e.property).sort()).toEqual(['silhouette', 'stature']);
  });
});
