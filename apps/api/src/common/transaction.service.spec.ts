import { HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { TransactionService } from './transaction.service';

describe('TransactionService write conflicts', () => {
  const conflict = () => new Prisma.PrismaClientKnownRequestError('Write conflict', { code: 'P2034', clientVersion: '6' });
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('retries against a fresh transaction and returns its result', async () => {
    const transaction = jest.fn().mockRejectedValueOnce(conflict()).mockResolvedValueOnce('saved');
    const service = new TransactionService({ $transaction: transaction } as unknown as PrismaService);
    const result = service.run(async () => 'saved');
    const assertion = expect(result).resolves.toBe('saved');
    await jest.runAllTimersAsync();
    await assertion;
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it('returns a safe 409 after exhausting conflict retries', async () => {
    const transaction = jest.fn().mockRejectedValue(conflict());
    const service = new TransactionService({ $transaction: transaction } as unknown as PrismaService);
    const result = service.run(async () => 'saved').catch(error => error as HttpException);
    await jest.runAllTimersAsync();
    const error = await result as HttpException;
    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(409);
    expect(error.getResponse()).toEqual({ code: 'CONCURRENT_CHANGE', message: 'Dữ liệu đang được cập nhật. Vui lòng thử lại.' });
    expect(transaction).toHaveBeenCalledTimes(8);
  });
});
