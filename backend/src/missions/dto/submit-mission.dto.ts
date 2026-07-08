import { IsObject, IsOptional, IsInt, Min } from 'class-validator';

export class SubmitMissionDto {
  // Map: contenuId -> réponse (string | string[] | number selon typeQuestion)
  @IsObject()
  reponses: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  tempsUtiliseSec?: number;
}
