import { IsString } from 'class-validator';

export class UpsertResetDto {
  @IsString() en: string;
  @IsString() uk: string;
}
