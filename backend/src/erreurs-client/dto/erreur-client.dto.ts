import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Une erreur vue dans le navigateur d'un joueur. Les bornes sont larges : le service tronque ce qu'il garde. */
export class ErreurClientDto {
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(16000)
  pile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  chemin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  version?: string;
}
