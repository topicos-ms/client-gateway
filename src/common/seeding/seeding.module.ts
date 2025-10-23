import { Module } from '@nestjs/common';
import { SeedingService } from './seeding.service';
import { SeedingController } from './seeding.controller';
import { AuthSeeder } from './seeders/auth.seeder';
import { ProgramsSeeder } from './seeders/programs.seeder';
import { CalendarSeeder } from './seeders/calendar.seeder';
import { CourseSectionsSeeder } from './seeders/course-sections.seeder';
import { SchedulesSeeder } from './seeders/schedules.seeder';
import { EnrollmentsSeeder } from './seeders/enrollments.seeder';
import { EnrollmentDetailsSeeder } from './seeders/enrollment-details.seeder';
import { GradesSeeder } from './seeders/grades.seeder';
import { NatsModule } from '../../transports/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [SeedingController],
  providers: [
    SeedingService,
    AuthSeeder,
    ProgramsSeeder,
    CalendarSeeder,
    CourseSectionsSeeder,
    SchedulesSeeder,
    EnrollmentsSeeder,
    EnrollmentDetailsSeeder,
    GradesSeeder,
  ],
  exports: [SeedingService],
})
export class SeedingModule {}
