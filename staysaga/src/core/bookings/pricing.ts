export const BOOKING_DISCOUNT_RATE = 0.4;

export function calculateBookingPricing(basePrice: number, nights: number) {
  const safeBasePrice = Number.isFinite(basePrice) ? Math.max(0, basePrice) : 0;
  const safeNights = Number.isFinite(nights) ? Math.max(0, nights) : 0;
  const accommodationsCost = safeBasePrice * safeNights;
  const discount = Math.round(accommodationsCost * BOOKING_DISCOUNT_RATE);

  return {
    accommodationsCost,
    discount,
    totalAmount: accommodationsCost - discount,
  };
}
