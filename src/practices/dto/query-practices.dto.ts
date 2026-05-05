import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPracticesDto {
  @IsOptional()
  @IsEnum(['Anxiety Relief', 'Meditation', 'Sleep', 'Emotional health'])
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
