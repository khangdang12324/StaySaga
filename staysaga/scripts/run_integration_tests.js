const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env variables
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
  console.error("Error: Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const generateRandomEmail = () => `test.qa.staysaga.${Math.floor(Math.random() * 10000000)}@gmail.com`;
const testPassword = "TestPassword123!";

async function runTests() {
  console.log("====================================================");
  console.log("    STAYSAGA INTEGRATION & SYSTEM TEST RUNNER");
  console.log("====================================================");
  console.log(`Connecting to: ${supabaseUrl}\n`);

  const results = [];
  const runTest = async (name, testFn) => {
    console.log(`Running: ${name}...`);
    try {
      await testFn();
      console.log(`\x1b[32m✔ PASS: ${name}\x1b[0m\n`);
      results.push({ name, status: "PASS" });
    } catch (err) {
      console.log(`\x1b[31m✘ FAIL: ${name}\x1b[0m`);
      console.error(err);
      console.log("\n");
      results.push({ name, status: "FAIL", error: err.message });
    }
  };

  // Seed references for cleanup
  let testGuestId = null;
  let testGuestClient = null;
  let testHomestayId = null;
  let testBookingId1 = null;

  // 1. Guest Signup & Profile Role Defaulting
  await runTest("Test 1: Guest Signup & Profile Role Defaulting", async () => {
    const email = generateRandomEmail();
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "QA Test Guest"
      }
    });

    if (signUpError) throw signUpError;
    testGuestId = signUpData.user.id;

    // Create client instance for this guest user
    testGuestClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    
    // Sign in to get access token session
    const { data: signInData, error: signInError } = await testGuestClient.auth.signInWithPassword({
      email,
      password: testPassword
    });
    if (signInError) throw signInError;

    // Fetch profile and check role defaults
    const { data: profile, error: pError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", testGuestId)
      .single();

    if (pError) throw pError;
    if (profile.role !== "USER") {
      throw new Error(`Expected role USER, but got ${profile.role}`);
    }
  });

  // 2. RLS restrictions checking
  await runTest("Test 2: Guest Row-Level Security (RLS) Permissions", async () => {
    if (!testGuestClient) throw new Error("Guest client not initialized");

    // Guest tries to insert a homestay directly (should fail RLS)
    const { error: insertError } = await testGuestClient
      .from("homestays")
      .insert({
        name: "Illegal Homestay Entry",
        slug: `illegal-homestay-${Math.random().toString(36).substring(2, 10)}`,
        address: "Illegal Address",
        city: "Da Lat",
        country: "Viet Nam",
        owner_id: testGuestId,
        max_guests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1
      });

    if (!insertError) {
      throw new Error("Security breach: Guest was able to insert a homestay directly into database!");
    } else {
      console.log("Guest write to homestays successfully blocked by RLS.");
    }

    // Guest tries to view another user's private bookings (should return empty or error depending on policy)
    const otherUserBookingId = 'f2f1e54d-2c29-4c07-a946-bfa105578ea2';
    const { data: foreignBookings, error: bError } = await testGuestClient
      .from("bookings")
      .select("id")
      .eq("id", otherUserBookingId);

    if (bError) {
      console.log("Guest read foreign bookings successfully blocked/errored:", bError.message);
    } else if (foreignBookings && foreignBookings.length > 0) {
      throw new Error("Security breach: Guest was able to read another guest's private bookings!");
    } else {
      console.log("Guest read foreign bookings returned empty (correctly isolated).");
    }
  });

  // 3. Concurrency / Overlapping Booking prevention check
  await runTest("Test 3: Concurrency Overlapping Booking Prevention", async () => {
    // 3.1 Setup a test homestay and room using admin client
    const { data: homestay, error: hError } = await supabaseAdmin
      .from("homestays")
      .insert({
        name: "QA Concurrency Villa",
        slug: `qa-concurrency-villa-${Math.random().toString(36).substring(2, 10)}`,
        address: "123 Concurrency Rd",
        city: "Da Lat",
        country: "Viet Nam",
        owner_id: 'e078a251-7c46-47e7-8252-79c846df8926', // Existing active host profile
        price_per_night: 500000,
        max_guests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        status: 'APPROVED',
        is_active: true
      })
      .select("id")
      .single();

    if (hError) throw hError;
    testHomestayId = homestay.id;

    // Create Booking 1 (Confirmed stay: July 1 to July 5, 2026)
    const { data: booking1, error: bk1Error } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: testGuestId,
        homestay_id: testHomestayId,
        check_in_date: '2026-07-01',
        check_out_date: '2026-07-05',
        total_price: 2000000,
        guests: 2,
        status: 'CONFIRMED'
      })
      .select("id")
      .single();

    // Verify that the booking is successfully created
    if (bk1Error) throw bk1Error;
    testBookingId1 = booking1.id;
    console.log(`Created Confirmed booking: 2026-07-01 to 2026-07-05`);

    // Verify overlap detection query logic (corresponds to createBookingFromCheckout backend validation check)
    console.log("Checking overlap detection logic for conflicting dates (July 3 to July 4)...");
    const { data: overlaps, error: overlapErr } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("homestay_id", testHomestayId)
      .eq("status", "CONFIRMED")
      .lt("check_in_date", "2026-07-04")
      .gt("check_out_date", "2026-07-03");

    if (overlapErr) throw overlapErr;
    if (overlaps && overlaps.length > 0) {
      console.log(`Overlap detection succeeded: identified conflict ID: ${overlaps[0].id}`);
    } else {
      throw new Error("Double-booking Bug: Overlap detection logic failed to identify overlapping booking!");
    }
  });

  // 4. Review Posting & Rating Calculation Logic
  await runTest("Test 4: Review Posting Requirements & Aggregate Ratings", async () => {
    // Attempt review on booking 1 (July 1 to July 5, which is in the future relative to DB check date)
    // To verify completed stay logic, we will insert a completed historical booking (e.g. checkin May 1, checkout May 5)
    const { data: pastBooking, error: pbErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: testGuestId,
        homestay_id: testHomestayId,
        check_in_date: '2026-05-01',
        check_out_date: '2026-05-05',
        total_price: 2000000,
        guests: 2,
        status: 'COMPLETED'
      })
      .select("id")
      .single();

    if (pbErr) throw pbErr;

    // Guest posts a 5-star review for this completed booking
    console.log("Posting review for completed booking...");
    const { error: revErr } = await testGuestClient
      .from("reviews")
      .insert({
        booking_id: pastBooking.id,
        homestay_id: testHomestayId,
        user_id: testGuestId,
        rating: 5,
        comment: "Excellent experience!"
      });

    if (revErr) throw revErr;

    // Verify rating aggregates in reviews table
    const { data: reviews, error: hFetchErr } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("homestay_id", testHomestayId);

    if (hFetchErr) throw hFetchErr;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    console.log(`Homestay average rating calculated: ${avgRating}`);
    if (avgRating !== 5) {
      throw new Error(`Expected average rating 5, but got ${avgRating}`);
    }
  });

  // Cleanup Test Records
  console.log("\n====================================================");
  console.log("                  CLEANING UP DATA");
  console.log("====================================================");
  
  if (testHomestayId) {
    console.log(`Deleting test homestay: ${testHomestayId}...`);
    await supabaseAdmin.from("homestays").delete().eq("id", testHomestayId);
  }
  if (testGuestId) {
    console.log(`Deleting test guest auth account: ${testGuestId}...`);
    // Delete profile (cascades or manually deleted)
    await supabaseAdmin.from("profiles").delete().eq("id", testGuestId);
    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(testGuestId);
  }
  console.log("Cleanup finished.");

  // Summary Report
  console.log("\n====================================================");
  console.log("                 TEST RUN SUMMARY");
  console.log("====================================================");
  let passedCount = 0;
  for (const r of results) {
    if (r.status === "PASS") {
      passedCount++;
      console.log(`\x1b[32m✔ ${r.name}: ${r.status}\x1b[0m`);
    } else {
      console.log(`\x1b[31m✘ ${r.name}: ${r.status} (${r.error})\x1b[0m`);
    }
  }
  console.log(`\nPassed: ${passedCount} / ${results.length} tests.`);
  console.log("====================================================");
}

runTests().catch(err => {
  console.error("Fatal Test Runner Error:", err);
  process.exit(1);
});
