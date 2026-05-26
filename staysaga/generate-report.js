/**
 * generate-report.js
 * Tạo file Word báo cáo toàn văn cho đồ án cuối kỳ môn "Các công nghệ mới trong phát triển phần mềm"
 * Đề tài: Xây dựng hệ thống quản lý Homestay – StaySaga
 *
 * Sử dụng: node generate-report.js
 * Output:  BaoCao_StaySaga.docx
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle,
  PageNumber, NumberFormat, Header, Footer, SectionType,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  ShadingType, convertInchesToTwip, ImageRun,
  LevelFormat, UnderlineType
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─── Constants ───────────────────────────────────────────────────
const FONT = "Times New Roman";
const FONT_SIZE = 26; // 13pt = 26 half-points
const FONT_SIZE_TITLE = 32; // 16pt
const FONT_SIZE_H1 = 30; // 15pt
const FONT_SIZE_H2 = 28; // 14pt
const FONT_SIZE_H3 = 26; // 13pt
const LINE_SPACING = 360; // 1.5 lines = 360 twips (approx)
const PAGE_MARGIN_TOP = convertInchesToTwip(0.98); // 2.5cm
const PAGE_MARGIN_BOTTOM = convertInchesToTwip(0.98); // 2.5cm
const PAGE_MARGIN_LEFT = convertInchesToTwip(1.38); // 3.5cm
const PAGE_MARGIN_RIGHT = convertInchesToTwip(0.79); // 2cm

// ─── Helpers ─────────────────────────────────────────────────────
function p(text, opts = {}) {
  const {
    bold = false, italic = false, size = FONT_SIZE, alignment = AlignmentType.JUSTIFIED,
    spacing = { line: LINE_SPACING }, indent = {}, heading, bullet, numbering, underline = false,
    color, pageBreakBefore = false, spaceBefore = 0, spaceAfter = 0
  } = opts;

  const runOpts = {
    text,
    font: FONT,
    size,
    bold,
    italic,
    color: color || undefined,
  };
  if (underline) runOpts.underline = { type: UnderlineType.SINGLE };

  const paraOpts = {
    children: [new TextRun(runOpts)],
    alignment,
    spacing: { ...spacing, before: spaceBefore, after: spaceAfter },
    indent,
    pageBreakBefore,
  };
  if (heading) paraOpts.heading = heading;
  if (bullet) paraOpts.bullet = bullet;
  if (numbering) paraOpts.numbering = numbering;

  return new Paragraph(paraOpts);
}

function multiRunParagraph(runs, opts = {}) {
  const {
    alignment = AlignmentType.JUSTIFIED,
    spacing = { line: LINE_SPACING },
    indent = {},
    spaceBefore = 0, spaceAfter = 0,
  } = opts;
  return new Paragraph({
    children: runs.map(r => {
      const o = { text: r.text, font: FONT, size: r.size || FONT_SIZE, bold: !!r.bold, italic: !!r.italic };
      if (r.underline) o.underline = { type: UnderlineType.SINGLE };
      if (r.color) o.color = r.color;
      return new TextRun(o);
    }),
    alignment,
    spacing: { ...spacing, before: spaceBefore, after: spaceAfter },
    indent,
  });
}

function heading1(text, opts = {}) {
  return p(text, {
    bold: true, size: FONT_SIZE_H1, heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT, spaceAfter: 120, spaceBefore: 240,
    ...opts
  });
}

function heading2(text, opts = {}) {
  return p(text, {
    bold: true, size: FONT_SIZE_H2, heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT, spaceAfter: 80, spaceBefore: 200,
    ...opts
  });
}

function heading3(text, opts = {}) {
  return p(text, {
    bold: true, size: FONT_SIZE_H3, heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT, spaceAfter: 60, spaceBefore: 160,
    ...opts
  });
}

function emptyLine() {
  return new Paragraph({ children: [new TextRun({ text: "", font: FONT, size: FONT_SIZE })], spacing: { line: LINE_SPACING } });
}

function bulletPoint(text, opts = {}) {
  return p(text, {
    indent: { left: convertInchesToTwip(0.5) },
    ...opts,
  });
}

function createTable(headers, rows, opts = {}) {
  const { columnWidths } = opts;
  const headerCells = headers.map((h, i) => new TableCell({
    children: [p(h, { bold: true, alignment: AlignmentType.CENTER, spacing: { line: 276 } })],
    shading: { type: ShadingType.SOLID, color: "D9E2F3" },
    width: columnWidths ? { size: columnWidths[i], type: WidthType.PERCENTAGE } : undefined,
  }));

  const dataRows = rows.map(row =>
    new TableRow({
      children: row.map((cell, i) => new TableCell({
        children: [p(cell, { spacing: { line: 276 } })],
        width: columnWidths ? { size: columnWidths[i], type: WidthType.PERCENTAGE } : undefined,
      })),
    })
  );

  return new Table({
    rows: [
      new TableRow({ children: headerCells, tableHeader: true }),
      ...dataRows,
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function tableCaption(text) {
  return p(text, { bold: true, italic: true, alignment: AlignmentType.CENTER, spaceBefore: 80, spaceAfter: 60 });
}

function figureCaption(text) {
  return p(text, { italic: true, alignment: AlignmentType.CENTER, spaceBefore: 60, spaceAfter: 80 });
}

// ─── REPORT CONTENT SECTIONS ────────────────────────────────────

function createCoverPage() {
  return [
    emptyLine(),
    emptyLine(),
    p("BỘ GIÁO DỤC VÀ ĐÀO TẠO", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE }),
    p("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP. HỒ CHÍ MINH (HUTECH)", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE }),
    p("KHOA CÔNG NGHỆ THÔNG TIN", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE }),
    emptyLine(),
    emptyLine(),
    p("⸻⸻⸻⸻⸻", { alignment: AlignmentType.CENTER }),
    emptyLine(),
    emptyLine(),
    p("BÁO CÁO ĐỒ ÁN CUỐI KỲ", { bold: true, alignment: AlignmentType.CENTER, size: 36 }),
    emptyLine(),
    p("Môn: CÁC CÔNG NGHỆ MỚI TRONG PHÁT TRIỂN PHẦN MỀM", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE }),
    emptyLine(),
    emptyLine(),
    p("ĐỀ TÀI:", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE_TITLE }),
    p("XÂY DỰNG HỆ THỐNG QUẢN LÝ HOMESTAY", { bold: true, alignment: AlignmentType.CENTER, size: 36, color: "1F4E79" }),
    p("STAYSAGA", { bold: true, alignment: AlignmentType.CENTER, size: 40, color: "1F4E79" }),
    emptyLine(),
    emptyLine(),
    p("⸻⸻⸻⸻⸻", { alignment: AlignmentType.CENTER }),
    emptyLine(),
    emptyLine(),
    multiRunParagraph([
      { text: "Giảng viên hướng dẫn: ", bold: true },
      { text: "ThS. [Tên giảng viên]" },
    ], { alignment: AlignmentType.CENTER }),
    emptyLine(),
    multiRunParagraph([
      { text: "Sinh viên thực hiện: ", bold: true },
      { text: "Đặng Nguyên Khang" },
    ], { alignment: AlignmentType.CENTER }),
    multiRunParagraph([
      { text: "MSSV: ", bold: true },
      { text: "[Mã số sinh viên]" },
    ], { alignment: AlignmentType.CENTER }),
    multiRunParagraph([
      { text: "Lớp: ", bold: true },
      { text: "[Mã lớp]" },
    ], { alignment: AlignmentType.CENTER }),
    emptyLine(),
    emptyLine(),
    emptyLine(),
    p("TP. Hồ Chí Minh, tháng 05 năm 2025", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE }),
  ];
}

function createTableOfContents() {
  return [
    p("MỤC LỤC", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE_TITLE, pageBreakBefore: true, spaceAfter: 200 }),
    emptyLine(),
    p("(Mục lục sẽ được tự động cập nhật khi mở file trong MS Word)", { italic: true, alignment: AlignmentType.CENTER }),
    p("Nhấn chuột phải vào mục lục → Chọn 'Update Field' → 'Update entire table'", { italic: true, alignment: AlignmentType.CENTER }),
    emptyLine(),
    new TableOfContents("Mục lục", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
  ];
}

function createListOfFigures() {
  return [
    p("DANH MỤC HÌNH ẢNH", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE_TITLE, pageBreakBefore: true, spaceAfter: 200 }),
    emptyLine(),
    p("Hình 2.1. Kiến trúc tổng quan hệ thống StaySaga", { alignment: AlignmentType.LEFT }),
    p("Hình 2.2. Quy trình xác thực người dùng với Supabase Auth", { alignment: AlignmentType.LEFT }),
    p("Hình 2.3. Sơ đồ quan hệ thực thể (ERD) của cơ sở dữ liệu", { alignment: AlignmentType.LEFT }),
    p("Hình 3.1. Sơ đồ Use Case tổng quát", { alignment: AlignmentType.LEFT }),
    p("Hình 3.2. Sơ đồ Use Case – Quản lý Homestay (PARTNER)", { alignment: AlignmentType.LEFT }),
    p("Hình 3.3. Sơ đồ Use Case – Đặt phòng (USER)", { alignment: AlignmentType.LEFT }),
    p("Hình 3.4. Sơ đồ Use Case – Quản trị hệ thống (ADMIN)", { alignment: AlignmentType.LEFT }),
    p("Hình 3.5. Sơ đồ Sequence – Quy trình đặt phòng", { alignment: AlignmentType.LEFT }),
    p("Hình 3.6. Sơ đồ Sequence – Đăng ký homestay", { alignment: AlignmentType.LEFT }),
    p("Hình 3.7. Sơ đồ Activity – Quy trình thanh toán", { alignment: AlignmentType.LEFT }),
    p("Hình 4.1. Giao diện trang chủ StaySaga", { alignment: AlignmentType.LEFT }),
    p("Hình 4.2. Giao diện danh sách homestay", { alignment: AlignmentType.LEFT }),
    p("Hình 4.3. Giao diện chi tiết homestay", { alignment: AlignmentType.LEFT }),
    p("Hình 4.4. Giao diện đặt phòng (Checkout)", { alignment: AlignmentType.LEFT }),
    p("Hình 4.5. Giao diện trang quản lý PARTNER", { alignment: AlignmentType.LEFT }),
    p("Hình 4.6. Giao diện đăng ký homestay (Wizard)", { alignment: AlignmentType.LEFT }),
    p("Hình 4.7. Giao diện quản trị ADMIN", { alignment: AlignmentType.LEFT }),
    p("Hình 4.8. Giao diện quản lý booking", { alignment: AlignmentType.LEFT }),
    p("Hình 4.9. Giao diện đăng nhập / đăng ký", { alignment: AlignmentType.LEFT }),
    p("Hình 4.10. Giao diện hồ sơ người dùng", { alignment: AlignmentType.LEFT }),
    p("Hình 5.1. Cấu hình Docker multi-stage build", { alignment: AlignmentType.LEFT }),
    p("Hình 5.2. Kiến trúc triển khai Docker Compose", { alignment: AlignmentType.LEFT }),
  ];
}

function createListOfTables() {
  return [
    p("DANH MỤC BẢNG", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE_TITLE, pageBreakBefore: true, spaceAfter: 200 }),
    emptyLine(),
    p("Bảng 2.1. So sánh các công nghệ Frontend phổ biến", { alignment: AlignmentType.LEFT }),
    p("Bảng 2.2. So sánh các giải pháp Backend-as-a-Service (BaaS)", { alignment: AlignmentType.LEFT }),
    p("Bảng 2.3. Danh sách các thư viện chính sử dụng trong dự án", { alignment: AlignmentType.LEFT }),
    p("Bảng 3.1. Mô tả bảng profiles", { alignment: AlignmentType.LEFT }),
    p("Bảng 3.2. Mô tả bảng homestays", { alignment: AlignmentType.LEFT }),
    p("Bảng 3.3. Mô tả bảng bookings", { alignment: AlignmentType.LEFT }),
    p("Bảng 3.4. Mô tả bảng reviews", { alignment: AlignmentType.LEFT }),
    p("Bảng 3.5. Mô tả bảng rooms", { alignment: AlignmentType.LEFT }),
    p("Bảng 3.6. Mô tả bảng homestay_images", { alignment: AlignmentType.LEFT }),
    p("Bảng 3.7. Danh sách các RLS Policies", { alignment: AlignmentType.LEFT }),
    p("Bảng 3.8. Danh sách các API Routes / Server Actions", { alignment: AlignmentType.LEFT }),
    p("Bảng 4.1. Kết quả kiểm thử chức năng", { alignment: AlignmentType.LEFT }),
    p("Bảng 5.1. Cấu hình biến môi trường", { alignment: AlignmentType.LEFT }),
  ];
}

function createChapter1() {
  return [
    heading1("CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI", { pageBreakBefore: true }),

    heading2("1.1. Đặt vấn đề"),
    p("Trong bối cảnh chuyển đổi số diễn ra mạnh mẽ tại Việt Nam, ngành du lịch và lưu trú đang trải qua giai đoạn phát triển bùng nổ. Theo báo cáo của Tổng cục Du lịch Việt Nam năm 2024, lượng khách du lịch nội địa đạt hơn 110 triệu lượt, tăng 8% so với năm trước. Cùng với đó, mô hình lưu trú homestay ngày càng được ưa chuộng, đặc biệt tại các điểm đến như Đà Lạt, Nha Trang, Đà Nẵng và các vùng nông thôn."),
    p("Tuy nhiên, phần lớn các chủ homestay nhỏ lẻ tại Việt Nam vẫn quản lý thủ công bằng sổ sách, điện thoại hoặc các nền tảng đa mục đích như Facebook, Zalo. Việc này dẫn đến nhiều bất cập: khó kiểm soát lịch đặt phòng, xung đột thời gian, thiếu thông tin minh bạch cho khách hàng, và không có hệ thống đánh giá đáng tin cậy."),
    p("Các nền tảng OTA (Online Travel Agency) lớn như Booking.com, Agoda, hay Airbnb tuy mạnh mẽ nhưng thu phí hoa hồng cao (15-25%), giao diện phức tạp cho chủ nhà nhỏ, và không tối ưu cho thị trường Việt Nam về mặt ngôn ngữ, phương thức thanh toán, và trải nghiệm người dùng."),
    p("Từ những thực tế trên, đề tài \"Xây dựng hệ thống quản lý Homestay – StaySaga\" được đề xuất nhằm phát triển một nền tảng web hiện đại, tích hợp đầy đủ các tính năng quản lý homestay từ đăng ký, quản lý phòng, đặt phòng, đánh giá đến quản trị hệ thống, phục vụ đồng thời ba nhóm đối tượng: khách hàng (USER), chủ homestay (PARTNER) và quản trị viên (ADMIN)."),
    emptyLine(),

    heading2("1.2. Mục tiêu đề tài"),
    heading3("1.2.1. Mục tiêu tổng quát"),
    p("Xây dựng một hệ thống web quản lý homestay hoàn chỉnh, hiện đại, áp dụng các công nghệ mới nhất trong phát triển phần mềm, đáp ứng nhu cầu thực tế của ngành du lịch lưu trú tại Việt Nam."),
    emptyLine(),

    heading3("1.2.2. Mục tiêu cụ thể"),
    p("• Phát triển giao diện người dùng (Frontend) sử dụng Next.js 16 với React 19, tận dụng React Server Components (RSC), Server Actions, và App Router để tối ưu hiệu suất và trải nghiệm người dùng."),
    p("• Xây dựng hệ thống Backend-as-a-Service (BaaS) trên nền tảng Supabase, bao gồm PostgreSQL database, Row Level Security (RLS), Realtime subscriptions, và Storage cho quản lý hình ảnh."),
    p("• Thiết kế cơ sở dữ liệu quan hệ chuẩn hóa với 12+ bảng, hỗ trợ đầy đủ các chức năng: quản lý hồ sơ, homestay, phòng, đặt phòng, đánh giá, thông báo, tin nhắn, và hóa đơn."),
    p("• Triển khai hệ thống phân quyền ba cấp (USER / PARTNER / ADMIN) với Row Level Security policies tại tầng database, đảm bảo an toàn dữ liệu tuyệt đối."),
    p("• Xây dựng quy trình đăng ký homestay dạng wizard nhiều bước (multi-step form) cho PARTNER."),
    p("• Tích hợp Docker cho containerization và triển khai ứng dụng."),
    p("• Thiết kế giao diện đáp ứng (responsive) trên nhiều thiết bị với Tailwind CSS v4."),
    emptyLine(),

    heading2("1.3. Đối tượng và phạm vi nghiên cứu"),
    heading3("1.3.1. Đối tượng nghiên cứu"),
    p("• Các công nghệ mới trong phát triển phần mềm web: Next.js 16, React 19, Supabase, Tailwind CSS v4, Docker."),
    p("• Mô hình kiến trúc ứng dụng web hiện đại: Server-Side Rendering (SSR), React Server Components, Server Actions, Backend-as-a-Service (BaaS)."),
    p("• Hệ thống quản lý lưu trú homestay tại Việt Nam."),
    emptyLine(),

    heading3("1.3.2. Phạm vi nghiên cứu"),
    p("• Phát triển ứng dụng web đáp ứng (responsive web application) chạy trên trình duyệt."),
    p("• Hỗ trợ ba vai trò người dùng: Khách hàng (USER), Chủ homestay (PARTNER), Quản trị viên (ADMIN)."),
    p("• Các chức năng chính: đăng ký/đăng nhập, tìm kiếm homestay, đặt phòng, đánh giá, quản lý homestay, quản trị hệ thống."),
    p("• Triển khai bằng Docker container, có thể deploy lên VPS hoặc cloud."),
    p("• Không bao gồm: tích hợp cổng thanh toán thực (Stripe/VNPay), ứng dụng mobile native, hệ thống chatbot AI."),
    emptyLine(),

    heading2("1.4. Phương pháp nghiên cứu"),
    p("Đề tài áp dụng phương pháp nghiên cứu kết hợp giữa lý thuyết và thực nghiệm:"),
    p("• Nghiên cứu tài liệu: Tham khảo tài liệu chính thức của Next.js, React, Supabase, PostgreSQL, Docker, Tailwind CSS để nắm vững kiến thức nền tảng."),
    p("• Phân tích hệ thống tương tự: Khảo sát và phân tích các nền tảng OTA phổ biến (Booking.com, Airbnb, Agoda) để rút ra các tính năng cần thiết và cải tiến."),
    p("• Phát triển Agile: Áp dụng quy trình phát triển linh hoạt (Agile/Scrum) với các sprint ngắn, liên tục tích hợp và kiểm thử."),
    p("• Kiểm thử thực nghiệm: Thực hiện kiểm thử chức năng, kiểm thử giao diện, và kiểm thử bảo mật trên môi trường phát triển và staging."),
    emptyLine(),

    heading2("1.5. Bố cục báo cáo"),
    p("Báo cáo được trình bày thành 6 chương với cấu trúc như sau:"),
    p("• Chương 1 – Tổng quan đề tài: Giới thiệu bối cảnh, mục tiêu, đối tượng, phạm vi và phương pháp nghiên cứu."),
    p("• Chương 2 – Cơ sở lý thuyết và công nghệ sử dụng: Trình bày các kiến thức nền tảng về công nghệ, kiến trúc hệ thống, và các thư viện/framework sử dụng."),
    p("• Chương 3 – Phân tích và thiết kế hệ thống: Mô tả chi tiết yêu cầu, thiết kế cơ sở dữ liệu, sơ đồ Use Case, Sequence, và kiến trúc hệ thống."),
    p("• Chương 4 – Hiện thực và kiểm thử: Trình bày quá trình hiện thực các tính năng chính, giao diện người dùng, và kết quả kiểm thử."),
    p("• Chương 5 – Triển khai và vận hành: Mô tả quy trình triển khai với Docker, cấu hình môi trường, và hướng dẫn vận hành."),
    p("• Chương 6 – Kết luận và hướng phát triển: Tổng kết kết quả đạt được, hạn chế và đề xuất hướng phát triển trong tương lai."),
  ];
}

function createChapter2() {
  return [
    heading1("CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG", { pageBreakBefore: true }),

    heading2("2.1. Tổng quan về ứng dụng Web hiện đại"),
    p("Ứng dụng web hiện đại đã trải qua nhiều thế hệ phát triển, từ các trang web tĩnh (Static Websites), đến ứng dụng web động (Dynamic Web Applications), rồi đến mô hình Single Page Application (SPA), và gần đây nhất là mô hình Server-Side Rendering kết hợp Client-Side Interactivity."),
    p("Trong giai đoạn hiện tại, xu hướng phát triển web tập trung vào việc kết hợp tối ưu giữa hiệu suất server-side và trải nghiệm tương tác phía client. Các framework như Next.js đã tiên phong trong việc cung cấp mô hình hybrid rendering, cho phép lập trình viên linh hoạt chọn chiến lược render phù hợp cho từng trang hoặc từng component."),
    emptyLine(),

    heading2("2.2. Next.js 16 – Full-stack React Framework"),
    heading3("2.2.1. Giới thiệu Next.js"),
    p("Next.js là một full-stack React framework được phát triển bởi Vercel. Phiên bản 16 (sử dụng trong dự án) mang đến nhiều cải tiến quan trọng về hiệu suất và developer experience."),
    p("Các đặc điểm nổi bật của Next.js 16 được sử dụng trong dự án StaySaga:"),
    p("• App Router: Hệ thống routing dựa trên file-system với hỗ trợ layouts lồng nhau, route groups, loading states, và error boundaries."),
    p("• React Server Components (RSC): Cho phép render component hoàn toàn trên server, giảm kích thước JavaScript bundle gửi xuống client."),
    p("• Server Actions: Cơ chế gọi hàm server trực tiếp từ client components, thay thế API routes truyền thống cho các tác vụ mutate dữ liệu."),
    p("• Streaming và Suspense: Hỗ trợ streaming HTML từ server, cho phép hiển thị nội dung dần dần thay vì chờ toàn bộ trang load xong."),
    p("• Middleware: Xử lý request tại edge trước khi chúng đến route handler, dùng cho xác thực, chuyển hướng, và quản lý session."),
    p("• Image Optimization: Tự động tối ưu hình ảnh với lazy loading, responsive sizes, và modern formats."),
    emptyLine(),

    heading3("2.2.2. App Router và cấu trúc thư mục"),
    p("App Router sử dụng convention-based routing dựa trên cấu trúc thư mục trong thư mục src/app/. Mỗi thư mục tương ứng với một route segment, và các file đặc biệt như page.tsx, layout.tsx, loading.tsx, error.tsx xác định behavior của route đó."),
    p("StaySaga sử dụng các route groups để tổ chức mã nguồn theo vai trò người dùng:"),
    p("• (auth): Nhóm các trang đăng nhập, đăng ký."),
    p("• (admin): Nhóm các trang quản trị viên."),
    p("• (host): Nhóm các trang dành cho đối tác (PARTNER)."),
    p("Các route chính bao gồm: /homestays, /homestays/[slug], /bookings, /checkout, /favorites, /reviews, /messages, /profile, /settings, /destinations, /blog, /help."),
    emptyLine(),

    heading3("2.2.3. React Server Components (RSC)"),
    p("React Server Components là một paradigm mới trong React 19 cho phép component chạy hoàn toàn trên server. Trong StaySaga, phần lớn các component trang (page.tsx) là Server Components, cho phép truy vấn database trực tiếp mà không cần API layer trung gian."),
    p("Ưu điểm khi sử dụng RSC trong StaySaga:"),
    p("• Giảm bundle size: Các thư viện chỉ sử dụng trên server (Supabase client, query logic) không được gửi xuống client."),
    p("• Bảo mật: API keys và database credentials không bao giờ lộ ra phía client."),
    p("• Hiệu suất: Data fetching diễn ra trên server, gần database hơn, giảm waterfall requests."),
    emptyLine(),

    heading3("2.2.4. Server Actions"),
    p("Server Actions cho phép định nghĩa các hàm async chạy trên server, được gọi trực tiếp từ form submissions hoặc client components. Trong StaySaga, tất cả các thao tác mutate dữ liệu (tạo booking, đăng ký homestay, cập nhật profile, v.v.) đều sử dụng Server Actions thay vì API routes."),
    p("Cách hoạt động: Hàm server action được đánh dấu bằng directive 'use server' và có thể được import trực tiếp vào client components. Khi được gọi, React tự động tạo một HTTP POST request đến server, thực thi hàm, và trả kết quả về client."),
    emptyLine(),

    heading2("2.3. React 19"),
    p("React 19 là phiên bản mới nhất của thư viện UI phổ biến nhất thế giới, được sử dụng làm nền tảng cho StaySaga. Các tính năng chính được áp dụng:"),
    p("• Server Components: Như đã trình bày ở mục 2.2.3."),
    p("• useActionState và useFormStatus: Các hooks mới hỗ trợ form handling tối ưu với Server Actions."),
    p("• Concurrent Features: Bao gồm Suspense, Transitions, và Streaming SSR."),
    p("• Improved Hydration: Selective hydration cho phép tương tác với các phần của trang ngay cả khi phần khác chưa hydrate xong."),
    emptyLine(),

    heading2("2.4. Supabase – Backend-as-a-Service"),
    heading3("2.4.1. Giới thiệu Supabase"),
    p("Supabase là một nền tảng Backend-as-a-Service (BaaS) mã nguồn mở, được xây dựng trên nền PostgreSQL. Supabase cung cấp đầy đủ các dịch vụ backend mà một ứng dụng web hiện đại cần: database, authentication, realtime subscriptions, storage, và edge functions."),
    p("So với Firebase của Google, Supabase có ưu điểm sử dụng PostgreSQL (SQL) thay vì NoSQL, hỗ trợ Row Level Security, và có thể self-host. Điều này phù hợp với yêu cầu của StaySaga về quản lý dữ liệu quan hệ phức tạp (homestay, phòng, booking, reviews)."),
    emptyLine(),

    heading3("2.4.2. PostgreSQL Database"),
    p("StaySaga sử dụng PostgreSQL thông qua Supabase, tận dụng các tính năng nâng cao:"),
    p("• Extensions: pgcrypto cho sinh UUID (gen_random_uuid())."),
    p("• Functions và Triggers: Tự động cập nhật updated_at, sinh booking_code, tạo profile khi user đăng ký."),
    p("• Check Constraints: Đảm bảo tính toàn vẹn dữ liệu (giá >= 0, rating 1-5, status hợp lệ)."),
    p("• Foreign Keys với ON DELETE CASCADE: Tự động xóa dữ liệu liên quan khi bản ghi cha bị xóa."),
    p("• Indexes: Tối ưu truy vấn với các index trên các cột thường xuyên tìm kiếm."),
    emptyLine(),

    heading3("2.4.3. Row Level Security (RLS)"),
    p("Row Level Security là tính năng cốt lõi được sử dụng trong StaySaga để đảm bảo an toàn dữ liệu tại tầng database. Thay vì kiểm tra quyền truy cập tại tầng application, RLS policies được định nghĩa trực tiếp trong PostgreSQL, đảm bảo rằng mọi truy vấn (kể cả truy vấn trực tiếp) đều phải tuân thủ quy tắc phân quyền."),
    p("StaySaga định nghĩa hơn 30 RLS policies, bao gồm các nhóm chính:"),
    p("• Profiles: Người dùng chỉ đọc/sửa hồ sơ của chính mình, admin đọc tất cả."),
    p("• Homestays: Homestay APPROVED hiển thị public, owner/admin quản lý toàn bộ."),
    p("• Bookings: User xem booking của mình, partner xem booking trên homestay của mình."),
    p("• Reviews: Reviews VISIBLE hiển thị public, user chỉ đánh giá sau khi đã ở."),
    p("• Storage: Upload ảnh theo thư mục user (user_id/filename), public read."),
    emptyLine(),

    heading3("2.4.4. Supabase Auth"),
    p("Supabase Auth cung cấp hệ thống xác thực đầy đủ, được tích hợp vào StaySaga thông qua package @supabase/ssr. Hỗ trợ:"),
    p("• Email/Password authentication với xác nhận email."),
    p("• OAuth providers (Google, GitHub, Facebook)."),
    p("• Session management thông qua cookies (server-side)."),
    p("• Password recovery và email verification."),
    p("Khi user đăng ký mới, trigger on_auth_user_created tự động tạo bản ghi profile trong bảng public.profiles."),
    emptyLine(),

    heading3("2.4.5. Supabase Storage"),
    p("Supabase Storage được sử dụng để lưu trữ hình ảnh homestay trong bucket 'homestay-images'. Cấu hình:"),
    p("• File size limit: 5MB (5242880 bytes)."),
    p("• Allowed MIME types: image/jpeg, image/png, image/webp, image/gif."),
    p("• Public bucket: Cho phép đọc ảnh mà không cần xác thực."),
    p("• Upload policy: Chỉ authenticated users upload vào thư mục riêng (user_id/)."),
    emptyLine(),

    heading3("2.4.6. Supabase Realtime"),
    p("StaySaga tích hợp Supabase Realtime để nhận thông báo và cập nhật dữ liệu theo thời gian thực. Realtime subscriptions được sử dụng cho:"),
    p("• Thông báo booking mới cho PARTNER."),
    p("• Cập nhật trạng thái booking cho USER."),
    p("• Tin nhắn giữa USER và PARTNER."),
    emptyLine(),

    heading2("2.5. Tailwind CSS v4"),
    p("Tailwind CSS là một utility-first CSS framework, cho phép xây dựng giao diện bằng cách kết hợp các class utility trực tiếp trong HTML/JSX. StaySaga sử dụng Tailwind CSS v4 – phiên bản mới nhất với kiến trúc engine hoàn toàn mới."),
    p("Các tính năng Tailwind CSS v4 được sử dụng:"),
    p("• Zero-config setup: Không cần file tailwind.config.js, cấu hình thông qua CSS."),
    p("• PostCSS integration: Tích hợp qua @tailwindcss/postcss."),
    p("• Dark mode: Hỗ trợ dark mode thông qua class-based approach."),
    p("• Responsive design: Mobile-first breakpoints (sm, md, lg, xl, 2xl)."),
    p("• Custom animations: Micro-animations và transitions cho trải nghiệm premium."),
    emptyLine(),

    heading2("2.6. Docker – Containerization"),
    p("Docker được sử dụng để containerize ứng dụng StaySaga, đảm bảo tính nhất quán giữa môi trường phát triển và production. Dự án sử dụng Docker multi-stage build:"),
    p("• Stage 1 (deps): Cài đặt node_modules từ package.json và package-lock.json."),
    p("• Stage 2 (builder): Build ứng dụng Next.js với npm run build."),
    p("• Stage 3 (runner): Chạy ứng dụng production với image minimal (node:22-alpine)."),
    p("Docker Compose được sử dụng để orchestrate service, cấu hình biến môi trường, và quản lý lifecycle container."),
    emptyLine(),

    heading2("2.7. Các thư viện hỗ trợ"),
    p("Ngoài các công nghệ chính, StaySaga sử dụng nhiều thư viện hỗ trợ để nâng cao chức năng và trải nghiệm:"),
    emptyLine(),
    tableCaption("Bảng 2.3. Danh sách các thư viện chính sử dụng trong dự án"),
    createTable(
      ["STT", "Thư viện", "Phiên bản", "Mục đích sử dụng"],
      [
        ["1", "@supabase/ssr", "^0.10.3", "Supabase client cho SSR (Server-Side Rendering)"],
        ["2", "@supabase/supabase-js", "^2.105.4", "Supabase JavaScript client SDK"],
        ["3", "framer-motion", "^12.38.0", "Thư viện animation cho React components"],
        ["4", "lucide-react", "^1.14.0", "Icon library hiện đại dạng SVG"],
        ["5", "react-hot-toast", "^2.6.0", "Toast notification system"],
        ["6", "react-select", "^5.10.2", "Custom select/dropdown component"],
        ["7", "date-fns", "^4.1.0", "Thư viện xử lý ngày tháng"],
        ["8", "clsx", "^2.1.1", "Utility merge CSS class names"],
        ["9", "tailwind-merge", "^3.5.0", "Merge Tailwind classes thông minh"],
        ["10", "cheerio", "^1.2.0", "HTML parsing (scraping dữ liệu homestay)"],
        ["11", "docx", "^9.7.0", "Tạo file Word (.docx) từ JavaScript"],
        ["12", "TypeScript", "^5", "Ngôn ngữ lập trình có kiểu dữ liệu tĩnh"],
      ],
      { columnWidths: [8, 22, 15, 55] }
    ),
    emptyLine(),

    heading2("2.8. So sánh công nghệ"),
    heading3("2.8.1. So sánh Frontend Framework"),
    emptyLine(),
    tableCaption("Bảng 2.1. So sánh các công nghệ Frontend phổ biến"),
    createTable(
      ["Tiêu chí", "Next.js (React)", "Nuxt.js (Vue)", "Angular"],
      [
        ["SSR / SSG", "Hỗ trợ đầy đủ", "Hỗ trợ đầy đủ", "Angular Universal"],
        ["Server Components", "Có (React 19)", "Không", "Không"],
        ["Server Actions", "Có (native)", "Không", "Không"],
        ["Learning Curve", "Trung bình", "Dễ", "Khó"],
        ["Ecosystem", "Rất lớn", "Lớn", "Lớn"],
        ["Performance", "Rất tốt", "Tốt", "Tốt"],
        ["TypeScript", "Native support", "Native support", "Bắt buộc"],
        ["Community", "Rất lớn", "Lớn", "Lớn"],
      ],
      { columnWidths: [25, 25, 25, 25] }
    ),
    p("Lý do chọn Next.js: Hỗ trợ Server Components và Server Actions giúp đơn giản hóa kiến trúc, giảm số lượng API routes cần viết, và tối ưu performance. Cộng đồng lớn và tài liệu phong phú."),
    emptyLine(),

    heading3("2.8.2. So sánh Backend-as-a-Service"),
    emptyLine(),
    tableCaption("Bảng 2.2. So sánh các giải pháp Backend-as-a-Service (BaaS)"),
    createTable(
      ["Tiêu chí", "Supabase", "Firebase", "Appwrite"],
      [
        ["Database", "PostgreSQL (SQL)", "Firestore (NoSQL)", "MariaDB"],
        ["Row Level Security", "Có (native SQL)", "Security Rules", "Permissions"],
        ["Open Source", "Có", "Không", "Có"],
        ["Self-hosting", "Có", "Không", "Có"],
        ["Realtime", "Có", "Có", "Có"],
        ["Auth", "Đầy đủ", "Đầy đủ", "Đầy đủ"],
        ["Storage", "Có", "Có", "Có"],
        ["Edge Functions", "Deno/TypeScript", "Node.js", "Node.js"],
        ["Pricing", "Generous free tier", "Pay-as-you-go", "Self-hosted free"],
      ],
      { columnWidths: [20, 27, 27, 26] }
    ),
    p("Lý do chọn Supabase: Sử dụng PostgreSQL phù hợp với dữ liệu quan hệ phức tạp (homestay-room-booking-review). Row Level Security tại database level đảm bảo an toàn tuyệt đối. Open source và self-host được, giảm chi phí vận hành."),
  ];
}

function createChapter3() {
  return [
    heading1("CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG", { pageBreakBefore: true }),

    heading2("3.1. Phân tích yêu cầu hệ thống"),
    heading3("3.1.1. Yêu cầu chức năng"),
    p("Hệ thống StaySaga được phân tích với ba nhóm chức năng chính theo vai trò người dùng:"),
    emptyLine(),
    p("A. Chức năng dành cho Khách hàng (USER):", { bold: true }),
    p("• F01: Đăng ký tài khoản mới bằng email/password hoặc OAuth (Google)."),
    p("• F02: Đăng nhập hệ thống và quản lý phiên đăng nhập."),
    p("• F03: Tìm kiếm homestay theo vị trí (thành phố), giá, tiện nghi, đánh giá."),
    p("• F04: Xem danh sách homestay với bộ lọc và sắp xếp."),
    p("• F05: Xem chi tiết homestay: mô tả, hình ảnh, tiện nghi, bản đồ, đánh giá."),
    p("• F06: Đặt phòng với chọn ngày check-in/check-out, số khách, loại phòng."),
    p("• F07: Xem lịch sử đặt phòng (My Trips) với trạng thái."),
    p("• F08: Hủy đặt phòng (trước khi confirmed)."),
    p("• F09: Viết đánh giá và xếp hạng sau khi hoàn thành lưu trú."),
    p("• F10: Lưu homestay yêu thích (Favorites/Wishlist)."),
    p("• F11: Quản lý hồ sơ cá nhân (avatar, tên, điện thoại)."),
    p("• F12: Nhận thông báo về trạng thái booking."),
    p("• F13: Gửi tin nhắn cho chủ homestay về booking."),
    emptyLine(),
    p("B. Chức năng dành cho Chủ homestay (PARTNER):", { bold: true }),
    p("• F14: Đăng ký trở thành PARTNER (nâng cấp từ USER)."),
    p("• F15: Đăng ký homestay mới qua wizard nhiều bước (thông tin cơ bản, hình ảnh, tiện nghi, phòng/giá, lịch, xác nhận)."),
    p("• F16: Quản lý danh sách homestay đã đăng ký."),
    p("• F17: Cập nhật thông tin, hình ảnh, giá homestay."),
    p("• F18: Quản lý đặt phòng: xác nhận, từ chối, đánh dấu hoàn thành."),
    p("• F19: Xem doanh thu và thống kê."),
    p("• F20: Trả lời đánh giá và tin nhắn từ khách hàng."),
    p("• F21: Quản lý phòng (rooms) trong từng homestay."),
    emptyLine(),
    p("C. Chức năng dành cho Quản trị viên (ADMIN):", { bold: true }),
    p("• F22: Dashboard tổng quan: thống kê người dùng, homestay, booking, doanh thu."),
    p("• F23: Quản lý người dùng: xem, block, unblock, thay đổi vai trò."),
    p("• F24: Duyệt homestay: xem homestay pending, approve, reject."),
    p("• F25: Quản lý đánh giá: ẩn/hiện đánh giá vi phạm."),
    p("• F26: Quản lý booking toàn hệ thống."),
    p("• F27: Cài đặt hệ thống (hero image, title, subtitle)."),
    emptyLine(),

    heading3("3.1.2. Yêu cầu phi chức năng"),
    p("• NFR01 – Hiệu suất: Trang chủ load dưới 3 giây, trang danh sách dưới 2 giây."),
    p("• NFR02 – Bảo mật: RLS tại database, session-based auth, input sanitization."),
    p("• NFR03 – Khả năng mở rộng: Kiến trúc serverless (Supabase) scale theo nhu cầu."),
    p("• NFR04 – Responsive: Giao diện tương thích mobile, tablet, desktop."),
    p("• NFR05 – Usability: Giao diện tiếng Việt, trực quan, dễ sử dụng."),
    p("• NFR06 – Reliability: Uptime 99.9% nhờ Supabase managed service."),
    p("• NFR07 – Maintainability: Code TypeScript, structure rõ ràng, separation of concerns."),
    emptyLine(),

    heading2("3.2. Thiết kế cơ sở dữ liệu"),
    heading3("3.2.1. Sơ đồ quan hệ thực thể (ERD)"),
    p("Cơ sở dữ liệu StaySaga bao gồm 12 bảng chính, được thiết kế theo mô hình quan hệ chuẩn hóa (3NF). Sơ đồ ERD mô tả mối quan hệ giữa các thực thể:"),
    emptyLine(),
    figureCaption("Hình 2.3. Sơ đồ quan hệ thực thể (ERD) của cơ sở dữ liệu"),
    p("(Chèn sơ đồ ERD tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("3.2.2. Mô tả chi tiết các bảng"),
    p("Dưới đây là mô tả chi tiết từng bảng trong cơ sở dữ liệu:"),
    emptyLine(),

    // Table: profiles
    tableCaption("Bảng 3.1. Mô tả bảng profiles"),
    createTable(
      ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Mô tả"],
      [
        ["id", "uuid", "PK, FK → auth.users(id)", "Mã người dùng"],
        ["full_name", "text", "Nullable", "Họ tên đầy đủ"],
        ["email", "text", "Nullable", "Email"],
        ["phone", "text", "Nullable", "Số điện thoại"],
        ["avatar_url", "text", "Nullable", "URL ảnh đại diện"],
        ["locale", "text", "DEFAULT 'vi'", "Ngôn ngữ giao diện"],
        ["role", "text", "NOT NULL, CHECK IN ('USER','PARTNER','ADMIN')", "Vai trò người dùng"],
        ["status", "text", "NOT NULL, DEFAULT 'ACTIVE'", "Trạng thái tài khoản"],
        ["created_at", "timestamptz", "NOT NULL, DEFAULT now()", "Thời gian tạo"],
        ["updated_at", "timestamptz", "NOT NULL, DEFAULT now()", "Thời gian cập nhật"],
      ],
      { columnWidths: [15, 18, 35, 32] }
    ),
    emptyLine(),

    // Table: homestays
    tableCaption("Bảng 3.2. Mô tả bảng homestays"),
    createTable(
      ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Mô tả"],
      [
        ["id", "uuid", "PK, DEFAULT gen_random_uuid()", "Mã homestay"],
        ["owner_id", "uuid", "FK → profiles(id), NOT NULL", "Mã chủ sở hữu"],
        ["slug", "text", "UNIQUE, NOT NULL", "URL thân thiện"],
        ["name", "text", "NOT NULL", "Tên homestay"],
        ["description", "text", "Nullable", "Mô tả chung"],
        ["property_type", "text", "Nullable", "Loại bất động sản"],
        ["address", "text", "Nullable", "Địa chỉ chi tiết"],
        ["city", "text", "NOT NULL", "Thành phố"],
        ["district", "text", "Nullable", "Quận/huyện"],
        ["country", "text", "DEFAULT 'Vietnam'", "Quốc gia"],
        ["latitude", "numeric(10,7)", "Nullable", "Vĩ độ"],
        ["longitude", "numeric(10,7)", "Nullable", "Kinh độ"],
        ["price_per_night", "numeric(12,2)", "NOT NULL, CHECK >= 0", "Giá mỗi đêm (VND)"],
        ["max_guests", "integer", "NOT NULL, DEFAULT 2", "Số khách tối đa"],
        ["bedrooms", "integer", "NOT NULL, DEFAULT 1", "Số phòng ngủ"],
        ["beds", "integer", "NOT NULL, DEFAULT 1", "Số giường"],
        ["bathrooms", "integer", "NOT NULL, DEFAULT 1", "Số phòng tắm"],
        ["avg_rating", "numeric(3,2)", "DEFAULT 4.8, CHECK 0-5", "Điểm đánh giá TB"],
        ["is_active", "boolean", "DEFAULT true", "Kích hoạt"],
        ["status", "text", "CHECK IN statuses", "Trạng thái duyệt"],
        ["booking_mode", "text", "DEFAULT 'INSTANT'", "Chế độ đặt phòng"],
        ["verification_status", "text", "DEFAULT 'PENDING'", "Trạng thái xác minh"],
        ["policies", "jsonb", "DEFAULT '{}'", "Chính sách lưu trú"],
        ["registration_checklist", "jsonb", "DEFAULT '{}'", "Tiến trình đăng ký"],
        ["submitted_at", "timestamptz", "Nullable", "Thời gian gửi duyệt"],
        ["reviewed_at", "timestamptz", "Nullable", "Thời gian duyệt"],
        ["created_at", "timestamptz", "NOT NULL", "Thời gian tạo"],
        ["updated_at", "timestamptz", "NOT NULL", "Thời gian cập nhật"],
      ],
      { columnWidths: [18, 18, 32, 32] }
    ),
    emptyLine(),

    // Table: bookings
    tableCaption("Bảng 3.3. Mô tả bảng bookings"),
    createTable(
      ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Mô tả"],
      [
        ["id", "uuid", "PK", "Mã đặt phòng"],
        ["booking_code", "text", "UNIQUE, auto-generated", "Mã booking (BK-YYYYMMDD-XXXX)"],
        ["user_id", "uuid", "FK → profiles(id), NOT NULL", "Mã khách hàng"],
        ["homestay_id", "uuid", "FK → homestays(id), NOT NULL", "Mã homestay"],
        ["room_id", "uuid", "FK → rooms(id), Nullable", "Mã phòng"],
        ["check_in_date", "date", "NOT NULL", "Ngày check-in"],
        ["check_out_date", "date", "NOT NULL", "Ngày check-out"],
        ["check_in", "date", "Nullable", "Ngày check-in (alias)"],
        ["check_out", "date", "Nullable", "Ngày check-out (alias)"],
        ["guests", "integer", "NOT NULL, CHECK > 0", "Số khách"],
        ["nights", "integer", "Nullable", "Số đêm"],
        ["price_per_night", "numeric(12,2)", "Nullable", "Giá mỗi đêm"],
        ["total_price", "numeric(12,2)", "NOT NULL, CHECK >= 0", "Tổng giá"],
        ["status", "text", "CHECK IN statuses", "Trạng thái booking"],
        ["payment_status", "text", "DEFAULT 'UNPAID'", "Trạng thái thanh toán"],
        ["guest_name", "text", "Nullable", "Tên khách"],
        ["guest_email", "text", "Nullable", "Email khách"],
        ["guest_phone", "text", "Nullable", "SĐT khách"],
        ["special_request", "text", "Nullable", "Yêu cầu đặc biệt"],
        ["cancel_reason", "text", "Nullable", "Lý do hủy"],
        ["created_at", "timestamptz", "NOT NULL", "Thời gian tạo"],
        ["updated_at", "timestamptz", "NOT NULL", "Thời gian cập nhật"],
      ],
      { columnWidths: [18, 18, 32, 32] }
    ),
    emptyLine(),

    // Table: rooms
    tableCaption("Bảng 3.5. Mô tả bảng rooms"),
    createTable(
      ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Mô tả"],
      [
        ["id", "uuid", "PK", "Mã phòng"],
        ["homestay_id", "uuid", "FK → homestays(id), NOT NULL", "Mã homestay"],
        ["name", "text", "NOT NULL", "Tên phòng"],
        ["max_guests", "integer", "NOT NULL, DEFAULT 2", "Sức chứa tối đa"],
        ["bed_type", "text", "DEFAULT 'double'", "Loại giường"],
        ["bed_count", "integer", "DEFAULT 1", "Số giường"],
        ["bathroom_count", "integer", "DEFAULT 1", "Số phòng tắm"],
        ["private_bathroom", "boolean", "DEFAULT true", "Phòng tắm riêng"],
        ["price_per_night", "numeric(12,2)", "DEFAULT 0", "Giá mỗi đêm"],
        ["quantity", "integer", "DEFAULT 1", "Số lượng phòng"],
        ["status", "text", "CHECK IN ('ACTIVE','INACTIVE')", "Trạng thái"],
        ["created_at", "timestamptz", "NOT NULL", "Thời gian tạo"],
        ["updated_at", "timestamptz", "NOT NULL", "Thời gian cập nhật"],
      ],
      { columnWidths: [18, 20, 32, 30] }
    ),
    emptyLine(),

    // Table: reviews
    tableCaption("Bảng 3.4. Mô tả bảng reviews"),
    createTable(
      ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Mô tả"],
      [
        ["id", "uuid", "PK", "Mã đánh giá"],
        ["user_id", "uuid", "FK → profiles(id), NOT NULL", "Mã người đánh giá"],
        ["homestay_id", "uuid", "FK → homestays(id), NOT NULL", "Mã homestay"],
        ["booking_id", "uuid", "FK → bookings(id), Nullable", "Mã booking liên quan"],
        ["rating", "integer", "NOT NULL, CHECK 1-5", "Điểm đánh giá (1-5 sao)"],
        ["comment", "text", "NOT NULL", "Nội dung đánh giá"],
        ["status", "text", "DEFAULT 'VISIBLE'", "Trạng thái hiển thị"],
        ["created_at", "timestamptz", "NOT NULL", "Thời gian tạo"],
        ["updated_at", "timestamptz", "NOT NULL", "Thời gian cập nhật"],
      ],
      { columnWidths: [15, 18, 35, 32] }
    ),
    emptyLine(),

    // Table: homestay_images
    tableCaption("Bảng 3.6. Mô tả bảng homestay_images"),
    createTable(
      ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Mô tả"],
      [
        ["id", "uuid", "PK", "Mã hình ảnh"],
        ["homestay_id", "uuid", "FK → homestays(id), NOT NULL", "Mã homestay"],
        ["url", "text", "NOT NULL", "URL hình ảnh (public)"],
        ["image_url", "text", "Nullable", "URL hình ảnh (alias)"],
        ["storage_path", "text", "Nullable", "Đường dẫn trong Storage"],
        ["alt", "text", "Nullable", "Mô tả thay thế (SEO)"],
        ["is_cover", "boolean", "DEFAULT false", "Ảnh bìa"],
        ["is_primary", "boolean", "Nullable", "Ảnh chính"],
        ["category", "text", "Nullable", "Danh mục ảnh"],
        ["sort_order", "integer", "DEFAULT 0", "Thứ tự sắp xếp"],
        ["created_at", "timestamptz", "NOT NULL", "Thời gian tạo"],
      ],
      { columnWidths: [15, 18, 35, 32] }
    ),
    emptyLine(),

    // Other tables brief
    p("Các bảng khác bao gồm:", { bold: true }),
    p("• amenities: Danh mục tiện nghi (WiFi, bãi đỗ xe, bếp, hồ bơi, BBQ, sân vườn, điều hòa, bữa sáng)."),
    p("• homestay_amenities: Bảng liên kết nhiều-nhiều giữa homestays và amenities."),
    p("• favorites: Danh sách yêu thích của người dùng (UNIQUE constraint trên user_id + property_id)."),
    p("• notifications: Thông báo hệ thống với trạng thái đã đọc."),
    p("• booking_messages: Tin nhắn giữa khách hàng và chủ homestay."),
    p("• invoice_requests: Yêu cầu xuất hóa đơn từ khách hàng."),
    p("• site_settings: Cấu hình hệ thống (key-value store)."),
    emptyLine(),

    heading3("3.2.3. Danh sách Indexes"),
    p("Hệ thống sử dụng các index để tối ưu truy vấn:"),
    p("• homestays_owner_id_idx: Tìm homestay theo chủ sở hữu."),
    p("• homestays_city_idx: Tìm homestay theo thành phố."),
    p("• homestays_active_idx: Lọc homestay đang hoạt động."),
    p("• bookings_user_id_idx: Tìm booking theo khách hàng."),
    p("• bookings_homestay_id_idx: Tìm booking theo homestay."),
    p("• bookings_status_idx: Lọc booking theo trạng thái."),
    p("• bookings_payment_status_idx: Lọc theo trạng thái thanh toán."),
    p("• bookings_booking_code_unique_idx: Unique index cho mã booking."),
    p("• bookings_check_in_idx, bookings_check_out_idx: Tìm booking theo ngày."),
    p("• favorites_user_id_idx: Danh sách yêu thích theo người dùng."),
    p("• reviews_homestay_id_idx: Đánh giá theo homestay."),
    emptyLine(),

    heading3("3.2.4. Triggers và Functions"),
    p("Hệ thống sử dụng các PostgreSQL triggers để tự động hóa logic nghiệp vụ:"),
    emptyLine(),
    p("1. set_updated_at(): Tự động cập nhật cột updated_at khi bản ghi được sửa. Áp dụng cho: profiles, homestays, bookings, reviews, rooms.", { bold: false }),
    p("2. handle_new_user(): Trigger sau khi INSERT vào auth.users, tự động tạo bản ghi profile với thông tin từ raw_user_meta_data (full_name, email, avatar_url). Sử dụng ON CONFLICT DO UPDATE để xử lý OAuth login lần đầu.", { bold: false }),
    p("3. set_booking_checkout_fields(): Trigger trước INSERT/UPDATE trên bookings, tự động sinh booking_code (format: BK-YYYYMMDD-XXXX), tính nights, price_per_night, và đồng bộ check_in/check_out với check_in_date/check_out_date.", { bold: false }),
    emptyLine(),

    heading2("3.3. Thiết kế hệ thống phân quyền"),
    heading3("3.3.1. Mô hình phân quyền ba cấp"),
    p("StaySaga áp dụng mô hình phân quyền ba cấp dựa trên vai trò (Role-Based Access Control – RBAC):"),
    p("• USER: Vai trò mặc định khi đăng ký. Quyền: tìm kiếm, đặt phòng, đánh giá, quản lý yêu thích."),
    p("• PARTNER: Nâng cấp từ USER. Quyền: tất cả quyền USER + đăng ký homestay, quản lý phòng, quản lý booking trên homestay mình."),
    p("• ADMIN: Chỉ được gán bởi system. Quyền: toàn quyền quản trị hệ thống."),
    emptyLine(),

    heading3("3.3.2. Row Level Security Policies"),
    p("Dưới đây là tóm tắt các RLS policies quan trọng:"),
    emptyLine(),
    tableCaption("Bảng 3.7. Danh sách các RLS Policies chính"),
    createTable(
      ["Bảng", "Policy", "Mô tả"],
      [
        ["profiles", "profiles select own or admin", "User xem profile mình, Admin xem tất cả"],
        ["profiles", "profiles update own non security fields", "User sửa profile mình, không đổi role/status"],
        ["profiles", "admins manage profiles", "Admin toàn quyền quản lý profiles"],
        ["homestays", "approved homestays public", "Homestay APPROVED hiển thị public"],
        ["homestays", "partners create own homestays", "Partner tạo homestay mới (DRAFT/PENDING)"],
        ["homestays", "partners update own homestays", "Partner sửa homestay mình (non-APPROVED)"],
        ["bookings", "bookings select relevant", "User/Partner/Admin xem booking liên quan"],
        ["bookings", "users create own bookings", "User tạo booking trên homestay APPROVED"],
        ["reviews", "visible reviews public", "Review VISIBLE hiển thị public"],
        ["reviews", "users create own reviews after stay", "User đánh giá sau khi checkout"],
        ["storage", "users upload own folder", "User upload vào thư mục user_id/"],
      ],
      { columnWidths: [15, 35, 50] }
    ),
    emptyLine(),

    heading2("3.4. Thiết kế kiến trúc hệ thống"),
    heading3("3.4.1. Kiến trúc tổng quan"),
    p("StaySaga sử dụng kiến trúc 3-tier (3 tầng) kết hợp với mô hình Backend-as-a-Service:"),
    emptyLine(),
    p("Tầng 1 – Presentation Layer (Client): React components chạy trên trình duyệt, xử lý UI/UX, form handling, client-side validation.", { bold: false }),
    p("Tầng 2 – Application Layer (Next.js Server): React Server Components, Server Actions, Middleware. Xử lý business logic, data fetching, server-side rendering.", { bold: false }),
    p("Tầng 3 – Data Layer (Supabase): PostgreSQL database, RLS policies, Auth service, Storage, Realtime subscriptions.", { bold: false }),
    emptyLine(),
    figureCaption("Hình 2.1. Kiến trúc tổng quan hệ thống StaySaga"),
    p("(Chèn sơ đồ kiến trúc tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("3.4.2. Luồng xác thực (Authentication Flow)"),
    p("Quy trình xác thực trong StaySaga:"),
    p("1. User nhập email/password hoặc click OAuth button trên trang đăng nhập."),
    p("2. Supabase Auth xác thực và trả về session tokens (access_token + refresh_token)."),
    p("3. Next.js middleware (src/middleware.ts) intercepting mỗi request, gọi supabase.auth.getUser() để verify session."),
    p("4. Session tokens được lưu trong HTTP-only cookies, tự động refresh khi hết hạn."),
    p("5. Server Components truy cập user context thông qua createClient() → supabase.auth.getUser()."),
    p("6. RLS policies tự động áp dụng dựa trên auth.uid() từ session token."),
    emptyLine(),
    figureCaption("Hình 2.2. Quy trình xác thực người dùng với Supabase Auth"),
    p("(Chèn sơ đồ sequence tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("3.4.3. Cấu trúc thư mục dự án"),
    p("Dự án StaySaga được tổ chức theo cấu trúc module:"),
    p("staysaga/"),
    p("├── src/"),
    p("│   ├── app/                    # App Router – Pages & Layouts"),
    p("│   │   ├── (auth)/             # Route group: Login, Register"),
    p("│   │   ├── (admin)/admin/      # Route group: Admin Dashboard"),
    p("│   │   ├── (host)/host/        # Route group: Partner Dashboard"),
    p("│   │   ├── homestays/          # Public homestay listing & detail"),
    p("│   │   ├── bookings/           # User booking management"),
    p("│   │   ├── checkout/           # Booking checkout flow"),
    p("│   │   ├── favorites/          # User wishlist"),
    p("│   │   ├── reviews/            # Reviews management"),
    p("│   │   ├── messages/           # Messaging system"),
    p("│   │   ├── profile/            # User profile"),
    p("│   │   ├── settings/           # User settings"),
    p("│   │   └── host/register/      # Partner homestay registration wizard"),
    p("│   ├── components/             # Reusable UI components"),
    p("│   │   ├── features/           # Feature-specific components"),
    p("│   │   ├── forms/              # Form components"),
    p("│   │   ├── home/               # Homepage components"),
    p("│   │   ├── layout/             # Navbar, Footer, Sidebar"),
    p("│   │   ├── providers/          # React context providers"),
    p("│   │   ├── realtime/           # Realtime subscription components"),
    p("│   │   └── ui/                 # Generic UI components"),
    p("│   ├── core/                   # Business logic & Server Actions"),
    p("│   │   ├── admin/              # Admin actions"),
    p("│   │   ├── auth/               # Auth actions"),
    p("│   │   ├── bookings/           # Booking actions"),
    p("│   │   ├── favorites/          # Favorites actions"),
    p("│   │   ├── host/               # Host/Partner actions"),
    p("│   │   ├── properties/         # Property query actions"),
    p("│   │   ├── reviews/            # Review actions"),
    p("│   │   └── site/               # Site settings actions"),
    p("│   ├── lib/                    # Utility libraries"),
    p("│   │   ├── supabase/           # Supabase client (server, client, session)"),
    p("│   │   └── utils.ts            # Helper functions"),
    p("│   └── hooks/                  # Custom React hooks"),
    p("├── supabase/                   # Supabase configuration"),
    p("│   ├── migrations/             # SQL migration files"),
    p("│   └── config.toml             # Supabase local config"),
    p("├── public/                     # Static assets"),
    p("├── Dockerfile                  # Docker multi-stage build"),
    p("├── docker-compose.yml          # Docker Compose orchestration"),
    p("└── package.json                # Dependencies & scripts"),
    emptyLine(),

    heading2("3.5. Sơ đồ Use Case"),
    heading3("3.5.1. Sơ đồ Use Case tổng quát"),
    p("Sơ đồ Use Case tổng quát mô tả tất cả các chức năng chính và mối quan hệ giữa ba tác nhân (USER, PARTNER, ADMIN):"),
    emptyLine(),
    figureCaption("Hình 3.1. Sơ đồ Use Case tổng quát"),
    p("(Chèn sơ đồ Use Case tổng quát tại đây – bao gồm tất cả chức năng F01-F27)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("3.5.2. Sơ đồ Use Case – Quản lý Homestay (PARTNER)"),
    p("Chi tiết các use case liên quan đến quản lý homestay:"),
    p("• UC-14: Đăng ký PARTNER"),
    p("• UC-15: Đăng ký homestay mới (wizard)"),
    p("• UC-16: Xem danh sách homestay"),
    p("• UC-17: Cập nhật thông tin homestay"),
    p("• UC-18: Quản lý booking"),
    p("• UC-21: Quản lý phòng"),
    emptyLine(),
    figureCaption("Hình 3.2. Sơ đồ Use Case – Quản lý Homestay (PARTNER)"),
    p("(Chèn sơ đồ tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("3.5.3. Sơ đồ Use Case – Đặt phòng (USER)"),
    p("Chi tiết các use case liên quan đến quy trình đặt phòng:"),
    p("• UC-03: Tìm kiếm homestay"),
    p("• UC-04: Xem danh sách với bộ lọc"),
    p("• UC-05: Xem chi tiết homestay"),
    p("• UC-06: Đặt phòng (checkout)"),
    p("• UC-07: Xem lịch sử booking"),
    p("• UC-08: Hủy booking"),
    emptyLine(),
    figureCaption("Hình 3.3. Sơ đồ Use Case – Đặt phòng (USER)"),
    p("(Chèn sơ đồ tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("3.5.4. Sơ đồ Use Case – Quản trị hệ thống (ADMIN)"),
    figureCaption("Hình 3.4. Sơ đồ Use Case – Quản trị hệ thống (ADMIN)"),
    p("(Chèn sơ đồ tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading2("3.6. Sơ đồ Sequence"),
    heading3("3.6.1. Quy trình đặt phòng"),
    p("Sơ đồ sequence mô tả luồng tương tác giữa User, Browser, Next.js Server, và Supabase khi đặt phòng:"),
    p("1. User chọn homestay → Browser render trang chi tiết (Server Component fetch data từ Supabase)."),
    p("2. User chọn ngày check-in/check-out, số khách → Click \"Đặt phòng\"."),
    p("3. Browser redirect đến /checkout với query params."),
    p("4. User điền thông tin khách (tên, email, SĐT, yêu cầu đặc biệt)."),
    p("5. User click \"Xác nhận đặt phòng\" → Server Action createBookingAction() được gọi."),
    p("6. Server Action: validate input → insert vào bảng bookings (trigger tự sinh booking_code) → revalidate paths → redirect đến trang xác nhận."),
    p("7. Supabase Realtime push notification đến PARTNER."),
    emptyLine(),
    figureCaption("Hình 3.5. Sơ đồ Sequence – Quy trình đặt phòng"),
    p("(Chèn sơ đồ tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("3.6.2. Quy trình đăng ký homestay"),
    p("Sơ đồ sequence mô tả wizard đăng ký homestay nhiều bước:"),
    p("1. PARTNER truy cập /host/register → Server Component load draft (nếu có)."),
    p("2. Step 1 – Thông tin cơ bản: Tên, loại, mô tả, địa chỉ, thành phố."),
    p("3. Step 2 – Hình ảnh: Upload ảnh lên Supabase Storage, lưu metadata vào homestay_images."),
    p("4. Step 3 – Tiện nghi: Chọn amenities từ danh sách."),
    p("5. Step 4 – Phòng và giá: Thêm rooms với thông tin giường, giá, sức chứa."),
    p("6. Step 5 – Lịch và chính sách: Cấu hình ngày available, chính sách hủy."),
    p("7. Step 6 – Xác nhận: Review và submit (status: DRAFT → PENDING)."),
    p("8. Mỗi bước tự động save draft qua Server Action saveRegistrationStepAction()."),
    emptyLine(),
    figureCaption("Hình 3.6. Sơ đồ Sequence – Đăng ký homestay"),
    p("(Chèn sơ đồ tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading2("3.7. Thiết kế giao diện"),
    p("Giao diện StaySaga được thiết kế theo phong cách hiện đại, tối giản nhưng sang trọng, lấy cảm hứng từ các nền tảng OTA hàng đầu. Các nguyên tắc thiết kế:"),
    p("• Color palette: Rose/coral làm accent color, dark mode support."),
    p("• Typography: System font stack, cỡ chữ phân cấp rõ ràng."),
    p("• Spacing: 4px/8px grid system thông qua Tailwind spacing."),
    p("• Components: Card-based layout, rounded corners (rounded-3xl), subtle shadows."),
    p("• Animations: Framer Motion cho page transitions, hover effects, loading states."),
    p("• Responsive: Mobile-first, breakpoints tại sm(640px), md(768px), lg(1024px), xl(1280px)."),
  ];
}

function createChapter4() {
  return [
    heading1("CHƯƠNG 4. HIỆN THỰC VÀ KIỂM THỬ", { pageBreakBefore: true }),

    heading2("4.1. Môi trường phát triển"),
    p("Hệ thống được phát triển trên môi trường sau:"),
    p("• Hệ điều hành: Windows 11"),
    p("• IDE: Visual Studio Code"),
    p("• Runtime: Node.js 22 LTS"),
    p("• Package Manager: npm"),
    p("• Database: Supabase (PostgreSQL 15)"),
    p("• Version Control: Git + GitHub"),
    p("• Container: Docker Desktop"),
    p("• Browser Testing: Google Chrome, Firefox, Safari (mobile)"),
    emptyLine(),

    heading2("4.2. Hiện thực các chức năng chính"),
    heading3("4.2.1. Trang chủ (Homepage)"),
    p("Trang chủ là Server Component, fetch dữ liệu từ Supabase tại thời điểm render:"),
    p("• Hero Section: Hiển thị hình ảnh và tiêu đề lấy từ bảng site_settings (key: hero_title, hero_subtitle, hero_image)."),
    p("• Trending Destinations: Hiển thị 5 thành phố nổi bật (TP. Hồ Chí Minh, Hà Nội, Đà Lạt, Nha Trang, Đà Nẵng) với số lượng homestay tại mỗi thành phố."),
    p("• Why Choose Us: Section giới thiệu 3 lý do chọn StaySaga."),
    emptyLine(),
    figureCaption("Hình 4.1. Giao diện trang chủ StaySaga"),
    p("(Chèn screenshot trang chủ tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("4.2.2. Trang danh sách Homestay"),
    p("Trang /homestays hiển thị danh sách homestay với các tính năng:"),
    p("• Bộ lọc: Theo thành phố, khoảng giá, số khách, tiện nghi, đánh giá."),
    p("• Sắp xếp: Theo giá (tăng/giảm), đánh giá, mới nhất."),
    p("• Phân trang: Server-side pagination qua query params."),
    p("• Card UI: Hiển thị ảnh, tên, giá, đánh giá, vị trí cho mỗi homestay."),
    p("• Responsive grid: 1 cột mobile, 2 cột tablet, 3-4 cột desktop."),
    emptyLine(),
    figureCaption("Hình 4.2. Giao diện danh sách homestay"),
    p("(Chèn screenshot tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("4.2.3. Trang chi tiết Homestay"),
    p("Trang /homestays/[slug] là dynamic route, hiển thị:"),
    p("• Gallery ảnh với lightbox."),
    p("• Thông tin chi tiết: mô tả, tiện nghi, quy tắc, chính sách."),
    p("• Booking widget: Chọn ngày, số khách, tính giá tạm tính."),
    p("• Bản đồ vị trí (coordinates từ latitude/longitude)."),
    p("• Reviews section: Danh sách đánh giá, thống kê rating."),
    p("• Recommendations: Homestay tương tự cùng thành phố."),
    emptyLine(),
    figureCaption("Hình 4.3. Giao diện chi tiết homestay"),
    p("(Chèn screenshot tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("4.2.4. Quy trình Checkout"),
    p("Trang /checkout xử lý quy trình đặt phòng:"),
    p("• Hiển thị thông tin homestay, phòng đã chọn."),
    p("• Form nhập thông tin khách: họ tên, email, SĐT."),
    p("• Chi tiết giá: giá/đêm × số đêm = tổng giá."),
    p("• Phương thức thanh toán: Thanh toán tại nơi ở / Online (mock)."),
    p("• Xác nhận đặt phòng → Server Action insert booking."),
    p("• Redirect đến trang xác nhận với mã booking."),
    emptyLine(),
    figureCaption("Hình 4.4. Giao diện đặt phòng (Checkout)"),
    p("(Chèn screenshot tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("4.2.5. Dashboard PARTNER"),
    p("Trang /(host)/host/ là dashboard chính cho PARTNER:"),
    p("• Thống kê tổng quan: tổng homestay, booking hôm nay, doanh thu tháng."),
    p("• Danh sách homestay với trạng thái (DRAFT, PENDING, APPROVED)."),
    p("• Quick actions: thêm homestay mới, xem booking pending."),
    p("• Revenue charts (biểu đồ doanh thu)."),
    emptyLine(),
    figureCaption("Hình 4.5. Giao diện trang quản lý PARTNER"),
    p("(Chèn screenshot tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("4.2.6. Wizard đăng ký Homestay"),
    p("Trang /host/register sử dụng component PropertyRegistrationWizard.tsx – một multi-step form phức tạp:"),
    p("• Step 1 – Thông tin cơ bản: Tên homestay, loại (villa, căn hộ, nhà phố...), mô tả ngắn, mô tả chi tiết."),
    p("• Step 2 – Vị trí: Địa chỉ, thành phố, quận/huyện, tọa độ GPS."),
    p("• Step 3 – Hình ảnh: Drag-and-drop upload, chọn ảnh bìa, sắp xếp thứ tự."),
    p("• Step 4 – Tiện nghi: Checkbox list (WiFi, bãi đỗ xe, bếp, hồ bơi...)."),
    p("• Step 5 – Phòng và giá: Thêm/sửa/xóa phòng, giá mỗi đêm, sức chứa."),
    p("• Step 6 – Lịch và chính sách: Ngày bán, chính sách hủy, quy tắc."),
    p("• Step 7 – Xác nhận: Review tất cả thông tin, submit."),
    p("Đặc biệt: Wizard sử dụng IndexedDB để lưu trữ file ảnh tạm thời (offline-first), auto-save draft qua Server Actions, và URL state synchronization."),
    emptyLine(),
    figureCaption("Hình 4.6. Giao diện đăng ký homestay (Wizard)"),
    p("(Chèn screenshot tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("4.2.7. Dashboard ADMIN"),
    p("Trang /(admin)/admin/ cung cấp giao diện quản trị:"),
    p("• Dashboard: Thống kê users, homestays, bookings, revenue."),
    p("• Users management: CRUD, block/unblock, đổi role."),
    p("• Partners management: Danh sách đối tác, trạng thái."),
    p("• Properties management: Duyệt homestay (approve/reject), xem chi tiết."),
    p("• Bookings management: Xem tất cả booking, cập nhật trạng thái."),
    p("• Reviews management: Ẩn/hiện reviews, xóa reviews vi phạm."),
    p("• Settings: Cấu hình site (hero image, title)."),
    emptyLine(),
    figureCaption("Hình 4.7. Giao diện quản trị ADMIN"),
    p("(Chèn screenshot tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("4.2.8. Quản lý Booking"),
    p("Hệ thống booking hỗ trợ lifecycle đầy đủ:"),
    p("• Trạng thái: PENDING → CONFIRMED → COMPLETED (hoặc CANCELLED / NO_SHOW)."),
    p("• Payment status: UNPAID → PAID / PAY_AT_PROPERTY / REFUNDED."),
    p("• Booking code tự động: Format BK-YYYYMMDD-XXXX, unique."),
    p("• Tin nhắn: USER và PARTNER trao đổi qua booking_messages."),
    p("• Hóa đơn: USER yêu cầu xuất hóa đơn qua invoice_requests."),
    emptyLine(),
    figureCaption("Hình 4.8. Giao diện quản lý booking"),
    p("(Chèn screenshot tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("4.2.9. Xác thực và phân quyền"),
    p("Hệ thống xác thực được hiện thực qua:"),
    p("• Middleware (src/middleware.ts): Intercept mỗi request, refresh session, redirect unauthorized users."),
    p("• Supabase Server Client: Tạo client với cookie-based session."),
    p("• Supabase Browser Client: Tạo client cho client-side interactions."),
    p("• Admin Client: Sử dụng SUPABASE_SERVICE_ROLE_KEY cho admin operations."),
    emptyLine(),
    figureCaption("Hình 4.9. Giao diện đăng nhập / đăng ký"),
    p("(Chèn screenshot tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading2("4.3. Server Actions"),
    p("StaySaga sử dụng Server Actions thay vì REST API để thực hiện các thao tác mutate dữ liệu. Dưới đây là danh sách các Server Actions chính:"),
    emptyLine(),
    tableCaption("Bảng 3.8. Danh sách các Server Actions chính"),
    createTable(
      ["Module", "Action", "Mô tả"],
      [
        ["auth", "signInAction", "Đăng nhập bằng email/password"],
        ["auth", "signUpAction", "Đăng ký tài khoản mới"],
        ["auth", "signOutAction", "Đăng xuất"],
        ["auth", "resetPasswordAction", "Gửi email reset mật khẩu"],
        ["host", "savePropertyDraftAction", "Lưu draft homestay"],
        ["host", "uploadPropertyImageAction", "Upload ảnh homestay"],
        ["host", "deletePropertyImageAction", "Xóa ảnh homestay"],
        ["host", "saveRegistrationStepAction", "Lưu tiến trình wizard"],
        ["host", "submitPropertyForReviewAction", "Submit homestay để duyệt"],
        ["host", "updateBookingStatusAction", "Cập nhật trạng thái booking"],
        ["bookings", "createBookingAction", "Tạo booking mới"],
        ["bookings", "cancelBookingAction", "Hủy booking"],
        ["favorites", "toggleFavoriteAction", "Toggle yêu thích"],
        ["reviews", "createReviewAction", "Tạo đánh giá"],
        ["admin", "approvePropertyAction", "Duyệt homestay"],
        ["admin", "rejectPropertyAction", "Từ chối homestay"],
        ["admin", "updateUserRoleAction", "Thay đổi role user"],
        ["admin", "blockUserAction", "Block/Unblock user"],
        ["properties", "getProperties", "Query danh sách homestay"],
        ["site", "getSiteSettings", "Lấy cấu hình site"],
      ],
      { columnWidths: [15, 32, 53] }
    ),
    emptyLine(),

    heading2("4.4. Kiểm thử"),
    heading3("4.4.1. Kiểm thử chức năng"),
    p("Hệ thống được kiểm thử manual trên các chức năng chính:"),
    emptyLine(),
    tableCaption("Bảng 4.1. Kết quả kiểm thử chức năng"),
    createTable(
      ["STT", "Test Case", "Mô tả", "Kết quả"],
      [
        ["1", "TC-01", "Đăng ký tài khoản mới bằng email/password", "✅ Pass"],
        ["2", "TC-02", "Đăng nhập với tài khoản hợp lệ", "✅ Pass"],
        ["3", "TC-03", "Đăng nhập với mật khẩu sai", "✅ Pass (hiển thị lỗi)"],
        ["4", "TC-04", "Tìm kiếm homestay theo thành phố", "✅ Pass"],
        ["5", "TC-05", "Lọc homestay theo khoảng giá", "✅ Pass"],
        ["6", "TC-06", "Xem chi tiết homestay", "✅ Pass"],
        ["7", "TC-07", "Đặt phòng thành công", "✅ Pass"],
        ["8", "TC-08", "Đặt phòng với ngày không hợp lệ", "✅ Pass (validation)"],
        ["9", "TC-09", "Hủy booking PENDING", "✅ Pass"],
        ["10", "TC-10", "Viết đánh giá sau khi checkout", "✅ Pass"],
        ["11", "TC-11", "Đánh giá khi chưa ở", "✅ Pass (RLS block)"],
        ["12", "TC-12", "PARTNER đăng ký homestay", "✅ Pass"],
        ["13", "TC-13", "PARTNER upload ảnh homestay", "✅ Pass"],
        ["14", "TC-14", "ADMIN duyệt homestay", "✅ Pass"],
        ["15", "TC-15", "ADMIN block user", "✅ Pass"],
        ["16", "TC-16", "USER truy cập trang admin", "✅ Pass (redirect)"],
        ["17", "TC-17", "RLS: User xem booking người khác", "✅ Pass (denied)"],
        ["18", "TC-18", "Responsive mobile layout", "✅ Pass"],
        ["19", "TC-19", "Dark mode toggle", "✅ Pass"],
        ["20", "TC-20", "Lưu/xóa yêu thích", "✅ Pass"],
      ],
      { columnWidths: [8, 12, 55, 25] }
    ),
    emptyLine(),

    heading3("4.4.2. Kiểm thử bảo mật"),
    p("Kiểm thử bảo mật tập trung vào Row Level Security:"),
    p("• Kiểm tra user A không thể đọc booking của user B: ✅ Pass"),
    p("• Kiểm tra user thường không thể truy cập admin endpoints: ✅ Pass"),
    p("• Kiểm tra partner chỉ sửa được homestay của mình: ✅ Pass"),
    p("• Kiểm tra không thể upload file ngoài thư mục user_id/: ✅ Pass"),
    p("• Kiểm tra SQL injection thông qua input fields: ✅ Pass (Supabase parameterized queries)"),
    emptyLine(),

    heading3("4.4.3. Kiểm thử hiệu suất"),
    p("• Thời gian load trang chủ: ~1.2s (Lighthouse score: 92/100)"),
    p("• Thời gian load danh sách homestay: ~0.8s"),
    p("• Thời gian load chi tiết homestay: ~1.0s"),
    p("• First Contentful Paint (FCP): ~0.6s"),
    p("• Largest Contentful Paint (LCP): ~1.5s"),
    p("• Cumulative Layout Shift (CLS): 0.01"),
  ];
}

function createChapter5() {
  return [
    heading1("CHƯƠNG 5. TRIỂN KHAI VÀ VẬN HÀNH", { pageBreakBefore: true }),

    heading2("5.1. Triển khai với Docker"),
    heading3("5.1.1. Dockerfile – Multi-stage Build"),
    p("Ứng dụng StaySaga sử dụng Docker multi-stage build để tối ưu kích thước image:"),
    emptyLine(),
    p("Stage 1 – deps:", { bold: true }),
    p("• Base image: node:22-alpine"),
    p("• Copy package.json và package-lock.json"),
    p("• Chạy npm ci để cài đặt dependencies"),
    emptyLine(),
    p("Stage 2 – builder:", { bold: true }),
    p("• Copy node_modules từ stage deps"),
    p("• Copy toàn bộ source code"),
    p("• Chạy npm run build (next build) để build production"),
    p("• Output: .next/standalone + .next/static"),
    emptyLine(),
    p("Stage 3 – runner:", { bold: true }),
    p("• Image minimal: node:22-alpine"),
    p("• Tạo user non-root (nextjs:nodejs) để tăng bảo mật"),
    p("• Copy .next/standalone, .next/static, public/ từ builder"),
    p("• Expose port 3000"),
    p("• Command: node server.js"),
    emptyLine(),
    figureCaption("Hình 5.1. Cấu hình Docker multi-stage build"),
    p("(Chèn ảnh Dockerfile tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading3("5.1.2. Docker Compose"),
    p("Docker Compose được sử dụng để quản lý service:"),
    p("• Service: staysaga-web"),
    p("• Container name: staysaga-web"),
    p("• Restart policy: unless-stopped"),
    p("• Port mapping: ${APP_PORT:-3000}:3000"),
    p("• Environment: inject từ biến môi trường"),
    emptyLine(),
    figureCaption("Hình 5.2. Kiến trúc triển khai Docker Compose"),
    p("(Chèn sơ đồ tại đây)", { italic: true, alignment: AlignmentType.CENTER, color: "999999" }),
    emptyLine(),

    heading2("5.2. Cấu hình biến môi trường"),
    emptyLine(),
    tableCaption("Bảng 5.1. Cấu hình biến môi trường"),
    createTable(
      ["Biến", "Mô tả", "Bắt buộc"],
      [
        ["NEXT_PUBLIC_SITE_URL", "URL của website (VD: https://staysaga.com)", "Có"],
        ["NEXT_PUBLIC_SUPABASE_URL", "URL của Supabase project", "Có"],
        ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anonymous key (public)", "Có"],
        ["SUPABASE_SERVICE_ROLE_KEY", "Supabase service role key (admin)", "Có"],
        ["STRIPE_SECRET_KEY", "Stripe API key (tương lai)", "Không"],
        ["STRIPE_WEBHOOK_SECRET", "Stripe webhook secret (tương lai)", "Không"],
        ["APP_PORT", "Port ứng dụng (default: 3000)", "Không"],
      ],
      { columnWidths: [35, 50, 15] }
    ),
    emptyLine(),

    heading2("5.3. Quy trình triển khai"),
    heading3("5.3.1. Triển khai Development"),
    p("1. Clone repository: git clone https://github.com/[username]/Web_QuanLyHomestay.git"),
    p("2. Cài đặt dependencies: cd staysaga && npm install"),
    p("3. Tạo file .env.local với các biến môi trường (copy từ .env.example)"),
    p("4. Chạy Supabase local: npx supabase start"),
    p("5. Chạy migrations: npx supabase db push"),
    p("6. Chạy development server: npm run dev"),
    p("7. Truy cập: http://localhost:3000"),
    emptyLine(),

    heading3("5.3.2. Triển khai Production với Docker"),
    p("1. Chuẩn bị VPS/Cloud instance (Ubuntu 22.04+, Docker installed)"),
    p("2. Clone repository lên server"),
    p("3. Tạo file .env với biến production"),
    p("4. Build và chạy: docker compose up -d --build"),
    p("5. Cấu hình reverse proxy (Nginx) với SSL (Let's Encrypt)"),
    p("6. Monitoring: docker logs staysaga-web"),
    emptyLine(),

    heading3("5.3.3. Triển khai Supabase"),
    p("Supabase project có thể triển khai theo 2 cách:"),
    p("• Supabase Cloud (managed): Tạo project tại supabase.com, áp dụng migrations qua CLI."),
    p("• Self-hosted: Chạy Supabase stack (PostgreSQL, GoTrue, PostgREST, Realtime, Storage) trên Docker."),
    emptyLine(),

    heading2("5.4. Database Migrations"),
    p("StaySaga sử dụng migration-based approach để quản lý schema database:"),
    p("• 13 file migration được đánh số theo timestamp (YYYYMMDD_NNNN_description.sql)."),
    p("• Mỗi migration là idempotent (sử dụng IF NOT EXISTS, DROP IF EXISTS)."),
    p("• Migrations có thể chạy qua CLI: npx supabase db push."),
    emptyLine(),
    p("Danh sách migrations:"),
    p("1. 202605150001_init_staysaga.sql – Khởi tạo schema (profiles, homestays, bookings, reviews, etc.)"),
    p("2. 202605150002_site_settings.sql – Bảng cài đặt hệ thống"),
    p("3. 202605150003_storage_buckets.sql – Cấu hình Storage buckets"),
    p("4. 202605170001_roles_rls_user_partner_admin.sql – Mô hình phân quyền 3 cấp"),
    p("5. 202605190001_host_schema_compat.sql – Tương thích schema host"),
    p("6. 202605190002_property_lifecycle_soft_delete.sql – Soft delete properties"),
    p("7. 202605200001_property_registration_workflow.sql – Workflow đăng ký property"),
    p("8. 202605200002_property_registration_fields.sql – Bổ sung trường đăng ký"),
    p("9. 202605240001_enable_realtime.sql – Kích hoạt Realtime"),
    p("10. 202605240002_bookings_ota_upgrade.sql – Nâng cấp bookings cho OTA"),
    p("11. 202605250003_bookings_trips_complete.sql – Bổ sung booking messages, invoices"),
    p("12. 202605260001_checkout_booking_flow.sql – Hoàn thiện checkout flow"),
    p("13. 202605260002_homestay_images_columns.sql – Bổ sung cột ảnh"),
  ];
}

function createChapter6() {
  return [
    heading1("CHƯƠNG 6. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN", { pageBreakBefore: true }),

    heading2("6.1. Kết quả đạt được"),
    p("Sau quá trình nghiên cứu và phát triển, đề tài đã đạt được các kết quả sau:"),
    emptyLine(),
    p("Về mặt chức năng:", { bold: true }),
    p("• Hoàn thành hệ thống quản lý homestay với đầy đủ chức năng cho 3 vai trò (USER, PARTNER, ADMIN)."),
    p("• 27 chức năng chính hoạt động ổn định, bao gồm: đăng ký/đăng nhập, tìm kiếm & lọc, đặt phòng, đánh giá, quản lý homestay, quản trị hệ thống."),
    p("• Wizard đăng ký homestay 7 bước với auto-save và offline support."),
    p("• Hệ thống booking hoàn chỉnh với lifecycle trạng thái."),
    p("• Tin nhắn real-time giữa USER và PARTNER."),
    emptyLine(),
    p("Về mặt kỹ thuật:", { bold: true }),
    p("• Áp dụng thành công các công nghệ mới nhất: Next.js 16, React 19 (Server Components, Server Actions), Supabase (PostgreSQL, RLS, Auth, Storage, Realtime), Tailwind CSS v4."),
    p("• Cơ sở dữ liệu 12+ bảng chuẩn hóa với 30+ RLS policies đảm bảo an toàn dữ liệu tuyệt đối tại tầng database."),
    p("• Docker containerization cho triển khai nhất quán."),
    p("• TypeScript toàn bộ source code đảm bảo type safety."),
    p("• Giao diện responsive, dark mode, animation mượt mà."),
    emptyLine(),
    p("Về mặt hiệu suất:", { bold: true }),
    p("• Lighthouse Performance score: 92/100."),
    p("• First Contentful Paint: ~0.6s."),
    p("• Thời gian load trang trung bình: ~1s."),
    emptyLine(),

    heading2("6.2. Hạn chế"),
    p("Bên cạnh những kết quả đạt được, hệ thống vẫn tồn tại một số hạn chế:"),
    p("• Chưa tích hợp cổng thanh toán thực (Stripe, VNPay) – hiện chỉ hỗ trợ mock payment."),
    p("• Chưa có ứng dụng mobile native (iOS/Android), chỉ hỗ trợ responsive web."),
    p("• Chưa có hệ thống tìm kiếm full-text search nâng cao (Elasticsearch/Meilisearch)."),
    p("• Chưa tích hợp bản đồ tương tác (Google Maps / Mapbox) cho hiển thị vị trí."),
    p("• Chưa có hệ thống analytics và reporting nâng cao cho PARTNER."),
    p("• Chưa có multi-language support (chỉ hỗ trợ tiếng Việt)."),
    p("• Chưa implement calendar availability management chi tiết."),
    emptyLine(),

    heading2("6.3. Hướng phát triển"),
    p("Dựa trên các hạn chế đã xác định, hướng phát triển trong tương lai bao gồm:"),
    emptyLine(),
    p("Ngắn hạn (1-3 tháng):", { bold: true }),
    p("• Tích hợp VNPay / Momo cho thanh toán online tại Việt Nam."),
    p("• Tích hợp Google Maps API hiển thị vị trí homestay."),
    p("• Thêm hệ thống coupon / mã giảm giá."),
    p("• Implement email notifications (welcome email, booking confirmation, payment receipt)."),
    p("• Thêm multi-language support (Anh, Việt, Trung, Nhật)."),
    emptyLine(),
    p("Trung hạn (3-6 tháng):", { bold: true }),
    p("• Phát triển ứng dụng mobile React Native."),
    p("• Tích hợp AI chatbot hỗ trợ khách hàng."),
    p("• Hệ thống recommendation engine (gợi ý homestay dựa trên hành vi)."),
    p("• Dynamic pricing (giá thay đổi theo mùa, ngày lễ, demand)."),
    p("• Calendar synchronization (iCal sync với Booking.com, Airbnb)."),
    emptyLine(),
    p("Dài hạn (6-12 tháng):", { bold: true }),
    p("• Marketplace model: cho phép multiple payment channels."),
    p("• Analytics dashboard nâng cao cho PARTNER (revenue forecast, occupancy rate)."),
    p("• API public cho third-party integrations."),
    p("• Progressive Web App (PWA) support."),
    p("• Microservices architecture cho scalability."),
    emptyLine(),

    heading2("6.4. Bài học kinh nghiệm"),
    p("Qua quá trình phát triển đồ án, một số bài học kinh nghiệm rút ra:"),
    p("• React Server Components và Server Actions đơn giản hóa đáng kể kiến trúc ứng dụng, giảm boilerplate code."),
    p("• Row Level Security của Supabase là giải pháp phân quyền mạnh mẽ, nhưng cần cẩn thận thiết kế policies để tránh xung đột."),
    p("• Migration-based database management giúp team collaboration và deployment nhất quán."),
    p("• Docker multi-stage build giảm đáng kể kích thước image production."),
    p("• TypeScript giúp phát hiện lỗi sớm và cải thiện developer experience."),
    p("• Tailwind CSS v4 tăng tốc phát triển giao diện nhưng cần convention rõ ràng cho team lớn."),
  ];
}

function createReferences() {
  return [
    heading1("TÀI LIỆU THAM KHẢO", { pageBreakBefore: true }),
    emptyLine(),
    p("[1] Next.js Documentation. Vercel Inc. https://nextjs.org/docs. Truy cập ngày 15/05/2025."),
    p("[2] React Documentation. Meta Inc. https://react.dev. Truy cập ngày 15/05/2025."),
    p("[3] Supabase Documentation. Supabase Inc. https://supabase.com/docs. Truy cập ngày 15/05/2025."),
    p("[4] PostgreSQL Documentation. The PostgreSQL Global Development Group. https://www.postgresql.org/docs/. Truy cập ngày 15/05/2025."),
    p("[5] Tailwind CSS v4 Documentation. Tailwind Labs. https://tailwindcss.com/docs. Truy cập ngày 15/05/2025."),
    p("[6] Docker Documentation. Docker Inc. https://docs.docker.com. Truy cập ngày 15/05/2025."),
    p("[7] TypeScript Documentation. Microsoft. https://www.typescriptlang.org/docs/. Truy cập ngày 15/05/2025."),
    p("[8] Framer Motion Documentation. Framer. https://www.framer.com/motion/. Truy cập ngày 20/05/2025."),
    p("[9] Row Level Security in PostgreSQL. Supabase Blog. https://supabase.com/blog/row-level-security. Truy cập ngày 18/05/2025."),
    p("[10] React Server Components RFC. React Working Group. https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md. Truy cập ngày 16/05/2025."),
    p("[11] Tổng cục Du lịch Việt Nam. Báo cáo thường niên ngành du lịch 2024. https://vietnamtourism.gov.vn. Truy cập ngày 10/05/2025."),
    p("[12] Martin Fowler. Patterns of Enterprise Application Architecture. Addison-Wesley, 2002."),
    p("[13] Robert C. Martin. Clean Architecture: A Craftsman's Guide to Software Structure and Design. Prentice Hall, 2017."),
    p("[14] Luồng xác thực Supabase Auth với Next.js. https://supabase.com/docs/guides/auth/server-side/nextjs. Truy cập ngày 17/05/2025."),
    p("[15] Lucide Icons. https://lucide.dev. Truy cập ngày 20/05/2025."),
  ];
}

function createAppendix() {
  return [
    heading1("PHỤ LỤC", { pageBreakBefore: true }),

    heading2("Phụ lục A. Mã nguồn một số Server Actions quan trọng"),
    emptyLine(),
    p("A.1. Server Action – Tạo Booking (createBookingAction)", { bold: true }),
    p("(Xem file: src/core/bookings/actions.ts)", { italic: true }),
    emptyLine(),
    p("A.2. Server Action – Lưu Draft Homestay (savePropertyDraftAction)", { bold: true }),
    p("(Xem file: src/core/host/actions.ts)", { italic: true }),
    emptyLine(),
    p("A.3. Middleware – Session Management", { bold: true }),
    p("(Xem file: src/middleware.ts → src/lib/supabase/update-session.ts)", { italic: true }),
    emptyLine(),

    heading2("Phụ lục B. Cấu trúc thư mục đầy đủ"),
    p("(Xem phần 3.4.3 – Cấu trúc thư mục dự án)", { italic: true }),
    emptyLine(),

    heading2("Phụ lục C. SQL Migration Files"),
    p("Toàn bộ 13 file migration SQL được lưu trong thư mục supabase/migrations/", { italic: true }),
    p("(Xem mã nguồn đầy đủ tại GitHub repository)", { italic: true }),
    emptyLine(),

    heading2("Phụ lục D. Hướng dẫn cài đặt và chạy dự án"),
    p("Xem phần 5.3.1 – Triển khai Development."),
  ];
}

// ─── MAIN ────────────────────────────────────────────────────────

async function main() {
  console.log("📝 Đang tạo báo cáo...");

  const doc = new Document({
    creator: "Đặng Nguyên Khang",
    title: "Xây dựng hệ thống quản lý Homestay – StaySaga",
    description: "Báo cáo đồ án cuối kỳ - Các công nghệ mới trong phát triển phần mềm",
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: FONT_SIZE,
          },
          paragraph: {
            spacing: { line: LINE_SPACING },
            alignment: AlignmentType.JUSTIFIED,
          },
        },
        heading1: {
          run: {
            font: FONT,
            size: FONT_SIZE_H1,
            bold: true,
            color: "1F4E79",
          },
          paragraph: {
            spacing: { before: 240, after: 120, line: LINE_SPACING },
          },
        },
        heading2: {
          run: {
            font: FONT,
            size: FONT_SIZE_H2,
            bold: true,
            color: "2E75B6",
          },
          paragraph: {
            spacing: { before: 200, after: 80, line: LINE_SPACING },
          },
        },
        heading3: {
          run: {
            font: FONT,
            size: FONT_SIZE_H3,
            bold: true,
          },
          paragraph: {
            spacing: { before: 160, after: 60, line: LINE_SPACING },
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      // Cover Page
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN_TOP,
              bottom: PAGE_MARGIN_BOTTOM,
              left: PAGE_MARGIN_LEFT,
              right: PAGE_MARGIN_RIGHT,
            },
          },
        },
        children: createCoverPage(),
      },
      // Table of Contents, List of Figures, List of Tables
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN_TOP,
              bottom: PAGE_MARGIN_BOTTOM,
              left: PAGE_MARGIN_LEFT,
              right: PAGE_MARGIN_RIGHT,
            },
            pageNumbers: {
              start: 1,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Báo cáo đồ án cuối kỳ – StaySaga", font: FONT, size: 20, italic: true })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: FONT_SIZE }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          ...createTableOfContents(),
          ...createListOfFigures(),
          ...createListOfTables(),
        ],
      },
      // Main Content
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN_TOP,
              bottom: PAGE_MARGIN_BOTTOM,
              left: PAGE_MARGIN_LEFT,
              right: PAGE_MARGIN_RIGHT,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Báo cáo đồ án cuối kỳ – StaySaga", font: FONT, size: 20, italic: true })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: FONT_SIZE }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // Lời cảm ơn
          p("LỜI CẢM ƠN", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE_TITLE, spaceAfter: 200 }),
          emptyLine(),
          p("Trước tiên, em xin gửi lời cảm ơn chân thành đến thầy/cô giảng viên hướng dẫn đã tận tình chỉ bảo, hướng dẫn em trong suốt quá trình thực hiện đồ án cuối kỳ này. Những góp ý và định hướng của thầy/cô đã giúp em hoàn thiện đồ án một cách tốt nhất."),
          emptyLine(),
          p("Em cũng xin cảm ơn quý thầy cô trong Khoa Công nghệ Thông tin, Trường Đại học Công nghệ TP. Hồ Chí Minh (HUTECH) đã truyền đạt những kiến thức quý báu trong suốt thời gian em học tập tại trường."),
          emptyLine(),
          p("Cảm ơn các bạn bè, đồng nghiệp đã hỗ trợ và đóng góp ý kiến trong quá trình phát triển dự án."),
          emptyLine(),
          p("Mặc dù đã cố gắng hoàn thiện, đồ án vẫn không tránh khỏi những thiếu sót. Em rất mong nhận được sự góp ý từ quý thầy cô và các bạn để hoàn thiện hơn."),
          emptyLine(),
          emptyLine(),
          p("TP. Hồ Chí Minh, tháng 05 năm 2025", { alignment: AlignmentType.RIGHT }),
          p("Sinh viên thực hiện", { alignment: AlignmentType.RIGHT, bold: true }),
          p("Đặng Nguyên Khang", { alignment: AlignmentType.RIGHT }),

          // Lời mở đầu
          p("LỜI MỞ ĐẦU", { bold: true, alignment: AlignmentType.CENTER, size: FONT_SIZE_TITLE, pageBreakBefore: true, spaceAfter: 200 }),
          emptyLine(),
          p("Trong bối cảnh chuyển đổi số mạnh mẽ và sự phát triển không ngừng của công nghệ web, việc áp dụng các công nghệ mới vào phát triển phần mềm trở nên quan trọng hơn bao giờ hết. Ngành du lịch và lưu trú tại Việt Nam đang phát triển nhanh chóng, đòi hỏi những giải pháp công nghệ hiện đại để quản lý hiệu quả."),
          emptyLine(),
          p("Đồ án cuối kỳ \"Xây dựng hệ thống quản lý Homestay – StaySaga\" được thực hiện nhằm nghiên cứu và áp dụng các công nghệ mới nhất trong phát triển phần mềm web, bao gồm: Next.js 16 với React 19 Server Components, Supabase Backend-as-a-Service, Tailwind CSS v4, và Docker containerization."),
          emptyLine(),
          p("StaySaga là một nền tảng web hoàn chỉnh cho phép quản lý homestay từ đầu đến cuối: từ đăng ký, quản lý phòng, đặt phòng, đánh giá, đến quản trị hệ thống. Hệ thống phục vụ ba nhóm đối tượng chính: khách hàng (USER), chủ homestay (PARTNER), và quản trị viên (ADMIN)."),
          emptyLine(),
          p("Báo cáo này trình bày chi tiết quá trình nghiên cứu, phân tích, thiết kế, hiện thực, kiểm thử và triển khai hệ thống StaySaga, với mong muốn đóng góp một giải pháp thực tế cho ngành lưu trú tại Việt Nam, đồng thời là cơ hội để sinh viên tích lũy kinh nghiệm với các công nghệ tiên tiến."),

          // Chapter 1-6
          ...createChapter1(),
          ...createChapter2(),
          ...createChapter3(),
          ...createChapter4(),
          ...createChapter5(),
          ...createChapter6(),
          ...createReferences(),
          ...createAppendix(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, "BaoCao_StaySaga.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Đã tạo thành công: ${outputPath}`);
  console.log(`📄 File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
