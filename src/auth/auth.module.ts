import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { NatsModule } from '../transports/nats.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [NatsModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
})
export class AuthModule {}