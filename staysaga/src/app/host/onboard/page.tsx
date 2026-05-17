import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { promoteToHost } from "@/core/host/actions";

export const metadata = {
  title: "Trở thành Host",
};

export default async function HostOnboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const role = session?.user
    ? await getUserRole(supabase as any, session.user.id)
    : "guest";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-xl w-full p-8 rounded-2xl shadow-sm border bg-white">
        <h1 className="text-2xl font-bold mb-4">Trở thành Host</h1>
        <p className="text-gray-600 mb-6">
          Nhấn vào nút bên dưới để kích hoạt tài khoản Host. Nếu chưa có tài
          khoản, bạn có thể đăng nhập hoặc tạo tài khoản mới trước khi tiếp tục.
        </p>

        {role === "guest" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/login?next=/host/onboard"
              className="rounded-xl bg-rose-600 px-6 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-rose-700"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register?next=/host/onboard"
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Tạo tài khoản mới
            </Link>
          </div>
        ) : (
          <form
            action={promoteToHost}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-rose-700"
            >
              Kích hoạt làm Host
            </button>
            {(role === "host" || role === "admin") && (
              <Link
                href="/host"
                className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Vào trang quản lý
              </Link>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
