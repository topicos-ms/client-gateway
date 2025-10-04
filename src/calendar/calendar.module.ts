import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { CalendarService } from './services/calendar.service';
import { AcademicYearsController } from './controllers/academic-years.controller';
import { TermsController } from './controllers/terms.controller';

@Module({
  imports: [NatsModule],
  controllers: [AcademicYearsController, TermsController],
  providers: [CalendarService],
})
export class CalendarModule {}
