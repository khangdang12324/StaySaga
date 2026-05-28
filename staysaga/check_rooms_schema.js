const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync(path.join(__dirname, ".env.local"), "utf-8");
const env = envContent.split("\n").reduce((acc, line) => {
  const [key, ...val] = line.split("=");
  if (key) acc[key.trim()] = val.join("=").trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select("*").limit(1);
  if (error) {
    console.log(`Table ${tableName}: ERROR - ${error.message} (${error.code})`);
  } else {
    console.log(`Table ${tableName}: EXISTS`);
  }
}

async function checkColumn(tableName, columnName) {
  const { data, error } = await supabase.from(tableName).select(columnName).limit(1);
  if (error) {
    console.log(`Column ${tableName}.${columnName}: ERROR - ${error.message} (${error.code})`);
  } else {
    console.log(`Column ${tableName}.${columnName}: EXISTS`);
  }
}

async function run() {
  await checkColumn("profiles", "preferences");
  await checkTable("support_tickets");
  await checkTable("travel_companions");
  await checkTable("privacy_requests");
  await checkTable("payment_methods");
}

run();
