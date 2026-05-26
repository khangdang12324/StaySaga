const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = envContent.split('\n').reduce((acc, line) => {
  const parts = line.split('=');
  const key = parts[0]?.trim();
  const val = parts.slice(1).join('=').trim();
  if (key) acc[key] = val;
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Fetching homestays latitude/longitude...");
  const { data: homestays, error } = await supabase
    .from("homestays")
    .select("id, name, latitude, longitude, address, city");
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Homestays details:", homestays);
  }
}

test();
