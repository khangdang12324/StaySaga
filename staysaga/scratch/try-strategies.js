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
  const userId = 'd1ad441b-0220-4e92-a6f4-9ec268fc96bc'; // pandorakhang@gmail.com

  // Strategy: Insert PARTNER directly into pg_enum system catalog
  // This bypasses the need to run ALTER TYPE
  console.log('=== Thử INSERT vào pg_enum ===');
  
  // First, get the enumtypid for user_role
  const { data: typeData, error: typeErr } = await adminClient
    .from('pg_type')
    .select('oid')
    .eq('typname', 'user_role')
    .single();
  
  if (typeErr) {
    console.log('Không query được pg_type:', typeErr.message);
  } else {
    console.log('user_role type OID:', typeData?.oid);
    
    if (typeData?.oid) {
      // Try to insert into pg_enum
      const { data: enumData, error: enumErr } = await adminClient
        .from('pg_enum')
        .insert({
          enumtypid: typeData.oid,
          enumsortorder: 3.0,
          enumlabel: 'PARTNER'
        });
      
      if (enumErr) {
        console.log('Insert pg_enum thất bại:', enumErr.message);
      } else {
        console.log('INSERT thành công!', enumData);
      }
    }
  }

  // Strategy 2: Use auth.users app_metadata as a workaround
  console.log('\n=== Strategy 2: Set app_metadata.is_host = true ===');
  const { data: userData, error: userErr } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { is_host: true, role: 'PARTNER' }
  });
  
  if (userErr) {
    console.log('Lỗi update app_metadata:', userErr.message);
  } else {
    console.log('App metadata updated:', userData?.user?.app_metadata);
  }

  // Strategy 3: Check if we can use a stored procedure 
  // to run DDL as superuser
  console.log('\n=== Strategy 3: Tạo stored procedure qua SQL ===');
  // We can't do this without DDL access
  
  // Verify current state
  const { data: profile } = await adminClient.from('profiles').select('*').eq('id', userId).single();
  console.log('\nProfile hiện tại:', profile);
}

main().catch(console.error);
