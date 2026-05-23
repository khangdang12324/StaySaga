import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ChevronRight, Search } from "lucide-react";
import { HostAccountMenu } from "../../../_components/HostAccountMenu";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type RateDraft = {
  rateKey: string;
  cancellationPolicy: string;
  meals: string;
  minimumStayEnabled: string;
  minimumStay: number;
  advanceBooking: string;
  baseRate: string;
  direction: string;
  difference: number;
  roomType: string;
  internalName: string;
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

function readQuery(query: Record<string, string | string[] | undefined>, key: string, fallback: string) {
  const value = query[key];
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

function rateDefaults(rateKey: string) {
  if (rateKey === "standard") {
    return {
      cancellationPolicy: "flexible-1-day",
      minimumStayEnabled: "no",
      minimumStay: "1",
      difference: "0",
      internalName: "Standard Rate",
    };
  }

  if (rateKey === "non-refundable") {
    return {
      cancellationPolicy: "non-refundable",
      minimumStayEnabled: "no",
      minimumStay: "1",
      difference: "10",
      internalName: "Non-refundable Rate",
    };
  }

  if (rateKey === "weekly") {
    return {
      cancellationPolicy: "flexible-1-day",
      minimumStayEnabled: "yes",
      minimumStay: "7",
      difference: "15",
      internalName: "Weekly Rate",
    };
  }

  return {
    cancellationPolicy: "flexible-1-day",
    minimumStayEnabled: "yes",
    minimumStay: "28",
    difference: "30",
    internalName: "Thuê homestay theo tháng",
  };
}

function getDraft(query: Record<string, string | string[] | undefined>): RateDraft {
  const rateKey = readQuery(query, "rate", "monthly");
  const defaults = rateDefaults(rateKey);

  return {
    rateKey,
    cancellationPolicy: readQuery(query, "cancellationPolicy", defaults.cancellationPolicy),
    meals: readQuery(query, "meals", "none"),
    minimumStayEnabled: readQuery(query, "minimumStayEnabled", defaults.minimumStayEnabled),
    minimumStay: Math.max(1, Number(readQuery(query, "minimumStay", defaults.minimumStay))),
    advanceBooking: readQuery(query, "advanceBooking", "anytime"),
    baseRate: readQuery(query, "baseRate", "standard"),
    direction: readQuery(query, "direction", "lower"),
    difference: Math.max(0, Math.min(90, Number(readQuery(query, "difference", defaults.difference)))),
    roomType: readQuery(query, "roomType", "two-bedroom-apartment"),
    internalName: readQuery(query, "internalName", defaults.internalName),
  };
}

async function activateRateAdvisor(formData: FormData) {
  "use server";

  const propertyId = String(formData.get("propertyId") || "");
  const now = new Date().toISOString();
  const rateKey = String(formData.get("rateKey") || "monthly");
  const payload = {
    cancellation_policy: String(formData.get("cancellationPolicy") || "flexible-1-day"),
    meals: String(formData.get("meals") || "none"),
    minimum_stay_enabled: formData.get("minimumStayEnabled") === "yes",
    minimum_stay: Math.max(1, Number(formData.get("minimumStay") || 28)),
    advance_booking: String(formData.get("advanceBooking") || "anytime"),
    base_rate: String(formData.get("baseRate") || "standard"),
    direction: String(formData.get("direction") || "lower"),
    difference_percent: Math.max(0, Math.min(90, Number(formData.get("difference") || 30))),
    room_type: String(formData.get("roomType") || "two-bedroom-apartment"),
    internal_name: String(formData.get("internalName") || "Thuê homestay theo tháng"),
    active: true,
    updated_at: now,
  };

  if (rateKey !== "monthly") {
    const query = new URLSearchParams({
      rate_saved: "1",
      editedRate: rateKey,
      diff: String(payload.difference_percent),
      direction: payload.direction,
    });

    redirect(`/host/${propertyId}/calendar/rate-plans?${query.toString()}`);
  }

  const supabase = await createClient();
  const update = await supabase
    .from("homestays")
    .update({ monthly_rate_advisor: payload, updated_at: now })
    .eq("id", propertyId);

  if (update.error) {
    await supabase.from("homestays").update({ updated_at: now }).eq("id", propertyId);
  }

  const query = new URLSearchParams({
    rate_saved: "1",
    monthly: "1",
    name: payload.internal_name,
    min: String(payload.minimum_stay),
    diff: String(payload.difference_percent),
    direction: payload.direction,
  });

  redirect(`/host/${propertyId}/calendar/rate-plans?${query.toString()}`);
}

export default async function RateAdvisorPage({ params, searchParams }: Props) {
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
  const draft = getDraft(query);
  const isReview = readQuery(query, "review", "") === "1";

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#1a1a1a]">
      <Header propertyId={property.id} propertyName={property.name || "Chỗ nghỉ"} userName={userName} />
      {isReview ? <ReviewPage propertyId={property.id} draft={draft} /> : <EditPage propertyId={property.id} draft={draft} />}
    </div>
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
          <span className="flex-1 text-white/90">Tìm kiếm</span>
          <Search className="h-5 w-5" />
        </div>
        <HostAccountMenu userName={userName} />
      </div>
      <nav className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] overflow-x-auto px-6 text-sm font-semibold">
          <Link href={`/host/${propertyId}`} className="px-5 py-4 hover:bg-white/10">
            Trang chủ
          </Link>
          <Link href={`/host/${propertyId}/calendar`} className="bg-white/10 px-5 py-4 shadow-[inset_0_-4px_0_#fff]">
            Lịch & giá
          </Link>
          <Link href={`/host/${propertyId}/promotions`} className="px-5 py-4 hover:bg-white/10">
            Chương trình khuyến mãi
          </Link>
          <Link href="/host/bookings" className="px-5 py-4 hover:bg-white/10">
            Đặt phòng
          </Link>
          <Link href={`/host/${propertyId}/amenities`} className="px-5 py-4 hover:bg-white/10">
            Chỗ nghỉ
          </Link>
          <Link href="/host/revenue" className="px-5 py-4 hover:bg-white/10">
            Phân tích
          </Link>
        </div>
      </nav>
    </header>
  );
}

function EditPage({ propertyId, draft }: { propertyId: string; draft: RateDraft }) {
  return (
    <main className="mx-auto max-w-[1180px] px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm">
            <Link href={`/host/${propertyId}/calendar`} className="text-[#f60057]">
              Lịch & giá
            </Link>
            <span className="mx-2">›</span>
            <span>Thêm loại giá riêng</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold">Thêm loại giá riêng</h1>
        </div>
        <Link href={`/host/${propertyId}/calendar`} className="border border-[#f60057] px-5 py-3 font-bold text-[#f60057]">
          Quay lại
        </Link>
      </div>

      <form method="get" action={`/host/${propertyId}/calendar/rate-advisor`} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <input type="hidden" name="review" value="1" />
        <input type="hidden" name="rate" value={draft.rateKey} />
        <section className="border border-gray-300 bg-white p-6">
          <Step number={1} title="Quý vị muốn sử dụng chính sách hủy phòng nào cho loại giá này?">
            <Radio name="cancellationPolicy" value="flexible-1-day" label="Linh động - 1 ngày" defaultChecked={draft.cancellationPolicy === "flexible-1-day"} />
            <Radio name="cancellationPolicy" value="non-refundable" label="Không hoàn tiền" defaultChecked={draft.cancellationPolicy === "non-refundable"} />
          </Step>

          <Step number={2} title="Quý vị có muốn bao gồm bữa ăn trong loại giá này?">
            <Radio name="meals" value="none" label="Không" defaultChecked={draft.meals === "none"} />
            <Radio name="meals" value="with-meal" label="Có, thêm lựa chọn bữa ăn" defaultChecked={draft.meals === "with-meal"} />
          </Step>

          <Step number={3} title="Quý vị muốn thêm dịch vụ giá trị gia tăng vào loại giá này?">
            <p>Mỗi loại giá có thể có tối đa 5 dịch vụ giá trị gia tăng, chẳng hạn như chỗ đỗ xe, mát-xa và tín dụng.</p>
            <button type="button" className="mt-4 font-bold text-[#f60057]">
              Thêm dịch vụ giá trị gia tăng mới
            </button>
          </Step>

          <Step number={4} title="Quý vị có muốn thiết lập thời gian lưu trú tối thiểu cho loại giá này không?">
            <Radio name="minimumStayEnabled" value="no" label="Không (loại giá này dùng được cho tất cả các độ dài lưu trú)" defaultChecked={draft.minimumStayEnabled === "no"} />
            <Radio name="minimumStayEnabled" value="yes" label="Có" defaultChecked={draft.minimumStayEnabled === "yes"} />
            <div className="mt-4 flex items-center gap-3">
              <input name="minimumStay" type="number" min={1} defaultValue={draft.minimumStay} className="w-24 border border-gray-400 px-4 py-3" />
              <span>đêm lưu trú tối thiểu</span>
            </div>
            <div className="mt-5 bg-amber-50 p-4 text-amber-900">
              Điều này sẽ không ảnh hưởng đến bất kỳ giới hạn thời gian lưu trú nào đã cài trong lịch của Quý vị.
            </div>
          </Step>

          <Step number={5} title="Khách có thể đặt với loại giá này bao nhiêu ngày trước khi nhận phòng?">
            <Radio name="advanceBooking" value="anytime" label="Bất cứ lúc nào (loại giá này luôn hoạt động)" defaultChecked={draft.advanceBooking === "anytime"} />
            <Radio name="advanceBooking" value="custom" label="Cài đặt số ngày trước khi nhận phòng" defaultChecked={draft.advanceBooking === "custom"} />
          </Step>

          <Step number={6} title="Quý vị muốn quản lý loại giá này như thế nào?">
            <Radio name="management" value="new" label="Cài đặt như một loại giá mới" />
            <Radio name="management" value="derived" label="Dựa trên một trong số loại giá hiện tại của tôi" defaultChecked />
            <select name="baseRate" defaultValue={draft.baseRate} className="mt-4 w-full border border-gray-400 bg-white px-4 py-3">
              <option value="standard">Standard Rate</option>
              <option value="non-refundable">Non-refundable Rate</option>
              <option value="weekly">Weekly Rate</option>
            </select>
          </Step>

          <Step number={7} title="Quý vị muốn loại giá mới này rẻ hơn hay đắt hơn Standard Rate?">
            <Radio name="direction" value="lower" label="Thấp hơn Standard Rate" defaultChecked={draft.direction === "lower"} />
            <Radio name="direction" value="higher" label="Cao hơn Standard Rate" defaultChecked={draft.direction === "higher"} />
            <label className="mt-4 block font-bold">Chênh lệch bao nhiêu?</label>
            <div className="mt-2 flex items-center gap-3">
              <span>-</span>
              <input name="difference" type="number" min={0} max={90} defaultValue={draft.difference} className="w-28 border border-gray-400 px-4 py-3" />
              <select name="differenceType" className="border border-gray-400 bg-white px-4 py-3">
                <option value="percent">%</option>
                <option value="vnd">VND</option>
              </select>
            </div>
            <p className="mt-2">rẻ hơn <strong>Standard Rate</strong></p>
          </Step>

          <Step number={8} title="Loại phòng nào có thể đặt được với loại giá này?">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="roomType" value="two-bedroom-apartment" defaultChecked className="h-5 w-5 accent-[#f60057]" />
              Căn Hộ 2 Phòng Ngủ
            </label>
          </Step>

          <Step number={9} title="Quý vị có muốn đặt tên cho loại giá này là gì?">
            <input name="internalName" className="w-full border border-gray-400 px-4 py-3" defaultValue={draft.internalName} placeholder="Ví dụ: Giá theo tháng" />
            <div className="mt-5 bg-gray-100 p-4">
              Tên này chỉ dành cho Quý vị. Chúng tôi sẽ không hiển thị cho khách thấy trên StaySaga.
            </div>
          </Step>

          <div className="mt-8 flex justify-end gap-3">
            <Link href={`/host/${propertyId}/calendar`} className="border border-[#f60057] px-5 py-3 font-bold text-[#f60057]">
              Quay lại
            </Link>
            <button type="submit" className="bg-[#f60057] px-6 py-3 font-bold text-white hover:bg-[#d9004c]">
              Xem lại
            </button>
          </div>
        </section>

        <RateSummary propertyId={propertyId} draft={draft} />
      </form>
    </main>
  );
}

function draftSearchParams(draft: RateDraft) {
  return new URLSearchParams({
    rate: draft.rateKey,
    cancellationPolicy: draft.cancellationPolicy,
    meals: draft.meals,
    minimumStayEnabled: draft.minimumStayEnabled,
    minimumStay: String(draft.minimumStay),
    advanceBooking: draft.advanceBooking,
    baseRate: draft.baseRate,
    direction: draft.direction,
    difference: String(draft.difference),
    roomType: draft.roomType,
    internalName: draft.internalName,
  });
}

function ReviewPage({ propertyId, draft }: { propertyId: string; draft: RateDraft }) {
  const editHref = `/host/${propertyId}/calendar/rate-advisor?${draftSearchParams(draft).toString()}`;

  return (
    <main className="mx-auto max-w-[1180px] px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Xem lại loại giá này</h1>
        <Link href={editHref} className="border border-[#f60057] px-5 py-3 font-bold text-[#f60057]">
          Quay lại
        </Link>
      </div>

      <form action={activateRateAdvisor} className="mt-8 max-w-[1000px] border border-gray-300 bg-white p-6">
        <input type="hidden" name="propertyId" value={propertyId} />
        {Object.entries(draft).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={String(value)} />
        ))}

        <ReviewRow label="Chính sách" value={policyLabel(draft.cancellationPolicy)} href={editHref} />
        <ReviewRow label="Bữa ăn" value={draft.meals === "none" ? "Không có bữa ăn" : "Có thêm lựa chọn bữa ăn"} href={editHref} />
        <ReviewRow label="Dịch vụ giá trị gia tăng" value="Không có dịch vụ giá trị gia tăng" href={editHref} />
        <ReviewRow label="Lưu trú tối thiểu" value={draft.minimumStayEnabled === "yes" ? `Tối thiểu ${draft.minimumStay} đêm lưu trú` : "Không giới hạn"} href={editHref} />
        <ReviewRow label="Có thể đặt phòng" value={draft.advanceBooking === "anytime" ? "Bất kỳ lúc nào" : "Theo số ngày trước khi nhận phòng"} href={editHref} />
        <ReviewRow label="Giá" value={`Dựa trên ${baseRateLabel(draft.baseRate)}`} href={editHref} />
        <ReviewRow label="Chênh lệch giá" value={`${draft.difference}% ${draft.direction === "lower" ? "rẻ hơn" : "cao hơn"} Standard Rate`} href={editHref} />
        <ReviewRow label="Phòng" value={draft.roomType === "two-bedroom-apartment" ? "Căn Hộ 2 Phòng Ngủ" : draft.roomType} href={editHref} />
        <ReviewRow label="Tên loại giá" value={draft.internalName || "Thuê homestay theo tháng"} href={editHref} />

        <div className="mt-8 flex gap-3">
          <Link href={editHref} className="border border-[#f60057] px-5 py-3 font-bold text-[#f60057]">
            Quay lại
          </Link>
          <button type="submit" className="bg-[#f60057] px-6 py-3 font-bold text-white hover:bg-[#d9004c]">
            Kích hoạt loại giá này
          </button>
        </div>
      </form>
    </main>
  );
}

function RateSummary({ propertyId, draft }: { propertyId: string; draft: RateDraft }) {
  return (
    <aside className="space-y-6">
      <section className="border border-gray-300 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Tóm tắt loại giá</h2>
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="mt-5 space-y-4 text-sm">
          <Summary label="Chính sách hủy" value={policyLabel(draft.cancellationPolicy)} />
          <Summary label="Bữa ăn" value={draft.meals === "none" ? "Không bao gồm" : "Có bao gồm"} />
          <Summary label="Lưu trú tối thiểu" value={`${draft.minimumStay} đêm`} />
          <Summary label="Giá dự kiến" value={`${draft.direction === "lower" ? "Thấp hơn" : "Cao hơn"} Standard Rate ${draft.difference}%`} />
        </div>
      </section>
      <section className="border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-xl font-bold">Loại giá theo tháng phù hợp khi nào?</h2>
        <p className="mt-3 text-gray-700">
          Dùng cho khách lưu trú dài ngày, giúp lấp phòng trống ổn định hơn mà vẫn giữ quyền kiểm soát giá và giới hạn đặt phòng.
        </p>
        <Link href={`/host/${propertyId}/calendar`} className="mt-5 inline-flex items-center gap-2 font-bold text-[#f60057]">
          Quay lại lịch <ChevronRight className="h-4 w-4" />
        </Link>
      </section>
    </aside>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-5 border-b border-gray-200 py-7 last:border-b-0 md:grid-cols-[52px_1fr]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-700">{number}</div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="mt-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

function Radio({ name, value, label, defaultChecked = false }: { name: string; value: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-3">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="h-5 w-5 accent-[#f60057]" />
      <span>{label}</span>
    </label>
  );
}

function ReviewRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div className="grid gap-4 border-b border-gray-200 py-8 last:border-b-0 md:grid-cols-[220px_1fr_130px]">
      <p className="font-bold">{label}</p>
      <p>{value}</p>
      <Link href={href} className="inline-flex justify-center border border-[#f60057] px-4 py-3 font-bold text-[#f60057]">
        Chỉnh sửa
      </Link>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gray-200 pb-3 last:border-b-0">
      <p className="text-gray-500">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function policyLabel(value: string) {
  return value === "non-refundable" ? "Không hoàn tiền" : "Linh động - 1 ngày";
}

function baseRateLabel(value: string) {
  if (value === "non-refundable") return "Non-refundable Rate";
  if (value === "weekly") return "Weekly Rate";
  return "Standard Rate";
}
