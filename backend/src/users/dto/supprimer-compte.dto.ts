import { IsString, MaxLength } from 'class-validator';

/** Suppression du compte par son titulaire : le mot de passe confirme que c'est bien lui, même avec une session ouverte. */
export class SupprimerCompteDto {
  @IsString()
  @MaxLength(200)
  password: string;
}
