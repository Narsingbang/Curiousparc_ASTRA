import { describe, it, expect } from 'vitest';
import { scanRedFlags } from '../services/redFlags';

describe('Red Flags Detection Service', () => {
  it('detects emergency cardiac keywords in English', () => {
    const res = scanRedFlags('I have crushing chest pain radiating to arm');
    expect(res.hasRedFlag).toBe(true);
    expect(res.detectedFlags).toContain('chest pain');
    expect(res.detectedFlags).toContain('crushing pain');
  });

  it('detects cardiac keywords in Hindi / transliteration', () => {
    const res = scanRedFlags('Mujhe seene me dard ho raha hai bahut zor se');
    expect(res.hasRedFlag).toBe(true);
    expect(res.detectedFlags).toContain('seene me dard');
  });

  it('detects breathing difficulty in English and Marathi', () => {
    const res1 = scanRedFlags('Sudden shortness of breath and cannot breathe');
    expect(res1.hasRedFlag).toBe(true);
    expect(res1.detectedFlags).toContain('shortness of breath');

    const res2 = scanRedFlags('Mala shwas ghene madhe tras hoto');
    expect(res2.hasRedFlag).toBe(true);
    expect(res2.detectedFlags).toContain('shwas ghene');
  });

  it('detects stroke symptoms', () => {
    const res = scanRedFlags('My face is drooping and I have slurred speech');
    expect(res.hasRedFlag).toBe(true);
    expect(res.detectedFlags).toContain('face drooping');
    expect(res.detectedFlags).toContain('slurred speech');
  });

  it('detects severe bleeding and coughing blood', () => {
    const res = scanRedFlags('Patient is vomiting blood after severe accident');
    expect(res.hasRedFlag).toBe(true);
    expect(res.detectedFlags).toContain('vomiting blood');
  });

  it('detects self-harm expressions and flags isSelfHarm', () => {
    const res = scanRedFlags('I feel so hopeless and I want to die');
    expect(res.hasRedFlag).toBe(true);
    expect(res.isSelfHarm).toBe(true);
  });

  it('detects Hindi/Marathi self-harm transliteration (aatmahatya / khudkushi)', () => {
    const res = scanRedFlags('khudkushi karne ka man ho raha hai');
    expect(res.hasRedFlag).toBe(true);
    expect(res.isSelfHarm).toBe(true);
  });

  it('does NOT trigger red flag on harmless mild symptoms', () => {
    const res = scanRedFlags('I have a mild runny nose and sneezing for two days');
    expect(res.hasRedFlag).toBe(false);
    expect(res.detectedFlags.length).toBe(0);
    expect(res.isSelfHarm).toBe(false);
  });

  it('handles empty or blank text safely', () => {
    const res = scanRedFlags('');
    expect(res.hasRedFlag).toBe(false);
    expect(res.detectedFlags.length).toBe(0);
  });
});
