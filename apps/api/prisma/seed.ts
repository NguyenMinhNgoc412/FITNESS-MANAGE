import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  const owner = await prisma.user.upsert({ where: { email: 'owner@example.test' }, update: {}, create: { email: 'owner@example.test', fullName: 'Test Owner', passwordHash, role: Role.OWNER_ADMIN } });
  const pt = await prisma.user.upsert({ where: { email: 'pt@example.test' }, update: {}, create: { email: 'pt@example.test', fullName: 'Test PT', passwordHash, role: Role.PT, ptProfile: { create: {} } } });
  const member = await prisma.user.upsert({ where: { email: 'member@example.test' }, update: {}, create: { email: 'member@example.test', fullName: 'Test Member', passwordHash, role: Role.MEMBER, memberProfile: { create: { goal: 'Sức khỏe tổng quát' } } } });
  const assignment = await prisma.assignment.findFirst({ where: { memberId: member.id, status: 'ACTIVE' }, select: { id: true } });
  if (!assignment) await prisma.assignment.create({ data: { memberId: member.id, ptId: pt.id, createdById: owner.id } });
}
main().finally(() => prisma.$disconnect());
