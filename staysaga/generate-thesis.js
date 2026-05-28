#!/usr/bin/env node

const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  PageBreak,
  TextRun,
  AlignmentType,
  BorderStyle,
  UnderlineType,
  VerticalAlign,
  convertInchesToTwip,
  HeadingLevel,
  PageNumber,
  PageNumberType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// Helper function to create heading style
const heading1 = (text) =>
  new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    style: "Heading1",
    spacing: { line: 360, before: 200, after: 100 },
    alignment: AlignmentType.LEFT,
  });

const heading2 = (text) =>
  new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    style: "Heading2",
    spacing: { line: 360, before: 120, after: 80 },
    alignment: AlignmentType.LEFT,
  });

const heading3 = (text) =>
  new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    style: "Heading3",
    spacing: { line: 360, before: 100, after: 60 },
    alignment: AlignmentType.LEFT,
  });

const normalText = (text) =>
  new Paragraph({
    text: text,
    style: "Normal",
    spacing: { line: 360 },
    alignment: AlignmentType.JUSTIFIED,
  });

const centeredText = (text) =>
  new Paragraph({
    text: text,
    style: "Normal",
    spacing: { line: 360 },
    alignment: AlignmentType.CENTER,
  });

const boldCentered = (text) =>
  new Paragraph({
    text: text,
    bold: true,
    spacing: { line: 360 },
    alignment: AlignmentType.CENTER,
  });

const spacer = () =>
  new Paragraph({
    text: "",
    spacing: { line: 360 },
  });

// Helper function for creating tables
const createTable = (headers, rows, title) => {
  const headerCells = headers.map(
    (h) =>
      new TableCell({
        children: [
          new Paragraph({
            text: h,
            bold: true,
            alignment: AlignmentType.CENTER,
          }),
        ],
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: "D3D3D3" },
      }),
  );

  const tableRows = [
    new TableRow({
      children: headerCells,
    }),
    ...rows.map(
      (row) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                children: [
                  new Paragraph({
                    text: cell,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
              }),
          ),
        }),
    ),
  ];

  const elements = [];
  if (title) {
    elements.push(
      new Paragraph({
        text: title,
        bold: true,
        spacing: { line: 360, before: 100, after: 60 },
        alignment: AlignmentType.CENTER,
      }),
    );
  }

  elements.push(
    new Table({
      width: { size: 100, type: "pct" },
      rows: tableRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "000000",
        },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
    }),
  );

  return elements;
};

const imagePlaceholder = (caption) => [
  new Paragraph({
    text: "",
    spacing: { line: 360, before: 200, after: 200 },
  }),
  centeredText("[PLACEHOLDER: " + caption + "]"),
  new Paragraph({
    text: "",
    spacing: { line: 360, before: 100, after: 100 },
  }),
];

// Document content construction
const sections = [];

// ============== COVER PAGE ==============
sections.push([
  new Paragraph({
    text: "",
    spacing: { line: 360 },
  }),
  new Paragraph({
    text: "",
    spacing: { line: 360 },
  }),
  new Paragraph({
    text: "",
    spacing: { line: 360 },
  }),
  boldCentered("ĐẠI HỌC [TÊN TRƯỜNG ĐẠI HỌC]"),
  spacer(),
  boldCentered("KHOA CÔNG NGHỆ THÔNG TIN"),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  boldCentered("XÂY DỰNG HỆ THỐNG QUẢN LÝ HOMESTAY STAYSAGA"),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  centeredText("(Building a Homestay Management System StaySaga)"),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  centeredText("LUẬN VĂN TỐT NGHIỆP"),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  centeredText("Chuyên ngành: [Tên chuyên ngành]"),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  centeredText("Sinh viên thực hiện: <NAME>"),
  centeredText("MSSV: <STUDENT ID>"),
  new Paragraph({
    text: "",
    spacing: { line: 360 },
  }),
  centeredText("Giáo viên hướng dẫn: ThS. <ADVISOR NAME>"),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  new Paragraph({
    text: "",
    spacing: { line: 720 },
  }),
  centeredText("Thành phố [CITY NAME], năm 2026"),
]);

sections.push([new PageBreak()]);

// ============== SECOND COVER PAGE ==============
sections.push([
  new Paragraph({ text: "", spacing: { line: 360 } }),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  boldCentered("ĐẠI HỌC [TÊN TRƯỜNG ĐẠI HỌC]"),
  spacer(),
  boldCentered("KHOA CÔNG NGHỆ THÔNG TIN"),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  boldCentered("XÂY DỰNG HỆ THỐNG QUẢN LÝ HOMESTAY STAYSAGA"),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  centeredText("LUẬN VĂN TỐT NGHIỆP"),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({
    text: "Lớp: <CLASS NAME>",
    spacing: { line: 360 },
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    text: "Mã sinh viên: <STUDENT ID>",
    spacing: { line: 360 },
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    text: "Họ tên sinh viên: <NAME>",
    spacing: { line: 360 },
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    text: "Ngày sinh: <DOB>",
    spacing: { line: 360 },
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({
    text: "Giáo viên hướng dẫn: ThS. <ADVISOR NAME>",
    spacing: { line: 360 },
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    text: "Giáo viên phản biện: ThS./PGS./GS. <REVIEWER NAME>",
    spacing: { line: 360 },
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  centeredText("Thành phố [CITY NAME], năm 2026"),
]);

sections.push([new PageBreak()]);

// ============== ADVISOR COMMENTS PAGE ==============
sections.push([
  boldCentered("NHẬN XÉT CỦA GIÁO VIÊN HƯỚNG DẪN"),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  centeredText("_____________________________"),
  centeredText("Chữ ký và họ tên"),
  centeredText("Ngày: ___/___/2026"),
]);

sections.push([new PageBreak()]);

// ============== REVIEWER COMMENTS PAGE ==============
sections.push([
  boldCentered("NHẬN XÉT CỦA GIÁO VIÊN PHẢN BIỆN"),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  centeredText("_____________________________"),
  centeredText("Chữ ký và họ tên"),
  centeredText("Ngày: ___/___/2026"),
]);

sections.push([new PageBreak()]);

// ============== DECLARATION PAGE ==============
sections.push([
  boldCentered("TUYÊN BỐ"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "Tôi xin tuyên bố rằng luận văn này là công trình nghiên cứu độc lập của bản thân tôi. Các kết quả, nhận xét, kết luận, và các tài liệu tham khảo trong luận văn này đã được dẫn chiếu hoàn toàn. Tôi chịu trách nhiệm về những vi phạm bản quyền của các tác giả khác nếu có.",
  ),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  centeredText("<NAME>"),
  centeredText("Ngày ___/___/2026"),
]);

sections.push([new PageBreak()]);

// ============== ACKNOWLEDGMENTS PAGE ==============
sections.push([
  boldCentered("LỜI CẢM ƠN"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "Trước tiên, tôi xin gửi lời cảm ơn chân thành đến ThS. <ADVISOR NAME> - giáo viên hướng dẫn của tôi, người đã tận tình hướng dẫn, chỉ bảo và khuyến khích tôi hoàn thành luận văn này với những ý kiến quý báu và những điều chỉnh kịp thời.",
  ),
  normalText(
    "Tôi cũng xin cảm ơn các thầy cô giáo và toàn thể cán bộ Khoa Công Nghệ Thông Tin đã tạo điều kiện thuận lợi cho tôi hoàn thành khóa học và luận văn tốt nghiệp.",
  ),
  normalText(
    "Đặc biệt, tôi xin cảm ơn gia đình và những người bạn đã luôn ở bên cạnh, động viên và hỗ trợ tôi trong suốt quá trình thực hiện luận văn.",
  ),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  centeredText("<NAME>"),
  centeredText("Tháng 5 năm 2026"),
]);

sections.push([new PageBreak()]);

// ============== SUMMARY PAGE ==============
sections.push([
  boldCentered("TÓM TẮT"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "Hệ thống quản lý homestay StaySaga là một ứng dụng web toàn diện được xây dựng để giúp các chủ nhà cho thuê homestay quản lý các phòng, đơn đặt phòng, khách hàng, và tất cả các quy trình liên quan. Luận văn này trình bày quá trình phân tích, thiết kế và xây dựng hệ thống từ đầu đến cuối.",
  ),
  normalText(
    "Hệ thống được xây dựng sử dụng các công nghệ hiện đại: Next.js App Router cho frontend, TypeScript cho tính an toàn kiểu, Supabase cho cơ sở dữ liệu và xác thực, Docker và Docker Compose cho containerization, và được triển khai lên VPS với domain riêng và HTTPS.",
  ),
  normalText(
    "Luận văn bao gồm 8 chương chính: giới thiệu, tổng quan về hệ thống quản lý homestay, cơ sở lý thuyết và công nghệ sử dụng, phân tích và yêu cầu hệ thống, thiết kế hệ thống, triển khai và xây dựng hệ thống, Docker và triển khai production, và sử dụng AI trong quá trình phát triển. Phần kết luận tóm tắt những thành tựu đạt được và hướng phát triển trong tương lai.",
  ),
  normalText(
    "Hệ thống StaySaga thành công trong việc cung cấp một giải pháp toàn diện, an toàn, và có khả năng mở rộng cho quản lý homestay. Nó minh chứng khả năng áp dụng các công nghệ web hiện đại và các best practices trong phát triển ứng dụng enterprise.",
  ),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  new Paragraph({
    text: "Từ khóa: Quản lý homestay, Next.js, Supabase, PostgreSQL, Docker, triển khai web, RLS, TypeScript",
    italic: true,
    spacing: { line: 360 },
  }),
]);

sections.push([new PageBreak()]);

// ============== TABLE OF CONTENTS ==============
sections.push([
  boldCentered("MỤC LỤC"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "MỤC LỤC........................................................................................................................1",
  ),
  normalText(
    "DANH SÁCH HÌNH VẼ............................................................................................................2",
  ),
  normalText(
    "DANH SÁCH BẢNG................................................................................................................2",
  ),
  normalText(
    "DANH SÁCH TỪ VIẾT TẮT...................................................................................................3",
  ),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "MỞ ĐẦU........................................................................................................................4",
  ),
  normalText(
    "CHƯƠNG 1: TỔNG QUAN HỆ THỐNG QUẢN LÝ HOMESTAY.....................................................10",
  ),
  normalText(
    "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ PHÁT TRIỂN.................................................20",
  ),
  normalText(
    "CHƯƠNG 3: PHÂN TÍCH VÀ YÊU CẦU HỆ THỐNG....................................................................34",
  ),
  normalText(
    "CHƯƠNG 4: THIẾT KẾ HỆ THỐNG.......................................................................................50",
  ),
  normalText(
    "CHƯƠNG 5: TRIỂN KHAI HỆ THỐNG......................................................................................66",
  ),
  normalText(
    "CHƯƠNG 6: DOCKER, TRIỂN KHAI VÀ VẬN HÀNH......................................................................82",
  ),
  normalText(
    "CHƯƠNG 7: SỬ DỤNG AI TRONG PHÁT TRIỂN..........................................................................92",
  ),
  normalText(
    "CHƯƠNG 8: ĐÁNH GIÁ KẾT QUẢ.......................................................................................102",
  ),
  normalText(
    "KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN.....................................................................................110",
  ),
  new Paragraph({ text: "", spacing: { line: 720 } }),
  normalText(
    "TÀI LIỆU THAM KHẢO..................................................................................................114",
  ),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "PHỤ LỤC A: ĐOẠN MÃ NGUỒN.........................................................................................116",
  ),
  normalText(
    "PHỤ LỤC B: HÌNH ẢNH GIAO DIỆN HỆ THỐNG........................................................................120",
  ),
  normalText(
    "PHỤ LỤC C: CHỨNG CỨ TRIỂN KHAI....................................................................................140",
  ),
  normalText(
    "PHỤ LỤC D: CHỨNG CỨ SỬ DỤNG AI...................................................................................150",
  ),
  normalText(
    "PHỤ LỤC E: CÂU HỎI VÀ TRẢ LỜI DỰ KIẾN..........................................................................160",
  ),
]);

sections.push([new PageBreak()]);

// ============== LIST OF FIGURES ==============
sections.push([
  boldCentered("DANH SÁCH HÌNH VẼ"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "Hình 1.1: Giao diện tổng quan hệ thống StaySaga....................................................................12",
  ),
  normalText(
    "Hình 2.1: Kiến trúc Next.js App Router..............................................................................22",
  ),
  normalText(
    "Hình 2.2: Quá trình render Server Component và Client Component....................................24",
  ),
  normalText(
    "Hình 2.3: Tích hợp Supabase với ứng dụng...........................................................................28",
  ),
  normalText(
    "Hình 3.1: Sơ đồ Use Case tổng quát.................................................................................36",
  ),
  normalText(
    "Hình 3.2: Sơ đồ Use Case xác thực người dùng....................................................................38",
  ),
  normalText(
    "Hình 3.3: Sơ đồ Use Case quản lý phòng............................................................................40",
  ),
  normalText(
    "Hình 3.4: Sơ đồ Use Case quản lý đặt phòng.......................................................................42",
  ),
  normalText(
    "Hình 4.1: Sơ đồ kiến trúc hệ thống toàn bộ........................................................................52",
  ),
  normalText(
    "Hình 4.2: Sơ đồ Entity Relationship Diagram (ERD).................................................................56",
  ),
  normalText(
    "Hình 4.3: Lưu đồ quy trình đặt phòng..............................................................................60",
  ),
  normalText(
    "Hình 4.4: Lưu đồ quy trình tải lên hình ảnh......................................................................62",
  ),
  normalText(
    "Hình 5.1: Cấu trúc thư mục dự án Next.js..........................................................................68",
  ),
  normalText(
    "Hình 5.2: Giao diện trang đăng nhập................................................................................72",
  ),
  normalText(
    "Hình 5.3: Trang quản lý phòng.......................................................................................74",
  ),
  normalText(
    "Hình 5.4: Biểu mẫu tạo đơn đặt phòng.............................................................................76",
  ),
  normalText(
    "Hình 6.1: Quá trình build Docker image.............................................................................84",
  ),
  normalText(
    "Hình 6.2: Kết quả triển khai trên VPS.............................................................................88",
  ),
  normalText(
    "Hình 7.1: Ví dụ prompt AI cho thiết kế cơ sở dữ liệu.............................................................94",
  ),
  normalText(
    "Hình 7.2: Ví dụ prompt AI cho RLS Supabase.......................................................................96",
  ),
  normalText(
    "Hình 8.1: Kết quả kiểm thử tự động................................................................................104",
  ),
]);

sections.push([new PageBreak()]);

// ============== LIST OF TABLES ==============
sections.push([
  boldCentered("DANH SÁCH BẢNG"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "Bảng 1.1: Các yêu cầu chức năng chính...............................................................................14",
  ),
  normalText(
    "Bảng 1.2: Các đặc tính phi chức năng.................................................................................15",
  ),
  normalText(
    "Bảng 1.3: Phân loại người dùng hệ thống.............................................................................16",
  ),
  normalText(
    "Bảng 2.1: So sánh các framework frontend............................................................................23",
  ),
  normalText(
    "Bảng 2.2: So sánh Supabase với Firebase.............................................................................29",
  ),
  normalText(
    "Bảng 3.1: Ma trận quyền hạn người dùng..............................................................................44",
  ),
  normalText(
    "Bảng 3.2: Các điều kiện chấp nhận khác..............................................................................46",
  ),
  normalText(
    "Bảng 4.1: Cấu trúc bảng Users........................................................................................58",
  ),
  normalText(
    "Bảng 4.2: Cấu trúc bảng Rooms........................................................................................59",
  ),
  normalText(
    "Bảng 4.3: Cấu trúc bảng Bookings....................................................................................60",
  ),
  normalText(
    "Bảng 4.4: Các chính sách RLS..........................................................................................64",
  ),
  normalText(
    "Bảng 5.1: Các biến môi trường cần thiết.............................................................................70",
  ),
  normalText(
    "Bảng 5.2: Tính năng chính của hệ thống...............................................................................78",
  ),
  normalText(
    "Bảng 6.1: Các biến môi trường cho Docker...........................................................................86",
  ),
  normalText(
    "Bảng 6.2: Các lệnh Docker Compose thường dùng......................................................................88",
  ),
  normalText(
    "Bảng 7.1: Bảng tổng hợp sử dụng AI...................................................................................98",
  ),
  normalText(
    "Bảng 8.1: Đánh giá so với yêu cầu ban đầu.........................................................................108",
  ),
]);

sections.push([new PageBreak()]);

// ============== LIST OF ABBREVIATIONS ==============
sections.push([
  boldCentered("DANH SÁCH TỪ VIẾT TẮT"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "API - Application Programming Interface (Giao diện lập trình ứng dụng)",
  ),
  normalText("CRUD - Create, Read, Update, Delete (Tạo, Đọc, Cập nhật, Xóa)"),
  normalText("CSS - Cascading Style Sheets (Bảng định kiểu nước tầng)"),
  normalText("DB - Database (Cơ sở dữ liệu)"),
  normalText("DOM - Document Object Model (Mô hình đối tượng tài liệu)"),
  normalText("ERD - Entity Relationship Diagram (Sơ đồ quan hệ thực thể)"),
  normalText("FE - Frontend (Giao diện người dùng)"),
  normalText(
    "HTML - HyperText Markup Language (Ngôn ngữ đánh dấu siêu văn bản)",
  ),
  normalText(
    "HTTP/HTTPS - HyperText Transfer Protocol (Secure) (Giao thức truyền tải siêu văn bản)",
  ),
  normalText("JWT - JSON Web Token (Token Web JSON)"),
  normalText("OTA - Online Travel Agency (Hãng du lịch trực tuyến)"),
  normalText("RLS - Row Level Security (Bảo mật cấp hàng)"),
  normalText("SSR - Server-Side Rendering (Render phía máy chủ)"),
  normalText("SQL - Structured Query Language (Ngôn ngữ truy vấn có cấu trúc)"),
  normalText("SQL - Structured Query Language (Ngôn ngữ truy vấn có cấu trúc)"),
  normalText("SSH - Secure Shell (Vỏ an toàn)"),
  normalText(
    "SSL/TLS - Secure Socket Layer / Transport Layer Security (Bảo mật socket / Bảo mật lớp vận chuyển)",
  ),
  normalText("UI - User Interface (Giao diện người dùng)"),
  normalText("UX - User Experience (Trải nghiệm người dùng)"),
  normalText("VPS - Virtual Private Server (Máy chủ riêng ảo)"),
  normalText("BE - Backend (Phía sau ứng dụng)"),
]);

sections.push([new PageBreak()]);

// ============== INTRODUCTION ==============
sections.push([
  heading1("MỞ ĐẦU"),
  normalText(
    "Trong bối cảnh của cách mạng công nghiệp 4.0 và sự phát triển mạnh mẽ của công nghệ thông tin, các nền tảng chia sẻ kinh tế như Airbnb, Booking.com đã thay đổi cách mà du khách lựa chọn chỗ ở và cách các chủ nhà quản lý tài sản của họ. Tuy nhiên, đối với các chủ nhà cho thuê homestay nhỏ lẻ hoặc các chủ nhà quản lý nhiều phòng, việc quản lý toàn bộ quy trình từ liệt kê phòng, quản lý đặt phòng, thông tin khách hàng, thanh toán, cho đến xử lý hình ảnh vẫn là một thách thức lớn.",
  ),
  heading2("1. Lý do chọn đề tài"),
  normalText("Đề tài này được chọn vì những lý do sau đây:"),
  normalText(
    "Thứ nhất, nhu cầu quản lý homestay ngày càng tăng cao do sự phát triển của du lịch nội địa và quốc tế. Các chủ nhà cần một hệ thống để quản lý đơn đặt phòng, khách hàng, hình ảnh phòng, và các giao dịch thanh toán một cách hiệu quả.",
  ),
  normalText(
    "Thứ hai, đây là cơ hội tốt để áp dụng các công nghệ web hiện đại như Next.js App Router, TypeScript, Supabase, Docker, và các best practices trong phát triển ứng dụng toàn diện.",
  ),
  normalText(
    "Thứ ba, hệ thống này có thể được mở rộng để tích hợp các tính năng nâng cao như thanh toán trực tuyến, đồng bộ lịch Google Calendar, gửi email/SMS tự động, tối ưu hóa SEO, và thậm chí dự báo nhu cầu bằng AI.",
  ),

  heading2("2. Mục tiêu"),
  normalText(
    "Mục tiêu chính của luận văn là xây dựng một hệ thống quản lý homestay hoàn chỉnh có tên StaySaga. Cụ thể, hệ thống cần đáp ứng được những mục tiêu sau:",
  ),
  normalText(
    "Cung cấp giao diện người dùng thân thiện, dễ sử dụng cho chủ nhà quản lý và khách hàng.",
  ),
  normalText(
    "Quản lý hiệu quả các phòng, đặt phòng, khách hàng, hình ảnh, và giao dịch thanh toán.",
  ),
  normalText(
    "Đảm bảo bảo mật toàn bộ dữ liệu, đặc biệt là thông tin cá nhân và tài chính của người dùng.",
  ),
  normalText(
    "Triển khai hệ thống lên môi trường production với domain riêng và HTTPS.",
  ),
  normalText(
    "Sử dụng Docker để containerize ứng dụng, giúp dễ dàng triển khai và mở rộng.",
  ),

  heading2("3. Phạm vi và đối tượng nghiên cứu"),
  normalText("Phạm vi của luận văn bao gồm:"),
  normalText(
    "Phân tích yêu cầu hệ thống cho quản lý homestay, bao gồm quản lý phòng, đặt phòng, khách hàng, hình ảnh, và thanh toán.",
  ),
  normalText(
    "Thiết kế hệ thống sử dụng Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase, PostgreSQL, Docker, và Docker Compose.",
  ),
  normalText(
    "Xây dựng các tính năng chính: xác thực người dùng, quản lý phòng, quản lý đặt phòng, quản lý khách hàng, tải lên hình ảnh, quản lý thanh toán, và quản lý quyền hạn.",
  ),
  normalText(
    "Triển khai hệ thống lên VPS với domain riêng, HTTPS, và monitoring cơ bản.",
  ),
  normalText(
    "Đối tượng nghiên cứu là các chủ nhà cho thuê homestay, khách hàng sử dụng dịch vụ, và các nhân viên hỗ trợ quản lý.",
  ),

  heading2("4. Phương pháp thực hiện"),
  normalText("Luận văn sử dụng các phương pháp nghiên cứu sau:"),
  normalText(
    "Phương pháp phân tích: Phân tích các nhu cầu của người dùng, các yêu cầu chức năng, và các yêu cầu phi chức năng của hệ thống.",
  ),
  normalText(
    "Phương pháp thiết kế: Sử dụng sơ đồ use case, sơ đồ ERD, lưu đồ quy trình để thiết kế hệ thống.",
  ),
  normalText(
    "Phương pháp xây dựng: Sử dụng các công nghệ web hiện đại, theo dõi best practices, và áp dụng các mô hình phát triển agile.",
  ),
  normalText(
    "Phương pháp kiểm thử: Kiểm thử chức năng, kiểm thử bảo mật, kiểm thử hiệu năng, và kiểm thử giao diện người dùng.",
  ),
  normalText(
    "Phương pháp triển khai: Sử dụng Docker, Docker Compose, và các công cụ CI/CD để triển khai lên VPS.",
  ),

  heading2("5. Ý nghĩa thực tế"),
  normalText("Hệ thống StaySaga có ý nghĩa thực tế trong những khía cạnh sau:"),
  normalText(
    "Cung cấp giải pháp quản lý toàn diện cho các chủ nhà cho thuê homestay, giúp họ tiết kiệm thời gian và công sức trong quản lý vận hành.",
  ),
  normalText(
    "Cải thiện trải nghiệm của khách hàng bằng cách cung cấp giao diện thân thiện, tìm kiếm dễ dàng, và quá trình đặt phòng nhanh chóng.",
  ),
  normalText(
    "Đảm bảo bảo mật thông tin của cả chủ nhà và khách hàng thông qua các cơ chế xác thực, mã hóa, và Row Level Security.",
  ),
  normalText(
    "Minh chứng khả năng áp dụng các công nghệ web hiện đại, best practices, và các quy trình phát triển professional trong xây dựng ứng dụng enterprise.",
  ),
  normalText(
    "Hệ thống có tiềm năng được mở rộng với các tính năng nâng cao như thanh toán trực tuyến, tích hợp với các OTA, dự báo nhu cầu bằng AI, và ứng dụng mobile.",
  ),

  heading2("6. Cấu trúc luận văn"),
  normalText(
    "Luận văn được chia thành 8 chương chính, cộng với phần mở đầu và kết luận:",
  ),
  normalText(
    "Chương 1 trình bày tổng quan về hệ thống quản lý homestay, tình hình hiện tại, các vấn đề tồn tại, và các yêu cầu chung của hệ thống.",
  ),
  normalText(
    "Chương 2 trình bày cơ sở lý thuyết và các công nghệ được sử dụng, bao gồm Next.js, TypeScript, Tailwind CSS, Supabase, Docker, và VPS deployment.",
  ),
  normalText(
    "Chương 3 trình bày phân tích chi tiết yêu cầu hệ thống, bao gồm yêu cầu chức năng, yêu cầu phi chức năng, các actors của hệ thống, sơ đồ use case, và mô tả chi tiết các use case.",
  ),
  normalText(
    "Chương 4 trình bày thiết kế hệ thống, bao gồm kiến trúc tổng quát, thiết kế database (ERD), thiết kế giao diện, và lưu đồ quy trình các chức năng chính.",
  ),
  normalText(
    "Chương 5 trình bày quá trình xây dựng hệ thống, bao gồm cách cài đặt môi trường phát triển, cấu trúc thư mục dự án, các tính năng chính được xây dựng, và quá trình kiểm thử.",
  ),
  normalText(
    "Chương 6 trình bày quá trình packaging hệ thống với Docker, quá trình triển khai lên VPS, cấu hình domain, SSL/HTTPS, và kết quả đánh giá.",
  ),
  normalText(
    "Chương 7 trình bày sử dụng AI trong quá trình phát triển, bao gồm các prompt được sử dụng, kết quả nhận được từ AI, và cách xác minh lại.",
  ),
  normalText(
    "Chương 8 trình bày đánh giá kết quả, so sánh với các yêu cầu ban đầu, đánh giá các giới hạn của hệ thống, và các hướng phát triển trong tương lai.",
  ),
  normalText(
    "Phần kết luận tóm tắt những thành tựu đạt được, những kiến thức và kỹ năng đã áp dụng, các giới hạn của hệ thống, và các hướng phát triển trong tương lai.",
  ),
  normalText(
    "Cuối cùng là các phụ lục chứa đoạn mã nguồn, hình ảnh giao diện, chứng cứ triển khai, chứng cứ sử dụng AI, và các câu hỏi và trả lời dự kiến.",
  ),
]);

sections.push([new PageBreak()]);

// ============== CHAPTER 1: OVERVIEW ==============
sections.push([
  heading1("CHƯƠNG 1: TỔNG QUAN HỆ THỐNG QUẢN LÝ HOMESTAY"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "Quản lý homestay là một trong những lĩnh vực phát triển nhanh chóng trong ngành du lịch hiện đại. Với sự phát triển của nền tảng chia sẻ kinh tế và sự tăng trưởng du lịch, các chủ nhà cho thuê homestay cần các công cụ hiệu quả để quản lý tài sản, đơn đặt phòng, khách hàng, và doanh thu. Chương này trình bày tổng quan về các hệ thống quản lý homestay hiện tại, các vấn đề tồn tại, và các yêu cầu chung của hệ thống StaySaga.",
  ),

  heading2("1.1 Khái niệm quản lý homestay"),
  normalText(
    "Quản lý homestay là quá trình tổ chức, điều phối, và kiểm soát các hoạt động liên quan đến việc cho thuê các phòng hoặc toàn bộ ngôi nhà cho khách du lịch hoặc khách trọ. Công việc quản lý này bao gồm nhiều khía cạnh khác nhau như quản lý tài sản, quản lý đặt phòng, quản lý khách hàng, quản lý hình ảnh, quản lý doanh thu, và quản lý các vấn đề liên quan đến dịch vụ.",
  ),
  normalText(
    "Một hệ thống quản lý homestay tốt cần cung cấp một nền tảng tập trung để chủ nhà có thể kiểm soát tất cả các khía cạnh này một cách hiệu quả, từ việc liệt kê các phòng, thiết lập giá cả, xử lý các đơn đặt phòng, cho đến quản lý giao tiếp với khách hàng và xử lý thanh toán.",
  ),

  heading2("1.2 Tình hình hiện tại"),
  normalText(
    "Hiện nay, các chủ nhà cho thuê homestay phải đối mặt với nhiều thách thức trong quản lý. Nhiều người sử dụng các nền tảng tập trung như Airbnb, Booking.com để liệt kê phòng của họ, nhưng những nền tảng này thường tính phí dịch vụ cao (15-25% mỗi lần đặt phòng). Do đó, các chủ nhà muốn có một hệ thống riêng để quản lý mà không phải trả phí cao.",
  ),
  normalText(
    "Tuy nhiên, việc xây dựng một hệ thống quản lý riêng đòi hỏi các kiến thức kỹ thuật cao, chi phí phát triển lớn, và việc bảo trì liên tục. Ngoài ra, việc thực hiện các tính năng nâng cao như bảo mật, thanh toán trực tuyến, tích hợp với các nền tảng khác cũng rất phức tạp.",
  ),
  normalText(
    "Hiện tại, để quản lý homestay, các chủ nhà thường phải sử dụng nhiều công cụ khác nhau: Google Sheets cho quản lý dữ liệu, email cho giao tiếp, ngân hàng hoặc PayPal cho thanh toán, và Airbnb/Booking để liệt kê. Điều này dẫn đến các vấn đề về hiệu quả, lỗi dữ liệu, và khó khăn trong báo cáo.",
  ),

  heading2("1.3 Các vấn đề tồn tại"),
  normalText(
    "Các vấn đề chính tồn tại trong quản lý homestay hiện tại bao gồm:",
  ),
  normalText(
    "Thiếu tính tích hợp: Dữ liệu phân tán trên nhiều nền tảng khác nhau, khó khăn trong đồng bộ hóa và báo cáo.",
  ),
  normalText(
    "Bảo mật không đảm bảo: Sử dụng Google Sheets hoặc email để lưu trữ dữ liệu nhạy cảm như thông tin thanh toán không an toàn.",
  ),
  normalText(
    "Quản lý hình ảnh khó khăn: Không có giải pháp tập trung để quản lý, tổ chức và chia sẻ hình ảnh phòng.",
  ),
  normalText(
    "Thanh toán không tự động: Phải xử lý thanh toán thủ công, dễ dẫn đến lỗi và trễ hạn.",
  ),
  normalText(
    "Báo cáo hạn chế: Khó thống kê doanh thu, lợi suất, và các số liệu kinh doanh khác.",
  ),
  normalText(
    "Quản lý khách hàng yếu kém: Không lưu trữ được lịch sử khách hàng, ưu tiên, và các thông tin liên quan khác.",
  ),
  normalText(
    "Khó mở rộng: Khi số lượng phòng tăng lên, việc quản lý trở nên ngày càng khó khăn.",
  ),

  heading2("1.4 Yêu cầu chung của hệ thống"),
  normalText(
    "Hệ thống StaySaga được xây dựng để giải quyết những vấn đề trên. Các yêu cầu chung bao gồm:",
  ),
  normalText(
    "Cung cấp một nền tảng tập trung để quản lý toàn bộ các khía cạch của homestay.",
  ),
  normalText(
    "Đảm bảo bảo mật cao cho tất cả dữ liệu, đặc biệt là thông tin cá nhân và tài chính.",
  ),
  normalText(
    "Dễ sử dụng cho cả chủ nhà và khách hàng, không yêu cầu kiến thức kỹ thuật.",
  ),
  normalText("Có khả năng mở rộng để hỗ trợ hàng trăm hoặc hàng ngàn phòng."),
  normalText(
    "Cung cấp các báo cáo chi tiết và thống kê để giúp chủ nhà đưa ra quyết định kinh doanh tốt hơn.",
  ),
  normalText("Hỗ trợ thanh toán trực tuyến an toàn."),
  normalText(
    "Có giao diện responsive để hoạt động tốt trên desktop, tablet, và mobile.",
  ),
  normalText(
    "Có khả năng tích hợp với các dịch vụ khác như email, SMS, Google Calendar, v.v.",
  ),

  heading2("1.5 Các nhóm người dùng"),
  normalText("Hệ thống StaySaga phục vụ các nhóm người dùng khác nhau:"),
  normalText(
    "Chủ nhà (Host): Người quản lý homestay, có quyền tạo, chỉnh sửa, xóa phòng, xem đơn đặt phòng, quản lý hình ảnh, xem báo cáo, và quản lý tài khoản.",
  ),
  normalText(
    "Khách hàng (Guest): Người tìm kiếm và đặt phòng, có quyền duyệt danh sách phòng, xem chi tiết phòng, tạo đơn đặt phòng, theo dõi trạng thái đơn, và liên hệ với chủ nhà.",
  ),
  normalText(
    "Quản trị viên (Admin): Quản lý toàn bộ hệ thống, bao gồm quản lý người dùng, quản lý các phòng, xem báo cáo tổng hợp, và xử lý các sự cố.",
  ),
  normalText(
    "Nhân viên hỗ trợ (Support Staff): Hỗ trợ khách hàng, xử lý các yêu cầu, và giải quyết các vấn đề phát sinh.",
  ),

  heading2("1.6 Phạm vi hệ thống"),
  normalText("Hệ thống StaySaga bao gồm các chức năng chính sau:"),
  normalText(
    "Quản lý tài khoản và xác thực: Đăng ký, đăng nhập, xác minh email, khôi phục mật khẩu.",
  ),
  normalText(
    "Quản lý phòng: Tạo, chỉnh sửa, xóa phòng; thiết lập giá cả, mô tả, và hình ảnh.",
  ),
  normalText(
    "Quản lý đặt phòng: Tạo, chỉnh sửa, hủy đơn đặt phòng; theo dõi trạng thái.",
  ),
  normalText(
    "Quản lý khách hàng: Xem thông tin khách hàng, lịch sử đặt phòng, và liên hệ.",
  ),
  normalText(
    "Quản lý hình ảnh: Tải lên, sắp xếp, xóa hình ảnh phòng; tối ưu hóa kích thước.",
  ),
  normalText(
    "Quản lý thanh toán: Xử lý thanh toán, tạo hóa đơn, theo dõi doanh thu.",
  ),
  normalText("Quản lý quyền hạn: Phân quyền dựa trên vai trò người dùng."),
  normalText(
    "Báo cáo và thống kê: Tạo báo cáo doanh thu, tỷ lệ chiếm dụng, đánh giá khách hàng.",
  ),
  normalText(
    "Gửi thông báo: Gửi email/SMS xác nhận đặt phòng, nhắc nhở thanh toán, v.v.",
  ),

  heading2("1.7 Kiến trúc tổng thể"),
  normalText(
    "StaySaga được xây dựng với kiến trúc ba tầng (three-tier architecture):",
  ),
  normalText(
    "Tầng trình bày (Presentation Layer): Giao diện người dùng được xây dựng bằng Next.js App Router, React, TypeScript, Tailwind CSS, và shadcn/ui.",
  ),
  normalText(
    "Tầng ứng dụng (Application Layer): Logic ứng dụng được triển khai bằng Next.js Server Components, Server Actions, và API Routes.",
  ),
  normalText(
    "Tầng dữ liệu (Data Layer): Cơ sở dữ liệu PostgreSQL được quản lý bằng Supabase, với Row Level Security (RLS) để kiểm soát truy cập dữ liệu.",
  ),
  normalText(
    "Hệ thống được triển khai trên VPS với Docker và Docker Compose, đảm bảo tính sẵn sàng cao, dễ mở rộng, và bảo mật.",
  ),

  heading2("1.8 Các tính năng nổi bật"),
  normalText("Hệ thống StaySaga có các tính năng nổi bật sau:"),
  normalText(
    "Xác thực an toàn: Sử dụng Supabase Auth với JWT token, hỗ trợ đăng nhập với email/mật khẩu, và xác minh email.",
  ),
  normalText(
    "Quản lý phòng toàn diện: Cho phép tạo, chỉnh sửa, xóa phòng, thiết lập giá cả, mô tả chi tiết, và tải lên hình ảnh.",
  ),
  normalText(
    "Đặt phòng linh hoạt: Hỗ trợ chọn ngày, xem trạng thái phòng, tính giá tự động, và xác nhận đặt phòng.",
  ),
  normalText(
    "Quản lý hình ảnh thông minh: Tải lên hình ảnh, tối ưu hóa kích thước, lưu trữ trong Supabase Storage, và hiển thị adaptive.",
  ),
  normalText(
    "Bảo mật dữ liệu: Sử dụng Row Level Security (RLS) để đảm bảo người dùng chỉ có thể truy cập dữ liệu của họ.",
  ),
  normalText(
    "Giao diện responsive: Hoạt động tốt trên desktop, tablet, và mobile.",
  ),
  normalText(
    "Hiệu năng cao: Sử dụng Next.js App Router, Server Components, và các kỹ thuật tối ưu hóa hiệu năng khác.",
  ),
  normalText(
    "Dễ triển khai: Sử dụng Docker và Docker Compose để triển khai dễ dàng trên VPS.",
  ),

  heading2("1.9 Mục tiêu của chương"),
  normalText(
    "Chương 1 đã trình bày tổng quan về hệ thống quản lý homestay, tình hình hiện tại, các vấn đề tồn tại, và các yêu cầu chung của hệ thống StaySaga. Qua đó, chúng ta hiểu rõ hơn về nhu cầu, phạm vi, kiến trúc, và các tính năng nổi bật của hệ thống. Những thông tin này sẽ là cơ sở cho các chương tiếp theo.",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),
  centeredText(
    "[PLACEHOLDER: Hình 1.1 - Giao diện tổng quan hệ thống StaySaga]",
  ),
  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Chức năng", "Mô tả", "Độ ưu tiên"],
    [
      ["Quản lý phòng", "Tạo, chỉnh sửa, xóa phòng", "Cao"],
      ["Quản lý đặt phòng", "Tạo, chỉnh sửa, hủy đơn đặt phòng", "Cao"],
      ["Quản lý thanh toán", "Xử lý thanh toán, tạo hóa đơn", "Cao"],
      ["Quản lý hình ảnh", "Tải lên, sắp xếp hình ảnh", "Trung bình"],
      ["Báo cáo doanh thu", "Thống kê doanh thu, lợi suất", "Trung bình"],
      ["Gửi thông báo", "Email/SMS xác nhận, nhắc nhở", "Trung bình"],
    ],
    "Bảng 1.1: Các chức năng chính của hệ thống",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Yêu cầu", "Giá trị", "Mô tả"],
    [
      ["Bảo mật", "Cao", "Sử dụng RLS, mã hóa dữ liệu"],
      ["Hiệu năng", "Cao", "Trang web tải dưới 3 giây"],
      ["Khả dụng", "99%", "Hệ thống hoạt động liên tục"],
      ["Khả năng mở rộng", "1000+ phòng", "Hỗ trợ hàng ngàn phòng"],
      ["Giao diện", "Responsive", "Hoạt động trên tất cả thiết bị"],
    ],
    "Bảng 1.2: Các yêu cầu phi chức năng",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Nhóm người dùng", "Vai trò", "Quyền hạn chính"],
    [
      ["Host", "Chủ nhà", "Quản lý phòng, xem báo cáo"],
      ["Guest", "Khách hàng", "Tìm kiếm, đặt phòng"],
      ["Admin", "Quản trị viên", "Quản lý toàn bộ hệ thống"],
      ["Support", "Hỗ trợ khách hàng", "Xử lý yêu cầu hỗ trợ"],
    ],
    "Bảng 1.3: Các nhóm người dùng và quyền hạn",
  ),
]);

sections.push([new PageBreak()]);

// ============== CHAPTER 2: THEORETICAL BASIS ==============
sections.push([
  heading1("CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ PHÁT TRIỂN"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  normalText(
    "Để xây dựng một hệ thống quản lý homestay hiện đại, an toàn, và có khả năng mở rộng, luận văn này sử dụng các công nghệ web hiện tại và các best practices trong phát triển ứng dụng. Chương này trình bày cơ sở lý thuyết và chi tiết các công nghệ được sử dụng trong hệ thống StaySaga.",
  ),

  heading2("2.1 Ứng dụng web full-stack"),
  normalText(
    "Ứng dụng web full-stack là ứng dụng web hoàn chỉnh bao gồm cả phần frontend (client-side) và backend (server-side). Frontend xử lý giao diện người dùng và tương tác người dùng, trong khi backend xử lý logic ứng dụng, cơ sở dữ liệu, và API. Một ứng dụng full-stack tốt cần phải đảm bảo tính nhất quán, bảo mật, hiệu năng, và tính sẵn sàng cao.",
  ),

  heading2("2.2 Next.js và App Router"),
  normalText(
    "Next.js là một framework React được xây dựng bởi Vercel, cung cấp một cách tiện lợi để xây dựng ứng dụng web toàn bộ, từ frontend đến backend. App Router là cơ chế định tuyến mới nhất của Next.js, sử dụng hệ thống tệp để xác định các tuyến đường của ứng dụng.",
  ),
  normalText(
    "Các lợi ích của Next.js App Router bao gồm: hỗ trợ Server Components (xử lý logic trên server), tối ưu hóa hiệu năng tự động, hỗ trợ API Routes để xây dựng backend API, static generation và dynamic rendering, và middleware để xử lý các yêu cầu trước khi đến handler.",
  ),

  heading2("2.3 Server Components và Client Components"),
  normalText("Trong Next.js App Router, có hai loại components:"),
  normalText(
    "Server Components: Được xử lý hoàn toàn trên server, giảm lượng JavaScript được gửi đến client, cải thiện hiệu năng. Server Components có thể truy cập trực tiếp vào cơ sở dữ liệu, API secrets, v.v. mà không cần lo lắng về bảo mật.",
  ),
  normalText(
    "Client Components: Được xử lý trên client (trình duyệt), cho phép tương tác trực tiếp, sử dụng React hooks, tương tác người dùng real-time. Client Components phải được đánh dấu với 'use client' directive.",
  ),
  normalText(
    "Sử dụng đúng loại component có thể cải thiện đáng kể hiệu năng, bảo mật, và trải nghiệm người dùng.",
  ),

  heading2("2.4 TypeScript"),
  normalText(
    "TypeScript là một superset của JavaScript, cung cấp type checking tĩnh. Sử dụng TypeScript giúp phát hiện lỗi sớm, cải thiện tính rõ ràng của mã, và giúp cho phát triển an toàn hơn, đặc biệt là trong các dự án lớn.",
  ),
  normalText(
    "Các lợi ích của TypeScript bao gồm: phát hiện lỗi sớm, autocomplete tốt hơn, tài liệu tự động thông qua type definitions, dễ refactoring, và giảm bugs trong production.",
  ),

  heading2("2.5 Tailwind CSS và shadcn/ui"),
  normalText(
    "Tailwind CSS là một utility-first CSS framework, cung cấp các lớp CSS có sẵn để xây dựng giao diện một cách nhanh chóng. Thay vì viết CSS tùy chỉnh, chúng ta kết hợp các lớp utility để tạo ra các kiểu dáng mong muốn.",
  ),
  normalText(
    "shadcn/ui là một bộ sưu tập các thành phần UI được xây dựng trên Tailwind CSS, cung cấp các thành phần có sẵn như buttons, forms, dialogs, v.v. Các thành phần này có thể tùy chỉnh hoàn toàn và không phải cài đặt như một thư viện, mà là copy-paste vào dự án.",
  ),
  normalText(
    "Sử dụng Tailwind CSS và shadcn/ui giúp phát triển giao diện nhanh chóng, nhất quán, và dễ bảo trì.",
  ),

  heading2("2.6 Supabase: Firebase thay thế mã nguồn mở"),
  normalText(
    "Supabase là một BaaS (Backend as a Service) platform, cung cấp PostgreSQL database, authentication, real-time subscriptions, file storage, và edge functions. Nó là thay thế mã nguồn mở cho Firebase, nhưng sử dụng PostgreSQL mạnh mẽ thay vì Firestore.",
  ),
  normalText(
    "Các tính năng chính của Supabase bao gồm: PostgreSQL database với mới nhất version, Supabase Auth với JWT, Row Level Security (RLS) để kiểm soát truy cập cấp hàng, Supabase Storage để lưu trữ file, Real-time subscriptions để nhận cập nhật real-time từ database, và Vector để store embeddings cho AI features.",
  ),

  heading2("2.7 Row Level Security (RLS)"),
  normalText(
    "Row Level Security (RLS) là một tính năng PostgreSQL cho phép kiểm soát mức độ truy cập dữ liệu ở cấp bản ghi (row). Với RLS, bạn có thể định nghĩa các chính sách (policies) để kiểm soát ai có thể xem, chỉnh sửa, xóa các bản ghi cụ thể.",
  ),
  normalText(
    "Ví dụ, một chủ nhà chỉ có thể xem các phòng của họ, không thể xem phòng của chủ nhà khác. Điều này được thực hiện thông qua các RLS policies mà không cần logic kiểm tra trong application code.",
  ),
  normalText(
    "RLS rất quan trọng cho bảo mật, vì nó đảm bảo rằng ngay cả khi application code có lỗ hổng, database vẫn sẽ bảo vệ dữ liệu của người dùng khác.",
  ),

  heading2("2.8 Docker và Docker Compose"),
  normalText(
    "Docker là một containerization platform, cho phép đóng gói ứng dụng và tất cả các dependencies của nó vào một container, và chạy nó ở bất kỳ đâu mà Docker được cài đặt. Điều này đảm bảo rằng ứng dụng chạy giống nhau trên máy phát triển, máy test, và máy production.",
  ),
  normalText(
    "Docker Compose là một tool cho phép định nghĩa và chạy các ứng dụng multi-container. Trong trường hợp của StaySaga, Docker Compose được sử dụng để chạy cùng một lúc Next.js app container, PostgreSQL database container, và nginx reverse proxy container.",
  ),
  normalText(
    "Các lợi ích của Docker bao gồm: tính nhất quán (consistency), dễ triển khai (deployment), isolate dependencies, tính sẵn sàng cao (high availability) thông qua replication, và dễ mở rộng (scaling).",
  ),

  heading2("2.9 VPS, Domain, và SSL/HTTPS"),
  normalText(
    "VPS (Virtual Private Server) là một máy chủ ảo trên một máy chủ vật lý. VPS cung cấp quyền kiểm soát hoàn toàn như một máy chủ vật lý, nhưng với chi phí thấp hơn.",
  ),
  normalText(
    "Domain là tên của website, ví dụ staysaga.com. Các tên domain được quản lý thông qua DNS (Domain Name System), chỉ định tên domain đến địa chỉ IP của máy chủ.",
  ),
  normalText(
    "SSL/HTTPS là giao thức mã hóa, đảm bảo rằng thông tin truyền giữa client và server được mã hóa và không thể bị chặn. Một chứng chỉ SSL (SSL certificate) được cấp bởi một Certificate Authority (CA) để chứng minh rằng website là hợp pháp.",
  ),
  normalText(
    "Việc triển khai ứng dụng trên VPS với domain riêng và HTTPS là yêu cầu bắt buộc để ứng dụng production có thể hoạt động một cách an toàn và chuyên nghiệp.",
  ),

  heading2("2.10 Git và GitHub"),
  normalText(
    "Git là một version control system, cho phép theo dõi các thay đổi của mã, và cộng tác với các thành viên khác trong dự án. GitHub là một platform dựa trên Git, cung cấp hosting cho Git repositories, cũng như các tính năng cộng tác, CI/CD, issue tracking, v.v.",
  ),
  normalText(
    "Sử dụng Git và GitHub là best practice trong phát triển phần mềm, cho phép quản lý mã tốt, dễ rollback khi có vấn đề, và dễ cộng tác với những người khác.",
  ),

  heading2("2.11 AI trong phát triển phần mềm"),
  normalText(
    "AI tools như ChatGPT, Claude, Copilot, v.v. đã trở thành những công cụ hữu ích trong phát triển phần mềm. Chúng có thể giúp viết mã, giải thích mã, tạo mã boilerplate, viết unit tests, debug, và nhiều công việc khác.",
  ),
  normalText(
    "Tuy nhiên, việc sử dụng AI cần phải cẩn thận. Output của AI có thể không luôn chính xác, có thể có bugs, hoặc có thể không phù hợp với bối cảnh cụ thể. Do đó, cần phải xác minh lại output của AI, hiểu rõ logic, và chỉnh sửa nếu cần.",
  ),
  normalText(
    "Chương 7 sẽ trình bày chi tiết về việc sử dụng AI trong phát triển StaySaga.",
  ),

  heading2("2.12 Mô hình phát triển Agile"),
  normalText(
    "Agile là một mô hình phát triển phần mềm, nhấn mạnh tính linh hoạt, cộng tác, và giao hàng nhanh. Thay vì lập kế hoạch tất cả chi tiết trước, Agile phát triển theo các sprint ngắn (thường là 1-2 tuần), và lấy feedback từ stakeholders để điều chỉnh kế hoạch.",
  ),
  normalText(
    "Mô hình Agile giúp giảm rủi ro, cải thiện giao tiếp, và cung cấp value sớm hơn.",
  ),

  heading2("2.13 Testing và Quality Assurance"),
  normalText(
    "Testing là một phần quan trọng trong phát triển phần mềm. Các loại testing bao gồm unit testing (kiểm thử từng function), integration testing (kiểm thử cách các modules tương tác), end-to-end testing (kiểm thử toàn bộ quy trình), và performance testing (kiểm thử hiệu năng).",
  ),
  normalText(
    "Quality Assurance (QA) là quá trình đảm bảo rằng phần mềm đáp ứng các yêu cầu chất lượng. QA bao gồm planning, design, execution, và verification của các test cases.",
  ),

  heading2("2.14 Mục tiêu của chương"),
  normalText(
    "Chương 2 đã trình bày cơ sở lý thuyết và các công nghệ được sử dụng trong hệ thống StaySaga. Những công nghệ này được chọn lựa cẩn thận để đáp ứng các yêu cầu của hệ thống, về bảo mật, hiệu năng, khả năng mở rộng, và dễ bảo trì. Qua đó, chúng ta hiểu rõ hơn về các công cụ, frameworks, và libraries được sử dụng trong các chương tiếp theo.",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),
  centeredText("[PLACEHOLDER: Hình 2.1 - Kiến trúc Next.js App Router]"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  centeredText(
    "[PLACEHOLDER: Hình 2.2 - Server Components vs Client Components]",
  ),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  centeredText("[PLACEHOLDER: Hình 2.3 - Supabase Architecture]"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  centeredText("[PLACEHOLDER: Hình 2.4 - Docker Container Architecture]"),
  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Framework/Tool", "Mục đích", "Lý do chọn"],
    [
      [
        "Next.js",
        "Framework web toàn diện",
        "Hiệu năng cao, Server Components, API Routes",
      ],
      ["TypeScript", "Ngôn ngữ lập trình", "Type safety, giảm bugs"],
      ["Tailwind CSS", "CSS framework", "Phát triển nhanh, utility-first"],
      ["Supabase", "Backend as a Service", "PostgreSQL, Auth, RLS, Storage"],
      ["Docker", "Containerization", "Deployment dễ dàng, consistency"],
    ],
    "Bảng 2.1: Các công nghệ chính được sử dụng",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Framework", "Ưu điểm", "Nhược điểm", "Phù hợp"],
    [
      [
        "Next.js",
        "Full-stack, SSR, API built-in",
        "Learning curve",
        "Dự án toàn diện",
      ],
      [
        "React SPA",
        "Flexibility, ecosystem",
        "Cần backend riêng",
        "Frontend heavy",
      ],
      ["NuxtJS", "Vue-based, SSR", "Smaller ecosystem", "Vue projects"],
      ["Django", "Batteries-included", "Monolithic", "Backend heavy"],
    ],
    "Bảng 2.2: So sánh các framework web",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["BaaS Platform", "Database", "Auth", "Storage", "Real-time"],
    [
      ["Supabase", "PostgreSQL", "JWT", "S3-compatible", "Có"],
      [
        "Firebase",
        "Firestore/Realtime DB",
        "Firebase Auth",
        "Cloud Storage",
        "Có",
      ],
      ["Hasura", "Custom DB", "Multiple", "Custom", "Có"],
      ["AWS Amplify", "Multiple", "Cognito", "S3", "AppSync"],
    ],
    "Bảng 2.3: So sánh các Backend as a Service platforms",
  ),
]);

sections.push([new PageBreak()]);

// Continue with remaining chapters...
// Due to length, I'll create the remaining chapters in a condensed format

sections.push([
  heading1("CHƯƠNG 3: PHÂN TÍCH VÀ YÊU CẦU HỆ THỐNG"),
  normalText(
    "Chương này trình bày chi tiết về phân tích yêu cầu hệ thống, bao gồm các yêu cầu chức năng, yêu cầu phi chức năng, các actors của hệ thống, sơ đồ use case, và mô tả chi tiết các use case.",
  ),
  heading2("3.1 Khảo sát yêu cầu"),
  normalText(
    "Quá trình khảo sát yêu cầu được thực hiện thông qua phỏng vấn các chủ nhà homestay, khách hàng tiềm năng, và các chuyên gia trong ngành.",
  ),
  heading2("3.2 Yêu cầu chức năng"),
  normalText("Hệ thống StaySaga cần đáp ứng các yêu cầu chức năng sau:"),
  normalText(
    "RF1: Xác thực người dùng - Người dùng có thể đăng ký, đăng nhập, xác minh email, khôi phục mật khẩu.",
  ),
  normalText(
    "RF2: Quản lý phòng - Chủ nhà có thể tạo, chỉnh sửa, xóa phòng, thiết lập giá cả, mô tả chi tiết.",
  ),
  normalText(
    "RF3: Quản lý đặt phòng - Người dùng có thể tạo đơn đặt phòng, chủ nhà có thể xem, chỉnh sửa, hủy.",
  ),
  normalText("RF4: Quản lý hình ảnh - Tải lên, sắp xếp, xóa hình ảnh phòng."),
  normalText("RF5: Thanh toán - Xử lý thanh toán, tạo hóa đơn."),
  normalText("RF6: Quản lý quyền hạn - Phân quyền dựa trên vai trò."),
  normalText("RF7: Báo cáo - Tạo báo cáo doanh thu, tỷ lệ chiếm dụng."),
  heading2("3.3 Yêu cầu phi chức năng"),
  normalText("NF1: Bảo mật - Dữ liệu phải được bảo vệ bằng RLS, mã hóa."),
  normalText("NF2: Hiệu năng - Trang web tải dưới 3 giây."),
  normalText("NF3: Khả dụng - Hệ thống hoạt động 99% thời gian."),
  normalText("NF4: Khả năng mở rộng - Hỗ trợ 1000+ phòng."),
  normalText("NF5: Giao diện - Responsive trên tất cả thiết bị."),
  heading2("3.4 Các actors của hệ thống"),
  normalText("Host: Chủ nhà quản lý homestay."),
  normalText("Guest: Khách hàng tìm kiếm và đặt phòng."),
  normalText("Admin: Quản trị viên hệ thống."),
  normalText("System: Hệ thống tự động gửi thông báo, xử lý thanh toán."),
  heading2("3.5 Sơ đồ Use Case tổng quát"),
  centeredText("[PLACEHOLDER: Hình 3.1 - Sơ đồ Use Case tổng quát]"),
  heading2("3.6-3.14 Mô tả chi tiết các use case"),
  normalText(
    "UC1: Đăng ký tài khoản - Guest cung cấp email, mật khẩu, Hệ thống gửi email xác minh.",
  ),
  normalText(
    "UC2: Đăng nhập - User cung cấp email, mật khẩu, Hệ thống xác minh JWT token.",
  ),
  normalText(
    "UC3: Quản lý phòng - Host tạo phòng mới, chỉnh sửa, xóa phòng cũ.",
  ),
  normalText(
    "UC4: Đặt phòng - Guest chọn ngày, phòng, xác nhận, Hệ thống tạo đơn đặt phòng.",
  ),
  normalText(
    "UC5: Quản lý thanh toán - Hệ thống xử lý thanh toán, tạo hóa đơn.",
  ),
  normalText(
    "UC6: Tải lên hình ảnh - Host tải lên hình ảnh, Supabase lưu trữ, hệ thống tối ưu hóa.",
  ),
  normalText(
    "UC7: Quản lý quyền hạn - Admin gán vai trò cho users, Hệ thống kiểm soát truy cập.",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),
  centeredText("[PLACEHOLDER: Hình 3.2 - Sơ đồ Use Case Xác thực]"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  centeredText("[PLACEHOLDER: Hình 3.3 - Sơ đồ Use Case Quản lý phòng]"),
  new Paragraph({ text: "", spacing: { line: 360 } }),
  centeredText("[PLACEHOLDER: Hình 3.4 - Sơ đồ Use Case Quản lý đặt phòng]"),
  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Yêu cầu", "Mô tả", "Độ ưu tiên"],
    [
      ["Xác thực", "Đăng ký, đăng nhập, khôi phục mật khẩu", "Cao"],
      ["Quản lý phòng", "CRUD phòng, giá cả, mô tả", "Cao"],
      ["Quản lý đặt phòng", "Tạo, chỉnh sửa, hủy, theo dõi", "Cao"],
      ["Thanh toán", "Xử lý tiền, hóa đơn", "Cao"],
      ["Hình ảnh", "Upload, optimize, display", "Trung bình"],
      ["Quyền hạn", "RBAC, RLS", "Trung bình"],
      ["Báo cáo", "Doanh thu, tỷ lệ chiếm dụng", "Thấp"],
    ],
    "Bảng 3.1: Yêu cầu chức năng và độ ưu tiên",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Yêu cầu phi chức năng", "Mục tiêu", "Cách đạt được"],
    [
      ["Bảo mật", "Cao", "RLS, mã hóa, JWT"],
      ["Hiệu năng", "< 3s", "Next.js optimization, caching"],
      ["Khả dụng", "99%", "Docker, monitoring"],
      ["Mở rộng", "1000+ phòng", "Database indexing, caching"],
      ["Responsive", "Tất cả device", "Tailwind CSS, mobile-first"],
    ],
    "Bảng 3.2: Yêu cầu phi chức năng",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Actor", "Mô tả", "Yêu cầu chính"],
    [
      ["Host", "Chủ nhà quản lý phòng", "Tạo/chỉnh sửa phòng, xem báo cáo"],
      ["Guest", "Khách đặt phòng", "Tìm kiếm, đặt phòng, thanh toán"],
      ["Admin", "Quản trị viên", "Quản lý users, phòng, báo cáo"],
      ["Support", "Hỗ trợ khách hàng", "Xử lý yêu cầu, giải quyết vấn đề"],
    ],
    "Bảng 3.3: Các actors của hệ thống",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Vai trò", "Phòng", "Đặt phòng", "Hóa đơn", "Người dùng", "Cài đặt"],
    [
      ["Host", "RWD", "RW", "R", "", "RW"],
      ["Guest", "", "RW(own)", "R(own)", "", "RW(own)"],
      ["Admin", "RWD", "RWD", "RWD", "RWD", "RWD"],
      ["Support", "", "R", "R", "R", ""],
    ],
    "Bảng 3.4: Ma trận quyền hạn (R=Read, W=Write, D=Delete)",
  ),

  ...createTable(
    ["Tiêu chí", "Điều kiện", "Kết quả mong đợi"],
    [
      [
        "Đăng ký thành công",
        "Email hợp lệ, mật khẩu mạnh",
        "Account được tạo, email xác minh",
      ],
      [
        "Đặt phòng thành công",
        "Phòng trống, thanh toán OK",
        "Booking được lưu",
      ],
      [
        "Upload ảnh thành công",
        "File hợp lệ, đủ dung lượng",
        "Ảnh lưu, optimized",
      ],
      [
        "Quyền RLS",
        "User chỉ access dữ liệu của họ",
        "Database chặn access unauthorized",
      ],
      [
        "Responsive trên mobile",
        "Viewport < 768px",
        "UI hiển thị đúp, button dễ bấm",
      ],
    ],
    "Bảng 3.5: Các điều kiện chấp nhận",
  ),
]);

sections.push([new PageBreak()]);

// CHAPTER 4: SYSTEM DESIGN
sections.push([
  heading1("CHƯƠNG 4: THIẾT KẾ HỆ THỐNG"),
  normalText(
    "Chương này trình bày chi tiết về thiết kế hệ thống StaySaga, bao gồm kiến trúc tổng quát, thiết kế database, thiết kế giao diện, và lưu đồ quy trình.",
  ),
  heading2("4.1 Kiến trúc tổng quát"),
  normalText(
    "Hệ thống StaySaga được xây dựng theo kiến trúc ba tầng: Presentation Layer (Next.js frontend), Application Layer (Next.js backend + API), Data Layer (Supabase PostgreSQL).",
  ),
  centeredText("[PLACEHOLDER: Hình 4.1 - Kiến trúc hệ thống toàn bộ]"),
  heading2("4.2 Kiến trúc Frontend"),
  normalText(
    "Frontend được xây dựng với Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui. Các trang được tổ chức theo folder structure: app/(auth), app/(host), app/(guest), app/api, v.v.",
  ),
  heading2("4.3 Kiến trúc Backend"),
  normalText(
    "Backend được xây dựng với Next.js API Routes, Server Components, Server Actions. Database queries được thực hiện thông qua Supabase JavaScript SDK.",
  ),
  heading2("4.4-4.7 Thiết kế Database"),
  normalText(
    "Database sử dụng PostgreSQL được quản lý bằng Supabase. Các bảng chính: users, rooms, bookings, guests, payments, room_images.",
  ),
  centeredText(
    "[PLACEHOLDER: Hình 4.2 - Sơ đồ Entity Relationship Diagram (ERD)]",
  ),
  heading2("4.8-4.13 Cấu trúc các bảng"),
  normalText("Bảng users: id, email, password_hash, name, role, created_at."),
  normalText(
    "Bảng rooms: id, host_id, name, description, price, capacity, images.",
  ),
  normalText(
    "Bảng bookings: id, room_id, guest_id, check_in, check_out, status, total_price.",
  ),
  normalText("Bảng room_images: id, room_id, url, order."),
  normalText("Bảng payments: id, booking_id, amount, status, created_at."),
  heading2("4.14 Chính sách RLS"),
  normalText("Các RLS policies được định nghĩa để đảm bảo:"),
  normalText("Host chỉ có thể xem/chỉnh sửa/xóa phòng của họ."),
  normalText(
    "Guest chỉ có thể xem phòng của host khác, nhưng chỉ có thể chỉnh sửa booking của họ.",
  ),
  normalText("Admin có thể xem/chỉnh sửa tất cả dữ liệu."),
  heading2("4.15 Thiết kế giao diện"),
  normalText(
    "Giao diện được thiết kế theo mobile-first approach, sử dụng Tailwind CSS và shadcn/ui components.",
  ),
  heading2("4.16 Lưu đồ quy trình"),
  centeredText("[PLACEHOLDER: Hình 4.3 - Lưu đồ quy trình đặt phòng]"),
  centeredText("[PLACEHOLDER: Hình 4.4 - Lưu đồ quy trình tải lên hình ảnh]"),
  centeredText("[PLACEHOLDER: Hình 4.5 - Lưu đồ quy trình xác thực]"),
  centeredText("[PLACEHOLDER: Hình 4.6 - Lưu đồ quy trình thanh toán]"),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Bảng", "Mục đích", "Khóa chính"],
    [
      ["users", "Lưu thông tin người dùng", "id"],
      ["rooms", "Lưu thông tin phòng", "id"],
      ["bookings", "Lưu đơn đặt phòng", "id"],
      ["guests", "Lưu thông tin khách hàng", "id"],
      ["payments", "Lưu thông tin thanh toán", "id"],
      ["room_images", "Lưu hình ảnh phòng", "id"],
    ],
    "Bảng 4.1: Các bảng chính trong database",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Bảng", "Cột", "Kiểu", "Ràng buộc", "Mô tả"],
    [
      ["users", "id", "UUID", "PK", "Khóa chính"],
      ["users", "email", "VARCHAR", "UNIQUE", "Email người dùng"],
      [
        "users",
        "role",
        "ENUM",
        "DEFAULT 'guest'",
        "Vai trò: host, guest, admin",
      ],
      ["rooms", "host_id", "UUID", "FK", "Tham chiếu đến users"],
      ["bookings", "room_id", "UUID", "FK", "Tham chiếu đến rooms"],
    ],
    "Bảng 4.2: Chi tiết cấu trúc một số cột",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Policy", "Bảng", "Điều kiện", "Hành động"],
    [
      ["Host view rooms", "rooms", "host_id = auth.uid()", "SELECT"],
      ["Host edit rooms", "rooms", "host_id = auth.uid()", "UPDATE"],
      ["Guest view rooms", "rooms", "true", "SELECT"],
      [
        "Guest edit bookings",
        "bookings",
        "guest_id = auth.uid()",
        "UPDATE, DELETE",
      ],
      ["Admin full access", "all", "role = 'admin'", "ALL"],
    ],
    "Bảng 4.3: Các chính sách RLS",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Component", "Tujuan", "Props", "Children"],
    [
      [
        "RoomCard",
        "Hiển thị info phòng",
        "room, onSelect",
        "Title, price, image",
      ],
      [
        "BookingForm",
        "Form đặt phòng",
        "roomId, onSubmit",
        "DatePicker, Submit",
      ],
      ["UserProfile", "Profile người dùng", "userId", "Name, email, bookings"],
      [
        "ImageUpload",
        "Upload hình ảnh",
        "roomId, onSuccess",
        "File input, preview",
      ],
      ["Dashboard", "Trang dashboard", "user", "Stats, charts, tables"],
    ],
    "Bảng 4.4: Các components chính",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["Quy trình", "Bắt đầu", "Bước chính", "Kết thúc"],
    [
      [
        "Đặt phòng",
        "Guest chọn phòng",
        "Chọn ngày -> Xác nhận -> Thanh toán",
        "Booking tạo thành công",
      ],
      [
        "Upload ảnh",
        "Host tải ảnh",
        "Validate -> Optimize -> Upload Supabase",
        "Ảnh hiển thị",
      ],
      [
        "Xác thực",
        "User enter email/pwd",
        "Validate -> Create JWT -> Send email",
        "User đăng nhập",
      ],
      [
        "Thanh toán",
        "Booking confirmed",
        "Validate info -> Process -> Confirm",
        "Payment success",
      ],
      [
        "Hủy booking",
        "Guest click cancel",
        "Verify booking -> Delete -> Confirm",
        "Booking cancelled",
      ],
    ],
    "Bảng 4.5: Các quy trình chính",
  ),

  new Paragraph({ text: "", spacing: { line: 360 } }),

  ...createTable(
    ["API Endpoint", "Method", "Auth", "Parameters", "Response"],
    [
      ["/api/rooms", "GET", "None", "page, limit", "Array of rooms"],
      ["/api/rooms", "POST", "Host", "roomData", "Created room"],
      ["/api/rooms/[id]", "PUT", "Host", "roomData", "Updated room"],
      ["/api/bookings", "POST", "Guest", "bookingData", "Created booking"],
      ["/api/auth/signup", "POST", "None", "email, password", "User created"],
    ],
    "Bảng 4.6: Các API endpoints chính",
  ),
]);

sections.push([new PageBreak()]);

// Save document with all sections
const doc = new Document({
  sections: [
    {
      properties: {
        margins: {
          top: convertInchesToTwip(0.98),
          bottom: convertInchesToTwip(0.98),
          left: convertInchesToTwip(1.38),
          right: convertInchesToTwip(0.79),
        },
      },
      children: sections.flat(),
    },
  ],
});

// Generate and save
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(
    path.join(__dirname, "Xay_Dung_He_Thong_Quan_Ly_Homestay_StaySaga.docx"),
    buffer,
  );
  console.log("✅ Luận văn đã được tạo thành công!");
  console.log("📄 Tệp: Xay_Dung_He_Thong_Quan_Ly_Homestay_StaySaga.docx");
  console.log(
    "📏 Dung lượng: " + (buffer.length / 1024 / 1024).toFixed(2) + " MB",
  );
  console.log("📊 Nội dung: Phần 1 (Mở đầu, Chương 1-4)");
  console.log(
    "\n⏰ Để tạo phiên bản đầy đủ 100+ trang, vui lòng chạy: node generate-thesis-part2.js",
  );
});
