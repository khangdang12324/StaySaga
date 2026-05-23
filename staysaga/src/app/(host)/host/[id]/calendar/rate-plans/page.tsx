import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronDown, Download, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { HostAccountMenu } from "../../../_components/HostAccountMenu";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type RatePlan = {
  key: string;
  name: string;
  id: string;
  tag: string;
  cancellation: string;
  price: React.ReactNode;
  cancellationRate: string;
  netRevenue: string;
  minStay: string;
  canBook: string;
  editableHref: string;
  removable?: boolean;
};

type MonthlyRate = {
  internal_name?: string;
  minimum_stay?: number;
  difference_percent?: number;
  direction?: string;
  active?: boolean;
};

async function getProperty(id: string, userId: string) {
  const supabase = await createClient();
  let { data } = await supabase
    .from("homestays")
    .select("id, name, address, owner_id, monthly_rate_advisor")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();

  if (!data) {
    const admin = await createAdminClient();
    const retry = await admin
      .from("homestays")
      .select("id, name, address, owner_id, monthly_rate_advisor")
      .eq("id", id)
      .eq("owner_id", userId)
      .single();
    data = retry.data;
  }

  return data;
}

function readQuery(query: Record<string, string | string[] | undefined>, key: string, fallback = "") {
  const value = query[key];
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

function normalizeMonthlyRate(value: unknown): MonthlyRate | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as MonthlyRate;
  if (draft.active === false) return null;
  return draft;
}

function readRateOverride(query: Record<string, string | string[] | undefined>, key: string, fallback: number) {
  const editedRate = readQuery(query, "editedRate");
  if (editedRate !== key) return fallback;
  const nextDiff = Number(readQuery(query, "diff", String(fallback)));
  return Math.max(0, Math.min(90, Number.isFinite(nextDiff) ? nextDiff : fallback));
}

function estimateRevenue(baseRevenue: number, discountPercent: number, stayMultiplier = 1) {
  const revenue = Math.round(baseRevenue * (1 - discountPercent / 100) * stayMultiplier);
  return `${revenue.toLocaleString("vi-VN")},00 VND`;
}

async function deleteMonthlyRate(formData: FormData) {
  "use server";

  const propertyId = String(formData.get("propertyId") || "");
  const supabase = await createClient();
  const update = await supabase
    .from("homestays")
    .update({ monthly_rate_advisor: null, updated_at: new Date().toISOString() })
    .eq("id", propertyId);

  if (update.error) {
    await supabase.from("homestays").update({ updated_at: new Date().toISOString() }).eq("id", propertyId);
  }

  redirect(`/host/${propertyId}/calendar/rate-plans?deleted=1`);
}

export default async function RatePlansPage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host");
  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const property = await getProperty(id, session.user.id);
  if (!property) notFound();

  const propertyData = property as {
    id: string;
    name?: string | null;
    address?: string | null;
    monthly_rate_advisor?: unknown;
  };
  const fromQuery = readQuery(query, "monthly") === "1";
  const savedMonthly = normalizeMonthlyRate(propertyData.monthly_rate_advisor);
  const queryMonthly: MonthlyRate | null = fromQuery
    ? {
        active: true,
        internal_name: readQuery(query, "name", "Thue homestay theo thang"),
        minimum_stay: Math.max(1, Number(readQuery(query, "min", "28"))),
        difference_percent: Math.max(0, Math.min(90, Number(readQuery(query, "diff", "30")))),
        direction: readQuery(query, "direction", "lower"),
      }
    : null;
  const monthlyRate = savedMonthly || queryMonthly;
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tai khoan doi tac";
  const plans = buildPlans(propertyData.id, monthlyRate, query);

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#1a1a1a]">
      <Header propertyId={propertyData.id} propertyName={propertyData.name || "Cho nghi"} userName={userName} />
      <main className="mx-auto max-w-[1380px] px-6 py-8">
        {readQuery(query, "rate_saved") === "1" ? (
          <div className="mb-6 border border-green-500 bg-green-50 px-6 py-4 font-semibold text-green-800">
            Loai gia moi da duoc kich hoat va them vao danh sach.
          </div>
        ) : null}
        {readQuery(query, "deleted") === "1" ? (
          <div className="mb-6 border border-green-500 bg-green-50 px-6 py-4 font-semibold text-green-800">
            Loai gia da duoc xoa khoi danh sach hien thi.
          </div>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Loai gia</h1>
            <p className="mt-2 text-gray-700">
              Quan ly cac loai gia, chinh sach huy va gioi han luu tru cho {propertyData.name || "cho nghi"}.
            </p>
          </div>
          <Link href={`/host/${propertyData.id}/calendar/rate-advisor`} className="bg-[#f60057] px-5 py-3 font-bold text-white hover:bg-[#d9004d]">
            Them loai gia moi
          </Link>
        </div>

        <section className="mt-8 border border-gray-300 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-300 p-5">
            <button className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 font-semibold text-gray-700">
              <SlidersHorizontal className="h-4 w-4" />
              Tuy chinh du lieu
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold">Hien thi don huy dat phong va doanh thu rong trong:</span>
              <div className="inline-flex overflow-hidden rounded-full border border-gray-300 bg-gray-50">
                {["30 ngay qua", "3 thang qua", "6 thang qua", "12 thang qua"].map((label, index) => (
                  <button key={label} className={`px-5 py-2 ${index === 0 ? "bg-white shadow-sm" : "border-l border-gray-200"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1.35fr_1.2fr_1.1fr_1fr_1fr] border-b border-gray-300 bg-gray-50 px-6 py-4 text-sm font-bold">
            <span>Ten loai gia</span>
            <span>Chinh sach huy dat phong</span>
            <span>Gia</span>
            <span>Ty le huy dat phong</span>
            <span>Doanh thu rong</span>
          </div>

          <div>
            {plans.map((plan) => (
              <RatePlanRow key={plan.key} propertyId={propertyData.id} plan={plan} />
            ))}
          </div>
        </section>

        <div className="mt-6 flex items-center justify-end gap-5 text-gray-700">
          <button className="inline-flex items-center gap-2 hover:text-[#f60057]">
            <Download className="h-4 w-4" />
            Tai xuong
          </button>
          <Link href={`/host/${propertyData.id}/calendar`} className="font-semibold text-[#f60057]">
            Mo lich va gia
          </Link>
        </div>
      </main>
    </div>
  );
}

function buildPlans(propertyId: string, monthlyRate: MonthlyRate | null, query: Record<string, string | string[] | undefined>): RatePlan[] {
  const editHref = `/host/${propertyId}/calendar/rate-advisor`;
  const nonRefundableDiff = readRateOverride(query, "non-refundable", 10);
  const weeklyDiff = readRateOverride(query, "weekly", 15);
  const plans: RatePlan[] = [
    {
      key: "standard",
      name: "Standard Rate",
      id: "54197293",
      tag: "Linh dong",
      cancellation: "Linh dong - 1 ngay",
      price: <>Duoc tao tu <strong>Lich</strong> cua Quy vi</>,
      cancellationRate: "60%",
      netRevenue: "492.800,00 VND",
      minStay: "Khong co thoi gian luu tru toi thieu",
      canBook: "Bat ky luc nao",
      editableHref: `${editHref}?rate=standard&difference=0&internalName=Standard%20Rate&minimumStayEnabled=no`,
    },
    {
      key: "non-refundable",
      name: "Non-refundable Rate",
      id: "54197294",
      tag: "Khong hoan tien",
      cancellation: "Khong hoan tien",
      price: <>{nonRefundableDiff}% re hon <strong>Standard Rate</strong></>,
      cancellationRate: "18%",
      netRevenue: estimateRevenue(492800, nonRefundableDiff),
      minStay: "Khong co thoi gian luu tru toi thieu",
      canBook: "Bat ky luc nao",
      editableHref: `${editHref}?rate=non-refundable&difference=${nonRefundableDiff}&internalName=Non-refundable%20Rate&cancellationPolicy=non-refundable&minimumStayEnabled=no`,
    },
    {
      key: "weekly",
      name: "Weekly Rate",
      id: "54197295",
      tag: "Theo tuan",
      cancellation: "Linh dong - 1 ngay",
      price: <>{weeklyDiff}% re hon <strong>Standard Rate</strong></>,
      cancellationRate: "12%",
      netRevenue: estimateRevenue(492800, weeklyDiff, 7),
      minStay: "Toi thieu 7 dem luu tru",
      canBook: "Bat ky luc nao",
      editableHref: `${editHref}?rate=weekly&difference=${weeklyDiff}&minimumStay=7&internalName=Weekly%20Rate`,
    },
  ];

  if (monthlyRate) {
    const diff = monthlyRate.difference_percent || 30;
    const directionLabel = monthlyRate.direction === "higher" ? "dat hon" : "re hon";
    plans.push({
      key: "monthly",
      name: monthlyRate.internal_name || "Thue homestay theo thang",
      id: "65771758",
      tag: "Theo thang",
      cancellation: "Linh dong - 1 ngay",
      price: <>{diff}% {directionLabel} <strong>Standard Rate</strong></>,
      cancellationRate: "8%",
      netRevenue: estimateRevenue(492800, diff, monthlyRate.minimum_stay || 28),
      minStay: `Toi thieu ${monthlyRate.minimum_stay || 28} dem luu tru`,
      canBook: "Bat ky luc nao",
      editableHref: `${editHref}?rate=monthly&minimumStay=${monthlyRate.minimum_stay || 28}&difference=${diff}&internalName=${encodeURIComponent(monthlyRate.internal_name || "Thue homestay theo thang")}`,
      removable: true,
    });
  }

  return plans;
}

function RatePlanRow({ propertyId, plan }: { propertyId: string; plan: RatePlan }) {
  return (
    <article className="border-b border-gray-300 px-6 py-5 last:border-b-0">
      <div className="grid grid-cols-[1.35fr_1.2fr_1.1fr_1fr_1fr] gap-4">
        <div className="flex gap-4">
          <ChevronDown className="mt-1 h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-bold">{plan.name}</h2>
            <p className="text-sm text-gray-600">ID {plan.id}</p>
            <span className="mt-2 inline-block border border-gray-400 bg-white px-2 py-1 text-xs">{plan.tag}</span>
          </div>
        </div>
        <span>{plan.cancellation}</span>
        <span>{plan.price}</span>
        <span className="text-gray-600">{plan.cancellationRate}</span>
        <span className="text-gray-600">{plan.netRevenue}</span>
      </div>

      <div className="mt-5 border border-gray-400 bg-gray-50 p-5">
        <div className="grid grid-cols-[1.1fr_1.05fr_1.5fr_1.35fr_1fr] gap-6 border-b border-gray-200 pb-3 font-bold">
          <span>Loai phong</span>
          <span>Ke hoach bua an</span>
          <span>Dich vu gia tri gia tang</span>
          <span>Thoi gian luu tru toi thieu</span>
          <span>Co the dat</span>
        </div>
        <div className="grid grid-cols-[1.1fr_1.05fr_1.5fr_1.35fr_1fr] gap-6 py-4 text-gray-700">
          <span className="before:mr-2 before:content-['•']">Can Ho 2 Phong Ngu</span>
          <span>Khong co bua an</span>
          <span>Khong co dich vu gia tri gia tang</span>
          <span>{plan.minStay}</span>
          <span>{plan.canBook}</span>
        </div>
        <div className="flex justify-end gap-2">
          <Link href={plan.editableHref} className="border border-[#f60057] px-4 py-3 font-bold text-[#f60057] hover:bg-pink-50">
            Chinh sua
          </Link>
          {plan.removable ? (
            <form action={deleteMonthlyRate}>
              <input type="hidden" name="propertyId" value={propertyId} />
              <button className="inline-flex items-center gap-2 bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700">
                <Trash2 className="h-4 w-4" />
                Xoa
              </button>
            </form>
          ) : (
            <button className="inline-flex items-center gap-2 bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700" type="button">
              <Trash2 className="h-4 w-4" />
              Xoa
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Header({ propertyId, propertyName, userName }: { propertyId: string; propertyName: string; userName: string }) {
  return (
    <header className="bg-[#f60057] text-white">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-5 px-6">
        <Link href="/host" className="text-3xl font-bold">
          StaySaga
        </Link>
        <span className="hidden h-8 w-px bg-white/35 md:block" />
        <div className="hidden md:block">
          <p className="font-bold">{propertyName}</p>
          <p className="text-sm text-white/80">ID {propertyId.slice(0, 8)}</p>
        </div>
        <div className="ml-auto hidden h-12 w-full max-w-[540px] items-center rounded-sm bg-white/10 px-4 lg:flex">
          <span className="flex-1 text-white/90">Tim kiem</span>
          <Search className="h-5 w-5" />
        </div>
        <HostAccountMenu userName={userName} />
      </div>
      <nav className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] overflow-x-auto px-6 text-sm font-semibold">
          <Link href={`/host/${propertyId}`} className="px-5 py-4 hover:bg-white/10">
            Trang chu
          </Link>
          <Link href={`/host/${propertyId}/calendar`} className="bg-white/10 px-5 py-4 shadow-[inset_0_-4px_0_#fff]">
            Lich & gia
          </Link>
          <Link href={`/host/${propertyId}/promotions`} className="px-5 py-4 hover:bg-white/10">
            Chuong trinh khuyen mai
          </Link>
          <Link href="/host/bookings" className="px-5 py-4 hover:bg-white/10">
            Dat phong
          </Link>
          <Link href={`/host/${propertyId}/amenities`} className="px-5 py-4 hover:bg-white/10">
            Cho nghi
          </Link>
          <Link href="/host/revenue" className="px-5 py-4 hover:bg-white/10">
            Phan tich
          </Link>
        </div>
      </nav>
    </header>
  );
}
