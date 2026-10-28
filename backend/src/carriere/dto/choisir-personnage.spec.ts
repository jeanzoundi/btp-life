import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChoisirPersonnageDto } from './carriere.dto';

const APPARENCE = { feminin: false, peau: '#5C3A24', coiffure: 'chauve', couleurCheveux: '#1E1715', pilosite: 'barbe', lunettes: false, casque: true, tenue: 'gilet', haut: '#EDAB29', bas: '#243A51' };
// Comme la ValidationPipe (transform) : l'apparence devient une instance validée trait par trait.
const choix = (corps: object) => plainToInstance(ChoisirPersonnageDto, corps);

describe('ChoisirPersonnageDto', () => {
  it('accepte un ancien client sans proportions', async () => {
    expect(await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'jean' }))).toHaveLength(0);
  });
  it('accepte un casque de la palette du créateur, refuse toute autre couleur', async () => {
    expect(await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'combinaison', casque: '#F2C230' }))).toHaveLength(0);
    const erreurs = await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'combinaison', casque: '#FFD700' }));
    expect(erreurs.map(e => e.property)).toEqual(['casque']);
  });
  it('accepte le personnage sur mesure et valide chaque trait de son apparence', async () => {
    expect(await validate(choix({ personnage: 'sur-mesure', apparence: APPARENCE }))).toHaveLength(0);
    const erreurs = await validate(choix({ personnage: 'sur-mesure', apparence: { ...APPARENCE, coiffure: 'crete', haut: 'rouge', pilosite: 'favoris' } }));
    expect(erreurs.map(e => e.property)).toEqual(['apparence']);
    expect(erreurs[0].children?.map(e => e.property).sort()).toEqual(['coiffure', 'haut', 'pilosite']);
  });
  it('rejette les proportions inconnues', async () => {
    const erreurs = await validate(Object.assign(new ChoisirPersonnageDto(), { personnage: 'jean', stature: 999, silhouette: 'inconnue' }));
    expect(erreurs.map(e => e.property).sort()).toEqual(['silhouette', 'stature']);
  });
});
