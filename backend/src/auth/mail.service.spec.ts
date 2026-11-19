import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { expediteur, fournisseurMail, MailService } from './mail.service';

describe('MailService', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  const message = { a: 'joueur@example.com', sujet: 'Code de test', texte: '123456', html: '<p>123456</p>' };
  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production', BREVO_API_KEY: '', RESEND_API_KEY: '', MAIL_EXPEDITEUR: 'BTP Life <jeu@example.com>' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201 });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => { process.env = originalEnv; global.fetch = originalFetch; jest.restoreAllMocks(); });

  it('transmet le code à Brevo avec la clé serveur et le bon expéditeur', async () => {
    process.env.BREVO_API_KEY = ' cle-brevo-test ';
    await new MailService().envoyer(message);
    expect(global.fetch).toHaveBeenCalledWith('https://api.brevo.com/v3/smtp/email', expect.objectContaining({
      method: 'POST', headers: expect.objectContaining({ 'api-key': 'cle-brevo-test' }),
    }));
    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(options.body)).toEqual({ sender: { name: 'BTP Life', email: 'jeu@example.com' },
      to: [{ email: message.a }], subject: message.sujet, textContent: message.texte, htmlContent: message.html });
  });

  it('refuse tout envoi et code de développement en production sans clé', async () => {
    process.env.BREVO_API_KEY = '   ';
    const service = new MailService();
    expect(service.modeDeveloppement()).toBe(false);
    await expect(service.envoyer(message)).rejects.toThrow(ServiceUnavailableException);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuse un expéditeur absent', async () => {
    process.env.BREVO_API_KEY = 'test'; process.env.MAIL_EXPEDITEUR = '';
    await expect(new MailService().envoyer(message)).rejects.toThrow(ServiceUnavailableException);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('ne révèle jamais un code sur Vercel même sans NODE_ENV', async () => {
    delete process.env.NODE_ENV;
    process.env.VERCEL = '1';
    const service = new MailService();
    expect(service.modeDeveloppement()).toBe(false);
    await expect(service.envoyer(message)).rejects.toThrow(ServiceUnavailableException);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('masque les informations sensibles des refus Brevo', async () => {
    process.env.BREVO_API_KEY = 'test';
    const text = jest.fn().mockResolvedValue('secret 123456 joueur@example.com');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401, text });
    await expect(new MailService().envoyer(message)).rejects.toThrow(ServiceUnavailableException);
    expect(text).not.toHaveBeenCalled();
    expect(Logger.prototype.error).toHaveBeenCalledWith('Envoi brevo refusé (401).');
  });

  it('renvoie une erreur maîtrisée quand le réseau échoue', async () => {
    process.env.BREVO_API_KEY = 'test';
    (global.fetch as jest.Mock).mockRejectedValue(new Error('timeout secret'));
    await expect(new MailService().envoyer(message)).rejects.toThrow(ServiceUnavailableException);
    expect(Logger.prototype.error).not.toHaveBeenCalledWith(expect.stringContaining('secret'));
  });

  it('garde Resend en alternative et accepte une adresse simple', () => {
    expect(fournisseurMail({ RESEND_API_KEY: 'test' })).toBe('resend');
    expect(fournisseurMail({ BREVO_API_KEY: 'test', RESEND_API_KEY: 'test' })).toBe('brevo');
    expect(expediteur('jeu@example.com')).toEqual({ nom: 'BTP Life', email: 'jeu@example.com' });
  });
});
