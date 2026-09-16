import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditService } from '../common/audit.service';
import { AuditController } from '../common/audit.controller';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
@Module({ imports: [JwtModule.register({})], controllers: [AuthController, AuditController], providers: [AuthService, JwtAuthGuard, RolesGuard, AuditService], exports: [JwtModule, JwtAuthGuard, RolesGuard, AuditService] })
export class AuthModule {}
