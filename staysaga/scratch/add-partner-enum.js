const fs = require('fs');
const https = require('https');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

// Extract project ref from URL
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Project ref:', projectRef);

// Use Supabase's REST SQL execution endpoint
const sql = `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PARTNER'`;

const body = JSON.stringify({ query: sql });

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log('Attempting via RPC...');
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(body);
req.end();
