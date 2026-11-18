import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from './mail.service';

/** Empreinte d'un compte créé par code reçu par mail : il n'a pas de mot de passe, et aucun hachage argon2 ne lui ressemble. */
export const SANS_MOT_DE_PASSE = '!code-mail';
const DUREE_CODE_MS = 10 * 60_000;
const ESSAIS_MAX = 5;
const DELAI_ENTRE_CODES_MS = 60_000;
const CODES_PAR_HEURE = 5;

export function normaliserEmail(email: string) {
  return email.trim().toLowerCase();
}

/** « jean-marc.kouassi07@… » → « Jean Marc Kouassi » : un nom de départ, que le joueur change dans ses paramètres. */
export function nomDepuisEmail(email: string) {
  const mots = email.split('@')[0].split(/[._+\-\d]+/).filter(Boolean)
    .map(m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  return mots.join(' ').slice(0, 40).trim() || 'Joueur';
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  private async signTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_TTL ?? '30d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Un compte existe déjà avec cet email');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nom: dto.nom,
        pseudo: dto.pseudo,
        paysId: dto.paysId,
        ville: dto.ville,
        niveauEtude: dto.niveauEtude,
        domaineBtp: dto.domaineBtp,
        carriere: { create: { referentielPaysId: dto.paysId } },
        cvVirtuel: { create: { contenu: {} } },
      },
    });

    const tokens = await this.signTokens({ sub: user.id, email: user.email, role: user.role });
    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    if (user.passwordHash === SANS_MOT_DE_PASSE) {
      throw new UnauthorizedException('Ce compte n’a pas de mot de passe : entre avec un code reçu par mail.');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');
    if (user.banni) throw new UnauthorizedException('Ce compte a été suspendu');

    const tokens = await this.signTokens({ sub: user.id, email: user.email, role: user.role });
    return { user: this.sanitize(user), ...tokens };
  }

  private empreinteCode(email: string, code: string) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('JWT_ACCESS_SECRET manquant');
    return createHmac('sha256', secret).update(`code-connexion:${email}:${code}`).digest('hex');
  }

  /** Envoie un code à 6 chiffres à cette adresse, qu'elle ait déjà un compte ou non : la réponse est la même, l'écran
   * aussi. Un code par minute et cinq par heure au plus pour une adresse, en plus de la limite par appareil. */
  async demanderCode(emailBrut: string) {
    const email = normaliserEmail(emailBrut);
    const maintenant = Date.now();
    const recents = await this.prisma.codeConnexion.findMany({
      where: { email, creeLe: { gt: new Date(maintenant - 3_600_000) } },
      select: { creeLe: true },
      orderBy: { creeLe: 'desc' },
    });
    if (recents[0] && maintenant - recents[0].creeLe.getTime() < DELAI_ENTRE_CODES_MS) {
      const secondes = Math.ceil((DELAI_ENTRE_CODES_MS - (maintenant - recents[0].creeLe.getTime())) / 1000);
      throw new HttpException(`Un code vient de partir : attends ${secondes} s avant d'en redemander un.`, HttpStatus.TOO_MANY_REQUESTS);
    }
    if (recents.length >= CODES_PAR_HEURE) {
      throw new HttpException('Trop de codes demandés pour cette adresse : réessaie dans une heure.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    // Les codes de plus d'un jour ne servent plus qu'à grossir la table.
    await this.prisma.codeConnexion.deleteMany({ where: { creeLe: { lt: new Date(maintenant - 86_400_000) } } });
    await this.prisma.codeConnexion.create({
      data: { email, empreinte: this.empreinteCode(email, code), expireLe: new Date(maintenant + DUREE_CODE_MS) },
    });

    await this.mail.envoyer({
      a: email,
      sujet: `${code} — ton code BTP Life`,
      texte: `Ton code pour entrer dans BTP Life : ${code}\n\nIl est valable 10 minutes. Si tu n'as rien demandé, ignore ce mail : personne ne peut entrer sans ce code.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#2b2b2b">
  <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#c0573e;font-weight:bold;margin:0">BTP Life</p>
  <h1 style="font-size:20px;margin:12px 0">Ton code pour entrer</h1>
  <p style="font-size:34px;font-weight:bold;letter-spacing:8px;background:#f6efe4;border-radius:12px;padding:16px;text-align:center;margin:16px 0">${code}</p>
  <p style="font-size:14px;line-height:1.5">Il est valable 10 minutes. Si tu n'as rien demandé, ignore ce mail : personne ne peut entrer sans ce code.</p>
</div>`,
    });
    // Sans service de mail, hors production seulement, le code revient à l'écran pour jouer en local.
    return this.mail.modeDeveloppement() ? { envoye: true, codeDeveloppement: code } : { envoye: true };
  }

  /** Vérifie le dernier code envoyé à cette adresse. Juste : connecte le joueur, et crée son compte s'il n'en avait pas
   * (« nouveau » mène alors à la création du personnage). Faux : un essai de moins, cinq au plus par code. */
  async verifierCode(emailBrut: string, code: string) {
    const email = normaliserEmail(emailBrut);
    const dernier = await this.prisma.codeConnexion.findFirst({ where: { email }, orderBy: { creeLe: 'desc' } });
    if (!dernier || dernier.expireLe.getTime() < Date.now()) {
      throw new BadRequestException('Ce code a expiré : demande un nouveau code.');
    }
    if (dernier.essais >= ESSAIS_MAX) {
      throw new BadRequestException('Trop d’essais avec ce code : demande un nouveau code.');
    }
    const attendu = Buffer.from(dernier.empreinte, 'hex');
    const recu = Buffer.from(this.empreinteCode(email, code), 'hex');
    if (attendu.length !== recu.length || !timingSafeEqual(attendu, recu)) {
      await this.prisma.codeConnexion.update({ where: { id: dernier.id }, data: { essais: { increment: 1 } } });
      const restants = ESSAIS_MAX - dernier.essais - 1;
      throw new BadRequestException(restants > 0
        ? `Code incorrect. Encore ${restants} essai${restants > 1 ? 's' : ''}.`
        : 'Code incorrect. Demande un nouveau code.');
    }
    await this.prisma.codeConnexion.deleteMany({ where: { email } });

    // Les comptes plus anciens ont pu garder des majuscules dans l'adresse.
    let user = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    let nouveau = false;
    if (user) {
      if (user.banni) throw new UnauthorizedException('Ce compte a été suspendu');
      if (!user.emailVerified) user = await this.prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    } else {
      try {
        user = await this.prisma.user.create({
          data: {
            email,
            passwordHash: SANS_MOT_DE_PASSE,
            nom: nomDepuisEmail(email),
            emailVerified: true,
            carriere: { create: {} },
            cvVirtuel: { create: { contenu: {} } },
          },
        });
        nouveau = true;
      } catch (erreur) {
        // Deux validations simultanées du même code : la seconde retrouve le compte que la première vient de créer.
        if ((erreur as { code?: string }).code !== 'P2002') throw erreur;
        user = await this.prisma.user.findUniqueOrThrow({ where: { email } });
      }
    }

    const tokens = await this.signTokens({ sub: user.id, email: user.email, role: user.role });
    return { user: this.sanitize(user), nouveau, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      // Un compte banni ne doit pas pouvoir prolonger sa session via le refresh token (valable 30j) —
      // sans ce contrôle, le bannissement ne prend effet qu'à l'expiration du token, pas immédiatement.
      if (user.banni) throw new UnauthorizedException('Ce compte a été suspendu');
      const tokens = await this.signTokens({ sub: user.id, email: user.email, role: user.role });
      return { user: this.sanitize(user), ...tokens };
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { avatar: true, carriere: true, pays: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private sanitize(user: { passwordHash?: string } & Record<string, unknown>) {
    const { passwordHash, ...rest } = user;
    // Les paramètres en ont besoin : un compte entré par code confirme sa suppression autrement que par mot de passe.
    return { ...rest, aMotDePasse: !!passwordHash && passwordHash !== SANS_MOT_DE_PASSE };
  }
}
