import { validate } from 'class-validator';
import { ChapitreCampagneDto } from './carriere.dto';
import { CAMPAGNE } from '../campagne.service';

const erreurs = async (chapitre: number) => (await validate(Object.assign(new ChapitreCampagneDto(), { chapitre, reponses: {} }))).map(e => e.property);

describe('ChapitreCampagneDto', () => {
  it('accepte les chapitres joués après la livraison, jusqu’au dernier, et rien au-delà', async () => {
    expect(await erreurs(0)).toEqual([]);
    // L'année de garantie, premier chapitre après la réception (index 9) : l'ancienne borne l'aurait refusé.
    expect(await erreurs(9)).toEqual([]);
    expect(await erreurs(CAMPAGNE.chapitres - 1)).toEqual([]);
    for (const chapitre of [-1, CAMPAGNE.chapitres, 2.5]) expect(await erreurs(chapitre)).toEqual(['chapitre']);
  });
});
