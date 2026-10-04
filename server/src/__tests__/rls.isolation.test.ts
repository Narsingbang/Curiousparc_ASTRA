import { describe, it, expect } from 'vitest';
import {
  createPatientRecord,
  getVaultData,
} from '../services/vaultService';

describe('Data Isolation and Health Vault Security', () => {
  const userA = 'user-a-1111-1111-1111-111111111111';
  const userB = 'user-b-2222-2222-2222-222222222222';

  it('strictly isolates records so user B cannot see user A records', async () => {
    // User A creates a record
    const recordA = await createPatientRecord(userA, {
      source: 'MANUAL',
      title: 'Confidential Cardiology Consultation',
      symptoms: 'Chest tightness under stress',
      severity: 'MILD',
      notes: 'Prescribed ECG check and stress test',
    });

    expect(recordA.user_id).toBe(userA);

    // User A queries vault -> gets record
    const vaultA = await getVaultData(userA);
    expect(vaultA.records.some((r) => r.id === recordA.id)).toBe(true);

    // User B queries vault -> MUST NOT see User A record
    const vaultB = await getVaultData(userB);
    expect(vaultB.records.some((r) => r.id === recordA.id)).toBe(false);
  });
});
