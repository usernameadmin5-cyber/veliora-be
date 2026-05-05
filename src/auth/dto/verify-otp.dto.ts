import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'sofia@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '482910' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ enum: ['signup', 'forgot-password'] })
  @IsEnum(['signup', 'forgot-password'])
  context: 'signup' | 'forgot-password';
}
