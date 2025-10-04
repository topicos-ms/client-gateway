import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [NatsModule],
  controllers: [GradesController],
  providers: [GradesService],
})
export class AssessmentsModule {}
