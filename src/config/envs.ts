import 'dotenv/config';
import * as Joi from 'joi';

interface EnvVars {
  PORT: number;
  NATS_SERVERS: string[];
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_DB: number;
  REDIS_CONNECT_TIMEOUT: number;
  REDIS_MAX_RETRIES: number;
  REDIS_RETRY_DELAY: number;
  REDIS_MAX_LOADING_TIMEOUT: number;
}

const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NATS_SERVERS: Joi.array().items(Joi.string()).min(1).required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),
  REDIS_CONNECT_TIMEOUT: Joi.number().default(5000),
  REDIS_MAX_RETRIES: Joi.number().default(3),
  REDIS_RETRY_DELAY: Joi.number().default(100),
  REDIS_MAX_LOADING_TIMEOUT: Joi.number().default(5000),
}).unknown(true);

const { error, value } = envSchema.validate({
  ...process.env,
  PORT: process.env.PORT ?? process.env.CLIENT_GATEWAY_PORT ?? 3000,
  NATS_SERVERS: process.env.NATS_SERVERS ? process.env.NATS_SERVERS.split(',') : [],
  REDIS_PASSWORD: process.env.REDIS_PASSWORD ?? '',
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  natsServers: envVars.NATS_SERVERS,
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    db: envVars.REDIS_DB,
    connectTimeout: envVars.REDIS_CONNECT_TIMEOUT,
    maxRetries: envVars.REDIS_MAX_RETRIES,
    retryDelay: envVars.REDIS_RETRY_DELAY,
    maxLoadingTimeout: envVars.REDIS_MAX_LOADING_TIMEOUT,
  },
};