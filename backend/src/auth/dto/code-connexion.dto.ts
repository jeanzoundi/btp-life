import { IsEmail, Matches, MaxLength } from 'class-validator';

/** Recevoir un code par mail : la seule chose à donner pour s'inscrire ou se connecter. */
export class DemanderCodeDto {
  @IsEmail({}, { message: 'Cette adresse mail ne semble pas valide.' })
  @MaxLength(254)
  email: string;
}

export class VerifierCodeDto {
  @IsEmail({}, { message: 'Cette adresse mail ne semble pas valide.' })
  @MaxLength(254)
  email: string;

  @Matches(/^\d{6}$/, { message: 'Le code fait 6 chiffres.' })
  code: string;
}
