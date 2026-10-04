import { Router, Request, Response, NextFunction } from 'express';
import { RecommendationQuerySchema, DispatchNeed } from '@medisync/shared';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rankHospitals, HospitalWithDetails } from '../services/hospitalRanking';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { dbStore } from '../services/dataStore';

export const ambulanceRouter = Router();

// GET /api/ambulance/recommendations
ambulanceRouter.get(
  '/ambulance/recommendations',
  optionalAuth,
  validate(RecommendationQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lat, lng, needs, specialty } = req.query as any;

      let hospitalDetails: HospitalWithDetails[] = [];

      if (isMockSupabase) {
        hospitalDetails = dbStore.hospitals.map((h) => {
          const inv = dbStore.inventory.filter((i) => i.hospital_id === h.id);
          const docs = dbStore.doctors.filter((d) => d.hospital_id === h.id);
          return {
            id: h.id,
            name: h.name,
            city: h.city,
            address: h.address,
            lat: h.lat,
            lng: h.lng,
            phone: h.phone,
            inventory: inv.map((i) => ({
              type: i.type,
              total: i.total,
              available: i.available,
            })),
            doctors: docs.map((d) => ({
              id: d.id,
              full_name: d.full_name,
              specialty: d.specialty,
              level: d.level,
              status: d.status,
            })),
          };
        });
      } else {
        const { data: hospitals, error: hError } = await supabaseAdmin
          .from('hospitals')
          .select('*, inventory(*), doctors(*)');

        if (hError || !hospitals) {
          hospitalDetails = dbStore.hospitals.map((h) => ({
            id: h.id,
            name: h.name,
            city: h.city,
            address: h.address,
            lat: h.lat,
            lng: h.lng,
            phone: h.phone,
            inventory: dbStore.inventory.filter((i) => i.hospital_id === h.id),
            doctors: dbStore.doctors.filter((d) => d.hospital_id === h.id),
          }));
        } else {
          hospitalDetails = hospitals.map((h: any) => ({
            id: h.id,
            name: h.name,
            city: h.city,
            address: h.address,
            lat: h.lat,
            lng: h.lng,
            phone: h.phone,
            inventory: h.inventory || [],
            doctors: h.doctors || [],
          }));
        }
      }

      const activeNeeds = (needs || []) as DispatchNeed[];

      const recommendations = rankHospitals({
        hospitals: hospitalDetails,
        userLat: lat,
        userLng: lng,
        needs: activeNeeds,
        specialty,
      });

      res.json({ recommendations });
    } catch (err) {
      next(err);
    }
  }
);
