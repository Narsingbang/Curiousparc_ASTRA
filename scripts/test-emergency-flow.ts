async function run() {
  console.log('--- Testing Emergency Request Flow End-to-End ---');

  const emergencyPayload = {
    patient_name: 'Rajesh Kulkarni',
    phone: '9876543210',
    location_text: 'Deccan Gymkhana, Pune',
    lat: 18.5167,
    lng: 73.8415,
    notes: 'Severe crushing chest pain, difficulty breathing, suspected acute coronary syndrome',
  };

  console.log('1. Submitting emergency request to /api/emergency-requests...');
  const createRes = await fetch('http://localhost:4000/api/emergency-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emergencyPayload),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to submit emergency request: ${createRes.status} ${await createRes.text()}`);
  }

  const createdData = await createRes.json();
  console.log('Created request successfully:', {
    id: createdData.id,
    patient_name: createdData.patient_name,
    status: createdData.status,
    urgency: createdData.brief?.urgency,
    recommended_hospital: createdData.recommended_hospital?.name,
  });

  const requestId = createdData.id;

  console.log('\n2. Fetching /api/emergency-requests as driver (demo-token-ambulance)...');
  const feedRes = await fetch('http://localhost:4000/api/emergency-requests', {
    headers: { Authorization: 'Bearer demo-token-ambulance' },
  });

  if (!feedRes.ok) {
    throw new Error(`Driver feed fetch failed: ${feedRes.status} ${await feedRes.text()}`);
  }

  const feedData = await feedRes.json();
  const foundInFeed = feedData.requests.find((r: any) => r.id === requestId);
  if (!foundInFeed) {
    throw new Error(`Submitted request ${requestId} not found in driver feed! Total in feed: ${feedData.requests.length}`);
  }

  console.log('Found request in driver feed:', {
    id: foundInFeed.id,
    patient_name: foundInFeed.patient_name,
    status: foundInFeed.status,
    location: foundInFeed.location_text,
    assigned_hospital: foundInFeed.assigned_hospital_name || foundInFeed.hospitals?.name,
  });

  console.log('\n3. Testing legal status transition (PENDING -> ASSIGNED)...');
  const patchRes1 = await fetch(`http://localhost:4000/api/emergency-requests/${requestId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo-token-ambulance',
    },
    body: JSON.stringify({ status: 'ASSIGNED' }),
  });

  if (!patchRes1.ok) {
    throw new Error(`Transition to ASSIGNED failed: ${patchRes1.status} ${await patchRes1.text()}`);
  }

  const patchData1 = await patchRes1.json();
  console.log('Status updated to ASSIGNED:', patchData1.request.status);

  console.log('\n4. Testing ILLEGAL transition (ASSIGNED -> COMPLETED, should return 409 Conflict)...');
  const illegalRes = await fetch(`http://localhost:4000/api/emergency-requests/${requestId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo-token-ambulance',
    },
    body: JSON.stringify({ status: 'COMPLETED' }),
  });

  console.log(`Illegal transition response status: ${illegalRes.status} (expected 409)`);
  if (illegalRes.status !== 409) {
    throw new Error(`Expected 409 Conflict, got ${illegalRes.status}`);
  }
  const illegalJson = await illegalRes.json();
  console.log('Illegal transition rejection message:', illegalJson.error?.message || illegalJson.message);

  console.log('\n5. Advancing through legal state machine: ASSIGNED -> EN_ROUTE -> ARRIVED -> COMPLETED...');
  for (const nextStatus of ['EN_ROUTE', 'ARRIVED', 'COMPLETED']) {
    const stepRes = await fetch(`http://localhost:4000/api/emergency-requests/${requestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-token-ambulance',
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!stepRes.ok) {
      throw new Error(`Transition to ${nextStatus} failed: ${stepRes.status} ${await stepRes.text()}`);
    }
    const stepData = await stepRes.json();
    console.log(`Successfully transitioned to: ${stepData.request.status}`);
  }

  console.log('\n--- ALL EMERGENCY FLOW VERIFICATIONS PASSED ---');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
