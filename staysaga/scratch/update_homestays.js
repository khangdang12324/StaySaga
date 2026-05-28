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

const updates = [
  {
    name: 'Carnival Hotel - Đà Lạt',
    latitude: 11.9416, // Center of Da Lat / hotel coordinate
    longitude: 108.4361,
  },
  {
    name: 'InterContinental Danang Sun Peninsula Resort',
    latitude: 16.1214,
    longitude: 108.2784,
  },
  {
    name: 'kkkk',
    latitude: 11.9542,
    longitude: 108.4452,
  },
  {
    name: 'QA Concurrency Villa',
    latitude: 11.9404,
    longitude: 108.4373,
  },
  {
    name: 'Phúc Khang Đặng Nguyễn',
    latitude: 10.8151,
    longitude: 106.6728,
  },
  {
    name: 'Đặng Khang',
    latitude: 10.8151,
    longitude: 106.6728,
  }
];

async function run() {
  console.log("Updating homestay coordinates in database...");
  for (const item of updates) {
    const { data, error } = await supabase
      .from("homestays")
      .update({ latitude: item.latitude, longitude: item.longitude })
      .eq("name", item.name);
    
    if (error) {
      console.error(`Error updating ${item.name}:`, error);
    } else {
      console.log(`Successfully updated ${item.name} with coordinates: ${item.latitude}, ${item.longitude}`);
    }
  }
}

run();
