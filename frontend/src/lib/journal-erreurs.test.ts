import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installerRemonteeErreurs, journaliserErreur, lireErreurs, viderErreurs } from './journal-erreurs';

describe('journal-erreurs', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('consigne une erreur avec son message et le chemin courant', () => {
    journaliserErreur(new Error('Boum'));

    const erreurs = lireErreurs();
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].message).toBe('Boum');
    expect(erreurs[0].chemin).toBe(window.location.pathname);
    expect(erreurs[0].horodatage).toBeTruthy();
  });

  it('empile les erreurs les plus récentes en premier', () => {
    journaliserErreur(new Error('Première'));
    journaliserErreur(new Error('Seconde'));

    expect(lireErreurs().map((e) => e.message)).toEqual(['Seconde', 'Première']);
  });

  it('ne conserve que les 10 dernières erreurs', () => {
    for (let i = 0; i < 15; i++) journaliserErreur(new Error(`Erreur ${i}`));

    const erreurs = lireErreurs();
    expect(erreurs).toHaveLength(10);
    expect(erreurs[0].message).toBe('Erreur 14');
  });

  it('renvoie une liste vide plutôt que de planter si le stockage est corrompu', () => {
    localStorage.setItem('btp-life-erreurs', 'ceci n’est pas du JSON');
    expect(lireErreurs()).toEqual([]);
  });

  it('remplace un message vide par un libellé lisible', () => {
    journaliserErreur(new Error(''));
    expect(lireErreurs()[0].message).toBe('Erreur inconnue');
  });

  it('vide le journal sur demande', () => {
    journaliserErreur(new Error('À effacer'));
    viderErreurs();
    expect(lireErreurs()).toEqual([]);
  });
});

describe('remontée des erreurs au serveur', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Module neuf à chaque test : les erreurs déjà envoyées par la page repartent de zéro.
    vi.resetModules();
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  const enProduction = () => {
    vi.stubEnv('NODE_ENV', 'production');
    const envoi = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', envoi);
    return envoi;
  };

  it('en production, remonte chaque erreur une seule fois, sans les paramètres de la page', async () => {
    const envoi = enProduction();
    const journal = await import('./journal-erreurs');
    const erreur = new Error('Boum en production');
    journal.journaliserErreur(erreur);
    journal.journaliserErreur(erreur);
    expect(envoi).toHaveBeenCalledTimes(1);
    const [url, options] = envoi.mock.calls[0];
    expect(url).toMatch(/\/erreurs-client$/);
    expect(options).toMatchObject({ method: 'POST', keepalive: true });
    expect(JSON.parse(options.body)).toMatchObject({ message: 'Boum en production', chemin: window.location.pathname, pile: expect.stringContaining('Boum en production') });
  });

  it('n’en remonte que quelques-unes par page, et rien hors production', async () => {
    const envoi = enProduction();
    const journal = await import('./journal-erreurs');
    for (let i = 0; i < 12; i++) journal.journaliserErreur(new Error(`Erreur en boucle ${i}`));
    expect(envoi).toHaveBeenCalledTimes(journal.ENVOIS_PAR_PAGE);
    vi.stubEnv('NODE_ENV', 'test');
    vi.resetModules();
    (await import('./journal-erreurs')).journaliserErreur(new Error('En développement'));
    expect(envoi).toHaveBeenCalledTimes(journal.ENVOIS_PAR_PAGE);
  });

  it('ignore les bruits sans rapport avec le jeu', async () => {
    const envoi = enProduction();
    const journal = await import('./journal-erreurs');
    journal.journaliserErreur(new Error('ResizeObserver loop completed with undelivered notifications.'));
    journal.journaliserErreur(new Error('Failed to fetch'));
    const extension = new Error('boum');
    extension.stack = 'Error: boum\n    at x (chrome-extension://abcdef/content.js:1:1)';
    journal.journaliserErreur(extension);
    expect(envoi).not.toHaveBeenCalled();
    expect(journal.lireErreurs()).toEqual([]);
  });
});

describe('erreurs hors des limites React', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('consigne les erreurs non rattrapées et les promesses rejetées, pas les refus de l’API', () => {
    const retirer = installerRemonteeErreurs();
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('Boucle 3D'), message: 'Boucle 3D' }));
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: new Error('Promesse perdue') }));
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: { status: 401, message: 'Session expirée' } }));
    expect(lireErreurs().map((e) => e.message)).toEqual(['Promesse perdue', 'Boucle 3D']);
    retirer();
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: new Error('Après') }));
    expect(lireErreurs()).toHaveLength(2);
  });
});
