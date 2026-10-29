import { modererMessage } from './moderation';

const modere = (texte: string) => modererMessage(texte).texte;

describe('modererMessage', () => {
  it('laisse passer une conversation ordinaire, chiffres et unités compris', () => {
    for (const texte of [
      'Salut le quartier',
      'Il reste 2 500 000 F au budget et 3,5 m³ de béton au dépôt',
      'Bonne chance pour le concours ; conseil : révise la construction des semelles',
      'Le cône d’Abrams donne 7,5 cm d’affaissement',
      'Ce chien de garde dort devant la guérite',
      'Rendez-vous à 14 h, il y a du ciment',
    ]) expect(modererMessage(texte)).toEqual({ texte, modere: false });
  });

  it('masque les insultes, même déguisées', () => {
    expect(modererMessage('T’es un connard')).toEqual({ texte: 'T’es un *******', modere: true });
    expect(modere('Espèce de bâtard')).toBe('Espèce de ******');
    expect(modere('c0nnard, CONNNNARD, s@lope, Enculé')).toBe('*******, *********, ******, ******');
    expect(modere('c o n n a r d')).toBe('* * * * * * *');
    expect(modere('p.u.t.e')).toBe('*.*.*.*');
    expect(modere('𝐜𝐨𝐧𝐧𝐚𝐫𝐝')).toBe('*******');
    expect(modere('Ferme ta gueule')).toBe('Ferme ** ******');
    expect(modere('sale chien')).toBe('**** *****');
  });

  it('épargne les termes du métier qui ressemblent à une insulte', () => {
    for (const texte of ['Il faut un mortier bâtard pour l’enduit', 'Mets ta salopette et descends au batardeau', 'Un enduit bâtard, chaux et ciment']) {
      expect(modererMessage(texte)).toEqual({ texte, modere: false });
    }
  });

  it('retire les numéros de téléphone', () => {
    expect(modererMessage('Appelle-moi au 07 08 09 10 11')).toEqual({ texte: 'Appelle-moi au [numéro masqué]', modere: true });
    expect(modere('WhatsApp +225 0708091011 ce soir')).toBe('WhatsApp [numéro masqué] ce soir');
    expect(modere('Mon numéro : 07.08.09.10.11')).toBe('Mon numéro : [numéro masqué]');
  });
});
