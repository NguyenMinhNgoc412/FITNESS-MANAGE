import { AccountStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
export class CreateMemberDto {
  @IsString() fullName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() goal!: string;
  @IsString() ptId!: string;
  @IsOptional() @IsString() phone?: string;
}
export class UpdateMemberDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsEnum(AccountStatus) status?: AccountStatus;
}
export class ChangePtDto {
  @IsString() newPtId!: string;
  @IsString() @MinLength(8) idempotencyKey!: string;
  @IsOptional() @IsString() reason?: string;
}
