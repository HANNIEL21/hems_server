import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';
import { AppModule } from './app.module';
import { corsOptions } from './cors.config';

let cachedHandler: ReturnType<typeof serverless>;

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { cors: corsOptions },
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return serverless(expressApp);
}

export const handler = async (
  event: object,
  context: { callbackWaitsForEmptyEventLoop?: boolean },
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  cachedHandler ??= await bootstrap();
  return cachedHandler(event, context);
};
