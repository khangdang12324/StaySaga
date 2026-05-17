import { createAdminClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export async function getAdminDashboardStats() {
  const supabase = await createAdminClient();

  const [
    { count: totalUsers },
    { count: totalCustomers },
    { count: totalPartners },
    { count: totalAdmins },
    { count: totalHomestays },
    { count: pendingHomestays },
    { count: approvedHomestays },
    { count: totalBookings },
    { count: totalReviews },
    { count: hiddenReviews },
    { count: confirmedBookings },
    { count: cancelledBookings },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "USER"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "PARTNER"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "ADMIN"),
    supabase.from("homestays").select("*", { count: "exact", head: true }),
    supabase.from("homestays").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("homestays").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }).in("status", ["HIDDEN", "REPORTED"]),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "CONFIRMED"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "CANCELLED"),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: newBookingsToday } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  // Revenue calculation
  let revenue = 0;
  // First try payments table if it exists
  const { data: paymentsData, error: paymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("status", "PAID");

  if (!paymentsError && paymentsData && paymentsData.length > 0) {
    revenue = paymentsData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  } else {
    // Fallback to bookings total_price
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("total_price")
      .in("status", ["CONFIRMED", "COMPLETED"]);

    if (bookingsData && bookingsData.length > 0) {
      revenue = bookingsData.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    }
  }

  return {
    totalUsers: totalUsers || 0,
    totalCustomers: totalCustomers || 0,
    totalPartners: totalPartners || 0,
    totalAdmins: totalAdmins || 0,
    totalHomestays: totalHomestays || 0,
    pendingHomestays: pendingHomestays || 0,
    approvedHomestays: approvedHomestays || 0,
    totalBookings: totalBookings || 0,
    newBookingsToday: newBookingsToday || 0,
    confirmedBookings: confirmedBookings || 0,
    cancelledBookings: cancelledBookings || 0,
    totalReviews: totalReviews || 0,
    hiddenReviews: hiddenReviews || 0,
    revenue,
  };
}

export async function getRecentBookings(limit = 5) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, profiles(full_name, email), homestays(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent bookings:", error);
    return [];
  }
  return data || [];
}

export async function getPendingAdminTasks() {
  const supabase = await createAdminClient();

  const [
    { count: pendingHomestays },
    { count: negativeReviews },
    { count: supportTickets },
  ] = await Promise.all([
    supabase.from("homestays").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("reviews").select("*", { count: "exact", head: true }).lte("rating", 3),
    // Fallback to 0 if support_tickets table doesn't exist
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).then(res => res.error ? { count: 0 } : res),
  ]);

  return {
    pendingHomestays: pendingHomestays || 0,
    negativeReviews: negativeReviews || 0,
    supportTickets: supportTickets || 0,
  };
}

export async function getBookingsLast7Days() {
  const supabase = await createAdminClient();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const { data } = await supabase
    .from("bookings")
    .select("created_at")
    .gte("created_at", days[0].toISOString());

  const counts = Array(7).fill(0);
  const labels = days.map(d => format(d, "EEE")); // T2, T3...

  if (data) {
    data.forEach(b => {
      const bDate = new Date(b.created_at);
      bDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(bDate.getTime() - days[0].getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        counts[diffDays]++;
      }
    });
  }

  // Convert English days to Vietnamese
  const vnLabels = labels.map(l => {
    const map: Record<string, string> = { "Mon": "T2", "Tue": "T3", "Wed": "T4", "Thu": "T5", "Fri": "T6", "Sat": "T7", "Sun": "CN" };
    return map[l] || l;
  });

  return { counts, labels: vnLabels };
}
