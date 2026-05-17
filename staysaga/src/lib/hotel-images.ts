import type { Hotel } from "@/lib/hotel-parser";

export const HOTEL_FALLBACK_IMAGE = "/images/fallback-hotel.jpg";

export const resolveHotelImage = (hotel: Hotel, index = 0): string => {
  if (index === 0 && hotel.imagePublicPath) {
    return hotel.imagePublicPath;
  }

  const galleryImage = hotel.galleryImages[index];
  if (galleryImage) {
    return galleryImage;
  }

  return HOTEL_FALLBACK_IMAGE;
};

export const resolveHotelGallery = (hotel: Hotel): string[] => {
  const gallery = Array.from(new Set([hotel.imagePublicPath, ...hotel.galleryImages]));
  return gallery.filter(Boolean);
};

export const getImageAltText = (hotel: Hotel) => `${hotel.title} tại ${hotel.city}`;

export const formatHighlight = (value: string) => value;
