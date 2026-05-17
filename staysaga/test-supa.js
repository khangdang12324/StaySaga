const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, email, role, status, created_at').limit(1);
  console.log("With specific columns:");
  console.log("Error:", error);
  
  const { data: data2, error: error2 } = await supabase.from('profiles').select('*').limit(1);
  console.log("\nWith *:");
  console.log("Error:", error2);
  console.log("Data sample:", data2);
}

test();
