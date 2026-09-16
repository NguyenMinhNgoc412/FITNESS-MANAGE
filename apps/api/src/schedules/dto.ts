import { ScheduleStatus, WindowType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
export class CreateScheduleDto {
  @IsString() memberId!: string;
  @IsString() ptId!: string;
  @IsEnum(WindowType) windowType!: WindowType;
  @IsDateString() windowStart!: string;
  @IsDateString() windowEnd!: string;
}
export class UpdateScheduleDto {
  @IsOptional() @IsEnum(WindowType) windowType?: WindowType;
  @IsOptional() @IsDateString() windowStart?: string;
  @IsOptional() @IsDateString() windowEnd?: string;
  @IsOptional() @IsEnum(ScheduleStatus) status?: ScheduleStatus;
}
