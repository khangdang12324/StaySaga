import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { getHostDashboardData } from "@/core/host/actions";
import { ArrowRight, Check, Shield, CreditCard, Globe } from "lucide-react";

export default async function ListYourPropertyPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let hostHref = "/login?next=/host/list";
  let userName = "";
  let listings: Awaited<ReturnType<typeof getHostDashboardData>>["listings"] =
    [];
  if (session?.user) {
    const role = await getUserRole(supabase as any, session.user.id);
    hostHref = role === "host" || role === "admin" ? "/host" : "/host/onboard";
    userName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split("@")[0] ||
      "bạn";
    const hostData = await getHostDashboardData();
    listings = hostData.listings.slice(0, 2);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-rose-100 bg-white/90 text-gray-900 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">
            StaySaga<span className="text-rose-500">.</span>
          </h1>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-sm text-gray-600 hover:text-rose-600 transition-colors"
            >
              Already a partner? Sign in
            </Link>
            <Link
              href="#"
              className="text-sm text-gray-600 hover:text-rose-600 transition-colors"
            >
              Help
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-linear-to-br from-rose-50 via-white to-white">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,113,133,0.10),transparent_24%)]" />
          <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative z-10">
              <p className="uppercase text-sm tracking-[0.24em] text-rose-500 font-semibold mb-4">
                Join 29,279,209 other listings already on StaySaga
              </p>
              <h2 className="text-5xl md:text-6xl font-black leading-tight text-gray-950">
                {session?.user ? (
                  <>
                    Welcome back,{" "}
                    <span className="text-rose-500">{userName}</span>!
                  </>
                ) : (
                  <>
                    List your <span className="text-rose-500">property</span> on
                    StaySaga
                  </>
                )}
              </h2>
              <p className="mt-6 text-lg max-w-xl text-gray-600">
                {session?.user
                  ? 'It can take as little as 15 minutes to finish your listing - click "Continue" to start where you left off.'
                  : "List on one of the web's most loved travel apps to earn more, faster, and grow into new markets with a brand-first pink and white experience."}
              </p>
            </div>

            <div className="relative z-10">
              <div className="bg-white rounded-[28px] p-8 text-gray-900 shadow-2xl shadow-rose-100 border border-rose-100 w-full max-w-md ml-auto">
                {session?.user ? (
                  <>
                    <h3 className="text-xl font-bold mb-2">
                      Continue your registration
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Welcome back, {userName}!
                    </p>

                    <div className="max-h-70 overflow-auto pr-1 space-y-3">
                      {(listings.length > 0 ? listings : [null, null]).map(
                        (listing, index) => (
                          <div
                            key={listing?.id || `placeholder-${index}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-3 bg-white shadow-sm"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {listing?.name || "New property"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Last edited:{" "}
                                {listing?.created_at
                                  ? new Date(
                                      listing.created_at,
                                    ).toLocaleDateString("en-US", {
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "April 27, 2025"}
                              </p>
                            </div>
                            <Link
                              href={listing ? hostHref : "/host/onboard"}
                              className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 shrink-0"
                            >
                              Continue
                            </Link>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-sm font-semibold text-gray-800 mb-2">
                        Welcome back, {userName}!
                      </p>
                      <Link
                        href="/host/onboard"
                        className="inline-flex items-center justify-center gap-3 w-full rounded-full bg-rose-600 text-white py-3 font-semibold shadow-sm hover:bg-rose-700 transition-colors"
                      >
                        Create new listing <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold mb-3">
                      Register for free
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-rose-500 mt-1" /> 45% of
                        hosts get their first booking within a week
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-rose-500 mt-1" /> Choose
                        instant bookings or Request to Book
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-rose-500 mt-1" /> We&apos;ll
                        facilitate payments for you
                      </li>
                    </ul>

                    <Link
                      href={hostHref}
                      className="inline-flex items-center justify-center gap-3 w-full rounded-full bg-rose-600 text-white py-3 font-semibold shadow-sm hover:bg-rose-700 transition-colors"
                    >
                      Get started now <ArrowRight className="w-4 h-4" />
                    </Link>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <Link
                        href="/login?next=/host/list"
                        className="hover:text-rose-600 hover:underline"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        href="/register?next=/host/list"
                        className="hover:text-rose-600 hover:underline"
                      >
                        Tạo tài khoản mới
                      </Link>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                      Already started registration?{" "}
                      <Link
                        href="/host/onboard"
                        className="text-rose-600 font-medium"
                      >
                        Continue your registration
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl border border-rose-100 bg-white shadow-sm">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-rose-500" />
                <div>
                  <h4 className="font-bold">Host worry-free</h4>
                  <p className="text-sm text-gray-600">
                    Up to $1,000,000 liability protection and optional damage
                    protection options.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-rose-100 bg-white shadow-sm">
              <div className="flex items-start gap-4">
                <CreditCard className="w-8 h-8 text-rose-500" />
                <div>
                  <h4 className="font-bold">Payments made easy</h4>
                  <p className="text-sm text-gray-600">
                    We facilitate payouts and give you control over payout
                    methods and timing.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-rose-100 bg-white shadow-sm">
              <div className="flex items-start gap-4">
                <Globe className="w-8 h-8 text-rose-500" />
                <div>
                  <h4 className="font-bold">Reach global travelers</h4>
                  <p className="text-sm text-gray-600">
                    List on a marketplace that reaches millions of travelers
                    worldwide.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-4">Start fast</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl border border-rose-100 bg-white">
                <h4 className="font-semibold mb-2">Import property details</h4>
                <p className="text-sm text-gray-600">
                  Seamlessly import info from other sites and avoid
                  double-bookings.
                </p>
              </div>
              <div className="p-6 rounded-3xl border border-rose-100 bg-white">
                <h4 className="font-semibold mb-2">Use review scores</h4>
                <p className="text-sm text-gray-600">
                  Display review scores from other sites to build trust from day
                  one.
                </p>
              </div>
              <div className="p-6 rounded-3xl border border-rose-100 bg-white">
                <h4 className="font-semibold mb-2">Stand out</h4>
                <p className="text-sm text-gray-600">
                  New host badges and promotional tools help boost early
                  visibility.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-rose-50/60 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-xl font-bold mb-4">Questions answered</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
                When will my property go online? —{" "}
                <strong>Usually within 24 hours</strong>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
                What if the property is damaged? —{" "}
                <strong>We provide partner liability options</strong>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
                Need help? — <strong>Partner help center</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
