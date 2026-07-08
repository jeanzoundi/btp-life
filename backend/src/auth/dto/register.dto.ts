import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  pseudo?: string;

  @IsOptional()
  @IsString()
  paysId?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  niveauEtude?: string;

  @IsOptional()
  @IsString()
  domaineBtp?: string;
}
