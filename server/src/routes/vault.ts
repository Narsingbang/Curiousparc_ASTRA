import { Router, Request, Response, NextFunction } from 'express';
import {
  RecordCreateInputSchema,
  RecordUpdateInputSchema,
  VaultProfileInputSchema,
} from '@medisync/shared';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createPatientRecord,
  deletePatientRecord,
  getVaultData,
  updatePatientRecord,
  updateVaultProfile,
} from '../services/vaultService';

export const vaultRouter = Router();

// GET /api/vault
vaultRouter.get(
  '/vault',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { severity, from, to } = req.query as Record<string, string | undefined>;

      const data = await getVaultData(userId, { severity, from, to });
      res.json({
        profile: req.user!.profile,
        records: data.records,
        stats: data.stats,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/vault/export
vaultRouter.get(
  '/vault/export',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const data = await getVaultData(userId);

      const exportData = {
        exported_at: new Date().toISOString(),
        system: 'MediSync AI Universal Health Vault',
        user: {
          id: req.user!.id,
          name: req.user!.profile.full_name,
          email: req.user!.email,
          blood_group: req.user!.profile.blood_group,
          allergies: req.user!.profile.allergies,
          chronic_conditions: req.user!.profile.chronic_conditions,
          emergency_contact: req.user!.profile.emergency_contact,
        },
        records: data.records,
        summary: data.stats,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="medisync_vault_export_${Date.now()}.json"`
      );
      res.json(exportData);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/vault/profile
vaultRouter.put(
  '/vault/profile',
  requireAuth,
  validate(VaultProfileInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const updatedProfile = await updateVaultProfile(userId, req.body);
      res.json({ profile: updatedProfile });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/vault/records
vaultRouter.post(
  '/vault/records',
  requireAuth,
  validate(RecordCreateInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const newRecord = await createPatientRecord(userId, req.body);
      res.status(201).json({ record: newRecord });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/vault/records/:id
vaultRouter.patch(
  '/vault/records/:id',
  requireAuth,
  validate(RecordUpdateInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updated = await updatePatientRecord(userId, id, req.body);
      res.json({ record: updated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/vault/records/:id
vaultRouter.delete(
  '/vault/records/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await deletePatientRecord(userId, id);
      res.json({ success: true, message: 'Record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);
