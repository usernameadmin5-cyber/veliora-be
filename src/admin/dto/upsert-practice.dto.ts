import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpsertPracticeDto {
  @IsString() title: string;
  @IsString() titleUk: string;
  @IsNumber() @Min(1) durationMin: number;
  @IsEnum(['Anxiety Relief', 'Meditation', 'Sleep', 'Emotional health'])
  category: string;
  @IsOptional() @IsString() thumbnailUrl?: string | null;
  @IsOptional() @IsString() videoUrl?: string | null;
  @IsString() gradient: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
