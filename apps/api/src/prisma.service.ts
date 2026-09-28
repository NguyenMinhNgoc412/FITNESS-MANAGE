import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      await this.writeLock.upsert({ where: { id: 'business' }, create: { id: 'business' }, update: {} });
    } catch { throw new Error('Không kết nối được MongoDB replica set. Kiểm tra cấu hình database.'); }
  }
  async onModuleDestroy() { await this.$disconnect(); }
}
