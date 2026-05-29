"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "react-hot-toast";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";
import {
  approveProperty,
  rejectProperty,
  hideProperty,
  reopenProperty,
  updatePropertyStatus,
  approveDeletePropertyAction,
  rejectDeletePropertyAction,
  suspendProperty,
} from "@/core/admin/actions";
import {
  X,
  Building,
  User,
  MapPin,
  DollarSign,
  Calendar,
  Home,
  Check,
  Ban,
  EyeOff,
  Unlock,
  Trash2,
  AlertCircle,
  Eye,
  InfoIcon,
  Search,
  RefreshCw,
  EyeIcon,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type RoomDetail = {
  name: string;
  max_guests: number;
  price_per_night: number;
};

type PropertyWithDetails = {
  id: string;
  owner_id: string | null;
  name: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  price_per_night: number | string | null;
  max_guests: number | string | null;
  bedrooms: number | string | null;
  beds: number | string | null;
  bathrooms: number | string | null;
  is_active: boolean | null;
  status: string | null;
  delete_reason: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  owner: { full_name: string | null; email: string | null } | null;
  homestay_images: { url: string | null }[] | null;
  homestay_amenities: { amenities: { name: string } | null }[] | null;
  rooms?: RoomDetail[] | null;
};

type Props = {
  initialProperties: PropertyWithDetails[];
  totalItems: number;
  itemsPerPage: number;
  tabCounts: {
    all: number;
    pending: number;
    approved: number;
    onSale: number;
    rejected: number;
    closedTemp: number;
    suspended: number;
    deleteRequested: number;
    deleted: number;
  };
  cities: string[];
};

export function AdminPropertiesClient({
  initialProperties,
  totalItems,
  itemsPerPage,
  tabCounts,
  cities,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerIdParam = searchParams.get("ownerId");
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithDetails | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [tempQ, setTempQ] = useState("");
  const [tempCity, setTempCity] = useState("");
  const [tempOwner, setTempOwner] = useState("");

  // Track the ID of the property currently executing a server action
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Rejection & delete reject modals state
  const [rejectionPropertyId, setRejectionPropertyId] = useState<string | null>(null);
  const [rejectionInputReason, setRejectionInputReason] = useState("");
  const [deleteRejectionPropertyId, setDeleteRejectionPropertyId] = useState<string | null>(null);
  const [deleteRejectionInputReason, setDeleteRejectionInputReason] = useState("");

  // Sync state with URL searchParams
  const rawActiveTab = searchParams.get("propertyStatus") || searchParams.get("status") || "";
  const tabKeys = new Set(["", "PENDING", "APPROVED", "ON_SALE", "REJECTED", "CLOSED_TEMP", "SUSPENDED", "DELETE_REQUESTED", "DELETED"]);
  const activeTab = tabKeys.has(rawActiveTab) ? rawActiveTab : "";
  const pageParam = Number(searchParams.get("page")) || 1;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClose = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClose);
    }
    return () => {
      document.removeEventListener("click", handleClose);
    };
  }, [openMenuId]);

  useEffect(() => {
    setTempQ(searchParams.get("q") || "");
    setTempCity(searchParams.get("city") || "");
    setTempOwner(searchParams.get("owner") || "");
  }, [searchParams]);

  // Formatter functions
  const formatCity = (city: string | null) => {
    if (!city || city.trim() === "" || city.trim() === "Việt Nam") {
      return "Chưa cập nhật";
    }
    return city;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Chưa cập nhật";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const formatPrice = (priceVal: number | string | null) => {
    const val = Number(priceVal) || 0;
    return `₫${val.toLocaleString("vi-VN")} / đêm`;
  };

  const getOwnerName = (p: PropertyWithDetails) => {
    return p.owner?.full_name || p.owner?.email || "Chưa có chủ sở hữu";
  };

  const getPropertyImage = (p: PropertyWithDetails) => {
    if (p.homestay_images?.[0]?.url) {
      return p.homestay_images[0].url;
    }
    let index = 0;
    if (p.id) {
      let hash = 0;
      for (let i = 0; i < p.id.length; i++) {
        hash = p.id.charCodeAt(i) + ((hash << 5) - hash);
      }
      index = Math.abs(hash);
    }
    return getLocationImage(p.city, index);
  };

  // Status Badge UI
  const getStatusLabel = (statusStr: string | null, isActive: boolean | null) => {
    const status = statusStr || "PENDING";
    const baseClass = "inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide border whitespace-nowrap";
    
    if (status === "APPROVED") {
      if (isActive) {
        return (
          <span className={`${baseClass} bg-emerald-50 text-emerald-700 border-emerald-200`}>
            Đang mở bán
          </span>
        );
      } else {
        return (
          <span className={`${baseClass} bg-emerald-50/40 text-emerald-600 border-emerald-100`}>
            Đã duyệt
          </span>
        );
      }
    }

    const configs: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Đang nháp", className: "bg-slate-50 text-slate-500 border-slate-200" },
      PENDING: { label: "Chờ duyệt", className: "bg-amber-50 text-amber-700 border-amber-200" },
      REJECTED: { label: "Bị từ chối", className: "bg-rose-50 text-rose-600 border-rose-150" },
      HIDDEN: { label: "Đã ẩn", className: "bg-slate-50 text-slate-500 border-slate-200" },
      SUSPENDED: { label: "Bị khóa", className: "bg-red-50 text-red-700 border-red-200" },
      CLOSED_TEMP: { label: "Tạm đóng", className: "bg-orange-50 text-orange-700 border-orange-200" },
      DELETE_REQUESTED: { label: "Chờ xóa", className: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold" },
      DELETED: { label: "Đã xóa mềm", className: "bg-slate-100 text-slate-500 border-slate-200 italic" },
    };

    const config = configs[status] || { label: status, className: "bg-slate-50 text-slate-500 border-slate-200" };

    return (
      <span className={`${baseClass} ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // URL Query String Updates
  const updateFilters = (newFilters: {
    status?: string;
    page?: string;
    q?: string;
    city?: string;
    owner?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newFilters.status !== undefined) {
      if (newFilters.status) {
        params.set("status", newFilters.status);
        params.delete("propertyStatus");
      } else {
        params.delete("status");
        params.delete("propertyStatus");
      }
      params.set("page", "1");
    }

    if (newFilters.page !== undefined) {
      params.set("page", newFilters.page);
    }

    if (newFilters.q !== undefined) {
      if (newFilters.q) {
        params.set("q", newFilters.q);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
    }

    if (newFilters.city !== undefined) {
      if (newFilters.city) {
        params.set("city", newFilters.city);
      } else {
        params.delete("city");
      }
      params.set("page", "1");
    }

    if (newFilters.owner !== undefined) {
      if (newFilters.owner) {
        params.set("owner", newFilters.owner);
      } else {
        params.delete("owner");
      }
      params.set("page", "1");
    }

    router.push(`/admin/properties?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: tempQ, owner: tempOwner, city: tempCity });
  };

  const handleResetFilters = () => {
    setTempQ("");
    setTempCity("");
    setTempOwner("");
    router.push("/admin/properties");
  };

  // Action execution helper
  const triggerAction = (
    actionFn: (fd: FormData) => Promise<any>,
    propertyId: string,
    successMsg: string,
    confirmMsg?: string,
    customReason?: string,
    customFields?: Record<string, string>
  ) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setActiveActionId(propertyId);
    const loadingToastId = toast.loading("Đang xử lý...");

    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", propertyId);
      if (customReason) {
        fd.set("reason", customReason);
      }
      if (customFields) {
        Object.entries(customFields).forEach(([key, value]) => fd.set(key, value));
      }

      try {
        await actionFn(fd);
        toast.success(successMsg, { id: loadingToastId });

        // Synchronize selected property state in drawer
        if (selectedProperty?.id === propertyId) {
          setSelectedProperty(null);
        }

        // Close modals
        setRejectionPropertyId(null);
        setRejectionInputReason("");
        setDeleteRejectionPropertyId(null);
        setDeleteRejectionInputReason("");

        router.refresh();
      } catch (err) {
        console.error("Action error:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("NEXT_REDIRECT")) {
          toast.success(successMsg, { id: loadingToastId });
          if (selectedProperty?.id === propertyId) {
            setSelectedProperty(null);
          }
          setRejectionPropertyId(null);
          setRejectionInputReason("");
          setDeleteRejectionPropertyId(null);
          setDeleteRejectionInputReason("");
          router.refresh();
        } else {
          toast.error(err instanceof Error ? err.message : "Thực hiện thao tác thất bại.", { id: loadingToastId });
        }
      } finally {
        setActiveActionId(null);
      }
    });
  };

  const handleApproveDelete = async (fd: FormData) => {
    const id = fd.get("id") as string;
    const res = await approveDeletePropertyAction(id);
    if (res?.error) {
      throw new Error(res.error);
    }
    return res;
  };

  const handleRejectDelete = async (fd: FormData) => {
    const id = fd.get("id") as string;
    const reason = fd.get("reason") as string;
    const res = await rejectDeletePropertyAction(id, reason);
    if (res?.error) {
      throw new Error(res.error);
    }
    return res;
  };

  const activeOwnerProp = ownerIdParam ? initialProperties.find(p => p.owner_id === ownerIdParam) : null;
  const activeOwnerName = activeOwnerProp ? (activeOwnerProp.owner?.full_name || activeOwnerProp.owner?.email || "Đối tác") : "Đối tác";

  const startItem = totalItems === 0 ? 0 : (pageParam - 1) * itemsPerPage + 1;
  const endItem = Math.min(pageParam * itemsPerPage, totalItems);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const tabsList = [
    { key: "", label: "Tất cả", count: tabCounts.all },
    { key: "PENDING", label: "Chờ duyệt", count: tabCounts.pending },
    { key: "APPROVED", label: "Đã duyệt", count: tabCounts.approved },
    { key: "ON_SALE", label: "Đang mở bán", count: tabCounts.onSale },
    { key: "REJECTED", label: "Bị từ chối", count: tabCounts.rejected },
    { key: "CLOSED_TEMP", label: "Tạm đóng", count: tabCounts.closedTemp },
    { key: "SUSPENDED", label: "Bị khóa", count: tabCounts.suspended },
    { key: "DELETE_REQUESTED", label: "Chờ xóa", count: tabCounts.deleteRequested },
    { key: "DELETED", label: "Đã xóa mềm", count: tabCounts.deleted },
  ];

  return (
    <div className="relative">
      {ownerIdParam && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-sm animate-fade-in">
          <span className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4 text-rose-500 shrink-0" />
            <span>
              Đang lọc chỗ nghỉ của đối tác: <strong className="font-extrabold">{activeOwnerName}</strong>
            </span>
          </span>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.delete("ownerId");
              router.push(`/admin/properties?${params.toString()}`);
            }}
            className="rounded-lg bg-white border border-rose-200 hover:bg-rose-100 px-3 py-1.5 text-xs font-black text-rose-700 transition-colors uppercase tracking-wider shadow-sm"
          >
            Hiển thị tất cả
          </button>
        </div>
      )}

      {/* 1. Status Tabs Bar */}
      <div className="flex border border-slate-200 bg-white rounded-xl p-1 mb-6 shadow-sm overflow-x-auto scrollbar-none gap-1">
        {tabsList.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => updateFilters({ status: tab.key })}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
                isActive
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                isActive ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600 border"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Filters Form */}
      <form onSubmit={handleSearchSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4 items-end mb-6">
        <div className="block md:col-span-2">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">Tên chỗ nghỉ</span>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={tempQ}
              onChange={(e) => setTempQ(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-bold text-slate-950 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 transition-all"
              placeholder="Tìm theo tên chỗ nghỉ..."
            />
          </div>
        </div>

        <div className="block">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">Thành phố</span>
          <select
            value={tempCity}
            onChange={(e) => {
              setTempCity(e.target.value);
              updateFilters({ city: e.target.value });
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-950 outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="">Tất cả thành phố</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="block">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">Chủ sở hữu</span>
          <input
            value={tempOwner}
            onChange={(e) => setTempOwner(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-950 placeholder:text-slate-400 outline-none focus:border-rose-500"
            placeholder="Tên hoặc email chủ sở hữu..."
          />
        </div>

        <div className="md:col-span-4 flex justify-end gap-2 border-t pt-3 border-slate-100">
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Search className="h-3.5 w-3.5" /> Tìm kiếm
          </button>
        </div>
      </form>

      {/* 3. Main Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Chỗ nghỉ</th>
                <th className="px-4 py-3">Chủ sở hữu</th>
                <th className="px-4 py-3">Thành phố</th>
                <th className="px-4 py-3">Giá mỗi đêm</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày đăng ký</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialProperties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500 font-bold">
                    <div className="flex flex-col items-center gap-3">
                      <Building className="h-10 w-10 text-slate-300 stroke-[1.5]" />
                      <span>Không tìm thấy chỗ nghỉ nào phù hợp.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                initialProperties.map((p) => {
                  const isRowPending = activeActionId === p.id;
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors align-middle ${isRowPending ? "opacity-60 pointer-events-none" : ""}`}>
                      <td className="px-4 py-2.5 w-24">
                        <div className="h-[52px] w-[72px] relative rounded-md overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                          <SafeImage src={getPropertyImage(p)} alt={p.name || ""} className="object-cover w-full h-full" />
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div>
                          <p className="font-semibold text-slate-800 text-xs leading-snug line-clamp-1">{p.name || "Chưa đặt tên"}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 select-all">ID: {p.id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 text-xs">{p.owner?.full_name || "Chưa cập nhật"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.owner?.email || "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {(!p.city || p.city.trim() === "" || p.city.trim() === "Việt Nam") ? (
                          <span className="text-[11px] text-slate-400 font-normal">Chưa cập nhật</span>
                        ) : (
                          <span className="font-medium text-slate-700 text-xs">{p.city}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap text-xs">
                        {formatPrice(p.price_per_night)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusLabel(p.status, p.is_active)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-500 text-xs">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProperty(p)}
                            className="rounded bg-rose-50 text-rose-600 px-2 py-1 text-[11px] font-bold hover:bg-rose-100 transition-colors flex items-center gap-1 border border-rose-100 shadow-sm cursor-pointer"
                          >
                            Xem
                          </button>

                          {/* Inline actions for PENDING, Dropdown for others */}
                          {p.status === "PENDING" ? (
                            <>
                              <button
                                onClick={() => triggerAction(approveProperty, p.id, "Đã phê duyệt chỗ nghỉ thành công.", "Phê duyệt cho phép chỗ nghỉ này hoạt động?")}
                                className="rounded bg-emerald-600 text-white px-2 py-1 text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => setRejectionPropertyId(p.id)}
                                className="rounded bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 text-[11px] font-bold hover:bg-rose-200 transition-colors shadow-sm cursor-pointer"
                              >
                                Từ chối
                              </button>
                            </>
                          ) : p.status !== "DELETED" ? (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === p.id ? null : p.id);
                                }}
                                className="rounded border border-slate-200 bg-white text-slate-700 px-2 py-1 text-[11px] font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center gap-0.5"
                              >
                                <span>Thao tác</span>
                                <ChevronDown className="h-3 w-3 text-slate-500" />
                              </button>

                              {openMenuId === p.id && (
                                <div className="absolute right-0 mt-1 z-30 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg text-left animate-fade-in">
                                  {p.status === "APPROVED" && !p.is_active && (
                                    <>
                                      <button
                                        onClick={() => triggerAction(hideProperty, p.id, "Đã ẩn chỗ nghỉ thành công.", "Ẩn chỗ nghỉ này khỏi danh mục tìm kiếm?")}
                                        className="w-full text-left rounded px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                                      >
                                        Ẩn chỗ nghỉ
                                      </button>
                                      <button
                                        onClick={() => triggerAction(suspendProperty, p.id, "Đã khóa chỗ nghỉ thành công.", "Khóa chỗ nghỉ này? Chủ sở hữu sẽ không thể mở bán lại.")}
                                        className="w-full text-left rounded px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                      >
                                        Khóa hoạt động
                                      </button>
                                    </>
                                  )}

                                  {p.status === "APPROVED" && p.is_active && (
                                    <>
                                      <button
                                        onClick={() => {
                                          triggerAction(updatePropertyStatus, p.id, "Đã tạm đóng chỗ nghỉ thành công.", "Tạm đóng chỗ nghỉ này khỏi thị trường?", undefined, { status: "CLOSED_TEMP" });
                                        }}
                                        className="w-full text-left rounded px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                                      >
                                        Tạm đóng
                                      </button>
                                      <button
                                        onClick={() => triggerAction(suspendProperty, p.id, "Đã khóa chỗ nghỉ thành công.", "Khóa chỗ nghỉ này? Chủ sở hữu sẽ không thể mở bán lại.")}
                                        className="w-full text-left rounded px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                      >
                                        Khóa hoạt động
                                      </button>
                                    </>
                                  )}

                                  {(p.status === "HIDDEN" || p.status === "CLOSED_TEMP") && (
                                    <button
                                      onClick={() => triggerAction(reopenProperty, p.id, "Đã mở bán lại chỗ nghỉ thành công.", "Mở bán lại chỗ nghỉ này công khai?")}
                                      className="w-full text-left rounded px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                                    >
                                      Mở bán lại
                                    </button>
                                  )}

                                  {p.status === "DELETE_REQUESTED" && (
                                    <>
                                      <button
                                        onClick={() => triggerAction(handleApproveDelete, p.id, "Đã phê duyệt xóa chỗ nghỉ.", "Đồng ý phê duyệt yêu cầu xóa và xóa mềm chỗ nghỉ này?")}
                                        className="w-full text-left rounded px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                      >
                                        Duyệt xóa
                                      </button>
                                      <button
                                        onClick={() => setDeleteRejectionPropertyId(p.id)}
                                        className="w-full text-left rounded px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                                      >
                                        Từ chối xóa
                                      </button>
                                    </>
                                  )}

                                  {p.status === "SUSPENDED" && (
                                    <button
                                      onClick={() => triggerAction(reopenProperty, p.id, "Đã mở khóa chỗ nghỉ thành công.", "Mở khóa và cho phép đối tác hoạt động lại chỗ nghỉ này?")}
                                      className="w-full text-left rounded px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                                    >
                                      Mở khóa
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Compact Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-white">
          <div className="text-xs text-slate-500 font-semibold">
            Hiển thị <span className="font-bold text-slate-800">{startItem}–{endItem}</span> trong <span className="font-bold text-slate-800">{totalItems}</span> chỗ nghỉ
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateFilters({ page: String(pageParam - 1) })}
              disabled={pageParam === 1 || totalPages <= 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
            >
              Trước
            </button>
            <button
              onClick={() => updateFilters({ page: String(pageParam + 1) })}
              disabled={pageParam === totalPages || totalPages <= 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* 4. Slide-out Details Drawer */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Quản trị viên StaySaga</span>
                <h3 className="text-base font-extrabold text-slate-900 truncate max-w-md">{selectedProperty.name || "Chỗ nghỉ chi tiết"}</h3>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="rounded-full p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Image Banner */}
              <div className="relative h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                <SafeImage src={getPropertyImage(selectedProperty)} alt="Property image" className="object-cover w-full h-full" />
              </div>

              {/* Status & Price Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-150 shadow-inner">
                <div className="text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
                  <div className="mt-1">{getStatusLabel(selectedProperty.status, selectedProperty.is_active)}</div>
                </div>
                <div className="text-center border-l border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giá mỗi đêm</span>
                  <span className="block text-sm font-black text-rose-600 mt-1">{formatPrice(selectedProperty.price_per_night)}</span>
                </div>
                <div className="text-center border-l border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thành phố</span>
                  <span className="block text-xs font-bold text-slate-800 mt-1">{formatCity(selectedProperty.city)}</span>
                </div>
                <div className="text-center border-l border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khách tối đa</span>
                  <span className="block text-xs font-bold text-slate-800 mt-1">{selectedProperty.max_guests || 0} khách</span>
                </div>
              </div>

              {/* Owner details */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5">Đối tác sở hữu (Owner)</h4>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 border flex items-center justify-center text-slate-500">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">{getOwnerName(selectedProperty)}</p>
                    <p className="text-[10px] text-slate-500">{selectedProperty.owner?.email || "Chưa cập nhật email"}</p>
                  </div>
                </div>
              </div>

              {/* Address detail */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Địa chỉ chỗ nghỉ</h4>
                <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{selectedProperty.address || "Chưa cập nhật địa chỉ chi tiết"}</span>
                </p>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mô tả & Layout</h4>
                <div className="grid grid-cols-3 gap-3 text-[11px] font-black text-slate-700 bg-slate-50 p-3 rounded-lg border shadow-sm">
                  <p>🛏️ {selectedProperty.bedrooms || 0} Phòng ngủ</p>
                  <p>🛌 {selectedProperty.beds || 0} Giường</p>
                  <p>🚿 {selectedProperty.bathrooms || 0} Nhà tắm</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-lg p-4 font-medium max-h-40 overflow-y-auto whitespace-pre-line shadow-inner">
                  {selectedProperty.description || "Chưa có mô tả giới thiệu."}
                </p>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5">Tiện ích chỗ nghỉ</h4>
                {selectedProperty.homestay_amenities && selectedProperty.homestay_amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProperty.homestay_amenities.map((item, idx) => (
                      <span key={idx} className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-2.5 py-1">
                        {item.amenities?.name || "Tiện ích"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">Không có tiện ích.</p>
                )}
              </div>

              {/* Rooms List */}
              {selectedProperty.rooms && selectedProperty.rooms.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Danh sách loại phòng</h4>
                  <div className="divide-y divide-slate-100 border rounded-lg bg-white overflow-hidden text-xs shadow-sm">
                    {selectedProperty.rooms.map((room, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800">{room.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            👥 Tối đa {room.max_guests} khách
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-rose-600">{formatPrice(room.price_per_night)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reasons if reject/delete */}
              {selectedProperty.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs">
                  <p className="font-bold text-red-800 flex items-center gap-1 mb-1">
                    <AlertCircle className="h-4 w-4 shrink-0" /> Lý do từ chối kiểm duyệt
                  </p>
                  <p className="text-red-700 leading-relaxed font-semibold">{selectedProperty.rejection_reason}</p>
                </div>
              )}

              {selectedProperty.delete_reason && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs">
                  <p className="font-bold text-orange-800 flex items-center gap-1 mb-1">
                    <Trash2 className="h-4 w-4 shrink-0 animate-pulse" /> Lý do đối tác yêu cầu xóa chỗ nghỉ
                  </p>
                  <p className="text-orange-700 leading-relaxed font-semibold">{selectedProperty.delete_reason}</p>
                </div>
              )}
            </div>

            {/* Actions Footer inside Drawer */}
            <div className="border-t bg-slate-50 px-6 py-4 flex items-center justify-end gap-2">
              {/* PENDING / DRAFT actions */}
              {(selectedProperty.status === "PENDING" || selectedProperty.status === "DRAFT") && (
                <>
                  <button
                    onClick={() => triggerAction(approveProperty, selectedProperty.id, "Đã phê duyệt chỗ nghỉ thành công.", "Phê duyệt cho phép chỗ nghỉ này hoạt động?")}
                    disabled={activeActionId !== null}
                    className="rounded bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-4 w-4" /> Duyệt phê duyệt
                  </button>
                  <button
                    onClick={() => setRejectionPropertyId(selectedProperty.id)}
                    disabled={activeActionId !== null}
                    className="rounded bg-red-600 text-white px-4 py-2 text-xs font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Ban className="h-4 w-4" /> Từ chối duyệt
                  </button>
                </>
              )}

              {/* APPROVED Actions */}
              {selectedProperty.status === "APPROVED" && (
                <>
                  <button
                    onClick={() => triggerAction(hideProperty, selectedProperty.id, "Đã ẩn chỗ nghỉ thành công.", "Ẩn chỗ nghỉ này khỏi danh mục công khai?")}
                    disabled={activeActionId !== null}
                    className="rounded border border-slate-200 bg-white text-slate-700 px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <EyeOff className="h-4 w-4" /> Ẩn chỗ nghỉ
                  </button>
                  {selectedProperty.is_active && (
                    <button
                      onClick={() => {
                        triggerAction(updatePropertyStatus, selectedProperty.id, "Đã tạm đóng chỗ nghỉ thành công.", "Tạm đóng chỗ nghỉ này?", undefined, { status: "CLOSED_TEMP" });
                      }}
                      disabled={activeActionId !== null}
                      className="rounded bg-amber-500 text-white px-4 py-2 text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm cursor-pointer"
                    >
                      Tạm đóng
                    </button>
                  )}
                  <button
                    onClick={() => triggerAction(suspendProperty, selectedProperty.id, "Đã khóa chỗ nghỉ thành công.", "Khóa chỗ nghỉ? Chủ nhà sẽ không tự mở bán lại được.")}
                    disabled={activeActionId !== null}
                    className="rounded bg-red-600 text-white px-4 py-2 text-xs font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Ban className="h-4 w-4" /> Khóa hoạt động
                  </button>
                </>
              )}

              {/* HIDDEN / CLOSED_TEMP / SUSPENDED */}
              {(selectedProperty.status === "HIDDEN" ||
                selectedProperty.status === "CLOSED_TEMP" ||
                selectedProperty.status === "SUSPENDED" ||
                selectedProperty.status === "REJECTED") && (
                <button
                  onClick={() => triggerAction(reopenProperty, selectedProperty.id, "Đã kích hoạt lại chỗ nghỉ thành công.", "Mở khóa/mở bán hoạt động lại chỗ nghỉ này?")}
                  disabled={activeActionId !== null}
                  className="rounded bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <Unlock className="h-4 w-4" /> Kích hoạt hoạt động
                </button>
              )}

              {/* DELETE_REQUESTED */}
              {selectedProperty.status === "DELETE_REQUESTED" && (
                <>
                  <button
                    onClick={() => triggerAction(handleApproveDelete, selectedProperty.id, "Đã duyệt yêu cầu xóa.", "Duyệt yêu cầu xóa và thực hiện xóa mềm chỗ nghỉ này?")}
                    disabled={activeActionId !== null}
                    className="rounded bg-red-600 text-white px-4 py-2 text-xs font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" /> Phê duyệt xóa
                  </button>
                  <button
                    onClick={() => setDeleteRejectionPropertyId(selectedProperty.id)}
                    disabled={activeActionId !== null}
                    className="rounded border border-slate-200 bg-white text-slate-700 px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                  >
                    Từ chối yêu cầu xóa
                  </button>
                </>
              )}

              {selectedProperty.status === "DELETED" && (
                <span className="text-xs font-bold text-slate-400 italic">Chỗ nghỉ đã bị xóa mềm khỏi hệ thống.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Rejection Modal Dialog (Từ chối phê duyệt) */}
      {rejectionPropertyId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-scale-in">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Từ chối phê duyệt chỗ nghỉ</h3>
              <p className="text-xs text-slate-500 mt-1">Vui lòng cung cấp lý do từ chối chi tiết gửi tới đối tác.</p>
            </div>
            <textarea
              value={rejectionInputReason}
              onChange={(e) => setRejectionInputReason(e.target.value)}
              placeholder="Lý do từ chối (bắt buộc, tối thiểu 3 ký tự)..."
              rows={4}
              className="w-full rounded-lg border border-slate-250 bg-white p-3 text-xs font-bold text-slate-900 focus:border-rose-500 focus:outline-none placeholder:text-slate-400"
            />
            <div className="flex justify-end gap-2 text-xs font-bold border-t pt-3">
              <button
                type="button"
                onClick={() => {
                  setRejectionPropertyId(null);
                  setRejectionInputReason("");
                }}
                className="rounded-lg border px-4 py-2 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => triggerAction(rejectProperty, rejectionPropertyId, "Đã từ chối kiểm duyệt chỗ nghỉ.", undefined, rejectionInputReason)}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                disabled={rejectionInputReason.trim().length < 3 || activeActionId !== null}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Rejection Modal Dialog (Từ chối yêu cầu xóa) */}
      {deleteRejectionPropertyId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-scale-in">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Từ chối yêu cầu xóa chỗ nghỉ</h3>
              <p className="text-xs text-slate-500 mt-1">Cung cấp lý do từ chối yêu cầu xóa chỗ nghỉ.</p>
            </div>
            <textarea
              value={deleteRejectionInputReason}
              onChange={(e) => setDeleteRejectionInputReason(e.target.value)}
              placeholder="Lý do từ chối xóa (bắt buộc, tối thiểu 3 ký tự)..."
              rows={4}
              className="w-full rounded-lg border border-slate-250 bg-white p-3 text-xs font-bold text-slate-900 focus:border-rose-500 focus:outline-none placeholder:text-slate-400"
            />
            <div className="flex justify-end gap-2 text-xs font-bold border-t pt-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteRejectionPropertyId(null);
                  setDeleteRejectionInputReason("");
                }}
                className="rounded-lg border px-4 py-2 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => triggerAction(handleRejectDelete, deleteRejectionPropertyId, "Đã từ chối yêu cầu xóa.", undefined, deleteRejectionInputReason)}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                disabled={deleteRejectionInputReason.trim().length < 3 || activeActionId !== null}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
