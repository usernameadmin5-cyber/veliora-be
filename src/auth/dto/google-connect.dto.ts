import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleConnectDto {
  @ApiProperty({ description: 'Google ID token from popup' })
  @IsString()
  @IsNotEmpty()
  googleToken: string;
}
