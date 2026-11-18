import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { DemanderCodeDto, VerifierCodeDto } from './dto/code-connexion.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Limites serrées sur les points sensibles : freine le brute-force de mots de passe et la création
  // de comptes en masse, sans gêner un usage humain normal.
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Entrer par code reçu par mail, sans mot de passe : un seul écran pour s'inscrire et se connecter.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(200)
  @Post('code')
  demanderCode(@Body() dto: DemanderCodeDto) {
    return this.authService.demanderCode(dto.email);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(200)
  @Post('code/verifier')
  verifierCode(@Body() dto: VerifierCodeDto) {
    return this.authService.verifierCode(dto.email, dto.code);
  }

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.userId);
  }
}
