import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { getDashboardSummary } from '../services/dashboardService';
import { dbStore } from '../services/dataStore';

export const publicRouter = Router();

// GET /api/hospitals
publicRouter.get('/hospitals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = req.query.city as string | undefined;

    if (isMockSupabase) {
      let list = dbStore.hospitals;
      if (city && city !== 'All') {
        list = list.filter((h) => h.city.toLowerCase() === city.toLowerCase());
      }
      res.json({ hospitals: list });
      return;
    }

    let query = supabaseAdmin.from('hospitals').select('*').order('name');
    if (city && city !== 'All') {
      query = query.ilike('city', city);
    }

    const { data, error } = await query;
    if (error || !data) {
      let list = dbStore.hospitals;
      if (city && city !== 'All') {
        list = list.filter((h) => h.city.toLowerCase() === city.toLowerCase());
      }
      res.json({ hospitals: list });
      return;
    }

    res.json({ hospitals: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors
publicRouter.get('/doctors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, q, level, status, hospital_id } = req.query as Record<
      string,
      string | undefined
    >;

    let doctors: any[] = [];

    if (isMockSupabase) {
      doctors = dbStore.doctors.map((d) => {
        const hospital = dbStore.hospitals.find((h) => h.id === d.hospital_id);
        return {
          ...d,
          hospitals: hospital,
        };
      });
    } else {
      const { data, error } = await supabaseAdmin
        .from('doctors')
        .select('*, hospitals(name, city, address, phone)')
        .order('full_name');

      if (error || !data) {
        doctors = dbStore.doctors.map((d) => ({
          ...d,
          hospitals: dbStore.hospitals.find((h) => h.id === d.hospital_id),
        }));
      } else {
        doctors = data;
      }
    }

    // Apply filtering
    if (city && city !== 'All') {
      doctors = doctors.filter(
        (d) => d.hospitals?.city?.toLowerCase() === city.toLowerCase()
      );
    }

    if (hospital_id) {
      doctors = doctors.filter((d) => d.hospital_id === hospital_id);
    }

    if (level && level !== 'All') {
      doctors = doctors.filter((d) => d.level === level);
    }

    if (status && status !== 'All') {
      doctors = doctors.filter((d) => d.status === status);
    }

    if (q) {
      const search = q.toLowerCase();
      doctors = doctors.filter(
        (d) =>
          d.full_name.toLowerCase().includes(search) ||
          d.specialty.toLowerCase().includes(search) ||
          d.hospitals?.name?.toLowerCase().includes(search)
      );
    }

    res.json({ doctors });
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory
publicRouter.get('/inventory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, hospital_id } = req.query as Record<string, string | undefined>;

    let inventory: any[] = [];

    if (isMockSupabase) {
      inventory = dbStore.inventory.map((inv) => {
        const hospital = dbStore.hospitals.find((h) => h.id === inv.hospital_id);
        return {
          ...inv,
          hospitals: hospital,
        };
      });
    } else {
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .select('*, hospitals(name, city)')
        .order('type');

      if (error || !data) {
        inventory = dbStore.inventory.map((inv) => ({
          ...inv,
          hospitals: dbStore.hospitals.find((h) => h.id === inv.hospital_id),
        }));
      } else {
        inventory = data;
      }
    }

    if (city && city !== 'All') {
      inventory = inventory.filter(
        (i) => i.hospitals?.city?.toLowerCase() === city.toLowerCase()
      );
    }

    if (hospital_id) {
      inventory = inventory.filter((i) => i.hospital_id === hospital_id);
    }

    res.json({ inventory });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/summary
publicRouter.get(
  '/dashboard/summary',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await getDashboardSummary();
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }
);
