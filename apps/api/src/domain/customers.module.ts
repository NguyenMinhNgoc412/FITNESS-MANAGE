import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { MembershipsModule } from './memberships.module';
@Module({ imports: [MembershipsModule], controllers: [CustomersController], providers: [CustomersService] })
export class CustomersModule {}
