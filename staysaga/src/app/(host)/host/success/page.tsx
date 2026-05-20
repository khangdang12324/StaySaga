"use client";

import Link from "next/link";
import { Check, Info, Plus } from "lucide-react";

export default function HostSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Khang home</h1>
            <p className="text-sm text-slate-500">Đà Lạt Plateau, Lạc Dương, Việt Nam</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span className="font-semibold text-[#f60057]">Tiếng Việt</span>
            <span className="cursor-pointer hover:text-[#f60057]">Trợ giúp</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        
        {/* Channel Manager Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6 flex gap-4">
          <Info className="h-6 w-6 text-amber-500 shrink-0" />
          <div>
            <h2 className="font-bold text-slate-900 mb-1">Kết nối với công cụ quản lý kênh</h2>
            <p className="text-sm text-slate-600 mb-4">Hãy kiểm tra kết nối với công cụ quản lý kênh để đồng bộ giá và tránh bị trùng đơn đặt.</p>
            <div className="flex gap-4 text-sm font-bold">
              <button className="text-[#f60057] hover:text-[#f60057]">Tiếp tục</button>
              <button className="text-slate-500 hover:text-slate-600">Bỏ qua</button>
            </div>
          </div>
        </div>

        {/* Success Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex gap-6">
          <div className="w-32 h-32 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-[#f60057]" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Khang home</h2>
            <p className="text-sm text-slate-500 mb-4">Đà Lạt Plateau, Lạc Dương, Việt Nam</p>
            
            <p className="text-sm text-slate-700 leading-6">
              Cảm ơn Quý vị. Chỗ nghỉ của Quý vị hiện đã được cài để tự động đăng online ngay sau khi chúng tôi hoàn tất kiểm tra. Ngoài ra, chúng tôi sẽ gửi email cho Quý vị khi chỗ nghỉ được đăng.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <button className="text-[#f60057] font-bold text-sm hover:text-[#f60057]">
            Chia sẻ góp ý của Quý vị
          </button>
          
          <div className="flex gap-4">
            <Link 
              href="/host/register?new=1" 
              className="inline-flex items-center gap-2 bg-white border border-[#f60057] text-[#f60057] font-bold px-4 py-2 rounded hover:bg-rose-50 text-sm"
            >
              <Plus className="h-4 w-4" /> Thêm chỗ nghỉ mới
            </Link>
            <Link 
              href="/host" 
              className="inline-flex items-center gap-2 bg-[#f60057] text-white font-bold px-4 py-2 rounded hover:bg-[#f60057] text-sm"
            >
              Vào trang quản lý
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
