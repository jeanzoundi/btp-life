import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsPositive, IsString, Length, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { COIFFURES_SUR_MESURE, COULEURS_CASQUE, PERSONNAGES_JOUEUR, PILOSITES, TENUES_SUR_MESURE } from '../personnages';
import { METEOS_MONDE, type MeteoMonde } from '../besoins.service';

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

const COULEUR = /^#[0-9a-fA-F]{6}$/;

/** L'apparence du personnage sur mesure : chaque trait est validé, les couleurs sont des codes hexadécimaux. */
export class ApparenceSurMesureDto {
  @IsBoolean()
  feminin: boolean;

  @Matches(COULEUR)
  peau: string;

  @IsIn(COIFFURES_SUR_MESURE)
  coiffure: string;

  @Matches(COULEUR)
  couleurCheveux: string;

  @IsIn(PILOSITES)
  pilosite: string;

  @IsBoolean()
  lunettes: boolean;

  @IsBoolean()
  casque: boolean;

  @IsIn(TENUES_SUR_MESURE)
  tenue: string;

  @Matches(COULEUR)
  haut: string;

  @Matches(COULEUR)
  bas: string;
}

/** Choix du personnage au début du monde vivant (ou plus tard) : le nom du personnage peut changer en même temps. */
export class ChoisirPersonnageDto {
  @IsOptional()
  @IsIn(['petite', 'moyenne', 'grande'])
  stature?: string;

  @IsOptional()
  @IsIn(['fine', 'standard', 'large'])
  silhouette?: string;

  /** Couleur du casque, parmi celles du créateur. */
  @IsOptional()
  @IsIn(COULEURS_CASQUE)
  casque?: string;

  @IsIn(PERSONNAGES_JOUEUR)
  personnage: string;

  /** Le réglage du personnage sur mesure (coiffure, barbe, teint, tenue…). */
  @IsOptional()
  @ValidateNested()
  @Type(() => ApparenceSurMesureDto)
  apparence?: ApparenceSurMesureDto;

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

  /** La météo du moment, qui pèse sur les besoins des heures passées debout. */
  @IsOptional()
  @IsIn(METEOS_MONDE)
  meteo?: MeteoMonde;
}

/** Chapitre joué : réponses brutes à corriger côté serveur. */
export class ChapitreCampagneDto {
  @IsInt()
  @Min(0)
  @Max(8)
  chapitre: number;

  @IsObject()
  reponses: Record<string, number | number[]>;
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
