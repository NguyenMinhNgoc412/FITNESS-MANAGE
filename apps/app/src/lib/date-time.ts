import { z } from 'zod';

export const dateTime = (value: string) => new Date(value).toLocaleString('vi-VN');
export function iso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(value.trim());
  if (!match) throw new z.ZodError([]);
  const d = new Date(+match[1], +match[2] - 1, +match[3], +(match[4] ?? 0), +(match[5] ?? 0));
  if (d.getFullYear() !== +match[1] || d.getMonth() !== +match[2] - 1 || d.getDate() !== +match[3] || d.getHours() !== +(match[4] ?? 0) || d.getMinutes() !== +(match[5] ?? 0)) throw new z.ZodError([]);
  return d.toISOString();
}
