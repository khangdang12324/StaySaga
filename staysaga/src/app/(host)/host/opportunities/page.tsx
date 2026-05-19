import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const topics = [
  "Phòng trống",
  "Xếp hạng",
  "Lượt xem trang",
  "Tỷ lệ chuyển đổi",
  "Thời gian lưu trú",
  "Giá trung bình hằng ngày",
  "Hủy đặt phòng",
  "Giảm lượng công việc",
];

export default async function HostOpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/opportunities");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { listings } = await getHostDashboardData();
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="opportunities" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black">Trung tâm Cơ hội dành cho Nhóm chỗ nghỉ</h1>
        <p className="mt-3 max-w-4xl text-slate-700">
          Giúp nâng cao hiệu suất hoạt động bằng các cơ hội cải thiện dựa trên dữ liệu chỗ nghỉ, booking và hành vi người dùng.
        </p>

        <section className="mt-10 border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-black">Hiệu quả hoạt động</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {topics.map((topic) => (
              <button key={topic} className="border border-slate-300 bg-white px-4 py-2 font-bold hover:border-[#f60057] hover:text-[#f60057]">
                {topic}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Opportunity title="Tăng lượng đặt phòng từ khách gia đình lên tới 15%" count={`${Math.max(listings.length, 1)} chỗ nghỉ`} />
          <Opportunity title="Thiết lập kế hoạch mở lại chỗ nghỉ" count={`${Math.max(listings.length, 1)} chỗ nghỉ`} />
          <Opportunity title="Thêm ưu đãi lưu trú dài ngày" count="Cơ hội mới" />
        </section>
      </main>
    </HostExtranetShell>
  );
}

function Opportunity({ title, count }: { title: string; count: string }) {
  return (
    <div className="border border-slate-200 bg-white p-6">
      <p className="text-sm font-bold text-[#f60057]">{count}</p>
      <h2 className="mt-3 text-xl font-black">{title}</h2>
      <p className="mt-3 text-slate-700">
        Đề xuất được tạo từ dữ liệu vận hành và hành vi người dùng trên StaySaga.
      </p>
      <button className="mt-6 font-bold text-[#f60057]">Xem chỗ nghỉ</button>
    </div>
  );
}

