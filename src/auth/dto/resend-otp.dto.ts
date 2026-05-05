import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({ example: 'sofia@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['signup', 'forgot-password'] })
  @IsEnum(['signup', 'forgot-password'])
  context: 'signup' | 'forgot-password';
}
