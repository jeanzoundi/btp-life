import { Type } from 'class-transformer';
import { IsObject, IsString, ValidateNested } from 'class-validator';

export class PushSubscriptionKeysDto {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

export class SubscribePushDto {
  @IsString()
  endpoint: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto;
}

export class UnsubscribePushDto {
  @IsString()
  endpoint: string;
}
