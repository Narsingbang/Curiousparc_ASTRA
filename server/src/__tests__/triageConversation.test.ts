import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Triage Conversation & Non-Repetition Suite', () => {
  it('rejects a triage message with an invalid session_token with 401 Unauthorized', async () => {
    // Start session
    const res1 = await request(app)
      .post('/api/triage/message')
      .send({ message: 'I have a mild cough' });

    expect(res1.status).toBe(200);
    const { session_id } = res1.body;
    expect(session_id).toBeDefined();

    // Send next turn with corrupted / wrong token
    const res2 = await request(app)
      .post('/api/triage/message')
      .send({
        session_id,
        session_token: 'invalid-tampered-token-12345',
        message: 'I have had it for 3 days',
      });

    expect(res2.status).toBe(401);
    expect(res2.body.error).toBeDefined();
    expect(res2.body.error.code).toBe('UNAUTHORIZED');
  }, 60000);

  it('conducts a 4-message conversation producing different replies and ending in COMPLETE after at most 3 follow-ups', async () => {
    // Message 1
    const res1 = await request(app)
      .post('/api/triage/message')
      .send({ message: 'I have a scratchy sore throat' });

    expect(res1.status).toBe(200);
    const sessionId = res1.body.session_id;
    const sessionToken = res1.body.session_token;
    expect(sessionId).toBeDefined();
    expect(sessionToken).toBeDefined();

    // Message 2
    const res2 = await request(app)
      .post('/api/triage/message')
      .send({
        session_id: sessionId,
        session_token: sessionToken,
        message: 'It started yesterday morning',
      });

    expect(res2.status).toBe(200);
    expect(res2.body.session_id).toBe(sessionId);

    // Message 3
    const res3 = await request(app)
      .post('/api/triage/message')
      .send({
        session_id: sessionId,
        session_token: sessionToken,
        message: 'Discomfort is around 4 out of 10, no breathing trouble',
      });

    expect(res3.status).toBe(200);
    expect(res3.body.session_id).toBe(sessionId);

    // Message 4
    const res4 = await request(app)
      .post('/api/triage/message')
      .send({
        session_id: sessionId,
        session_token: sessionToken,
        message: 'No other symptoms like rash or vomiting',
      });

    expect(res4.status).toBe(200);
    expect(res4.body.session_id).toBe(sessionId);

    // After at most 3 follow-ups, Turn 4 must be COMPLETE with routed doctor and assessment
    expect(res4.body.status).toBe('COMPLETE');
    expect(res4.body.assessment).toBeDefined();
    expect(res4.body.routed_doctor).toBeDefined();

    // Verify all assistant replies are different (no repetitive response loops)
    const assistantReplies = [
      res1.body.assistant_message,
      res2.body.assistant_message,
      res3.body.assistant_message,
      res4.body.assistant_message,
    ];

    const uniqueReplies = new Set(assistantReplies);
    expect(uniqueReplies.size).toBe(4);
  }, 60000);
});
