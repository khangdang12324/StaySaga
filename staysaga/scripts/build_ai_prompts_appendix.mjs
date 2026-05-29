import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "outputs", "ai-prompts-appendix");
const outputPath = path.join(outputDir, "Phu_luc_prompts_StaySaga.xlsx");

const rows = [
  [
    "STT",
    "Prompts",
    "Mô tả ngắn về kết quả đầu ra",
  ],
  [
    1,
    "Prevent checkout 404 by letting property lookup accept slug or id",
    "Sửa lỗi trang checkout không tìm thấy homestay khi route truyền id hoặc slug; hàm tra cứu property hỗ trợ cả hai dạng.",
  ],
  [
    2,
    "Fix hydration/runtime errors in Next.js App Router",
    "Giảm lỗi hydration và lỗi nhầm Server/Client Component; layout và form action được điều chỉnh đúng chuẩn App Router.",
  ],
  [
    3,
    "Make checkout UI readable and localized in Vietnamese",
    "Cải thiện giao diện thanh toán, dùng nội dung tiếng Việt rõ ràng, bố cục dễ đọc hơn cho người dùng đặt phòng.",
  ],
  [
    4,
    "Make /homestays feel like Booking/Agoda",
    "Thiết kế lại trang danh sách homestay theo kiểu sàn đặt phòng: bộ lọc bên trái, sắp xếp, card thông tin rõ ràng.",
  ],
  [
    5,
    "Show booking in trips page including mock bookings",
    "Hiển thị đơn đặt phòng trong trang chuyến đi; hỗ trợ dữ liệu booking giả lập qua cookie để phục vụ demo khi DB chưa đủ dữ liệu.",
  ],
  [
    6,
    "Enforce light mode with white background and rose accents",
    "Chuẩn hóa nhận diện giao diện StaySaga về nền sáng, điểm nhấn màu rose, đồng bộ navbar, layout và các component chính.",
  ],
  [
    7,
    "Remove blank images across pages",
    "Tạo cơ chế ảnh dự phòng để tránh ô ảnh trắng khi ảnh homestay lỗi hoặc thiếu URL; giao diện ổn định hơn.",
  ],
  [
    8,
    "Add deployment and Docker documentation",
    "Bổ sung hướng dẫn Docker Compose, biến môi trường, build production và deploy VPS để hoàn thiện hồ sơ đồ án.",
  ],
  [
    9,
    "Design Supabase RLS policies for guest, user, partner and admin roles in StaySaga",
    "Xây dựng hướng phân quyền theo role: guest xem public, user quản lý booking của mình, partner quản lý homestay của mình, admin quản trị hệ thống.",
  ],
  [
    10,
    "Generate viva Q&A answers for StaySaga based on Next.js, Supabase, Docker, VPS, GitHub and AI usage",
    "Tạo bộ trả lời vấn đáp cho 57 câu hỏi, gồm đáp án chuẩn và phần liên hệ trực tiếp với kiến trúc StaySaga.",
  ],
];

const workbook = Workbook.create();
workbook.setColorScheme({
  name: "StaySaga",
  themeColors: {
    accent1: "#E11D48",
    accent2: "#0F766E",
    accent3: "#2563EB",
    dk1: "#111827",
    lt1: "#FFFFFF",
    lt2: "#F3F4F6",
    hlink: "#2563EB",
    folHlink: "#7C3AED",
  },
});

const sheet = workbook.worksheets.add("Prompts");
sheet.getRange("A1").write([["PHỤ LỤC PROMPTS - DỰ ÁN STAYSAGA"]]);
sheet.getRange("A2").write([["Tổng hợp 10 prompts tâm đắc đã sử dụng trong quá trình phát triển dự án."]]);
sheet.getRange("A4").write(rows);

sheet.getRange("A1:C1").format = {
  fill: "accent1",
  font: { name: "Arial", size: 16, bold: true, color: "lt1" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange("A2:C2").format = {
  fill: "#FFF1F2",
  font: { name: "Arial", size: 10, italic: true, color: "#374151" },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
sheet.getRange("A4:C4").format = {
  fill: "#BE123C",
  font: { name: "Arial", size: 11, bold: true, color: "lt1" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: "#9F1239" },
};
sheet.getRange("A5:C14").format = {
  font: { name: "Arial", size: 10, color: "#111827" },
  verticalAlignment: "top",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: "#E5E7EB" },
};
sheet.getRange("A5:A14").format.horizontalAlignment = "center";
sheet.getRange("A1:C1").format.borders = { preset: "outside", style: "thin", color: "#9F1239" };
sheet.getRange("A1:C1").merge();
sheet.getRange("A2:C2").merge();
sheet.getRange("A:A").format.columnWidthPx = 55;
sheet.getRange("B:B").format.columnWidthPx = 410;
sheet.getRange("C:C").format.columnWidthPx = 520;
sheet.getRange("A1:C14").format.autofitRows();
sheet.freezePanes.freezeRows(4);

const inspected = await workbook.inspect({
  kind: "table",
  range: "Prompts!A1:C14",
  include: "values",
  tableMaxRows: 15,
  tableMaxCols: 3,
});
console.log(inspected.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 20 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await workbook.render({ sheetName: "Prompts", range: "A1:C14", scale: 1.5 });

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
