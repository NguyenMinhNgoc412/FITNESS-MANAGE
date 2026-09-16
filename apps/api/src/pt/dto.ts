import { AccountStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
export class CreatePtDto {
  @IsString() fullName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsString() note?: string;
}
export class UpdatePtDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsEnum(AccountStatus) status?: AccountStatus;
}
