import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { RpcCustomExceptionFilter } from './common';
import { QueueInterceptor } from './common/interceptors/queue.interceptor';
import { QueueConfigService } from './common/interceptors/queue-config.service';

async function bootstrap() {
  const logger = new Logger('GatewayMain');

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new RpcCustomExceptionFilter());

  const queueInterceptor = app.get(QueueInterceptor);
  app.useGlobalInterceptors(queueInterceptor);
  logger.log('Queue interceptor registered globally');
  logger.log('Queue control endpoints available at /queue-control');
  logger.log('Use POST /queue-control/enable to activate the queue system');

  const queueConfigService = app.get(QueueConfigService);
  const queueFlag =
    process.env.QUEUE_ENABLED ?? process.env.ENABLE_QUEUE_SYSTEM;
  const shouldEnableQueue = queueFlag === undefined || queueFlag === 'true';

  if (shouldEnableQueue && !queueConfigService.isQueueEnabled()) {
    queueConfigService.enableQueue();
    logger.log('Queue system enabled at bootstrap');
  } else if (!shouldEnableQueue) {
    logger.warn('Queue system disabled by configuration');
  }

  await app.listen(envs.port);

  logger.log(`Gateway running on port ${envs.port}`);
}
bootstrap();

