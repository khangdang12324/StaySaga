const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Tìm user pandorakhang@gmail.com
async function run() {
  console.log('=== SERVICE ROLE KEY check ===');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('Key starts with:', key?.substring(0, 30));
  console.log('Key length:', key?.length);

  // Lấy profile của pandorakhang
  const email = 'pandorakhang@gmail.com';
  const { data: profiles, error: profilesErr } = await adminClient
    .from('profiles')
    .select('id, email, role')
    .eq('email', email);

  console.log('\n=== Profile hiện tại ===');
  if (profilesErr) {
    console.error('Lỗi lấy profile:', profilesErr);
  } else {
    console.log('Profile:', JSON.stringify(profiles, null, 2));
  }

  if (!profiles || profiles.length === 0) {
    console.log('Không tìm thấy profile. Tìm qua auth.users...');
    // Thử tìm qua auth
    const { data: authUsers, error: authErr } = await adminClient.auth.admin.listUsers();
    if (authErr) {
      console.error('Lỗi lấy auth users:', authErr);
    } else {
      const user = authUsers.users.find(u => u.email === email);
      console.log('Auth user:', user ? { id: user.id, email: user.email } : 'Không tìm thấy');
      
      if (user) {
        // Thử upsert với admin client
        console.log('\n=== Thử upsert PARTNER với admin client ===');
        const { data: upsertData, error: upsertErr } = await adminClient
          .from('profiles')
          .upsert({ id: user.id, email: user.email, role: 'PARTNER' }, { onConflict: 'id' })
          .select('role')
          .single();
        
        if (upsertErr) {
          console.error('Upsert thất bại:', upsertErr);
        } else {
          console.log('Upsert thành công:', upsertData);
        }
      }
    }
    return;
  }

  const userId = profiles[0].id;
  console.log('User ID:', userId);

  // Thử update trực tiếp
  console.log('\n=== Thử UPDATE với admin client ===');
  const { data: updateData, error: updateErr } = await adminClient
    .from('profiles')
    .update({ role: 'PARTNER' })
    .eq('id', userId)
    .select('role')
    .single();

  if (updateErr) {
    console.error('Update thất bại:', updateErr);
  } else {
    console.log('Update thành công:', updateData);
  }

  // Thử upsert
  console.log('\n=== Thử UPSERT với admin client ===');
  const { data: upsertData, error: upsertErr } = await adminClient
    .from('profiles')
    .upsert({ id: userId, role: 'PARTNER' }, { onConflict: 'id' })
    .select('role')
    .single();

  if (upsertErr) {
    console.error('Upsert thất bại:', upsertErr);
  } else {
    console.log('Upsert thành công:', upsertData);
  }
}

run().catch(console.error);
