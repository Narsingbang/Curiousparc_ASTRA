import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import * as auditService from '../services/auditService';

describe('Write Operations & Resilience Suite', () => {
  const staffToken = 'demo-token-staff';
  const patientToken = 'demo-token-patient';

  // 1. Doctor waiting_count update
  it('updates doctor waiting_count successfully', async () => {
    // First get a doctor from /api/doctors
    const docListRes = await request(app).get('/api/doctors');
    expect(docListRes.status).toBe(200);
    const doctor = docListRes.body.doctors[0];
    expect(doctor).toBeDefined();

    const newWaiting = (doctor.waiting_count || 0) + 1;
    const res = await request(app)
      .patch(`/api/staff/doctors/${doctor.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ waiting_count: newWaiting });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.doctor.waiting_count).toBe(newWaiting);
  });

  // 2. Inventory update (available <= total enforced)
  it('updates inventory successfully when available <= total', async () => {
    const invListRes = await request(app).get('/api/inventory?hospital_id=d949b72a-2afa-4a1f-81ad-1d6d15865491');
    expect(invListRes.status).toBe(200);
    const item = invListRes.body.inventory[0];
    expect(item).toBeDefined();

    const validAvailable = Math.min(item.total, 5);
    const res = await request(app)
      .patch(`/api/staff/inventory/${item.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ available: validAvailable });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.inventory.available).toBe(validAvailable);
  });

  it('rejects inventory update when available > total with 400 Bad Request', async () => {
    const invListRes = await request(app).get('/api/inventory?hospital_id=d949b72a-2afa-4a1f-81ad-1d6d15865491');
    const item = invListRes.body.inventory[0];

    const overflowAvailable = item.total + 50;
    const res = await request(app)
      .patch(`/api/staff/inventory/${item.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ available: overflowAvailable });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  // 3. Vault record create, update, delete
  it('creates, updates, and deletes a vault record successfully', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/vault/records')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        title: 'Comprehensive Physical Exam',
        symptoms: 'Mild fatigue after running',
        severity: 'MILD',
        source: 'MANUAL',
        notes: 'Routine checkup completed',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.record).toBeDefined();
    expect(createRes.body.record.title).toBe('Comprehensive Physical Exam');
    const recordId = createRes.body.record.id;

    // Update
    const updateRes = await request(app)
      .patch(`/api/vault/records/${recordId}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        title: 'Updated Physical Exam Note',
        notes: 'Updated follow-up notes',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.record.title).toBe('Updated Physical Exam Note');

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/vault/records/${recordId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  // 4. Audit logging failure does NOT break the main update
  it('ensures audit logging failure does NOT cause the doctor update to fail', async () => {
    const docListRes = await request(app).get('/api/doctors');
    const doctor = docListRes.body.doctors[0];

    // Spy on logAudit to simulate failure
    const auditSpy = vi.spyOn(auditService, 'logAudit').mockRejectedValueOnce(
      new Error('Supabase audit_logs connection dropped')
    );

    const res = await request(app)
      .patch(`/api/staff/doctors/${doctor.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ waiting_count: 8 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.doctor.waiting_count).toBe(8);

    auditSpy.mockRestore();
  });
});
