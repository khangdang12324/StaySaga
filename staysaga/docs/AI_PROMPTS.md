# Phu luc AI prompts

Tai lieu nay ghi lai mot so prompt da su dung trong qua trinh phat trien StaySaga, phuc vu yeu cau minh chung su dung AI tool.

## Tong hop prompt

| #   | Prompt                                                            | Muc dich                                   | Ket qua                                                                          |
| --- | ----------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| 1   | Prevent checkout 404 by letting property lookup accept slug or id | Sua loi checkout khong tim thay property   | getPropertyBySlug ho tro ca slug va id                                           |
| 2   | Fix hydration/runtime errors in Next.js App Router                | Giam loi hydration va misuse server/client | layout dung suppressHydrationWarning, form action duoc chuyen sang server action |
| 3   | Make checkout UI readable and localized in Vietnamese             | Cải thiện giao diện thanh toán             | Copy tieng Viet co dau, boi canh ro rang hon                                     |
| 4   | Make /homestays feel like Booking/Agoda                           | Tao giao dien danh sach co bo loc nang cao | Left filter sidebar, sort, card list style Booking                               |
| 5   | Show booking in trips page including mock bookings                | Luu va hien thi booking gia lap            | Cookie mock_bookings duoc merge vao /bookings                                    |
| 6   | Enforce light mode with white background and rose accents         | Chuan hoa nhan dien thuong hieu            | Navbar, layout va cac component chinh ve light theme                             |
| 7   | Remove blank images across pages                                  | Tang do on dinh giao dien                  | SafeImage duoc tao de fallback khi anh loi                                       |
| 8   | Add deployment and Docker documentation                           | Hoan thien ho so do an                     | Co huong dan docker compose va deploy VPS                                        |

## Ly do su dung AI

- Phat hien va sua nhanh cac loi runtime/hydration trong Next.js App Router.
- To chuc lai giao dien theo huong Booking/Agoda trong thoi gian ngan.
- Tao ban ghi ro rang de phuc vu phan bao cao va phu luc do an.

## Ghi chu

Sinh vien co the bo sung them prompt thuc te da su dung neu can, nhat la prompt lien quan toi giao dien, RLS, Docker va deploy.
