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
  // Strategy: Instead of changing the enum, we'll add a separate column "is_host" boolean
  // to the profiles table, and use that to identify hosts.
  // But first, let's try to create a stored procedure via RPC to alter the enum.
  
  // Try to create a helper function that does ALTER TYPE
  console.log('=== Tạo function helper để ALTER TYPE ===');
  
  // Try creating a function via INSERT into pg_catalog (won't work with anon)
  // Instead, let's try the Supabase migrations table approach
  
  // Check if there's a way to run DDL via a custom function already in DB
  const { data: fnData, error: fnError } = await adminClient
    .from('pg_catalog.pg_proc')
    .select('proname')
    .eq('proname', 'add_partner_role')
    .limit(1);
  
  console.log('Function check:', fnError?.message || 'OK', fnData);
  
  // Alternative: Use profiles table with an extra TEXT column for role override
  console.log('\n=== Thử thêm cột is_host vào profiles ===');
  
  // Check current columns
  const { data: sample, error: sampleErr } = await adminClient
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (sampleErr) {
    console.error('Error:', sampleErr);
  } else {
    console.log('Current columns:', sample ? Object.keys(sample[0] || {}) : 'none');
  }
}

main().catch(console.error);
