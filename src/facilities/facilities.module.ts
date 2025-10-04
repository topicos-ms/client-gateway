import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { FacilitiesService } from './services/facilities.service';
import { ClassroomsController } from './controllers/classrooms.controller';

@Module({
  imports: [NatsModule],
  controllers: [ClassroomsController],
  providers: [FacilitiesService],
})
export class FacilitiesModule {}
