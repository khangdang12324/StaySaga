"use client";

/* eslint-disable @next/next/no-img-element */
import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useEffect,
  useMemo,
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
  MapPin,
  Minus,
  Plus,
  Search,
  TentTree,
  ThumbsUp,
  X,
} from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";
import { createHostHomestay } from "@/core/host/actions";

const DRAFT_KEY = "staysaga-host-register-v9";
const DB_NAME = "staysaga-host-register";
const FILE_STORE = "files";
const MIN_PHOTOS = 5;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

type Owner = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
};

type Draft = {
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
  nonRefundable: boolean;
  nonRefundableDiscount: number;
  groupPricing: boolean;
  groupDiscounts: Record<string, number>;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  verificationConfirmed: boolean;
  legalOwnerType: "individual" | "business";
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
  file: File;
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
  "S�n thu?ng / hi�n",
  "Tầm nhìn ra khung cảnh",
];

const serviceAmenities = [
  "Bữa sáng",
  "Nhà hàng",
  "Dịch vụ phòng",
  "L? t�n 24 gi?",
  "�ua d�n s�n bay",
];
const supportedLanguages = [
  "Tiếng Anh",
  "Tiếng Pháp",
  "Tiếng Trung",
  "Ti?ng T�y Ban Nha",
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
  nonRefundable: false,
  nonRefundableDiscount: 10,
  groupPricing: true,
  groupDiscounts: { "3": 10, "2": 15, "1": 20 },
  ownerName: "",
  contactPhone: "",
  contactEmail: "",
  verificationConfirmed: true,
  legalOwnerType: "individual",
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

const stageForStep = (index: number) => {
  if (index <= 5) return 0; // category, units, confirm, name, address, channel
  if (index <= 12) return 1; // details, bedroom, amenities, services, languages, policies, partner-profile
  if (index <= 13) return 2; // photos
  if (index <= 18) return 3; // booking, price, rates, non-refundable, group-pricing
  if (index <= 19) return 4; // legal
  return 5; // review
};

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
      room.single +
      room.double +
      room.king +
      room.superKing +
      room.bunk +
      room.sofa +
      room.futon,
    0,
  );

const photoWarning = (file: File, existing: StoredPhoto[]) => {
  if (!file.type.startsWith("image/")) return "Không phải ảnh";
  if (file.size > MAX_PHOTO_SIZE) return "Ảnh quá lớn";
  if (file.size < 20 * 1024) return "Ảnh quá nhỏ";
  if (
    existing.some(
      (photo) => photo.file.name === file.name && photo.file.size === file.size,
    )
  )
    return "Ảnh bị trùng";
  return undefined;
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

async function saveFiles(files: File[]) {
  const db = await openFileDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    const store = tx.objectStore(FILE_STORE);
    store.put(files, "photos");
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

async function restoreFiles() {
  const db = await openFileDb();
  if (!db) return [] as File[];

  const files = await new Promise<File[]>((resolve) => {
    const tx = db.transaction(FILE_STORE, "readonly");
    const request = tx.objectStore(FILE_STORE).get("photos");
    request.onsuccess = () =>
      resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => resolve([]);
  });
  db.close();
  return files;
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
    if (draft.legalOwnerType === "business") {
      if (!draft.businessName.trim())
        errors.push("Vui l�ng nh?p t�n d?y d? c?a ph�p nh�n doanh nghi?p.");
      if (!draft.businessAddress.trim())
        errors.push("Vui l�ng nh?p d?a ch? c?a ph�p nh�n doanh nghi?p.");
      if (!draft.businessPostalCode.trim())
        errors.push("Vui l�ng nh?p m� buu di?n.");
      if (!draft.businessCity.trim())
        errors.push("Vui l�ng nh?p th�nh ph? c?a ph�p nh�n doanh nghi?p.");
    }
    draft.owners.forEach((owner, idx) => {
      if (!owner.firstName.trim() || !owner.lastName.trim()) {
        errors.push(`Vui l�ng di?n d?y d? h? v� t�n cho c� nh�n #${idx + 1}.`);
      }
      if (!owner.dateOfBirth) {
        errors.push(`Vui l�ng di?n ng�y sinh cho c� nh�n #${idx + 1}.`);
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

  if (draft.legalOwnerType === "business") {
    if (
      !draft.businessName.trim() ||
      !draft.businessAddress.trim() ||
      !draft.businessPostalCode.trim() ||
      !draft.businessCity.trim()
    ) {
      errors.push("Thi?u th�ng tin ph�p nh�n doanh nghi?p.");
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

export default function PropertyRegistrationWizard() {
  const [draft, setDraft] = useState<Draft>(() => createDefaultDraft());
  const [currentStep, setCurrentStep] = useState(0);
  const [activeBedroomId, setActiveBedroomId] = useState<string>("");
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>(
    {},
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [restored, setRestored] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // New States for Confirmation / Warning modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [targetStepIndex, setTargetStepIndex] = useState<number | null>(null);
  const [showNotReadyModal, setShowNotReadyModal] = useState(false);
  const [notReadyReasons, setNotReadyReasons] = useState<string[]>([]);

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
    ["booking", "price", "rates", "non-refundable", "group-pricing"],
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
    const firstStepOfStage = stageSteps[index][0];
    const targetIdx = steps.indexOf(firstStepOfStage as WizardStep);
    if (targetIdx !== -1) {
      setTargetStepIndex(targetIdx);
      setShowLeaveModal(true);
    }
  };

  const handleConfirmLeave = () => {
    if (targetStepIndex !== null) {
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
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Draft;
        setDraft({
          ...createDefaultDraft(),
          ...parsed,
          bedrooms: parsed.bedrooms?.length ? parsed.bedrooms : [makeBedroom()],
          owners: parsed.owners?.length
            ? parsed.owners
            : [{ id: makeId(), firstName: "", lastName: "", dateOfBirth: "" }],
        });
        setActiveBedroomId(parsed.bedrooms?.[0]?.id ?? "");
      }
    } catch {
      setDraft(createDefaultDraft());
    }

    void restoreFiles().then((files) => {
      setPhotos(
        files.map((file) => ({
          id: makeId(),
          file,
          url: URL.createObjectURL(file),
        })),
      );
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!activeBedroomId && draft.bedrooms[0])
      setActiveBedroomId(draft.bedrooms[0].id);
  }, [activeBedroomId, draft.bedrooms]);

  useEffect(() => {
    if (!restored) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, restored]);

  useEffect(() => {
    if (!restored) return;
    void saveFiles(photos.map((photo) => photo.file));
  }, [photos, restored]);

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateBedroom = (id: string, key: keyof Bedroom, value: number) => {
    setDraft((prev) => ({
      ...prev,
      bedrooms: prev.bedrooms.map((room) =>
        room.id === id ? { ...room, [key]: Math.max(0, value) } : room,
      ),
    }));
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

  const goNext = () => {
    setAttemptedSteps((prev) => ({ ...prev, [currentStep]: true }));
    if (!canContinue) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (current === "bedroom") {
      setCurrentStep(6);
      return;
    }
    setCurrentStep((step) => Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addBedroom = () => {
    const bedroom = makeBedroom({ single: 0 });
    setDraft((prev) => ({ ...prev, bedrooms: [...prev.bedrooms, bedroom] }));
    setActiveBedroomId(bedroom.id);
    setCurrentStep(7);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectBedroom = (id: string) => {
    setActiveBedroomId(id);
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
      <header className="h-[72px] bg-[#f60057] text-white shrink-0">
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
                {[draft.address, draft.district, draft.city].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ"}
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

      <form action={createHostHomestay} className="pb-12 flex-1 flex flex-col">
        <ProgressHeader 
          currentStep={currentStep} 
          stageIndex={stageIndex} 
          onSelectStage={onSelectStage}
          isStageAccessible={isStageAccessible}
        />
        <HiddenFields draft={draft} validPhotos={validPhotos.length} />

        {showStepErrors && stepErrors.length > 0 ? (
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
              ? "flex-1 flex flex-col"
              : "mx-auto w-full max-w-[1200px] px-4 py-12 lg:ml-[110px] flex-1"
          }
        >
          {current === "category" ? (
            <section className="max-w-[1180px] py-12">
              <h1 className="max-w-[900px] text-[38px] font-bold leading-tight tracking-tight text-gray-950">
                Đăng chỗ nghỉ của Quý vị trên StaySaga và bắt đầu đón khách nhanh
                chóng!
              </h1>
              <p className="mt-4 text-xl text-gray-800">
                Để bắt đầu, chọn loại chỗ nghỉ Quý vị muốn đăng trên StaySaga.
              </p>
              <div className="relative mt-14 grid max-w-[1100px] grid-cols-1 border border-gray-300 bg-white md:grid-cols-4">
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
                      className={`min-h-[300px] border-b border-gray-300 p-7 text-center transition hover:bg-gray-50 md:border-b-0 md:border-r last:md:border-r-0 cursor-pointer ${
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
              onBack={goBack}
              onNext={goNext}
            />
          ) : (
            <div className="grid max-w-[980px] grid-cols-1 gap-7 lg:grid-cols-[560px_340px]">
              <section
                className={
                  current === "photos" || current === "price" || current === "review"
                    ? "lg:col-span-2"
                    : ""
                }
              >
                {renderStep()}
                <BottomNav
                  onBack={goBack}
                  onNext={goNext}
                  isLast={current === "review"}
                  canContinue={
                    current === "review" ? finalErrors.length === 0 : canContinue
                  }
                  pendingText="Đang gửi duyệt..."
                  confirmMessage="Sau khi gửi duyệt, quản trị viên StaySaga sẽ kiểm tra thông tin chỗ nghỉ trước khi hiển thị công khai."
                  onNotReady={() => setShowNotReadyModal(true)}
                />
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
              Qu� v? d� th?c hi?n m?t s? thay d?i trong trang n�y. N?u Qu� v? r?i di b�y gi?, nh?ng thay d?i d� s? b? m?t.
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
                  <label key={reason} className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setNotReadyReasons(notReadyReasons.filter((r) => r !== reason));
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
                      {checked ? <Check className="h-4 w-4 text-white" /> : null}
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
                className="mt-4 w-full rounded-sm bg-[#f60057] py-4 font-bold text-white"
              >
                Tiếp tục
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
                    T�n n�y s? hi?n th? v?i kh�ch tr�n StaySaga. H�y ch?n t�n d?
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
              <p className="mb-5 text-[17px]">Kh�ch c� th? ng? ? d�u?</p>
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
        return (
          <Question
            title={`Phòng ngủ ${Math.max(1, draft.bedrooms.findIndex((room) => room.id === activeBedroom.id) + 1)}`}
          >
            <Panel>
              <p className="mb-7">Phòng này có giường loại nào?</p>
              {[
                ["single", "Giường đơn", "Rộng 90 - 130 cm"],
                ["double", "Giường đôi", "Rộng 131 - 150 cm"],
                ["king", "Giường lớn (cỡ King)", "Rộng 151 - 180 cm"],
                [
                  "superKing",
                  "Giường cực lớn (cỡ Super-king)",
                  "Rộng 181 - 210 cm",
                ],
                ["bunk", "Giường tầng", "Nhiều kích cỡ"],
                ["sofa", "Giường sofa", "Nhiều kích cỡ"],
                ["futon", "Nệm Futon", "Nhiều kích cỡ"],
              ].map(([key, label, sub]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-5">
                    <BedDouble className="h-8 w-8 text-gray-400" />
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
                label="Ch? d?u xe ? d�u?"
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
                label="��y l� lo?i ch? d?u xe g�?"
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
          <Question title="Qu� v? ho?c nh�n vi�n c?a m�nh s? d?ng ng�n ng? n�o?">
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
                  <li>?nh n�n c� d? ph�n gi?i d? r� v� kh�ng b? tr�ng</li>
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
                          alt={photo.file.name}
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
                    ��y l� kho?ng gi� c?a c�c ch? ngh? tuong t? v?i Qu� v?.
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
      case "rates":
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
                >
                  Chỉnh sửa
                </button>
              </div>
              <ul className="mt-5 space-y-4">
                <li className="flex gap-3">
                  <Check className="h-7 w-7 rounded-full border p-1" /> Khách có
                  thể hủy miễn phí cho tới 1 ngày trước khi đến
                </li>
                <li className="flex gap-3">
                  <Check className="h-7 w-7 rounded-full border p-1" /> Khách
                  hủy trong vòng 24 giờ sẽ được miễn phí hủy
                </li>
              </ul>
              <Divider />
              <div className="flex justify-between">
                <h3 className="font-bold">Giá theo cỡ nhóm</h3>
                <button
                  type="button"
                  className="rounded-sm border border-[#f60057] px-4 py-2 font-semibold text-[#f60057]"
                  onClick={() => setCurrentStep(18)}
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
                label="�� b?t"
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
            <Panel className="space-y-6">
              <div className="rounded-md bg-rose-50 p-4 text-[15px] leading-relaxed text-gray-800">
                �? tu�n th? c�c y�u c?u ph�p l� v� quy d?nh kh�c nhau, ch�ng t�i
                cần thu thập và xác minh một số thông tin về Quý vị và chỗ nghỉ.
              </div>

              <div>
                <label
                  className="text-sm font-bold block mb-2"
                  htmlFor="owner-type"
                >
                  Ch? ngh? du?c s? h?u b?i c� nh�n hay ph�p nh�n doanh nghi?p?
                </label>
                <select
                  id="owner-type"
                  value={draft.legalOwnerType}
                  onChange={(e) =>
                    updateDraft(
                      "legalOwnerType",
                      e.target.value as "individual" | "business",
                    )
                  }
                  className="h-11 w-full rounded-sm border border-gray-500 px-3 text-[15px] outline-none focus:border-[#f60057] focus:ring-1 focus:ring-[#f60057] bg-white cursor-pointer"
                >
                  <option value="individual">
                    T�i l� c� nh�n ri�ng l? t? di?u h�nh vi?c kinh doanh c?a m�nh
                  </option>
                  <option value="business">
                    T�i l� d?i di?n cho ph�p nh�n doanh nghi?p
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
                      T�n d?y d? c?a ph�p nh�n doanh nghi?p *
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
                      �?a ch? c?a ph�p nh�n doanh nghi?p *
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
                        M� buu di?n *
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

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                  Vui l�ng cung c?p t�n d?y d? v� ng�y sinh c?a t?t c? c� nh�n,
                  những người sở hữu từ 25% trở lên của chỗ nghỉ.
                </p>

                {draft.owners.map((owner, index) => (
                  <div
                    key={owner.id}
                    className="p-4 rounded-md border border-gray-200 bg-gray-50 relative space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        C� nh�n #{index + 1}
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
                  Nếu một chủ sở hữu nào đó có tên khác, vui lòng cung cấp chi
                  tiết{" "}
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
                        T�i cam doan r?ng d�y l� doanh nghi?p ch? ngh? h?p ph�p
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
                        T�i d� d?c, ch?p nh?n v� d?ng � v?i{" "}
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
                          : `C� nh�n: ${draft.owners.map((o) => `${o.lastName} ${o.firstName}`).filter(Boolean).join(", ") || "Chua nh?p"}`}
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
  lat: number;
  lon: number;
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

function getAddressSuggestions(value: string, city: string): AddressSuggestion[] {
  const normalized = normalizeAddressSearch(value);
  if (normalized.length < 2) return [];

  if (
    normalized.includes("dan kia") ||
    normalized.includes("dankia") ||
    normalized.startsWith("17")
  ) {
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
        fullAddress: "17 Hẻm 19A Dankia, Lang Biang - Đà Lạt, Lâm Đồng, Việt Nam",
        city: "Đà Lạt",
        district: "Lang Biang",
        lat: 12.0119,
        lon: 108.4009,
      },
    ];
  }

  const displayCity = city || "Đà Lạt";
  const compactValue = value.replace(/\s+/g, " ").trim();

  return [
    {
      title: compactValue,
      subtitle: `${displayCity}, Việt Nam`,
      fullAddress: `${compactValue}, ${displayCity}, Việt Nam`,
      city: displayCity,
      district: "",
      lat: 11.9404,
      lon: 108.4583,
    },
    {
      title: `${compactValue} 1`,
      subtitle: `${displayCity}, Việt Nam`,
      fullAddress: `${compactValue} 1, ${displayCity}, Việt Nam`,
      city: displayCity,
      district: "",
      lat: 11.943,
      lon: 108.461,
    },
    {
      title: `${compactValue} Residence`,
      subtitle: `${displayCity}, Việt Nam`,
      fullAddress: `${compactValue} Residence, ${displayCity}, Việt Nam`,
      city: displayCity,
      district: "",
      lat: 11.937,
      lon: 108.455,
    },
  ];
}

function getAddressTitle(address: string) {
  return address.split(",")[0]?.trim() || address.trim();
}

function InteractiveMap({
  mapAddress,
  selectedCoords,
  mapType,
  onMapClick,
}: {
  mapAddress: string;
  selectedCoords: { lat: number; lon: number } | null;
  mapType: "map" | "satellite";
  onMapClick?: () => void;
}) {
  const mapTarget = selectedCoords
    ? `${selectedCoords.lat},${selectedCoords.lon}`
    : mapAddress || DEFAULT_MAP_ADDRESS;
  const zoom = selectedCoords || mapAddress !== DEFAULT_MAP_ADDRESS ? 16 : 5;
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    mapTarget,
  )}&z=${zoom}&t=${mapType === "satellite" ? "k" : "m"}&output=embed`;

  return (
    <>
      <iframe
        key={mapUrl}
        title="Bản đồ vị trí chỗ nghỉ"
        src={mapUrl}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div 
        className="absolute inset-0 bg-gradient-to-r from-white/55 via-white/20 to-transparent cursor-pointer"
        onClick={onMapClick} 
      />
    </>
  );
}

function AddressStep({
  draft,
  mapQuery,
  touched,
  setTouched,
  updateDraft,
  onBack,
  onNext,
}: {
  draft: Draft;
  mapQuery: string;
  touched: Record<string, boolean>;
  setTouched: (
    value: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void;
  updateDraft: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [mapType, setMapType] = useState<"map" | "satellite">("map");
  const [mapAddress, setMapAddress] = useState(mapQuery || DEFAULT_MAP_ADDRESS);
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

  const selectedAddress = draft.address.trim() || searchInput.trim();
  const selectedTitle = getAddressTitle(selectedAddress);
  const selectedSubtitle =
    selectedAddress && selectedAddress !== selectedTitle
      ? selectedAddress
      : [draft.district, draft.city, draft.country].filter(Boolean).join(", ");
  const showSelectedAddress = selectedAddress.length > 0;
  const canContinue = draft.address.trim().length > 0;

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    updateDraft("address", value);
    setMapAddress(value || mapQuery || DEFAULT_MAP_ADDRESS);
    setSuggestions(getAddressSuggestions(value, draft.city));
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setSearchInput(suggestion.fullAddress);
    updateDraft("address", suggestion.fullAddress);
    updateDraft("city", suggestion.city);
    updateDraft("district", suggestion.district);
    updateDraft("country", "Việt Nam");
    updateDraft("latitude", String(suggestion.lat));
    updateDraft("longitude", String(suggestion.lon));
    setMapAddress(suggestion.fullAddress);
    setSelectedCoords({ lat: suggestion.lat, lon: suggestion.lon });
    setSuggestions([]);
  };

  const handleClearAddress = () => {
    setSearchInput("");
    updateDraft("address", "");
    updateDraft("latitude", "");
    updateDraft("longitude", "");
    setSelectedCoords(null);
    setMapAddress(mapQuery || DEFAULT_MAP_ADDRESS);
    setSuggestions([]);
  };

  const handleContinue = () => {
    setTouched((prev) => ({ ...prev, address: true }));
    if (canContinue) onNext();
  };

  const openGoogleMaps = () => {
    const target = selectedCoords
      ? `${selectedCoords.lat},${selectedCoords.lon}`
      : mapAddress || DEFAULT_MAP_ADDRESS;

    window.open(
      `https://www.google.com/maps?q=${encodeURIComponent(target)}&t=${
        mapType === "satellite" ? "k" : "m"
      }&z=17`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section className="relative min-h-[calc(100vh-142px)] overflow-hidden bg-gray-100">
      <InteractiveMap
        mapAddress={mapAddress || DEFAULT_MAP_ADDRESS}
        selectedCoords={selectedCoords}
        mapType={mapType}
        onMapClick={openGoogleMaps}
      />

      <div className="absolute right-8 top-7 z-20 flex overflow-hidden rounded-sm bg-white shadow-md ring-1 ring-black/10 pointer-events-auto">
        <button
          type="button"
          className={`px-6 py-3 text-lg font-bold ${
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
          className={`border-l border-gray-200 px-6 py-3 text-lg font-bold ${
            mapType === "satellite"
              ? "bg-white text-gray-950"
              : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setMapType("satellite")}
        >
          Vệ tinh
        </button>
      </div>

      <div className="relative z-10 px-4 pb-8 pt-20 sm:px-6 lg:ml-[150px] pointer-events-none">
        <h1 className="mb-8 max-w-[650px] text-[38px] font-bold leading-tight tracking-tight text-gray-950 pointer-events-auto">
          Chỗ nghỉ của Quý vị ở đâu?
        </h1>

        <div className="w-full max-w-[620px] rounded-md border border-gray-200 bg-white px-10 pb-8 pt-9 shadow-sm pointer-events-auto">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className="border-b-2 border-[#f60057] px-5 py-3 font-medium text-[#f60057]"
            >
              Tìm kiếm nhanh
            </button>
            <button type="button" className="px-5 py-3 text-gray-900">
              Biểu mẫu Địa chỉ
            </button>
          </div>

          <label className="mt-6 block text-sm font-bold text-gray-950">
            Địa chỉ
          </label>

          <div className="relative mt-3">
            <div className="flex h-[62px] items-center gap-4 border-2 border-gray-950 bg-white px-4 focus-within:border-[#f60057] focus-within:ring-2 focus-within:ring-[#f60057]">
              <Search className="h-6 w-6 shrink-0 text-gray-600" />
              <input
                value={searchInput}
                onChange={(event) => handleSearchChange(event.target.value)}
                onFocus={() =>
                  setSuggestions(getAddressSuggestions(searchInput, draft.city))
                }
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, address: true }));
                }}
                className="h-full min-w-0 flex-1 bg-transparent text-lg text-gray-950 outline-none placeholder:text-gray-500"
                placeholder="Bắt đầu nhập địa chỉ của Quý vị"
              />
              {searchInput ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleClearAddress}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-700 text-gray-800 hover:bg-gray-100"
                  aria-label="Xóa địa chỉ"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>

            {suggestions.length > 0 ? (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
                {suggestions.map((item) => (
                  <button
                    key={`${item.title}-${item.lat}-${item.lon}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionClick(item)}
                    className="flex w-full items-start gap-4 border-b border-gray-200 px-4 py-3 text-left last:border-b-0 hover:bg-rose-50"
                  >
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-gray-950">
                        {item.title}
                      </span>
                      <span className="block text-sm text-gray-600">
                        {item.subtitle}
                      </span>
                    </span>
                  </button>
                ))}
                <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">
                  Google Maps
                  <Info className="h-4 w-4" />
                </div>
              </div>
            ) : null}
          </div>

          {(touched.address || false) && !draft.address.trim() ? (
            <p className="mt-2 text-sm font-semibold text-[#f60057]">
              Vui lòng nhập địa chỉ.
            </p>
          ) : null}

          {showSelectedAddress ? (
            <div className="mt-7">
              <h2 className="text-xl font-bold text-gray-950">
                {selectedTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {selectedSubtitle || selectedAddress}
              </p>
              <button
                type="button"
                onClick={openGoogleMaps}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 font-bold text-[#f60057] hover:bg-rose-100"
              >
                Maps
                <span aria-hidden>↗</span>
              </button>
              <p className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                Google Maps <Info className="h-4 w-4" />
              </p>
              <p className="mt-7 border-t border-gray-200 pt-5 text-sm text-gray-800">
                Nếu vị trí không chính xác, vui lòng điều chỉnh địa chỉ. Bấm vào bản đồ để mở Google Maps.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex w-full max-w-[620px] gap-3 pointer-events-auto">
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
            disabled={!canContinue}
            className={`h-14 flex-1 rounded-sm font-bold text-white ${
              canContinue
                ? "bg-[#f60057] hover:bg-[#d9004c]"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            Tiếp tục
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
    ["booking", "price", "rates", "non-refundable", "group-pricing"],
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
}: {
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
  canContinue: boolean;
  pendingText: string;
  confirmMessage: string;
  onNotReady?: () => void;
}) {
  return (
    <div className="mt-8 flex w-full max-w-[560px] flex-col gap-4">
      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-14 w-20 rounded-sm border border-[#f60057] text-[#f60057] cursor-pointer"
        >
          <ArrowLeft className="mx-auto h-5 w-5" />
        </button>
        {isLast ? (
          <PendingSubmitButton
            disabled={!canContinue}
            pendingText={pendingText}
            confirmMessage={confirmMessage}
            className="h-14 flex-1 rounded-sm bg-[#f60057] font-bold text-white hover:bg-[#d9004c]"
          >
            Mở để nhận đặt phòng
          </PendingSubmitButton>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className="h-14 flex-1 rounded-sm bg-[#f60057] font-bold text-white hover:bg-[#d9004c] disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 cursor-pointer disabled:cursor-not-allowed"
          >
            Tiếp tục
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
      <input name="free_cancellation" value="on" readOnly />
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
