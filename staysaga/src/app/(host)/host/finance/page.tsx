import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { FinanceForm } from "../_components/FinanceForm";
import { FeedbackButtons } from "../_components/FeedbackButtons";

export default async function HostFinancePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/finance");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="finance" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-black text-slate-900">Hóa đơn</h1>
          <FeedbackButtons />
        </div>

        {/* Payment Status Banner */}
        <div className="mt-8 flex flex-col items-center gap-6 rounded-sm border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:p-8">
          <div className="flex shrink-0 items-center justify-center">
            <svg
              width="140"
              height="110"
              viewBox="0 0 140 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 select-none"
            >
              {/* Calendar Shadow / Background Sheet */}
              <rect x="25" y="15" width="70" height="70" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
              {/* Main Calendar Sheet */}
              <rect x="20" y="20" width="70" height="70" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
              {/* Calendar Header (Pink/Red to match StaySaga) */}
              <path d="M20 28C20 23.5817 23.5817 20 28 20H82C86.4183 20 90 23.5817 90 28V32H20V28Z" fill="#f60057" />
              {/* Binding rings */}
              <rect x="35" y="14" width="6" height="10" rx="3" fill="#94A3B8" />
              <rect x="69" y="14" width="6" height="10" rx="3" fill="#94A3B8" />
              {/* Calendar Checkmark */}
              <circle cx="55" cy="55" r="16" fill="#DCFCE7" />
              <path d="M49 55L53 59L61 51" stroke="#15803D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Coins Stack */}
              {/* Coin 1 (Back) */}
              <ellipse cx="98" cy="85" rx="18" ry="10" fill="url(#goldGradient)" stroke="#D97706" strokeWidth="1.5" />
              <ellipse cx="98" cy="81" rx="18" ry="10" fill="url(#goldGradientLight)" stroke="#D97706" strokeWidth="1.5" />
              
              {/* Coin 2 (Front) */}
              <ellipse cx="82" cy="92" rx="18" ry="10" fill="url(#goldGradient)" stroke="#D97706" strokeWidth="1.5" />
              <ellipse cx="82" cy="88" rx="18" ry="10" fill="url(#goldGradientLight)" stroke="#D97706" strokeWidth="1.5" />
              
              {/* Gradients */}
              <defs>
                <linearGradient id="goldGradient" x1="82" y1="82" x2="82" y2="102" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="goldGradientLight" x1="82" y1="78" x2="82" y2="98" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              
              {/* Sparkles */}
              <path d="M112 65L115 68M115 68L118 65M115 68L112 71M115 68L118 71" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 78L14 80M14 80L16 78M14 80L12 82M14 80L16 82" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900">
              Quý vị đã thanh toán tất cả hóa đơn!
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Các hóa đơn hoa hồng mới và giấy tờ cần thanh toán sẽ hiển thị ở đây vào đầu chu kỳ thanh toán tiếp theo.
            </p>
          </div>
        </div>

        {/* Download Section Card */}
        <div className="mt-6 rounded-sm border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">
            Tải hóa đơn và các loại giấy tờ khác
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Tại đây, Quý vị có thể tải xuống các loại giấy tờ tài chính theo tháng trả phòng và chỉ dành cho các chỗ nghỉ đang thuộc sở hữu của nhóm. Tùy vào số lượng tập tin Quý vị có, có thể mất chút thời gian để tạo đường link tải xuống và các đường link này sẽ có hiệu lực trong 6 giờ.
          </p>
          <FinanceForm />
        </div>
      </main>
    </HostExtranetShell>
  );
}
