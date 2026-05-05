import { IsEnum, IsInt, Max, Min } from 'class-validator';

export class SubmitSurveyDto {
  @IsInt()
  @Min(1)
  @Max(10)
  stress: number;

  @IsEnum(['Calm', 'Anxious', 'Tired', 'Motivated', 'Overwhelmed', 'Neutral'])
  emotion: string;

  @IsEnum(['Poor', 'Okay', 'Good'])
  sleepQuality: string;

  @IsInt()
  @Min(1)
  @Max(10)
  activity: number;
}
