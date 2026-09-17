import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OwnerAssistantController } from './owner-assistant.controller';
import { OwnerAssistantService } from './owner-assistant.service';

@Module({ imports: [AuthModule], controllers: [OwnerAssistantController], providers: [OwnerAssistantService] })
export class OwnerAssistantModule {}
