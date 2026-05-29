import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import { PartnerPropertyActions } from "../../_components/PartnerPropertyActions";
import {
  Camera,
  Layers,
  BedDouble,
  ShieldAlert,
  MapPin,
  XOctagon,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
type Props = {
  params: Promise<{ sub: string }>;
  searchParams?: Promise<{ status?: string; error?: string }>;
};

type DbHomestay = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  bedrooms: number | null;
  beds: number | null;
  bathrooms: number | null;
  max_guests: number | null;
  price_per_night: number | null;
  is_active: boolean | null;
  status: string | null;
  policies: any;
  homestay_images: { id: string; url: string | null }[];
};

export default async function HostPropertySubPage({ params, searchParams }: Props) {
  const { sub } = await params;
  const pageParams = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect(`/login?next=/host/property/${sub}`);

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  // Fetch host properties
  const { data: homestays } = await supabase
    .from("homestays")
    .select(`
      id,
      name,
      address,
      city,
      country,
      bedrooms,
      beds,
      bathrooms,
      max_guests,
      price_per_night,
      is_active,
      status,
      policies,
      homestay_images(id, url)
    `)
    .eq("owner_id", session.user.id)
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  if (!homestays || homestays.length === 0) {
    return (
      <HostExtranetShell active="home" userName={userName}>
        <main className="mx-auto max-w-[1400px] px-6 py-10">
          <HostPageHeader title="Cấu hình chỗ nghỉ" breadcrumbs={[{ label: "Chỗ nghỉ", href: "/host/property" }, { label: sub }]} />
          <EmptyState
            title="Chưa có chỗ nghỉ nào"
            description="Đăng ký chỗ nghỉ đầu tiên để bắt đầu thiết lập cấu hình."
            actionHref="/host/register?new=1"
            actionLabel="Đăng ký chỗ nghỉ"
          />
        </main>
      </HostExtranetShell>
    );
  }

  // Work with the first active homestay for this details configurator
  const activeProperty = homestays[0] as unknown as DbHomestay;
  const propertyId = activeProperty.id;

  const propertyHref = `/host/${propertyId}`;

  // Build content dynamically
  const getSubConfig = () => {
    switch (sub) {
      case "photos":
        return {
          title: "Ảnh chỗ nghỉ",
          description: `Quản lý album hình ảnh của chỗ nghỉ '${activeProperty.name}'. Cần ít nhất 1 ảnh đại diện để được hiển thị công khai.`,
          icon: Camera,
          breadcrumb: "Album ảnh",
          content: (
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {activeProperty.homestay_images?.map((img) => (
                  <div key={img.id} className="relative aspect-square border border-slate-200 bg-slate-50 overflow-hidden group">
                    {img.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt="Ảnh phòng" className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
                <Link
                  href={`/host/properties/${propertyId}/edit`}
                  className="aspect-square border-2 border-dashed border-slate-300 hover:border-[#f60057] flex flex-col items-center justify-center text-slate-500 hover:text-[#f60057] transition"
                >
                  <PlusIcon className="h-8 w-8" />
                  <span className="text-xs font-bold mt-2">Tải ảnh mới lên</span>
                </Link>
              </div>
            </div>
          ),
        };
      case "amenities":
        return {
          title: "Tiện nghi và dịch vụ",
          description: `Cập nhật các trang bị tiện ích của chỗ nghỉ '${activeProperty.name}' như Wifi, Điều hòa, Bếp, Bể bơi...`,
          icon: Layers,
          breadcrumb: "Tiện nghi",
          content: (
            <div className="space-y-6">
              <p className="text-sm text-slate-600">Tiện nghi giúp khách hàng dễ dàng tìm kiếm và lựa chọn chỗ nghỉ của bạn.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {["Internet / Wifi miễn phí", "Điều hòa nhiệt độ", "Bếp nấu & Dụng cụ bếp", "Tủ lạnh", "Máy giặt", "Smart TV", "Máy sấy tóc", "Khăn tắm & Dầu gội", "Bể bơi riêng"].map((amenity, idx) => (
                  <label key={idx} className="flex items-center gap-3 border border-slate-200 p-3 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" defaultChecked={idx < 6} className="h-4 w-4 text-[#f60057]" />
                    <span className="text-sm font-semibold text-slate-700">{amenity}</span>
                  </label>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Link href={`/host/properties/${propertyId}/edit`} className="inline-flex h-11 items-center justify-center bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c]">
                  Chỉnh sửa tiện nghi
                </Link>
              </div>
            </div>
          ),
        };
      case "rooms":
        return {
          title: "Thông tin phòng & số giường",
          description: `Thiết lập số phòng ngủ, giường và phòng tắm tại chỗ nghỉ '${activeProperty.name}' để hiển thị chính xác sức chứa.`,
          icon: BedDouble,
          breadcrumb: "Phòng & Giường",
          content: (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-4">
                <StatCardMini label="Số phòng ngủ" value={activeProperty.bedrooms || 1} />
                <StatCardMini label="Số giường ngủ" value={activeProperty.beds || 1} />
                <StatCardMini label="Số phòng tắm" value={activeProperty.bathrooms || 1} />
                <StatCardMini label="Số khách tối đa" value={activeProperty.max_guests || 2} />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Link href={`/host/properties/${propertyId}/edit`} className="inline-flex h-11 items-center justify-center bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c]">
                  Thay đổi sức chứa chỗ nghỉ
                </Link>
              </div>
            </div>
          ),
        };
      case "policies":
        return {
          title: "Chính sách nhận & trả phòng",
          description: `Quản lý giờ check-in, check-out và các chính sách hủy phòng, trẻ em, vật nuôi tại '${activeProperty.name}'.`,
          icon: ShieldAlert,
          breadcrumb: "Chính sách",
          content: (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 border-b pb-2">Thời gian Check-in/out</h4>
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-slate-600 font-medium">Giờ nhận phòng:</span>
                    <span className="font-bold text-slate-900">Từ {activeProperty.policies?.checkInFrom || "14:00"} đến {activeProperty.policies?.checkInTo || "22:00"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-slate-600 font-medium">Giờ trả phòng:</span>
                    <span className="font-bold text-slate-900">Trước {activeProperty.policies?.checkOutTo || "12:00"}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 border-b pb-2">Quy định chung</h4>
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-slate-600 font-medium">Cho phép trẻ em:</span>
                    <span className="font-bold text-slate-900">{activeProperty.policies?.allowChildren ? "Có" : "Không"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-slate-600 font-medium">Cho phép hút thuốc:</span>
                    <span className="font-bold text-slate-900">{activeProperty.policies?.allowSmoking ? "Có" : "Không"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-slate-600 font-medium">Cho phép thú cưng:</span>
                    <span className="font-bold text-slate-900">{activeProperty.policies?.allowPets ? "Có" : "Không"}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Link href={`/host/properties/${propertyId}/edit`} className="inline-flex h-11 items-center justify-center bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c]">
                  Chỉnh sửa chính sách
                </Link>
              </div>
            </div>
          ),
        };
      case "location":
        return {
          title: "Vị trí địa lý & Bản đồ",
          description: `Thông tin địa chỉ chi tiết và tọa độ kinh độ, vĩ độ giúp khách hàng dễ dàng tìm đường tới '${activeProperty.name}'.`,
          icon: MapPin,
          breadcrumb: "Vị trí địa lý",
          content: (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="grid grid-cols-[120px_1fr] text-sm">
                  <span className="text-slate-500 font-semibold">Địa chỉ:</span>
                  <span className="font-bold text-slate-800">{activeProperty.address || "Chưa thiết lập"}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] text-sm">
                  <span className="text-slate-500 font-semibold">Thành phố:</span>
                  <span className="font-bold text-slate-800">{activeProperty.city}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] text-sm">
                  <span className="text-slate-500 font-semibold">Quốc gia:</span>
                  <span className="font-bold text-slate-800">{activeProperty.country || "Việt Nam"}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Link href={`/host/properties/${propertyId}/edit`} className="inline-flex h-11 items-center justify-center bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c]">
                  Chỉnh sửa địa chỉ
                </Link>
              </div>
            </div>
          ),
        };
      case "close":
        return {
          title: "Yêu cầu tạm đóng hoặc xóa chỗ nghỉ",
          description: `Thực hiện tạm ngưng nhận đặt phòng hoặc gửi yêu cầu xóa chỗ nghỉ '${activeProperty.name}' tới quản trị viên.`,
          icon: XOctagon,
          breadcrumb: "Đóng / Xóa chỗ nghỉ",
          content: (
            <div className="space-y-6">
              <div className="border border-rose-200 bg-rose-50 p-5 text-sm text-slate-700">
                <AlertTriangle className="h-5 w-5 text-[#f60057] inline mr-2 align-middle shrink-0" />
                <span className="font-bold text-[#f60057]">Cảnh báo quan trọng:</span> Việc xóa chỗ nghỉ là không thể khôi phục và sẽ ẩn toàn bộ lịch sử hoạt động trên giao diện public. Khuyên dùng tính năng <strong>Tạm đóng chỗ nghỉ</strong> để giữ thông tin khi cần mở bán lại.
              </div>
              <div className="mt-4">
                <PartnerPropertyActions
                  propertyId={activeProperty.id}
                  status={activeProperty.status as any}
                  isActive={Boolean(activeProperty.is_active)}
                />
              </div>
            </div>
          ),
        };
      default:
        return {
          title: "Thông tin chi tiết",
          description: "Thông số cấu hình chỗ nghỉ.",
          icon: Layers,
          breadcrumb: "Cấu hình",
          content: <EmptyState isDeveloping />,
        };
    }
  };

  const config = getSubConfig();
  const Icon = config.icon;

  return (
    <HostExtranetShell active="home" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title={config.title}
          description={config.description}
          breadcrumbs={[
            { label: "Chỗ nghỉ", href: "/host/property" },
            { label: config.breadcrumb },
          ]}
        />

        {pageParams.status && (
          <div className="mb-6 flex items-center gap-2 border border-emerald-300 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>Thực hiện thao tác thành công!</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Area */}
          <div className="border border-slate-200 bg-white p-6 md:p-8 rounded-sm shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-[#f60057]">
              <Icon className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold">Cấu hình</h2>
            </div>
            {config.content}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="border border-slate-250 bg-white p-5 rounded-sm">
              <h4 className="font-bold text-sm text-slate-900">Thông tin chỗ nghỉ chọn</h4>
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <p><strong>Tên:</strong> {activeProperty.name}</p>
                <p><strong>ID:</strong> {propertyId}</p>
                <p><strong>Trạng thái:</strong> {activeProperty.status}</p>
              </div>
              <div className="mt-4 border-t pt-4">
                <Link href={propertyHref} className="text-xs font-bold text-[#f60057] hover:underline">
                  Đi tới trang quản trị chỗ nghỉ này ›
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </HostExtranetShell>
  );
}

function StatCardMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-sm text-center">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <p className="mt-2 text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}

function PlusIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
