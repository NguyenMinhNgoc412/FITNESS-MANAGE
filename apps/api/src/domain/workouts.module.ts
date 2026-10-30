import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { BodyMeasurementsService } from './body-measurements.service';
import { ExerciseLibraryService } from './exercise-library.service';
@Module({ imports: [AuthModule], controllers: [WorkoutsController], providers: [WorkoutsService, BodyMeasurementsService, ExerciseLibraryService] })
export class WorkoutsModule {}
