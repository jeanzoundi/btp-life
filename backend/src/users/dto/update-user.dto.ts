import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  pseudo?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  niveauEtude?: string;

  @IsOptional()
  @IsString()
  domaineBtp?: string;

  @IsOptional()
  @IsString()
  paysId?: string;
}
