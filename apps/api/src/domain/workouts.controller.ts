import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Actor, CurrentUser, Roles } from '../common/access';
import { WorkoutsService } from './workouts.service';
import { BodyMeasurementsService } from './body-measurements.service';
import { ExerciseLibraryService } from './exercise-library.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkoutsController {
  constructor(
    private readonly workouts: WorkoutsService,
    private readonly measurementsService: BodyMeasurementsService,
    private readonly libraryService: ExerciseLibraryService,
  ) {}
  @Get('members/me/workouts') @Roles(Role.MEMBER)
  list(@CurrentUser() a: Actor, @Query() q: unknown) { return this.workouts.list(a, q); }
  @Post('members/me/workouts') @Roles(Role.MEMBER)
  create(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.workouts.create(a, b, k); }
  @Get('members/me/workouts/:id') @Roles(Role.MEMBER)
  detail(@CurrentUser() a: Actor, @Param('id') id: string) { return this.workouts.detail(a, id); }
  @Patch('members/me/workouts/:id') @Roles(Role.MEMBER)
  update(@CurrentUser() a: Actor, @Param('id') id: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.workouts.update(a, id, b, k); }
  @Post('members/me/workouts/:id/complete') @Roles(Role.MEMBER)
  complete(@CurrentUser() a: Actor, @Param('id') id: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.workouts.transition(a, id, b, 'complete', k); }
  @Post('members/me/workouts/:id/archive') @Roles(Role.MEMBER)
  archive(@CurrentUser() a: Actor, @Param('id') id: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.workouts.transition(a, id, b, 'archive', k); }
  @Get('members/me/workouts/:id/revisions') @Roles(Role.MEMBER)
  revisions(@CurrentUser() a: Actor, @Param('id') id: string, @Query() q: unknown) { return this.workouts.revisions(a, id, q); }
  @Get('members/me/workout-progress') @Roles(Role.MEMBER)
  progress(@CurrentUser() a: Actor, @Query() q: unknown) { return this.workouts.progress(a, q); }
  @Get('members/me/body-measurements') @Roles(Role.MEMBER)
  measurements(@CurrentUser() a: Actor, @Query() q: unknown) { return this.measurementsService.list(a, q); }
  @Post('members/me/body-measurements') @Roles(Role.MEMBER)
  createMeasurement(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.measurementsService.create(a, b, k); }
  @Get('members/me/body-measurements/:id') @Roles(Role.MEMBER)
  measurement(@CurrentUser() a: Actor, @Param('id') id: string) { return this.measurementsService.detail(a, id); }
  @Patch('members/me/body-measurements/:id') @Roles(Role.MEMBER)
  updateMeasurement(@CurrentUser() a: Actor, @Param('id') id: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.measurementsService.update(a, id, b, k); }
  @Post('members/me/body-measurements/:id/archive') @Roles(Role.MEMBER)
  archiveMeasurement(@CurrentUser() a: Actor, @Param('id') id: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.measurementsService.archive(a, id, b, k); }
  @Get('members/me/body-measurements/:id/revisions') @Roles(Role.MEMBER)
  measurementRevisions(@CurrentUser() a: Actor, @Param('id') id: string, @Query() q: unknown) { return this.measurementsService.revisions(a, id, q); }
  @Get('members/me/body-measurement-progress') @Roles(Role.MEMBER)
  measurementProgress(@CurrentUser() a: Actor, @Query() q: unknown) { return this.measurementsService.progress(a, q); }
  @Get('exercise-library') @Roles(Role.MEMBER)
  library(@CurrentUser() a: Actor, @Query() q: unknown) { return this.libraryService.list(a, q); }
  @Get('exercise-library/:id') @Roles(Role.MEMBER)
  exercise(@CurrentUser() a: Actor, @Param('id') id: string) { return this.libraryService.detail(a, id); }
}
