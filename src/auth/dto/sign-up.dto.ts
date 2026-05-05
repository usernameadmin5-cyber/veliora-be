import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'Sofia' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'sofia@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mySecret123' })
  @IsString()
  @MinLength(8)
  @Matches(/\d/, { message: 'password must contain at least one number' })
  password: string;
}
