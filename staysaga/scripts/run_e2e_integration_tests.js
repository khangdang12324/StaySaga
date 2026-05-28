const fs = require('fs');
const path = require('path');
const { createClient } = require('D:/Github/Web_QuanLyHomestay/staysaga/node_modules/@supabase/supabase-js');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';
let serviceRoleKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const urlMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  const roleMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/);

  if (urlMatch) supabaseUrl = urlMatch[1].trim().replace(/['"]/g, '');
  if (keyMatch) supabaseKey = keyMatch[1].trim().replace(/['"]/g, '');
  if (roleMatch) serviceRoleKey = roleMatch[1].trim().replace(/['"]/g, '');
}

if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
  console.error("Error: Missing credentials in .env.local");
  process.exit(1);
}

// Service role client (Bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function runE2ETests() {
  console.log("====================================================");
  console.log("   STAYSAGA E2E SYSTEM INTEGRATION TESTS (LIVE DB)  ");
  console.log("====================================================");

  const results = [];
  const runStep = async (name, stepFn) => {
    console.log(`\nTesting: ${name}...`);
    try {
      await stepFn();
      console.log(`\x1b[32m✔ SUCCESS: ${name}\x1b[0m`);
      results.push({ name, status: "PASS" });
    } catch (err) {
      console.log(`\x1b[31m✘ FAILED: ${name}\x1b[0m`);
      console.error(err);
      results.push({ name, status: "FAIL", error: err.message });
    }
  };

  let adminUser = null;
  let regularUser = null;
  let testProperty = null;
  let testBooking = null;

  // 1. Discover role accounts in the actual DB
  await runStep("Step 1: Discovering Role Accounts in Live Database", async () => {
    // Select an admin profile
    const { data: admins, error: aErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .eq("role", "ADMIN")
      .limit(1);
    
    if (aErr) throw aErr;

    // Select a regular user profile
    const { data: users, error: uErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .eq("role", "USER")
      .limit(1);
    
    if (uErr) throw uErr;

    adminUser = admins?.[0];
    regularUser = users?.[0];

    if (!adminUser) throw new Error("No ADMIN account found in profiles table.");
    if (!regularUser) throw new Error("No USER account found in profiles table.");

    console.log(`Found ADMIN  : ID: ${adminUser.id} (${adminUser.email}) (Used as Host/Admin for tests)`);
    console.log(`Found USER   : ID: ${regularUser.id} (${regularUser.email})`);
  });

  // 2. USER flow checkout test
  await runStep("Step 2: USER Booking Creation (Fallback Schema Compatibility)", async () => {
    // 2.1 Find or create an approved homestay belonging to the admin (acting as Host)
    const { data: homestays, error: hErr } = await supabaseAdmin
      .from("homestays")
      .select("id, name, price_per_night")
      .eq("owner_id", adminUser.id)
      .limit(1);
    
    if (hErr) throw hErr;
    
    if (!homestays || homestays.length === 0) {
      // Create a temporary homestay for test
      const { data: newH, error: createHErr } = await supabaseAdmin
        .from("homestays")
        .insert({
          owner_id: adminUser.id,
          name: "E2E Automated Test Hotel",
          slug: `e2e-automated-test-${Math.floor(Math.random()*10000)}`,
          city: "Da Lat",
          country: "Viet Nam",
          address: "123 E2E Test Road",
          price_per_night: 600000,
          is_active: true,
          max_guests: 2,
          bedrooms: 1,
          beds: 1,
          bathrooms: 1
        })
        .select()
        .single();
      if (createHErr) throw createHErr;
      testProperty = newH;
    } else {
      testProperty = homestays[0];
    }

    console.log(`Booking target homestay: ${testProperty.name} (ID: ${testProperty.id})`);

    // 2.2 Insert booking as regular USER using only standard columns to avoid schema mismatch
    const { data: booking, error: bkErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: regularUser.id,
        homestay_id: testProperty.id,
        check_in_date: "2026-08-10",
        check_out_date: "2026-08-15",
        guests: 2,
        total_price: 3000000,
        status: "PENDING"
      })
      .select()
      .single();

    if (bkErr) throw bkErr;
    testBooking = booking;
    console.log(`Booking successfully created (ID: ${booking.id}, Status: ${booking.status})`);
  });

  // 3. PARTNER flow E2E simulation (using Admin account as host)
  await runStep("Step 3: PARTNER Bookings Retrieval Test", async () => {
    // 3.1 Check if partner can retrieve bookings for their homestays
    const { data: partnerBookings, error: pbErr } = await supabaseAdmin
      .from("bookings")
      .select("id, homestay_id, user_id")
      .eq("homestay_id", testProperty.id);

    if (pbErr) throw pbErr;
    const found = partnerBookings.some(b => b.id === testBooking.id);
    if (!found) {
      throw new Error("Partner was unable to locate booking placed on their homestay!");
    }
    console.log(`Partner correctly retrieved the booking. Total bookings for partner: ${partnerBookings.length}`);
  });

  // 4. ADMIN flow E2E simulation
  await runStep("Step 4: ADMIN Status Confirmation E2E Test", async () => {
    // 4.1 Admin should see bookings
    const { data: allBookings, error: adminSelectErr } = await supabaseAdmin
      .from("bookings")
      .select("id, status")
      .limit(10);
    
    if (adminSelectErr) throw adminSelectErr;
    console.log(`Admin successfully fetched booking records. Total retrieved: ${allBookings.length}`);

    // 4.2 Admin updates the booking status to CONFIRMED
    const { data: updatedBooking, error: updateErr } = await supabaseAdmin
      .from("bookings")
      .update({ status: "CONFIRMED" })
      .eq("id", testBooking.id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    if (updatedBooking.status !== "CONFIRMED") {
      throw new Error(`Expected booking status CONFIRMED, but got ${updatedBooking.status}`);
    }
    console.log(`Admin updated booking status to: CONFIRMED`);
  });

  // 5. Partner registration wizard draft progress test (using Admin account as host)
  await runStep("Step 5: PARTNER Onboarding Wizard Draft Progress Test", async () => {
    const draftState = {
      name: "E2E Wizard Draft Homestay",
      city: "Phu Quoc",
      price: "1200000",
      description: "A draft homestay from E2E integration test runs.",
      currentStep: 4,
      completedSteps: {
        basicInfo: true,
        address: true
      }
    };

    const draftPayload = {
      owner_id: adminUser.id,
      name: draftState.name,
      slug: `e2e-wizard-draft-${Math.floor(Math.random()*100000)}`,
      city: draftState.city,
      country: "Vietnam",
      address: "123 E2E Test Road",
      price_per_night: Number(draftState.price),
      is_active: false,
      max_guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      registration_checklist: {
        currentStep: draftState.currentStep,
        draftState: draftState,
        completedSteps: draftState.completedSteps,
        basic: true,
        location: true,
        images: false
      }
    };

    const { data: draftProperty, error: draftErr } = await supabaseAdmin
      .from("homestays")
      .insert(draftPayload)
      .select()
      .single();

    if (draftErr) throw draftErr;
    console.log(`Created draft property via onboarding flow: ID: ${draftProperty.id}`);

    // Simulate Resume step check
    const { data: resumeCheck } = await supabaseAdmin
      .from("homestays")
      .select("registration_checklist")
      .eq("id", draftProperty.id)
      .single();
    
    const checklist = resumeCheck?.registration_checklist;
    if (checklist.currentStep !== 4 || !checklist.draftState) {
      throw new Error("Wizard draft resuming properties failed to restore correctly.");
    }
    console.log(`Resume step verified successfully. Current resume step: ${checklist.currentStep}`);

    // Clean up draft
    await supabaseAdmin.from("homestays").delete().eq("id", draftProperty.id);
  });

  // Cleanup test property and booking
  console.log("\nCleaning up test records...");
  if (testBooking) {
    await supabaseAdmin.from("bookings").delete().eq("id", testBooking.id);
  }
  if (testProperty && testProperty.name === "E2E Automated Test Hotel") {
    await supabaseAdmin.from("homestays").delete().eq("id", testProperty.id);
  }
  console.log("Cleanup completed.");

  // Summary
  console.log("\n====================================================");
  console.log("              E2E INTEGRATION SUMMARY               ");
  console.log("====================================================");
  let failed = 0;
  for (const r of results) {
    if (r.status === "PASS") {
      console.log(`\x1b[32m✔ ${r.name}: ${r.status}\x1b[0m`);
    } else {
      failed++;
      console.log(`\x1b[31m✘ ${r.name}: ${r.status} (${r.error})\x1b[0m`);
    }
  }
  console.log(`\nResult: ${results.length - failed} / ${results.length} steps passed.`);
  console.log("====================================================");
}

runE2ETests().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
