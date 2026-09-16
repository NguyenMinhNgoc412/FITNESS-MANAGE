import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
export class CreateGuestDto {
  @IsString() displayName!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsDateString() trialAt?: string;
}
export class ConvertGuestDto {
  @IsString() fullName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() goal!: string;
  @IsString() ptId!: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() @MinLength(8) idempotencyKey!: string;
}
