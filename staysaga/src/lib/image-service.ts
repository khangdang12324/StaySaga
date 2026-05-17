import {
  getLocationImage,
  getLocationImages,
  isVerifiedLocation,
} from "@/lib/location-images";

export async function resolveLocationImages(
  location?: string | null,
  count = 3,
) {
  return getLocationImages(location, count);
}

export async function resolveLocationImage(
  location?: string | null,
  index = 0,
) {
  return getLocationImage(location, index);
}

export { isVerifiedLocation };
