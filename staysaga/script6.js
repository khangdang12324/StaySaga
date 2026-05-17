const fs = require('fs');
let code = fs.readFileSync('src/app/(admin)/admin/page.tsx', 'utf8');

// 1. Add imports
if (!code.includes('getAdminDashboardStats')) {
  code = code.replace(
    'import { createClient } from "@/lib/supabase/server";',
    `import { createClient } from "@/lib/supabase/server";\nimport { getAdminDashboardStats, getRecentBookings, getPendingAdminTasks, getBookingsLast7Days } from "@/core/admin/queries";\nimport { format } from "date-fns";`
  );
}

// 2. Fetch data inside AdminPage
code = code.replace(
  'const settings = await getSiteSettings([',
  `const stats = await getAdminDashboardStats();
  const recentBookings = await getRecentBookings(5);
  const tasks = await getPendingAdminTasks();
  const chartData = await getBookingsLast7Days();
  
  const settings = await getSiteSettings([`
);

// 3. Format helper
code = code.replace(
  'return (',
  `const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  const formatShortDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <span className="rounded px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-700">Đã xác nhận</span>;
      case 'PENDING': return <span className="rounded px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700">Chờ xử lý</span>;
      case 'CANCELLED': return <span className="rounded px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700">Đã hủy</span>;
      case 'COMPLETED': return <span className="rounded px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-700">Đã hoàn tất</span>;
      default: return <span className="rounded px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (`
);

// 4. Update Header date
const dateRegex = /<p className="text-sm font-medium text-slate-500">Hôm nay, .*?<\/p>/;
code = code.replace(dateRegex, '<p className="text-sm font-medium text-slate-500">Hôm nay, {format(new Date(), "dd/MM/yyyy")}</p>');

// 5. Update KPI Cards
code = code.replace(/<p className="text-2xl font-black text-slate-900">₫ 1\.24B<\/p>/g, '<p className="text-2xl font-black text-slate-900">{formatVND(stats.revenue)}</p>');
code = code.replace(/<p className="text-xs text-slate-400 mt-2">So với tháng trước \(₫ 1\.10B\)<\/p>/g, '');

code = code.replace(/<p className="text-2xl font-black text-slate-900">845<\/p>/g, '<p className="text-2xl font-black text-slate-900">{stats.totalBookings}</p>');
code = code.replace(/<p className="text-xs text-slate-400 mt-2">32 đơn đặt mới hôm nay<\/p>/g, '<p className="text-xs text-slate-400 mt-2">{stats.newBookingsToday} đơn đặt mới hôm nay</p>');

code = code.replace(/<p className="text-2xl font-black text-slate-900">4\.2%<\/p>/g, '<p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>');
code = code.replace(/<h3 className="font-semibold text-slate-600 text-sm">Tỷ lệ chuyển đổi<\/h3>/g, '<h3 className="font-semibold text-slate-600 text-sm">Tổng người dùng</h3>');
code = code.replace(/<p className="text-xs text-slate-400 mt-2">Lượt truy cập: 20,119<\/p>/g, '');

code = code.replace(/<p className="text-2xl font-black text-slate-900">1,248<\/p>/g, '<p className="text-2xl font-black text-slate-900">{stats.totalHomestays}</p>');
code = code.replace(/<p className="text-xs text-slate-400 mt-2">12 chỗ nghỉ đang chờ duyệt<\/p>/g, '<p className="text-xs text-slate-400 mt-2">{stats.pendingHomestays} chỗ nghỉ đang chờ duyệt</p>');

// 6. Update To-Do List
code = code.replace(/12 Chỗ nghỉ mới đang chờ duyệt xuất bản/g, '{tasks.pendingHomestays} Chỗ nghỉ mới đang chờ duyệt xuất bản');
code = code.replace(/3 Đánh giá tiêu cực cần phản hồi từ khách sạn/g, '{tasks.negativeReviews} Đánh giá tiêu cực cần phản hồi từ khách sạn');
code = code.replace(/5 Yêu cầu hỗ trợ từ đối tác \(Host\)/g, '{tasks.supportTickets} Yêu cầu hỗ trợ từ đối tác (Host)');

// 7. Update Chart
code = code.replace(/\{\[40, 70, 45, 90, 65, 100, 85\]\.map\(\(h, i\) => \(/g, '{chartData.counts.map((h, i) => (');
code = code.replace(/<div className="flex justify-between mt-3 text-xs font-medium text-slate-400">\s*<span>T2<\/span><span>T3<\/span><span>T4<\/span><span>T5<\/span><span>T6<\/span><span>T7<\/span><span>CN<\/span>\s*<\/div>/g, '<div className="flex justify-between mt-3 text-xs font-medium text-slate-400">{chartData.labels.map((l, i) => <span key={i}>{l}</span>)}</div>');

// Adjust chart height calculation so it's not relative to 100% since h is actual count
code = code.replace(/style=\{\{ height: \`\$\{h\}%\` \}\}/g, 'style={{ height: `${Math.max(5, (h / Math.max(1, ...chartData.counts)) * 100)}%` }}');

// 8. Update Table
const tableRegex = /<tbody className="divide-y divide-slate-100">[\s\S]*?<\/tbody>/;
const dynamicTable = \`<tbody className="divide-y divide-slate-100">
                      {recentBookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">Chưa có đơn đặt phòng nào.</td>
                        </tr>
                      ) : (
                        recentBookings.map((bk: any) => (
                          <tr key={bk.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-slate-700">{bk.id.split('-')[0]}...</td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{bk.profiles?.full_name || 'Khách Vãng Lai'}</p>
                              <p className="text-xs text-slate-500 truncate w-40">{bk.homestays?.name || 'Chỗ nghỉ bị xóa'}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{formatShortDate(bk.check_in_date)} - {formatShortDate(bk.check_out_date)}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{formatVND(Number(bk.total_price) || 0)}</td>
                            <td className="px-6 py-4">
                              {getStatusBadge(bk.status)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>\`;
code = code.replace(tableRegex, dynamicTable);

fs.writeFileSync('src/app/(admin)/admin/page.tsx', code);
console.log("Admin Dashboard migrated!");
