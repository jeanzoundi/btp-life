import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Suppression du compte par son titulaire, même avec une session ouverte : le mot de passe confirme que c'est bien lui ;
 * un compte entré par code reçu par mail, qui n'en a pas, tape SUPPRIMER à la place. */
export class SupprimerCompteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  confirmation?: string;
}
