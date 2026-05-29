const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const userId = 'd1ad441b-0220-4e92-a6f4-9ec268fc96bc';

  console.log('=== Kiểm tra app_metadata hiện tại ===');
  const { data: userData, error } = await adminClient.auth.admin.getUserById(userId);
  if (error) {
    console.error('Lỗi:', error.message);
    return;
  }
  console.log('app_metadata:', userData?.user?.app_metadata);
  console.log('role từ app_metadata:', userData?.user?.app_metadata?.role);
  console.log('is_host:', userData?.user?.app_metadata?.is_host);

  // Simulate the new getUserRole logic
  const appMeta = userData?.user?.app_metadata;
  let role = 'USER';
  if (appMeta?.is_host === true) {
    role = 'PARTNER';
  } else if (appMeta?.role) {
    const r = String(appMeta.role).toUpperCase();
    if (r === 'ADMIN') role = 'ADMIN';
    else if (r === 'PARTNER' || r === 'HOST') role = 'PARTNER';
  }
  
  console.log('\n=== Kết quả getUserRole (sau khi sửa) ===');
  console.log('Role:', role);
  console.log('canAccessPartner:', role === 'PARTNER' || role === 'ADMIN');
  
  if (role === 'PARTNER') {
    console.log('\n✅ THÀNH CÔNG! User sẽ được nhận diện là HOST/PARTNER');
  } else {
    console.log('\n❌ Vẫn lỗi - role không phải PARTNER');
  }
}

main().catch(console.error);
