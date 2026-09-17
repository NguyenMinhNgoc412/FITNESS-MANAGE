import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskOwnerAssistantDto {
  @IsString() @MinLength(2) @MaxLength(500) question!: string;
}
