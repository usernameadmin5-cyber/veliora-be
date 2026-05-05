import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

const EMOTIONS = [
  'Calm',
  'Anxious',
  'Tired',
  'Motivated',
  'Overwhelmed',
  'Neutral',
] as const;
const SLEEP = ['Poor', 'Okay', 'Good'] as const;

export class UpsertSurveyDto {
  @IsInt() @Min(1) @Max(10) stress: number;

  @IsIn(EMOTIONS) emotion: string;

  @IsIn(SLEEP) sleepQuality: string;

  @IsInt() @Min(1) @Max(10) activity: number;

  @IsOptional() @IsDateString() submittedAt?: string;
}
