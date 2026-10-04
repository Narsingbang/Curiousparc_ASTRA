import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ClaimStaffSchema } from '@medisync/shared';
import { requireAuth } from '../middleware/auth';
import { claimStaffLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { env } from '../config/env';
import { ApiError } from '../lib/errors';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { logAudit } from '../services/auditService';
import { dbStore } from '../services/dataStore';

export const authRouter = Router();

authRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    user: req.user,
  });
});

authRouter.post(
  '/auth/claim-staff',
  claimStaffLimiter,
  requireAuth,
  validate(ClaimStaffSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, hospital_id } = req.body;
      const expectedCode = env.STAFF_SIGNUP_CODE;

      // Constant-time comparison to prevent timing side-channel attacks
      const codeBuffer = Buffer.from(code);
      const expectedBuffer = Buffer.from(expectedCode);

      const isValid =
        codeBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(codeBuffer, expectedBuffer);

      if (!isValid) {
        throw ApiError.forbidden('Invalid staff access code');
      }

      // Check hospital exists
      if (isMockSupabase) {
        const hospital = dbStore.hospitals.find((h) => h.id === hospital_id);
        if (!hospital) {
          throw ApiError.badRequest('Hospital not found');
        }
      } else {
        const { data: hospital } = await supabaseAdmin
          .from('hospitals')
          .select('id')
          .eq('id', hospital_id)
          .single();

        if (!hospital) {
          throw ApiError.badRequest('Hospital not found');
        }

        // Update profile role and hospital_id using service-role client
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: 'staff',
            hospital_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', req.user!.id);

        if (updateError) {
          throw ApiError.internal('Failed to promote user to staff role');
        }
      }

      // Log audit action
      await logAudit({
        actorId: req.user!.id,
        actorName: req.user!.profile.full_name,
        action: 'STAFF_ROLE_CLAIMED',
        entity: 'profiles',
        entityId: req.user!.id,
        meta: { hospital_id },
      });

      res.json({
        success: true,
        message: 'Successfully promoted to hospital staff role',
        role: 'staff',
        hospital_id,
      });
    } catch (err) {
      next(err);
    }
  }
);
