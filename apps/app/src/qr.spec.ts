import { qrMatrix } from './qr';
describe('local signed QR encoding', () => {
  it('has three finder patterns and a bounded square matrix', () => {
    const matrix = qrMatrix('opaque.signed.token');
    expect(matrix).toHaveLength(53);
    expect(matrix.every(row => row.length === 53)).toBe(true);
    for (const [x, y] of [[3, 3], [49, 3], [3, 49]]) {
      expect(matrix[y][x]).toBe(true);
      expect(matrix[y][x + 2]).toBe(false);
      expect(matrix[y][x + 3]).toBe(true);
    }
  });
  it('rejects oversized/non-ASCII payloads', () => {
    expect(() => qrMatrix('x'.repeat(272))).toThrow();
    expect(() => qrMatrix('é')).toThrow();
  });
  it('uses the larger matrix only when the token exceeds version 9 capacity', () => {
    expect(qrMatrix('x'.repeat(230))).toHaveLength(53);
    expect(qrMatrix('x'.repeat(231))).toHaveLength(57);
  });
});
