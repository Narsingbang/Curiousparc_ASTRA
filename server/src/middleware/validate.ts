import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validate(
  schema: z.ZodTypeAny,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];
      const parsed = await schema.parseAsync(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}
