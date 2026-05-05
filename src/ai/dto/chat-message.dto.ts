import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsMongoId()
  conversationId?: string;
}
