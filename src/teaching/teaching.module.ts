import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { TeachingService } from './services/teaching.service';
import { CourseSectionsController } from './controllers/course-sections.controller';
import { SchedulesController } from './controllers/schedules.controller';

@Module({
  imports: [NatsModule],
  controllers: [CourseSectionsController, SchedulesController],
  providers: [TeachingService],
})
export class TeachingModule {}
