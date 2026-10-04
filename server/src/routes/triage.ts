import { Router, Request, Response, NextFunction } from 'express';
import { TriageMessageInputSchema } from '@medisync/shared';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { triageLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { processTriageMessage } from '../services/triageService';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { dbStore } from '../services/dataStore';

export const triageRouter = Router();

triageRouter.post(
  '/triage/message',
  triageLimiter,
  optionalAuth,
  validate(TriageMessageInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { session_id, session_token, message, city } = req.body;
      const userId = req.user?.id;

      const result = await processTriageMessage({
        sessionId: session_id,
        sessionToken: session_token,
        message,
        city,
        userId,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

triageRouter.get(
  '/triage/sessions',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      if (isMockSupabase) {
        const sessions = dbStore.triageSessions.filter((s) => s.user_id === userId);
        res.json({ sessions });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('triage_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        const sessions = dbStore.triageSessions.filter((s) => s.user_id === userId);
        res.json({ sessions });
        return;
      }

      res.json({ sessions: data });
    } catch (err) {
      next(err);
    }
  }
);
