import { qrMatrix } from './qr';
describe('local signed QR encoding', () => {
  it('has three finder patterns and a bounded square matrix', () => {
    const matrix = qrMatrix('opaque.signed.token');
    expect(matrix).toHaveLength(57);
    expect(matrix.every(row => row.length === 57)).toBe(true);
    for (const [x, y] of [[3, 3], [53, 3], [3, 53]]) {
      expect(matrix[y][x]).toBe(true);
      expect(matrix[y][x + 2]).toBe(false);
      expect(matrix[y][x + 3]).toBe(true);
    }
  });
  it('rejects oversized/non-ASCII payloads', () => {
    expect(() => qrMatrix('x'.repeat(272))).toThrow();
    expect(() => qrMatrix('é')).toThrow();
  });
});
