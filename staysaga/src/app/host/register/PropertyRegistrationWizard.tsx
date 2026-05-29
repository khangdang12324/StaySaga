"use client";

/* eslint-disable @next/next/no-img-element */
import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Globe,
  Home,
  Hotel,
  ImageIcon,
  Info,
  Lightbulb,
  MapPin,
  Minus,
  Plus,
  Search,
  TentTree,
  ThumbsUp,
  X,
} from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";
import {
  createHostHomestay,
  saveDatabaseDraftAction,
  savePhotosStepAction,
  saveRegistrationStepAction,
  deleteHomestayImagesAction,
  updateImagesSortOrderAction,
} from "@/core/host/actions";

const DB_NAME = "staysaga-host-register";
const FILE_STORE = "files";
const MIN_PHOTOS = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

type Owner = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
};

type Draft = {
  id?: string;
  currentStep?: number;
  propertyType: string;
  unitMode: "single" | "multiple";
  name: string;
  description: string;
  country: string;
  city: string;
  district: string;
  address: string;
  locationNote: string;
  latitude: string;
  longitude: string;
  channelManager: "yes" | "no";
  bedrooms: Bedroom[];
  maxGuests: number;
  bathrooms: number;
  area: string;
  welcomeChildren: boolean;
  hasCrib: boolean;
  amenities: string[];
  parking: "free" | "paid" | "none";
  parkingReservation: "required" | "not_required";
  parkingLocation: "onsite" | "offsite";
  parkingType: "private" | "public";
  languages: string[];
  extraLanguages: string[];
  allowSmoking: boolean;
  allowParties: boolean;
  petsPolicy: "yes" | "request" | "no";
  petFee: "free" | "paid";
  checkInFrom: string;
  checkInTo: string;
  checkOutFrom: string;
  checkOutTo: string;
  partnerProfile: string[];
  partnerName: string;
  partnerBio: string;
  bookingMode: "instant" | "request";
  price: string;
  promotion: boolean;
  availabilityStart: "asap" | "specific";
  availabilityOpenMode: "continuous" | "first18";
  availabilityOpenDays: number;
  syncCalendar: boolean;
  allowLongStays: boolean;
  maxStayNights: number;
  nonRefundable: boolean;
  nonRefundableDiscount: number;
  cancellationFreeDays: number;
  accidentalBookingProtection: boolean;
  groupPricing: boolean;
  groupDiscounts: Record<string, number>;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  verificationConfirmed: boolean;
  legalOwnerType: "" | "individual" | "business";
  businessName: string;
  businessAddress: string;
  businessPostalCode: string;
  businessCity: string;
  businessCountry: string;
  businessTradeName: string;
  owners: Owner[];
  otherOwnerDetails: string;
  legalConfirmed: boolean;
  termsConfirmed: boolean;
};

type Bedroom = {
  id: string;
  single: number;
  double: number;
  king: number;
  superKing: number;
  bunk: number;
  sofa: number;
  futon: number;
};

type StoredPhoto = {
  id: string;
  file?: File;
  url: string;
  warning?: string;
};

type WizardStep =
  | "category"
  | "units"
  | "confirm"
  | "name"
  | "address"
  | "channel"
  | "details"
  | "bedroom"
  | "amenities"
  | "services"
  | "languages"
  | "policies"
  | "partner-profile"
  | "photos"
  | "booking"
  | "price"
  | "availability"
  | "rates"
  | "non-refundable"
  | "group-pricing"
  | "legal"
  | "review";

const steps: WizardStep[] = [
  "category",
  "units",
  "confirm",
  "name",
  "address",
  "channel",
  "details",
  "bedroom",
  "amenities",
  "services",
  "languages",
  "policies",
  "partner-profile",
  "photos",
  "booking",
  "price",
  "availability",
  "rates",
  "non-refundable",
  "group-pricing",
  "legal",
  "review",
];

const stageLabels = [
  "Thông tin cơ bản",
  "Cài đặt chỗ nghỉ",
  "Ảnh",
  "Giá và lịch",
  "Thông tin pháp lý",
  "Xem lại và hoàn tất",
];

const propertyTypes = [
  {
    id: "apartment",
    title: "Căn hộ",
    text: "Chỗ nghỉ tự nấu nướng, đầy đủ nội thất mà khách thuê nguyên căn.",
    icon: Building2,
    quick: true,
  },
  {
    id: "home",
    title: "Nhà",
    text: "Nhà riêng, biệt thự nhỏ hoặc homestay phù hợp gia đình.",
    icon: Home,
  },
  {
    id: "hotel",
    title: "Khách sạn, nhà nghỉ B&B hay tương tự",
    text: "Khách sạn, nhà khách, hostel hoặc mô hình nhiều phòng.",
    icon: Hotel,
  },
  {
    id: "other",
    title: "Các loại chỗ nghỉ khác",
    text: "Farmstay, lều trại, nhà gỗ hoặc chỗ nghỉ độc đáo khác.",
    icon: TentTree,
  },
];

const commonAmenities = [
  "Điều hòa nhiệt độ",
  "Hệ thống sưởi",
  "WiFi miễn phí",
  "Trạm sạc xe điện",
  "Bếp",
  "Bếp nhỏ",
  "Máy giặt",
  "TV màn hình phẳng",
  "Hồ bơi",
  "Bể sục",
  "Minibar",
  "Phòng xông hơi",
  "Ban công",
  "Nhìn ra vườn",
  "Sân thượng / hiên",
  "Tầm nhìn ra khung cảnh",
];

const serviceAmenities = [
  "Bữa sáng",
  "Nhà hàng",
  "Dịch vụ phòng",
  "Lễ tân 24 giờ",
  "Đưa đón sân bay",
];
const supportedLanguages = [
  "Tiếng Anh",
  "Tiếng Pháp",
  "Tiếng Trung",
  "Tiếng Tây Ban Nha",
  "Tiếng Việt",
];
const extraLanguages = [
  "Tiếng Ba Lan",
  "Tiếng Bulgaria",
  "Tiếng Bồ Đào Nha",
  "Tiếng Catalan",
  "Tiếng Croatia",
  "Tiếng Do Thái",
  "Tiếng Estonia",
  "Tiếng Gruzia",
];

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
};

const makeBedroom = (overrides: Partial<Bedroom> = {}): Bedroom => ({
  id: makeId(),
  single: 1,
  double: 0,
  king: 0,
  superKing: 0,
  bunk: 0,
  sofa: 0,
  futon: 0,
  ...overrides,
});

const createDefaultDraft = (): Draft => ({
  propertyType: "apartment",
  unitMode: "single",
  name: "",
  description: "",
  country: "Việt Nam",
  city: "Đà Nẵng",
  district: "An Hải",
  address: "",
  locationNote: "",
  latitude: "",
  longitude: "",
  channelManager: "no",
  bedrooms: [makeBedroom()],
  maxGuests: 2,
  bathrooms: 1,
  area: "",
  welcomeChildren: true,
  hasCrib: false,
  amenities: [],
  parking: "free",
  parkingReservation: "not_required",
  parkingLocation: "onsite",
  parkingType: "private",
  languages: ["Tiếng Việt"],
  extraLanguages: [],
  allowSmoking: false,
  allowParties: false,
  petsPolicy: "no",
  petFee: "free",
  checkInFrom: "15:00",
  checkInTo: "18:00",
  checkOutFrom: "08:00",
  checkOutTo: "11:00",
  partnerProfile: ["none"],
  partnerName: "",
  partnerBio: "",
  bookingMode: "instant",
  price: "400000",
  promotion: true,
  availabilityStart: "asap",
  availabilityOpenMode: "continuous",
  availabilityOpenDays: 365,
  syncCalendar: false,
  allowLongStays: true,
  maxStayNights: 90,
  nonRefundable: false,
  nonRefundableDiscount: 10,
  cancellationFreeDays: 1,
  accidentalBookingProtection: true,
  groupPricing: true,
  groupDiscounts: { "3": 10, "2": 15, "1": 20 },
  ownerName: "",
  contactPhone: "",
  contactEmail: "",
  verificationConfirmed: true,
  legalOwnerType: "",
  businessName: "",
  businessAddress: "",
  businessPostalCode: "",
  businessCity: "Đà Nẵng",
  businessCountry: "Việt Nam",
  businessTradeName: "",
  owners: [{ id: makeId(), firstName: "", lastName: "", dateOfBirth: "" }],
  otherOwnerDetails: "",
  legalConfirmed: false,
  termsConfirmed: false,
});

const mergeDraftWithDefault = (draft?: Draft | null): Draft => {
  const base = createDefaultDraft();
  if (!draft) return base;

  const address = draft.address === "Chưa thiết lập" ? "" : draft.address || "";
  const city = draft.city === "Chưa thiết lập" ? "" : draft.city || "";

  return {
    ...base,
    ...draft,
    address,
    city,
    bedrooms: draft.bedrooms?.length ? draft.bedrooms : base.bedrooms,
    amenities: draft.amenities ?? base.amenities,
    languages: draft.languages?.length ? draft.languages : base.languages,
    extraLanguages: draft.extraLanguages ?? base.extraLanguages,
    partnerProfile: draft.partnerProfile ?? base.partnerProfile,
    owners: draft.owners?.length ? draft.owners : base.owners,
    groupDiscounts: draft.groupDiscounts ?? base.groupDiscounts,
  };
};

const stageForStep = (index: number) => {
  if (index <= 5) return 0; // category, units, confirm, name, address, channel
  if (index <= 12) return 1; // details, bedroom, amenities, services, languages, policies, partner-profile
  if (index <= 13) return 2; // photos
  if (index <= 19) return 3; // booking, price, availability, rates, non-refundable, group-pricing
  if (index <= 20) return 4; // legal
  return 5; // review
};

function getStepKey(stepIndex: number): string {
  const stepName = steps[stepIndex];
  switch (stepName) {
    case "category":
      return "propertyType";
    case "units":
      return "unitMode";
    case "confirm":
      return "confirm";
    case "name":
      return "basicInfo";
    case "address":
      return "address";
    case "channel":
      return "channel";
    case "details":
      return "details";
    case "bedroom":
      return "rooms";
    case "amenities":
      return "amenities";
    case "services":
      return "services";
    case "languages":
      return "languages";
    case "policies":
      return "policies";
    case "partner-profile":
      return "partnerProfile";
    case "photos":
      return "photos";
    case "booking":
      return "booking";
    case "price":
      return "price";
    case "availability":
      return "availability";
    case "rates":
      return "rates";
    case "non-refundable":
      return "nonRefundable";
    case "group-pricing":
      return "groupPricing";
    case "legal":
      return "verification";
    case "review":
      return "review";
    default:
      return String(stepName);
  }
}

const formatVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const parsePrice = (value: string) => {
  const numeric = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const totalBeds = (bedrooms: Bedroom[]) =>
  bedrooms.reduce(
    (sum, room) =>
      sum +
      (Number(room.single) || 0) +
      (Number(room.double) || 0) +
      (Number(room.king) || 0) +
      (Number(room.superKing) || 0) +
      (Number(room.bunk) || 0) +
      (Number(room.sofa) || 0) +
      (Number(room.futon) || 0),
    0,
  );

const photoWarning = (file: File, existing: StoredPhoto[]) => {
  if (!file.type.startsWith("image/")) return "Không phải ảnh";
  if (file.size > MAX_PHOTO_SIZE) return "Ảnh quá lớn";
  if (file.size < 20 * 1024) return "Ảnh quá nhỏ";
  if (
    existing.some(
      (photo) =>
        photo.file &&
        photo.file.name === file.name &&
        photo.file.size === file.size,
    )
  )
    return "Ảnh bị trùng";
  return undefined;
};

const checkImageDimensions = (
  file: File,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.URL) {
      resolve({ width: 0, height: 0 });
      return;
    }
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = URL.createObjectURL(file);
  });
};

function openFileDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE))
        db.createObjectStore(FILE_STORE);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function saveFiles(files: File[], userId: string) {
  const db = await openFileDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    const store = tx.objectStore(FILE_STORE);
    store.put(files, `photos-${userId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

async function restoreFiles(userId: string) {
  const db = await openFileDb();
  if (!db) return [] as File[];

  const files = await new Promise<File[]>((resolve) => {
    const tx = db.transaction(FILE_STORE, "readonly");
    const request = tx.objectStore(FILE_STORE).get(`photos-${userId}`);
    request.onsuccess = () =>
      resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => resolve([]);
  });
  db.close();
  return files;
}

async function clearStoredFiles(userId: string) {
  const db = await openFileDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).delete(`photos-${userId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

function getStepValidation(
  step: WizardStep,
  draft: Draft,
  photos: StoredPhoto[],
) {
  const errors: string[] = [];
  const validPhotos = photos.filter((photo) => !photo.warning);

  if (step === "category" && !draft.propertyType)
    errors.push("Vui lòng chọn loại chỗ nghỉ.");
  if (step === "name" && !draft.name.trim())
    errors.push("Vui lòng nhập tên chỗ nghỉ.");
  if (step === "address" && (!draft.address.trim() || !draft.city.trim()))
    errors.push("Vui lòng nhập địa chỉ chỗ nghỉ.");
  if (step === "details" && draft.maxGuests < 1)
    errors.push("Số khách tối đa phải từ 1 trở lên.");
  if (step === "bedroom" && totalBeds(draft.bedrooms) < 1)
    errors.push("Cần có ít nhất 1 giường.");
  if (step === "amenities" && draft.amenities.length < 1)
    errors.push("Vui lòng chọn ít nhất một tiện nghi.");
  if (
    step === "languages" &&
    draft.languages.length + draft.extraLanguages.length < 1
  )
    errors.push("Vui lòng chọn ít nhất một ngôn ngữ.");
  if (step === "photos" && validPhotos.length < MIN_PHOTOS)
    errors.push(`Cần ít nhất ${MIN_PHOTOS} ảnh hợp lệ để tiếp tục.`);
  if (step === "price" && parsePrice(draft.price) <= 0)
    errors.push("Vui lòng nhập giá mỗi đêm.");
  if (step === "legal") {
    if (!draft.legalOwnerType) {
      errors.push("Vui lòng chọn loại chủ sở hữu chỗ nghỉ.");
      return errors;
    }
    if (draft.legalOwnerType === "business") {
      if (!draft.businessName.trim())
        errors.push("Vui lòng nhập tên đầy đủ của pháp nhân doanh nghiệp.");
      if (!draft.businessAddress.trim())
        errors.push("Vui lòng nhập địa chỉ của pháp nhân doanh nghiệp.");
      if (!draft.businessPostalCode.trim())
        errors.push("Vui lòng nhập mã bưu điện.");
      if (!draft.businessCity.trim())
        errors.push("Vui lòng nhập thành phố của pháp nhân doanh nghiệp.");
    }
    draft.owners.forEach((owner, idx) => {
      if (!owner.firstName.trim() || !owner.lastName.trim()) {
        errors.push(`Vui lòng điền đầy đủ họ và tên cho cá nhân #${idx + 1}.`);
      }
      if (!owner.dateOfBirth) {
        errors.push(`Vui lòng điền ngày sinh cho cá nhân #${idx + 1}.`);
      }
    });
  }
  if (step === "review") errors.push(...getFinalErrors(draft, photos));

  return errors;
}

function getFinalErrors(draft: Draft, photos: StoredPhoto[]) {
  const validPhotos = photos.filter((photo) => !photo.warning);
  const errors: string[] = [];

  if (!draft.propertyType) errors.push("Thiếu loại chỗ nghỉ.");
  if (!draft.name.trim()) errors.push("Thiếu tên chỗ nghỉ.");
  if (!draft.city.trim() || !draft.address.trim())
    errors.push("Thiếu địa chỉ.");
  if (validPhotos.length < MIN_PHOTOS)
    errors.push(`Cần ít nhất ${MIN_PHOTOS} ảnh hợp lệ.`);
  if (totalBeds(draft.bedrooms) < 1) errors.push("Thiếu thông tin giường.");
  if (parsePrice(draft.price) <= 0) errors.push("Thiếu giá mỗi đêm.");
  if (draft.amenities.length < 1) errors.push("Thiếu tiện nghi.");
  if (!draft.verificationConfirmed) errors.push("Chưa xác nhận thông tin.");
  if (!draft.legalOwnerType) errors.push("Thiếu loại chủ sở hữu chỗ nghỉ.");

  if (draft.legalOwnerType === "business") {
    if (
      !draft.businessName.trim() ||
      !draft.businessAddress.trim() ||
      !draft.businessPostalCode.trim() ||
      !draft.businessCity.trim()
    ) {
      errors.push("Thiếu thông tin pháp nhân doanh nghiệp.");
    }
  }
  const hasIncompleteOwner = draft.owners.some(
    (owner) =>
      !owner.firstName.trim() || !owner.lastName.trim() || !owner.dateOfBirth,
  );
  if (hasIncompleteOwner) {
    errors.push("Thiếu hoặc chưa hoàn thành thông tin người sở hữu.");
  }
  if (!draft.legalConfirmed) {
    errors.push("Vui lòng cam đoan chỗ nghỉ hợp pháp.");
  }
  if (!draft.termsConfirmed) {
    errors.push("Vui lòng đồng ý với Điều khoản chung.");
  }

  return errors;
}

export default function PropertyRegistrationWizard({
  initialDraft,
  resumeStep,
  userId,
  initialImages = [],
}: {
  initialDraft?: Draft | null;
  resumeStep?: string | null;
  userId: string;
  initialImages?: { id: string; url: string; storage_path: string | null }[];
}) {
  const DRAFT_KEY = `staysaga-host-register-v9-${userId}`;
  const [draft, setDraft] = useState<Draft>(() =>
    mergeDraftWithDefault(initialDraft),
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [activeBedroomId, setActiveBedroomId] = useState<string>("");
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>(
    {},
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [restored, setRestored] = useState(false);
  const [lastLoadedId, setLastLoadedId] = useState<string | undefined>(
    undefined,
  );
  const isInitializingRef = useRef(false);
  const [dragActive, setDragActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // New States for Confirmation / Warning modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [targetStepIndex, setTargetStepIndex] = useState<number | null>(null);
  const [showNotReadyModal, setShowNotReadyModal] = useState(false);
  const [notReadyReasons, setNotReadyReasons] = useState<string[]>([]);
  const [showAllBedOptions, setShowAllBedOptions] = useState(false);
  const [editingRatePolicy, setEditingRatePolicy] = useState(false);
  const [showRatePolicyHelp, setShowRatePolicyHelp] = useState(true);
  const [availabilityTips, setAvailabilityTips] = useState({
    sync: true,
    longStay: true,
  });

  const stageSteps = [
    ["category", "units", "confirm", "name", "address", "channel"],
    [
      "details",
      "bedroom",
      "amenities",
      "services",
      "languages",
      "policies",
      "partner-profile",
    ],
    ["photos"],
    [
      "booking",
      "price",
      "availability",
      "rates",
      "non-refundable",
      "group-pricing",
    ],
    ["legal"],
    ["review"],
  ];

  const current = steps[currentStep];
  const activeBedroom =
    draft.bedrooms.find((room) => room.id === activeBedroomId) ??
    draft.bedrooms[0];
  const stepErrors = getStepValidation(current, draft, photos);
  const showStepErrors = attemptedSteps[currentStep] || false;
  const validPhotos = photos.filter((photo) => !photo.warning);
  const canContinue = stepErrors.length === 0;
  const stageIndex = stageForStep(currentStep);
  const finalErrors = useMemo(
    () => getFinalErrors(draft, photos),
    [draft, photos],
  );

  const isStageAccessible = (targetIndex: number) => {
    if (targetIndex === 0) return true;
    if (targetIndex <= stageIndex) return true;

    // Check validation for all steps in stages before targetIndex
    for (let i = 0; i < targetIndex; i++) {
      const stepsInPrevStage = stageSteps[i];
      for (const stepName of stepsInPrevStage) {
        const errs = getStepValidation(stepName as WizardStep, draft, photos);
        if (errs.length > 0) {
          return false;
        }
      }
    }
    return true;
  };

  const onSelectStage = (index: number) => {
    const stage = stageSteps[index];
    const targetStep = index < stageIndex ? stage[stage.length - 1] : stage[0];
    const targetIdx = steps.indexOf(targetStep as WizardStep);
    if (targetIdx !== -1) {
      if (targetIdx <= currentStep) {
        setDraft((prev) => ({ ...prev, currentStep: targetIdx }));
        setCurrentStep(targetIdx);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setTargetStepIndex(targetIdx);
      setShowLeaveModal(true);
    }
  };

  const handleConfirmLeave = () => {
    if (targetStepIndex !== null) {
      setDraft((prev) => ({ ...prev, currentStep: targetStepIndex }));
      setCurrentStep(targetStepIndex);
    }
    setShowLeaveModal(false);
    setTargetStepIndex(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelLeave = () => {
    setShowLeaveModal(false);
    setTargetStepIndex(null);
  };

  useEffect(() => {
    const currentId = initialDraft?.id || "new";
    if (isInitializingRef.current || (restored && lastLoadedId === currentId)) {
      return;
    }
    isInitializingRef.current = true;

    // 1. Determine DB draft and DB current step
    const dbDraft = initialDraft ? mergeDraftWithDefault(initialDraft) : null;
    const dbCurrentStep =
      dbDraft && typeof dbDraft.currentStep === "number"
        ? dbDraft.currentStep
        : 0;

    let finalDraft = dbDraft || createDefaultDraft();
    let finalCurrentStep = dbCurrentStep;

    // 2. Load localStorage draft
    let localDraft: Draft | null = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        localDraft = JSON.parse(raw) as Draft;
      }
    } catch (e) {
      console.error("[register-resume] Failed to parse local draft:", e);
    }

    const startNew =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("new") === "1";

    if (startNew) {
      localStorage.removeItem(DRAFT_KEY);
      void clearStoredFiles(userId).then(() => {
        const freshDraft = createDefaultDraft();
        setDraft(freshDraft);
        setPhotos([]);
        setActiveBedroomId(freshDraft.bedrooms[0]?.id ?? "");
        setCurrentStep(0);
        setAttemptedSteps({});
        setTouched({});
        setLastLoadedId("new");
        setRestored(true);
        isInitializingRef.current = false;
      });
      return;
    }

    // 3. Merge local draft if it is newer and belongs to the same property
    if (localDraft && dbDraft && dbDraft.id === localDraft.id) {
      const dbUpdatedAt =
        (initialDraft as any)?.registration_checklist?.updatedAt || "";
      const localUpdatedAt = (localDraft as any).updatedAt || "";
      const isLocalNewer =
        !dbUpdatedAt ||
        (localUpdatedAt && new Date(localUpdatedAt) > new Date(dbUpdatedAt));

      if (isLocalNewer) {
        finalDraft = {
          ...dbDraft,
          ...localDraft,
          id: dbDraft.id, // preserve DB ID
        };
        const localCurrentStep =
          typeof localDraft.currentStep === "number"
            ? localDraft.currentStep
            : 0;
        finalCurrentStep = Math.max(dbCurrentStep, localCurrentStep);
      }
    } else if (localDraft && !dbDraft) {
      finalDraft = {
        ...createDefaultDraft(),
        ...localDraft,
      };
      if (typeof localDraft.currentStep === "number") {
        finalCurrentStep = localDraft.currentStep;
      }
    }

    // Sanitize finalDraft fields
    if (finalDraft.address)
      finalDraft.address = sanitizeText(finalDraft.address);
    if (finalDraft.city) finalDraft.city = sanitizeText(finalDraft.city);
    if (finalDraft.district)
      finalDraft.district = sanitizeText(finalDraft.district);
    if (finalDraft.country)
      finalDraft.country = sanitizeText(finalDraft.country);
    if (finalDraft.name) finalDraft.name = sanitizeText(finalDraft.name);
    if (finalDraft.description)
      finalDraft.description = sanitizeText(finalDraft.description);
    if (finalDraft.businessName)
      finalDraft.businessName = sanitizeText(finalDraft.businessName);
    if (finalDraft.businessAddress)
      finalDraft.businessAddress = sanitizeText(finalDraft.businessAddress);
    if (finalDraft.businessCity)
      finalDraft.businessCity = sanitizeText(finalDraft.businessCity);
    if (finalDraft.businessCountry)
      finalDraft.businessCountry = sanitizeText(finalDraft.businessCountry);
    if (Array.isArray(finalDraft.owners)) {
      finalDraft.owners = finalDraft.owners.map((owner) => ({
        ...owner,
        firstName: sanitizeText(owner.firstName || ""),
        lastName: sanitizeText(owner.lastName || ""),
      }));
    }

    // 4. Overriding step from URL search parameters if editStep or step is present
    const searchParams = new URLSearchParams(window.location.search);
    const urlStep = searchParams.get("editStep") || searchParams.get("step");
    if (urlStep) {
      const urlStepIndex = steps.indexOf(urlStep as WizardStep);
      if (urlStepIndex >= 0) {
        finalCurrentStep = urlStepIndex;
      }
    }

    // 5. Update state
    setDraft(finalDraft);
    setActiveBedroomId(finalDraft.bedrooms?.[0]?.id ?? "");
    setCurrentStep(finalCurrentStep);

    // Development only logs
    if (process.env.NODE_ENV === "development") {
      console.log("[register-resume]", {
        propertyId: finalDraft.id,
        dbCurrentStep,
        urlStep,
        localCurrentStep: localDraft?.currentStep,
        finalCurrentStep,
        checklist: (initialDraft as any)?.registration_checklist,
      });
    }

    // 6. Restore local files from IndexedDB or initialImages
    void restoreFiles(userId).then((files) => {
      if (files.length > 0) {
        setPhotos(
          files.map((file) => ({
            id: makeId(),
            file,
            url: URL.createObjectURL(file),
          })),
        );
      } else if (initialImages && initialImages.length > 0) {
        setPhotos(
          initialImages.map(
            (img) =>
              ({
                id: img.id,
                url: img.url,
              }) as any,
          ),
        );
      }
      setLastLoadedId(currentId);
      setRestored(true);
      isInitializingRef.current = false;
    });
  }, [initialDraft, userId, initialImages]);

  useEffect(() => {
    if (!restored) return;
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    let changed = false;

    // 1. If draft has an id, ensure propertyId query param is set and 'new' is removed
    if (draft.id && url.searchParams.get("propertyId") !== draft.id) {
      url.searchParams.set("propertyId", draft.id);
      url.searchParams.delete("new");
      changed = true;
    }

    // 2. Always remove step/editStep parameters if they exist in the URL
    if (url.searchParams.has("step") || url.searchParams.has("editStep")) {
      url.searchParams.delete("step");
      url.searchParams.delete("editStep");
      changed = true;
    }

    if (changed) {
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, [draft.id, currentStep, restored]);

  useEffect(() => {
    if (!activeBedroomId && draft.bedrooms[0])
      setActiveBedroomId(draft.bedrooms[0].id);
  }, [activeBedroomId, draft.bedrooms]);

  useEffect(() => {
    if (!restored) return;
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        ...draft,
        currentStep,
        updatedAt: new Date().toISOString(),
      }),
    );
  }, [draft, restored, currentStep]);

  useEffect(() => {
    if (!restored) return;
    if (!draft.name && !draft.city) return;

    const timer = setTimeout(async () => {
      try {
        const draftWithStep = { ...draft, currentStep };
        const result = await saveDatabaseDraftAction(
          JSON.stringify(draftWithStep),
        );
        if (result && "id" in result && result.id && result.id !== draft.id) {
          setDraft((prev) => ({ ...prev, id: result.id }));
        }
      } catch (err) {
        console.error("Failed to save database draft:", err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [draft, restored, currentStep]);

  useEffect(() => {
    if (!restored) return;
    void saveFiles(
      photos.map((photo) => photo.file).filter(Boolean) as File[],
      userId,
    );
  }, [photos, restored, userId]);

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateDraftFields = (fields: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...fields }));
  };

  const updateBedroom = (id: string, key: keyof Bedroom, value: number) => {
    setDraft((prev) => ({
      ...prev,
      bedrooms: prev.bedrooms.map((room) =>
        room.id === id ? { ...room, [key]: Math.max(0, value) } : room,
      ),
    }));
  };

  const saveBedroom = () => {
    setDraft((prev) => {
      const capacity = totalBedroomCapacity(prev.bedrooms);
      return {
        ...prev,
        maxGuests: Math.max(prev.maxGuests, capacity || 1),
        currentStep: 6,
      };
    });
    setCurrentStep(6);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleArray = (
    key: "amenities" | "languages" | "extraLanguages" | "partnerProfile",
    value: string,
  ) => {
    setDraft((prev) => {
      const list = prev[key];
      let next = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      if (key === "partnerProfile" && value === "none" && !list.includes(value))
        next = ["none"];
      if (key === "partnerProfile" && value !== "none")
        next = next.filter((item) => item !== "none");
      return { ...prev, [key]: next };
    });
  };

  const addPhotos = (files: File[]) => {
    setPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: makeId(),
        file,
        url: URL.createObjectURL(file),
        warning: photoWarning(file, prev),
      })),
    ]);
  };

  const handlePhotoInput = (event: ChangeEvent<HTMLInputElement>) => {
    addPhotos(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    addPhotos(Array.from(event.dataTransfer.files ?? []));
  };

  const goNext = async () => {
    setAttemptedSteps((prev) => ({ ...prev, [currentStep]: true }));
    if (!canContinue) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      let nextStepVal = currentStep + 1;
      if (current === "details") {
        nextStepVal = 8;
      }

      // 1. Force save database draft if we don't have draft.id yet
      let currentId = draft.id;
      if (!currentId) {
        const draftWithStep = { ...draft, currentStep };
        const result = await saveDatabaseDraftAction(
          JSON.stringify(draftWithStep),
        );
        if (result && "id" in result && result.id) {
          currentId = result.id;
          setDraft((prev) => ({ ...prev, id: result.id }));
        } else {
          throw new Error(
            result && "error" in result && result.error
              ? String(result.error)
              : "Không thể khởi tạo bản nháp chỗ nghỉ trên hệ thống.",
          );
        }
      }

      const activeId = currentId as string;

      // 2. Step-specific actions
      if (current === "photos") {
        const validPhotos = photos.filter((photo) => !photo.warning);

        if (validPhotos.length === 0) {
          throw new Error("Vui lòng tải lên ít nhất 5 ảnh để tiếp tục.");
        }

        // Delete removed photos
        const currentIds = validPhotos.map((p) => p.id);
        const deletedIds = (initialImages || [])
          .map((img) => img.id)
          .filter((id) => !currentIds.includes(id));
        if (deletedIds.length > 0) {
          const delRes = await deleteHomestayImagesAction(activeId, deletedIds);
          if (delRes && "error" in delRes && delRes.error) {
            throw new Error(String(delRes.error));
          }
        }

        const localFiles = validPhotos.filter((photo) => photo.file);

        if (localFiles.length > 0) {
          // Client-side dimensions check
          for (const photo of localFiles) {
            if (photo.file) {
              const dims = await checkImageDimensions(photo.file);
              if (dims.width > 0 && (dims.width < 800 || dims.height < 600)) {
                throw new Error(
                  `Ảnh "${photo.file.name}" quá nhỏ (${dims.width}x${dims.height}). Tối thiểu phải là 800x600 pixels.`,
                );
              }
            }
          }

          // Upload each local file one-by-one
          const updatedPhotos = [...photos];
          for (let i = 0; i < localFiles.length; i++) {
            const photo = localFiles[i];
            if (photo.file) {
              const fd = new FormData();
              fd.append("property_id", activeId);
              fd.append("image", photo.file);

              const sortOrder = validPhotos.findIndex((p) => p.id === photo.id);
              fd.append("sort_order", String(sortOrder >= 0 ? sortOrder : i));
              fd.append("category", sortOrder === 0 ? "cover" : "gallery");

              const uploadResult = await savePhotosStepAction(fd);
              if (
                uploadResult &&
                "error" in uploadResult &&
                uploadResult.error
              ) {
                throw new Error(String(uploadResult.error));
              }
              if (uploadResult && uploadResult.id && uploadResult.url) {
                const idx = updatedPhotos.findIndex((p) => p.id === photo.id);
                if (idx >= 0) {
                  updatedPhotos[idx] = {
                    id: uploadResult.id,
                    url: uploadResult.url,
                  };
                }
              }
            }
          }
          setPhotos(updatedPhotos);

          // Update sort order for all remaining images
          const remainingIds = updatedPhotos.map((p) => p.id);
          const sortRes = await updateImagesSortOrderAction(
            activeId,
            remainingIds,
          );
          if (sortRes && "error" in sortRes && sortRes.error) {
            console.error("Failed to update sort order:", sortRes.error);
          }
        } else {
          // If no local files are being uploaded, check if we already have images in the DB
          const dbImagesCount = validPhotos.length;
          if (dbImagesCount === 0) {
            throw new Error(
              "Ảnh chưa được lưu lên hệ thống, vui lòng tải lại ảnh.",
            );
          }

          // Re-sort existing images if order changed
          const remainingIds = validPhotos.map((p) => p.id);
          const sortRes = await updateImagesSortOrderAction(
            activeId,
            remainingIds,
          );
          if (sortRes && "error" in sortRes && sortRes.error) {
            console.error("Failed to update sort order:", sortRes.error);
          }
        }
      }

      // 3. Save the step progress and next step index to Supabase
      const stepKey = getStepKey(currentStep);
      const draftPatch = {
        ...draft,
        id: activeId,
        currentStep: nextStepVal,
        updatedAt: new Date().toISOString(),
      };

      const result = await saveRegistrationStepAction({
        propertyId: activeId,
        stepIndex: currentStep,
        nextStepIndex: nextStepVal,
        stepKey,
        draftPatch,
      });

      if (result && "error" in result && result.error) {
        throw new Error(String(result.error));
      }

      // Development only logs
      if (process.env.NODE_ENV === "development") {
        console.log("[register-save-step]", {
          propertyId: currentId,
          stepIndex: currentStep,
          nextStepIndex: nextStepVal,
          stepKey,
          resultCurrentStep: nextStepVal,
        });
      }

      // 4. Advance step
      setDraft((prev) => ({ ...prev, currentStep: nextStepVal }));
      setCurrentStep(nextStepVal);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("[Wizard] Failed to go to next step:", err);
      let errMsg = err?.message || "Đã xảy ra lỗi khi lưu tiến độ.";
      if (
        errMsg.includes("Failed to parse body") ||
        errMsg.includes("Unexpected end of form")
      ) {
        errMsg =
          "Không thể tải ảnh lên. Vui lòng thử ảnh nhỏ hơn hoặc tải lại trang.";
      }
      setSaveError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    if (current === "amenities") {
      setDraft((prev) => ({ ...prev, currentStep: 6 }));
      setCurrentStep(6);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const prevStepVal = Math.max(currentStep - 1, 0);
    setDraft((prev) => ({ ...prev, currentStep: prevStepVal }));
    setCurrentStep(prevStepVal);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addBedroom = () => {
    const bedroom = makeBedroom({ single: 0 });
    setShowAllBedOptions(false);
    setDraft((prev) => ({
      ...prev,
      bedrooms: [...prev.bedrooms, bedroom],
      currentStep: 7,
    }));
    setActiveBedroomId(bedroom.id);
    setCurrentStep(7);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectBedroom = (id: string) => {
    setShowAllBedOptions(false);
    setActiveBedroomId(id);
    setDraft((prev) => ({ ...prev, currentStep: 7 }));
    setCurrentStep(7);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addressQuery = [
    draft.address,
    draft.district,
    draft.city,
    draft.country,
  ]
    .filter(Boolean)
    .join(", ");
  const mapQuery = addressQuery || "Việt Nam";
  const firstImage = validPhotos[0]?.url;
  const price = parsePrice(draft.price);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-950 flex flex-col font-sans">
      {/* Dynamic Header */}
      <header className="h-[68px] bg-[#f60057] text-white shrink-0">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-[28px] font-bold tracking-tight">
              StaySaga.
            </span>
          </div>
          <div className="flex items-center gap-6 text-[14px]">
            {/* Property details */}
            <div className="hidden md:flex flex-col text-right">
              <div className="font-bold flex items-center justify-end gap-1 cursor-pointer">
                <span>{draft.name || "StaySaga"}</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <span className="text-[12px] text-rose-100 truncate max-w-[280px]">
                {[draft.address, draft.district, draft.city]
                  .filter(Boolean)
                  .join(", ") || "Chưa cập nhật địa chỉ"}
              </span>
            </div>

            {/* Language */}
            <div className="flex items-center gap-1.5 cursor-pointer font-semibold">
              <Globe className="h-5 w-5 text-white" />
              <span>Tiếng Việt</span>
            </div>

            {/* Help */}
            <div className="flex items-center gap-1.5 cursor-pointer font-semibold">
              <CircleHelp className="h-5 w-5" />
              <span>Trợ giúp</span>
            </div>

            {/* User Profile Icon */}
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center cursor-pointer">
              <span className="text-[14px] font-bold">K</span>
            </div>
          </div>
        </div>
      </header>

      <form
        action={createHostHomestay}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ProgressHeader
          currentStep={currentStep}
          stageIndex={stageIndex}
          onSelectStage={onSelectStage}
          isStageAccessible={isStageAccessible}
        />
        <HiddenFields draft={draft} validPhotos={validPhotos.length} />

        {current !== "address" && showStepErrors && stepErrors.length > 0 ? (
          <div className="mx-auto mt-8 w-full max-w-[1200px] px-4 lg:ml-[110px]">
            <div className="w-full max-w-[620px] rounded-md border border-red-300 bg-red-50 p-5 text-sm text-red-700">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Vui lòng kiểm tra lại thông tin</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {stepErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <main
          className={
            current === "address"
              ? "h-[calc(100dvh-68px-94px)] min-h-[560px] flex-none overflow-hidden"
              : "mx-auto w-full max-w-[1200px] px-4 py-8 lg:ml-[110px] flex-1"
          }
        >
          {current !== "address" && saveError && (
            <div className="mb-6 w-full max-w-[560px] border border-rose-300 bg-rose-50 px-4 py-3 font-semibold text-rose-700 rounded-sm">
              ⚠️ {saveError}
            </div>
          )}
          {current === "category" ? (
            <section className="max-w-[1180px] py-6">
              <h1 className="max-w-[900px] text-[34px] font-bold leading-tight tracking-tight text-gray-950">
                Đăng chỗ nghỉ của Quý vị trên StaySaga và bắt đầu đón khách
                nhanh chóng!
              </h1>
              <p className="mt-4 text-xl text-gray-800">
                Để bắt đầu, chọn loại chỗ nghỉ Quý vị muốn đăng trên StaySaga.
              </p>
              <div className="relative mt-10 grid max-w-[1100px] grid-cols-1 border border-gray-300 bg-white md:grid-cols-4">
                <span className="absolute -top-4 left-16 rounded bg-emerald-600 px-5 py-1.5 text-sm font-bold text-white">
                  Bắt đầu nhanh
                </span>
                {propertyTypes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        updateDraft("propertyType", item.id);
                        setCurrentStep(1);
                      }}
                      className={`min-h-[260px] border-b border-gray-300 p-6 text-center transition hover:bg-gray-50 md:border-b-0 md:border-r last:md:border-r-0 cursor-pointer ${
                        draft.propertyType === item.id
                          ? "outline outline-2 outline-[#f60057]"
                          : ""
                      }`}
                    >
                      <Icon
                        className="mx-auto h-14 w-14 text-[#f60057]"
                        strokeWidth={1.8}
                      />
                      <h2 className="mt-5 text-lg font-bold">{item.title}</h2>
                      <p className="mx-auto mt-4 min-h-[64px] max-w-[220px] text-sm leading-6 text-gray-700">
                        {item.text}
                      </p>
                      <span className="mt-7 inline-flex w-full items-center justify-center rounded-sm bg-[#f60057] px-4 py-3 font-bold text-white hover:bg-[#d9004c]">
                        Đăng chỗ nghỉ
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : current === "address" ? (
            <AddressStep
              draft={draft}
              mapQuery={mapQuery}
              touched={touched}
              setTouched={setTouched}
              updateDraft={updateDraft}
              updateDraftFields={updateDraftFields}
              onBack={goBack}
              onNext={goNext}
              isSaving={isSaving}
              saveError={saveError}
            />
          ) : (
            <div className="grid max-w-[980px] grid-cols-1 gap-7 lg:grid-cols-[560px_340px]">
              <section
                className={
                  current === "photos" ||
                  current === "price" ||
                  current === "review"
                    ? "lg:col-span-2"
                    : ""
                }
              >
                {renderStep()}
                {current !== "confirm" &&
                !(current === "rates" && editingRatePolicy) ? (
                  <BottomNav
                    onBack={goBack}
                    onNext={current === "bedroom" ? saveBedroom : goNext}
                    isLast={current === "review"}
                    canContinue={
                      (current === "review"
                        ? finalErrors.length === 0
                        : canContinue) && !isSaving
                    }
                    pendingText="Đang gửi duyệt..."
                    confirmMessage="Sau khi gửi duyệt, quản trị viên StaySaga sẽ kiểm tra thông tin chỗ nghỉ trước khi hiển thị công khai."
                    onNotReady={() => setShowNotReadyModal(true)}
                    nextLabel={
                      isSaving
                        ? "Đang lưu..."
                        : current === "bedroom"
                          ? "Lưu"
                          : "Tiếp tục"
                    }
                    backLabel={current === "bedroom" ? "Hủy" : undefined}
                  />
                ) : null}
              </section>
            </div>
          )}
        </main>
      </form>

      {/* Leave Warning Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-[560px] rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={handleCancelLeave}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-[20px] font-bold text-gray-900 pr-8">
              Trước khi Quý vị rời đi
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              Quý vị đã thực hiện một số thay đổi trong trang này. Nếu Quý vị
              rời đi bây giờ, những thay đổi đó sẽ bị mất.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelLeave}
                className="rounded-sm border border-[#f60057] px-5 py-2.5 font-bold text-[#f60057] hover:bg-rose-50 transition cursor-pointer"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="rounded-sm bg-[#f60057] px-5 py-2.5 font-bold text-white hover:bg-[#d9004c] transition cursor-pointer"
              >
                Rời đi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Tôi chưa sẵn sàng" Modal */}
      {showNotReadyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-[560px] rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowNotReadyModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-[19px] font-bold text-gray-900 pr-8 leading-snug">
              Có lý do nào khiến Quý vị không muốn mở để nhận đặt phòng không?
            </h2>
            <div className="mt-6 space-y-4">
              {[
                "Chỗ nghỉ của tôi chưa sẵn sàng để nhận khách",
                "Tôi muốn kết nối với công cụ quản lý kênh của mình",
                "Tôi muốn cập nhật lịch của mình",
                "Tôi có thông tin cần thêm (hình ảnh, tiện nghi, giá, v.v.)",
                "Lý do khác",
              ].map((reason) => {
                const checked = notReadyReasons.includes(reason);
                return (
                  <label
                    key={reason}
                    className="flex cursor-pointer items-start gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setNotReadyReasons(
                            notReadyReasons.filter((r) => r !== reason),
                          );
                        } else {
                          setNotReadyReasons([...notReadyReasons, reason]);
                        }
                      }}
                      className="peer sr-only"
                    />
                    <span
                      className={`flex h-6 w-6 mt-0.5 shrink-0 items-center justify-center rounded-sm border ${
                        checked
                          ? "border-[#f60057] bg-[#f60057]"
                          : "border-gray-400 bg-white"
                      }`}
                    >
                      {checked ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : null}
                    </span>
                    <span className="text-[15px] leading-relaxed text-gray-700 select-none">
                      {reason}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowNotReadyModal(false);
                  window.location.href = "/host";
                }}
                className="rounded-sm bg-[#f60057] px-6 py-3 font-bold text-white hover:bg-[#d9004c] transition w-full text-center cursor-pointer"
              >
                Gửi và tiếp tục đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderStep() {
    switch (current) {
      case "units":
        return (
          <Question title="Quý vị định đăng bao nhiêu căn hộ?">
            <Panel>
              <SelectCard
                active={draft.unitMode === "single"}
                title="Một căn hộ"
                icon={<Home className="h-12 w-12 text-[#f60057]" />}
                onClick={() => updateDraft("unitMode", "single")}
              />
              <SelectCard
                active={draft.unitMode === "multiple"}
                title="Nhiều căn hộ"
                icon={<Building2 className="h-12 w-12 text-[#f60057]" />}
                onClick={() => updateDraft("unitMode", "multiple")}
              />
            </Panel>
          </Question>
        );
      case "confirm":
        return (
          <Question>
            <Panel className="text-center">
              <p className="text-base">Quý vị đang đăng:</p>
              <Building2 className="mx-auto mt-8 h-16 w-16 text-[#f60057]" />
              <h1 className="mx-auto mt-8 max-w-[420px] text-3xl font-bold leading-tight">
                Một căn hộ nơi khách có thể đặt nguyên căn
              </h1>
              <p className="mt-8 text-base">
                Quý vị thấy có đúng như chỗ nghỉ của mình không?
              </p>
              <button
                type="button"
                onClick={goNext}
                disabled={isSaving}
                className="mt-4 w-full rounded-sm bg-[#f60057] py-4 font-bold text-white disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? "Đang lưu..." : "Tiếp tục"}
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="mt-3 w-full rounded-sm border border-[#f60057] py-4 font-bold text-[#f60057]"
              >
                Không, tôi cần thay đổi
              </button>
            </Panel>
          </Question>
        );
      case "name":
        return (
          <Question title="Tên chỗ nghỉ Quý vị?">
            <div className="grid gap-7 lg:grid-cols-[560px_340px]">
              <Panel>
                <label className="text-sm font-bold" htmlFor="property-name">
                  Tên chỗ nghỉ
                </label>
                <input
                  id="property-name"
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  className="mt-2 h-11 w-full rounded-sm border border-gray-500 px-3 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                  placeholder="Ví dụ: Gôn Home Đà Lạt"
                />
                {(touched.name || showStepErrors) && !draft.name.trim() ? (
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    Vui lòng nhập tên chỗ nghỉ.
                  </p>
                ) : null}
              </Panel>
              <div className="space-y-5">
                <HelpCard
                  icon={<ThumbsUp className="h-6 w-6" />}
                  title="Tôi nên chú ý điều gì khi chọn tên?"
                >
                  <ul className="list-disc space-y-2 pl-5 text-[15px]">
                    <li>Chọn tên ngắn và hấp dẫn</li>
                    <li>Tránh sử dụng chữ viết tắt</li>
                    <li>Đúng với thực tế</li>
                  </ul>
                </HelpCard>
                <HelpCard
                  icon={<Info className="h-6 w-6" />}
                  title="Tại sao tôi cần đặt tên cho chỗ nghỉ của mình?"
                >
                  <p className="text-[15px] leading-6 text-gray-800">
                    Tên này sẽ hiển thị với khách trên StaySaga. Hãy chọn tên dễ
                    nhớ và không bao gồm địa chỉ đầy đủ.
                  </p>
                </HelpCard>
              </div>
            </div>
          </Question>
        );
      case "channel":
        return (
          <Question title="Kết nối với công cụ quản lý kênh">
            <Panel>
              <p className="font-bold">
                Quý vị có muốn kết nối đăng ký chỗ nghỉ này với công cụ quản lý
                kênh?
              </p>
              <p className="mt-8 leading-7 text-gray-800">
                Công cụ quản lý kênh giúp quản lý giá và tình trạng phòng trống
                trên nhiều nền tảng. Quý vị có thể bỏ qua và kết nối sau.
              </p>
              <div className="-mx-6 mt-8 border-t border-gray-200">
                <RadioLine
                  checked={draft.channelManager === "yes"}
                  label="Có, tôi sẽ kết nối đăng ký chỗ nghỉ này với công cụ quản lý kênh"
                  onClick={() => updateDraft("channelManager", "yes")}
                />
                <RadioLine
                  checked={draft.channelManager === "no"}
                  label="Không, tôi sẽ không sử dụng công cụ quản lý kênh tại thời điểm này"
                  onClick={() => updateDraft("channelManager", "no")}
                />
              </div>
            </Panel>
          </Question>
        );
      case "details":
        return (
          <Question title="Chi tiết chỗ nghỉ">
            <Panel>
              <p className="mb-5 text-[17px]">Khách có thể ngủ ở đâu?</p>
              <div className="space-y-5">
                {draft.bedrooms.map((room, index) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => selectBedroom(room.id)}
                    className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-5 py-4 text-left shadow-sm hover:border-[#f60057]"
                  >
                    <span>
                      <span className="block font-semibold">
                        Phòng ngủ {index + 1}
                      </span>
                      <span className="text-sm text-gray-500">
                        {bedSummary(room)}
                      </span>
                    </span>
                    <span className="text-[#f60057]">Chỉnh sửa</span>
                  </button>
                ))}
                <div className="rounded-md border border-gray-200 bg-white px-5 py-4 shadow-sm">
                  <span className="block font-semibold">Phòng khách</span>
                  <span className="text-sm text-gray-500">0 giường</span>
                </div>
                <button
                  type="button"
                  onClick={addBedroom}
                  className="inline-flex items-center gap-2 text-[#f60057]"
                >
                  <Plus className="h-4 w-4" /> Thêm phòng ngủ
                </button>
              </div>
            </Panel>
            <Panel className="mt-6 space-y-8">
              <Counter
                label="Bao nhiêu khách có thể lưu trú?"
                value={draft.maxGuests}
                min={1}
                onChange={(value) => updateDraft("maxGuests", value)}
              />
              <Counter
                label="Có bao nhiêu phòng tắm?"
                value={draft.bathrooms}
                min={1}
                onChange={(value) => updateDraft("bathrooms", value)}
              />
              <RadioPair
                label="Quý vị có tiếp đón trẻ em không?"
                value={draft.welcomeChildren}
                onChange={(value) => updateDraft("welcomeChildren", value)}
              />
              <RadioPair
                label="Quý vị có cung cấp nôi không?"
                value={draft.hasCrib}
                onChange={(value) => updateDraft("hasCrib", value)}
              />
              <div>
                <label className="text-sm font-bold">
                  Căn hộ này rộng bao nhiêu?
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={draft.area}
                    onChange={(event) =>
                      updateDraft("area", event.target.value)
                    }
                    className="h-11 w-36 rounded-sm border border-gray-500 px-3"
                    type="number"
                    min="0"
                  />
                  <select className="h-11 rounded-sm border border-gray-500 px-3">
                    <option>mét vuông</option>
                  </select>
                </div>
              </div>
            </Panel>
          </Question>
        );
      case "bedroom":
        const bedOptions = [
          ["single", "Giường đơn", "Rộng 90 - 130 cm"],
          ["double", "Giường đôi", "Rộng 131 - 150 cm"],
          ["king", "Giường lớn (cỡ King)", "Rộng 151 - 180 cm"],
          ["superKing", "Giường cực lớn (cỡ Super-king)", "Rộng 181 - 210 cm"],
          ["bunk", "Giường tầng", "Nhiều kích cỡ"],
          ["sofa", "Giường sofa", "Nhiều kích cỡ"],
          ["futon", "Nệm Futon", "Nhiều kích cỡ"],
        ];
        const visibleBedOptions = showAllBedOptions
          ? bedOptions
          : bedOptions.slice(0, 4);
        return (
          <Question
            title={`Phòng ngủ ${Math.max(1, draft.bedrooms.findIndex((room) => room.id === activeBedroom.id) + 1)}`}
          >
            <Panel className="max-w-[625px] p-5">
              <p className="mb-4 text-[17px]">Phòng này có giường loại nào?</p>
              {visibleBedOptions.map(([key, label, sub]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-4">
                    <BedDouble className="h-7 w-7 text-gray-400" />
                    <div>
                      <p className="font-bold">{label}</p>
                      <p className="text-sm text-gray-600">{sub}</p>
                    </div>
                  </div>
                  <Stepper
                    value={activeBedroom[key as keyof Bedroom] as number}
                    min={0}
                    onChange={(value) =>
                      updateBedroom(
                        activeBedroom.id,
                        key as keyof Bedroom,
                        value,
                      )
                    }
                  />
                </div>
              ))}
              {!showAllBedOptions ? (
                <button
                  type="button"
                  onClick={() => setShowAllBedOptions(true)}
                  className="mt-3 inline-flex items-center gap-2 font-semibold text-[#f60057]"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                  Thêm các lựa chọn giường
                </button>
              ) : null}
            </Panel>
          </Question>
        );
      case "amenities":
        return (
          <Question title="Khách có thể sử dụng gì tại chỗ nghỉ?">
            <Panel>
              <AmenityGroup
                title="Tiện nghi chung"
                items={commonAmenities.slice(0, 4)}
              />
              <AmenityGroup
                title="Nấu nướng và giặt rửa"
                items={commonAmenities.slice(4, 7)}
              />
              <AmenityGroup
                title="Giải trí"
                items={commonAmenities.slice(7, 12)}
              />
              <AmenityGroup
                title="Không gian ngoài trời và tầm nhìn"
                items={commonAmenities.slice(12)}
              />
            </Panel>
          </Question>
        );
      case "services":
        return (
          <Question title="Dịch vụ và chỗ đậu xe">
            <Panel>
              <AmenityGroup
                title="Dịch vụ tại chỗ nghỉ"
                items={serviceAmenities}
              />
            </Panel>
            <Panel className="mt-6">
              <h2 className="mb-8 text-2xl font-bold">Chỗ đậu xe</h2>
              <RadioBlock
                label="Quý vị có chỗ đậu xe cho khách không?"
                options={[
                  ["free", "Có, miễn phí"],
                  ["paid", "Có, tính phí"],
                  ["none", "Không"],
                ]}
                value={draft.parking}
                onChange={(value) =>
                  updateDraft("parking", value as Draft["parking"])
                }
              />
              <Divider />
              <RadioBlock
                label="Khách có cần đặt trước chỗ đậu xe không?"
                options={[
                  ["required", "Cần đặt trước"],
                  ["not_required", "Không cần đặt trước"],
                ]}
                value={draft.parkingReservation}
                onChange={(value) =>
                  updateDraft(
                    "parkingReservation",
                    value as Draft["parkingReservation"],
                  )
                }
              />
              <Divider />
              <RadioBlock
                label="Chỗ đậu xe ở đâu?"
                options={[
                  ["onsite", "Trong khuôn viên"],
                  ["offsite", "Ngoài khuôn viên"],
                ]}
                value={draft.parkingLocation}
                onChange={(value) =>
                  updateDraft(
                    "parkingLocation",
                    value as Draft["parkingLocation"],
                  )
                }
              />
              <Divider />
              <RadioBlock
                label="Đây là loại chỗ đậu xe gì?"
                options={[
                  ["private", "Riêng"],
                  ["public", "Công cộng"],
                ]}
                value={draft.parkingType}
                onChange={(value) =>
                  updateDraft("parkingType", value as Draft["parkingType"])
                }
              />
            </Panel>
          </Question>
        );
      case "languages":
        return (
          <Question title="Quý vị hoặc nhân viên của mình sẽ sử dụng ngôn ngữ nào?">
            <Panel>
              <h2 className="mb-5 font-bold">Chọn ngôn ngữ</h2>
              {supportedLanguages.map((language) => (
                <CheckboxLine
                  key={language}
                  checked={draft.languages.includes(language)}
                  label={language}
                  onChange={() => toggleArray("languages", language)}
                />
              ))}
              <Divider />
              <h2 className="mb-5 font-bold">Thêm các ngôn ngữ khác</h2>
              <select className="h-11 w-full rounded-sm border border-gray-500 px-3 text-gray-600">
                <option>Chọn ngôn ngữ</option>
              </select>
              <div className="mt-4 max-h-[260px] overflow-y-auto rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                {extraLanguages.map((language) => (
                  <CheckboxLine
                    key={language}
                    checked={draft.extraLanguages.includes(language)}
                    label={language}
                    onChange={() => toggleArray("extraLanguages", language)}
                  />
                ))}
              </div>
            </Panel>
          </Question>
        );
      case "policies":
        return (
          <Question title="Quy định chung">
            <div className="grid gap-7 lg:grid-cols-[560px_340px]">
              <Panel>
                <ToggleLine
                  label="Cho phép hút thuốc"
                  checked={draft.allowSmoking}
                  onChange={(value) => updateDraft("allowSmoking", value)}
                />
                <ToggleLine
                  label="Cho phép tiệc tùng/sự kiện"
                  checked={draft.allowParties}
                  onChange={(value) => updateDraft("allowParties", value)}
                />
                <Divider />
                <RadioBlock
                  label="Quý vị có cho phép vật nuôi không?"
                  options={[
                    ["yes", "Có"],
                    ["request", "Theo yêu cầu"],
                    ["no", "Không"],
                  ]}
                  value={draft.petsPolicy}
                  onChange={(value) =>
                    updateDraft("petsPolicy", value as Draft["petsPolicy"])
                  }
                />
                {draft.petsPolicy !== "no" ? (
                  <RadioBlock
                    label="Quý vị có tính phí đối với vật nuôi không?"
                    options={[
                      ["free", "Vật nuôi được lưu trú miễn phí"],
                      ["paid", "Có thể tính phí"],
                    ]}
                    value={draft.petFee}
                    onChange={(value) =>
                      updateDraft("petFee", value as Draft["petFee"])
                    }
                  />
                ) : null}
                <Divider />
                <div className="grid grid-cols-2 gap-7">
                  <TimeSelect
                    label="Nhận phòng từ"
                    value={draft.checkInFrom}
                    onChange={(value) => updateDraft("checkInFrom", value)}
                  />
                  <TimeSelect
                    label="Nhận phòng đến"
                    value={draft.checkInTo}
                    onChange={(value) => updateDraft("checkInTo", value)}
                  />
                  <TimeSelect
                    label="Trả phòng từ"
                    value={draft.checkOutFrom}
                    onChange={(value) => updateDraft("checkOutFrom", value)}
                  />
                  <TimeSelect
                    label="Trả phòng đến"
                    value={draft.checkOutTo}
                    onChange={(value) => updateDraft("checkOutTo", value)}
                  />
                </div>
              </Panel>
              <HelpCard
                icon={<Info className="h-6 w-6" />}
                title="Nếu quy tắc chung thay đổi thì sao?"
              >
                <p className="text-[15px] leading-6">
                  Quý vị có thể chỉnh sửa các quy tắc này trong trang quản lý
                  chỗ nghỉ sau khi hoàn tất đăng ký.
                </p>
              </HelpCard>
            </div>
          </Question>
        );
      case "partner-profile":
        return (
          <Question title="Hồ sơ đối tác">
            <Panel>
              <p className="leading-7">
                Giúp chỗ nghỉ nổi bật hơn bằng cách cho khách biết thêm một chút
                về Quý vị, chỗ nghỉ và khu vực xung quanh.
              </p>
              {[
                ["property", "Chỗ nghỉ"],
                ["partner", "Đối tác"],
                ["area", "Khu vực xung quanh"],
                ["none", "Không thông tin nào cả / Tôi sẽ thêm chúng sau"],
              ].map(([value, label]) => (
                <CheckboxLine
                  key={value}
                  checked={draft.partnerProfile.includes(value)}
                  label={label}
                  onChange={() => toggleArray("partnerProfile", value)}
                />
              ))}
              {draft.partnerProfile.includes("partner") ? (
                <div className="mt-4 space-y-4">
                  <input
                    value={draft.partnerName}
                    onChange={(event) =>
                      updateDraft("partnerName", event.target.value)
                    }
                    placeholder="Tên đối tác"
                    className="h-11 w-full rounded-sm border border-gray-500 px-3"
                  />
                  <textarea
                    value={draft.partnerBio}
                    onChange={(event) =>
                      updateDraft("partnerBio", event.target.value)
                    }
                    placeholder="Sở thích của Quý vị là gì? Quý vị thích điều gì khi làm đối tác?"
                    className="min-h-[110px] w-full rounded-sm border border-gray-500 px-3 py-2"
                  />
                </div>
              ) : null}
            </Panel>
          </Question>
        );
      case "photos":
        return (
          <Question title="Chỗ nghỉ của Quý vị trông như thế nào?">
            {photos.some((photo) => photo.warning) ? (
              <div className="mb-7 rounded-md border border-red-400 bg-red-50 p-5 text-red-700">
                <p className="font-bold">
                  Không thể tải lên{" "}
                  {photos.filter((photo) => photo.warning).length} ảnh
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
                  <li>Ảnh phải là jpg, jpeg hoặc png</li>
                  <li>Ảnh nên có độ phân giải tốt, rõ và không bị trùng</li>
                </ul>
              </div>
            ) : null}
            <div className="grid gap-7 lg:grid-cols-[560px_340px]">
              <Panel>
                <p>
                  <strong>
                    Đăng tải ít nhất {MIN_PHOTOS} ảnh của chỗ nghỉ.
                  </strong>{" "}
                  Càng đăng nhiều, Quý vị càng có cơ hội nhận đặt phòng. Quý vị
                  có thể thêm ảnh sau.
                </p>
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 text-center ${
                    dragActive
                      ? "border-[#f60057] bg-rose-50"
                      : "border-gray-400"
                  }`}
                >
                  <ImageIcon className="h-20 w-20 text-gray-200" />
                  <span className="mt-3 font-bold">Kéo và thả hoặc</span>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-sm border border-[#f60057] px-4 py-2 font-bold text-[#f60057]">
                    <Camera className="h-4 w-4" /> Đăng tải ảnh
                  </span>
                  <span className="mt-4 text-sm text-gray-600">
                    jpg/jpeg hoặc png, tối đa 10MB mỗi file
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoInput}
                  />
                </label>
                {photos.length ? (
                  <div className="mt-10 grid grid-cols-2 gap-5">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className={`relative overflow-hidden rounded-sm border ${photo.warning ? "border-red-200 bg-red-50" : "border-gray-300"}`}
                      >
                        {index === 0 && !photo.warning ? (
                          <span className="absolute left-3 top-0 z-10 rounded-b bg-[#f60057] px-2 py-1 text-xs font-semibold text-white">
                            Ảnh chính
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            setPhotos((prev) =>
                              prev.filter((item) => item.id !== photo.id),
                            )
                          }
                          className="absolute right-2 top-2 z-10 rounded-full border border-gray-700 bg-white p-1"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <img
                          src={photo.url}
                          alt={photo.file?.name || "Ảnh chỗ nghỉ"}
                          className="h-48 w-full object-cover"
                        />
                        {photo.warning ? (
                          <div className="flex items-center gap-2 p-3 text-sm font-bold text-red-700">
                            <Info className="h-5 w-5" /> {photo.warning}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Panel>
              <HelpCard
                icon={<ThumbsUp className="h-6 w-6" />}
                title="Nếu tôi không có ảnh chụp chuyên nghiệp thì sao?"
              >
                <p className="text-[15px] leading-6">
                  Quý vị có thể dùng ảnh chụp bằng điện thoại nếu ảnh rõ, đủ
                  sáng và thể hiện đúng chỗ nghỉ.
                </p>
              </HelpCard>
            </div>
          </Question>
        );
      case "booking":
        return (
          <Question title="Cách thức nhận đơn đặt phòng">
            <Panel>
              <p className="font-bold">
                Để đảm bảo nhận đặt phòng một cách an toàn hơn, Quý vị có thể:
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  "Thiết lập quy tắc chung để khách chấp thuận trước khi lưu trú",
                  "Yêu cầu đặt cọc đề phòng hư hại",
                  "Báo cáo hành vi sai phạm của khách",
                  "Được hỗ trợ khi có sự cố phát sinh",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="h-5 w-5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel className="mt-6">
              <p className="mb-4 font-bold">
                Khách có thể đặt chỗ nghỉ của Quý vị theo cách nào?
              </p>
              <RadioLine
                checked={draft.bookingMode === "instant"}
                label="Tất cả khách có thể đặt phòng ngay lập tức"
                onClick={() => updateDraft("bookingMode", "instant")}
              />
              <RadioLine
                checked={draft.bookingMode === "request"}
                label="Tất cả khách cần gửi yêu cầu đặt phòng"
                onClick={() => updateDraft("bookingMode", "request")}
              />
            </Panel>
          </Question>
        );
      case "price":
        return (
          <Question title="Giá mỗi đêm">
            <div className="grid gap-7 lg:grid-cols-[560px_340px]">
              <div>
                <Panel>
                  <p className="font-bold">
                    Đưa ra giá cạnh tranh để tăng khả năng nhận thêm đặt phòng.
                  </p>
                  <p className="mt-4">
                    Đây là khoảng giá của các chỗ nghỉ tương tự với Quý vị.
                  </p>
                  <div className="mt-8 px-3">
                    <div className="relative h-1 bg-rose-100">
                      <div className="absolute left-[25%] right-[25%] h-1 bg-[#f60057]" />
                      <span className="absolute left-1/2 top-[-34px] -translate-x-1/2 rounded bg-[#f60057] px-3 py-1 text-sm font-semibold text-white">
                        Mức giá ở giữa: VND 90.258
                      </span>
                    </div>
                    <div className="mt-4 flex justify-between text-sm font-bold text-[#f60057]">
                      <span>VND 30.684</span>
                      <span>VND 274.363</span>
                    </div>
                  </div>
                </Panel>
                <Panel className="mt-6">
                  <label className="text-sm font-bold">
                    Quý vị muốn thu bao nhiêu tiền mỗi đêm?
                  </label>
                  <div className="mt-3 flex h-11 rounded-sm border border-gray-500">
                    <span className="flex items-center border-r border-gray-300 px-3 text-gray-700">
                      VND
                    </span>
                    <input
                      value={draft.price}
                      onChange={(event) =>
                        updateDraft("price", event.target.value)
                      }
                      className="w-full px-3 outline-none"
                      inputMode="numeric"
                    />
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    Bao gồm các loại thuế, phí và hoa hồng
                  </p>
                  <div className="mt-8 border-t pt-6">
                    <p>
                      <span className="text-xl">15,00%</span>{" "}
                      <span className="ml-2">Hoa hồng cho StaySaga</span>
                    </p>
                    <ul className="mt-6 space-y-3 text-gray-700">
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-emerald-600" /> Hỗ trợ
                        24/7 bằng ngôn ngữ của Quý vị
                      </li>
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-emerald-600" /> Tiết kiệm
                        thời gian với đặt phòng được xác nhận tự động
                      </li>
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-emerald-600" /> StaySaga
                        sẽ quảng bá chỗ nghỉ của Quý vị
                      </li>
                    </ul>
                  </div>
                  <p className="mt-7 border-t pt-5 text-lg">
                    {formatVnd(Math.max(0, price * 0.85))} Doanh thu của Quý vị
                    (bao gồm thuế)
                  </p>
                </Panel>
                <Panel className="mt-6">
                  <CheckboxLine
                    checked={draft.promotion}
                    label="Thu hút khách bằng giảm giá 20%"
                    onChange={() => updateDraft("promotion", !draft.promotion)}
                  />
                  <p className="mt-5 text-sm">
                    Giảm 20% cho 3 đơn đặt đầu tiên hoặc trong 90 ngày, tùy
                    trường hợp nào đến trước.
                  </p>
                  <p className="mt-6 border-t pt-5">
                    <span className="line-through">{formatVnd(price)}</span>{" "}
                    <span className="font-bold text-emerald-700">
                      {formatVnd(price * 0.8)}/đêm
                    </span>
                  </p>
                </Panel>
              </div>
              <HelpCard
                icon={<Info className="h-6 w-6" />}
                title="Nếu tôi cảm thấy chưa chắc chắn về giá thì sao?"
              >
                <p className="text-[15px] leading-6">
                  Quý vị có thể đổi lại bất cứ lúc nào sau khi hoàn tất đăng ký.
                </p>
              </HelpCard>
            </div>
          </Question>
        );
      case "availability":
        return (
          <Question title="Tình trạng phòng trống">
            <div className="grid gap-7 lg:grid-cols-[620px_340px]">
              <div className="space-y-6">
                <Panel className="max-w-[620px]">
                  <p className="mb-7 font-bold">
                    Ngày đầu tiên mà khách có thể nhận phòng là khi nào?
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        checked={draft.availabilityStart === "asap"}
                        onChange={() =>
                          updateDraft("availabilityStart", "asap")
                        }
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      Càng sớm càng tốt
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        checked={draft.availabilityStart === "specific"}
                        onChange={() =>
                          updateDraft("availabilityStart", "specific")
                        }
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      Vào một ngày cụ thể
                    </label>
                  </div>
                </Panel>

                <Panel className="max-w-[620px]">
                  <p className="mb-7 font-bold">
                    Quý vị muốn mở ngày để nhận đặt phòng ra sao?
                  </p>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      checked={draft.availabilityOpenMode === "continuous"}
                      onChange={() =>
                        updateDraft("availabilityOpenMode", "continuous")
                      }
                      className="h-5 w-5 accent-[#f60057]"
                    />
                    Liên tục mở phòng cho:
                  </label>
                  <select
                    value={draft.availabilityOpenDays}
                    onChange={(event) =>
                      updateDraft(
                        "availabilityOpenDays",
                        Number(event.target.value),
                      )
                    }
                    className="ml-8 mt-3 h-11 w-[260px] rounded-sm border border-gray-500 bg-white px-3 outline-none"
                  >
                    <option value={365}>365 ngày</option>
                    <option value={180}>180 ngày</option>
                    <option value={90}>90 ngày</option>
                    <option value={30}>30 ngày</option>
                  </select>
                  <label className="mt-5 flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      checked={draft.availabilityOpenMode === "first18"}
                      onChange={() =>
                        updateDraft("availabilityOpenMode", "first18")
                      }
                      className="h-5 w-5 accent-[#f60057]"
                    />
                    Chỉ mở trong 18 tháng đầu
                  </label>
                </Panel>

                <Panel className="max-w-[620px]">
                  <p className="font-bold">
                    Đồng bộ tình trạng phòng trống của Quý vị với một trang web
                    khác
                  </p>
                  <p className="mt-3 text-sm text-emerald-700">
                    Tránh đặt phòng bị trùng và giúp khách đặt phòng nhanh hơn
                    tới 80% bằng cách nhập lịch phòng trống.
                  </p>
                  <div className="mt-7 space-y-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        checked={draft.syncCalendar}
                        onChange={() => updateDraft("syncCalendar", true)}
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      Nhập lịch phòng trống
                      <Info className="h-4 w-4" />
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        checked={!draft.syncCalendar}
                        onChange={() => updateDraft("syncCalendar", false)}
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      Bỏ qua
                    </label>
                  </div>
                </Panel>

                <Panel className="max-w-[620px]">
                  <p className="font-bold">
                    Quý vị có muốn cho phép khách lưu trú trên 30 đêm không?
                  </p>
                  <p className="mt-4">
                    Cho phép khách lưu trú đến 90 đêm có thể giúp Quý vị lấp
                    phòng và nắm bắt xu hướng làm việc từ xa của khách.
                  </p>
                  <p className="mt-7 font-bold">
                    Quý vị có chấp nhận đơn đặt có thời gian lưu trú hơn 30 đêm
                    không?
                  </p>
                  <div className="mt-3 flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        checked={draft.allowLongStays}
                        onChange={() => updateDraft("allowLongStays", true)}
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      Có
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        checked={!draft.allowLongStays}
                        onChange={() => updateDraft("allowLongStays", false)}
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      Không
                    </label>
                  </div>
                  {draft.allowLongStays ? (
                    <label className="mt-7 block font-bold">
                      Quý vị cho phép khách đặt tối đa bao nhiêu đêm?
                      <select
                        value={draft.maxStayNights}
                        onChange={(event) =>
                          updateDraft(
                            "maxStayNights",
                            Number(event.target.value),
                          )
                        }
                        className="mt-2 block h-11 w-full max-w-[410px] rounded-sm border border-gray-500 bg-white px-3 font-normal outline-none"
                      >
                        <option value={90}>90</option>
                        <option value={60}>60</option>
                        <option value={45}>45</option>
                        <option value={30}>30</option>
                      </select>
                    </label>
                  ) : null}
                </Panel>
              </div>

              <div className="space-y-6">
                {availabilityTips.sync ? (
                  <TipCard
                    title="Đồng bộ ngay để được đặt phòng nhanh hơn"
                    onClose={() =>
                      setAvailabilityTips((prev) => ({ ...prev, sync: false }))
                    }
                  >
                    Quý vị có thể để sau, nhưng việc đồng bộ hóa ngay bây giờ sẽ
                    tránh đặt phòng bị trùng và giúp Quý vị được đặt phòng nhanh
                    hơn với hàng triệu khách của StaySaga.
                  </TipCard>
                ) : null}
                {availabilityTips.longStay ? (
                  <TipCard
                    title="Nếu sau này tôi muốn thay đổi lựa chọn của mình thì sao?"
                    onClose={() =>
                      setAvailabilityTips((prev) => ({
                        ...prev,
                        longStay: false,
                      }))
                    }
                  >
                    Đây không phải là lựa chọn cố định. Quý vị có thể thay đổi
                    bất kì lúc nào trong phần Chính sách sau khi đăng kí xong.
                    <span className="mt-4 block text-[#f60057]">
                      Đọc thêm về đợt lưu trú trên 30 đêm
                    </span>
                  </TipCard>
                ) : null}
              </div>
            </div>
          </Question>
        );
      case "rates":
        if (editingRatePolicy) {
          return (
            <Question title="Chính sách hủy đặt phòng">
              <div className="grid gap-7 lg:grid-cols-[560px_340px]">
                <div>
                  <Panel>
                    <p className="font-semibold">
                      Khách có thể{" "}
                      <span className="font-bold">hủy đặt phòng miễn phí</span>{" "}
                      trước ngày nhận phòng bao nhiêu ngày?
                    </p>
                    <div className="mt-5">
                      <span className="inline-flex rounded-sm bg-emerald-700 px-2 py-1 text-sm font-semibold text-white">
                        Được đề xuất
                      </span>
                      <div className="flex w-fit max-w-full flex-wrap rounded-full border border-gray-300 bg-gray-100 p-1">
                        {[1, 5, 14, 30].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() =>
                              updateDraft("cancellationFreeDays", days)
                            }
                            className={`min-w-[84px] rounded-full px-4 py-2 text-sm transition ${
                              draft.cancellationFreeDays === days
                                ? "border border-gray-700 bg-white font-semibold shadow-sm"
                                : "border border-transparent"
                            }`}
                          >
                            {days} ngày
                          </button>
                        ))}
                      </div>
                    </div>
                    {draft.cancellationFreeDays === 1 ? (
                      <div className="mt-7 rounded-sm border border-orange-500 bg-orange-50 p-4">
                        Cho phép khách hủy phòng chậm nhất là 1 ngày trước khi
                        đến để dễ dàng thu hút đặt phòng hơn
                      </div>
                    ) : null}
                    <div className="mt-6 flex gap-3">
                      <Info className="mt-1 h-5 w-5 shrink-0 text-rose-600" />
                      <p>
                        Khách thích sự linh hoạt - giá hủy miễn phí thường là
                        giá được đặt nhiều nhất trên trang web của chúng tôi.
                        Nhận đặt phòng đầu tiên của Quý vị sớm hơn bằng cách cho
                        phép khách hủy muộn nhất {draft.cancellationFreeDays}{" "}
                        ngày trước thời điểm nhận phòng.
                      </p>
                    </div>
                    <div className="mt-8">
                      <p className="font-bold">
                        Bảo vệ khỏi đặt phòng do nhầm lẫn
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft(
                              "accidentalBookingProtection",
                              !draft.accidentalBookingProtection,
                            )
                          }
                          className={`relative h-7 w-12 rounded-full transition ${
                            draft.accidentalBookingProtection
                              ? "bg-[#f60057]"
                              : "bg-gray-400"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                              draft.accidentalBookingProtection
                                ? "left-6"
                                : "left-1"
                            }`}
                          />
                        </button>
                        <span>
                          {draft.accidentalBookingProtection ? "Bật" : "Tắt"}
                        </span>
                      </div>
                      <p className="mt-4 text-sm text-gray-600">
                        Để tránh việc Quý vị tốn thời gian xử lý các đặt phòng
                        do nhầm lẫn, chúng tôi tự động miễn phí hủy cho các
                        khách hủy trong vòng 24 giờ kể từ thời điểm đặt.
                      </p>
                    </div>
                  </Panel>
                  <div className="mt-8 flex w-full max-w-[560px] gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingRatePolicy(false)}
                      className="inline-flex h-14 w-28 items-center justify-center gap-2 rounded-sm border border-[#f60057] font-bold text-[#f60057]"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRatePolicy(false)}
                      className="h-14 flex-1 rounded-sm bg-[#f60057] font-bold text-white hover:bg-[#d9004c]"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
                {showRatePolicyHelp ? (
                  <TipCard
                    title="Tôi nên chọn chính sách nào?"
                    onClose={() => setShowRatePolicyHelp(false)}
                  >
                    Dù chọn chính sách nào bây giờ, Quý vị đều có thể dễ dàng
                    cập nhật sau khi hoàn thành đăng ký.
                  </TipCard>
                ) : null}
              </div>
            </Question>
          );
        }

        return (
          <Question title="Loại giá">
            <Panel>
              <p>
                Để thu hút nhiều đối tượng khách hơn, StaySaga đề xuất Quý vị
                thiết lập nhiều loại giá. Các mức giá và chính sách này có thể
                chỉnh sửa sau.
              </p>
            </Panel>
            <h2 className="mt-10 text-2xl font-bold">Loại giá tiêu chuẩn</h2>
            <Panel className="mt-4">
              <div className="flex justify-between">
                <h3 className="font-bold">Chính sách hủy</h3>
                <button
                  type="button"
                  className="rounded-sm border border-[#f60057] px-4 py-2 font-semibold text-[#f60057]"
                  onClick={() => setEditingRatePolicy(true)}
                >
                  Chỉnh sửa
                </button>
              </div>
              <p className="mt-5 text-sm leading-6 text-emerald-700">
                Với chính sách hủy mặc định, Quý vị sẽ tăng khả năng nhận đặt
                phòng lên thêm 91% so với chính sách hủy trước 30 ngày
              </p>
              <ul className="mt-5 space-y-4">
                <li className="flex gap-3">
                  <Check className="h-7 w-7 shrink-0 rounded-full border p-1" />{" "}
                  Khách có thể hủy đặt phòng miễn phí cho tới{" "}
                  {draft.cancellationFreeDays} ngày trước khi đến
                </li>
                <li className="flex gap-3">
                  <Check className="h-7 w-7 shrink-0 rounded-full border p-1" />{" "}
                  {draft.accidentalBookingProtection
                    ? "Khách hủy trong vòng 24 giờ sẽ được miễn phí hủy"
                    : "Bảo vệ đặt phòng do nhầm lẫn đang tắt"}
                </li>
              </ul>
              <Divider />
              <div className="flex justify-between">
                <h3 className="font-bold">Giá theo cỡ nhóm</h3>
                <button
                  type="button"
                  className="rounded-sm border border-[#f60057] px-4 py-2 font-semibold text-[#f60057]"
                  onClick={() => setCurrentStep(steps.indexOf("group-pricing"))}
                >
                  Chỉnh sửa
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {[4, 3, 2, 1].map((count) => (
                  <p key={count}>
                    {count} khách:{" "}
                    {formatVnd(
                      price *
                        (1 - (draft.groupDiscounts[String(count)] ?? 0) / 100),
                    )}
                  </p>
                ))}
              </div>
            </Panel>
          </Question>
        );
      case "non-refundable":
        return (
          <Question title="Thiết lập loại giá không hoàn tiền">
            <div className="grid gap-7 lg:grid-cols-[560px_340px]">
              <Panel>
                <p>
                  Với loại giá không hoàn tiền, khách trả ít hơn nhưng doanh thu
                  của Quý vị được đảm bảo nếu khách hủy hoặc vắng mặt.
                </p>
                <ToggleLine
                  label="Thiết lập loại giá không hoàn tiền"
                  checked={draft.nonRefundable}
                  onChange={(value) => updateDraft("nonRefundable", value)}
                />
                <Divider />
                <label className="text-sm font-bold">
                  Giảm giá cho khách đặt với loại giá này:
                </label>
                <div className="mt-2 flex h-11 rounded-sm border border-gray-500">
                  <input
                    type="number"
                    value={draft.nonRefundableDiscount}
                    onChange={(event) =>
                      updateDraft(
                        "nonRefundableDiscount",
                        Number(event.target.value),
                      )
                    }
                    className="w-full px-3 outline-none"
                  />
                  <span className="flex items-center border-l px-3">%</span>
                </div>
                <div className="mt-6 bg-rose-50 p-4">
                  <p>{formatVnd(price)} Giá cơ bản</p>
                  <p>{draft.nonRefundableDiscount}% Giảm giá</p>
                  <p className="font-bold">
                    {formatVnd(price * (1 - draft.nonRefundableDiscount / 100))}{" "}
                    Giá không hoàn tiền
                  </p>
                </div>
              </Panel>
              <HelpCard
                icon={<CircleHelp className="h-6 w-6" />}
                title="Tại sao tôi cần thêm loại giá không hoàn tiền?"
              >
                <p className="text-[15px] leading-6">
                  Loại giá này giúp thu hút khách chắc chắn về ngày đi và không
                  cần linh hoạt hủy.
                </p>
              </HelpCard>
            </div>
          </Question>
        );
      case "group-pricing":
        return (
          <Question title="Giá theo cỡ nhóm">
            <Panel>
              <p>
                Cài đặt giá thấp hơn cho nhóm ít khách giúp chỗ nghỉ hấp dẫn hơn
                trong nhiều kiểu tìm kiếm.
              </p>
              <ToggleLine
                label="Đã bật"
                checked={draft.groupPricing}
                onChange={(value) => updateDraft("groupPricing", value)}
              />
              <div className="mt-6 divide-y border-t">
                {[4, 3, 2, 1].map((count) => (
                  <div
                    key={count}
                    className="grid grid-cols-3 items-center gap-4 py-4"
                  >
                    <span>{count} khách</span>
                    {count === 4 ? (
                      <span>0%</span>
                    ) : (
                      <div className="flex h-10 rounded-sm border border-gray-500">
                        <input
                          type="number"
                          value={draft.groupDiscounts[String(count)] ?? 0}
                          onChange={(event) =>
                            updateDraft("groupDiscounts", {
                              ...draft.groupDiscounts,
                              [String(count)]: Number(event.target.value),
                            })
                          }
                          className="w-full px-3 outline-none"
                        />
                        <span className="border-l px-3 py-2">%</span>
                      </div>
                    )}
                    <span className="text-right">
                      {formatVnd(
                        price *
                          (1 -
                            (draft.groupDiscounts[String(count)] ?? 0) / 100),
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </Question>
        );
      case "legal":
        return (
          <Question title="Xác minh đối tác">
            <Panel className="max-w-[625px] space-y-5">
              <p className="text-[16px] leading-relaxed text-gray-800">
                Để tuân thủ các yêu cầu pháp lý và quy định khác nhau, chúng tôi
                cần thu thập và xác minh một số thông tin về Quý vị và chỗ nghỉ.
              </p>

              <div>
                <label
                  className="text-sm font-bold block mb-2"
                  htmlFor="owner-type"
                >
                  Chỗ nghỉ được sở hữu bởi cá nhân hay pháp nhân doanh nghiệp?
                </label>
                <select
                  id="owner-type"
                  value={draft.legalOwnerType}
                  onChange={(e) =>
                    updateDraft(
                      "legalOwnerType",
                      e.target.value as "" | "individual" | "business",
                    )
                  }
                  className="h-11 w-full rounded-sm border border-gray-500 bg-white px-3 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057] cursor-pointer"
                >
                  <option value="">Chọn một lựa chọn</option>
                  <option value="individual">
                    Tôi là cá nhân riêng lẻ tự điều hành việc kinh doanh của
                    mình
                  </option>
                  <option value="business">
                    Tôi là đại diện cho pháp nhân doanh nghiệp
                  </option>
                </select>
              </div>

              {draft.legalOwnerType === "business" && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <label
                      className="text-sm font-bold block mb-1"
                      htmlFor="business-name"
                    >
                      Tên đầy đủ của pháp nhân doanh nghiệp *
                    </label>
                    <input
                      id="business-name"
                      value={draft.businessName}
                      onChange={(e) =>
                        updateDraft("businessName", e.target.value)
                      }
                      className="h-11 w-full rounded-sm border border-gray-500 px-3 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                      placeholder="Nhập tên doanh nghiệp đầy đủ"
                    />
                  </div>

                  <div>
                    <label
                      className="text-sm font-bold block mb-1"
                      htmlFor="business-address"
                    >
                      Địa chỉ của pháp nhân doanh nghiệp *
                    </label>
                    <input
                      id="business-address"
                      value={draft.businessAddress}
                      onChange={(e) =>
                        updateDraft("businessAddress", e.target.value)
                      }
                      className="h-11 w-full rounded-sm border border-gray-500 px-3 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                      placeholder="Nhập địa chỉ doanh nghiệp"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="text-sm font-bold block mb-1"
                        htmlFor="business-postal"
                      >
                        Mã bưu điện *
                      </label>
                      <input
                        id="business-postal"
                        value={draft.businessPostalCode}
                        onChange={(e) =>
                          updateDraft("businessPostalCode", e.target.value)
                        }
                        className="h-11 w-full rounded-sm border border-gray-500 px-3 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                        placeholder="Ví dụ: 550000"
                      />
                    </div>
                    <div>
                      <label
                        className="text-sm font-bold block mb-1"
                        htmlFor="business-city"
                      >
                        Thành phố *
                      </label>
                      <input
                        id="business-city"
                        value={draft.businessCity}
                        onChange={(e) =>
                          updateDraft("businessCity", e.target.value)
                        }
                        className="h-11 w-full rounded-sm border border-gray-500 px-3 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                        placeholder="Ví dụ: Đà Nẵng"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="text-sm font-bold block mb-1"
                      htmlFor="business-country"
                    >
                      Quốc gia *
                    </label>
                    <select
                      id="business-country"
                      value={draft.businessCountry}
                      onChange={(e) =>
                        updateDraft("businessCountry", e.target.value)
                      }
                      className="h-11 w-full rounded-sm border border-gray-500 px-3 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057] bg-white cursor-pointer"
                    >
                      <option value="Việt Nam">Việt Nam</option>
                      <option value="Mỹ">Mỹ</option>
                      <option value="Anh">Anh</option>
                      <option value="Pháp">Pháp</option>
                      <option value="Nhật Bản">Nhật Bản</option>
                      <option value="Hàn Quốc">Hàn Quốc</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="text-sm font-bold block mb-1"
                      htmlFor="business-trade-name"
                    >
                      Nếu công ty hoạt động dưới tên khác (ví dụ: tên thương
                      mại) liên quan đến chỗ nghỉ, vui lòng cung cấp chi tiết{" "}
                      <span className="text-gray-500 font-normal">
                        - không bắt buộc
                      </span>
                    </label>
                    <input
                      id="business-trade-name"
                      value={draft.businessTradeName}
                      onChange={(e) =>
                        updateDraft("businessTradeName", e.target.value)
                      }
                      className="h-11 w-full rounded-sm border border-gray-500 px-3 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                      placeholder="Tên thương mại khác (nếu có)"
                    />
                  </div>
                </div>
              )}

              {draft.legalOwnerType ? (
                <>
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                      Vui lòng cung cấp tên đầy đủ và ngày sinh của tất cả cá
                      nhân, những người sở hữu từ 25% trở lên của chỗ nghỉ.
                    </p>

                    {draft.owners.map((owner, index) => (
                      <div
                        key={owner.id}
                        className="p-4 rounded-md border border-gray-200 bg-gray-50 relative space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Cá nhân #{index + 1}
                          </span>
                          {draft.owners.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => {
                                updateDraft(
                                  "owners",
                                  draft.owners.filter((o) => o.id !== owner.id),
                                );
                              }}
                              className="text-xs font-bold text-[#f60057] hover:underline"
                            >
                              Xóa
                            </button>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[13px] font-bold block mb-1">
                              Tên *
                            </label>
                            <input
                              value={owner.firstName}
                              onChange={(e) => {
                                const newOwners = draft.owners.map((o) =>
                                  o.id === owner.id
                                    ? { ...o, firstName: e.target.value }
                                    : o,
                                );
                                updateDraft("owners", newOwners);
                              }}
                              className="h-10 w-full rounded-sm border border-gray-400 bg-white px-3 text-sm outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                              placeholder="Ví dụ: Dạng"
                            />
                          </div>
                          <div>
                            <label className="text-[13px] font-bold block mb-1">
                              Họ *
                            </label>
                            <input
                              value={owner.lastName}
                              onChange={(e) => {
                                const newOwners = draft.owners.map((o) =>
                                  o.id === owner.id
                                    ? { ...o, lastName: e.target.value }
                                    : o,
                                );
                                updateDraft("owners", newOwners);
                              }}
                              className="h-10 w-full rounded-sm border border-gray-400 bg-white px-3 text-sm outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                              placeholder="Ví dụ: Khang"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[13px] font-bold block mb-1">
                            Ngày sinh *
                          </label>
                          <input
                            type="date"
                            value={owner.dateOfBirth}
                            onChange={(e) => {
                              const newOwners = draft.owners.map((o) =>
                                o.id === owner.id
                                  ? { ...o, dateOfBirth: e.target.value }
                                  : o,
                              );
                              updateDraft("owners", newOwners);
                            }}
                            className="h-10 w-full rounded-sm border border-gray-400 bg-white px-3 text-sm outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        updateDraft("owners", [
                          ...draft.owners,
                          {
                            id: makeId(),
                            firstName: "",
                            lastName: "",
                            dateOfBirth: "",
                          },
                        ]);
                      }}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#f60057] hover:underline"
                    >
                      <Plus className="h-4 w-4" /> Thêm
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label
                      className="text-sm font-bold block mb-1"
                      htmlFor="other-owner-details"
                    >
                      Nếu một chủ sở hữu nào đó có tên khác, vui lòng cung cấp
                      chi tiết{" "}
                      <span className="text-gray-500 font-normal">
                        - không bắt buộc
                      </span>
                    </label>
                    <textarea
                      id="other-owner-details"
                      value={draft.otherOwnerDetails}
                      onChange={(e) =>
                        updateDraft("otherOwnerDetails", e.target.value)
                      }
                      className="min-h-[80px] w-full rounded-sm border border-gray-500 px-3 py-2 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057]"
                      placeholder="Ví dụ: Tên khác hoặc chi tiết bổ sung..."
                    />
                  </div>
                </>
              ) : null}
            </Panel>
          </Question>
        );
      case "review":
        return (
          <Question title="Xem lại và hoàn tất">
            <div className="grid gap-7 lg:grid-cols-[560px_340px]">
              <div>
                <Panel className="space-y-6">
                  <h2 className="text-[17px] font-bold text-gray-800">
                    Một số thông tin quan trọng trước khi Quý vị đăng chỗ nghỉ
                    trên StaySaga
                  </h2>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#f60057]">
                        <BedDouble className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Tôi có thể quyết định khi nào tôi nhận đặt phòng
                          không?
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                          Có. Cách tốt nhất để làm điều này là luôn cập nhật
                          lịch của Quý vị. Đóng những ngày Quý vị không muốn
                          nhận đặt phòng. Nếu Quý vị có đặt phòng trên những
                          trang khác, vui lòng cũng đóng những ngày đó.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#f60057]">
                        <Info className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Đặt phòng có được xác nhận ngay tức thì?
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                          Có. Đặt phòng được xác nhận ngay khi khách đặt.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#f60057]">
                        <ThumbsUp className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Tôi có thể chọn khách lưu trú tại chỗ của tôi?
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                          Không. Nếu một ngày được mở bán trong lịch Quý vị, tất
                          cả khách hàng sử dụng trang web chúng tôi đều có thể
                          đặt ngày đó.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={draft.legalConfirmed}
                        onChange={() =>
                          updateDraft("legalConfirmed", !draft.legalConfirmed)
                        }
                        className="peer sr-only"
                      />
                      <span
                        className={`flex h-6 w-6 mt-1 shrink-0 items-center justify-center rounded-sm border ${
                          draft.legalConfirmed
                            ? "border-[#f60057] bg-[#f60057]"
                            : "border-gray-400 bg-white"
                        }`}
                      >
                        {draft.legalConfirmed ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : null}
                      </span>
                      <span className="text-[15px] leading-relaxed text-gray-700">
                        Tôi cam đoan rằng đây là doanh nghiệp chỗ nghỉ hợp pháp
                        với tất cả giấy phép cần thiết mà tôi có thể xuất trình
                        khi được yêu cầu chứng minh. StaySaga giữ quyền xác minh
                        và điều tra bất kỳ chi tiết nào được cung cấp trong quá
                        trình đăng ký này.
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={draft.termsConfirmed}
                        onChange={() =>
                          updateDraft("termsConfirmed", !draft.termsConfirmed)
                        }
                        className="peer sr-only"
                      />
                      <span
                        className={`flex h-6 w-6 mt-1 shrink-0 items-center justify-center rounded-sm border ${
                          draft.termsConfirmed
                            ? "border-[#f60057] bg-[#f60057]"
                            : "border-gray-400 bg-white"
                        }`}
                      >
                        {draft.termsConfirmed ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : null}
                      </span>
                      <span className="text-[15px] leading-relaxed text-gray-700">
                        Tôi đã đọc, chấp nhận và đồng ý với{" "}
                        <span className="text-[#f60057] underline">
                          Điều khoản chung
                        </span>
                        .
                      </span>
                    </label>
                  </div>

                  {finalErrors.length > 0 ? (
                    <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700 text-sm">
                      <p className="font-bold">
                        Còn thiếu thông tin để hoàn tất:
                      </p>
                      <ul className="mt-2 list-disc pl-5 space-y-1">
                        {finalErrors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </Panel>
              </div>

              <div>
                <Panel className="space-y-4">
                  <h3 className="font-bold text-[17px] text-gray-800">
                    Tóm tắt chỗ nghỉ
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={draft.name}
                        className="h-40 w-full object-cover rounded-sm"
                      />
                    ) : null}
                    <div>
                      <span className="font-bold block">Tên chỗ nghỉ:</span>
                      <span>{draft.name || "Chưa nhập"}</span>
                    </div>
                    <div>
                      <span className="font-bold block">Địa chỉ:</span>
                      <span>{addressQuery || "Chưa nhập"}</span>
                    </div>
                    <div>
                      <span className="font-bold block">Giá mỗi đêm:</span>
                      <span>{formatVnd(price)}</span>
                    </div>
                    <div>
                      <span className="font-bold block">
                        Người sở hữu pháp lý:
                      </span>
                      <span>
                        {draft.legalOwnerType === "business"
                          ? `Doanh nghiệp: ${draft.businessName || "Chưa nhập"}`
                          : `Cá nhân: ${
                              draft.owners
                                .map((o) => `${o.lastName} ${o.firstName}`)
                                .filter(Boolean)
                                .join(", ") || "Chua nh?p"
                            }`}
                      </span>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          </Question>
        );
      default:
        return null;
    }
  }

  function AmenityGroup({ title, items }: { title: string; items: string[] }) {
    return (
      <div className="border-b border-gray-200 py-6 first:pt-0 last:border-b-0 last:pb-0">
        <h2 className="mb-4 text-lg font-bold">{title}</h2>
        {items.map((item) => (
          <CheckboxLine
            key={item}
            checked={draft.amenities.includes(item)}
            label={item}
            onChange={() => toggleArray("amenities", item)}
          />
        ))}
      </div>
    );
  }
}

type AddressSuggestion = {
  title: string;
  subtitle: string;
  fullAddress: string;
  city: string;
  district: string;
  country?: string;
  lat: number;
  lon: number;
  placeId?: string;
};

const DEFAULT_MAP_ADDRESS = "Việt Nam";

function normalizeAddressSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function sanitizeText(val: string): string {
  if (typeof val !== "string" || !val) return val;
  return val
    .replace(/(?:[\uFFFD?]+)?an\s+Kia/gi, "Đan Kia")
    .replace(/dankia/gi, "Đan Kia")
    .replace(/(?:[\uFFFD?]+)?L(?:[\uFFFD?]+|a)t/gi, "Đà Lạt")
    .replace(/da\s+lat/gi, "Đà Lạt")
    .replace(/L(?:[\uFFFD?]|a)?m\s*(?:[\uFFFD?]*|d)?(?:o|)?ng/gi, "Lâm Đồng")
    .replace(/lam\s+dong/gi, "Lâm Đồng")
    .replace(/Vi(?:[\uFFFD?]|e)?t\s+Nam/gi, "Việt Nam")
    .replace(/viet\s+nam/gi, "Việt Nam")
    .replace(/\uFFFD/g, "");
}

function getAddressSuggestions(value: string): AddressSuggestion[] {
  const sanitizedValue = sanitizeText(value);
  const normalized = normalizeAddressSearch(sanitizedValue);
  if (normalized.length < 2) return [];

  const homestaySuggestions: AddressSuggestion[] = [
    {
      title: "Gòn Home",
      subtitle: "Phước Thành, Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
      fullAddress:
        "Gòn Home, Phước Thành, Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
      city: "Đà Lạt",
      district: "Lang Biang",
      lat: 12.0126,
      lon: 108.4016,
    },
    {
      title: "Gon Homestay",
      subtitle: "1 Phù Đổng Thiên Vương, Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
      fullAddress:
        "Gon Homestay, 1 Phù Đổng Thiên Vương, Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
      city: "Đà Lạt",
      district: "Phường 8",
      lat: 11.9565,
      lon: 108.4423,
    },
    {
      title: "Gon Homestay",
      subtitle: "17 Hoàng Diệu, Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
      fullAddress:
        "Gon Homestay, 17 Hoàng Diệu, Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
      city: "Đà Lạt",
      district: "Phường 5",
      lat: 11.9443,
      lon: 108.4312,
    },
    {
      title: "Gòn Homestay",
      subtitle: "Bùi Thị Xuân, Phường 2 - Đà Lạt, Lâm Đồng, Việt Nam",
      fullAddress:
        "Gòn Homestay, Bùi Thị Xuân, Phường 2 - Đà Lạt, Lâm Đồng, Việt Nam",
      city: "Đà Lạt",
      district: "Phường 2",
      lat: 11.9492,
      lon: 108.4398,
    },
  ];

  if (
    normalized.includes("gon") ||
    normalized.includes("gion") ||
    normalized.includes("gon home")
  ) {
    return homestaySuggestions;
  }

  // 1. If user typed "hoàng diệu"
  if (normalized.includes("hoang dieu") || normalized.includes("hoangdieu")) {
    return [
      {
        title: "17 Hoàng Diệu",
        subtitle: "Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress: "17 Hoàng Diệu, Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Phường 5",
        lat: 11.9443,
        lon: 108.4312,
      },
      {
        title: "17 Hẻm Hoàng Diệu",
        subtitle: "Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress: "17 Hẻm Hoàng Diệu, Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Phường 5",
        lat: 11.9448,
        lon: 108.4318,
      },
      {
        title: "17/2 Hoàng Diệu",
        subtitle: "Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress: "17/2 Hoàng Diệu, Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Phường 5",
        lat: 11.9439,
        lon: 108.4307,
      },
    ];
  }

  // 1.5. If user typed "phù đổng" or "phu dong"
  if (normalized.includes("phu dong") || normalized.includes("phudong")) {
    return [
      {
        title: "1 Phù Đổng Thiên Vương",
        subtitle: "Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress:
          "1 Phù Đổng Thiên Vương, Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Phường 8",
        lat: 11.9565,
        lon: 108.4423,
      },
      {
        title: "17 Phù Đổng Thiên Vương",
        subtitle: "Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress:
          "17 Phù Đổng Thiên Vương, Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Phường 8",
        lat: 11.9585,
        lon: 108.4428,
      },
      {
        title: "61 Phù Đổng Thiên Vương",
        subtitle: "Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress:
          "61 Phù Đổng Thiên Vương, Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Phường 8",
        lat: 11.961,
        lon: 108.4432,
      },
    ];
  }

  // 2. If user typed "đan kia"
  if (normalized.includes("dan kia") || normalized.includes("dankia")) {
    return [
      {
        title: "17 Đan Kia",
        subtitle: "Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress: "17 Đan Kia, Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Lang Biang",
        lat: 12.0126,
        lon: 108.4016,
      },
      {
        title: "17 Hẻm Đan Kia",
        subtitle: "Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress: "17 Hẻm Đan Kia, Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Lang Biang",
        lat: 12.0132,
        lon: 108.4022,
      },
      {
        title: "17 Hẻm 19A Dankia",
        subtitle: "Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress:
          "17 Hẻm 19A Dankia, Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Lang Biang",
        lat: 12.0119,
        lon: 108.4009,
      },
    ];
  }

  // 3. If user typed just "17" (which starts with 17, but doesn't have "dan kia" or "hoang dieu" yet)
  if (normalized.startsWith("17")) {
    return [
      {
        title: "17 Đan Kia",
        subtitle: "Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress: "17 Đan Kia, Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Lang Biang",
        lat: 12.0126,
        lon: 108.4016,
      },
      {
        title: "17 Hoàng Diệu",
        subtitle: "Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress: "17 Hoàng Diệu, Phường 5 - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Phường 5",
        lat: 11.9443,
        lon: 108.4312,
      },
      {
        title: "17 Phù Đổng Thiên Vương",
        subtitle: "Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress:
          "17 Phù Đổng Thiên Vương, Phường 8 - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Phường 8",
        lat: 11.9585,
        lon: 108.4428,
      },
      {
        title: "17 Bùi Thị Xuân",
        subtitle: "Phường 2 - Đà Lạt, Lâm Đồng, Việt Nam",
        fullAddress: "17 Bùi Thị Xuân, Phường 2 - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Phường 2",
        lat: 11.9492,
        lon: 108.4398,
      },
    ];
  }

  return [];
}

function resolveAddressCoords(
  address: string,
): { lat: number; lon: number } | null {
  if (!address) return null;
  const normalized = address
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

  if (normalized.includes("17/2 hoang dieu")) {
    return { lat: 11.9439, lon: 108.4307 };
  }
  if (normalized.includes("17/2a hoang dieu")) {
    return { lat: 11.9439, lon: 108.4307 };
  }
  if (normalized.includes("17 hem hoang dieu")) {
    return { lat: 11.9448, lon: 108.4318 };
  }
  if (normalized.includes("hoang dieu") || normalized.includes("hoangdieu")) {
    return { lat: 11.9443, lon: 108.4312 };
  }

  if (normalized.includes("phu dong") || normalized.includes("phudong")) {
    if (normalized.includes("17 phu dong")) {
      return { lat: 11.9585, lon: 108.4428 };
    }
    if (normalized.includes("61 phu dong")) {
      return { lat: 11.961, lon: 108.4432 };
    }
    return { lat: 11.9565, lon: 108.4423 };
  }

  if (
    normalized.includes("17 hem dankia") ||
    normalized.includes("17 hem dan kia")
  ) {
    return { lat: 12.0132, lon: 108.4022 };
  }
  if (
    normalized.includes("hem 19a dankia") ||
    normalized.includes("hem 19a dan kia")
  ) {
    return { lat: 12.0119, lon: 108.4009 };
  }
  if (normalized.includes("dan kia") || normalized.includes("dankia")) {
    return { lat: 12.0126, lon: 108.4016 };
  }

  if (
    normalized.includes("bui thi xuan") ||
    normalized.includes("buithixuan")
  ) {
    return { lat: 11.9492, lon: 108.4398 };
  }

  return null;
}

function InteractiveMap({
  selectedCoords,
  mapType,
  onCoordsChange,
}: {
  selectedCoords: { lat: number; lon: number } | null;
  mapType: "map" | "satellite";
  onCoordsChange?: (coords: { lat: number; lon: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Load Leaflet assets
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else if ((window as any).L) {
      setLeafletLoaded(true);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (
      !leafletLoaded ||
      !containerRef.current ||
      typeof window === "undefined" ||
      !(window as any).L
    )
      return;
    const L = (window as any).L;

    // Use selected coordinates if available, otherwise default to Đà Lạt
    const initialLat = selectedCoords?.lat ?? 11.9404;
    const initialLon = selectedCoords?.lon ?? 108.4383;
    const initialZoom = selectedCoords ? 16 : 13;

    // Clear container to avoid duplicate map instances
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    // Destroy existing map if it exists
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn("Error removing map instance:", e);
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
    }

    // Create custom pin icon
    const customPinIcon = L.divIcon({
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background-color: #f60057; opacity: 0.2; border-radius: 50%; animation: pulse 2s infinite;"></div>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f60057" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3)); position: relative; z-index: 10;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#f60057"></path>
            <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
          </svg>
        </div>
      `,
      className: "bg-transparent",
      iconSize: [36, 36],
      iconAnchor: [18, 32],
    });

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([initialLat, initialLon], initialZoom);

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    mapInstanceRef.current = map;

    // Google-style raster tiles keep the host address step closer to familiar map UX.
    const tileUrl =
      mapType === "satellite"
        ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    const attribution =
      mapType === "satellite" ? "&copy; Google" : "&copy; Google";

    const tileLayer = L.tileLayer(tileUrl, { attribution }).addTo(map);
    tileLayerRef.current = tileLayer;
    const resizeMap = () => {
      map.invalidateSize({ animate: false, pan: false });
    };
    const resizeTimeout = window.setTimeout(resizeMap, 80);
    const secondResizeTimeout = window.setTimeout(resizeMap, 350);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(resizeMap);
      resizeObserver.observe(containerRef.current);
    }

    // Marker
    const marker = L.marker([initialLat, initialLon], {
      icon: customPinIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    // Handle drag end
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      if (onCoordsChange) {
        onCoordsChange({ lat: position.lat, lon: position.lng });
      }
    });

    // Handle map click
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      if (onCoordsChange) {
        onCoordsChange({ lat, lon: lng });
      }
    });

    // Inject CSS styles for animations
    if (!document.getElementById("leaflet-custom-styles")) {
      const style = document.createElement("style");
      style.id = "leaflet-custom-styles";
      style.innerHTML = `
        .leaflet-div-icon.bg-transparent {
          background: transparent !important;
          border: none !important;
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      window.clearTimeout(resizeTimeout);
      window.clearTimeout(secondResizeTimeout);
      resizeObserver?.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn("Error cleaning up map instance:", e);
        }
        mapInstanceRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Sync coords from props
  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !markerRef.current ||
      !selectedCoords ||
      !leafletLoaded
    )
      return;
    const { lat, lon } = selectedCoords;
    const currentLatLng = markerRef.current.getLatLng();

    // Only update if coords actually changed significantly
    if (
      Math.abs(currentLatLng.lat - lat) > 0.0001 ||
      Math.abs(currentLatLng.lng - lon) > 0.0001
    ) {
      markerRef.current.setLatLng([lat, lon]);
      mapInstanceRef.current.setView([lat, lon], 16);
      mapInstanceRef.current.invalidateSize({ animate: false, pan: false });
    }
  }, [selectedCoords, leafletLoaded]);

  // Sync mapType (Voyager vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current || !leafletLoaded)
      return;
    const L = (window as any).L;

    const tileUrl =
      mapType === "satellite"
        ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    const attribution =
      mapType === "satellite" ? "&copy; Google" : "&copy; Google";

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(tileUrl, { attribution }).addTo(
      mapInstanceRef.current,
    );
    tileLayerRef.current = newTileLayer;
    window.setTimeout(() => {
      mapInstanceRef.current?.invalidateSize({ animate: false, pan: false });
    }, 80);
  }, [mapType, leafletLoaded]);

  return (
    <div className="absolute inset-0 h-full w-full select-none">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full z-0 pointer-events-auto"
      />

      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f60057] border-t-transparent"></div>
            <span className="text-sm font-semibold text-gray-500">
              Đang tải bản đồ...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function parseCityAndDistrict(fullAddress: string): {
  city: string;
  district: string;
} {
  if (!fullAddress) return { city: "", district: "" };
  const parts = fullAddress
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length > 0 && /viet\s*nam|vietnam/i.test(parts[parts.length - 1])) {
    parts.pop();
  }

  let city = "";
  let district = "";

  if (parts.length > 0) {
    city = parts.pop() || "";
  }
  if (parts.length > 0) {
    district = parts.pop() || "";
  }

  return { city, district };
}

function AddressStep({
  draft,
  mapQuery,
  touched,
  setTouched,
  updateDraft,
  updateDraftFields,
  onBack,
  onNext,
  isSaving = false,
  saveError = null,
}: {
  draft: Draft;
  mapQuery: string;
  touched: Record<string, boolean>;
  setTouched: (
    value: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void;
  updateDraft: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  updateDraftFields: (fields: Partial<Draft>) => void;
  onBack: () => void;
  onNext: () => void;
  isSaving?: boolean;
  saveError?: string | null;
}) {
  const [mapType, setMapType] = useState<"map" | "satellite">("map");
  const [, setMapAddress] = useState(mapQuery || DEFAULT_MAP_ADDRESS);
  const [searchInput, setSearchInput] = useState(draft.address);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(
    draft.latitude && draft.longitude
      ? { lat: parseFloat(draft.latitude), lon: parseFloat(draft.longitude) }
      : null,
  );

  const ignoreSearchRef = useRef(false);

  // Sync state with draft updates (e.g. when draft is loaded or sanitized from localStorage)
  useEffect(() => {
    if (draft.address === searchInput) {
      return;
    }

    ignoreSearchRef.current = true;
    setSearchInput(draft.address);
    setMapAddress(draft.address || mapQuery || DEFAULT_MAP_ADDRESS);

    // Auto-resolve coordinates if they are not set but the address is typed/loaded
    const resolved = resolveAddressCoords(draft.address);
    if (resolved) {
      const currentLat = parseFloat(draft.latitude || "0");
      const currentLon = parseFloat(draft.longitude || "0");
      if (
        Math.abs(currentLat - resolved.lat) > 0.0001 ||
        Math.abs(currentLon - resolved.lon) > 0.0001
      ) {
        updateDraftFields({
          latitude: String(resolved.lat),
          longitude: String(resolved.lon),
        });
        setSelectedCoords({ lat: resolved.lat, lon: resolved.lon });
        return;
      }
    } else {
      if (!draft.address.trim() && (draft.latitude || draft.longitude)) {
        updateDraftFields({
          latitude: "",
          longitude: "",
        });
        setSelectedCoords(null);
        return;
      }
    }

    setSelectedCoords(
      draft.latitude && draft.longitude
        ? { lat: parseFloat(draft.latitude), lon: parseFloat(draft.longitude) }
        : null,
    );
  }, [draft.address, draft.latitude, draft.longitude, mapQuery, searchInput]);

  // Autocomplete fetch effect from free Geocoding API proxy (Nominatim / Photon)
  useEffect(() => {
    if (ignoreSearchRef.current) {
      ignoreSearchRef.current = false;
      return;
    }

    if (searchInput.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      // 1. Get initial mock suggestions for instant matches
      const mockSuggestions = getAddressSuggestions(searchInput);

      try {
        const query = searchInput.trim();

        let apiSuggestions: AddressSuggestion[] = [];

        const geocodeRes = await fetch(
          `/api/geocode/autocomplete?q=${encodeURIComponent(query)}`,
        );
        if (geocodeRes.ok) {
          const data = await geocodeRes.json();
          if (data && data.length > 0) {
            apiSuggestions = data.map((item: any) => ({
              title: item.title,
              subtitle: item.subtitle,
              fullAddress: item.fullAddress,
              city: item.city || "",
              district: item.district || "",
              country: item.country || "",
              lat: item.lat,
              lon: item.lon,
            }));
          }
        }

        const merged = [...apiSuggestions];
        mockSuggestions.forEach((item) => {
          const exists = merged.some(
            (m) =>
              m.fullAddress.toLowerCase() === item.fullAddress.toLowerCase(),
          );
          if (!exists) {
            merged.push(item);
          }
        });

        setSuggestions(merged.slice(0, 5));
      } catch (err) {
        console.error("Geocoding fetch error:", err);
        setSuggestions(mockSuggestions);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput, draft.city, draft.latitude, draft.longitude]);

  const canContinue = draft.address.trim().length > 0;

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    updateDraftFields({
      address: value,
      latitude: "",
      longitude: "",
      city: "",
      district: "",
    });
    setSelectedCoords(null);
    setMapAddress(value || mapQuery || DEFAULT_MAP_ADDRESS);
    setSuggestions(getAddressSuggestions(value));
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    ignoreSearchRef.current = true;

    const lat = suggestion.lat;
    const lon = suggestion.lon;
    let city = suggestion.city;
    let district = suggestion.district;

    // Last resort parser fallback for city/district
    if (!city || !district) {
      const parsed = parseCityAndDistrict(suggestion.fullAddress);
      if (!city) city = parsed.city;
      if (!district) district = parsed.district;
    }

    city = sanitizeText(city || "");
    district = sanitizeText(district || "");

    updateDraftFields({
      address: suggestion.fullAddress,
      city,
      district,
      country: sanitizeText(suggestion.country || draft.country || ""),
      latitude: String(lat),
      longitude: String(lon),
    });

    setSearchInput(suggestion.fullAddress);
    setMapAddress(suggestion.fullAddress);
    setSelectedCoords({ lat, lon });
    setSuggestions([]);
  };

  const handleClearAddress = () => {
    ignoreSearchRef.current = true;
    setSearchInput("");
    updateDraftFields({
      address: "",
      latitude: "",
      longitude: "",
      city: "",
      district: "",
    });
    setSelectedCoords(null);
    setMapAddress(mapQuery || DEFAULT_MAP_ADDRESS);
    setSuggestions([]);
  };

  const handleContinue = async () => {
    setTouched((prev) => ({ ...prev, address: true }));

    // If they typed something but coordinates or city are missing, try to resolve it first
    if (
      searchInput.trim() &&
      (!draft.latitude || !draft.longitude || !draft.city)
    ) {
      try {
        const res = await fetch(
          `/api/geocode/autocomplete?q=${encodeURIComponent(searchInput.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const first = data[0];
            const city = sanitizeText(first.city || "");
            const district = sanitizeText(first.district || "");

            updateDraftFields({
              address: searchInput.trim(),
              city,
              district,
              country: sanitizeText(first.country || draft.country || ""),
              latitude: String(first.lat),
              longitude: String(first.lon),
            });

            setTimeout(() => {
              onNext();
            }, 100);
            return;
          }
        }
      } catch (err) {
        console.error("Geocoding on continue failed:", err);
      }
    }

    if (canContinue) onNext();
  };

  return (
    <section className="relative h-full w-full overflow-hidden bg-[#eef3f7]">
      <InteractiveMap
        selectedCoords={selectedCoords}
        mapType={mapType}
        onCoordsChange={async (coords) => {
          setSelectedCoords(coords);

          const fieldsToUpdate: Partial<Draft> = {
            latitude: String(coords.lat),
            longitude: String(coords.lon),
          };

          // If current address is empty, reverse geocode to populate it
          if (!draft.address.trim()) {
            try {
              const res = await fetch(
                `/api/geocode/reverse?lat=${coords.lat}&lon=${coords.lon}`,
              );
              if (res.ok) {
                const data = await res.json();
                if (data && data.address) {
                  const city = sanitizeText(data.city || "");
                  const district = sanitizeText(data.district || "");
                  const fullAddress = data.address;

                  fieldsToUpdate.address = fullAddress;
                  fieldsToUpdate.city = city;
                  fieldsToUpdate.district = district;
                  fieldsToUpdate.country = sanitizeText(
                    data.country || draft.country || "",
                  );

                  setSearchInput(fullAddress);
                  setMapAddress(fullAddress);
                }
              }
            } catch (err) {
              console.error("Reverse geocoding error:", err);
            }
          }

          updateDraftFields(fieldsToUpdate);
        }}
      />

      <div className="absolute right-3 top-3 z-20 flex overflow-hidden rounded-sm bg-white text-sm shadow-md ring-1 ring-black/10 pointer-events-auto sm:right-6 sm:top-6 sm:text-lg">
        <button
          type="button"
          className={`px-4 py-2 font-bold sm:px-6 sm:py-3 ${
            mapType === "map"
              ? "bg-white text-gray-950"
              : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setMapType("map")}
        >
          Bản đồ
        </button>
        <button
          type="button"
          className={`border-l border-gray-200 px-4 py-2 font-bold sm:px-6 sm:py-3 ${
            mapType === "satellite"
              ? "bg-white text-gray-950"
              : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setMapType("satellite")}
        >
          Vệ tinh
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 max-h-[82dvh] overflow-y-auto px-3 pb-3 pt-10 pointer-events-none sm:bottom-0 sm:left-0 sm:right-auto sm:top-0 sm:h-full sm:max-h-none sm:w-[690px] sm:overflow-hidden sm:px-6 sm:pb-4 sm:pt-8 lg:ml-[190px]">
        <h1 className="mb-3 max-w-[650px] text-[26px] font-bold leading-tight tracking-tight text-gray-950 pointer-events-auto sm:mb-4 sm:text-[34px]">
          Chỗ nghỉ của Quý vị ở đâu?
        </h1>

        <div className="w-full overflow-y-auto border border-gray-200 bg-white px-4 pb-4 pt-4 shadow-sm pointer-events-auto sm:max-h-[calc(100%-126px)] sm:max-w-[625px] sm:px-5 sm:pb-4 sm:pt-4">
          {saveError && (
            <div className="mb-4 border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 rounded-sm">
              ⚠️ {saveError}
            </div>
          )}
          {isSaving && (
            <div className="mb-3 text-sm text-gray-600 font-semibold flex items-center gap-2">
              <span className="animate-spin inline-block h-4 w-4 border-2 border-[#f60057] border-t-transparent rounded-full" />
              Đang lưu tiến độ...
            </div>
          )}
          <label className="block text-base font-bold text-gray-950">
            Tìm địa chỉ của Quý vị
          </label>

          <div className="relative mt-2">
            <div className="flex h-[42px] items-center gap-3 rounded-sm border border-gray-500 bg-white px-3 focus-within:border-[#f60057] focus-within:ring-2 focus-within:ring-rose-100">
              <Search className="h-5 w-5 shrink-0 text-gray-500" />
              <input
                value={searchInput}
                onChange={(event) => handleSearchChange(event.target.value)}
                onFocus={() => {
                  if (searchInput.trim().length < 3) {
                    setSuggestions(getAddressSuggestions(searchInput));
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, address: true }));
                }}
                className="h-full min-w-0 flex-1 bg-transparent text-base text-gray-950 outline-none placeholder:text-gray-500"
                placeholder="Nhập tên chỗ nghỉ, đường, khu vực"
              />
              {searchInput ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleClearAddress}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-400 text-gray-700 hover:bg-gray-100"
                  aria-label="Xóa địa chỉ"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {suggestions.length > 0 ? (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-[260px] overflow-y-auto rounded-sm border border-gray-300 bg-white shadow-xl sm:max-h-[330px]">
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.title}-${item.lat}-${item.lon}-${idx}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionClick(item)}
                    className="flex w-full items-start gap-3 border-b border-gray-100 px-3 py-3 text-left last:border-b-0 hover:bg-rose-50/70 transition-colors duration-150 sm:px-4 sm:py-4"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-rose-50 text-[#f60057]">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-gray-950 text-[15px] leading-tight">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-sm leading-normal text-gray-600">
                        {item.subtitle}
                      </span>
                    </span>
                  </button>
                ))}
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/50 px-4 py-2.5 text-xs font-semibold text-gray-500">
                  <span>OpenStreetMap</span>
                  <Info className="h-3.5 w-3.5" />
                </div>
              </div>
            ) : null}
          </div>

          {(touched.address || false) && !draft.address.trim() ? (
            <p className="mt-2 text-sm font-semibold text-[#f60057]">
              Vui lòng nhập địa chỉ.
            </p>
          ) : null}

          <div className="mt-3">
            <label className="block text-base font-bold text-gray-950">
              Số căn hộ hoặc tầng (không bắt buộc)
            </label>
            <input
              value={draft.locationNote}
              onChange={(event) =>
                updateDraft("locationNote", event.target.value)
              }
              className="mt-1.5 h-[42px] w-full rounded-sm border border-gray-500 px-3 text-base outline-none focus:border-[#f60057] focus:ring-2 focus:ring-rose-100"
              placeholder="Căn hộ, tòa nhà, tầng, v.v."
            />
          </div>

          <div className="mt-3">
            <label className="block text-base font-bold text-gray-950">
              Vùng/quốc gia
            </label>
            <input
              list="country-suggestions"
              value={draft.country}
              onChange={(event) => updateDraft("country", event.target.value)}
              className="mt-1.5 h-[42px] w-full rounded-sm border border-gray-500 bg-white px-3 text-base outline-none focus:border-[#f60057] focus:ring-2 focus:ring-rose-100"
              placeholder="Quốc gia hoặc vùng"
            />
            <datalist id="country-suggestions">
              <option value="Việt Nam" />
              <option value="Indonesia" />
              <option value="Thái Lan" />
              <option value="Malaysia" />
              <option value="Singapore" />
              <option value="Japan" />
              <option value="South Korea" />
              <option value="France" />
              <option value="United States" />
              <option value="United Kingdom" />
            </datalist>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            <label className="block">
              <span className="block text-base font-bold text-gray-950">
                Thành phố
              </span>
              <input
                value={draft.city}
                onChange={(event) => updateDraft("city", event.target.value)}
                className="mt-1.5 h-[42px] w-full rounded-sm border border-gray-500 px-3 text-base outline-none focus:border-[#f60057] focus:ring-2 focus:ring-rose-100"
                placeholder="Thành phố"
              />
            </label>
            <label className="block">
              <span className="block text-base font-bold text-gray-950">
                Mã bưu chính
              </span>
              <input
                value={draft.businessPostalCode}
                onChange={(event) =>
                  updateDraft("businessPostalCode", event.target.value)
                }
                className="mt-1.5 h-[42px] w-full rounded-sm border border-gray-500 px-3 text-base outline-none focus:border-[#f60057] focus:ring-2 focus:ring-rose-100"
              />
              <span className="mt-1.5 flex items-start gap-2 text-sm text-gray-800">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#b45309]" />
                Quý vị có cần thêm mã bưu điện không?
              </span>
            </label>
          </div>

          <label className="mt-4 flex items-start gap-3 text-sm text-gray-950 sm:text-base">
            <input
              type="checkbox"
              defaultChecked
              className="mt-0.5 h-6 w-6 rounded border-gray-400 accent-[#f60057]"
            />
            <span>Cập nhật địa chỉ khi di chuyển ghim trên bản đồ.</span>
          </label>
        </div>

        <div className="mt-3 flex w-full gap-3 pointer-events-auto sm:absolute sm:bottom-4 sm:left-6 sm:max-w-[625px] lg:left-0">
          <button
            type="button"
            onClick={onBack}
            className="h-14 w-20 rounded-sm border border-[#f60057] bg-white text-[#f60057] hover:bg-rose-50"
          >
            <ArrowLeft className="mx-auto h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue || isSaving}
            className={`h-14 flex-1 rounded-sm font-bold text-white ${
              canContinue && !isSaving
                ? "bg-[#f60057] hover:bg-[#d9004c]"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            {isSaving ? "Đang lưu..." : "Tiếp tục"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ProgressHeader({
  currentStep,
  stageIndex,
  onSelectStage,
  isStageAccessible,
}: {
  currentStep: number;
  stageIndex: number;
  onSelectStage: (index: number) => void;
  isStageAccessible: (index: number) => boolean;
}) {
  const stageSteps = [
    ["category", "units", "confirm", "name", "address", "channel"],
    [
      "details",
      "bedroom",
      "amenities",
      "services",
      "languages",
      "policies",
      "partner-profile",
    ],
    ["photos"],
    [
      "booking",
      "price",
      "availability",
      "rates",
      "non-refundable",
      "group-pricing",
    ],
    ["legal"],
    ["review"],
  ];

  return (
    <div className="border-b border-gray-200 bg-white select-none">
      <div className="grid grid-cols-6 text-center text-[15px]">
        {stageLabels.map((label, index) => {
          const accessible = isStageAccessible(index);
          return (
            <button
              type="button"
              key={label}
              disabled={!accessible}
              onClick={() => onSelectStage(index)}
              className={`px-2 py-6 outline-none transition ${
                accessible
                  ? "text-gray-900 font-medium cursor-pointer hover:bg-gray-50"
                  : "text-gray-300 cursor-not-allowed"
              }`}
            >
              <span>{label}</span>
              {index < stageIndex ? (
                <Check className="ml-2 inline h-4 w-4 rounded-full bg-emerald-600 p-0.5 text-white" />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-6">
        {stageLabels.map((label, index) => {
          const stepsInStage = stageSteps[index];
          const currentStepName = steps[currentStep];
          const stepIndexInStage = stepsInStage.indexOf(currentStepName);

          return (
            <div key={label} className="flex gap-1 px-6">
              {stepsInStage.map((_, segment) => (
                <span
                  key={segment}
                  className={`h-1 flex-1 ${
                    index < stageIndex
                      ? "bg-emerald-300"
                      : index === stageIndex && segment <= stepIndexInStage
                        ? "bg-[#f60057]"
                        : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Question({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <>
      {title ? (
        <h1 className="mb-7 max-w-[620px] text-[36px] font-bold leading-tight tracking-tight text-gray-950">
          {title}
        </h1>
      ) : null}
      {children}
    </>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full max-w-[560px] rounded-md border border-gray-200 bg-white p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function BottomNav({
  onBack,
  onNext,
  isLast,
  canContinue,
  pendingText,
  confirmMessage,
  onNotReady,
  nextLabel = "Tiếp tục",
  backLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
  canContinue: boolean;
  pendingText: string;
  confirmMessage: string;
  onNotReady?: () => void;
  nextLabel?: string;
  backLabel?: string;
}) {
  return (
    <div className="mt-8 flex w-full max-w-[560px] flex-col gap-4">
      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={onBack}
          className={`${backLabel ? "w-28" : "w-20"} inline-flex h-14 items-center justify-center gap-2 rounded-sm border border-[#f60057] font-bold text-[#f60057] cursor-pointer`}
        >
          <ArrowLeft className="h-5 w-5" />
          {backLabel ? <span>{backLabel}</span> : null}
        </button>
        {isLast ? (
          <PendingSubmitButton
            disabled={!canContinue}
            pendingText={pendingText}
            confirmMessage={confirmMessage}
            className="h-14 flex-1 rounded-sm bg-[#f60057] font-bold text-white hover:bg-[#d9004c]"
          >
            Gửi duyệt
          </PendingSubmitButton>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className="h-14 flex-1 rounded-sm bg-[#f60057] font-bold text-white hover:bg-[#d9004c] disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 cursor-pointer disabled:cursor-not-allowed"
          >
            {nextLabel}
          </button>
        )}
      </div>
      {isLast ? (
        <button
          type="button"
          onClick={onNotReady}
          className="text-center font-bold text-[#f60057] hover:underline py-2 block cursor-pointer outline-none w-full"
        >
          Tôi chưa sẵn sàng
        </button>
      ) : null}
    </div>
  );
}

function HelpCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-[340px] rounded-md border border-gray-200 bg-white p-6">
      <div className="flex gap-4">
        <span className="text-[#f60057]">{icon}</span>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-snug">{title}</h2>
            <X className="h-5 w-5 shrink-0 text-gray-500" />
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function TipCard({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="w-full max-w-[340px] rounded-md border border-gray-200 bg-white p-6">
      <div className="flex gap-4">
        <Lightbulb className="h-6 w-6 shrink-0 text-[#f60057]" />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-snug">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-sm p-1 text-gray-700 hover:bg-gray-100"
              aria-label="Đóng gợi ý"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-5 text-[15px] leading-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SelectCard({
  active,
  title,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative mb-5 flex min-h-[110px] w-full items-center gap-8 border p-5 text-left ${
        active ? "border-2 border-[#f60057]" : "border-gray-300"
      }`}
    >
      {icon}
      <span className="text-lg">{title}</span>
      {active ? (
        <Check className="absolute -right-3 -top-3 h-7 w-7 rounded-full bg-[#f60057] p-1 text-white" />
      ) : null}
    </button>
  );
}

function RadioLine({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b px-6 py-4 text-left last:border-b-0"
    >
      <span
        className={`h-5 w-5 rounded-full border ${checked ? "border-[#f60057] ring-4 ring-rose-100" : "border-gray-400"}`}
      >
        {checked ? (
          <span className="mx-auto mt-1 block h-2.5 w-2.5 rounded-full bg-[#f60057]" />
        ) : null}
      </span>
      <span>{label}</span>
    </button>
  );
}

function CheckboxLine({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="my-3 flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-sm border ${checked ? "border-[#f60057] bg-[#f60057]" : "border-gray-400 bg-white"}`}
      >
        {checked ? <Check className="h-4 w-4 text-white" /> : null}
      </span>
      <span>{label}</span>
    </label>
  );
}

function Counter({
  label,
  value,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[17px]">{label}</p>
      <Stepper value={value} min={min} onChange={onChange} />
    </div>
  );
}

function Stepper({
  value,
  min = 0,
  onChange,
}: {
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid h-11 w-36 grid-cols-3 rounded-sm border border-gray-500">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="text-[#f60057] disabled:text-gray-300"
        disabled={value <= min}
      >
        <Minus className="mx-auto h-4 w-4" />
      </button>
      <span className="flex items-center justify-center font-bold">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="text-[#f60057]"
      >
        <Plus className="mx-auto h-4 w-4" />
      </button>
    </div>
  );
}

function RadioPair({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[17px]">{label}</p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChange(true)}
          className="flex items-center gap-2"
        >
          <span
            className={`h-5 w-5 rounded-full border ${value ? "border-[#f60057] ring-4 ring-rose-100" : "border-gray-400"}`}
          />
          Có
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className="flex items-center gap-2"
        >
          <span
            className={`h-5 w-5 rounded-full border ${!value ? "border-[#f60057] ring-4 ring-rose-100" : "border-gray-400"}`}
          />
          Không
        </button>
      </div>
    </div>
  );
}

function RadioBlock({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[string, string]>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="py-4">
      <p className="mb-4 font-bold">{label}</p>
      <div className="space-y-3">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className="flex items-center gap-3"
          >
            <span
              className={`h-5 w-5 rounded-full border ${value === optionValue ? "border-[#f60057] ring-4 ring-rose-100" : "border-gray-400"}`}
            />
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleLine({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-[#f60057]" : "bg-gray-400"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-sm border border-gray-500 px-3"
      >
        {[
          "06:00",
          "08:00",
          "10:00",
          "11:00",
          "12:00",
          "14:00",
          "15:00",
          "18:00",
          "20:00",
          "22:00",
        ].map((time) => (
          <option key={time}>{time}</option>
        ))}
      </select>
    </label>
  );
}

function Divider() {
  return <hr className="my-6 border-gray-200" />;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] border-b pb-4">
      <span className="font-bold text-gray-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function bedSummary(room: Bedroom) {
  const parts = [
    room.single ? `${room.single} giường đơn` : "",
    room.double ? `${room.double} giường đôi` : "",
    room.king ? `${room.king} giường king` : "",
    room.superKing ? `${room.superKing} giường super-king` : "",
    room.bunk ? `${room.bunk} giường tầng` : "",
    room.sofa ? `${room.sofa} sofa bed` : "",
    room.futon ? `${room.futon} nệm futon` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "0 giường";
}

function bedroomCapacity(room: Bedroom) {
  return (
    room.single +
    room.bunk +
    room.sofa +
    room.futon +
    (room.double + room.king + room.superKing) * 2
  );
}

function totalBedroomCapacity(rooms: Bedroom[]) {
  return rooms.reduce((total, room) => total + bedroomCapacity(room), 0);
}

function HiddenFields({
  draft,
  validPhotos,
}: {
  draft: Draft;
  validPhotos: number;
}) {
  const price = parsePrice(draft.price);
  const beds = totalBeds(draft.bedrooms);
  const amenities = [
    ...draft.amenities,
    ...serviceAmenities.filter((item) => draft.amenities.includes(item)),
    draft.parking !== "none" ? "Chỗ đỗ xe" : "",
  ].filter(Boolean);
  const description =
    draft.description ||
    `${draft.name || "Chỗ nghỉ"} tại ${draft.city} có không gian tiện nghi, phù hợp cho khách du lịch và gia đình.`;

  const verificationDetails = {
    ownerType: draft.legalOwnerType,
    businessDetails:
      draft.legalOwnerType === "business"
        ? {
            name: draft.businessName,
            address: draft.businessAddress,
            postalCode: draft.businessPostalCode,
            city: draft.businessCity,
            country: draft.businessCountry,
            tradeName: draft.businessTradeName,
          }
        : null,
    owners: draft.owners.map((o) => ({
      firstName: o.firstName,
      lastName: o.lastName,
      dateOfBirth: o.dateOfBirth,
    })),
    otherOwnerDetails: draft.otherOwnerDetails,
  };

  const verificationNoteText = `Ảnh hợp lệ: ${validPhotos}. Hồ sơ: ${draft.partnerProfile.join(
    ", ",
  )}. Xác minh pháp lý: ${JSON.stringify(verificationDetails)}`;

  const calculatedOwnerName =
    draft.legalOwnerType === "business"
      ? draft.businessName
      : draft.owners[0]
        ? `${draft.owners[0].lastName} ${draft.owners[0].firstName}`.trim()
        : "";

  const finalOwnerName =
    calculatedOwnerName ||
    draft.ownerName ||
    draft.partnerName ||
    "Đối tác StaySaga";

  return (
    <div className="hidden" aria-hidden="true">
      {draft.id && <input name="id" value={draft.id} readOnly />}
      <input name="property_type" value={draft.propertyType} readOnly />
      <input name="name" value={draft.name} readOnly />
      <input name="title" value={draft.name} readOnly />
      <input
        name="short_description"
        value={description.slice(0, 160)}
        readOnly
      />
      <input name="description" value={description} readOnly />
      <input name="detailed_description" value={description} readOnly />
      <input name="country" value={draft.country} readOnly />
      <input name="city" value={draft.city} readOnly />
      <input name="district" value={draft.district} readOnly />
      <input
        name="address"
        value={draft.address || `${draft.district}, ${draft.city}`}
        readOnly
      />
      <input name="directions_note" value={draft.locationNote} readOnly />
      <input name="latitude" value={draft.latitude} readOnly />
      <input name="longitude" value={draft.longitude} readOnly />
      <input name="price_per_night" value={price} readOnly />
      <input name="base_price_per_night" value={price} readOnly />
      <input name="weekend_price" value={Math.round(price * 1.1)} readOnly />
      <input name="sale_start_date" value="" readOnly />
      <input name="sale_end_date" value="" readOnly />
      <input name="min_nights" value={1} readOnly />
      <input
        name="available_units"
        value={draft.unitMode === "multiple" ? 2 : 1}
        readOnly
      />
      <input name="max_guests" value={draft.maxGuests} readOnly />
      <input name="bedrooms" value={draft.bedrooms.length} readOnly />
      <input name="beds" value={Math.max(1, beds)} readOnly />
      <input name="bathrooms" value={draft.bathrooms} readOnly />
      <input name="area_sqm" value={draft.area} readOnly />
      <input
        name="room_name"
        value={
          draft.propertyType === "hotel"
            ? "Phòng tiêu chuẩn"
            : "Căn hộ 1 phòng ngủ"
        }
        readOnly
      />
      <input
        name="bed_type"
        value={
          draft.bedrooms.some((room) => room.double > 0) ? "double" : "single"
        }
        readOnly
      />
      <input name="bed_count" value={Math.max(1, beds)} readOnly />
      <input
        name="room_quantity"
        value={draft.unitMode === "multiple" ? 2 : 1}
        readOnly
      />
      <input name="private_bathroom" value="on" readOnly />
      <input name="amenities" value={amenities.join(",")} readOnly />
      <input name="check_in_from" value={draft.checkInFrom} readOnly />
      <input name="check_in_to" value={draft.checkInTo} readOnly />
      <input name="check_out_from" value={draft.checkOutFrom} readOnly />
      <input name="check_out_to" value={draft.checkOutTo} readOnly />
      <input
        name="house_rules"
        value={`Hút thuốc: ${draft.allowSmoking ? "Có" : "Không"}. Tiệc tùng: ${draft.allowParties ? "Có" : "Không"}.`}
        readOnly
      />
      <input name="owner_name" value={finalOwnerName} readOnly />
      <input name="host_name" value={finalOwnerName} readOnly />
      <input
        name="contact_phone"
        value={draft.contactPhone || "0900000000"}
        readOnly
      />
      <input name="contact_email" value={draft.contactEmail || ""} readOnly />
      <input name="verification_note" value={verificationNoteText} readOnly />
      {draft.bookingMode === "instant" ? (
        <input name="instant_booking" value="on" readOnly />
      ) : null}
      {draft.cancellationFreeDays > 0 ? (
        <input name="free_cancellation" value="on" readOnly />
      ) : null}
      <input
        name="cancellation_policy"
        value={`free_until_${draft.cancellationFreeDays}_days`}
        readOnly
      />
      <input
        name="payment_policy"
        value={
          draft.accidentalBookingProtection
            ? "accidental_booking_protection"
            : "standard"
        }
        readOnly
      />
      <input
        name="availability_start"
        value={draft.availabilityStart}
        readOnly
      />
      <input
        name="availability_open_mode"
        value={draft.availabilityOpenMode}
        readOnly
      />
      <input
        name="availability_open_days"
        value={draft.availabilityOpenDays}
        readOnly
      />
      <input
        name="sync_calendar"
        value={draft.syncCalendar ? "on" : "off"}
        readOnly
      />
      <input
        name="allow_long_stays"
        value={draft.allowLongStays ? "on" : "off"}
        readOnly
      />
      <input name="max_stay_nights" value={draft.maxStayNights} readOnly />
      <input name="no_prepayment" value="on" readOnly />
      <input name="no_credit_card" value="on" readOnly />
      {draft.welcomeChildren ? (
        <input name="allow_children" value="on" readOnly />
      ) : null}
      {draft.allowSmoking ? (
        <input name="allow_smoking" value="on" readOnly />
      ) : null}
      {draft.allowParties ? (
        <input name="allow_parties" value="on" readOnly />
      ) : null}
      {draft.petsPolicy !== "no" ? (
        <input name="allow_pets" value="on" readOnly />
      ) : null}
      <input name="image_count" value={validPhotos} readOnly />
    </div>
  );
}
