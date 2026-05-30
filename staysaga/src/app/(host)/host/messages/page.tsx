import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const messages = [
  ["StaySaga ID chỗ nghỉ - Tóm tắt về tài khoản", "ngày 6 tháng 5 năm 2026 - 04:57:41"],
  ["StaySaga ID chỗ nghỉ - Tóm tắt về tài khoản", "ngày 6 tháng 4 năm 2026 - 06:32:55"],
  ["StaySaga ID chỗ nghỉ - Tóm tắt về tài khoản", "ngày 6 tháng 3 năm 2026 - 05:29:29"],
  ["StaySaga ID chỗ nghỉ - Tóm tắt về tài khoản", "ngày 6 tháng 2 năm 2026 - 06:26:00"],
  ["StaySaga ID chỗ nghỉ - Tóm tắt về tài khoản", "ngày 7 tháng 1 năm 2026 - 13:20:16"],
  ["Invoices & Credit Control", "ngày 12 tháng 6 năm 2025 - 09:54:55"],
];

export default async function HostMessagesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/messages");

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "Tài khoản đối tác";

  return (
    <HostExtranetShell active="messages" userName={userName}>
      <main className="mx-auto grid max-w-[1400px] gap-8 px-6 py-10 lg:grid-cols-[1fr_340px]">
        <section>
          <h1 className="text-[32px] font-bold">Hộp thư</h1>

          <div className="mt-10 flex gap-8 border-b border-gray-300">
            <button className="border-b-2 border-[#f60057] pb-4 text-[#f60057]">
              Tất cả tin nhắn{" "}
              <span className="ml-1 rounded-sm bg-[#f60057] px-1.5 py-0.5 text-sm font-bold text-white">
                5
              </span>
            </button>
            <button className="pb-4 text-gray-600">Đã đánh dấu</button>
            <button className="pb-4 text-gray-600">Đã gửi</button>
          </div>

          <div className="border border-gray-300 bg-white">
            {messages.map(([title, date], index) => (
              <div
                key={`${title}-${date}`}
                className={`grid min-h-[92px] grid-cols-[1fr_auto_44px] items-center gap-5 border-b border-gray-300 px-6 last:border-b-0 ${
                  index < 5 ? "bg-rose-50/45" : "bg-white"
                }`}
              >
                <Link href="/host/messages" className="font-semibold">
                  {title}
                </Link>
                <span className="font-semibold">{date}</span>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center text-gray-700 hover:text-[#f60057]"
                  aria-label="Xóa tin nhắn"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="h-fit border border-gray-300 bg-white p-6">
          <h2 className="text-2xl font-bold">Nhận hỗ trợ tức thì</h2>
          <p className="mt-6 text-lg leading-7">
            Tìm giải đáp cho câu hỏi của Quý vị thật nhanh chóng
          </p>
          <label className="relative mt-4 block">
            <input
              placeholder="Nhập câu hỏi của Quý vị"
              className="h-12 w-full border border-gray-400 px-3 pr-10"
            />
            <Search className="absolute right-3 top-3.5 h-5 w-5 text-gray-600" />
          </label>

          <h3 className="mt-6 font-bold">Các chủ đề phổ biến</h3>
          <ul className="mt-4 list-disc space-y-4 pl-5 text-[#f60057]">
            <li>
              <Link href="/host/bookings">Đặt phòng</Link>
            </li>
            <li>
              <Link href="/host/finance">Hoa hồng, hóa đơn và thuế</Link>
            </li>
            <li>
              <Link href="/host/revenue">Giá và Tình trạng phòng trống</Link>
            </li>
          </ul>
          <Link
            href="/help"
            className="mt-6 inline-flex border border-[#f60057] px-5 py-3 font-bold text-[#f60057]"
          >
            Xem thêm chủ đề
          </Link>

          <div className="mt-7 border-t border-gray-300 pt-6">
            <h3 className="font-bold">Không tìm được thông tin Quý vị cần?</h3>
            <Link
              href="/help"
              className="mt-5 inline-flex border border-[#f60057] px-5 py-3 font-bold text-[#f60057]"
            >
              Xem các lựa chọn liên hệ
            </Link>
          </div>
        </aside>
      </main>
    </HostExtranetShell>
  );
}
