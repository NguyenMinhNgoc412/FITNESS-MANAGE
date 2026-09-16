import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles';
import { RolesGuard } from '../common/roles.guard';
import { AiAnalysisService } from './ai-analysis.service';
import { CreateUploadIntentDto } from './dto';
@Controller('ai-analysis') @UseGuards(JwtAuthGuard, RolesGuard)
export class AiAnalysisController {
  constructor(private readonly analysis: AiAnalysisService) {}
  @Post('upload-intent') @Roles(Role.MEMBER) upload(@CurrentUser() user: AuthUser, @Body() dto: CreateUploadIntentDto) { return this.analysis.createUploadIntent(user.sub, dto); }
  @Post(':runId/confirm-upload') @Roles(Role.MEMBER) confirm(@CurrentUser() user: AuthUser, @Param('runId') runId: string) { return this.analysis.confirmUpload(user.sub, runId); }
  @Post(':runId/analyze') @Roles(Role.MEMBER, Role.OWNER_ADMIN) analyze(@CurrentUser() user: AuthUser, @Param('runId') runId: string) { return this.analysis.analyze(user.sub, user.role as Role, runId); }
  @Post(':runId/retry-generation') @Roles(Role.MEMBER, Role.OWNER_ADMIN) retry(@CurrentUser() user: AuthUser, @Param('runId') runId: string) { return this.analysis.retryGeneration(user.sub, user.role as Role, runId); }
  @Get() @Roles(Role.MEMBER, Role.PT, Role.OWNER_ADMIN) history(@CurrentUser() user: AuthUser) { return this.analysis.history(user.sub, user.role as Role); }
  @Get(':runId') @Roles(Role.MEMBER, Role.PT, Role.OWNER_ADMIN) get(@CurrentUser() user: AuthUser, @Param('runId') runId: string) { return this.analysis.get(user.sub, user.role as Role, runId); }
}
