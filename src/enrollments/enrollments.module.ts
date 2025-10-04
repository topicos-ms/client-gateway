import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { EnrollmentsService } from './services/enrollments.service';
import { EnrollmentsController } from './controllers/enrollments.controller';
import { EnrollmentDetailsController } from './controllers/enrollment-details.controller';
import { AcademicValidationsController } from './controllers/academic-validations.controller';
import { AtomicEnrollmentController } from './controllers/atomic-enrollment.controller';
import { DatabasePerformanceController } from './controllers/database-performance.controller';

@Module({
  imports: [NatsModule],
  controllers: [
    EnrollmentsController,
    EnrollmentDetailsController,
    AcademicValidationsController,
    AtomicEnrollmentController,
    DatabasePerformanceController,
  ],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
