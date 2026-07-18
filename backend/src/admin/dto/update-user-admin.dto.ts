import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

// Liste blanche stricte des champs qu'un admin peut modifier sur un compte. Sans DTO validé, le
// corps de requête brut était passé tel quel à Prisma (`data: body`), ce qui permettait d'écrire
// n'importe quel champ du modèle User — y compris passwordHash, email ou emailVerified.
export class UpdateUserAdminDto {
  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: string;

  @IsOptional()
  @IsString()
  adminSubRole?: string | null;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsBoolean()
  banni?: boolean;
}
