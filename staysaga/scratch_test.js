const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env.local");
let supabaseUrl = "";
let supabaseServiceRole = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split("\n");
  for (const line of lines) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      if (key === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = val;
      if (key === "SUPABASE_SERVICE_ROLE_KEY") supabaseServiceRole = val;
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkHomestaySchema() {
  const { data, error } = await supabase
    .from("homestays")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Homestays schema columns:", Object.keys(data[0] || {}));
    console.log("Sample homestay row:", data[0]);
  }
}

checkHomestaySchema();
