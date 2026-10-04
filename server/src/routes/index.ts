import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { publicRouter } from './public';
import { triageRouter } from './triage';
import { ambulanceRouter } from './ambulance';
import { emergencyRouter } from './emergency';
import { vaultRouter } from './vault';
import { staffRouter } from './staff';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(publicRouter);
apiRouter.use(triageRouter);
apiRouter.use(ambulanceRouter);
apiRouter.use(emergencyRouter);
apiRouter.use(vaultRouter);
apiRouter.use(staffRouter);
