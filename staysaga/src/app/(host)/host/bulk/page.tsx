import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const filters = [
  ["Chương trình đối tác", 1],
  ["Khuyến mãi", 7],
  ["Chính sách", 14],
  ["Tùy chọn tính năng nhắn tin", 4],
  ["Nhà cung cấp kết nối", 2],
  ["Dịch vụ giá trị gia tăng", 1],
] as const;

const sections = [
  ["Chương trình Đối tác Ưu tiên", "Chương trình tăng độ hiện diện dành cho các đối tác đạt thành tích cao."],
  ["Tạo Ưu Đãi Chỗ Nghỉ Mới", "Nhận đơn đặt đầu tiên nhanh hơn bằng cách giảm giá trong thời gian giới hạn."],
  ["Mức giá theo quốc gia", "Tạo giá riêng cho khách từ khu vực Quý vị muốn nhắm đến."],
  ["Giá trên điện thoại", "Tăng lượt xem từ khách sử dụng thiết bị di động."],
  ["Loại giá theo tuần", "Nổi bật hơn với khách muốn lưu trú 1 tuần hoặc lâu hơn."],
  ["Loại giá không hoàn tiền", "Giảm tỉ lệ hủy đặt phòng bằng chính sách không hoàn tiền."],
  ["Bản mẫu tin nhắn", "Tạo và quản lý bản mẫu tin nhắn gửi cho khách."],
];

export default async function HostBulkPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/bulk");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="bulk" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <h1 className="text-3xl font-black">Chỉnh sửa đồng loạt</h1>
        <p className="mt-2 text-slate-700">Chỉnh sửa chi tiết nhiều chỗ nghỉ trong một lần.</p>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <aside>
            <h2 className="mb-4 text-xl font-black">Lọc theo:</h2>
            <div className="space-y-4">
              {filters.map(([label, count]) => (
                <label key={label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <input type="checkbox" className="h-5 w-5 accent-[#f60057]" />
                    {label}
                  </span>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-sm font-bold">{count}</span>
                </label>
              ))}
            </div>
            <button className="mt-8 font-bold text-[#f60057]">Cài lại</button>
          </aside>

          <section className="space-y-5">
            {sections.map(([title, description]) => (
              <div key={title} className="flex items-center justify-between border border-slate-200 bg-white p-6">
                <div>
                  <h2 className="text-2xl font-black">{title}</h2>
                  <p className="mt-2 text-slate-700">{description}</p>
                </div>
                <button className="min-w-44 border border-[#f60057] px-5 py-3 font-bold text-[#f60057]">
                  Hành động
                </button>
              </div>
            ))}
          </section>
        </div>
      </main>
    </HostExtranetShell>
  );
}

