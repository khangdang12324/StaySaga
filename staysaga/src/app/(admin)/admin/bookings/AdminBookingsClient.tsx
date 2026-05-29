"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "react-hot-toast";
import { updateBookingStatus } from "@/core/admin/actions";
import { format } from "date-fns";
import {
  Check,
  X,
  CheckCircle,
  Search,
  Calendar,
  User,
  Home,
  AlertCircle,
  Loader2,
  Info,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
  DollarSign,
  FileText,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ServerPagination } from "@/components/ui/ServerPagination";

type BookingRow = {
  id: string;
  booking_code: string | null;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_price: number | string | null;
  status: string | null;
  payment_status: string | null;
  cancel_reason: string | null;
  special_requests: string | null;
  created_at: string;
  guest: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  homestay: {
    id: string;
    name: string | null;
    city: string | null;
    owner_id: string | null;
    owner: {
      id: string;
      full_name: string | null;
      email: string | null;
      phone: string | null;
    } | null;
  } | null;
};

type Props = {
  bookings: BookingRow[];
  totalItems: number;
  itemsPerPage: number;
  tabCounts: {
    all: number;
    pending: number;
    confirmed: number;
    incoming: number;
    checkedIn: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  cities: string[];
};

export function AdminBookingsClient({
  bookings,
  totalItems,
  itemsPerPage,
  tabCounts,
  cities,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Selected Booking for Detail Drawer
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);

  // Realtime notification state
  const [hasNewBookings, setHasNewBookings] = useState(false);

  // Sync state values with search params for controlled inputs in the filter form
  const qParam = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "";
  const paymentStatusParam = searchParams.get("paymentStatus") || "";
  const checkInDateParam = searchParams.get("checkInDate") || "";
  const createdDateParam = searchParams.get("createdDate") || "";
  const currentStatusTab = searchParams.get("status") || "";
  const ownerIdParam = searchParams.get("ownerId") || "";

  // Supabase Realtime Listener for Inserts
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-new-bookings-alert")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          console.log("Realtime INSERT detected in bookings:", payload);
          setHasNewBookings(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update selected booking references if list changes due to refresh
  useEffect(() => {
    if (selectedBooking) {
      const updated = bookings.find((b) => b.id === selectedBooking.id);
      if (updated) {
        setSelectedBooking(updated);
      }
    }
  }, [bookings, selectedBooking]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatShortDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string | null) => {
    const s = status || "PENDING";
    switch (s) {
      case "PENDING":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            CHỜ XÁC NHẬN
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            ĐÃ XÁC NHẬN
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
            ĐANG LƯU TRÚ
          </span>
        );
      case "COMPLETED":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
            ĐÃ HOÀN TẤT
          </span>
        );
      case "CANCELLED":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
            ĐÃ HỦY
          </span>
        );
      case "NO_SHOW":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            KHÁCH KHÔNG ĐẾN
          </span>
        );
      default:
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            {s}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (payStatus: string | null) => {
    const s = payStatus || "UNPAID";
    switch (s) {
      case "PAID":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 whitespace-nowrap">
            ĐÃ THANH TOÁN
          </span>
        );
      case "UNPAID":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-slate-100 text-slate-600 whitespace-nowrap">
            CHƯA THANH TOÁN
          </span>
        );
      case "PAY_AT_PROPERTY":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-rose-100 text-rose-800 whitespace-nowrap">
            THANH TOÁN TẠI CHỖ
          </span>
        );
      case "REFUNDED":
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-amber-100 text-amber-800 whitespace-nowrap">
            ĐÃ HOÀN TIỀN
          </span>
        );
      default:
        return (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-slate-100 text-slate-500 whitespace-nowrap">
            {s}
          </span>
        );
    }
  };

  const getTabUrl = (statusVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (statusVal) {
      params.set("status", statusVal);
    } else {
      params.delete("status");
    }
    params.set("page", "1"); // Reset to page 1
    return `${pathname}?${params.toString()}`;
  };

  const executeStatusChange = (
    bookingId: string,
    newStatus: string,
    reason?: string,
  ) => {
    const loadingToastId = toast.loading("Đang cập nhật trạng thái đơn...");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", bookingId);
      fd.set("status", newStatus);
      if (reason) {
        fd.set("reason", reason);
      }

      try {
        await updateBookingStatus(fd);
        toast.success("Cập nhật trạng thái thành công!", {
          id: loadingToastId,
        });
        setShowCancelInput(false);
        setCancelReason("");
        router.refresh();
      } catch (err) {
        console.error("Lỗi cập nhật trạng thái đơn:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("NEXT_REDIRECT")) {
          toast.success("Cập nhật trạng thái thành công!", {
            id: loadingToastId,
          });
          setShowCancelInput(false);
          setCancelReason("");
          router.refresh();
        } else {
          toast.error("Thao tác thất bại. Vui lòng thử lại.", {
            id: loadingToastId,
          });
        }
      }
    });
  };

  const getDaysDiff = (checkIn: string, checkOut: string) => {
    try {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const diffTime = Math.abs(outDate.getTime() - inDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  return (
    <div className="relative">
      {/* 1. Realtime New Booking Banner */}
      {hasNewBookings && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800 shadow-sm animate-bounce">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 animate-pulse" />
            <span>Hệ thống vừa nhận được đơn đặt phòng mới!</span>
          </span>
          <button
            onClick={() => {
              router.refresh();
              setHasNewBookings(false);
            }}
            className="rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-black text-white uppercase tracking-wider shadow-md transition-colors"
          >
            Làm mới ngay
          </button>
        </div>
      )}

      {/* Partner filtering warning banner */}
      {ownerIdParam && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-sm">
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-rose-500 shrink-0" />
            <span>Đang lọc đơn đặt phòng của đối tác chủ chỗ nghỉ.</span>
          </span>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("ownerId");
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="rounded-lg bg-white border border-rose-200 hover:bg-rose-100 px-3 py-1.5 text-xs font-black text-rose-700 transition-colors uppercase tracking-wider shadow-sm"
          >
            Hiển thị tất cả đối tác
          </button>
        </div>
      )}

      {/* 2. Status Navigation Tabs (OTA style) */}
      <div className="mb-6 border-b border-slate-200 bg-white rounded-t-xl px-4 overflow-x-auto flex scrollbar-none shadow-sm">
        <div className="flex gap-6 min-w-max">
          <Link
            href={getTabUrl("")}
            className={`py-4 text-xs font-bold border-b-2 transition-all ${
              currentStatusTab === ""
                ? "border-rose-600 text-rose-600 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Tất cả ({tabCounts.all})
          </Link>
          <Link
            href={getTabUrl("PENDING")}
            className={`py-4 text-xs font-bold border-b-2 transition-all ${
              currentStatusTab === "PENDING"
                ? "border-rose-600 text-rose-600 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Chờ xác nhận ({tabCounts.pending})
          </Link>
          <Link
            href={getTabUrl("CONFIRMED")}
            className={`py-4 text-xs font-bold border-b-2 transition-all ${
              currentStatusTab === "CONFIRMED"
                ? "border-rose-600 text-rose-600 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Đã xác nhận ({tabCounts.confirmed})
          </Link>
          <Link
            href={getTabUrl("INCOMING")}
            className={`py-4 text-xs font-bold border-b-2 transition-all ${
              currentStatusTab === "INCOMING"
                ? "border-rose-600 text-rose-600 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Sắp nhận phòng ({tabCounts.incoming})
          </Link>
          <Link
            href={getTabUrl("CHECKED_IN")}
            className={`py-4 text-xs font-bold border-b-2 transition-all ${
              currentStatusTab === "CHECKED_IN"
                ? "border-rose-600 text-rose-600 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Đang lưu trú ({tabCounts.checkedIn})
          </Link>
          <Link
            href={getTabUrl("COMPLETED")}
            className={`py-4 text-xs font-bold border-b-2 transition-all ${
              currentStatusTab === "COMPLETED"
                ? "border-rose-600 text-rose-600 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Hoàn tất ({tabCounts.completed})
          </Link>
          <Link
            href={getTabUrl("CANCELLED")}
            className={`py-4 text-xs font-bold border-b-2 transition-all ${
              currentStatusTab === "CANCELLED"
                ? "border-rose-600 text-rose-600 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Đã hủy ({tabCounts.cancelled})
          </Link>
          <Link
            href={getTabUrl("NO_SHOW")}
            className={`py-4 text-xs font-bold border-b-2 transition-all ${
              currentStatusTab === "NO_SHOW"
                ? "border-rose-600 text-rose-600 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Khách không đến ({tabCounts.noShow})
          </Link>
        </div>
      </div>

      {/* 3. Filter and Search Form */}
      <form
        method="GET"
        action={pathname}
        className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5 items-end"
      >
        {/* Pass hidden values for tab & page settings */}
        <input type="hidden" name="status" value={currentStatusTab} />
        {ownerIdParam && (
          <input type="hidden" name="ownerId" value={ownerIdParam} />
        )}

        <div className="block md:col-span-2">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
            Tìm kiếm đơn đặt
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={qParam}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none focus:border-rose-500 transition-colors"
              placeholder="Mã đơn, tên/email khách, chỗ nghỉ..."
            />
          </div>
        </div>

        <div className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
            Thành phố
          </span>
          <select
            name="city"
            defaultValue={cityParam}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="">Tất cả</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
            Thanh toán
          </span>
          <select
            name="paymentStatus"
            defaultValue={paymentStatusParam}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PAY_AT_PROPERTY">Thanh toán tại chỗ</option>
            <option value="REFUNDED">Đã hoàn tiền</option>
          </select>
        </div>

        <div className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
            Ngày nhận phòng
          </span>
          <input
            type="date"
            name="checkInDate"
            defaultValue={checkInDateParam}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 cursor-pointer"
          />
        </div>

        <div className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
            Ngày đặt phòng
          </span>
          <input
            type="date"
            name="createdDate"
            defaultValue={createdDateParam}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 cursor-pointer"
          />
        </div>

        <div className="md:col-span-3 flex justify-end gap-2">
          <Link
            href={pathname}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm"
          >
            Đặt lại bộ lọc
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-rose-600 hover:bg-rose-700 px-6 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md transition-colors"
          >
            Lọc kết quả
          </button>
        </div>
      </form>

      {/* 4. Bookings Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1360px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Mã đơn</th>
                <th className="px-6 py-4 whitespace-nowrap">Khách hàng</th>
                <th className="px-6 py-4 whitespace-nowrap">Chỗ nghỉ</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  Nhận phòng
                </th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  Trả phòng
                </th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  Khách
                </th>
                <th className="px-6 py-4 whitespace-nowrap">Tổng tiền</th>
                <th className="px-6 py-4 whitespace-nowrap">Thanh toán</th>
                <th className="px-6 py-4 whitespace-nowrap">Trạng thái đơn</th>
                <th className="px-6 py-4 whitespace-nowrap">Ngày đặt</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-6 py-16 text-center text-slate-500 font-bold"
                  >
                    Chưa có đơn đặt phòng nào.
                  </td>
                </tr>
              ) : (
                bookings.map((bk) => (
                  <tr
                    key={bk.id}
                    onClick={() => {
                      setSelectedBooking(bk);
                      setShowCancelInput(false);
                      setCancelReason("");
                    }}
                    className="hover:bg-slate-50/70 transition-colors align-middle cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-black text-slate-900 whitespace-nowrap">
                      {bk.booking_code}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-snug">
                            {bk.guest?.full_name || "Khách Vãng Lai"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {bk.guest?.email || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                          <Home className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-snug max-w-[200px] truncate">
                            {bk.homestay?.name || "Chỗ nghỉ bị xóa"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {bk.homestay?.city || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {formatShortDate(bk.check_in_date)}
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {formatShortDate(bk.check_out_date)}
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black text-slate-900 whitespace-nowrap">
                      {bk.guests} khách
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-950 whitespace-nowrap">
                      {typeof bk.total_price === "number"
                        ? formatVND(bk.total_price)
                        : bk.total_price || "0 đ"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(bk.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(bk.status)}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {formatShortDate(bk.created_at)}
                    </td>
                    <td
                      className="px-6 py-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setSelectedBooking(bk);
                          setShowCancelInput(false);
                          setCancelReason("");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
                      >
                        Chi tiết <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ServerPagination totalItems={totalItems} itemsPerPage={itemsPerPage} />
      </div>

      {/* 5. Detail Slide-out Drawer Panel */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedBooking(null)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-right border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                  Chi tiết đơn đặt
                </p>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  Mã:{" "}
                  <span className="font-mono text-slate-700">
                    {selectedBooking.booking_code}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold text-sm shadow-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Status Section */}
              <div className="p-4 rounded-xl border bg-slate-50/50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Trạng thái đơn
                  </span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Thanh toán
                  </span>
                  {getPaymentStatusBadge(selectedBooking.payment_status)}
                </div>
                {selectedBooking.status === "CANCELLED" &&
                  selectedBooking.cancel_reason && (
                    <div className="mt-2 p-2.5 rounded bg-rose-50 border border-rose-100 text-xs font-bold text-rose-800">
                      <p className="font-black uppercase tracking-wider text-[9px] text-rose-500 mb-0.5">
                        Lý do hủy:
                      </p>
                      {selectedBooking.cancel_reason}
                    </div>
                  )}
              </div>

              {/* Guest Profile Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" /> Thông tin khách
                  hàng
                </h4>
                <div className="p-3 border rounded-xl space-y-2 bg-white text-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Tên khách:</span>
                    <span className="font-extrabold text-slate-900">
                      {selectedBooking.guest?.full_name || "Khách Vãng Lai"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Email:</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-400" />{" "}
                      {selectedBooking.guest?.email || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">
                      Số điện thoại:
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />{" "}
                      {selectedBooking.guest?.phone || "Chưa cung cấp"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Homestay details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="h-4 w-4 text-slate-400" /> Chi tiết chỗ nghỉ
                </h4>
                <div className="p-3 border rounded-xl space-y-2 bg-white text-slate-800">
                  <div className="flex justify-between items-start text-xs">
                    <span className="font-bold text-slate-500 shrink-0">
                      Tên chỗ nghỉ:
                    </span>
                    <span className="font-extrabold text-slate-900 text-right">
                      {selectedBooking.homestay?.name || "Chỗ nghỉ bị xóa"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Thành phố:</span>
                    <span className="font-bold text-slate-900">
                      {selectedBooking.homestay?.city || "-"}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 my-2 pt-2" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">
                      Chủ homestay:
                    </span>
                    <span className="font-extrabold text-slate-950 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />{" "}
                      {selectedBooking.homestay?.owner?.full_name || "Chưa rõ"}
                    </span>
                  </div>
                  {selectedBooking.homestay?.owner?.email && (
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>Email chủ:</span>
                      <span>{selectedBooking.homestay?.owner?.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule and Pricing details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" /> Thời gian lưu
                  trú & Giá
                </h4>
                <div className="p-3 border rounded-xl space-y-2.5 bg-white text-slate-800">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Check-In
                      </p>
                      <p className="text-xs font-black text-slate-900 mt-0.5">
                        {formatShortDate(selectedBooking.check_in_date)}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Check-Out
                      </p>
                      <p className="text-xs font-black text-slate-900 mt-0.5">
                        {formatShortDate(selectedBooking.check_out_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">
                      Số đêm lưu trú:
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {getDaysDiff(
                        selectedBooking.check_in_date,
                        selectedBooking.check_out_date,
                      )}{" "}
                      đêm
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">
                      Số lượng khách:
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {selectedBooking.guests} khách
                    </span>
                  </div>
                  <div className="border-t border-slate-100 my-2 pt-2" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Tổng
                      tiền:
                    </span>
                    <span className="font-black text-sm text-rose-600">
                      {typeof selectedBooking.total_price === "number"
                        ? formatVND(selectedBooking.total_price)
                        : selectedBooking.total_price || "0 đ"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400" /> Yêu cầu đặc
                  biệt
                </h4>
                <div className="p-3 border rounded-xl bg-white text-xs font-bold text-slate-700 min-h-[60px]">
                  {selectedBooking.special_requests ||
                    "Không có yêu cầu đặc biệt."}
                </div>
              </div>

              {/* Booking Logs */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Lịch sử giao dịch
                </h4>
                <div className="p-3 border rounded-xl bg-white space-y-2 text-[10px] text-slate-500 font-semibold">
                  <div className="flex justify-between">
                    <span>Đơn được tạo lúc:</span>
                    <span className="font-mono">
                      {formatDateTime(selectedBooking.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cập nhật cuối lúc:</span>
                    <span className="font-mono">
                      {formatDateTime(selectedBooking.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions (ADMIN status changes) */}
            <div className="p-5 border-t border-slate-200 bg-slate-50">
              {isPending && (
                <div className="mb-3 flex items-center justify-center gap-2 text-xs font-bold text-rose-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang cập nhật hệ
                  thống...
                </div>
              )}

              <div className="space-y-2">
                {/* 1. Confirm pending booking */}
                {selectedBooking.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        executeStatusChange(selectedBooking.id, "CONFIRMED")
                      }
                      disabled={isPending}
                      className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-800/10 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Xác nhận đơn
                    </button>
                    <button
                      onClick={() => {
                        const confirmReject = window.confirm(
                          "Bạn có chắc chắn muốn Từ chối đơn đặt phòng này?",
                        );
                        if (confirmReject) {
                          executeStatusChange(selectedBooking.id, "REJECTED");
                        }
                      }}
                      disabled={isPending}
                      className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2.5 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </div>
                )}

                {/* 2. Transition from Confirmed to Checked-in */}
                {selectedBooking.status === "CONFIRMED" && (
                  <button
                    onClick={() =>
                      executeStatusChange(selectedBooking.id, "CHECKED_IN")
                    }
                    disabled={isPending}
                    className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 text-white py-2.5 text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" /> Khách đã nhận phòng
                    (CHECKED_IN)
                  </button>
                )}

                {/* 3. Transition from Checked-in to Completed */}
                {selectedBooking.status === "CHECKED_IN" && (
                  <button
                    onClick={() =>
                      executeStatusChange(selectedBooking.id, "COMPLETED")
                    }
                    disabled={isPending}
                    className="w-full rounded-lg bg-rose-600 hover:bg-rose-700 text-white py-2.5 text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Đơn hoàn tất (COMPLETED)
                  </button>
                )}

                {/* 4. Incoming No-show check */}
                {selectedBooking.status === "CONFIRMED" && (
                  <button
                    onClick={() => {
                      const confirmNoShow = window.confirm(
                        "Xác nhận khách không đến nhận phòng (NO_SHOW)?",
                      );
                      if (confirmNoShow) {
                        executeStatusChange(selectedBooking.id, "NO_SHOW");
                      }
                    }}
                    disabled={isPending}
                    className="w-full rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    Khách không đến (NO_SHOW)
                  </button>
                )}

                {/* 5. Cancel Booking button with reason handling */}
                {(selectedBooking.status === "PENDING" ||
                  selectedBooking.status === "CONFIRMED") && (
                  <div className="pt-2 border-t border-slate-200">
                    {showCancelInput ? (
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-2">
                        <label className="block text-[10px] font-black text-rose-700 uppercase">
                          Lý do hủy đơn *
                        </label>
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Nhập lý do hủy..."
                          className="w-full text-xs font-bold p-2 border rounded-lg border-rose-200 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white text-slate-900"
                          rows={2}
                          required
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setShowCancelInput(false);
                              setCancelReason("");
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-white border border-rose-200 text-rose-700 rounded-md hover:bg-rose-100"
                          >
                            Quay lại
                          </button>
                          <button
                            onClick={() =>
                              executeStatusChange(
                                selectedBooking.id,
                                "CANCELLED",
                                cancelReason,
                              )
                            }
                            disabled={isPending || !cancelReason.trim()}
                            className="px-2.5 py-1 text-[10px] font-black bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50"
                          >
                            Xác nhận hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCancelInput(true)}
                        className="w-full rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X className="h-4 w-4" /> Hủy đơn đặt phòng
                      </button>
                    )}
                  </div>
                )}

                {/* Finalized states info */}
                {selectedBooking.status === "COMPLETED" && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-xs font-bold text-rose-700 text-center rounded-xl">
                    Đơn đặt đã hoàn thành. Không thể chỉnh sửa trạng thái.
                  </div>
                )}
                {selectedBooking.status === "CANCELLED" && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-xs font-bold text-rose-700 text-center rounded-xl">
                    Đơn đặt đã bị hủy bỏ. Không thể chỉnh sửa trạng thái.
                  </div>
                )}
                {selectedBooking.status === "NO_SHOW" && (
                  <div className="p-3 bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 text-center rounded-xl">
                    Đơn đặt đánh dấu vắng mặt. Không thể chỉnh sửa trạng thái.
                  </div>
                )}
                {selectedBooking.status === "REJECTED" && (
                  <div className="p-3 bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 text-center rounded-xl">
                    Đơn đặt đã bị từ chối. Không thể chỉnh sửa trạng thái.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
