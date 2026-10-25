import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsPositive, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { PERSONNAGES_JOUEUR } from '../personnages';

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

export class EquiperItemAvatarDto {
  @IsString()
  itemId: string;
}

/** Choix du personnage au début du monde vivant (ou plus tard) : le nom du personnage peut changer en même temps. */
export class ChoisirPersonnageDto {
  @IsOptional()
  @IsIn(['petite', 'moyenne', 'grande'])
  stature?: string;

  @IsOptional()
  @IsIn(['fine', 'standard', 'large'])
  silhouette?: string;

  @IsIn(PERSONNAGES_JOUEUR)
  personnage: string;

  @IsOptional()
  @IsString()
  @Length(2, 24)
  nomPersonnage?: string;
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

export class DevenirEntrepreneurDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  nomEntreprise?: string;
}

export class NomEntrepriseDto {
  @IsString()
  @MaxLength(60)
  nom: string;
}

export class UpdateEtatMondeDto {
  @IsObject()
  etat: Record<string, unknown>;
}

/** Action de besoin, éventuellement un article de la carte d'un lieu de vie (maquis, café). Sans corps : l'action historique. */
export class ActionBesoinDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  article?: string;

  /** Au maquis : manger à la table des collègues. */
  @IsOptional()
  @IsBoolean()
  tablee?: boolean;

  /** Au marché : la remise obtenue en marchandant (plafonnée par le serveur). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  remise?: number;

  /** Au complexe sportif : le match a été gagné aux tirs au but. */
  @IsOptional()
  @IsBoolean()
  victoire?: boolean;
}

/** Heures de jeu passées dans le monde vivant depuis la dernière déclaration (bornées à une journée). */
export class TempsMondeDto {
  @IsNumber()
  @Min(0)
  @Max(24)
  heures: number;

  /** Ces heures ont été dormies : l'énergie ne baisse pas, le reste deux fois moins vite. */
  @IsOptional()
  @IsBoolean()
  sommeil?: boolean;
}

/** Séance terminée dans un lieu du quartier : l'étape jouée et la note du bilan (0-100). */
export class SeanceLieuDto {
  @IsInt()
  @Min(0)
  @Max(30)
  etape: number;

  @IsInt()
  @Min(0)
  @Max(100)
  note: number;
}
