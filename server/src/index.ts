import { app } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const port = env.PORT || 4000;

app.listen(port, () => {
  logger.info(`🚀 MediSync AI Server listening on http://localhost:${port}`);
  logger.info(`🩺 Health check available at http://localhost:${port}/api/health`);
  logger.info(`📊 Dashboard summary at http://localhost:${port}/api/dashboard/summary`);
});
