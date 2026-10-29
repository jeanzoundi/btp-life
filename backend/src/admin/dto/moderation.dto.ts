import { IsIn } from 'class-validator';

/** Ce que la modération décide pour un message signalé. */
export const DECISIONS_MODERATION = ['retirer', 'bannir', 'ecarter'] as const;
export type DecisionModeration = (typeof DECISIONS_MODERATION)[number];

export class DecisionModerationDto {
  @IsIn(DECISIONS_MODERATION)
  decision: DecisionModeration;
}
