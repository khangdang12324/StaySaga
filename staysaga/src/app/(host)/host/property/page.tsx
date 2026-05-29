import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import { Home, Edit2, Eye, Plus } from "lucide-react";

export default async function HostPropertyListPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/property");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  // Fetch properties
  const { data: homestays } = await supabase
    .from("homestays")
    .select(`
      id,
      name,
      address,
      city,
      price_per_night,
      status,
      is_active,
      homestay_images(id, url)
    `)
    .eq("owner_id", session.user.id)
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="home" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title="Thông tin chỗ nghỉ"
          description="Danh sách các căn hộ, homestay của bạn trên StaySaga. Nhấp chọn chỉnh sửa hoặc xem chi tiết từng chỗ nghỉ."
          breadcrumbs={[{ label: "Chỗ nghỉ" }]}
          actions={
            <Link
              href="/host/register?new=1"
              className="inline-flex h-11 items-center gap-2 bg-[#f60057] px-5 font-bold text-white hover:bg-[#d9004c]"
            >
              <Plus className="h-5 w-5" />
              Thêm chỗ nghỉ mới
            </Link>
          }
        />

        {!homestays || homestays.length === 0 ? (
          <EmptyState
            title="Chưa có chỗ nghỉ nào"
            description="Đăng ký chỗ nghỉ đầu tiên trên StaySaga ngay hôm nay."
            actionHref="/host/register?new=1"
            actionLabel="Đăng ký chỗ nghỉ"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {homestays.map((item) => {
              const image = item.homestay_images?.[0]?.url;
              return (
                <div key={item.id} className="border border-slate-250 bg-white overflow-hidden shadow-sm flex flex-col justify-between rounded-sm">
                  <div>
                    {/* Property Image */}
                    <div className="relative h-48 bg-slate-100">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={item.name || "Ảnh chỗ nghỉ"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <Home className="h-12 w-12" />
                        </div>
                      )}
                      <span
                        className={`absolute left-3 top-3 inline-flex rounded-sm px-2 py-0.5 text-xs font-bold text-white uppercase ${
                          item.status === "APPROVED" && item.is_active
                            ? "bg-emerald-700"
                            : "bg-[#f60057]"
                        }`}
                      >
                        {item.status === "APPROVED" && item.is_active ? "Hoạt động" : "Đang đóng"}
                      </span>
                    </div>

                    {/* Property Meta */}
                    <div className="p-5">
                      <h3 className="text-[17px] font-bold text-slate-900 line-clamp-1">
                        {item.name || "Chỗ nghỉ chưa đặt tên"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {item.address ? `${item.address}, ` : ""}{item.city}
                      </p>
                      <p className="mt-4 text-[15px] font-black text-[#f60057]">
                        {item.price_per_night
                          ? `${new Intl.NumberFormat("vi-VN").format(Number(item.price_per_night))} VND / đêm`
                          : "Chưa thiết lập giá"}
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center justify-between gap-3">
                    <Link
                      href={`/host/${item.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 border border-slate-350 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem chi tiết
                    </Link>
                    <Link
                      href={`/host/properties/${item.id}/edit`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 border border-[#f60057] bg-white px-3 py-2 text-xs font-bold text-[#f60057] hover:bg-rose-50"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Chỉnh sửa
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </HostExtranetShell>
  );
}
