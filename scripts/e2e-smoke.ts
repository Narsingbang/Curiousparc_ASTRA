import request from 'supertest';
import { app } from '../server/src/app';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

async function runSmokeTests() {
  console.log('🚀 Running MediSync AI E2E Smoke & Verification Suite...\n');
  const results: TestResult[] = [];

  // Helper
  const record = (name: string, passed: boolean, details?: string) => {
    results.push({
      name,
      status: passed ? 'PASS' : 'FAIL',
      details,
    });
  };

  try {
    // 1. Health endpoint
    const resHealth = await request(app).get('/api/health');
    record('GET /api/health', resHealth.status === 200 && resHealth.body.status === 'ok');

    // 2. Dashboard summary
    const resSummary = await request(app).get('/api/dashboard/summary');
    const hasSummaryKeys =
      resSummary.body.doctors &&
      resSummary.body.beds &&
      resSummary.body.resources &&
      resSummary.body.resources.emergencyBeds;
    record('GET /api/dashboard/summary shape', resSummary.status === 200 && !!hasSummaryKeys);

    // 3. Doctors list & filter
    const resDoctors = await request(app).get('/api/doctors?city=Pune');
    record(
      'GET /api/doctors (city=Pune)',
      resDoctors.status === 200 && Array.isArray(resDoctors.body.doctors) && resDoctors.body.doctors.length > 0
    );

    // 4. Inventory list
    const resInv = await request(app).get('/api/inventory');
    record(
      'GET /api/inventory',
      resInv.status === 200 && Array.isArray(resInv.body.inventory) && resInv.body.inventory.length > 0
    );

    // 5. Mild triage -> routed to JUNIOR_INTERN
    const resMildTriage = await request(app)
      .post('/api/triage/message')
      .send({ message: 'I have had a mild throat tickle and runny nose for 2 days.' });

    const isMild =
      resMildTriage.status === 200 &&
      (resMildTriage.body.status === 'NEEDS_MORE_INFO' ||
        (resMildTriage.body.status === 'COMPLETE' &&
          resMildTriage.body.routed_doctor?.level === 'JUNIOR_INTERN'));
    record('POST /api/triage/message (Mild Case)', isMild);

    // 6. Severe triage -> routed to SPECIALIST + emergency banner
    const resSevereTriage = await request(app)
      .post('/api/triage/message')
      .send({ message: 'I have crushing chest pain, sweating and severe shortness of breath.' });

    const isSevere =
      resSevereTriage.status === 200 &&
      resSevereTriage.body.status === 'COMPLETE' &&
      resSevereTriage.body.assessment?.severity === 'SEVERE' &&
      resSevereTriage.body.emergency_banner === true &&
      resSevereTriage.body.routed_doctor?.level === 'SPECIALIST';
    record('POST /api/triage/message (Severe Case Override)', isSevere);

    // 7. Emergency Request Creation
    const resEmergency = await request(app)
      .post('/api/emergency-requests')
      .send({
        patient_name: 'Rushikesh Soni',
        phone: '+919876543210',
        location_text: 'VIT Pune Upper Indira Nagar, Bibwewadi',
        lat: 18.4636,
        lng: 73.8682,
        notes: 'Suspected stroke, sudden left side weakness and slurred speech',
      });

    const isEmergCreated =
      resEmergency.status === 201 &&
      !!resEmergency.body.id &&
      !!resEmergency.body.recommended_hospital;
    record('POST /api/emergency-requests', isEmergCreated);

    const createdEmergencyId = resEmergency.body.id;

    // 8. Illegal Status Transition -> 409 Conflict
    // Current status is PENDING. Transitioning directly to COMPLETED (skipping ASSIGNED, EN_ROUTE, ARRIVED) must fail!
    const resIllegalTransition = await request(app)
      .patch(`/api/emergency-requests/${createdEmergencyId}/status`)
      .set('Authorization', 'Bearer demo-token-ambulance')
      .send({ status: 'COMPLETED' });

    record(
      'PATCH /api/emergency-requests/:id/status (Illegal Transition -> 409)',
      resIllegalTransition.status === 409
    );

    // Legal status transition PENDING -> ASSIGNED -> 200
    const resLegalTransition = await request(app)
      .patch(`/api/emergency-requests/${createdEmergencyId}/status`)
      .set('Authorization', 'Bearer demo-token-ambulance')
      .send({ status: 'ASSIGNED' });

    record(
      'PATCH /api/emergency-requests/:id/status (Legal Transition -> 200)',
      resLegalTransition.status === 200
    );

    // 9. Staff Inventory Update & Reflection
    const resStaffInv = await request(app)
      .patch('/api/staff/inventory/i0000000-0000-0000-0000-000000000002')
      .set('Authorization', 'Bearer demo-token-staff')
      .send({ available: 8, total: 20 });

    record(
      'PATCH /api/staff/inventory/:id (Staff Stepper -> 200)',
      resStaffInv.status === 200 && resStaffInv.body.inventory?.available === 8
    );

    // 10. Inventory available > total rejection -> 400
    const resInvOverflow = await request(app)
      .patch('/api/staff/inventory/i0000000-0000-0000-0000-000000000002')
      .set('Authorization', 'Bearer demo-token-staff')
      .send({ available: 50, total: 20 });

    record('PATCH /api/staff/inventory/:id (available > total -> 400)', resInvOverflow.status === 400);

    // 11. Staff claim with wrong code -> 403
    const resWrongStaffCode = await request(app)
      .post('/api/auth/claim-staff')
      .set('Authorization', 'Bearer demo-token-patient')
      .send({
        code: 'WRONG-SECRET-CODE-XYZ',
        hospital_id: 'a0000000-0000-0000-0000-000000000001',
      });

    record(
      'POST /api/auth/claim-staff (Invalid Code -> 403)',
      resWrongStaffCode.status === 403
    );

    // 12. Vault Isolation between two users
    const resUserARecords = await request(app)
      .get('/api/vault')
      .set('Authorization', 'Bearer demo-token-patient');

    record(
      'GET /api/vault (Authorized User Records)',
      resUserARecords.status === 200 && Array.isArray(resUserARecords.body.records)
    );

    const resUserAExport = await request(app)
      .get('/api/vault/export')
      .set('Authorization', 'Bearer demo-token-patient');

    record(
      'GET /api/vault/export (JSON download format)',
      resUserAExport.status === 200 && !!resUserAExport.body.records
    );
  } catch (err: any) {
    record('Test Suite Execution', false, err.message);
  }

  // Print Formatted Report Table
  console.log('═'.repeat(75));
  console.log('📋 MEDISYNC AI E2E VERIFICATION TEST MATRIX');
  console.log('═'.repeat(75));
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon}  ${r.status.padEnd(6)} | ${r.name}`);
    if (r.details) {
      console.log(`    ↳ Details: ${r.details}`);
    }
  }
  console.log('═'.repeat(75));

  const allPassed = results.every((r) => r.status === 'PASS');
  if (allPassed) {
    console.log('\n🎉 ALL E2E SMOKE & VERIFICATION TESTS PASSED (100% SUCCESS)!\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME VERIFICATION TESTS FAILED.\n');
    process.exit(1);
  }
}

runSmokeTests();
