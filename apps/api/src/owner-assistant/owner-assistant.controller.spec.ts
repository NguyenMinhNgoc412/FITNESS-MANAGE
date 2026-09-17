import 'reflect-metadata';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../common/roles';
import { OwnerAssistantController } from './owner-assistant.controller';

describe('OwnerAssistantController', () => {
  it('chỉ khai báo quyền Owner/Admin cho endpoint chatbot', () => {
    expect(Reflect.getMetadata(ROLES_KEY, OwnerAssistantController)).toEqual([Role.OWNER_ADMIN]);
  });
});
