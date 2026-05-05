import { IsMongoId } from 'class-validator';

export class StartPracticeDto {
  @IsMongoId()
  practiceId: string;
}
