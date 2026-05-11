// Load .env for local development
// (Vercel injects environment variables automatically in production)
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Allow Angular dev server (port 4200) to call the API during local development
  app.enableCors({ origin: 'http://localhost:4200' });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend running at http://localhost:${port}`);
}

bootstrap();
