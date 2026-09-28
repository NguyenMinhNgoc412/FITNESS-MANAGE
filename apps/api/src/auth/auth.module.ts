import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TransactionService } from '../common/transaction.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard, RolesGuard } from './guards';
@Global()
@Module({
  imports: [JwtModule.register({})], controllers: [AuthController],
  providers: [AuthService, TransactionService, JwtAuthGuard, RolesGuard],
  exports: [JwtModule, AuthService, TransactionService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
