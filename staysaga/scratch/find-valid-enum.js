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
  
  // Thử tất cả giá trị có thể để tìm đúng enum values
  const values = ['host', 'HOST', 'partner', 'PARTNER', 'guest', 'GUEST', 'USER', 'ADMIN', 'user', 'admin'];
  
  console.log('=== Tìm giá trị enum hợp lệ ===');
  const validValues = [];
  for (const val of values) {
    const { error } = await adminClient
      .from('profiles')
      .update({ role: val })
      .eq('id', userId);
    
    if (error) {
      console.log(`'${val}' → LỖI: ${error.message}`);
    } else {
      console.log(`'${val}' → ✓ HỢP LỆ`);
      validValues.push(val);
      // Reset
      await adminClient.from('profiles').update({ role: 'USER' }).eq('id', userId);
    }
  }

  console.log('\n=== Tóm tắt giá trị hợp lệ ===');
  console.log('Valid:', validValues);
}

run().catch(console.error);
