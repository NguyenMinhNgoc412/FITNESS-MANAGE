import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { exerciseContent } from '../src/domain/exercise-content';
import { searchName } from '../src/domain/workout-rules';
import { json } from '../src/common/transaction.service';

export async function seedExercises(prisma: PrismaClient) {
  for (const { code, content } of exerciseContent) {
    await prisma.$transaction(async db => {
      await db.writeLock.update({ where: { id: 'business' }, data: { version: { increment: 1 } } });
      const id = createHash('sha256').update('fitness-exercise:' + code).digest('hex').slice(0, 24);
      const item = await db.exerciseCatalog.upsert({ where: { code }, update: {}, create: { id, code, status: 'PUBLISHED', currentPublishedVersion: 1, nameVi: content.nameVi, searchText: searchName([content.nameVi, content.nameEn, ...content.aliases].join(' ')), muscleGroups: [content.primaryMuscleGroup, ...content.secondaryMuscleGroups], equipmentCodes: content.equipmentCodes } });
      await db.exerciseCatalogVersion.upsert({ where: { catalogExerciseId_contentVersion: { catalogExerciseId: item.id, contentVersion: 1 } }, update: {}, create: { catalogExerciseId: item.id, contentVersion: 1, content: json(content) } });
    });
  }
}
if (require.main === module) {
  if (existsSync('.env')) loadEnvFile('.env');
  const prisma = new PrismaClient();
  seedExercises(prisma).then(() => console.info('Exercise library seeded; existing content/status preserved.')).catch(() => { console.error('EXERCISE_SEED_FAILED'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
