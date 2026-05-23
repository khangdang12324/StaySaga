import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { getHostDashboardData } from "@/core/host/actions";
import { logout } from "@/core/auth/actions";
import { ArrowRight, Bell, Check, CreditCard, Globe, Search, UserCircle, Shield } from "lucide-react";

export default async function ListYourPropertyPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login?next=/host/list");
  }

  let hostHref = "/host";
  let userName = "";
  let listings: Awaited<ReturnType<typeof getHostDashboardData>>["listings"] = [];
  if (session?.user) {
    const role = await getUserRole(
      supabase as unknown as SupabaseLike,
      session.user.id,
    );
    const hasPartnerAccess = canAccessPartner(role);
    hostHref = hasPartnerAccess ? "/host" : "/host/onboard";
    userName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split("@")[0] ||
      "bạn";
    if (hasPartnerAccess) {
      const hostData = await getHostDashboardData();
      listings = hostData.listings;
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-7 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-3xl font-black tracking-tight">
            StaySaga<span className="text-white">.</span>
          </Link>
          {session?.user && (
            <>
              <span className="hidden h-8 w-px bg-white/35 md:block" />
              <div className="hidden items-center gap-3 md:flex">
                <span className="font-semibold">{userName}</span>
                <span className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold">Tài khoản chính</span>
              </div>
            </>
          )}
          <div className="ml-auto hidden h-12 w-full max-w-md items-center rounded bg-white/10 px-4 md:flex">
            <span className="flex-1 text-white/90">Tìm kiếm</span>
            <Search className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-[#d9004e] px-3 py-1 text-sm font-bold ring-1 ring-white/30">VN</span>
          <Globe className="h-6 w-6" />
          <Bell className="h-6 w-6" />
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded px-2 py-1 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/80 [&::-webkit-details-marker]:hidden">
              <span className="flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-white/80">
                <UserCircle className="h-10 w-10" />
              </span>
              <span className="hidden max-w-32 truncate font-bold md:inline">{userName}</span>
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-b-lg border border-slate-200 bg-white py-2 text-slate-950 shadow-xl">
              <Link
                href="/host"
                className="block px-5 py-3 text-base hover:bg-rose-50 hover:text-[#f60057] focus:bg-rose-50 focus:text-[#f60057] focus:outline-none"
              >
                Xem chỗ nghỉ của tôi
              </Link>
              <Link
                href="/host/register?new=1"
                className="block px-5 py-3 text-base hover:bg-rose-50 hover:text-[#f60057] focus:bg-rose-50 focus:text-[#f60057] focus:outline-none"
              >
                Thêm chỗ nghỉ mới
              </Link>
              <form action={logout} className="border-t border-slate-100">
                <button className="block w-full px-5 py-3 text-left text-base hover:bg-rose-50 hover:text-[#f60057] focus:bg-rose-50 focus:text-[#f60057] focus:outline-none">
                  Đăng xuất
                </button>
              </form>
            </div>
          </details>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-linear-to-br from-rose-50 via-white to-white">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,113,133,0.10),transparent_24%)]" />
          <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative z-10">
              <p className="uppercase text-sm tracking-[0.24em] text-rose-500 font-semibold mb-4">
                Tham gia cùng 29,279,209 chỗ nghỉ khác đã có trên StaySaga
              </p>
              <h2 className="text-5xl md:text-6xl font-black leading-tight text-gray-950">
                {session?.user ? (
                  <>
                    Chào mừng trở lại,{" "}
                    <span className="text-rose-500">{userName}</span>!
                  </>
                ) : (
                  <>
                    Đăng chỗ <span className="text-rose-500">nghỉ</span> của bạn trên
                    StaySaga
                  </>
                )}
              </h2>
              <p className="mt-6 text-lg max-w-xl text-gray-600">
                {session?.user
                  ? 'Chỉ mất ít nhất 15 phút để hoàn tất đăng ký - bấm "Tiếp tục" để tiếp tục nơi bạn đã dừng lại.'
                  : "Đăng ký trên một trong những ứng dụng du lịch được yêu thích nhất để kiếm nhiều hơn, nhanh hơn và phát triển thương hiệu của bạn."}
              </p>
            </div>

            <div className="relative z-10">
              <div className="bg-white rounded-[28px] p-8 text-gray-900 shadow-2xl shadow-rose-100 border border-rose-100 w-full max-w-md ml-auto">
                {session?.user ? (
                  <>
                    <h3 className="text-xl font-bold mb-2">
                      Tiếp tục đăng ký của bạn
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Chào mừng trở lại, {userName}!
                    </p>

                    <div className="no-scrollbar max-h-70 overflow-auto pr-1 space-y-3">
                      {(listings.length > 0 ? listings : [null, null]).map(
                        (listing, index) => (
                          <div
                            key={listing?.id || `placeholder-${index}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-3 bg-white shadow-sm"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {listing?.name || "Chỗ nghỉ mới"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Chỉnh sửa lần cuối:{" "}
                                {listing?.created_at
                                  ? new Date(
                                      listing.created_at,
                                    ).toLocaleDateString("vi-VN", {
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "27 Tháng 4, 2025"}
                              </p>
                            </div>
                            <Link
                              href={
                                listing
                                  ? (listing.status === "APPROVED" && listing.is_active)
                                    ? `/host/${listing.id}`
                                    : `/host/properties/${listing.id}/edit`
                                  : "/host/register"
                              }
                              className="inline-flex items-center justify-center rounded-lg bg-[#f60057] px-4 py-2 text-sm font-semibold text-white hover:bg-[#f60057] shrink-0"
                            >
                              Tiếp tục
                            </Link>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-sm font-semibold text-gray-800 mb-2">
                        Bắt đầu đăng ký mới?
                      </p>
                      <Link
                        href="/host/register?new=1"
                        className="inline-flex items-center justify-center gap-3 w-full rounded-full bg-[#f60057] text-white py-3 font-semibold shadow-sm hover:bg-[#f60057] transition-colors"
                      >
                        Tạo đăng ký mới <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold mb-3">
                      Đăng ký miễn phí
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-rose-500 mt-1" /> 45% chủ nhà nhận được đơn đặt phòng đầu tiên trong vòng một tuần
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-rose-500 mt-1" /> Chọn đặt phòng ngay lập tức hoặc Yêu cầu đặt phòng
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-rose-500 mt-1" /> Chúng tôi sẽ hỗ trợ thanh toán cho bạn
                      </li>
                    </ul>

                    <Link
                      href={hostHref}
                      className="inline-flex items-center justify-center gap-3 w-full rounded-full bg-[#f60057] text-white py-3 font-semibold shadow-sm hover:bg-[#f60057] transition-colors"
                    >
                      Bắt đầu ngay <ArrowRight className="w-4 h-4" />
                    </Link>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <Link
                        href="/login?next=/host/list"
                        className="hover:text-[#f60057] hover:underline"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        href="/register?next=/host/list"
                        className="hover:text-[#f60057] hover:underline"
                      >
                        Tạo tài khoản mới
                      </Link>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                      Đã bắt đầu đăng ký?{" "}
                      <Link
                        href="/host/register"
                        className="text-[#f60057] font-medium"
                      >
                        Tiếp tục đăng ký của bạn
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl border border-rose-100 bg-white shadow-sm">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-rose-500" />
                <div>
                  <h4 className="font-bold">Đón khách không lo lắng</h4>
                  <p className="text-sm text-gray-600">
                    Bảo vệ trách nhiệm pháp lý lên đến $1,000,000 và các tùy chọn bảo vệ thiệt hại.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-rose-100 bg-white shadow-sm">
              <div className="flex items-start gap-4">
                <CreditCard className="w-8 h-8 text-rose-500" />
                <div>
                  <h4 className="font-bold">Thanh toán dễ dàng</h4>
                  <p className="text-sm text-gray-600">
                    Chúng tôi hỗ trợ thanh toán và giúp bạn kiểm soát phương thức và thời gian nhận tiền.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-rose-100 bg-white shadow-sm">
              <div className="flex items-start gap-4">
                <Globe className="w-8 h-8 text-rose-500" />
                <div>
                  <h4 className="font-bold">Tiếp cận du khách toàn cầu</h4>
                  <p className="text-sm text-gray-600">
                    Đăng trên một thị trường tiếp cận hàng triệu du khách trên toàn thế giới.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-4">Bắt đầu nhanh</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl border border-rose-100 bg-white">
                <h4 className="font-semibold mb-2">Nhập chi tiết chỗ nghỉ</h4>
                <p className="text-sm text-gray-600">
                  Nhập thông tin liền mạch từ các trang web khác và tránh trùng lặp đặt phòng.
                </p>
              </div>
              <div className="p-6 rounded-3xl border border-rose-100 bg-white">
                <h4 className="font-semibold mb-2">Sử dụng điểm đánh giá</h4>
                <p className="text-sm text-gray-600">
                  Hiển thị điểm đánh giá từ các trang khác để tạo niềm tin ngay từ đầu.
                </p>
              </div>
              <div className="p-6 rounded-3xl border border-rose-100 bg-white">
                <h4 className="font-semibold mb-2">Nổi bật</h4>
                <p className="text-sm text-gray-600">
                  Huy hiệu chủ nhà mới và các công cụ quảng bá giúp tăng khả năng hiển thị sớm.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-rose-50/60 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-xl font-bold mb-4">Câu hỏi thường gặp</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
                Khi nào chỗ nghỉ của tôi sẽ trực tuyến? —{" "}
                <strong>Thường trong vòng 24 giờ</strong>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
                Điều gì xảy ra nếu chỗ nghỉ bị hư hỏng? —{" "}
                <strong>Chúng tôi cung cấp các tùy chọn bảo hiểm</strong>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
                Cần giúp đỡ? — <strong>Trung tâm hỗ trợ đối tác</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

