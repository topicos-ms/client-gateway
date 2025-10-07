import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { RpcCustomExceptionFilter } from './common';
import { QueueInterceptor } from './common/interceptors/queue.interceptor';

async function bootstrap() {
  const logger = new Logger('GatewayMain');

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      'queue-control',
      'queue-control/(.*)',
      'queues',
      'queues/(.*)',
      'queue-demo',
      'queue-demo/(.*)',
      'public/(.*)',
    ],
  });

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

  await app.listen(envs.port);

  logger.log(`Gateway running on port ${envs.port}`);
}
bootstrap();

