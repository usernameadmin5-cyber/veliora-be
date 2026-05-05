import { IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordDto {
  @ApiProperty({ example: 'newSecret456' })
  @IsString()
  @MinLength(8)
  @Matches(/\d/, { message: 'password must contain at least one number' })
  password: string;

  @ApiProperty({ example: 'newSecret456' })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
