import { Module } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { MembershipsModule } from './memberships.module';
@Module({ imports: [MembershipsModule], controllers: [CheckinsController], providers: [CheckinsService], exports: [CheckinsService] })
export class CheckinsModule {}
