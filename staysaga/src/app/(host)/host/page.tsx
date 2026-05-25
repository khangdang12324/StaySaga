import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Download,
  Eye,
  ListChecks,
  MessageCircle,
  Search,
  Settings2,
  Star,
  XCircle,
} from "lucide-react";
import { HostExtranetShell } from "./_components/HostExtranetShell";
import { DeletePropertyButton } from "./_components/DeletePropertyButton";
import { DeleteRegistrationButton } from "./_components/DeleteRegistrationButton";
import { getHostDashboardData } from "@/core/host/actions";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { RealtimeSubscription } from "@/components/realtime/RealtimeSubscription";

type DashboardListing = Awaited<
  ReturnType<typeof getHostDashboardData>
>["listings"][number];

const hiddenRegistrationStatuses = new Set<string>([
  "DELETED",
  "DELETE_REQUESTED",
]);

const placeholderNames = new Set([
  "ChÃ¡Â»â€” nghÃ¡Â»â€° chÃ†Â°a Ã„â€˜Ã¡ÂºÂ·t tÃƒÂªn",
  "Cho nghi chua dat ten",
  "Chá»— nghá»‰ chÆ°a Ä‘áº·t tÃªn",
  "Chá»— nghá»‰ chÆ°a Ä‘áº·t tÃªn",
]);

const hasPositiveNumber = (value: unknown) => Number(value || 0) > 0;

const hasRealName = (item: DashboardListing) => {
  const name = item.name?.trim();
  return Boolean(name && !placeholderNames.has(name));
};

const getRegistrationProgress = (item: DashboardListing) => {
  if (item.status === "APPROVED" && item.is_active) return 100;

  let score = 0;
  if (hasRealName(item)) score += 10;
  if (item.description?.trim()) score += 10;
  if (item.address?.trim()) score += 15;
  if (item.city?.trim() && item.country?.trim()) score += 10;
  if (hasPositiveNumber(item.max_guests) && hasPositiveNumber(item.bathrooms)) score += 10;
  if (hasPositiveNumber(item.bedrooms) && hasPositiveNumber(item.beds)) score += 15;
  if (hasPositiveNumber(item.price_per_night)) score += 15;
  if (item.homestay_images?.length) score += 15;
  if (item.status === "PENDING") score = Math.max(score, 90);

  return Math.min(99, Math.max(5, score));
};

const getRegistrationStep = (item: DashboardListing) => {
  if (!hasRealName(item)) return "name";
  if (!item.address?.trim() || !item.city?.trim() || !item.country?.trim()) {
    return "address";
  }
  if (!hasPositiveNumber(item.max_guests) || !hasPositiveNumber(item.bathrooms)) {
    return "details";
  }
  if (!hasPositiveNumber(item.bedrooms) || !hasPositiveNumber(item.beds)) {
    return "bedroom";
  }
  if (!item.homestay_images?.length) return "photos";
  if (!hasPositiveNumber(item.price_per_night)) return "price";
  return "review";
};

const getContinueRegistrationHref = (item: DashboardListing) =>
  `/host/register?propertyId=${item.id}&step=${getRegistrationStep(item)}`;

type HostPageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

const successMessages: Record<string, string> = {
  created: "Ä Ã£ gá»­i chá»— nghá»‰ Ä‘á»ƒ chá»  duyá»‡t.",
  updated: "Ä Ã£ cáº­p nháº­t chá»— nghá»‰.",
  closed: "Ä Ã£ táº¡m Ä‘Ã³ng chá»— nghá»‰.",
  opened: "Ä Ã£ má»Ÿ láº¡i chá»— nghá»‰.",
  delete_requested: "Ä Ã£ gá»­i yÃªu cáº§u xÃ³a chá»— nghá»‰ Ä‘áº¿n quáº£n trá»‹ viÃªn.",
  registration_deleted: "Ã„Â ÃƒÂ£ xÃƒÂ³a Ã„â€˜Ã„Æ’ng kÃƒÂ½ chÃ¡Â»â€” nghÃ¡Â»â€°.",
};

const errorMessages: Record<string, string> = {
  invalid:
    "Thiáº¿u tÃªn, thÃ nh phá»‘, Ä‘á»‹a chá»‰ hoáº·c giÃ¡ má»—i Ä‘Ãªm. HÃ£y kiá»ƒm tra láº¡i biá»ƒu máº«u.",
  image_count: "Cáº§n Ã­t nháº¥t 1 áº£nh Ä‘áº¡i diá»‡n trÆ°á»›c khi gá»­i duyá»‡t.",
  image_type: "Chá»‰ há»— trá»£ áº£nh PNG, JPG, WEBP hoáº·c GIF.",
  image_size: "CÃ³ áº£nh vÆ°á»£t quÃ¡ dung lÆ°á»£ng 5MB.",
  create_failed:
    "ChÆ°a lÆ°u Ä‘Æ°á»£c chá»— nghá»‰ vÃ o Supabase. HÃ£y kiá»ƒm tra migration, RLS vÃ  service role key.",
  update_failed: "ChÆ°a cáº­p nháº­t Ä‘Æ°á»£c chá»— nghá»‰.",
  status_update_failed: "ChÆ°a cáº­p nháº­t Ä‘Æ°á»£c tráº¡ng thÃ¡i chá»— nghá»‰.",
  not_found: "KhÃ´ng tÃ¬m tháº¥y chá»— nghá»‰.",
  forbidden: "Báº¡n khÃ´ng cÃ³ quyá» n thao tÃ¡c chá»— nghá»‰ nÃ y.",
  blocked_property: "Chá»— nghá»‰ Ä‘ang bá»‹ khÃ³a hoáº·c Ä‘Ã£ xÃ³a má» m.",
  delete_pending: "Chá»— nghá»‰ Ä‘ang chá»  quáº£n trá»‹ viÃªn xá»­ lÃ½ yÃªu cáº§u xÃ³a.",
  delete_request_invalid:
    "Vui lÃ²ng nháº­p lÃ½ do xÃ³a vÃ  xÃ¡c nháº­n trÆ°á»›c khi gá»­i yÃªu cáº§u.",
  checklist_incomplete:
    "ChÆ°a Ä‘á»§ checklist Ä‘á»ƒ gá»­i duyá»‡t. Cáº§n cÃ³ áº£nh, phÃ²ng/loáº¡i cÄƒn vÃ  giÃ¡ há»£p lá»‡.",
  verification_incomplete:
    "ChÆ°a Ä‘á»§ thÃ´ng tin xÃ¡c minh. HÃ£y nháº­p tÃªn chá»§ sá»Ÿ há»¯u, sá»‘ Ä‘iá»‡n thoáº¡i vÃ  email liÃªn há»‡.",
};

export default async function HostDashboardPage({
  searchParams,
}: HostPageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host");

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const params = await searchParams;
  const { listings, pendingBookings } = await getHostDashboardData();
  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "TÃ i khoáº£n Ä‘á»‘i tÃ¡c";
  const activeListings = listings.filter(
    (item) =>
      item.status === "APPROVED" &&
      item.is_active &&
      !hiddenRegistrationStatuses.has(item.status || ""),
  );
  const notOnBookingListings = listings.filter(
    (item) =>
      !hiddenRegistrationStatuses.has(item.status || "") &&
      !(item.status === "APPROVED" && item.is_active),
  );
  const visibleListings = activeListings;
  const visibleInactiveListings = notOnBookingListings;

  return (
    <HostExtranetShell active="home" userName={userName}>
      <main className="mx-auto max-w-[1180px] px-6 py-10">
        {successMessages[params.status || ""] ? (
          <div className="mb-6 border border-emerald-300 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
            {successMessages[params.status || ""]}
          </div>
        ) : null}
        {params.error ? (
          <div className="mb-6 border border-rose-300 bg-rose-50 px-5 py-4 font-semibold text-rose-700">
            {errorMessages[params.error] ||
              "ChÆ°a xá»­ lÃ½ Ä‘Æ°á»£c thao tÃ¡c. Vui lÃ²ng kiá»ƒm tra dá»¯ liá»‡u vÃ  cáº¥u hÃ¬nh Supabase."}
          </div>
        ) : null}

        <div className="mb-7 flex items-center justify-between gap-6">
          <h1 className="text-[32px] font-bold">Trang chá»§ NhÃ³m chá»— nghá»‰</h1>
          <Link
            href="/host/register?new=1"
            className="rounded-sm bg-[#f60057] px-5 py-3 font-bold text-white hover:bg-[#d9004c]"
          >
            ThÃªm chá»— nghá»‰ má»›i
          </Link>
        </div>

        <section className="border border-gray-300 bg-white p-6">
          <div className="flex gap-5">
            <MessageCircle className="mt-1 h-6 w-6 shrink-0" />
            <div>
              <h2 className="text-xl font-bold">
                Tiáº¿p cáº­n nhiá» u khÃ¡ch hÆ¡n vá»›i loáº¡i giÃ¡ theo tuáº§n vÃ  theo thÃ¡ng
              </h2>
              <p className="mt-4">
                TÄƒng tá»· lá»‡ láº¥p phÃ²ng vÃ  tiáº¿p cáº­n nhu cáº§u ngÃ y cÃ ng tÄƒng cho cÃ¡c
                ká»³ nghá»‰ dÃ i báº±ng cÃ¡ch táº¡o giÃ¡ theo tuáº§n hoáº·c theo thÃ¡ng.
              </p>
              <Link
                href="/host/revenue"
                className="mt-5 inline-flex font-bold text-[#f60057]"
              >
                ThÃªm loáº¡i giÃ¡ theo thÃ¡ng
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">
              Chá»— nghá»‰ chÆ°a cÃ³ trÃªn StaySaga ({visibleInactiveListings.length})
            </h2>
            <Link href="/host/list" className="font-medium text-gray-700">
              áº¨n má»¥c
            </Link>
          </div>
          <p className="mt-7">
            PhÃ¡t triá»ƒn kinh doanh báº±ng cÃ¡ch thÃªm cÃ¡c chá»— nghá»‰ nÃ y vÃ o ná»n táº£ng
            du lá»‹ch trá»±c tuyáº¿n lá»›n nháº¥t tháº¿ giá»›i, StaySaga.
          </p>
          <div className="mt-6 overflow-x-auto border border-gray-300 bg-white">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-5 py-4 font-bold">TÃªn â†“</th>
                  <th className="px-5 py-4 font-bold">Vá»‹ trÃ­</th>
                  <th className="px-5 py-4 font-bold">Tiáº¿n trÃ¬nh Ä‘Äƒng kÃ½</th>
                  <th className="px-5 py-4 font-bold">HÃ nh Ä‘á»™ng</th>
                </tr>
              </thead>
              <tbody>
                {visibleInactiveListings.map(
                  (listing) => {
                    const progress = getRegistrationProgress(listing);
                    const continueHref = getContinueRegistrationHref(listing);
                    return (
                      <tr key={listing.id} className="border-b border-gray-200">
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-4">
                            <span className="h-10 w-10 rounded-full bg-gray-700" />
                            <div>
                              <Link
                                href={continueHref}
                                className="font-bold text-[#f60057] hover:underline"
                              >
                                {listing.name || "Chá»— nghá»‰ chÆ°a Ä‘áº·t tÃªn"}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {listing.address || listing.city || "Viá»‡t Nam"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5">{listing.country || "Viá»‡t Nam"}</td>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-[220px] rounded bg-gray-200">
                              <div
                                className="h-2 rounded bg-emerald-700"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-8">
                            <Link
                              href={continueHref}
                              className="font-medium text-[#f60057] underline"
                            >
                              Tiáº¿p tá»¥c Ä‘Äƒng kÃ½
                            </Link>
                            <DeleteRegistrationButton propertyId={listing.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
                {visibleInactiveListings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <p className="font-bold">
                        KhÃ´ng cÃ³ chá»— nghá»‰ nÃ o chÆ°a cÃ³ trÃªn StaySaga.
                      </p>
                      <Link
                        href="/host/register?new=1"
                        className="mt-4 inline-flex rounded-sm bg-[#f60057] px-5 py-3 font-bold text-white"
                      >
                        {listings.length > 0 ? "Táº¡o chá»— nghá»‰ má»›i" : "Táº¡o chá»— nghá»‰ Ä‘áº§u tiÃªn"}
                      </Link>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">CÃ¡c chá»— nghá»‰ Ä‘ang hoáº¡t Ä‘á»™ng</h2>
          <div className="mt-8 flex flex-wrap items-end gap-5">
            <label className="font-bold">
              Lá»c theo vá»‹ trÃ­
              <select className="mt-2 block h-11 w-[250px] border border-gray-500 bg-white px-3 font-normal">
                <option>{activeListings.length} chá»— nghá»‰ Ä‘ang hoáº¡t Ä‘á»™ng</option>
                <option>Viá»‡t Nam</option>
              </select>
            </label>
            <label className="relative block">
              <input
                placeholder="Lá»c theo ID chá»— nghá»‰, tÃªn"
                className="h-11 w-[260px] border border-gray-500 bg-white px-3 pr-10"
              />
              <Search className="absolute right-3 top-3 h-5 w-5" />
            </label>
          </div>

          <div className="mt-8 flex gap-8 border-b border-gray-300">
            {["Hoáº¡t Ä‘á»™ng", "Hiá»‡u suáº¥t", "CÃ i Ä‘áº·t", "Chá»— nghá»‰ má»›i thÃªm (1)"].map(
              (tab, index) => (
                <button
                  key={tab}
                  className={`pb-4 ${
                    index === 0
                      ? "border-b-2 border-[#f60057] text-[#f60057]"
                      : ""
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          <h3 className="mt-7 text-2xl font-bold">Tá»•ng quan hÃ´m nay</h3>
          <div className="mt-7 grid border border-gray-300 bg-white md:grid-cols-5">
            <OverviewMetric icon={<ListChecks />} value={pendingBookings} label="Äáº·t phÃ²ng" />
            <OverviewMetric icon={<MessageCircle />} value={0} label="KhÃ¡ch Ä‘áº¿n" />
            <OverviewMetric icon={<MessageCircle />} value={0} label="KhÃ¡ch Ä‘i" />
            <OverviewMetric icon={<Star />} value={0} label="ÄÃ¡nh giÃ¡" />
            <OverviewMetric icon={<XCircle />} value={0} label="LÆ°á»£t há»§y" />
          </div>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-5">
            <label className="font-bold">
              Lá»c theo tráº¡ng thÃ¡i
              <select className="mt-2 block h-11 w-[260px] border border-gray-500 bg-white px-3 font-normal">
                <option>Táº¥t cáº£ chá»— nghá»‰</option>
                <option>Má»Ÿ / CÃ³ thá»ƒ Ä‘áº·t phÃ²ng</option>
                <option>ÄÃ³ng / KhÃ´ng thá»ƒ Ä‘áº·t phÃ²ng</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-5 text-gray-600">
              <Link href="/host/list" className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Táº£i xuá»‘ng
              </Link>
              <Link href="/host/list" className="inline-flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                TÃ¹y chá»‰nh dá»¯ liá»‡u
              </Link>
              <Link href="/host/list" className="inline-flex items-center gap-2">
                <Eye className="h-4 w-4" />
                TÃ¹y chá»‰nh cháº¿ Ä‘á»™ xem
              </Link>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto border border-gray-300 bg-white">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-4 py-4">ID â†‘</th>
                  <th className="px-4 py-4">Chá»— nghá»‰</th>
                  <th className="px-4 py-4">Tráº¡ng thÃ¡i trÃªn StaySaga</th>
                  <th className="px-4 py-4">Äáº¿n trong 48 giá» tá»›i</th>
                  <th className="px-4 py-4">Rá»i Ä‘i trong 48 giá» tá»›i</th>
                  <th className="px-4 py-4">Tin nháº¯n tá»« khÃ¡ch</th>
                  <th className="px-4 py-4">Tin nháº¯n tá»« StaySaga</th>
                  <th className="px-4 py-4">Há»§y phÃ²ng</th>
                </tr>
              </thead>
              <tbody>
                {visibleListings.map((listing, index) => {
                  const open = listing.status === "APPROVED" && listing.is_active;
                  return (
                    <tr key={listing.id} className="border-b border-gray-200">
                      <td className="px-4 py-5">{listing.id.slice(0, 8)}</td>
                      <td className="px-4 py-5">
                        <Link
                          href={`/host/${listing.id}`}
                          className="font-medium text-[#f60057] hover:underline"
                        >
                          {listing.name || "Chá»— nghá»‰ chÆ°a Ä‘áº·t tÃªn"}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {listing.address || listing.city || "Viá»‡t Nam"}
                        </p>
                      </td>
                      <td className="px-4 py-5">
                        <span
                          className={`inline-flex items-center gap-2 ${
                            open ? "text-gray-800" : "text-red-600"
                          }`}
                        >
                          <span
                            className={`h-3 w-3 rounded-full ${
                              open ? "bg-emerald-700" : "border border-red-600"
                            }`}
                          />
                          {open
                            ? "Má»Ÿ / CÃ³ thá»ƒ Ä‘áº·t phÃ²ng"
                            : "ÄÃ³ng / KhÃ´ng thá»ƒ Ä‘áº·t phÃ²ng"}
                        </span>
                        {!open ? (
                          <Link
                            href={`/host/${listing.id}`}
                            className="mt-3 block text-[#f60057]"
                          >
                            TÃ¬m hiá»ƒu nguyÃªn nhÃ¢n
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-5 text-center">0</td>
                      <td className="px-4 py-5 text-center">0</td>
                      <td className="px-4 py-5 text-center">0</td>
                      <td className="px-4 py-5 text-center">
                        {index === 1 ? (
                          <Link
                            href="/host/messages"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f60057] text-sm font-bold text-white"
                            aria-label="Xem 5 tin nháº¯n tá»« StaySaga"
                          >
                            5
                          </Link>
                        ) : (
                          0
                        )}
                      </td>
                      <td className="px-4 py-5 text-center">
                        <DeletePropertyButton
                          propertyId={listing.id}
                          status={listing.status || "APPROVED"}
                        />
                      </td>
                    </tr>
                  );
                })}
                {visibleListings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-600">
                      ChÆ°a cÃ³ chá»— nghá»‰ nÃ o Ä‘ang hoáº¡t Ä‘á»™ng.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-8 border border-[#f60057] bg-rose-50 px-6 py-5">
            Pháº£n há»“i cá»§a QuÃ½ vá»‹ ráº¥t quan trá»ng vá»›i chÃºng tÃ´i. QuÃ½ vá»‹ tháº¥y dá»¯ liá»‡u
            nÃ y cÃ³ há»¯u Ã­ch khÃ´ng?
            <Link href="/help" className="ml-4 rounded-full bg-white px-3 py-2">
              Há»¯u Ã­ch
            </Link>
            <Link href="/help" className="ml-2 rounded-full bg-white px-3 py-2">
              GÃ³p Ã½
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-10 bg-[#f60057] text-white">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-6 py-9">
          <div className="flex flex-wrap gap-8">
            <Link href="/help">Giá»›i thiá»‡u vá» chÃºng tÃ´i</Link>
            <Link href="/settings">ChÃ­nh sÃ¡ch Báº£o máº­t vÃ  Cookie</Link>
            <Link href="/help">CÃ¡c CÃ¢u Há»i ThÆ°á»ng Gáº·p</Link>
          </div>
          <div className="flex gap-4">
            <Link
              href="/host/register?new=1"
              className="rounded-sm bg-white/15 px-5 py-3 font-bold ring-1 ring-white/25"
            >
              ThÃªm chá»— nghá»‰ má»›i
            </Link>
            <Link href="/help" className="rounded-sm bg-white/15 px-5 py-3 font-bold ring-1 ring-white/25">
              Chia sáº» gÃ³p Ã½ cá»§a QuÃ½ vá»‹
            </Link>
          </div>
          <p className="w-full text-sm">Â© Báº£n quyá»n StaySaga 2026</p>
        </div>
      </footer>
      <RealtimeSubscription table="homestays" filter={`owner_id=eq.${session.user.id}`} />
    </HostExtranetShell>
  );
}

function OverviewMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="border-b border-gray-300 p-7 md:border-b-0 md:border-r last:md:border-r-0">
      <div className="text-gray-900 [&>svg]:h-7 [&>svg]:w-7">{icon}</div>
      <p className="mt-7 text-2xl font-bold">{value}</p>
      <p className="mt-4 text-lg text-[#f60057]">{label}</p>
    </div>
  );
}
