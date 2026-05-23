import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Info,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import { HostAccountMenu } from "../../../_components/HostAccountMenu";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string }>;
};

async function getProperty(id: string, userId: string) {
  const supabase = await createClient();
  let { data } = await supabase
    .from("homestays")
    .select("id, name, owner_id")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();

  if (!data) {
    const admin = await createAdminClient();
    const retry = await admin
      .from("homestays")
      .select("id, name, owner_id")
      .eq("id", id)
      .eq("owner_id", userId)
      .single();
    data = retry.data;
  }

  return data;
}

async function saveMobileRate(formData: FormData) {
  "use server";

  const propertyId = String(formData.get("propertyId") || "");
  const discount = Math.max(10, Math.min(80, Number(formData.get("discount") || 10)));
  const channel = String(formData.get("channel") || "mobile-web");
  const supabase = await createClient();

  const payload = {
    enabled: true,
    discount_percent: discount,
    channel,
    updated_at: new Date().toISOString(),
  };

  const update = await supabase
    .from("homestays")
    .update({ mobile_rate_promotion: payload, updated_at: payload.updated_at })
    .eq("id", propertyId);

  if (update.error) {
    await supabase.from("homestays").update({ updated_at: payload.updated_at }).eq("id", propertyId);
  }

  redirect(`/host/${propertyId}/promotions/mobile?saved=1`);
}

export default async function MobilePromotionPage({ params, searchParams }: Props) {
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

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#1a1a1a]">
      <Header propertyName={property.name || "Chỗ nghỉ"} propertyId={property.id} userName={userName} />

      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="text-sm">
          <Link href={`/host/${property.id}/promotions`} className="text-[#f60057]">
            Khuyến mãi
          </Link>
          <span className="mx-2">›</span>
          <Link href={`/host/${property.id}/promotions`} className="text-[#f60057]">
            Chọn khuyến mãi mới
          </Link>
          <span className="mx-2">›</span>
          <span>Tạo giá trên điện thoại</span>
        </div>

        <h1 className="mt-3 text-3xl font-bold">Tạo giá trên điện thoại</h1>
        <p className="mt-2 text-lg">
          Tăng tỷ lệ lấp phòng bằng cách nhắm đến khách đặt phòng trên thiết bị di động.
        </p>

        {query.saved ? (
          <div className="mt-6 flex items-center gap-3 border border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-800">
            <CheckCircle2 className="h-6 w-6" />
            <p className="font-bold">Khuyến mãi giá trên điện thoại đã được lưu.</p>
          </div>
        ) : null}

        <form action={saveMobileRate} className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <input type="hidden" name="propertyId" value={property.id} />
          <div className="space-y-6">
            <section className="border border-gray-300 bg-white p-6">
              <h2 className="text-2xl font-bold">Kênh</h2>
              <div className="mt-5 space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="channel"
                    value="mobile-web"
                    defaultChecked
                    className="h-5 w-5 accent-[#f60057]"
                  />
                  <span>Ứng dụng và trang web trên điện thoại</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="channel" value="app-only" className="h-5 w-5 accent-[#f60057]" />
                  <span>Chỉ trong ứng dụng</span>
                </label>
              </div>
            </section>

            <section className="border border-gray-300 bg-white p-6">
              <h2 className="text-2xl font-bold">Giảm giá</h2>
              <label className="mt-5 flex w-40 border border-gray-500 bg-white">
                <input
                  name="discount"
                  type="number"
                  min={10}
                  max={80}
                  defaultValue={10}
                  className="w-full px-4 py-3 outline-none"
                />
                <span className="border-l border-gray-300 px-4 py-3">%</span>
              </label>
              <div className="mt-5 flex gap-3 text-sm">
                <Info className="mt-1 h-5 w-5 shrink-0 text-[#f60057]" />
                <p>
                  Kết hợp được với Genius, Ưu Đãi Cơ Bản, Ưu Đãi Phút Chót và Ưu Đãi Đặt Sớm. Khi
                  xung đột với ưu đãi khác, hệ thống sẽ hiển thị mức giá có lợi nhất cho khách.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-bold">Tùy chỉnh giá trên điện thoại</h2>
              <p className="text-gray-600">Thêm giới hạn để thu hẹp phạm vi tiếp cận khi cần.</p>
              <SummaryRow title="Ngày không áp dụng khuyến mãi" value="Chưa có ngày nào" />
              <SummaryRow title="Loại giá" value="Tất cả loại giá" />
              <SummaryRow title="Độ dài lưu trú" value="Theo loại giá" />
              <SummaryRow title="Thời gian đặt trước" value="Bất kỳ lúc nào trước khi nhận phòng" />
            </section>

            <section className="border border-gray-300 bg-white p-6">
              <h2 className="text-2xl font-bold">Cách khuyến mãi hiển thị</h2>
              <p className="mt-4">
                Sau khi kích hoạt, khách dùng điện thoại sẽ thấy nhãn giá chỉ có trên điện thoại,
                giá ban đầu bị gạch bỏ và mức giá mới nổi bật hơn.
              </p>
              <div className="mt-6 flex max-w-xl items-center gap-8">
                <div className="w-28 rounded-3xl border-4 border-gray-300 bg-white p-3">
                  <div className="h-6 rounded bg-gray-100" />
                  <div className="mt-3 h-6 rounded bg-gray-100" />
                  <div className="mt-3 h-6 rounded bg-gray-100" />
                </div>
                <ChevronRight className="h-8 w-8 text-gray-400" />
                <div className="w-56 border border-gray-200 bg-white p-4 shadow">
                  <div className="h-28 bg-rose-50" />
                  <p className="mt-3 font-bold">Chỗ nghỉ của Quý vị</p>
                  <p className="mt-2 inline-flex bg-emerald-700 px-3 py-2 text-sm font-bold text-white">
                    Giá chỉ có trên điện thoại
                  </p>
                  <p className="mt-3">
                    <span className="text-[#f60057] line-through">VND 100</span>{" "}
                    <strong>VND 90</strong>
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border border-gray-300 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Điểm khuyến mãi</h2>
                <strong>100/100</strong>
              </div>
              <div className="mt-3 h-2 rounded bg-gray-200">
                <div className="h-2 rounded bg-[#f60057]" style={{ width: "100%" }} />
              </div>
              <div className="mt-4 bg-rose-50 p-4 text-sm">
                Đối tác có điểm 100 có thể nhận thêm tới 30% đêm phòng so với đối tác không dùng
                giá trên điện thoại.
              </div>
              <Link href="#" className="mt-4 inline-flex font-bold text-[#f60057]">
                Tìm hiểu thêm
              </Link>
            </section>

            <section className="border border-gray-300 bg-white p-6">
              <div className="flex items-start gap-4">
                <Smartphone className="h-7 w-7 text-[#f60057]" />
                <div>
                  <h2 className="text-xl font-bold">Mới: Điểm khuyến mãi</h2>
                  <p className="mt-3 text-sm text-gray-700">
                    Điểm này giúp Quý vị biết chương trình có đủ rõ ràng và hấp dẫn với khách hay
                    chưa.
                  </p>
                </div>
                <X className="ml-auto h-5 w-5 text-gray-500" />
              </div>
            </section>
          </aside>

          <div className="sticky bottom-0 z-20 -mx-6 border-t border-gray-300 bg-white/95 px-6 py-4 backdrop-blur lg:col-span-2">
            <div className="flex max-w-[760px] gap-3">
              <Link
                href={`/host/${property.id}/promotions`}
                className="border border-[#f60057] px-8 py-3 font-bold text-[#f60057]"
              >
                Hủy
              </Link>
              <button className="flex-1 bg-[#f60057] px-8 py-3 font-bold text-white hover:bg-[#d9004c]">
                Lưu
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function Header({ propertyName, propertyId, userName }: { propertyName: string; propertyId: string; userName: string }) {
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
          <span className="flex-1 text-white/90">Tìm kiếm</span>
          <Search className="h-5 w-5" />
        </div>
        <HostAccountMenu userName={userName} />
      </div>
    </header>
  );
}

function SummaryRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 border border-gray-300 bg-white p-5">
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-1 text-gray-700">{value}</p>
      </div>
      <button type="button" className="font-bold text-[#f60057]">
        Chỉnh sửa
      </button>
    </div>
  );
}
