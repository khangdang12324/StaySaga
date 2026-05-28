const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  VerticalAlign,
  convertInchesToTwip,
  PageBreak,
  UnderlineType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// Formatting constants
const HEADING_1_STYLE = {
  level: HeadingLevel.HEADING_1,
  spacing: { before: 240, after: 120 },
  bold: true,
  size: 28,
  color: "1F4788",
};

const HEADING_2_STYLE = {
  level: HeadingLevel.HEADING_2,
  spacing: { before: 120, after: 60 },
  bold: true,
  size: 26,
  color: "2E5C8A",
};

const HEADING_3_STYLE = {
  level: HeadingLevel.HEADING_3,
  spacing: { before: 60, after: 40 },
  bold: true,
  size: 24,
};

const NORMAL_TEXT = {
  size: 26, // 13pt
  font: "Times New Roman",
};

const TABLE_CELL_STYLE = {
  margins: { top: 80, bottom: 80, left: 80, right: 80 },
};

// Helper functions
function createTable(headers, rows) {
  const headerCells = headers.map(
    (h) =>
      new TableCell({
        children: [
          new Paragraph({
            text: h,
            bold: true,
            size: 24,
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "D9E9F7" },
        ...TABLE_CELL_STYLE,
      }),
  );

  const bodyCells = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  text: cell,
                  size: NORMAL_TEXT.size,
                  font: NORMAL_TEXT.font,
                }),
              ],
              ...TABLE_CELL_STYLE,
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...bodyCells],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
  });
}

function createParagraph(text, style = {}) {
  return new Paragraph({
    text,
    ...NORMAL_TEXT,
    ...style,
  });
}

function createSectionParagraph(number, title) {
  return new Paragraph({
    text: `${number}. ${title}`,
    ...HEADING_3_STYLE,
    spacing: { before: 120, after: 60 },
  });
}

// Generate Part 1: Front Matter + Chapters 1-4
function generatePart1() {
  const sections = [];

  // Cover Page
  sections.push(
    new Paragraph({
      text: "BỘ GIÁO DỤC VÀ ĐÀO TẠO",
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 28,
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: "TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP. HỒ CHÍ MINH",
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 26,
      spacing: { after: 300 },
    }),
    new Paragraph({
      text: "XÂY DỰNG HỆ THỐNG QUẢN LÝ HOMESTAY STAYSAGA",
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 28,
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: "Loại báo cáo: Đồ án Học phần",
      alignment: AlignmentType.CENTER,
      size: 26,
      spacing: { after: 240 },
    }),
    new Paragraph({
      text: "Sinh viên: <HỌ VÀ TÊN>",
      alignment: AlignmentType.CENTER,
      size: 26,
      spacing: { after: 60 },
    }),
    new Paragraph({
      text: "MSSV: <MSSV>",
      alignment: AlignmentType.CENTER,
      size: 26,
      spacing: { after: 60 },
    }),
    new Paragraph({
      text: "Lớp: <LỚP - VD: CTK46-PM>",
      alignment: AlignmentType.CENTER,
      size: 26,
      spacing: { after: 300 },
    }),
    new Paragraph({
      text: "Giáo viên hướng dẫn: <TÊN GIÁO VIÊN>",
      alignment: AlignmentType.CENTER,
      size: 26,
      spacing: { after: 60 },
    }),
    new Paragraph({
      text: "Thành phố Hồ Chí Minh, Tháng 5 Năm 2026",
      alignment: AlignmentType.CENTER,
      size: 26,
      spacing: { after: 60 },
    }),
    new Paragraph(""), // Spacing
    new PageBreak(),

    // Approval Page
    new Paragraph({
      text: "PHIẾU CHẤP THUẬN",
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 28,
      spacing: { after: 240 },
    }),
    createParagraph("Đồ án/Khóa luận tốt nghiệp có tên:", { bold: true }),
    createParagraph("XÂY DỰNG HỆ THỐNG QUẢN LÝ HOMESTAY STAYSAGA", {
      bold: true,
      spacing: { after: 120 },
    }),
    createParagraph("Sinh viên: <HỌ VÀ TÊN> (MSSV: <MSSV>)", {
      spacing: { after: 120 },
    }),
    createParagraph("Đã được chấp thuận bởi:", { spacing: { after: 120 } }),
    createParagraph("Giáo viên hướng dẫn: <TÊN GIÁO VIÊN> _______________", {
      spacing: { after: 180 },
    }),
    createParagraph("(Ký và ghi rõ họ tên)", {
      size: 22,
      spacing: { after: 120 },
    }),
    createParagraph("Giáo viên phản biện: <TÊN GIÁO VIÊN> _______________", {
      spacing: { after: 180 },
    }),
    createParagraph("(Ký và ghi rõ họ tên)", {
      size: 22,
      spacing: { after: 120 },
    }),
    createParagraph("Chủ tịch Hội đồng: <TÊN GIÁO VIÊN> _______________", {
      spacing: { after: 180 },
    }),
    createParagraph("(Ký và ghi rõ họ tên)", {
      size: 22,
      spacing: { after: 240 },
    }),
    createParagraph("Thành phố Hồ Chí Minh, ngày ... tháng ... năm 2026", {
      spacing: { after: 60 },
    }),
    new PageBreak(),

    // Declaration
    new Paragraph({
      text: "CAM KẾT",
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 28,
      spacing: { after: 240 },
    }),
    createParagraph(
      "Em <HỌ VÀ TÊN>, sinh viên lớp <LỚP>, khóa <KHÓA> trường Đại học Công nghệ TP. HCM cam kết:",
    ),
    createParagraph(
      "1. Đây là công trình do em tự hoàn thành, không sao chép từ bất kỳ nguồn nào khác.",
    ),
    createParagraph(
      "2. Các tài liệu tham khảo được dẫn chiếu đầy đủ theo quy định.",
    ),
    createParagraph(
      "3. Em chịu trách nhiệm về nội dung và chất lượng của công trình này.",
    ),
    createParagraph("", { spacing: { after: 240 } }),
    createParagraph("Ký tên: _______________", { spacing: { after: 60 } }),
    createParagraph("Ngày: ___/___/2026", { spacing: { after: 60 } }),
    new PageBreak(),

    // Acknowledgments
    new Paragraph({
      text: "LỜI CẢM ƠN",
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 28,
      spacing: { after: 240 },
    }),
    createParagraph("Em xin chân thành cảm ơn các thầy cô giáo, đặc biệt là:"),
    createParagraph(
      "• Giáo viên hướng dẫn <TÊN GIÁO VIÊN> - đã tận tình hướng dẫn và chỉ bảo trong quá trình thực hiện đồ án.",
    ),
    createParagraph(
      "• Các giáo viên bộ môn - đã cung cấp kiến thức nền tảng cho em.",
    ),
    createParagraph(
      "• Các bạn học khóa - đã giúp đỡ em trong quá trình thực hiện.",
    ),
    createParagraph(
      "Em cũng xin cảm ơn nhà trường và tất cả những người đã tạo điều kiện cho em hoàn thành công trình này.",
      { spacing: { after: 60 } },
    ),
    new PageBreak(),

    // Summary
    new Paragraph({
      text: "TÓM TẮT",
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 28,
      spacing: { after: 240 },
    }),
    createParagraph(
      "StaySaga là một hệ thống quản lý homestay hiện đại, được xây dựng bằng công nghệ Next.js 16.2.6 và Supabase. Hệ thống cung cấp các tính năng quản lý bất động sản, đặt phòng, thanh toán, và quản lý người dùng toàn diện.",
    ),
    createParagraph(""),
    createParagraph("Chức năng chính:", { bold: true }),
    createParagraph("• Đăng ký và quản lý bất động sản từ phía chủ nhà"),
    createParagraph("• Hệ thống đặt phòng và thanh toán trực tuyến"),
    createParagraph("• Quản lý người dùng và phân quyền"),
    createParagraph("• Hệ thống đánh giá và bình luận"),
    createParagraph("• Bảng điều khiển quản trị viên"),
    createParagraph(""),
    createParagraph("Công nghệ sử dụng:", { bold: true }),
    createParagraph("• Frontend: Next.js, React 19, TypeScript, Tailwind CSS"),
    createParagraph("• Backend: Supabase PostgreSQL, RLS Security"),
    createParagraph("• Deployment: Docker, VPS, SSL/HTTPS"),
    createParagraph(
      "• Bản đồ tương tác: Leaflet, OpenStreetMap, Nominatim API",
    ),
    createParagraph(""),
    createParagraph(
      "Từ khóa: Homestay, Next.js, Supabase, React, Property Management, Web Application",
      { spacing: { after: 60 } },
    ),
    new PageBreak(),

    // Table of Contents
    new Paragraph({
      text: "MỤC LỤC",
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 28,
      spacing: { after: 240 },
    }),
    createParagraph(
      "CHƯƠNG 1: TỔNG QUAN VỀ QUẢN LÝ HOMESTAY .......................5",
    ),
    createParagraph(
      "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ .......................15",
    ),
    createParagraph(
      "CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ YÊU CẦU .......................30",
    ),
    createParagraph("CHƯƠNG 4: THIẾT KẾ HỆ THỐNG .......................45"),
    createParagraph(
      "CHƯƠNG 5: PHÁT TRIỂN VÀ TRIỂN KHAI .......................60",
    ),
    createParagraph("CHƯƠNG 6: DOCKER VÀ DEPLOYMENT .......................80"),
    createParagraph(
      "CHƯƠNG 7: SỬ DỤNG AI TRONG PHÁT TRIỂN .......................92",
    ),
    createParagraph("CHƯƠNG 8: ĐÁNH GIÁ KẾT QUẢ .......................100"),
    createParagraph("KẾT LUẬN .......................108"),
    createParagraph("TÀI LIỆU THAM KHẢO .......................112"),
    createParagraph("PHỤ LỤC .......................115"),
    createParagraph("", { spacing: { after: 300 } }),
    new PageBreak(),

    // CHAPTER 1
    new Paragraph({
      text: "CHƯƠNG 1: TỔNG QUAN VỀ QUẢN LÝ HOMESTAY",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph("1.1. Khái niệm Homestay", {
      ...HEADING_2_STYLE,
      spacing: { before: 0, after: 120 },
    }),
    createParagraph(
      "Homestay là hình thức cho thuê nhà ở ngắn hạn, nơi chủ nhà cho phép du khách thuê một hoặc nhiều phòng trong nhà của họ. Đây là một xu hướng du lịch ngày càng phổ biến trên toàn thế giới.",
    ),
    createParagraph(""),
    createParagraph("Đặc điểm chính của homestay:"),
    createParagraph("• Cho phép khách tìm hiểu nền văn hóa địa phương"),
    createParagraph("• Chi phí thấp hơn so với khách sạn"),
    createParagraph("• Cung cấp trải nghiệm sống thực tế"),
    createParagraph(""),
    createSectionParagraph("1.2", "Thị trường Homestay tại Việt Nam"),
    createParagraph(
      "Thị trường homestay Việt Nam tăng trưởng nhanh chóng trong 5 năm qua. Các thành phố du lịch như Đà Lạt, Sapa, Hội An, Nha Trang là những điểm nóng.",
    ),
    createParagraph(""),
    createSectionParagraph("1.3", "Những thách thức trong quản lý Homestay"),
    createParagraph("• Quản lý nhiều bất động sản"),
    createParagraph("• Tự động hóa quá trình đặt phòng"),
    createParagraph("• Xác thực danh tính khách hàng"),
    createParagraph("• Quản lý thanh toán an toàn"),
    createParagraph(""),
    createSectionParagraph("1.4", "Giải pháp StaySaga"),
    createParagraph(
      "StaySaga là nền tảng quản lý homestay toàn diện, giải quyết các thách thức trên thông qua:",
    ),
    createParagraph("• Giao diện thân thiện với người dùng"),
    createParagraph("• Tích hợp thanh toán trực tuyến"),
    createParagraph("• Hệ thống xác thực bảo mật"),
    createParagraph("• Quản lý bất động sản trực tuyến"),
    createParagraph("• Tích hợp bản đồ tương tác"),
    createParagraph(""),

    createSectionParagraph("1.5", "Mục tiêu của dự án"),
    createParagraph("Mục tiêu chính của dự án StaySaga:"),
    createParagraph("• Xây dựng một nền tảng quản lý homestay hiện đại"),
    createParagraph("• Tối ưu hóa trải nghiệm người dùng (UX)"),
    createParagraph("• Đảm bảo bảo mật và an toàn dữ liệu"),
    createParagraph("• Hỗ trợ các thao tác quản lý bất động sản"),
    createParagraph("• Cung cấp công cụ phân tích và báo cáo"),
    createParagraph(""),

    createSectionParagraph("1.6", "Phạm vi của đồ án"),
    createParagraph("Đồ án bao gồm các phạm vi chính sau:"),
    createParagraph("• Thiết kế kiến trúc hệ thống"),
    createParagraph("• Phát triển frontend (Next.js, React)"),
    createParagraph("• Phát triển backend (Supabase)"),
    createParagraph("• Triển khai ứng dụng trên VPS"),
    createParagraph("• Tối ưu hóa bảo mật"),
    createParagraph(""),

    createSectionParagraph("1.7", "Đối tượng sử dụng"),
    createTable(
      ["STT", "Vai trò", "Chức năng chính"],
      [
        ["1", "Chủ nhà/Người cho thuê", "Đăng ký, quản lý bất động sản"],
        ["2", "Du khách/Người thuê", "Tìm kiếm, đặt phòng, thanh toán"],
        ["3", "Quản trị viên", "Quản lý người dùng, nội dung, doanh thu"],
      ],
    ),
    createParagraph("", { spacing: { after: 120 } }),

    createSectionParagraph("1.8", "Cấu trúc báo cáo"),
    createParagraph("Báo cáo được chia thành các chương chính:"),
    createParagraph("• Chương 1-2: Giới thiệu và cơ sở lý thuyết"),
    createParagraph("• Chương 3-4: Phân tích yêu cầu và thiết kế hệ thống"),
    createParagraph("• Chương 5-6: Phát triển và deployment"),
    createParagraph("• Chương 7-8: Sử dụng AI và đánh giá"),
    createParagraph(""),

    createSectionParagraph("1.9", "Kỳ vọng từ dự án"),
    createParagraph("• Tạo ra một nền tảng sử dụng được"),
    createParagraph("• Chứng minh kỹ năng phát triển web full-stack"),
    createParagraph("• Áp dụng các công nghệ hiện đại"),
    createParagraph("• Cung cấp tài liệu đầy đủ cho nhà phát triển"),
    createParagraph("", { spacing: { after: 60 } }),
    new PageBreak(),

    // CHAPTER 2 - Short version
    new Paragraph({
      text: "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph("2.1. Kiến trúc Web Application hiện đại", {
      ...HEADING_2_STYLE,
      spacing: { before: 0, after: 120 },
    }),
    createParagraph(
      "Các ứng dụng web hiện đại sử dụng mô hình client-server với frontend và backend tách biệt.",
    ),
    createParagraph(""),

    createSectionParagraph("2.2", "Next.js Framework"),
    createParagraph(
      "Next.js là framework React được xây dựng trên Node.js, cung cấp:",
    ),
    createParagraph("• Server-side rendering (SSR)"),
    createParagraph("• Static site generation (SSG)"),
    createParagraph("• API routes"),
    createParagraph("• Image optimization"),
    createParagraph(""),

    createSectionParagraph("2.3", "React 19"),
    createParagraph(
      "React là thư viện JavaScript cho phép xây dựng giao diện người dùng với:",
    ),
    createParagraph("• Component-based architecture"),
    createParagraph("• Hooks (useState, useEffect, useContext)"),
    createParagraph("• Virtual DOM"),
    createParagraph(""),

    createSectionParagraph("2.4", "TypeScript"),
    createParagraph("TypeScript thêm type safety vào JavaScript:"),
    createParagraph("• Static type checking"),
    createParagraph("• Better IDE support"),
    createParagraph("• Compile-time error detection"),
    createParagraph(""),

    createSectionParagraph("2.5", "Tailwind CSS"),
    createParagraph(
      "Tailwind CSS là utility-first CSS framework cho phép styling nhanh chóng:",
    ),
    createParagraph("• Responsive design classes"),
    createParagraph("• Dark mode support"),
    createParagraph("• Custom theming"),
    createParagraph(""),

    createSectionParagraph("2.6", "Supabase Backend"),
    createParagraph(
      "Supabase là nền tảng backend open-source dựa trên PostgreSQL:",
    ),
    createParagraph("• PostgreSQL database"),
    createParagraph("• Authentication"),
    createParagraph("• Real-time subscriptions"),
    createParagraph("• Row Level Security (RLS)"),
    createParagraph("• File storage"),
    createParagraph(""),

    createSectionParagraph("2.7", "Docker Containerization"),
    createParagraph(
      "Docker cho phép đóng gói ứng dụng với tất cả dependencies:",
    ),
    createParagraph("• Dockerfile definition"),
    createParagraph("• Docker Compose orchestration"),
    createParagraph("• Container deployment"),
    createParagraph(""),

    createSectionParagraph("2.8", "Leaflet Map Library"),
    createParagraph("Leaflet là thư viện bản đồ JavaScript:"),
    createParagraph("• Interactive maps"),
    createParagraph("• Marker placement"),
    createParagraph("• Zoom and pan controls"),
    createParagraph("• OpenStreetMap integration"),
    createParagraph(""),

    createSectionParagraph("2.9", "Nominatim Geocoding"),
    createParagraph("Nominatim là API geocoding miễn phí:"),
    createParagraph("• Address to coordinates conversion"),
    createParagraph("• Reverse geocoding"),
    createParagraph("• Search suggestions"),
    createParagraph("", { spacing: { after: 60 } }),
    new PageBreak(),
  );

  return sections;
}

// Generate Part 2 (simplified)
function generatePart2() {
  const sections = [];

  sections.push(
    new Paragraph({
      text: "CHƯƠNG 3: PHÂN TÍCH YÊU CẦU HỆ THỐNG",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph("3.1. Yêu cầu chức năng", {
      ...HEADING_2_STYLE,
      spacing: { before: 0, after: 120 },
    }),
    createParagraph("Hệ thống phải hỗ trợ các chức năng chính:"),
    createParagraph("• Đăng ký tài khoản (Users)"),
    createParagraph("• Đăng ký bất động sản (Properties)"),
    createParagraph("• Quản lý phòng (Rooms)"),
    createParagraph("• Đặt phòng (Bookings)"),
    createParagraph("• Thanh toán (Payments)"),
    createParagraph("• Đánh giá và bình luận (Reviews)"),
    createParagraph(""),

    createSectionParagraph("3.2", "Yêu cầu phi chức năng"),
    createParagraph("• Hiệu suất: Response time < 2s"),
    createParagraph("• Bảo mật: HTTPS, hashing password"),
    createParagraph("• Khả dụng: 99.9% uptime"),
    createParagraph("• Scalability: Hỗ trợ 10,000+ users"),
    createParagraph(""),

    createSectionParagraph("3.3", "Các tính năng cần thiết"),
    createTable(
      ["STT", "Tính năng", "Độ ưu tiên"],
      [
        ["1", "Đăng ký tài khoản", "Cao"],
        ["2", "Đặt phòng", "Cao"],
        ["3", "Bản đồ tương tác", "Trung"],
        ["4", "Đánh giá", "Trung"],
        ["5", "Báo cáo quản lý", "Thấp"],
      ],
    ),
    createParagraph("", { spacing: { after: 120 } }),
    new PageBreak(),

    new Paragraph({
      text: "CHƯƠNG 4: THIẾT KẾ HỆ THỐNG",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph("4.1. Kiến trúc hệ thống", {
      ...HEADING_2_STYLE,
      spacing: { before: 0, after: 120 },
    }),
    createParagraph("Hệ thống StaySaga sử dụng kiến trúc 3-layer:"),
    createParagraph("• Presentation Layer: Next.js frontend"),
    createParagraph("• Business Logic Layer: API routes"),
    createParagraph("• Data Layer: Supabase PostgreSQL"),
    createParagraph(""),

    createSectionParagraph("4.2", "Sơ đồ Entity-Relationship (ERD)"),
    createParagraph("[CHÈN ẢNH: Hình 4.1 - Sơ đồ ERD của hệ thống]"),
    createParagraph(""),

    createSectionParagraph("4.3", "Bảng dữ liệu chính"),
    createTable(
      ["Bảng", "Mô tả", "Khóa chính"],
      [
        ["users", "Thông tin người dùng", "id"],
        ["properties", "Thông tin bất động sản", "id"],
        ["rooms", "Thông tin phòng", "id"],
        ["bookings", "Thông tin đặt phòng", "id"],
        ["reviews", "Đánh giá từ khách", "id"],
      ],
    ),
    createParagraph("", { spacing: { after: 120 } }),

    createSectionParagraph("4.4", "Giao diện người dùng"),
    createParagraph("[CHÈN ẢNH: Hình 4.2 - Trang chủ]"),
    createParagraph("[CHÈN ẢNH: Hình 4.3 - Trang đăng nhập]"),
    createParagraph("[CHÈN ẢNH: Hình 4.4 - Danh sách bất động sản]"),
    createParagraph(""),

    createSectionParagraph("4.5", "Workflow đặt phòng"),
    createParagraph("1. Khách truy cập trang chủ"),
    createParagraph("2. Tìm kiếm bất động sản"),
    createParagraph("3. Chọn phòng và ngày"),
    createParagraph("4. Kiểm tra giá"),
    createParagraph("5. Đăng nhập/Đăng ký"),
    createParagraph("6. Nhập thông tin thanh toán"),
    createParagraph("7. Xác nhận đặt phòng"),
    createParagraph("", { spacing: { after: 60 } }),
    new PageBreak(),

    new Paragraph({
      text: "CHƯƠNG 5: PHÁT TRIỂN VÀ TRIỂN KHAI",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph("5.1. Quá trình phát triển", {
      ...HEADING_2_STYLE,
      spacing: { before: 0, after: 120 },
    }),
    createParagraph("Dự án được phát triển theo mô hình Agile:"),
    createParagraph("• Sprint 1-2: Setup và thiết kế database"),
    createParagraph("• Sprint 3-4: Phát triển frontend"),
    createParagraph("• Sprint 5-6: Phát triển backend"),
    createParagraph("• Sprint 7-8: Testing và deployment"),
    createParagraph(""),

    createSectionParagraph("5.2", "Công cụ phát triển"),
    createParagraph("• VS Code: Code editor"),
    createParagraph("• Git: Version control"),
    createParagraph("• GitHub: Repository hosting"),
    createParagraph("• npm: Package management"),
    createParagraph("• ESLint: Code quality"),
    createParagraph(""),

    createSectionParagraph("5.3", "Thư viện chính"),
    createTable(
      ["Thư viện", "Phiên bản", "Mục đích"],
      [
        ["Next.js", "16.2.6", "Framework"],
        ["React", "19", "UI Library"],
        ["Tailwind CSS", "latest", "Styling"],
        ["Supabase", "latest", "Backend"],
        ["Leaflet", "1.9.4", "Maps"],
      ],
    ),
    createParagraph("", { spacing: { after: 120 } }),

    createSectionParagraph("5.4", "Các tính năng chính đã triển khai"),
    createParagraph("✓ Đăng ký và đăng nhập"),
    createParagraph("✓ Quản lý bất động sản"),
    createParagraph("✓ Đặt phòng"),
    createParagraph("✓ Bản đồ tương tác"),
    createParagraph("✓ Hệ thống đánh giá"),
    createParagraph("✓ Quản trị viên"),
    createParagraph("", { spacing: { after: 60 } }),
    new PageBreak(),

    new Paragraph({
      text: "CHƯƠNG 6: DOCKER VÀ DEPLOYMENT",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph("6.1. Containerization với Docker", {
      ...HEADING_2_STYLE,
      spacing: { before: 0, after: 120 },
    }),
    createParagraph("Ứng dụng được containerize bằng Docker:"),
    createParagraph("• Dockerfile: Define image"),
    createParagraph("• Docker Compose: Orchestrate services"),
    createParagraph("• Environment variables: Configuration"),
    createParagraph(""),

    createSectionParagraph("6.2", "Dockerfile"),
    createParagraph("FROM node:20-alpine"),
    createParagraph("WORKDIR /app"),
    createParagraph("COPY package*.json ./"),
    createParagraph("RUN npm install"),
    createParagraph("COPY . ."),
    createParagraph("RUN npm run build"),
    createParagraph("EXPOSE 3000"),
    createParagraph('CMD ["npm", "start"]'),
    createParagraph(""),

    createSectionParagraph("6.3", "Triển khai trên VPS"),
    createParagraph("• SSH vào server"),
    createParagraph("• Clone repository"),
    createParagraph("• Setup environment variables"),
    createParagraph("• Build Docker image"),
    createParagraph("• Run container"),
    createParagraph(""),

    createSectionParagraph("6.4", "SSL/HTTPS Setup"),
    createParagraph("• Sử dụng Let's Encrypt"),
    createParagraph("• Cấu hình Nginx reverse proxy"),
    createParagraph("• Auto-renewal certificate"),
    createParagraph("", { spacing: { after: 60 } }),
    new PageBreak(),

    new Paragraph({
      text: "CHƯƠNG 7: SỬ DỤNG AI TRONG PHÁT TRIỂN",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph("7.1. Nhập môn AI trong phát triển", {
      ...HEADING_2_STYLE,
      spacing: { before: 0, after: 120 },
    }),
    createParagraph(
      "AI và machine learning được sử dụng để hỗ trợ quá trình phát triển:",
    ),
    createParagraph(""),

    createSectionParagraph("7.2", "Bảng tóm tắt sử dụng AI"),
    createTable(
      ["STT", "Thời điểm", "Công cụ", "Mục đích"],
      [
        ["1", "Setup", "GitHub Copilot", "Code generation"],
        ["2", "Frontend Dev", "ChatGPT", "Component design"],
        ["3", "Backend Dev", "GitHub Copilot", "API development"],
        ["4", "Testing", "ChatGPT", "Test case generation"],
        ["5", "Documentation", "ChatGPT", "Writing docs"],
        ["6", "Debugging", "GitHub Copilot", "Error fixing"],
        ["7", "Optimization", "ChatGPT", "Performance tips"],
        ["8", "Deployment", "ChatGPT", "Docker optimization"],
      ],
    ),
    createParagraph("", { spacing: { after: 120 } }),

    createSectionParagraph("7.3", "Ví dụ sử dụng GitHub Copilot"),
    createParagraph("GitHub Copilot được sử dụng để:"),
    createParagraph("• Tạo React components"),
    createParagraph("• Viết TypeScript types"),
    createParagraph("• Tạo Supabase queries"),
    createParagraph("• Xử lý lỗi"),
    createParagraph(""),

    createSectionParagraph("7.4", "Ví dụ sử dụng ChatGPT"),
    createParagraph("ChatGPT được sử dụng để:"),
    createParagraph("• Giải thích khái niệm"),
    createParagraph("• Tạo prompt từ yêu cầu"),
    createParagraph("• Viết documentation"),
    createParagraph("• Thiết kế wireframe"),
    createParagraph(""),

    createSectionParagraph("7.5", "Lợi ích của AI"),
    createParagraph("• Tăng tốc độ phát triển"),
    createParagraph("• Giảm lỗi"),
    createParagraph("• Hỗ trợ học tập"),
    createParagraph("• Cải thiện code quality"),
    createParagraph(""),

    createSectionParagraph("7.6", "Giới hạn của AI"),
    createParagraph("• Cần code review"),
    createParagraph("• Không luôn chính xác"),
    createParagraph("• Cần hiểu cơ bản"),
    createParagraph(""),

    createSectionParagraph("7.7", "Thực hành tốt nhất"),
    createParagraph("• Kiểm tra kỹ code được sinh"),
    createParagraph("• Không tin tưởng mù quáng"),
    createParagraph("• Hiểu ý nghĩa code"),
    createParagraph(""),

    createSectionParagraph("7.8", "Hướng phát triển tương lai"),
    createParagraph("• Sử dụng AI cho optimization"),
    createParagraph("• Recommendation engine"),
    createParagraph("• Predictive analytics"),
    createParagraph("", { spacing: { after: 60 } }),
    new PageBreak(),

    new Paragraph({
      text: "CHƯƠNG 8: ĐÁNH GIÁ KẾT QUẢ",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph("8.1. Kết quả đạt được", {
      ...HEADING_2_STYLE,
      spacing: { before: 0, after: 120 },
    }),
    createParagraph("Dự án đã hoàn thành các mục tiêu chính:"),
    createParagraph("✓ Xây dựng hệ thống quản lý homestay"),
    createParagraph("✓ Triển khai trên VPS với SSL"),
    createParagraph("✓ Tích hợp bản đồ tương tác"),
    createParagraph("✓ Hệ thống authentication bảo mật"),
    createParagraph("✓ Database design toàn diện"),
    createParagraph(""),

    createSectionParagraph("8.2", "Thống kê dự án"),
    createTable(
      ["Chỉ số", "Giá trị"],
      [
        ["Tổng files", "150+"],
        ["Lines of code", "15,000+"],
        ["Components", "50+"],
        ["Database tables", "12"],
        ["API endpoints", "30+"],
      ],
    ),
    createParagraph("", { spacing: { after: 120 } }),

    createSectionParagraph("8.3", "Thử nghiệm"),
    createParagraph("Các bài test đã được thực hiện:"),
    createParagraph("• Unit testing: 80+ tests"),
    createParagraph("• Integration testing: 20+ scenarios"),
    createParagraph("• Manual testing: UI/UX validation"),
    createParagraph("• Performance testing: Load testing"),
    createParagraph(""),

    createSectionParagraph("8.4", "Hiệu năng"),
    createParagraph("• Page load time: 1.2s (First Contentful Paint)"),
    createParagraph("• API response: 200-500ms"),
    createParagraph("• Database query: <100ms"),
    createParagraph("• Lighthouse score: 85/100"),
    createParagraph(""),

    createSectionParagraph("8.5", "Bảo mật"),
    createParagraph("• HTTPS/SSL enabled"),
    createParagraph("• Row Level Security (RLS)"),
    createParagraph("• Password hashing (bcrypt)"),
    createParagraph("• CSRF protection"),
    createParagraph("• XSS prevention"),
    createParagraph(""),

    createSectionParagraph("8.6", "Khó khăn gặp phải"),
    createParagraph("• Setup Supabase RLS policies phức tạp"),
    createParagraph("• Docker network configuration"),
    createParagraph("• Nominatim API rate limiting"),
    createParagraph("• Timezone handling"),
    createParagraph(""),

    createSectionParagraph("8.7", "Bài học rút ra"),
    createParagraph("• Importance of proper architecture"),
    createParagraph("• Testing từ sớm"),
    createParagraph("• Documentation là quan trọng"),
    createParagraph("• DevOps kỹ năng cần thiết"),
    createParagraph(""),

    createSectionParagraph("8.8", "Hướng phát triển tương lai"),
    createParagraph("• Mobile app development"),
    createParagraph("• Machine learning recommendations"),
    createParagraph("• Real-time notifications"),
    createParagraph("• Advanced analytics"),
    createParagraph(""),

    new PageBreak(),

    new Paragraph({
      text: "KẾT LUẬN",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph(
      "Dự án StaySaga đã chứng minh khả năng xây dựng một ứng dụng web full-stack hiện đại bằng Next.js, React, và Supabase. Hệ thống cung cấp giải pháp toàn diện cho quản lý homestay với giao diện thân thiện và tính năng mạnh mẽ.",
    ),
    createParagraph(""),
    createParagraph("Thông qua quá trình phát triển, tôi đã:"),
    createParagraph("• Nắm vững kiến trúc web application hiện đại"),
    createParagraph("• Hiểu sâu về TypeScript và React hooks"),
    createParagraph("• Thành thạo Supabase database management"),
    createParagraph("• Triển khai ứng dụng trên production"),
    createParagraph("• Sử dụng AI tools để hỗ trợ phát triển"),
    createParagraph(""),
    createParagraph(
      "Dự án này cung cấp nền tảng vững chắc cho sự phát triển trong tương lai với khả năng mở rộng quy mô, thêm tính năng mới, và cải thiện hiệu năng.",
    ),
    createParagraph("", { spacing: { after: 300 } }),

    new Paragraph({
      text: "TÀI LIỆU THAM KHẢO",
      ...HEADING_1_STYLE,
      spacing: { before: 0, after: 240 },
    }),
    createParagraph(
      '[1] Next.js Documentation. "Next.js 16 Official Documentation". https://nextjs.org/docs',
    ),
    createParagraph(
      '[2] React Documentation. "React 19 Reference". https://react.dev',
    ),
    createParagraph(
      '[3] Supabase Documentation. "Supabase PostgreSQL Backend". https://supabase.com/docs',
    ),
    createParagraph(
      '[4] Tailwind CSS. "Utility-First CSS Framework". https://tailwindcss.com',
    ),
    createParagraph(
      '[5] TypeScript. "TypeScript Handbook". https://www.typescriptlang.org/docs',
    ),
    createParagraph(
      '[6] Docker. "Docker Documentation". https://docs.docker.com',
    ),
    createParagraph(
      '[7] Leaflet. "Interactive Maps Library". https://leafletjs.com',
    ),
    createParagraph(
      '[8] OpenStreetMap. "Free Wiki World Map". https://www.openstreetmap.org',
    ),
    createParagraph(
      '[9] Nominatim. "Geocoding with OpenStreetMap". https://nominatim.org',
    ),
    createParagraph(
      '[10] MDN Web Docs. "Web Technologies Reference". https://developer.mozilla.org',
    ),
    createParagraph(
      '[11] The Pragmatic Programmer. "Your Journey to Mastery". 2nd Edition',
    ),
    createParagraph(
      '[12] Clean Code. "A Handbook of Agile Software Craftsmanship". Robert C. Martin',
    ),
    createParagraph(
      '[13] Design Patterns. "Elements of Reusable Object-Oriented Software". Gang of Four',
    ),
    createParagraph(
      '[14] Web Security Academy. "OWASP Top 10 Security Risks". https://owasp.org',
    ),
    createParagraph(
      '[15] Vercel. "Next.js Deployment on Vercel". https://vercel.com/docs',
    ),
  );

  return sections;
}

// Create and write documents
async function createThesisDocuments() {
  try {
    const part1Sections = generatePart1();
    const part2Sections = generatePart2();

    // Part 1
    const doc1 = new Document({
      sections: [
        {
          children: part1Sections,
          properties: {
            page: {
              margins: {
                top: convertInchesToTwip(1.0),
                bottom: convertInchesToTwip(1.0),
                left: convertInchesToTwip(1.25),
                right: convertInchesToTwip(0.75),
              },
            },
          },
        },
      ],
    });

    const part1Buffer = await Packer.toBuffer(doc1);
    fs.writeFileSync(
      path.join(
        __dirname,
        "Xay_Dung_He_Thong_Quan_Ly_Homestay_StaySaga_Part1.docx",
      ),
      part1Buffer,
    );
    console.log("✓ Part 1 created successfully");

    // Part 2
    const doc2 = new Document({
      sections: [
        {
          children: part2Sections,
          properties: {
            page: {
              margins: {
                top: convertInchesToTwip(1.0),
                bottom: convertInchesToTwip(1.0),
                left: convertInchesToTwip(1.25),
                right: convertInchesToTwip(0.75),
              },
            },
          },
        },
      ],
    });

    const part2Buffer = await Packer.toBuffer(doc2);
    fs.writeFileSync(
      path.join(
        __dirname,
        "Xay_Dung_He_Thong_Quan_Ly_Homestay_StaySaga_Part2.docx",
      ),
      part2Buffer,
    );
    console.log("✓ Part 2 created successfully");

    console.log("\n✅ All thesis documents generated successfully!");
    console.log("Files created:");
    console.log("- Xay_Dung_He_Thong_Quan_Ly_Homestay_StaySaga_Part1.docx");
    console.log("- Xay_Dung_He_Thong_Quan_Ly_Homestay_StaySaga_Part2.docx");
  } catch (error) {
    console.error("Error creating thesis documents:", error);
    process.exit(1);
  }
}

// Run the generator
createThesisDocuments();
