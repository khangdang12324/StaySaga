export const PROPERTY_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "HIDDEN",
  "SUSPENDED",
  "CLOSED_TEMP",
  "DELETE_REQUESTED",
  "DELETED",
] as const;

export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const ACTIVE_BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "STAYING",
] as const;

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Đang nháp",
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  HIDDEN: "Đã ẩn",
  SUSPENDED: "Bị khóa",
  CLOSED_TEMP: "Tạm đóng",
  DELETE_REQUESTED: "Đã yêu cầu xóa",
  DELETED: "Đã xóa mềm",
};

export function isPropertyStatus(value: string): value is PropertyStatus {
  return (PROPERTY_STATUSES as readonly string[]).includes(value);
}

export function isPublicPropertyStatus(status?: string | null) {
  return status === "APPROVED";
}

export function isBookableProperty(status?: string | null, isActive = false) {
  return isActive && isPublicPropertyStatus(status || "APPROVED");
}

export function isActiveBookingStatus(status?: string | null) {
  return (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(status || "");
}
