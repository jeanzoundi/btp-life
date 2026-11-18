import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export interface MessageMail {
  a: string;
  sujet: string;
  texte: string;
  html: string;
}

/** Le service d'envoi choisi par la configuration : Brevo (BREVO_API_KEY) ou Resend (RESEND_API_KEY). */
export function fournisseurMail(env: NodeJS.ProcessEnv = process.env): 'brevo' | 'resend' | null {
  if (env.BREVO_API_KEY) return 'brevo';
  if (env.RESEND_API_KEY) return 'resend';
  return null;
}

/** « BTP Life <no-reply@btplife.com> » → nom et adresse ; une adresse seule garde le nom du jeu. */
export function expediteur(valeur = process.env.MAIL_EXPEDITEUR ?? '') {
  const m = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/.exec(valeur);
  if (m) return { nom: m[1] || 'BTP Life', email: m[2] };
  return { nom: 'BTP Life', email: valeur.trim() };
}

/** Envoi des mails du jeu (aujourd'hui, les codes de connexion), par l'API HTTP du service configuré : aucune dépendance
 * de plus, et rien à garder ouvert entre deux appels sur Vercel. Sans service configuré, hors production, le mail est
 * écrit dans le journal du serveur pour qu'on puisse jouer en local ; en production, l'envoi est refusé clairement. */
@Injectable()
export class MailService {
  private readonly journal = new Logger('Mail');

  /** Vrai quand aucun service n'est configuré hors production : le code s'affiche alors à l'écran pour tester. */
  modeDeveloppement() {
    return !fournisseurMail() && process.env.NODE_ENV !== 'production';
  }

  async envoyer(message: MessageMail) {
    const fournisseur = fournisseurMail();
    if (!fournisseur) {
      if (process.env.NODE_ENV === 'production') {
        this.journal.error('Aucun service de mail configuré (BREVO_API_KEY ou RESEND_API_KEY).');
        throw new ServiceUnavailableException("L'envoi des mails n'est pas encore en service. Réessaie plus tard.");
      }
      this.journal.log(`[développement] Mail à ${message.a} — ${message.sujet}\n${message.texte}`);
      return;
    }
    const de = expediteur();
    if (!de.email) throw new ServiceUnavailableException("L'envoi des mails n'est pas encore en service. Réessaie plus tard.");

    const requete: { url: string; entetes: Record<string, string>; corps: object } = fournisseur === 'brevo'
      ? {
          url: 'https://api.brevo.com/v3/smtp/email',
          entetes: { 'api-key': process.env.BREVO_API_KEY as string },
          corps: { sender: { name: de.nom, email: de.email }, to: [{ email: message.a }], subject: message.sujet, textContent: message.texte, htmlContent: message.html },
        }
      : {
          url: 'https://api.resend.com/emails',
          entetes: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          corps: { from: `${de.nom} <${de.email}>`, to: [message.a], subject: message.sujet, text: message.texte, html: message.html },
        };

    let reponse: Response;
    try {
      reponse = await fetch(requete.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...requete.entetes },
        body: JSON.stringify(requete.corps),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (erreur) {
      this.journal.error(`Envoi ${fournisseur} impossible : ${(erreur as Error).message}`);
      throw new ServiceUnavailableException("Le mail n'a pas pu partir. Réessaie dans un instant.");
    }
    if (!reponse.ok) {
      this.journal.error(`Envoi ${fournisseur} refusé (${reponse.status}) : ${(await reponse.text()).slice(0, 300)}`);
      throw new ServiceUnavailableException("Le mail n'a pas pu partir. Réessaie dans un instant.");
    }
  }
}
