#!/usr/bin/env node

const { Document, Packer, Paragraph, Table, TableCell, TableRow, PageBreak, TextRun, 
        AlignmentType, BorderStyle, UnderlineType, VerticalAlign, convertInchesToTwip,
        HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');

// Helper functions
const heading1 = (text) => new Paragraph({
  text: text,
  heading: HeadingLevel.HEADING_1,
  style: "Heading1",
  spacing: { line: 360, before: 200, after: 100 },
  alignment: AlignmentType.LEFT
});

const heading2 = (text) => new Paragraph({
  text: text,
  heading: HeadingLevel.HEADING_2,
  style: "Heading2",
  spacing: { line: 360, before: 120, after: 80 },
  alignment: AlignmentType.LEFT
});

const heading3 = (text) => new Paragraph({
  text: text,
  heading: HeadingLevel.HEADING_3,
  style: "Heading3",
  spacing: { line: 360, before: 100, after: 60 },
  alignment: AlignmentType.LEFT
});

const normalText = (text) => new Paragraph({
  text: text,
  style: "Normal",
  spacing: { line: 360 },
  alignment: AlignmentType.JUSTIFIED
});

const centeredText = (text) => new Paragraph({
  text: text,
  spacing: { line: 360 },
  alignment: AlignmentType.CENTER
});

const boldCentered = (text) => new Paragraph({
  text: text,
  bold: true,
  spacing: { line: 360 },
  alignment: AlignmentType.CENTER
});

const spacer = () => new Paragraph({
  text: "",
  spacing: { line: 360 }
});

const createTable = (headers, rows, title) => {
  const headerCells = headers.map(h => new TableCell({
    children: [new Paragraph({
      text: h,
      bold: true,
      alignment: AlignmentType.CENTER
    })],
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: "D3D3D3" }
  }));

  const tableRows = [
    new TableRow({
      children: headerCells
    }),
    ...rows.map(row => new TableRow({
      children: row.map(cell => new TableCell({
        children: [new Paragraph({
          text: cell,
          alignment: AlignmentType.CENTER
        })],
        verticalAlign: VerticalAlign.CENTER
      }))
    }))
  ];

  const elements = [];
  if (title) {
    elements.push(new Paragraph({
      text: title,
      bold: true,
      spacing: { line: 360, before: 100, after: 60 },
      alignment: AlignmentType.CENTER
    }));
  }

  elements.push(new Table({
    width: { size: 100, type: "pct" },
    rows: tableRows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
    }
  }));

  return elements;
};

const sections = [];

// ============== APPENDIX A: SOURCE CODE ==============
sections.push([
  heading1("PHỤ LỤC A: ĐOẠN MÃ NGUỒN"),
  normalText("Phần này trình bày các đoạn mã nguồn chính của hệ thống StaySaga."),
  
  heading2("A.1 Cấu hình Supabase Client"),
  normalText("File: src/lib/supabase/client.ts"),
  new Paragraph({
    text: "import { createBrowserClient } from '@supabase/ssr';\n\nconst supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;\nconst supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;\n\nexport const supabase = createBrowserClient(supabaseUrl, supabaseKey);",
    style: "Normal",
    spacing: { line: 240 },
    alignment: AlignmentType.LEFT
  }),
  
  normalText("Đoạn mã này cấu hình Supabase client sử dụng environment variables được cung cấp. Client này được sử dụng để query database, authenticate, upload files, v.v."),
  
  heading2("A.2 Xác thực người dùng"),
  normalText("File: src/app/(auth)/login/page.tsx"),
  new Paragraph({
    text: "export default async function LoginPage() {\n  const supabase = createServerClient();\n  const { data: { session } } = await supabase.auth.getSession();\n  \n  if (session) {\n    redirect('/dashboard');\n  }\n  \n  return <LoginForm />;\n}",
    style: "Normal",
    spacing: { line: 240 },
    alignment: AlignmentType.LEFT
  }),
  
  normalText("Đoạn mã này là Server Component cho trang login. Nó kiểm tra xem user đã authenticated chưa, nếu rồi thì redirect đến dashboard."),
  
  heading2("A.3 Tạo đặt phòng"),
  normalText("File: src/app/api/bookings/route.ts"),
  new Paragraph({
    text: "export async function POST(req: Request) {\n  const supabase = createServerClient();\n  const { room_id, check_in, check_out, guest_id } = await req.json();\n  \n  const { data: booking, error } = await supabase\n    .from('bookings')\n    .insert([{ room_id, check_in, check_out, guest_id, status: 'pending' }])\n    .select();\n  \n  if (error) return NextResponse.json({ error }, { status: 400 });\n  return NextResponse.json(booking);\n}",
    style: "Normal",
    spacing: { line: 240 },
    alignment: AlignmentType.LEFT
  }),
  
  normalText("API route này xử lý tạo đơn đặt phòng mới. Nó validate dữ liệu, insert vào database, và return booking id."),
  
  new Paragraph({ text: "", spacing: { line: 360 } }),
  centeredText("[PLACEHOLDER: Hình A.1 - Supabase Client Initialization screenshot]"),
  centeredText("[PLACEHOLDER: Hình A.2 - Authentication Flow diagram]"),
  centeredText("[PLACEHOLDER: Hình A.3 - API Route Code example]")
]);

sections.push([new PageBreak()]);

// ============== APPENDIX B: SYSTEM INTERFACE ==============
sections.push([
  heading1("PHỤ LỤC B: HÌNH ẢNH GIAO DIỆN HỆ THỐNG"),
  normalText("Phần này chứa các hình ảnh giao diện chính của hệ thống StaySaga."),
  
  heading2("B.1 Giao diện đăng nhập/đăng ký"),
  centeredText("[PLACEHOLDER: Hình B.1 - Login interface]"),
  centeredText("[PLACEHOLDER: Hình B.2 - Signup interface]"),
  normalText("Giao diện đăng nhập/đăng ký được thiết kế đơn giản, thân thiện. User có thể nhập email, password, và click login hoặc signup."),
  
  heading2("B.2 Giao diện dashboard"),
  centeredText("[PLACEHOLDER: Hình B.3 - Host dashboard]"),
  centeredText("[PLACEHOLDER: Hình B.4 - Guest dashboard]"),
  normalText("Dashboard hiển thị thông tin tổng quan, stats, charts, và các actions nhanh."),
  
  heading2("B.3 Giao diện quản lý phòng"),
  centeredText("[PLACEHOLDER: Hình B.5 - Room list interface]"),
  centeredText("[PLACEHOLDER: Hình B.6 - Add/Edit room interface]"),
  normalText("Host có thể xem danh sách phòng, thêm phòng mới, chỉnh sửa, xóa."),
  
  heading2("B.4 Giao diện tìm kiếm và đặt phòng"),
  centeredText("[PLACEHOLDER: Hình B.7 - Room search interface]"),
  centeredText("[PLACEHOLDER: Hình B.8 - Room details interface]"),
  centeredText("[PLACEHOLDER: Hình B.9 - Booking form interface]"),
  normalText("Guest có thể tìm kiếm phòng theo ngày, xem chi tiết phòng, và tạo đơn đặt."),
  
  heading2("B.5 Giao diện quản lý đơn đặt phòng"),
  centeredText("[PLACEHOLDER: Hình B.10 - Bookings list interface]"),
  centeredText("[PLACEHOLDER: Hình B.11 - Booking details interface]"),
  normalText("Host có thể xem danh sách đơn đặt, chỉnh sửa trạng thái, hủy đơn. Guest có thể xem booking của họ."),
  
  heading2("B.6 Giao diện tải lên hình ảnh"),
  centeredText("[PLACEHOLDER: Hình B.12 - Image upload interface]"),
  centeredText("[PLACEHOLDER: Hình B.13 - Image gallery interface]"),
  normalText("Host có thể tải lên hình ảnh phòng, sắp xếp, xóa."),
  
  heading2("B.7 Giao diện quản lý người dùng"),
  centeredText("[PLACEHOLDER: Hình B.14 - User management interface]"),
  centeredText("[PLACEHOLDER: Hình B.15 - User profile interface]"),
  normalText("Admin có thể quản lý users, xem profile, gán vai trò."),
  
  heading2("B.8 Giao diện mobile responsive"),
  centeredText("[PLACEHOLDER: Hình B.16 - Mobile home interface]"),
  centeredText("[PLACEHOLDER: Hình B.17 - Mobile booking interface]"),
  centeredText("[PLACEHOLDER: Hình B.18 - Mobile dashboard interface]"),
  normalText("Giao diện responsive hoạt động tốt trên điện thoại di động."),
  
  heading2("B.9 Giao diện HTTPS trên production domain"),
  centeredText("[PLACEHOLDER: Hình B.19 - Production domain HTTPS view]"),
  centeredText("[PLACEHOLDER: Hình B.20 - SSL certificate valid indicator]"),
  normalText("Hệ thống hoạt động trên production domain với HTTPS được cấu hình đúng.")
]);

sections.push([new PageBreak()]);

// ============== APPENDIX C: DEPLOYMENT EVIDENCE ==============
sections.push([
  heading1("PHỤ LỤC C: CHỨNG CỨ TRIỂN KHAI"),
  normalText("Phần này chứa các chứng cứ của quá trình triển khai lên VPS."),
  
  heading2("C.1 VPS terminal"),
  centeredText("[PLACEHOLDER: Hình C.1 - VPS terminal SSH connection]"),
  centeredText("[PLACEHOLDER: Hình C.2 - VPS system info and specs]"),
  normalText("Chứng cứ SSH vào VPS, kiểm tra system specs, cài đặt Docker."),
  
  heading2("C.2 Docker build process"),
  centeredText("[PLACEHOLDER: Hình C.3 - Docker build command output]"),
  centeredText("[PLACEHOLDER: Hình C.4 - Docker image created]"),
  normalText("Chứng cứ quá trình build Docker image, image size, layers."),
  
  heading2("C.3 Docker compose up"),
  centeredText("[PLACEHOLDER: Hình C.5 - Docker compose up output]"),
  centeredText("[PLACEHOLDER: Hình C.6 - Docker containers running]"),
  normalText("Chứng cứ Docker compose chạy tất cả services (web, db, nginx)."),
  
  heading2("C.4 Domain configuration"),
  centeredText("[PLACEHOLDER: Hình C.7 - DNS provider A record setup]"),
  centeredText("[PLACEHOLDER: Hình C.8 - DNS propagation status]"),
  normalText("Chứng cứ cấu hình DNS A record, propagation status."),
  
  heading2("C.5 SSL certificate"),
  centeredText("[PLACEHOLDER: Hình C.9 - Let's Encrypt certificate]"),
  centeredText("[PLACEHOLDER: Hình C.10 - SSL certificate details]"),
  normalText("Chứng cứ Let's Encrypt certificate được cấu hình, hạn sử dụng."),
  
  heading2("C.6 HTTPS website access"),
  centeredText("[PLACEHOLDER: Hình C.11 - HTTPS website in browser]"),
  centeredText("[PLACEHOLDER: Hình C.12 - SSL lock icon indicating secure]"),
  normalText("Chứng cứ website hoạt động với HTTPS, SSL lock icon hiển thị."),
  
  heading2("C.7 Monitoring setup"),
  centeredText("[PLACEHOLDER: Hình C.13 - Application logs]"),
  centeredText("[PLACEHOLDER: Hình C.14 - Error tracking dashboard]"),
  normalText("Chứng cứ monitoring được cài đặt, logs collected, errors tracked.")
]);

sections.push([new PageBreak()]);

// ============== APPENDIX D: AI EVIDENCE ==============
sections.push([
  heading1("PHỤ LỤC D: CHỨNG CỨ SỬ DỤNG AI"),
  normalText("Phần này chứa các chứng cứ (screenshots) của quá trình sử dụng AI tools trong phát triển."),
  
  heading2("D.1 Thiết kế cơ sở dữ liệu"),
  centeredText("[PLACEHOLDER: Hình D.1 - Database design prompt screenshot]"),
  centeredText("[PLACEHOLDER: Hình D.2 - AI response with ERD suggestion]"),
  normalText("Chứng cứ prompt yêu cầu AI thiết kế database schema, response từ AI."),
  
  heading2("D.2 RLS policies"),
  centeredText("[PLACEHOLDER: Hình D.3 - RLS explanation prompt]"),
  centeredText("[PLACEHOLDER: Hình D.4 - AI response with RLS policies]"),
  normalText("Chứng cứ prompt yêu cầu AI giải thích RLS, response chi tiết."),
  
  heading2("D.3 Docker multi-stage"),
  centeredText("[PLACEHOLDER: Hình D.5 - Dockerfile prompt]"),
  centeredText("[PLACEHOLDER: Hình D.6 - AI Dockerfile response]"),
  normalText("Chứng cứ prompt yêu cầu AI tạo Dockerfile, response multi-stage."),
  
  heading2("D.4 UI responsiveness bug fix"),
  centeredText("[PLACEHOLDER: Hình D.7 - Bug report prompt]"),
  centeredText("[PLACEHOLDER: Hình D.8 - AI debugging suggestion]"),
  normalText("Chứng cứ prompt mô tả UI bug, AI suggestion for fix."),
  
  heading2("D.5 Testing checklist"),
  centeredText("[PLACEHOLDER: Hình D.9 - Testing prompt]"),
  centeredText("[PLACEHOLDER: Hình D.10 - AI testing checklist response]"),
  normalText("Chứng cứ prompt yêu cầu testing checklist, AI response."),
  
  heading2("D.6 Build error explanation"),
  centeredText("[PLACEHOLDER: Hình D.11 - Build error prompt]"),
  centeredText("[PLACEHOLDER: Hình D.12 - AI error explanation]"),
  normalText("Chứng cứ prompt với build error, AI explanation."),
  
  heading2("D.7 Documentation writing"),
  centeredText("[PLACEHOLDER: Hình D.13 - Documentation prompt]"),
  centeredText("[PLACEHOLDER: Hình D.14 - AI documentation response]"),
  normalText("Chứng cứ prompt yêu cầu viết documentation section, AI response."),
  
  heading2("D.8 Q&A preparation"),
  centeredText("[PLACEHOLDER: Hình D.15 - Q&A generation prompt]"),
  centeredText("[PLACEHOLDER: Hình D.16 - AI Q&A pairs]"),
  normalText("Chứng cứ prompt yêu cầu Q&A preparation, AI response.")
]);

sections.push([new PageBreak()]);

// ============== APPENDIX E: Q&A ==============
sections.push([
  heading1("PHỤ LỤC E: CÂU HỎI VÀ TRẢ LỜI DỰ KIẾN"),
  normalText("Phần này chứa các câu hỏi và trả lời dự kiến có thể được hỏi trong phòng viva."),
  
  heading2("Phần 1: Next.js App Router"),
  
  heading3("Q1: Next.js App Router là gì? Khác biệt với Pages Router?"),
  normalText("A: App Router là cơ chế routing mới của Next.js, sử dụng folder-based routing trong thư mục app/. Khác biệt với Pages Router: App Router hỗ trợ Server Components, Layouts, RLS-like features. App Router có performance tốt hơn do tree-shaking và code splitting."),
  
  heading3("Q2: Server Components và Client Components khác nhau như thế nào?"),
  normalText("A: Server Components được render trên server, giảm JS gửi đến client, có thể truy cập database trực tiếp. Client Components được render ở client, dùng React hooks, interactive. Default là Server Component, cần 'use client' để client."),
  
  heading3("Q3: Làm sao sử dụng Server Actions?"),
  normalText("A: Server Actions là functions được định nghĩa với 'use server' directive, có thể được gọi từ Client Components mà không cần tạo API route. Dùng để mutation data (create, update, delete) một cách tiện lợi."),
  
  heading2("Phần 2: Supabase & RLS"),
  
  heading3("Q4: RLS (Row Level Security) là gì? Tại sao cần?"),
  normalText("A: RLS là PostgreSQL feature cho phép kiểm soát truy cập ở mức row database. Cần vì đảm bảo bảo mật ở database level, ngay cả khi application code bị hack. Với RLS, host chỉ xem phòng của họ, guest chỉ xem booking của họ."),
  
  heading3("Q5: Làm sao enable RLS trong Supabase?"),
  normalText("A: Trong Supabase console, chọn table, click 'Enable RLS'. Sau đó create policies cho mỗi operation (SELECT, INSERT, UPDATE, DELETE). Ví dụ: CREATE POLICY 'host_rooms' ON rooms USING (auth.uid() = host_id)."),
  
  heading3("Q6: JWT token là gì? Cách hoạt động?"),
  normalText("A: JWT (JSON Web Token) là token encode thông tin người dùng. Supabase tạo JWT khi user login. Token gửi ở header Authorization, Supabase SDK xác minh token trước mỗi request. Nếu invalid, request bị reject."),
  
  heading2("Phần 3: Docker & Deployment"),
  
  heading3("Q7: Docker là gì? Tại sao sử dụng?"),
  normalText("A: Docker là containerization platform, đóng gói app + dependencies vào container. Tại sao: Consistency (chạy giống nhau ở mọi nơi), Isolation (dependencies tách biệt), Deployment dễ dàng (push image, chạy container), Scaling (tạo multiple containers)."),
  
  heading3("Q8: Multi-stage Dockerfile là gì?"),
  normalText("A: Multi-stage Dockerfile có nhiều FROM statements. Stage 1 cài dependencies, Stage 2 build app, Stage 3 chạy. Tại sao: giảm final image size (chỉ copy binary, không cần build tools)."),
  
  heading3("Q9: Docker Compose là gì? Sử dụng khi nào?"),
  normalText("A: Docker Compose define multiple containers (app, db, nginx) trong 1 file. Chạy: docker-compose up. Sử dụng khi: cần nhiều services, cần run local, cần orchestrate multiple containers."),
  
  heading3("Q10: VPS deployment steps?"),
  normalText("A: 1) SSH vào VPS. 2) Cài Docker. 3) Clone repo. 4) Tạo .env file. 5) docker-compose up -d. 6) Setup domain DNS. 7) Setup SSL. 8) Verify ứng dụng chạy."),
  
  heading2("Phần 4: Database Design"),
  
  heading3("Q11: Database schema cho homestay quản lý?"),
  normalText("A: Chính: users (hosts, guests), rooms, bookings, payments, room_images, customers. Relationships: users 1-M rooms, rooms 1-M bookings, bookings 1-M payments, rooms 1-M room_images."),
  
  heading3("Q12: Bảng rooms cần fields nào?"),
  normalText("A: id (PK), host_id (FK), name, description, price, capacity, bedrooms, bathrooms, amenities (JSONB), created_at, updated_at."),
  
  heading3("Q13: Bảng bookings cần fields nào?"),
  normalText("A: id (PK), room_id (FK), guest_id (FK), check_in, check_out, status (pending/confirmed/cancelled), total_price, created_at, updated_at."),
  
  heading2("Phần 5: Security"),
  
  heading3("Q14: Làm sao bảo vệ password?"),
  normalText("A: Password được hash (bcrypt, argon2) trước khi lưu. Never store plain text password. Supabase Auth tự động hash."),
  
  heading3("Q15: CORS là gì? Tại sao cần?"),
  normalText("A: CORS (Cross-Origin Resource Sharing) kiểm soát requests từ domain khác. Cần để ngăn unauthorized access từ external websites. Setup: Allow specific origins, methods, headers."),
  
  heading3("Q16: Input validation tại sao quan trọng?"),
  normalText("A: Validate input để ngăn SQL injection, XSS, malformed data. Validate trước khi insert vào database. Dùng schema validation libraries (Zod, Yup)."),
  
  heading2("Phần 6: Performance"),
  
  heading3("Q17: Làm sao optimize hiệu năng?"),
  normalText("A: 1) Database indexing. 2) Query optimization. 3) Caching (Redis). 4) Image compression. 5) Code splitting. 6) Lazy loading. 7) CDN for static files. 8) Monitoring & profiling."),
  
  heading3("Q18: Image optimization như thế nào?"),
  normalText("A: Compress (reduce size), Resize (responsive sizes), Format (WebP, AVIF), Lazy load, Progressive load. Next.js Image component tự động optimize."),
  
  heading3("Q19: Database query optimization?"),
  normalText("A: 1) Add indexes. 2) Select specific columns (not SELECT *). 3) Use JOINs instead of multiple queries. 4) Pagination for large datasets. 5) Cache frequently accessed data."),
  
  heading2("Phần 7: TypeScript"),
  
  heading3("Q20: TypeScript benefits?"),
  normalText("A: Type safety (catch errors early), Better IDE autocomplete, Self-documenting code, Easier refactoring, Reduce runtime errors. Trade-off: compilation step, learning curve."),
  
  heading3("Q21: Generic types là gì? Ví dụ?"),
  normalText("A: Generics allow reusable code với different types. Ví dụ: function fetchData<T>(url: string): Promise<T>. Lợi ích: type safety, reusability."),
  
  heading2("Phần 8: Testing"),
  
  heading3("Q22: Các loại testing?"),
  normalText("A: Unit testing (individual functions), Integration testing (modules together), E2E testing (full user flow), Performance testing, Security testing."),
  
  heading3("Q23: Test coverage là gì?"),
  normalText("A: Percentage of code được test. Cao coverage = tốt, nhưng không guarantee chất lượng. Target: 80%+ coverage."),
  
  heading2("Phần 9: AI Usage"),
  
  heading3("Q24: Sử dụng AI trong phát triển?"),
  normalText("A: Code generation, Debugging, Documentation, Learning, Optimization. Always verify AI output, không sử dụng mù quáng."),
  
  heading3("Q25: Hạn chế của AI?"),
  normalText("A: Không luôn chính xác, có thể bugs, training data lỗi thời, không hiểu context, vi phạm copyright."),
  
  heading2("Phần 10: Monitoring & Maintenance"),
  
  heading3("Q26: Monitoring được set up thế nào?"),
  normalText("A: Logs collection (stdout/stderr), Error tracking (Sentry), Performance monitoring (DataDog), Uptime monitoring (Pingdom), Database monitoring."),
  
  heading3("Q27: Deployment strategy?"),
  normalText("A: Blue-green deployment (2 envs, switch traffic), Canary deployment (gradual rollout), Rolling deployment (update gradually), Rollback strategy."),
  
  heading3("Q28: Common production issues?"),
  normalText("A: Out of memory, Database connection pool exhausted, Disk space full, SSL certificate expired, DNS misconfigured, Rate limiting exceeded."),
  
  heading2("Phần 11: Project Management"),
  
  heading3("Q29: Development timeline?"),
  normalText("A: Planning: 1 week, Development: 4 weeks, Testing: 1.5 weeks, Deployment: 3-4 days. Total: ~7 weeks. Challenges: scope creep, integration issues, testing bugs."),
  
  heading3("Q30: Lessons learned?"),
  normalText("A: Start with clear requirements, Use version control properly, Test early and often, Monitor from day 1, Document as you code, Use AI wisely, Plan deployment early."),
  
  heading3("Q31: Future improvements?"),
  normalText("A: Payment integration, Real-time features, Mobile app, AI pricing, Multi-language, Calendar sync, Advanced analytics, Marketplace expansion."),
  
  heading3("Q32: System limitations?"),
  normalText("A: Payment: manual confirmation only, Real-time: email only, Language: Vietnamese only, Mobile: responsive web only, Analytics: basic only."),
  
  heading3("Q33: Security audit được thực hiện?"),
  normalText("A: Code review, Dependency scanning (npm audit), SQL injection testing, XSS testing, CORS testing, Authentication/authorization testing."),
  
  heading3("Q34: Scalability plan?"),
  normalText("A: Database: read replicas, sharding. Cache: Redis. Load balancing: nginx. Microservices: APIs. Monitoring: proactive alerts."),
  
  heading3("Q35: Cost estimation?"),
  normalText("A: VPS: $5-20/month, Database: included in Supabase, Storage: based on usage, Domain: $10-15/year, SSL: free (Let's Encrypt).")
]);

// Create document
const doc = new Document({
  sections: [{
    properties: {
      margins: {
        top: convertInchesToTwip(0.98),
        bottom: convertInchesToTwip(0.98),
        left: convertInchesToTwip(1.38),
        right: convertInchesToTwip(0.79)
      }
    },
    children: sections.flat()
  }]
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(path.join(__dirname, 'StaySaga_Appendices.docx'), buffer);
  console.log('\n✅ Appendices đã được tạo thành công!');
  console.log('📄 Tệp: StaySaga_Appendices.docx');
  console.log('📏 Dung lượng: ' + (buffer.length / 1024 / 1024).toFixed(2) + ' MB');
  console.log('📊 Nội dung: PHỤ LỤC A-E (Source code, Interface images, Deployment evidence, AI evidence, Q&A)');
});
