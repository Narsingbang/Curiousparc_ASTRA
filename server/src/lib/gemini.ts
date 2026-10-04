import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env';
import { logger } from './logger';

export const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY || 'dummy_key' });

export async function generateStructured<T>(opts: {
  systemInstruction: string;
  userContent: string;
  responseSchema: unknown;
  zod: z.ZodType<T>;
  maxOutputTokens?: number;
  timeoutMs?: number;
}): Promise<T> {
  if (
    env.AI_DISABLED ||
    !env.GEMINI_API_KEY ||
    env.GEMINI_API_KEY === 'mock-gemini-key' ||
    env.GEMINI_API_KEY.includes('YOUR_GEMINI') ||
    env.GEMINI_API_KEY === 'dummy_key'
  ) {
    throw new Error('AI_SERVICE_DISABLED');
  }

  const configuredModels = (env.GEMINI_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const models = Array.from(
    new Set([env.GEMINI_MODEL, ...configuredModels, 'gemini-3.7-flash'].filter(Boolean))
  );
  const timeoutMs = opts.timeoutMs ?? 20000;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const apiPromise = ai.models.generateContent({
          model,
          contents: opts.userContent,
          config: {
            systemInstruction: opts.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: opts.responseSchema as any,
            temperature: 0.2,
            topP: 0.9,
            maxOutputTokens: opts.maxOutputTokens ?? 1024,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Gemini timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        const res = await Promise.race([apiPromise, timeoutPromise]);
        const text = res.text ?? '';
        if (!text) throw new Error('Empty response from Gemini');

        const parsedJson = JSON.parse(text);
        return opts.zod.parse(parsedJson);
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        const errStatus = err?.status || err?.statusCode || 0;
        const isRateLimitOrUnavailable =
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('high demand') ||
          errStatus === 503 ||
          errStatus === 429;

        logger.warn(
          { model, attempt, isRateLimitOrUnavailable, error: errMsg },
          'Gemini generation attempt failed, retrying or falling back...'
        );

        if (attempt === 1 && isRateLimitOrUnavailable) {
          // On 503/429 wait 1 second and retry once
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else if (attempt === 2 || !isRateLimitOrUnavailable) {
          // Move to next model in fallback chain
          break;
        }
      }
    }
  }

  throw new Error('ALL_GEMINI_MODELS_FAILED');
}
