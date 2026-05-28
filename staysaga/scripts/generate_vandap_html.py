from __future__ import annotations

import html
import re
from pathlib import Path

import pypdf


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = Path(r"C:\Users\Admin\Downloads\CAU-HOI-VAN-DAP.pdf")
OUT_HTML = ROOT / "docs" / "Tra_loi_toan_bo_cau_hoi_StaySaga.html"


def extract_items() -> list[tuple[int, str, str]]:
    reader = pypdf.PdfReader(str(SOURCE_PDF))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    cau = "C" + "\u00e2" + "u"
    goi_y = "G" + "\u1ee3" + "i " + "\u00fd:"
    pattern = re.compile(
        rf"{cau}\s+(\d+)\.\s*(.*?){goi_y}\s*(.*?)(?=\s*{cau}\s+\d+\.|\s*BẢNG TỔNG HỢP|\Z)",
        re.S,
    )
    items: list[tuple[int, str, str]] = []
    for match in pattern.finditer(text):
        number = int(match.group(1))
        question = " ".join(match.group(2).replace("\t", " ").split())
        hint = " ".join(match.group(3).replace("\t", " ").split())
        items.append((number, question, hint))
    return items


def standard_answer(question: str, hint: str) -> str:
    return (
        "Trả lời chuẩn: "
        + hint.rstrip(".")
        + ". Khi vấn đáp, nên nêu định nghĩa trước, sau đó nói khi nào dùng và kết luận bằng một ví dụ ngắn để giảng viên thấy mình hiểu bản chất."
    )


def saga_answer(number: int) -> str:
    by_number = {
        1: "Trong StaySaga, các trang đọc dữ liệu như /homestays, /bookings, /host và /admin ưu tiên Server Component để đọc Supabase server-side. Các phần có state, click, toast, modal, favorite, wizard và realtime subscription là Client Component.",
        2: "StaySaga dùng App Router trong src/app với các route /homestays, /bookings, /host, /admin và /api. Dự án tận dụng layout/page theo thư mục, Server Components mặc định, Server Actions trong src/core/*/actions.ts và Route Handler cho endpoint cần URL public.",
        3: "Trong StaySaga, các file như src/core/bookings/actions.ts, src/core/auth/actions.ts, src/core/favorites/actions.ts dùng \"use server\" để xử lý đăng nhập, đặt phòng, hủy/đổi lịch, yêu thích và revalidate dữ liệu sau khi ghi.",
        4: "StaySaga chủ yếu fetch dữ liệu bằng Supabase server client trong Server Component và Server Action. Với phần cần tương tác như bộ lọc, toast, wizard hoặc realtime, dự án dùng Client Component/state; hiện chưa cần React Query vì luồng chính đã nằm ở server và Supabase.",
        5: "layout.tsx của StaySaga bọc provider, shell và giao diện chung theo nhóm route; page.tsx là nội dung từng màn như danh sách homestay, chi tiết booking hoặc dashboard admin.",
        6: "StaySaga dùng Supabase Auth cho đăng ký, đăng nhập, đăng xuất, callback OAuth và quản lý session qua @supabase/ssr. README nêu email/password, Google/Facebook OAuth và quên/đặt lại mật khẩu là các luồng chính.",
        7: "StaySaga bật RLS cho profiles, homestays, bookings, favorites, reviews và notifications. Policy giúp user chỉ quản lý dữ liệu của mình, host quản lý homestay của mình, admin có quyền quản trị rộng hơn.",
        8: "Trong StaySaga, Supabase dùng cho Auth, PostgreSQL, RLS, Storage bucket homestay-images và Realtime. Các bảng chính gồm profiles, homestays, homestay_images, amenities, bookings, favorites, reviews, notifications.",
        9: "Policy StaySaga dùng auth.uid() để so khớp user_id hoặc owner_id. Ví dụ bookings cho user đọc booking của mình, host đọc booking thuộc homestay mình, còn admin được mở rộng quyền qua role/helper trong migration.",
        10: "StaySaga dùng RealtimeSubscription để subscribe thay đổi bookings, reviews, homestays, profiles và notifications. Khi có thay đổi, UI refresh hoặc tăng badge thông báo cho guest/host/admin.",
        11: "StaySaga đóng gói bằng container để chạy nhất quán giữa máy dev và VPS. Container nhẹ hơn VM, phù hợp app Next.js vì database chính nằm ngoài ở Supabase cloud.",
        12: "Dockerfile StaySaga build Next.js standalone; docker-compose.yml định nghĩa service staysaga-web, map ${APP_PORT:-3000}:3000 và truyền biến môi trường Supabase/Stripe vào container.",
        13: "Dockerfile của StaySaga có stage deps, builder và runner. Runner chỉ copy public, .next/standalone và .next/static rồi chạy node server.js bằng user nextjs, giúp image nhỏ và sạch hơn.",
        14: "Khi demo/deploy StaySaga thường dùng npm run build, docker compose up --build, docker compose ps, docker compose logs -f staysaga và docker compose down. Khi lỗi production, logs là nơi kiểm tra đầu tiên.",
        15: "StaySaga có đăng nhập, cookie session, thông tin đặt phòng và có thể thanh toán, nên production bắt buộc dùng HTTPS để bảo vệ token, cookie và dữ liệu khách.",
        16: "Trong mô hình StaySaga, Cloudflare trỏ domain về VPS, Nginx nhận request 80/443 rồi proxy vào container Next.js port 3000, đồng thời set header X-Forwarded-* và xử lý SSL/redirect HTTPS.",
        17: "Với StaySaga, domain được cấu hình DNS trên Cloudflare trỏ tới IP VPS. Người dùng nhập domain, DNS resolve ra Cloudflare/origin, request đi qua Nginx rồi vào container app.",
        18: "Cloudflare giúp StaySaga quản lý DNS, bật SSL miễn phí, cache asset tĩnh, chống DDoS cơ bản và ẩn IP VPS, phù hợp mô hình triển khai đồ án.",
        19: "StaySaga dùng TypeScript cho model/props như booking, homestay, profile. Interface hợp mô tả object row/props; type hợp union role/status như USER | PARTNER | ADMIN hoặc BookingStatus.",
        20: "StaySaga dùng server rendering cho các trang cần session và dữ liệu mới như /bookings, /host, /admin. Các phần tương tác như filter, modal, favorite mới chạy CSR ở client.",
        21: "Trong StaySaga, nên annotation ở boundary như props, payload Server Action và kiểu dữ liệu Supabase; biến cục bộ như nights hoặc totalPrice có thể để TypeScript tự suy luận.",
        22: "StaySaga có docs/AI_PROMPTS.md ghi các prompt AI dùng để sửa hydration, UI homestays và mock bookings. Có thể nói AI hỗ trợ sinh gợi ý, còn nhóm kiểm tra lại bằng build, lint và test.",
        23: "Minh chứng AI của StaySaga gồm docs/AI_PROMPTS.md, README, commit history nếu có, tài liệu QA và script sinh báo cáo. Khi vấn đáp có thể mở các file này để chứng minh AI được dùng có kiểm soát.",
        24: "StaySaga để Server Component mặc định giúp giảm JS client, đọc Supabase bằng cookie server và không lộ logic server. Chỉ các nút favorite, realtime, form động mới chuyển sang client.",
        25: "Trong StaySaga, \"use client\" dùng cho component có useState/useEffect, router.push, toast, modal, realtime subscription hoặc click handler. Nếu quên directive, Next.js sẽ báo lỗi vì mặc định là Server Component.",
        26: "Luồng StaySaga: user vào route, App Router match page/layout, Server Component tạo Supabase server client đọc session/cookie, query DB theo RLS, render HTML/RSC rồi hydrate các Client Component như favorite/realtime.",
        27: "StaySaga dùng Server Actions cho login/logout, booking, favorite, review và admin updates vì là mutation nội bộ. API Route phù hợp cho webhook thanh toán hoặc endpoint bên ngoài như geocode/places.",
        28: "StaySaga dùng @supabase/ssr để createServerClient đọc/ghi cookie session trong Server Component/Action và proxy.ts để cập nhật session, bảo vệ route quản lý.",
        29: "Ảnh homestay của StaySaga lưu trong bucket homestay-images; database chỉ lưu url/storage_path trong homestay_images. Cách này nhẹ DB, dễ phân quyền upload cho host và dễ phục vụ ảnh công khai/signed URL.",
        30: "Trong StaySaga, bookings có user_id và homestay_id. Policy SELECT cho user dùng auth.uid() = user_id; host dùng EXISTS qua homestays.owner_id; WITH CHECK bảo đảm user chỉ tạo booking của mình.",
        31: "StaySaga dùng Realtime cho booking, review và notification để host/admin thấy thay đổi nhanh. Nếu polling, dashboard phải gọi API định kỳ, tốn request hơn và có độ trễ.",
        32: "Khi dev StaySaga có thể mount source để hot reload. Docker production hiện copy standalone build vào image để container ổn định, đúng với mục tiêu deploy VPS.",
        33: "docker compose up --build của StaySaga đọc docker-compose.yml, build Dockerfile, tạo service staysaga-web, map port 3000, inject env Supabase/Stripe rồi chạy server.js từ Next standalone.",
        34: "Image StaySaga nhỏ vì stage runner chỉ chứa Node runtime, .next/standalone, .next/static và public; npm cache, source thừa và dev dependencies không đi vào image cuối.",
        35: "Luồng production StaySaga: browser -> DNS/Cloudflare -> VPS -> Nginx -> container staysaga-web port 3000 -> Next.js App Router -> Supabase cloud nếu cần dữ liệu -> response quay lại browser.",
        36: "Với StaySaga, TLS bảo vệ cookie Supabase Auth và thông tin booking/checkout. Sau handshake, dữ liệu login, profile và đặt phòng được mã hóa khi truyền qua mạng.",
        37: "StaySaga có thể dùng Cloudflare Universal SSL ở edge và Origin Certificate hoặc Let's Encrypt trên VPS. Nên dùng chế độ Full Strict để mã hóa cả đoạn Cloudflare tới VPS.",
        38: "StaySaga có thể dùng generic cho helper như Result<T> = { data?: T; error?: string } để các action booking, review, profile có kiểu trả về nhất quán và type-safe.",
        39: "Trang public ít đổi của StaySaga có thể SSG/ISR; dashboard /host, /admin và /bookings nên SSR vì phụ thuộc session, role và dữ liệu booking mới nhất.",
        40: "StaySaga dùng TypeScript để kiểm soát props, role/status, payload booking và dữ liệu Supabase. Điều này giảm lỗi khi refactor route/action và giúp IDE cảnh báo trước khi build.",
        41: "Schema StaySaga tách profiles, homestays, homestay_images, amenities, homestay_amenities, bookings, favorites, reviews và notifications. Tách bảng giúp query rõ, tránh lặp dữ liệu, đặt khóa ngoại/RLS và mở rộng host/admin dễ hơn.",
        42: "Nếu StaySaga cần job queue như gửi email nhắc check-in, có thể dùng Supabase Edge Functions + cron, Trigger.dev/Inngest hoặc bảng jobs/notifications với worker định kỳ cho quy mô đồ án.",
        43: "StaySaga dùng Server Component cho page đọc Supabase và auth gate; Client Component cho FavoriteButton, wizard host, modal đổi giá/ngày, toast và RealtimeSubscription. Khó khăn là ranh giới server-client và props phải serializable.",
        44: "StaySaga phân quyền Guest/USER/PARTNER/ADMIN. Guest xem public; USER đặt phòng, favorite, review; PARTNER quản lý homestay/booking của mình; ADMIN quản lý hệ thống. Quyền được kiểm tra ở UI, server và RLS.",
        45: "Nếu StaySaga crash trong Docker, kiểm tra docker compose logs -f staysaga, env Supabase, NEXT_PUBLIC_SITE_URL, APP_PORT, output .next/standalone, npm run build và thử curl localhost:3000 trên VPS.",
        46: "Nginx cho StaySaga proxy / về http://127.0.0.1:3000 hoặc tên service Docker, set Host/X-Forwarded-Proto/X-Real-IP, redirect HTTP sang HTTPS và tăng client_max_body_size nếu upload ảnh lớn.",
        47: "Nếu thêm NestJS, Compose có service web:3000 và api:3001 cùng network. Nginx route /api/ tới api:3001, còn / tới web:3000; chỉ Nginx expose 80/443 ra public.",
        48: "Trong StaySaga, danh sách homestay public cho guest nên có SELECT policy cho anon/authenticated với điều kiện is_active = true hoặc status = approved. Dữ liệu draft/ẩn của host không trả cho anon.",
        49: "Với ảnh/video lớn cho homestay, StaySaga cần cấu hình bucket homestay-images về size/MIME, đường dẫn owner_id/property_id, policy cho host upload property của mình và signed URL nếu file private.",
        50: "Notification StaySaga: khi có booking/message/review mới, server insert vào notifications với user_id người nhận; client subscribe notifications:user_id qua Supabase Realtime; nhận INSERT thì tăng badge, hiện toast và refresh.",
        51: "Ví dụ StaySaga: dùng AI để thiết kế UI /homestays theo phong cách Booking/Agoda hoặc sửa lỗi hydration App Router. Prompt nêu Next.js App Router, TypeScript, Tailwind và yêu cầu giữ đúng Server/Client boundary.",
        52: "Trong StaySaga cần cẩn thận khi AI viết RLS, service role, thanh toán, migration database và logic tính tiền/chống double booking. Các phần này phải review thủ công và test bằng nhiều role.",
        53: "StaySaga nên commit nhỏ theo Conventional Commits như feat: add booking checkout, fix: correct booking RLS, docs: add deployment checklist để lịch sử rõ và dễ review.",
        54: "Điểm mạnh StaySaga: Next.js + Supabase gọn, RLS bảo mật dữ liệu, Docker standalone dễ deploy. Hạn chế: phụ thuộc schema Supabase cloud, role/RLS phức tạp, một số luồng host/admin cần test thêm.",
        55: "Với StaySaga, khó nhất là Supabase RLS/schema cloud và Docker/VPS vì lỗi có thể nằm giữa code, config và hạ tầng. Nhóm vượt qua bằng đọc log, viết tài liệu QA, kiểm thử route theo role và ghi bug cụ thể.",
        56: "Thêm PayPal vào StaySaga: tạo bảng payments liên kết bookings, Server Action tạo order, API Route webhook PayPal xác thực server-side, cập nhật booking/payment status, RLS theo role, UI checkout và test sandbox.",
        57: "Thách thức lớn của StaySaga là đồng bộ codebase với database cloud và phân quyền host/admin. Nhóm xử lý bằng migration, RLS policy, test route theo role, tài liệu qa-full-test-report và workaround demo khi enum role chưa đồng bộ.",
    }
    return by_number[number]


def main() -> None:
    items = extract_items()
    if len(items) != 57:
        raise RuntimeError(f"Expected 57 questions, got {len(items)}")

    css = """
    @page { size: A4; margin: 14mm 13mm 15mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, 'Times New Roman', sans-serif; color: #111827; font-size: 11px; line-height: 1.42; }
    h1 { text-align: center; font-size: 20px; margin: 0 0 8px; color: #9f1239; }
    .intro { margin: 0 0 10px; }
    .q { break-inside: avoid; page-break-inside: avoid; margin: 0 0 8px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
    .qt { font-weight: 700; font-size: 11.5px; margin-bottom: 3px; color: #111827; }
    .ans { margin: 2px 0; }
    .label { font-weight: 700; color: #9f1239; }
    .sources { margin-top: 14px; break-before: page; }
    li { margin-bottom: 4px; }
    """
    parts = [
        "<!doctype html><html><head><meta charset='utf-8'>",
        "<title>Trả lời vấn đáp StaySaga</title>",
        f"<style>{css}</style></head><body>",
        "<h1>TRẢ LỜI TOÀN BỘ CÂU HỎI VẤN ĐÁP - STAYSAGA</h1>",
        "<p class='intro'>Môn: Các công nghệ mới trong phát triển phần mềm. Tài liệu gồm 57 câu, mỗi câu có 2 hướng trả lời: đáp án chuẩn theo tài liệu/nguồn chính thức và đáp án áp dụng trực tiếp vào app StaySaga.</p>",
        "<p class='intro'>Nguồn nội bộ dùng để áp dụng StaySaga: README.md, supabase/migrations, docs/qa-full-test-report.md, docs/AI_PROMPTS.md và mã nguồn trong src/.</p>",
    ]
    for number, question, hint in items:
        parts.append("<section class='q'>")
        parts.append(f"<div class='qt'>Câu {number}. {html.escape(question)}</div>")
        parts.append(f"<p class='ans'><span class='label'>1) Đáp án chuẩn:</span> {html.escape(standard_answer(question, hint))}</p>")
        parts.append(f"<p class='ans'><span class='label'>2) Theo app StaySaga:</span> {html.escape(saga_answer(number))}</p>")
        parts.append("</section>")

    sources = [
        "Next.js Docs: Server/Client Components, App Router, Server Actions, data fetching - https://nextjs.org/docs",
        "Supabase Docs: Auth, Row Level Security, Storage access control, Realtime - https://supabase.com/docs",
        "Docker Docs: Docker Compose và multi-stage builds - https://docs.docker.com",
        "Cloudflare Docs: DNS, proxy, Universal SSL - https://developers.cloudflare.com",
        "MDN Web Docs: HTTP, HTTPS/TLS - https://developer.mozilla.org",
        "TypeScript Handbook: Everyday Types, Generics - https://www.typescriptlang.org/docs",
        "GitHub Docs: GitHub Copilot - https://docs.github.com/copilot",
        "Gemini CLI Docs - https://google-gemini.github.io/gemini-cli/docs/",
    ]
    parts.append("<section class='sources'><h2>Nguồn tham khảo chính</h2><ul>")
    for source in sources:
        parts.append(f"<li>{html.escape(source)}</li>")
    parts.append("</ul></section></body></html>")
    OUT_HTML.write_text("\n".join(parts), encoding="utf-8")
    print(OUT_HTML)


if __name__ == "__main__":
    main()
