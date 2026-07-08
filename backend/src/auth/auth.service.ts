import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');
    if (user.banni) throw new UnauthorizedException('Ce compte a été suspendu');

    const tokens = await this.signTokens({ sub: user.id, email: user.email, role: user.role });
    return { user: this.sanitize(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
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
    return rest;
  }
}
