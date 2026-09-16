import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiAnalysisController } from './ai-analysis.controller';
import { AiAnalysisService } from './ai-analysis.service';
import { AiClientService } from './ai-client.service';
import { PrivateMediaStorage } from './storage.service';
@Module({ imports: [AuthModule], controllers: [AiAnalysisController], providers: [AiAnalysisService, AiClientService, PrivateMediaStorage] }) export class AiAnalysisModule {}
