import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsObject, IsOptional, IsPositive, IsString, Max } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  nomPersonnage: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  tenue?: string;

  @IsOptional()
  @IsString()
  equipement?: string;

  @IsOptional()
  @IsString()
  metierRepresente?: string;

  // Personnalisation visuelle libre (peau, casque, tenue, accessoire, fond…)
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class SetProfilActuelDto {
  @IsString()
  profilId: string;
}

export class SetMetierCibleDto {
  @IsString()
  metierCibleId: string;
}

export class SetTraitsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  traits: string[];
}

export class MontantDto {
  @IsInt()
  @IsPositive()
  @Max(10_000_000)
  montant: number;
}
