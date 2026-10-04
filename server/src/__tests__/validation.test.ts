import { describe, it, expect } from 'vitest';
import {
  EmergencyRequestInputSchema,
  SignUpSchema,
  InventoryUpdateInputSchema,
} from '@medisync/shared';

describe('Shared Zod Schemas Validation', () => {
  it('validates correct Indian phone numbers', () => {
    const valid = EmergencyRequestInputSchema.safeParse({
      patient_name: 'Rushikesh Soni',
      phone: '+919876543210',
      location_text: 'VIT Pune, Bibwewadi Campus',
      notes: 'Chest discomfort',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    const invalid = EmergencyRequestInputSchema.safeParse({
      patient_name: 'Rushikesh Soni',
      phone: '12345',
      location_text: 'VIT Pune',
    });
    expect(invalid.success).toBe(false);
  });

  it('requires staff_code when role is staff in SignUp', () => {
    const withoutCode = SignUpSchema.safeParse({
      full_name: 'Dr. Test Staff',
      email: 'staff@test.com',
      password: 'Password123!',
      role: 'staff',
    });
    expect(withoutCode.success).toBe(false);

    const withCode = SignUpSchema.safeParse({
      full_name: 'Dr. Test Staff',
      email: 'staff@test.com',
      password: 'Password123!',
      role: 'staff',
      staff_code: 'MEDISYNC-STAFF-2026-ASTRA',
    });
    expect(withCode.success).toBe(true);
  });

  it('rejects inventory update where available exceeds total', () => {
    const invalid = InventoryUpdateInputSchema.safeParse({
      available: 25,
      total: 20,
    });
    expect(invalid.success).toBe(false);

    const valid = InventoryUpdateInputSchema.safeParse({
      available: 15,
      total: 20,
    });
    expect(valid.success).toBe(true);
  });
});
