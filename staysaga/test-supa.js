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
  const { data, error } = await supabase
    .from("homestays")
    .select("id, name, city, price_per_night, is_active, status, delete_reason, rejection_reason, created_at, owner:profiles!homestays_owner_id_fkey(full_name, email), homestay_images(url)")
    .eq("status", "DELETE_REQUESTED");
  console.log("Error:", error);
  console.log("Data:", data);
}

test();
