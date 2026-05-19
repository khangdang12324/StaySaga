import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("vi-VN");

export default async function HostFinancePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/finance");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { totalRevenue } = await getHostDashboardData();
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="finance" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black">Tài chính</h1>
        <section className="mt-10 border border-slate-200 bg-white p-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase text-[#f60057]">Tổng đã ghi nhận</p>
            <h2 className="mt-3 text-4xl font-black">VND {currency.format(totalRevenue)}</h2>
            <p className="mt-4 text-slate-700">
              Doanh thu được tổng hợp từ các booking không bị hủy thuộc chỗ nghỉ của Quý vị.
            </p>
          </div>
        </section>

        <section className="mt-8 border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-black">Tải hóa đơn và các loại giấy tờ khác</h2>
          <p className="mt-4 text-slate-700">
            Tạo tập tin tài chính theo tháng để tải xuống báo cáo doanh thu, hoa hồng và đối soát.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="border border-[#f60057] px-4 py-3 font-bold text-[#f60057]">2026</button>
            <button className="border border-[#f60057] px-4 py-3 font-bold text-[#f60057]">Tháng 5</button>
            <button className="border border-[#f60057] px-4 py-3 font-bold text-[#f60057]">Tóm tắt giấy tờ XLS</button>
            <button className="ml-auto rounded bg-[#f60057] px-6 py-3 font-bold text-white hover:bg-[#f60057]">Tạo tập tin</button>
          </div>
        </section>
      </main>
    </HostExtranetShell>
  );
}
