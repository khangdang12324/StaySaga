import { redirect } from "next/navigation";
import type React from "react";
import { CalendarDays, UsersRound } from "lucide-react";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const leadTime = ["0-1 ngày", "2-7 ngày", "8-30 ngày", "31-90 ngày", "91+ ngày"];
const guests = ["Khách lẻ", "Cặp đôi", "Gia đình", "Nhóm"];
const devices = ["Thiết bị di động", "Máy tính", "Thiết bị khác"];

export default async function HostMarketDataPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/market-data");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="market-data" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black">Phân tích</h1>
        <p className="mt-3 text-slate-700">Phân tích các đặt phòng có sẵn để lên kế hoạch trong tương lai.</p>
        <h2 className="mt-8 text-3xl font-black">Dữ liệu thị trường</h2>

        <section className="mt-8 border border-slate-200 bg-white p-8">
          <h3 className="text-xl font-black">
            Dữ liệu nhu cầu của khách trên StaySaga đối với quốc gia Quý vị đã chọn
          </h3>
          <p className="mt-2 text-slate-600">
            Tìm hiểu thêm về những du khách quan tâm đến các địa điểm Quý vị đã chọn và thời điểm họ dự định lưu trú.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
            <MarketBlock
              icon={<CalendarDays className="h-8 w-8" />}
              title="Thời gian đặt trước"
              description="Hầu hết tìm kiếm có thời gian đặt trước là 0-1 ngày."
              rows={leadTime}
            />
            <MarketBlock
              icon={<UsersRound className="h-8 w-8" />}
              title="Loại khách"
              description="Hầu hết tìm kiếm hiện tại đến từ khách lẻ."
              rows={guests}
            />
            <MarketBlock
              icon={<UsersRound className="h-8 w-8" />}
              title="Khách trong nước và quốc tế"
              description="Theo dõi nguồn khách để tạo giá theo quốc gia."
              rows={["Trong nước", "Quốc tế"]}
            />
            <MarketBlock
              icon={<CalendarDays className="h-8 w-8" />}
              title="Thiết bị"
              description="Hầu hết tìm kiếm có xu hướng đến từ thiết bị di động."
              rows={devices}
            />
          </div>
        </section>
      </main>
    </HostExtranetShell>
  );
}

function MarketBlock({
  icon,
  title,
  description,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  rows: string[];
}) {
  return (
    <div>
      <div className="flex gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div>
          <h4 className="text-xl font-black">{title}</h4>
          <p className="mt-2 text-slate-600">{description}</p>
        </div>
      </div>
      <div className="mt-8 space-y-6">
        {rows.map((row) => (
          <div key={row}>
            <div className="flex justify-between font-bold">
              <span>{row}</span>
              <span>0%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-full w-0 rounded-full bg-[#f60057]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
