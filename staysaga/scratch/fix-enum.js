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
  // Step 1: Xem các giá trị enum hiện tại
  console.log('=== 1. Kiểm tra enum user_role hiện tại ===');
  const { data: enumData, error: enumErr } = await adminClient.rpc('exec_sql', {
    sql: "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' ORDER BY e.enumsortorder"
  });
  
  if (enumErr) {
    console.log('Không thể dùng rpc exec_sql, thử cách khác...');
  } else {
    console.log('Enum values:', enumData);
  }

  // Step 2: Thêm PARTNER vào enum
  console.log('\n=== 2. Thêm PARTNER vào enum ===');
  const sql1 = `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PARTNER'`;
  const { error: addErr } = await adminClient.rpc('exec_sql', { sql: sql1 }).catch(() => ({ error: { message: 'rpc not available' } }));
  
  if (addErr) {
    console.log('RPC exec_sql không tồn tại. Cần chạy SQL qua Supabase Dashboard.');
    console.log('\n=== SQL cần chạy trong Supabase SQL Editor ===');
    console.log(`
-- 1. Xem enum values hiện tại:
SELECT enumlabel FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'user_role' 
ORDER BY e.enumsortorder;

-- 2. Thêm PARTNER (chạy riêng từng câu):
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PARTNER';

-- 3. Sau khi commit transaction (reconnect), migrate data:
UPDATE public.profiles
SET role = 'PARTNER'::user_role
WHERE role::text IN ('host', 'HOST');

-- 4. Kiểm tra:
SELECT role, count(*) FROM public.profiles GROUP BY role;
    `);
  }

  // Thử check bằng cách lấy thông tin từ information schema
  console.log('\n=== 3. Kiểm tra column type ===');
  const { data: colData, error: colErr } = await adminClient
    .from('profiles')
    .select('id, role')
    .limit(3);
  
  if (colErr) {
    console.error('Lỗi:', colErr);
  } else {
    console.log('Sample profiles:', colData);
  }
}

run().catch(console.error);
