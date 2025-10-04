import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { ProgramsService } from './services/programs.service';
import { DegreeProgramsController } from './controllers/degree-programs.controller';
import { StudyPlansController } from './controllers/study-plans.controller';
import { LevelsController } from './controllers/levels.controller';
import { CoursesController } from './controllers/courses.controller';
import { PrerequisitesController } from './controllers/prerequisites.controller';

@Module({
  imports: [NatsModule],
  controllers: [
    DegreeProgramsController,
    StudyPlansController,
    LevelsController,
    CoursesController,
    PrerequisitesController,
  ],
  providers: [ProgramsService],
})
export class ProgramsModule {}
