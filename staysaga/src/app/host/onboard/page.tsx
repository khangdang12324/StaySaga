import Link from "next/link";
import { Check, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessPartner,
  getUserRole,
  type AppRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import {
  login,
  signInWithFacebook,
  signInWithGoogle,
} from "@/core/auth/actions";
import { promoteToHost } from "@/core/host/actions";

export const metadata = {
  title: "Tạo tài khoản đối tác",
};

type HostOnboardPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
    success?: string;
  }>;
};

export default async function HostOnboardPage({ searchParams }: HostOnboardPageProps) {
  const supabase = await createClient();
  const params = searchParams ? await searchParams : {};
  const next = getSafeNextPath(params.next) ?? "/host/register";
  const onboardNext = `/host/onboard?next=${next}`;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role: AppRole | null = user
    ? await getUserRole(supabase as unknown as SupabaseLike, user.id)
    : null;

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "bạn";
  const userEmail = user?.email || "";
  const showSuccess = params.success === "partner" || Boolean(role && canAccessPartner(role));
  async function loginAndContinue(formData: FormData) {
    "use server";
    await login(formData);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-950">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-3xl font-black tracking-tight">
            StaySaga<span className="text-white">.</span>
          </Link>
          <Link href="/help" className="inline-flex items-center gap-2 text-base font-bold">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
            Trợ giúp
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-80px)] items-start justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {showSuccess ? (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-7 w-7" aria-hidden="true" />
              </span>
              <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
                Đăng ký thành công
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Tài khoản {userEmail || userName} đã được kích hoạt quyền đối tác.
              </p>
              <Link
                href={next}
                className="mt-7 flex w-full justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-rose-700 hover:shadow-lg"
              >
                Bắt đầu đăng ký chỗ nghỉ
              </Link>
            </div>
          ) : user ? (
            <div className="text-center">
              <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
                Tạo tài khoản đối tác
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Bạn đang đăng nhập bằng <span className="font-semibold">{userEmail || userName}</span>.
              </p>
              {params.error === "partner_failed" && (
                <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-500">
                  Không thể kích hoạt quyền đối tác. Vui lòng thử lại.
                </div>
              )}
              <form action={promoteToHost} className="mt-8">
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-rose-700 hover:shadow-lg"
                >
                  Tạo tài khoản đối tác
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
                  Tạo tài khoản đối tác
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Hoặc{" "}
                  <Link
                    href={`/register?next=${encodeURIComponent(onboardNext)}`}
                    className="font-medium text-rose-600 transition-colors hover:text-rose-500"
                  >
                    đăng ký tài khoản mới
                  </Link>
                </p>
              </div>

              <form className="mt-8 space-y-6" action={loginAndContinue}>
                <input type="hidden" name="next" value={onboardNext} />
                {params.error === "auth_failed" && (
                  <div className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-500">
                    Đăng nhập không thành công. Vui lòng thử lại.
                  </div>
                )}
                <div className="space-y-4 rounded-md shadow-sm">
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="relative block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition-all focus:z-10 focus:border-rose-500 focus:outline-none focus:ring-rose-500 sm:text-sm"
                    placeholder="Địa chỉ Email"
                  />
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="relative block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition-all focus:z-10 focus:border-rose-500 focus:outline-none focus:ring-rose-500 sm:text-sm"
                    placeholder="Mật khẩu"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center text-sm text-gray-900">
                    <input
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="ml-2">Ghi nhớ đăng nhập</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm font-medium text-rose-600 hover:text-rose-500">
                    Quên mật khẩu?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="group relative flex w-full justify-center rounded-xl border border-transparent bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-rose-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  Đăng nhập
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Hoặc tiếp tục với</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <form action={signInWithGoogle}>
                    <input type="hidden" name="next" value={onboardNext} />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none"
                    >
                      Google
                    </button>
                  </form>

                  <form action={signInWithFacebook}>
                    <input type="hidden" name="next" value={onboardNext} />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-[#1877F2] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#1865F2] focus:outline-none"
                    >
                      Facebook
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function getSafeNextPath(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  return next;
}
