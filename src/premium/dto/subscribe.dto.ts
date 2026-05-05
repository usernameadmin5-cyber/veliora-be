import { IsEnum } from 'class-validator';

export class SubscribeDto {
  @IsEnum(['monthly', 'yearly'])
  plan: string;
}
