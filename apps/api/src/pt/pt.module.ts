import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PtController } from './pt.controller';
import { PtService } from './pt.service';
@Module({ imports: [AuthModule], controllers: [PtController], providers: [PtService], exports: [PtService] }) export class PtModule {}
