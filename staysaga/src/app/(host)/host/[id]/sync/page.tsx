import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  AlertCircle,
  CalendarSync,
  ChevronDown,
  CheckCircle2,
  Search,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import { HostAccountMenu } from "../../_components/HostAccountMenu";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: string }>;
};

type Listing = {
  id: string;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  owner_id?: string | null;
};

async function saveCalendarConnection(formData: FormData) {
  "use server";

  const propertyId = String(formData.get("property_id") || "");
  const calendarUrl = String(formData.get("calendar_url") || "").trim();
  const calendarName = String(formData.get("calendar_name") || "").trim();

  if (!propertyId) redirect("/host?error=invalid");
  if (!calendarUrl || !calendarName) {
    redirect(`/host/${propertyId}/sync?status=missing`);
  }

  const supabase = await createAdminClient();
  await supabase
    .from("homestays")
    .update({
      calendar_sync: {
        importedUrl: calendarUrl,
        name: calendarName,
        updatedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  revalidatePath(`/host/${propertyId}`);
  redirect(`/host/${propertyId}/sync?status=saved`);
}

export default async function CalendarSyncPage({ params, searchParams }: Props) {
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

  const { id } = await params;
  let { data: listing } = await supabase
    .from("homestays")
    .select("id, name, address, city, owner_id")
    .eq("id", id)
    .eq("owner_id", session.user.id)
    .single();

  if (!listing) {
    const adminSupabase = await createAdminClient();
    const retry = await adminSupabase
      .from("homestays")
      .select("id, name, address, city, owner_id")
      .eq("id", id)
      .eq("owner_id", session.user.id)
      .single();
    listing = retry.data;
  }

  if (!listing) notFound();

  const property = listing as Listing;
  const paramsValue = searchParams ? await searchParams : {};
  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "Tài khoản đối tác";

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#1a1a1a]">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-5 px-6">
          <Link href="/host" className="text-3xl font-bold tracking-tight">
            StaySaga
          </Link>
          <span className="hidden h-8 w-px bg-white/35 md:block" />
          <div className="hidden min-w-0 md:block">
            <p className="truncate font-bold">{property.name || "Chỗ nghỉ"}</p>
            <p className="text-sm text-white/80">ID {property.id.slice(0, 8)}</p>
          </div>
          <div className="ml-auto hidden h-12 w-full max-w-[540px] items-center rounded-sm bg-white/10 px-4 ring-1 ring-white/10 lg:flex">
            <span className="flex-1 text-white/90">Tìm kiếm</span>
            <Search className="h-5 w-5" />
          </div>
          <HostAccountMenu userName={userName} />
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <Link href={`/host/${property.id}`} className="text-sm hover:text-[#f60057]">
          ‹ Quay lại
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          Đồng bộ lịch với Airbnb, VRBO và các kênh khác
        </h1>
        <p className="mt-4 max-w-[880px] text-lg">
          Đồng bộ hóa lịch giữa các kênh giúp theo dõi đặt phòng và phòng trống
          ở cùng một nơi, hạn chế tình trạng đặt phòng bị trùng.
        </p>

        {paramsValue.status === "saved" ? (
          <div className="mt-6 border border-rose-300 bg-rose-50 px-5 py-4 font-bold text-[#f60057]">
            Đã lưu kết nối lịch. StaySaga sẽ dùng dữ liệu này để đồng bộ phòng trống.
          </div>
        ) : null}
        {paramsValue.status === "missing" ? (
          <div className="mt-6 border border-rose-300 bg-rose-50 px-5 py-4 font-bold text-[#f60057]">
            Vui lòng nhập đường dẫn iCal và tên lịch.
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          <section className="border border-gray-300 bg-white p-8">
            <div className="flex gap-6">
              <StepBadge active>1</StepBadge>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Nhập lịch</h2>
                <p className="mt-8">
                  Sao chép đường dẫn iCal từ các kênh khác và dán vào đây để
                  giữ tình trạng phòng trống luôn cập nhật trên các trang khác nhau.
                </p>

                <form action={saveCalendarConnection} className="mt-8 space-y-7">
                  <input type="hidden" name="property_id" value={property.id} />
                  <label className="block">
                    <span>Sao chép và dán đường dẫn lịch tại đây</span>
                    <input
                      name="calendar_url"
                      placeholder="Ví dụ: https://www.airbnb.com/calendar/ical/12345678.ics?s=ee0123abc"
                      className="mt-2 h-12 w-full border border-gray-400 px-3 outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                    />
                  </label>
                  <label className="block">
                    <span>Tên lịch</span>
                    <input
                      name="calendar_name"
                      placeholder="Ví dụ: Airbnb"
                      className="mt-2 h-12 w-full border border-gray-400 px-3 outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                    />
                  </label>
                  <div className="flex items-center gap-4">
                    <button className="bg-[#f60057] px-6 py-3 font-bold text-white hover:bg-[#d9004c]">
                      Bước kế tiếp
                    </button>
                    <Link
                      href={`/host/${property.id}`}
                      className="border border-[#f60057] px-6 py-3 font-bold text-[#f60057]"
                    >
                      Hủy
                    </Link>
                  </div>
                  <a href="#export-calendar" className="inline-flex font-medium text-[#f60057] underline">
                    Chuyển sang mục xuất
                  </a>
                </form>
              </div>
            </div>

            <div id="export-calendar" className="mt-12 flex gap-6">
              <StepBadge>2</StepBadge>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Xuất lịch</h2>
                <div className="mt-6 border border-gray-300 p-7">
                  <div className="flex gap-4">
                    <AlertCircle className="mt-1 h-6 w-6" />
                    <div>
                      <h3 className="text-lg font-bold">Đồng bộ hóa lịch trên các kênh</h3>
                      <p className="mt-4">
                        Để đảm bảo phòng trống đồng nhất giữa các kênh, Quý vị
                        cũng nên xuất dữ liệu lịch StaySaga sang lịch của các kênh khác.
                      </p>
                      <button className="mt-5 font-bold text-[#f60057]">
                        Tìm hiểu thêm
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="border border-gray-300 bg-white p-7">
              <h2 className="text-2xl font-bold">Quý vị có thể tìm thấy đường dẫn iCal ở đâu?</h2>
              <p className="mt-5">
                Tham khảo các hướng dẫn này để tìm đường dẫn iCal trên các trang khác.
              </p>
              <div className="mt-5 border border-gray-300">
                <Guide title="Agoda" />
                <Guide title="Airbnb" open url="https://www.airbnb.com/help/article/99" />
                <Guide title="Expedia" />
                <Guide title="VRBO" />
              </div>
            </section>

            <section className="border border-gray-300 bg-white p-7">
              <h2 className="text-2xl font-bold">Giải thích về trạng thái</h2>
              <div className="mt-5 divide-y divide-gray-200 border border-gray-300">
                <StatusInfo label="OK" tone="ok" text="Kết nối xuất và nhập đang hoạt động tốt." open />
                <StatusInfo label="Đang kích hoạt" tone="warning" />
                <StatusInfo label="Chỉ nhập" tone="warning" />
                <StatusInfo label="Chỉ xuất" tone="warning" />
                <StatusInfo label="Lỗi dịch vụ" tone="danger" />
              </div>
            </section>

            <section className="border border-gray-300 bg-white p-7">
              <h2 className="text-2xl font-bold">Tùy chọn dữ liệu muốn xuất</h2>
              <p className="mt-5">
                Quản lý đơn đặt và hạn chế đặt phòng bị trùng bằng cách xuất dữ
                liệu đặt phòng và ngày đóng phòng sang các trang Quý vị có đăng chỗ nghỉ.
              </p>
              <div className="mt-5 space-y-3">
                <label className="flex items-center gap-3">
                  <input type="radio" name="export" className="h-5 w-5 accent-[#f60057]" />
                  Các ngày đóng và có đặt phòng
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="export" defaultChecked className="h-5 w-5 accent-[#f60057]" />
                  Chỉ các ngày có đặt phòng
                </label>
              </div>
              <button className="mt-5 border border-[#f60057] px-6 py-3 font-bold text-[#f60057]">
                Lưu
              </button>
              <p className="mt-5 border-t border-gray-200 pt-5 text-gray-600">
                Cài đặt này áp dụng cho tất cả kết nối.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function StepBadge({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-white ${
        active ? "bg-[#f60057]" : "bg-gray-400"
      }`}
    >
      {children}
    </span>
  );
}

function Guide({
  title,
  open,
  url,
}: {
  title: string;
  open?: boolean;
  url?: string;
}) {
  return (
    <div className="border-b border-gray-200 p-5 last:border-b-0">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{title}</h3>
        <ChevronDown className={`h-5 w-5 ${open ? "rotate-180" : ""}`} />
      </div>
      {open && url ? (
        <Link href={url} className="mt-5 inline-flex text-[#f60057] underline">
          {url}
        </Link>
      ) : null}
    </div>
  );
}

function StatusInfo({
  label,
  tone,
  text,
  open,
}: {
  label: string;
  tone: "ok" | "warning" | "danger";
  text?: string;
  open?: boolean;
}) {
  const color =
    tone === "ok"
      ? "bg-emerald-600 text-white"
      : tone === "danger"
        ? "bg-[#f60057] text-white"
        : "bg-rose-100 text-[#f60057]";
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <span className={`rounded-sm px-2 py-1 text-sm font-bold ${color}`}>
          {label}
        </span>
        {open ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <ChevronDown className="h-5 w-5" />}
      </div>
      {open && text ? <p className="mt-5">{text}</p> : null}
    </div>
  );
}
