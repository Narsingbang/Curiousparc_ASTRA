# Security Policy

## Reporting Security Vulnerabilities

The MediSync AI engineering team takes security and patient data privacy seriously. If you discover a vulnerability or potential security flaw, please report it immediately:

- **Email**: team-astra@vit.edu / bangnarsing283@gmail.com
- **Response Window**: Within 24 hours of notification

Please do **not** disclose security vulnerabilities publicly until an official remediation patch has been deployed.

## Security Architecture & Design Guarantees

1. **Patient Data Privacy & Redaction**
   - The Pino logging engine redacts all patient identifying fields (`req.body.password`, `req.body.message`, `req.body.notes`, `req.body.symptoms`, `req.body.phone`, `req.body.patient_name`, and request headers `req.headers.authorization`, `req.headers.cookie`).
   - Symptoms and clinical notes are never stored unencrypted or logged in application server telemetry.

2. **Server-Side Secret Isolation**
   - Critical secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`) are strictly maintained on the server/serverless layer and never shipped to client bundles or browser contexts.
   - Built-in verification (`npm run check:secrets`) guards against accidental secret exposure.

3. **Row-Level Security (RLS) & Access Control**
   - Multi-tenant data segregation with Postgres RLS ensures users can only read and write their own medical records.
   - Role-Based Access Control (RBAC) validates claims (`patient`, `ambulance`, `staff`) with server-side validation.
   - Hospital staff signup requires access-code verification using constant-time comparisons (`crypto.timingSafeEqual`).

4. **Clinical Disclaimer**
   - MediSync AI is an advisory and triage prioritization tool. It does **not** provide direct medical diagnoses or drug prescriptions.
   - For real-world emergencies in India, dial **112** (National Emergency) or **108** (Ambulance Service) immediately.
