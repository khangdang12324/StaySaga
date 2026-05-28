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
  console.log("Fetching booking details...");
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*, homestay:homestays(*)");
  
  if (error) {
    console.error("Error:", error);
  } else {
    bookings.forEach(b => {
      console.log(`Booking ID: ${b.id}`);
      console.log(`Homestay: ${b.homestay?.name}`);
      console.log(`Lat: ${b.homestay?.latitude}, Lng: ${b.homestay?.longitude}`);
      console.log(`Address: ${b.homestay?.address}, City: ${b.homestay?.city}`);
      console.log("-------------------");
    });
  }
}

test();
