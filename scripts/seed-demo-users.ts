import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.DEMO_PASSWORD || 'DemoPassword123!';

if (!supabaseUrl || !serviceKey || supabaseUrl.includes('YOUR-PROJECT-REF')) {
  console.log('ℹ️  Supabase URL/Key is not yet set in .env. Skipping remote user seeding.');
  console.log('   (In-memory demo users are automatically active in development mode).');
  process.exit(0);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedDemoUsers() {
  console.log('🌱 Seeding demo accounts into Supabase...');

  const users = [
    {
      email: 'patient@medisync.demo',
      password: demoPassword,
      full_name: 'Rushikesh Soni (Demo Patient)',
      role: 'patient',
      phone: '+919876543210',
      blood_group: 'O+',
      allergies: ['Penicillin'],
      chronic_conditions: ['Mild Asthma'],
    },
    {
      email: 'driver@medisync.demo',
      password: demoPassword,
      full_name: 'Pawan Paramedic (Unit 108)',
      role: 'ambulance',
      phone: '+919876543212',
      allergies: [],
      chronic_conditions: [],
    },
    {
      email: 'staff@medisync.demo',
      password: demoPassword,
      full_name: 'Dr. Ananya Sharma (Hospital Staff)',
      role: 'staff',
      phone: '+919876543213',
      allergies: [],
      chronic_conditions: [],
    },
  ];

  // Fetch MediSync Central Hospital ID
  let hospitalId: string | null = null;
  const { data: hospital } = await supabaseAdmin
    .from('hospitals')
    .select('id')
    .ilike('name', '%MediSync Central Hospital%')
    .maybeSingle();

  if (hospital?.id) {
    hospitalId = hospital.id;
  } else {
    const { data: newHosp } = await supabaseAdmin
      .from('hospitals')
      .insert({
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'MediSync Central Hospital',
        city: 'Pune',
        address: 'Shivajinagar, Pune',
        lat: 18.5308,
        lng: 73.8475,
        phone: '+912012345678',
      })
      .select('id')
      .single();
    hospitalId = newHosp?.id || 'a0000000-0000-0000-0000-000000000001';
  }
  console.log(`🏥 MediSync Central Hospital linked: ${hospitalId}`);

  for (const u of users) {
    console.log(`👤 Processing ${u.email}...`);

    // Create or find user
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        full_name: u.full_name,
        role: u.role,
      },
    });

    let userId = created?.user?.id;

    if (error && error.message.includes('already registered')) {
      const { data: existingList } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingList.users.find((eu) => eu.email === u.email);
      userId = existingUser?.id;
    }

    if (userId) {
      // Update profile
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          full_name: u.full_name,
          role: u.role as any,
          hospital_id: u.role === 'staff' ? hospitalId : null,
          phone: u.phone,
          blood_group: u.blood_group as any,
          allergies: u.allergies,
          chronic_conditions: u.chronic_conditions,
        });

      console.log(`✅ User ${u.email} configured with role ${u.role}.`);
    }
  }

  console.log('🎉 Demo users seeding completed successfully!');
}

seedDemoUsers().catch((err) => {
  console.error('Error seeding demo users:', err);
  process.exit(1);
});
