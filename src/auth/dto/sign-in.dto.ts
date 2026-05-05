import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ example: 'sofia@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mySecret123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
