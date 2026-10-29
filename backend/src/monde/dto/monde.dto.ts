import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { NIVEAUX_LOGEMENT, RENOVATIONS, type NiveauLogement } from '../../carriere/patrimoine';
import { POSTES, type PosteEntreprise } from '../entreprise.service';
import { MODES_PAYES, type ModePaye } from '../transport.service';
import { EMOTES, REGLES_EN_LIGNE, type Emote } from '../en-ligne.service';
import { MOTIFS_SIGNALEMENT, type MotifSignalement } from '../moderation';

/** Une course payée depuis le téléphone : le mode, la distance par les rues (mètres du jeu) et la pluie du moment. */
export class TransportDto {
  @IsIn(MODES_PAYES)
  mode: ModePaye;

  @IsNumber()
  @Min(0)
  @Max(2000)
  distance: number;

  @IsOptional()
  @IsBoolean()
  pluie?: boolean;
}

/** La décision prise face à l'imprévu du jour : l'option choisie. */
export class DecisionImprevuDto {
  @IsInt()
  @Min(0)
  @Max(9)
  option: number;
}

/** Déménager vers un autre logement. */
export class DemenagementDto {
  @IsIn(NIVEAUX_LOGEMENT)
  niveau: NiveauLogement;
}

/** Acheter un outil du catalogue. */
export class AchatOutilDto {
  @IsString()
  @MaxLength(40)
  outil: string;
}

/** Créer son entreprise : son nom et l'apport en capital. */
export class CreationEntrepriseDto {
  @IsString()
  @MaxLength(60)
  nom: string;

  @IsInt()
  @Min(1)
  @Max(100_000_000)
  apport: number;
}

/** Apport (positif) ou dividende (négatif) entre le compte du joueur et le capital de son entreprise. */
export class MouvementEntrepriseDto {
  @IsInt()
  @Min(-100_000_000)
  @Max(100_000_000)
  montant: number;
}

export class EmbaucheDto {
  @IsIn(POSTES)
  poste: PosteEntreprise;
}

export class LicenciementDto {
  @IsInt()
  @Min(0)
  @Max(50)
  rang: number;
}

/** La position signalée au monde en ligne, l'intérieur visité et une émote éventuelle. */
export class PresenceDto {
  @IsNumber()
  @Min(-500)
  @Max(500)
  x: number;

  @IsNumber()
  @Min(-500)
  @Max(500)
  z: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  lieu?: string;

  @IsOptional()
  @IsIn(EMOTES)
  emote?: Emote;
}

/** Un message du chat du quartier (nettoyé et vérifié par le service). */
export class MessageQuartierDto {
  @IsString()
  @MaxLength(REGLES_EN_LIGNE.longueurMessage * 2)
  texte: string;
}

/** Un message du chat signalé à la modération, et pourquoi. */
export class SignalementMessageDto {
  @IsIn(MOTIFS_SIGNALEMENT)
  motif: MotifSignalement;
}

/** Des travaux à lancer chez soi. */
export class RenovationDto {
  @IsIn(Object.keys(RENOVATIONS))
  slug: string;
}

/** La réponse au métré des travaux. */
export class MetreDto {
  @IsNumber()
  @Min(0)
  @Max(100_000)
  reponse: number;
}

/** Inviter un voisin connecté dans son équipe. */
export class InvitationEquipeDto {
  @IsString()
  @MaxLength(40)
  userId: string;
}

/** Répondre à une invitation d'équipe. */
export class ReponseEquipeDto {
  @IsString()
  @MaxLength(40)
  invitationId: string;

  @IsBoolean()
  accepter: boolean;
}
