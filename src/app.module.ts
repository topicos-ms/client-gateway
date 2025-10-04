import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common';
import { NatsModule } from './transports/nats.module';
import { AuthModule } from './auth/auth.module';
import { ProgramsModule } from './programs/programs.module';
import { CalendarModule } from './calendar/calendar.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { TeachingModule } from './teaching/teaching.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AssessmentsModule } from './assessments/assessments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    NatsModule,
    AuthModule,
    ProgramsModule,
    CalendarModule,
    FacilitiesModule,
    TeachingModule,
    EnrollmentsModule,
    AssessmentsModule,
  ],
})
export class AppModule {}