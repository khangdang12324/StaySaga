const fs = require('fs');
const https = require('https');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Project:', projectRef);

// Try the pg endpoint
function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/pg',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Try via db endpoint
function runSQLViaDB(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: `db.${projectRef}.supabase.co`,
      port: 443,
      path: '/sql',
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  const sql = `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PARTNER'`;
  
  console.log('\n--- Thử /pg endpoint ---');
  const r1 = await runSQL(sql);
  console.log('Status:', r1.status, '| Body:', r1.body.substring(0, 200));
  
  console.log('\n--- Thử db.PROJECT.supabase.co/sql ---');
  const r2 = await runSQLViaDB(sql);
  console.log('Status:', r2.status, '| Body:', r2.body.substring(0, 200));
}

main().catch(console.error);
