/**
 * Vercel Serverless Function entry point for NestJS.
 *
 * Vercel detects any file inside /api as a serverless function.
 * This file boots a NestJS application and forwards every request
 * to Express (NestJS's default HTTP adapter) for handling.
 *
 * The app instance is cached across warm invocations to avoid
 * re-bootstrapping on every request.
 */
import 'reflect-metadata';
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: INestApplication | null = null;

async function getApp(): Promise<INestApplication> {
  if (!cachedApp) {
    cachedApp = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });
    cachedApp.setGlobalPrefix('api');
    cachedApp.enableCors({ origin: '*' });
    await cachedApp.init();
  }
  return cachedApp;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const app           = await getApp();
  const expressApp    = app.getHttpAdapter().getInstance();
  expressApp(req, res);
}
