import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class OptionQuestionDto {
  @IsString()
  id: string;

  @IsString()
  label: string;
}

export class QuestionGenereeDto {
  @IsString()
  enonce: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => OptionQuestionDto)
  options: OptionQuestionDto[];

  @IsString()
  bonneReponse: string;

  @IsString()
  correctionPedagogique: string;
}

export class ExerciceGenereDto {
  @IsString()
  titre: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => QuestionGenereeDto)
  questions: QuestionGenereeDto[];
}

export class BlocGenereDto {
  @IsIn(['texte', 'exemple', 'astuce', 'attention', 'retenir', 'objectifs'])
  type: 'texte' | 'exemple' | 'astuce' | 'attention' | 'retenir' | 'objectifs';

  @IsString()
  valeur: string;
}

export class ChapitreGenereDto {
  @IsString()
  titre: string;

  @IsInt()
  @Min(1)
  @Max(120)
  dureeMin: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BlocGenereDto)
  blocs: BlocGenereDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ExerciceGenereDto)
  exercice?: ExerciceGenereDto;
}

export class PublierModuleDto {
  @IsString()
  titre: string;

  @IsString()
  domaine: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChapitreGenereDto)
  chapitres: ChapitreGenereDto[];

  @IsOptional()
  @IsBoolean()
  publie?: boolean;
}
