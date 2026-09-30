// QR Model 2, version 9 or 10, error correction L, byte mode.
// ASCII-only because the payload is a signed opaque token, never PII.
export function qrMatrix(token: string): boolean[][] {
  if (!token || token.length > 271 || /[^\x20-\x7e]/.test(token)) throw new Error('QR payload is unsupported');
  const version = token.length <= 230 ? 9 : 10;
  const dataCodewords = version === 9 ? 232 : 274;
  const correctionCodewords = version === 9 ? 30 : 18;
  const bits: number[] = [];
  const append = (value: number, count: number) => { for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  append(4, 4); append(token.length, version === 9 ? 8 : 16);
  for (const char of token) append(char.charCodeAt(0), 8);
  append(0, Math.min(4, dataCodewords * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) bytes.push(bits.slice(i, i + 8).reduce((value, bit) => value * 2 + bit, 0));
  for (let pad = 0; bytes.length < dataCodewords; pad++) bytes.push(pad % 2 ? 0x11 : 0xec);
  const multiply = (a: number, b: number) => {
    let result = 0;
    while (b) { if (b & 1) result ^= a; a <<= 1; if (a & 0x100) a ^= 0x11d; b >>>= 1; }
    return result;
  };
  let polynomial = [1], root = 1;
  for (let i = 0; i < correctionCodewords; i++) {
    const next = Array(polynomial.length + 1).fill(0) as number[];
    polynomial.forEach((coefficient, index) => { next[index] ^= coefficient; next[index + 1] ^= multiply(coefficient, root); });
    polynomial = next; root = multiply(root, 2);
  }
  let offset = 0;
  const blocks = (version === 9 ? [116, 116] : [68, 68, 69, 69]).map(size => { const result = bytes.slice(offset, offset + size); offset += size; return result; });
  const corrections = blocks.map(block => {
    const remainder = Array(correctionCodewords).fill(0) as number[];
    for (const byte of block) {
      const factor = byte ^ remainder.shift()!; remainder.push(0);
      for (let i = 0; i < correctionCodewords; i++) remainder[i] ^= multiply(polynomial[i + 1], factor);
    }
    return remainder;
  });
  const stream: number[] = [];
  for (let i = 0; i < Math.max(...blocks.map(block => block.length)); i++) for (const block of blocks) if (i < block.length) stream.push(block[i]);
  for (let i = 0; i < correctionCodewords; i++) for (const block of corrections) stream.push(block[i]);
  const size = version === 9 ? 53 : 57;
  let grid = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
  const fixed = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
  const set = (x: number, y: number, dark: boolean) => { if (x >= 0 && x < size && y >= 0 && y < size) { grid[y][x] = dark; fixed[y][x] = true; } };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      set(cx + dx, cy + dy, distance !== 2 && distance !== 4);
    }
  }
  const centers = version === 9 ? [6, 26, 46] : [6, 28, 50];
  for (const cy of centers) for (const cx of centers) {
    if ((cx === 6 && cy === 6) || (cx === 6 && cy === centers[2]) || (cx === centers[2] && cy === 6)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const drawFormat = (mask: number) => {
  let formatRemainder = 8 | mask;
  for (let i = 0; i < 10; i++) formatRemainder = (formatRemainder << 1) ^ ((formatRemainder >>> 9) * 0x537);
  const format = (((8 | mask) << 10) | formatRemainder) ^ 0x5412;
  const formatBit = (i: number) => !!((format >>> i) & 1);
  for (let i = 0; i <= 5; i++) set(8, i, formatBit(i));
  set(8, 7, formatBit(6)); set(8, 8, formatBit(7)); set(7, 8, formatBit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, formatBit(i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, formatBit(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, formatBit(i));
  set(8, size - 8, true);
  };
  drawFormat(0);
  let versionRemainder = version;
  for (let i = 0; i < 12; i++) versionRemainder = (versionRemainder << 1) ^ ((versionRemainder >>> 11) * 0x1f25);
  const versionBits = (version << 12) | versionRemainder;
  for (let i = 0; i < 18; i++) {
    const dark = !!((versionBits >>> i) & 1), a = size - 11 + i % 3, b = Math.floor(i / 3);
    set(a, b, dark); set(b, a, dark);
  }
  let cursor = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let row = 0; row < size; row++) {
      const y = ((right + 1) & 2) === 0 ? size - 1 - row : row;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (!fixed[y][x]) {
          const bit = cursor < stream.length * 8 ? ((stream[cursor >>> 3] >>> (7 - cursor % 8)) & 1) === 1 : false;
          grid[y][x] = bit; cursor++;
        }
      }
    }
  }
  const unmasked = grid;
  const masks = [
    (x: number, y: number) => (x + y) % 2 === 0,
    (_x: number, y: number) => y % 2 === 0,
    (x: number, _y: number) => x % 3 === 0,
    (x: number, y: number) => (x + y) % 3 === 0,
    (x: number, y: number) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
    (x: number, y: number) => (x * y) % 2 + (x * y) % 3 === 0,
    (x: number, y: number) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
    (x: number, y: number) => ((x + y) % 2 + (x * y) % 3) % 2 === 0,
  ];
  let best = grid, bestScore = Infinity;
  masks.forEach((mask, index) => {
    grid = unmasked.map((row, y) => row.map((dark, x) => fixed[y][x] ? dark : dark !== mask(x, y)));
    drawFormat(index);
    let score = 0, darkCount = 0;
    const linePenalty = (line: boolean[]) => {
      let result = 0, run = 1;
      for (let i = 1; i <= line.length; i++) {
        if (i < line.length && line[i] === line[i - 1]) run++;
        else { if (run >= 5) result += run - 2; run = 1; }
      }
      const pattern = line.map(b => b ? '1' : '0').join('');
      for (let i = 0; i <= pattern.length - 11; i++) {
        if (['00001011101', '10111010000'].includes(pattern.slice(i, i + 11))) result += 40;
      }
      return result;
    };
    for (let y = 0; y < size; y++) {
      score += linePenalty(grid[y]) + linePenalty(grid.map(row => row[y]));
      for (let x = 0; x < size; x++) {
        if (grid[y][x]) darkCount++;
        if (x && y && grid[y][x] === grid[y - 1][x] && grid[y][x] === grid[y][x - 1] && grid[y][x] === grid[y - 1][x - 1]) score += 3;
      }
    }
    score += Math.floor(Math.abs(darkCount * 20 - size * size * 10) / (size * size)) * 10;
    if (score < bestScore) { best = grid; bestScore = score; }
  });
  return best;
}
