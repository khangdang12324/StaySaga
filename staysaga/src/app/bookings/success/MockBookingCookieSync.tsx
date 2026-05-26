"use client";

import { useEffect } from "react";

type MockBookingCookieSyncProps = {
  bookingId: string;
  checkIn: string;
};

export default function MockBookingCookieSync({
  bookingId,
  checkIn,
}: MockBookingCookieSyncProps) {
  useEffect(() => {
    if (!bookingId || !bookingId.startsWith("mock-")) return;

    // Helper to get cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(";").shift() || "");
      return "";
    };

    // Helper to set cookie
    const setCookie = (name: string, val: string) => {
      document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=${60 * 60 * 24 * 30}`;
    };

    const raw = getCookie("mock_bookings");
    let mockBookings: any[] = [];
    if (raw) {
      try {
        mockBookings = JSON.parse(raw);
      } catch {
        mockBookings = [];
      }
    }

    const exists = mockBookings.some((b) => b.id === bookingId);
    if (!exists) {
      const checkInDate = new Date(checkIn || Date.now());
      const checkOutDate = new Date(checkInDate.getTime() + 86400000); // 1 night
      
      const newMock = {
        id: bookingId,
        status: "PENDING",
        payment_status: "PAID",
        payment_method: "visa",
        total_price: 216000,
        check_in_date: checkInDate.toISOString().slice(0, 10),
        check_out_date: checkOutDate.toISOString().slice(0, 10),
        isMock: true,
        homestay: {
          name: "Le Tuan Minh Hotel",
          slug: "le-tuan-minh-hotel",
          city: "TP. Hồ Chí Minh",
          address: "101 Đường Bạch Đằng, 760000 TP. Hồ Chí Minh, Việt Nam",
          homestay_images: [{ url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2062" }],
        },
      };

      const updated = [newMock, ...mockBookings].slice(0, 10);
      setCookie("mock_bookings", JSON.stringify(updated));
      
      // Refresh the page so the Server Component page can see the newly written cookie
      window.location.reload();
    }
  }, [bookingId, checkIn]);

  return null;
}
