import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'sofia@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'newSecret456' })
  @IsString()
  @MinLength(8)
  @Matches(/\d/, { message: 'newPassword must contain at least one number' })
  newPassword: string;

  @ApiProperty({ example: 'newSecret456' })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
