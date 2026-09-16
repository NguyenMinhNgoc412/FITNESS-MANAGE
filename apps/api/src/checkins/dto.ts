import { IsString, MinLength } from 'class-validator';
export class CreateSelfCheckinDto { @IsString() @MinLength(8) idempotencyKey!: string; }
