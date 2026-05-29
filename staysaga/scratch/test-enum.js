const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const userId = 'd1ad441b-0220-4e92-a6f4-9ec268fc96bc';
  
  // Thử các giá trị enum khác nhau
  const values = ['host', 'HOST', 'partner', 'PARTNER', 'admin', 'ADMIN'];
  
  for (const val of values) {
    const { error } = await adminClient
      .from('profiles')
      .update({ role: val })
      .eq('id', userId);
    
    if (error) {
      console.log(`role='${val}' → LỖI: ${error.message}`);
    } else {
      console.log(`role='${val}' → THÀNH CÔNG ✓`);
      // Reset về USER
      await adminClient.from('profiles').update({ role: 'USER' }).eq('id', userId);
    }
  }

  // Xem profile cuối cùng
  const { data } = await adminClient.from('profiles').select('id, email, role').eq('id', userId).single();
  console.log('\nProfile cuối:', data);
}

run().catch(console.error);
