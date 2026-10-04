import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@medisync/shared';
import { ApiError } from '../lib/errors';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access restricted to ${allowedRoles.join(', ')}. Current role: ${req.user.role}`
        )
      );
    }

    next();
  };
}

export function requireOwnHospital(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.user.role !== 'staff') {
    return next(ApiError.forbidden('Staff access required'));
  }

  if (!req.user.hospital_id) {
    return next(ApiError.forbidden('Staff member not linked to any hospital'));
  }

  next();
}
