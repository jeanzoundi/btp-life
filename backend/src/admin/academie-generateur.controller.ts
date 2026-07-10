import { BadRequestException, Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { AcademieGenerateurService } from './academie-generateur.service';
import { PublierModuleDto } from './dto/academie-generateur.dto';

const TAILLE_MAX_OCTETS = 8 * 1024 * 1024; // 8 Mo

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/academie-generateur')
export class AcademieGenerateurController {
  constructor(private readonly generateur: AcademieGenerateurService) {}

  @Post('analyser')
  @UseInterceptors(FileInterceptor('fichier', { limits: { fileSize: TAILLE_MAX_OCTETS } }))
  async analyser(@UploadedFile() fichier?: Express.Multer.File) {
    if (!fichier) throw new BadRequestException('Aucun fichier reçu');
    const texte = await this.generateur.extraireTexte(fichier.buffer, fichier.mimetype, fichier.originalname);
    return this.generateur.analyser(texte, fichier.originalname);
  }

  @Post('publier')
  publier(@CurrentUser() user: RequestUser, @Body() dto: PublierModuleDto) {
    return this.generateur.publier(user.userId, dto);
  }
}
