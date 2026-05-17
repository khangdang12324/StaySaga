import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessPartner,
  getUserRole,
  type AppRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { promoteToHost } from "@/core/host/actions";

export const metadata = {
  title: "Đăng chỗ nghỉ",
};

type HostOnboardPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function HostOnboardPage({
  searchParams,
}: HostOnboardPageProps) {
  const supabase = await createClient();
  const params = searchParams ? await searchParams : {};
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const role: AppRole | null = session?.user
    ? await getUserRole(supabase as unknown as SupabaseLike, session.user.id)
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-xl rounded-2xl border border-rose-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-rose-600">
          StaySaga Partner
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-gray-950">
          Đăng chỗ nghỉ của Quý vị
        </h1>
        <p className="mt-4 text-sm font-medium leading-6 text-gray-700">
          Tài khoản PARTNER có thể đăng homestay/khách sạn, upload ảnh, quản lý
          chỗ nghỉ và xem booking thuộc chỗ nghỉ của mình. Sau khi kích hoạt,
          bạn sẽ được chuyển thẳng vào trang quản lý.
        </p>

        {params.error === "partner_failed" && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
            Không thể kích hoạt quyền PARTNER. Kiểm tra cấu hình Supabase hoặc RLS.
          </div>
        )}

        {!role ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/login?next=/host/onboard"
              className="rounded-xl bg-rose-600 px-6 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-rose-700"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register?next=/host/onboard"
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-center text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              Tạo tài khoản mới
            </Link>
          </div>
        ) : canAccessPartner(role) ? (
          <Link
            href="/host"
            className="mt-6 inline-flex rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-rose-700"
          >
            Vào trang quản lý
          </Link>
        ) : (
          <form action={promoteToHost} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-rose-700"
            >
              Kích hoạt PARTNER và bắt đầu đăng chỗ nghỉ
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
