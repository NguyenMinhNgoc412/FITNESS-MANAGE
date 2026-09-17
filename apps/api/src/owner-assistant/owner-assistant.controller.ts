import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles';
import { RolesGuard } from '../common/roles.guard';
import { AskOwnerAssistantDto } from './dto';
import { OwnerAssistantService } from './owner-assistant.service';

@Controller('owner-assistant') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER_ADMIN)
export class OwnerAssistantController {
  constructor(private readonly assistant: OwnerAssistantService) {}

  @Post('questions') ask(@CurrentUser() user: AuthUser, @Body() dto: AskOwnerAssistantDto) {
    return this.assistant.answer(user.sub, dto.question);
  }
}
