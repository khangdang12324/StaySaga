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
  
  // Kiểm tra hiện tại: sau khi sửa code, 'host' có hoạt động không?
  console.log('=== Thử set role = host ===');
  const { data, error } = await adminClient
    .from('profiles')
    .update({ role: 'host' })
    .eq('id', userId)
    .select('role')
    .single();
  
  if (error) {
    console.log('Lỗi host:', error.message);
    console.log('\n=== CẦN CHẠY SQL NÀY TRONG SUPABASE SQL EDITOR ===');
    console.log('URL: https://supabase.com/dashboard/project/aantwaojlcnshmqqgcyv/sql/new');
    console.log(`
-- Bước 1: Xem enum hiện tại
SELECT enumlabel, enumsortorder 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'user_role'
ORDER BY enumsortorder;

-- Bước 2: Chạy RIÊNG LỆNH NÀY (phải commit xong mới dùng được giá trị mới)
ALTER TYPE user_role ADD VALUE 'PARTNER';

-- Bước 3: Chạy sau khi Bước 2 thành công (trong connection/query mới)
UPDATE public.profiles
SET role = 'PARTNER'::user_role
WHERE role::text = 'host';
    `);
  } else {
    console.log('Thành công! role =', data?.role);
    // Reset
    await adminClient.from('profiles').update({ role: 'USER' }).eq('id', userId);
  }
}

run().catch(console.error);
