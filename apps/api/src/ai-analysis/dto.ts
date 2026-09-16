import { IsIn, IsInt, IsString, Min, MinLength } from 'class-validator';
export class CreateUploadIntentDto {
  @IsIn(['video/mp4', 'video/webm', 'video/quicktime']) mimeType!: string;
  @IsInt() @Min(1) sizeBytes!: number;
  @IsString() @MinLength(8) idempotencyKey!: string;
}
