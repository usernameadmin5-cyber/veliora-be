import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsEnum(['en', 'uk'])
  language?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(['Breathing', 'Meditation', 'Affirmations', 'Focus', 'Sleep'], {
    each: true,
  })
  practicePreferences?: string[];
}
