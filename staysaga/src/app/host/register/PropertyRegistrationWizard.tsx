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
  CircleHelp,
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
  Upload,
  X,
} from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";
import { createHostHomestay } from "@/core/host/actions";

const PRIMARY = "#f60057";
const PRIMARY_HOVER = "#d9004c";
const DRAFT_KEY = "staysaga-host-register-v9";
const DB_NAME = "staysaga-host-register";
const FILE_STORE = "files";
const MIN_PHOTOS = 5;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

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

const serviceAmenities = ["Bữa sáng", "Nhà hàng", "Dịch vụ phòng", "Lễ tân 24 giờ", "Đưa đón sân bay"];
const supportedLanguages = ["Tiếng Anh", "Tiếng Pháp", "Tiếng Trung", "Tiếng Tây Ban Nha", "Tiếng Việt"];
const extraLanguages = ["Tiếng Ba Lan", "Tiếng Bulgaria", "Tiếng Bồ Đào Nha", "Tiếng Catalan", "Tiếng Croatia", "Tiếng Do Thái", "Tiếng Estonia", "Tiếng Gruzia"];

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
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
});

const stageForStep = (index: number) => {
  if (index <= 5) return 0;
  if (index <= 12) return 1;
  if (index <= 13) return 2;
  if (index <= 18) return 3;
  return 5;
};

const formatVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);

const parsePrice = (value: string) => {
  const numeric = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const totalBeds = (bedrooms: Bedroom[]) =>
  bedrooms.reduce(
    (sum, room) => sum + room.single + room.double + room.king + room.superKing + room.bunk + room.sofa + room.futon,
    0,
  );

const photoWarning = (file: File, existing: StoredPhoto[]) => {
  if (!file.type.startsWith("image/")) return "Không phải ảnh";
  if (file.size > MAX_PHOTO_SIZE) return "Ảnh quá lớn";
  if (file.size < 20 * 1024) return "Ảnh quá nhỏ";
  if (existing.some((photo) => photo.file.name === file.name && photo.file.size === file.size)) return "Ảnh bị trùng";
  return undefined;
};

function openFileDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE);
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
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => resolve([]);
  });
  db.close();
  return files;
}

function getStepValidation(step: WizardStep, draft: Draft, photos: StoredPhoto[]) {
  const errors: string[] = [];
  const validPhotos = photos.filter((photo) => !photo.warning);

  if (step === "category" && !draft.propertyType) errors.push("Vui lòng chọn loại chỗ nghỉ.");
  if (step === "name" && !draft.name.trim()) errors.push("Vui lòng nhập tên chỗ nghỉ.");
  if (step === "address" && (!draft.address.trim() || !draft.city.trim())) errors.push("Vui lòng nhập địa chỉ chỗ nghỉ.");
  if (step === "details" && draft.maxGuests < 1) errors.push("Số khách tối đa phải từ 1 trở lên.");
  if (step === "bedroom" && totalBeds(draft.bedrooms) < 1) errors.push("Cần có ít nhất 1 giường.");
  if (step === "amenities" && draft.amenities.length < 1) errors.push("Vui lòng chọn ít nhất một tiện nghi.");
  if (step === "languages" && draft.languages.length + draft.extraLanguages.length < 1) errors.push("Vui lòng chọn ít nhất một ngôn ngữ.");
  if (step === "photos" && validPhotos.length < MIN_PHOTOS) errors.push(`Cần ít nhất ${MIN_PHOTOS} ảnh hợp lệ để tiếp tục.`);
  if (step === "price" && parsePrice(draft.price) <= 0) errors.push("Vui lòng nhập giá mỗi đêm.");
  if (step === "review") errors.push(...getFinalErrors(draft, photos));

  return errors;
}

function getFinalErrors(draft: Draft, photos: StoredPhoto[]) {
  const validPhotos = photos.filter((photo) => !photo.warning);
  const errors: string[] = [];

  if (!draft.propertyType) errors.push("Thiếu loại chỗ nghỉ.");
  if (!draft.name.trim()) errors.push("Thiếu tên chỗ nghỉ.");
  if (!draft.city.trim() || !draft.address.trim()) errors.push("Thiếu địa chỉ.");
  if (validPhotos.length < MIN_PHOTOS) errors.push(`Cần ít nhất ${MIN_PHOTOS} ảnh hợp lệ.`);
  if (totalBeds(draft.bedrooms) < 1) errors.push("Thiếu thông tin giường.");
  if (parsePrice(draft.price) <= 0) errors.push("Thiếu giá mỗi đêm.");
  if (draft.amenities.length < 1) errors.push("Thiếu tiện nghi.");
  if (!draft.verificationConfirmed) errors.push("Chưa xác nhận thông tin.");

  return errors;
}

export default function PropertyRegistrationWizard() {
  const [draft, setDraft] = useState<Draft>(() => createDefaultDraft());
  const [currentStep, setCurrentStep] = useState(0);
  const [activeBedroomId, setActiveBedroomId] = useState<string>("");
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [restored, setRestored] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const current = steps[currentStep];
  const activeBedroom = draft.bedrooms.find((room) => room.id === activeBedroomId) ?? draft.bedrooms[0];
  const stepErrors = getStepValidation(current, draft, photos);
  const showStepErrors = attemptedSteps[currentStep] || false;
  const validPhotos = photos.filter((photo) => !photo.warning);
  const canContinue = stepErrors.length === 0;
  const stageIndex = stageForStep(currentStep);
  const finalErrors = useMemo(() => getFinalErrors(draft, photos), [draft, photos]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Draft;
        setDraft({
          ...createDefaultDraft(),
          ...parsed,
          bedrooms: parsed.bedrooms?.length ? parsed.bedrooms : [makeBedroom()],
        });
        setActiveBedroomId(parsed.bedrooms?.[0]?.id ?? "");
      }
    } catch {
      setDraft(createDefaultDraft());
    }

    void restoreFiles().then((files) => {
      setPhotos(files.map((file) => ({ id: makeId(), file, url: URL.createObjectURL(file) })));
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!activeBedroomId && draft.bedrooms[0]) setActiveBedroomId(draft.bedrooms[0].id);
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
      bedrooms: prev.bedrooms.map((room) => (room.id === id ? { ...room, [key]: Math.max(0, value) } : room)),
    }));
  };

  const toggleArray = (key: "amenities" | "languages" | "extraLanguages" | "partnerProfile", value: string) => {
    setDraft((prev) => {
      const list = prev[key];
      let next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      if (key === "partnerProfile" && value === "none" && !list.includes(value)) next = ["none"];
      if (key === "partnerProfile" && value !== "none") next = next.filter((item) => item !== "none");
      return { ...prev, [key]: next };
    });
  };

  const addPhotos = (files: File[]) => {
    setPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({ id: makeId(), file, url: URL.createObjectURL(file), warning: photoWarning(file, prev) })),
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

  const addressQuery = [draft.address, draft.district, draft.city, draft.country].filter(Boolean).join(", ");
  const mapQuery = addressQuery || "Việt Nam";
  const firstImage = validPhotos[0]?.url;
  const price = parsePrice(draft.price);

  return (
    <form action={createHostHomestay} className="pb-12">
      <ProgressHeader currentStep={currentStep} stageIndex={stageIndex} />
      <HiddenFields draft={draft} validPhotos={validPhotos.length} />

      {showStepErrors && stepErrors.length > 0 ? (
        <div className="mx-auto mt-8 max-w-[1200px] px-4 lg:ml-[110px]">
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

      <main className={current === "address" ? "" : "mx-auto max-w-[1200px] px-4 py-12 lg:ml-[110px]"}>
        {current === "category" ? (
          <section className="max-w-[1180px] py-12">
            <h1 className="max-w-[900px] text-[38px] font-bold leading-tight tracking-tight text-gray-950">
              Đăng chỗ nghỉ của Quý vị trên StaySaga và bắt đầu đón khách nhanh chóng!
            </h1>
            <p className="mt-4 text-xl text-gray-800">Để bắt đầu, chọn loại chỗ nghỉ Quý vị muốn đăng trên StaySaga.</p>
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
                    className={`min-h-[300px] border-b border-gray-300 p-7 text-center transition hover:bg-gray-50 md:border-b-0 md:border-r last:md:border-r-0 ${
                      draft.propertyType === item.id ? "outline outline-2 outline-[#f60057]" : ""
                    }`}
                  >
                    <Icon className="mx-auto h-14 w-14 text-[#f60057]" strokeWidth={1.8} />
                    <h2 className="mt-5 text-lg font-bold">{item.title}</h2>
                    <p className="mx-auto mt-4 min-h-[64px] max-w-[220px] text-sm leading-6 text-gray-700">{item.text}</p>
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
            <section className={current === "photos" || current === "price" ? "lg:col-span-2" : ""}>
              {renderStep()}
              <BottomNav
                onBack={goBack}
                onNext={goNext}
                isLast={current === "review"}
                canContinue={current === "review" ? finalErrors.length === 0 : canContinue}
                pendingText="Đang gửi duyệt..."
                confirmMessage="Sau khi gửi duyệt, quản trị viên StaySaga sẽ kiểm tra thông tin chỗ nghỉ trước khi hiển thị công khai."
              />
            </section>
          </div>
        )}
      </main>
    </form>
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
              <p className="mt-8 text-base">Quý vị thấy có đúng như chỗ nghỉ của mình không?</p>
              <button type="button" onClick={goNext} className="mt-4 w-full rounded-sm bg-[#f60057] py-4 font-bold text-white">
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
                  <p className="mt-2 text-sm font-semibold text-red-600">Vui lòng nhập tên chỗ nghỉ.</p>
                ) : null}
              </Panel>
              <div className="space-y-5">
                <HelpCard icon={<ThumbsUp className="h-6 w-6" />} title="Tôi nên chú ý điều gì khi chọn tên?">
                  <ul className="list-disc space-y-2 pl-5 text-[15px]">
                    <li>Chọn tên ngắn và hấp dẫn</li>
                    <li>Tránh sử dụng chữ viết tắt</li>
                    <li>Đúng với thực tế</li>
                  </ul>
                </HelpCard>
                <HelpCard icon={<Info className="h-6 w-6" />} title="Tại sao tôi cần đặt tên cho chỗ nghỉ của mình?">
                  <p className="text-[15px] leading-6 text-gray-800">
                    Tên này sẽ hiển thị với khách trên StaySaga. Hãy chọn tên dễ nhớ và không bao gồm địa chỉ đầy đủ.
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
              <p className="font-bold">Quý vị có muốn kết nối đăng ký chỗ nghỉ này với công cụ quản lý kênh?</p>
              <p className="mt-8 leading-7 text-gray-800">
                Công cụ quản lý kênh giúp quản lý giá và tình trạng phòng trống trên nhiều nền tảng. Quý vị có thể bỏ qua
                và kết nối sau.
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
                      <span className="block font-semibold">Phòng ngủ {index + 1}</span>
                      <span className="text-sm text-gray-500">{bedSummary(room)}</span>
                    </span>
                    <span className="text-[#f60057]">Chỉnh sửa</span>
                  </button>
                ))}
                <div className="rounded-md border border-gray-200 bg-white px-5 py-4 shadow-sm">
                  <span className="block font-semibold">Phòng khách</span>
                  <span className="text-sm text-gray-500">0 giường</span>
                </div>
                <button type="button" onClick={addBedroom} className="inline-flex items-center gap-2 text-[#f60057]">
                  <Plus className="h-4 w-4" /> Thêm phòng ngủ
                </button>
              </div>
            </Panel>
            <Panel className="mt-6 space-y-8">
              <Counter label="Bao nhiêu khách có thể lưu trú?" value={draft.maxGuests} min={1} onChange={(value) => updateDraft("maxGuests", value)} />
              <Counter label="Có bao nhiêu phòng tắm?" value={draft.bathrooms} min={1} onChange={(value) => updateDraft("bathrooms", value)} />
              <RadioPair
                label="Quý vị có tiếp đón trẻ em không?"
                value={draft.welcomeChildren}
                onChange={(value) => updateDraft("welcomeChildren", value)}
              />
              <RadioPair label="Quý vị có cung cấp nôi không?" value={draft.hasCrib} onChange={(value) => updateDraft("hasCrib", value)} />
              <div>
                <label className="text-sm font-bold">Căn hộ này rộng bao nhiêu?</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={draft.area}
                    onChange={(event) => updateDraft("area", event.target.value)}
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
          <Question title={`Phòng ngủ ${Math.max(1, draft.bedrooms.findIndex((room) => room.id === activeBedroom.id) + 1)}`}>
            <Panel>
              <p className="mb-7">Phòng này có giường loại nào?</p>
              {[
                ["single", "Giường đơn", "Rộng 90 - 130 cm"],
                ["double", "Giường đôi", "Rộng 131 - 150 cm"],
                ["king", "Giường lớn (cỡ King)", "Rộng 151 - 180 cm"],
                ["superKing", "Giường cực lớn (cỡ Super-king)", "Rộng 181 - 210 cm"],
                ["bunk", "Giường tầng", "Nhiều kích cỡ"],
                ["sofa", "Giường sofa", "Nhiều kích cỡ"],
                ["futon", "Nệm Futon", "Nhiều kích cỡ"],
              ].map(([key, label, sub]) => (
                <div key={key} className="flex items-center justify-between py-4">
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
                    onChange={(value) => updateBedroom(activeBedroom.id, key as keyof Bedroom, value)}
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
              <AmenityGroup title="Tiện nghi chung" items={commonAmenities.slice(0, 4)} />
              <AmenityGroup title="Nấu nướng và giặt rửa" items={commonAmenities.slice(4, 7)} />
              <AmenityGroup title="Giải trí" items={commonAmenities.slice(7, 12)} />
              <AmenityGroup title="Không gian ngoài trời và tầm nhìn" items={commonAmenities.slice(12)} />
            </Panel>
          </Question>
        );
      case "services":
        return (
          <Question title="Dịch vụ và chỗ đậu xe">
            <Panel>
              <AmenityGroup title="Dịch vụ tại chỗ nghỉ" items={serviceAmenities} />
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
                onChange={(value) => updateDraft("parking", value as Draft["parking"])}
              />
              <Divider />
              <RadioBlock
                label="Khách có cần đặt trước chỗ đậu xe không?"
                options={[
                  ["required", "Cần đặt trước"],
                  ["not_required", "Không cần đặt trước"],
                ]}
                value={draft.parkingReservation}
                onChange={(value) => updateDraft("parkingReservation", value as Draft["parkingReservation"])}
              />
              <Divider />
              <RadioBlock
                label="Chỗ đậu xe ở đâu?"
                options={[
                  ["onsite", "Trong khuôn viên"],
                  ["offsite", "Ngoài khuôn viên"],
                ]}
                value={draft.parkingLocation}
                onChange={(value) => updateDraft("parkingLocation", value as Draft["parkingLocation"])}
              />
              <Divider />
              <RadioBlock
                label="Đây là loại chỗ đậu xe gì?"
                options={[
                  ["private", "Riêng"],
                  ["public", "Công cộng"],
                ]}
                value={draft.parkingType}
                onChange={(value) => updateDraft("parkingType", value as Draft["parkingType"])}
              />
            </Panel>
          </Question>
        );
      case "languages":
        return (
          <Question title="Quý vị hoặc nhân viên của mình sử dụng ngôn ngữ nào?">
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
                <ToggleLine label="Cho phép hút thuốc" checked={draft.allowSmoking} onChange={(value) => updateDraft("allowSmoking", value)} />
                <ToggleLine label="Cho phép tiệc tùng/sự kiện" checked={draft.allowParties} onChange={(value) => updateDraft("allowParties", value)} />
                <Divider />
                <RadioBlock
                  label="Quý vị có cho phép vật nuôi không?"
                  options={[
                    ["yes", "Có"],
                    ["request", "Theo yêu cầu"],
                    ["no", "Không"],
                  ]}
                  value={draft.petsPolicy}
                  onChange={(value) => updateDraft("petsPolicy", value as Draft["petsPolicy"])}
                />
                {draft.petsPolicy !== "no" ? (
                  <RadioBlock
                    label="Quý vị có tính phí đối với vật nuôi không?"
                    options={[
                      ["free", "Vật nuôi được lưu trú miễn phí"],
                      ["paid", "Có thể tính phí"],
                    ]}
                    value={draft.petFee}
                    onChange={(value) => updateDraft("petFee", value as Draft["petFee"])}
                  />
                ) : null}
                <Divider />
                <div className="grid grid-cols-2 gap-7">
                  <TimeSelect label="Nhận phòng từ" value={draft.checkInFrom} onChange={(value) => updateDraft("checkInFrom", value)} />
                  <TimeSelect label="Nhận phòng đến" value={draft.checkInTo} onChange={(value) => updateDraft("checkInTo", value)} />
                  <TimeSelect label="Trả phòng từ" value={draft.checkOutFrom} onChange={(value) => updateDraft("checkOutFrom", value)} />
                  <TimeSelect label="Trả phòng đến" value={draft.checkOutTo} onChange={(value) => updateDraft("checkOutTo", value)} />
                </div>
              </Panel>
              <HelpCard icon={<Info className="h-6 w-6" />} title="Nếu quy tắc chung thay đổi thì sao?">
                <p className="text-[15px] leading-6">
                  Quý vị có thể chỉnh sửa các quy tắc này trong trang quản lý chỗ nghỉ sau khi hoàn tất đăng ký.
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
                Giúp chỗ nghỉ nổi bật hơn bằng cách cho khách biết thêm một chút về Quý vị, chỗ nghỉ và khu vực xung quanh.
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
                    onChange={(event) => updateDraft("partnerName", event.target.value)}
                    placeholder="Tên đối tác"
                    className="h-11 w-full rounded-sm border border-gray-500 px-3"
                  />
                  <textarea
                    value={draft.partnerBio}
                    onChange={(event) => updateDraft("partnerBio", event.target.value)}
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
                <p className="font-bold">Không thể tải lên {photos.filter((photo) => photo.warning).length} ảnh</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
                  <li>Ảnh phải là jpg, jpeg hoặc png</li>
                  <li>Ảnh nên có độ phân giải đủ rõ và không bị trùng</li>
                </ul>
              </div>
            ) : null}
            <div className="grid gap-7 lg:grid-cols-[560px_340px]">
              <Panel>
                <p>
                  <strong>Đăng tải ít nhất {MIN_PHOTOS} ảnh của chỗ nghỉ.</strong> Càng đăng nhiều, Quý vị càng có cơ hội
                  nhận đặt phòng. Quý vị có thể thêm ảnh sau.
                </p>
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 text-center ${
                    dragActive ? "border-[#f60057] bg-rose-50" : "border-gray-400"
                  }`}
                >
                  <ImageIcon className="h-20 w-20 text-gray-200" />
                  <span className="mt-3 font-bold">Kéo và thả hoặc</span>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-sm border border-[#f60057] px-4 py-2 font-bold text-[#f60057]">
                    <Camera className="h-4 w-4" /> Đăng tải ảnh
                  </span>
                  <span className="mt-4 text-sm text-gray-600">jpg/jpeg hoặc png, tối đa 10MB mỗi file</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoInput} />
                </label>
                {photos.length ? (
                  <div className="mt-10 grid grid-cols-2 gap-5">
                    {photos.map((photo, index) => (
                      <div key={photo.id} className={`relative overflow-hidden rounded-sm border ${photo.warning ? "border-red-200 bg-red-50" : "border-gray-300"}`}>
                        {index === 0 && !photo.warning ? (
                          <span className="absolute left-3 top-0 z-10 rounded-b bg-[#f60057] px-2 py-1 text-xs font-semibold text-white">
                            Ảnh chính
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((item) => item.id !== photo.id))}
                          className="absolute right-2 top-2 z-10 rounded-full border border-gray-700 bg-white p-1"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <img src={photo.url} alt={photo.file.name} className="h-48 w-full object-cover" />
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
              <HelpCard icon={<ThumbsUp className="h-6 w-6" />} title="Nếu tôi không có ảnh chụp chuyên nghiệp thì sao?">
                <p className="text-[15px] leading-6">
                  Quý vị có thể dùng ảnh chụp bằng điện thoại nếu ảnh rõ, đủ sáng và thể hiện đúng chỗ nghỉ.
                </p>
              </HelpCard>
            </div>
          </Question>
        );
      case "booking":
        return (
          <Question title="Cách thức nhận đơn đặt phòng">
            <Panel>
              <p className="font-bold">Để đảm bảo nhận đặt phòng một cách an toàn hơn, Quý vị có thể:</p>
              <ul className="mt-6 space-y-4">
                {["Thiết lập quy tắc chung để khách chấp thuận trước khi lưu trú", "Yêu cầu đặt cọc đề phòng hư hại", "Báo cáo hành vi sai phạm của khách", "Được hỗ trợ khi có sự cố phát sinh"].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="h-5 w-5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel className="mt-6">
              <p className="mb-4 font-bold">Khách có thể đặt chỗ nghỉ của Quý vị theo cách nào?</p>
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
                  <p className="font-bold">Đưa ra giá cạnh tranh để tăng khả năng nhận thêm đặt phòng.</p>
                  <p className="mt-4">Đây là khoảng giá của các chỗ nghỉ tương tự với Quý vị.</p>
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
                  <label className="text-sm font-bold">Quý vị muốn thu bao nhiêu tiền mỗi đêm?</label>
                  <div className="mt-3 flex h-11 rounded-sm border border-gray-500">
                    <span className="flex items-center border-r border-gray-300 px-3 text-gray-700">VND</span>
                    <input
                      value={draft.price}
                      onChange={(event) => updateDraft("price", event.target.value)}
                      className="w-full px-3 outline-none"
                      inputMode="numeric"
                    />
                  </div>
                  <p className="mt-3 text-sm text-gray-600">Bao gồm các loại thuế, phí và hoa hồng</p>
                  <div className="mt-8 border-t pt-6">
                    <p>
                      <span className="text-xl">15,00%</span> <span className="ml-2">Hoa hồng cho StaySaga</span>
                    </p>
                    <ul className="mt-6 space-y-3 text-gray-700">
                      <li className="flex gap-3"><Check className="h-5 w-5 text-emerald-600" /> Hỗ trợ 24/7 bằng ngôn ngữ của Quý vị</li>
                      <li className="flex gap-3"><Check className="h-5 w-5 text-emerald-600" /> Tiết kiệm thời gian với đặt phòng được xác nhận tự động</li>
                      <li className="flex gap-3"><Check className="h-5 w-5 text-emerald-600" /> StaySaga sẽ quảng bá chỗ nghỉ của Quý vị</li>
                    </ul>
                  </div>
                  <p className="mt-7 border-t pt-5 text-lg">
                    {formatVnd(Math.max(0, price * 0.85))} Doanh thu của Quý vị (bao gồm thuế)
                  </p>
                </Panel>
                <Panel className="mt-6">
                  <CheckboxLine checked={draft.promotion} label="Thu hút khách bằng giảm giá 20%" onChange={() => updateDraft("promotion", !draft.promotion)} />
                  <p className="mt-5 text-sm">Giảm 20% cho 3 đơn đặt đầu tiên hoặc trong 90 ngày, tùy trường hợp nào đến trước.</p>
                  <p className="mt-6 border-t pt-5">
                    <span className="line-through">{formatVnd(price)}</span>{" "}
                    <span className="font-bold text-emerald-700">{formatVnd(price * 0.8)}/đêm</span>
                  </p>
                </Panel>
              </div>
              <HelpCard icon={<Info className="h-6 w-6" />} title="Nếu tôi cảm thấy chưa chắc chắn về giá thì sao?">
                <p className="text-[15px] leading-6">Quý vị có thể đổi lại bất cứ lúc nào sau khi hoàn tất đăng ký.</p>
              </HelpCard>
            </div>
          </Question>
        );
      case "rates":
        return (
          <Question title="Loại giá">
            <Panel>
              <p>
                Để thu hút nhiều đối tượng khách hơn, StaySaga đề xuất Quý vị thiết lập nhiều loại giá. Các mức giá và
                chính sách này có thể chỉnh sửa sau.
              </p>
            </Panel>
            <h2 className="mt-10 text-2xl font-bold">Loại giá tiêu chuẩn</h2>
            <Panel className="mt-4">
              <div className="flex justify-between">
                <h3 className="font-bold">Chính sách hủy</h3>
                <button type="button" className="rounded-sm border border-[#f60057] px-4 py-2 font-semibold text-[#f60057]">Chỉnh sửa</button>
              </div>
              <ul className="mt-5 space-y-4">
                <li className="flex gap-3"><Check className="h-7 w-7 rounded-full border p-1" /> Khách có thể hủy miễn phí cho tới 1 ngày trước khi đến</li>
                <li className="flex gap-3"><Check className="h-7 w-7 rounded-full border p-1" /> Khách hủy trong vòng 24 giờ sẽ được miễn phí hủy</li>
              </ul>
              <Divider />
              <div className="flex justify-between">
                <h3 className="font-bold">Giá theo cỡ nhóm</h3>
                <button type="button" className="rounded-sm border border-[#f60057] px-4 py-2 font-semibold text-[#f60057]" onClick={() => setCurrentStep(18)}>
                  Chỉnh sửa
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {[4, 3, 2, 1].map((count) => (
                  <p key={count}>{count} khách: {formatVnd(price * (1 - (draft.groupDiscounts[String(count)] ?? 0) / 100))}</p>
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
                  Với loại giá không hoàn tiền, khách trả ít hơn nhưng doanh thu của Quý vị được đảm bảo nếu khách hủy
                  hoặc vắng mặt.
                </p>
                <ToggleLine
                  label="Thiết lập loại giá không hoàn tiền"
                  checked={draft.nonRefundable}
                  onChange={(value) => updateDraft("nonRefundable", value)}
                />
                <Divider />
                <label className="text-sm font-bold">Giảm giá cho khách đặt với loại giá này:</label>
                <div className="mt-2 flex h-11 rounded-sm border border-gray-500">
                  <input
                    type="number"
                    value={draft.nonRefundableDiscount}
                    onChange={(event) => updateDraft("nonRefundableDiscount", Number(event.target.value))}
                    className="w-full px-3 outline-none"
                  />
                  <span className="flex items-center border-l px-3">%</span>
                </div>
                <div className="mt-6 bg-rose-50 p-4">
                  <p>{formatVnd(price)} Giá cơ bản</p>
                  <p>{draft.nonRefundableDiscount}% Giảm giá</p>
                  <p className="font-bold">{formatVnd(price * (1 - draft.nonRefundableDiscount / 100))} Giá không hoàn tiền</p>
                </div>
              </Panel>
              <HelpCard icon={<CircleHelp className="h-6 w-6" />} title="Tại sao tôi cần thêm loại giá không hoàn tiền?">
                <p className="text-[15px] leading-6">Loại giá này giúp thu hút khách chắc chắn về ngày đi và không cần linh hoạt hủy.</p>
              </HelpCard>
            </div>
          </Question>
        );
      case "group-pricing":
        return (
          <Question title="Giá theo cỡ nhóm">
            <Panel>
              <p>Cài đặt giá thấp hơn cho nhóm ít khách giúp chỗ nghỉ hấp dẫn hơn trong nhiều kiểu tìm kiếm.</p>
              <ToggleLine label="Đã bật" checked={draft.groupPricing} onChange={(value) => updateDraft("groupPricing", value)} />
              <div className="mt-6 divide-y border-t">
                {[4, 3, 2, 1].map((count) => (
                  <div key={count} className="grid grid-cols-3 items-center gap-4 py-4">
                    <span>{count} khách</span>
                    {count === 4 ? (
                      <span>0%</span>
                    ) : (
                      <div className="flex h-10 rounded-sm border border-gray-500">
                        <input
                          type="number"
                          value={draft.groupDiscounts[String(count)] ?? 0}
                          onChange={(event) =>
                            updateDraft("groupDiscounts", { ...draft.groupDiscounts, [String(count)]: Number(event.target.value) })
                          }
                          className="w-full px-3 outline-none"
                        />
                        <span className="border-l px-3 py-2">%</span>
                      </div>
                    )}
                    <span className="text-right">{formatVnd(price * (1 - (draft.groupDiscounts[String(count)] ?? 0) / 100))}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </Question>
        );
      case "review":
        return (
          <Question title="Xem lại và gửi duyệt">
            <Panel>
              <div className="grid gap-6">
                {firstImage ? <img src={firstImage} alt={draft.name} className="h-56 w-full rounded-sm object-cover" /> : null}
                <ReviewRow label="Loại chỗ nghỉ" value={propertyTypes.find((item) => item.id === draft.propertyType)?.title ?? "Chưa chọn"} />
                <ReviewRow label="Tên chỗ nghỉ" value={draft.name || "Chưa nhập"} />
                <ReviewRow label="Vị trí" value={addressQuery || "Chưa nhập"} />
                <ReviewRow label="Sức chứa" value={`${draft.maxGuests} khách · ${draft.bedrooms.length} phòng ngủ · ${totalBeds(draft.bedrooms)} giường · ${draft.bathrooms} phòng tắm`} />
                <ReviewRow label="Giá mỗi đêm" value={formatVnd(price)} />
                <ReviewRow label="Ảnh" value={`${validPhotos.length} ảnh hợp lệ`} />
              </div>
              {finalErrors.length ? (
                <div className="mt-8 rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
                  <p className="font-bold">Còn thiếu thông tin</p>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {finalErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-8 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                  Thông tin đã đủ. Quý vị có thể gửi chỗ nghỉ cho StaySaga duyệt.
                </div>
              )}
            </Panel>
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
          <CheckboxLine key={item} checked={draft.amenities.includes(item)} label={item} onChange={() => toggleArray("amenities", item)} />
        ))}
      </div>
    );
  }
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
  setTouched: (value: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  updateDraft: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [mapType, setMapType] = useState<"map" | "satellite">("map");
  const suggestions = [
    draft.address || "17 Phước Mỹ 1",
    draft.address ? `${draft.address} gần trung tâm` : "17 Đan Kia",
    draft.address ? `${draft.address} ${draft.city}` : "17 Hẻm 19A Đan Kia",
  ];

  return (
    <section className="relative min-h-[780px] overflow-hidden bg-gray-100">
      <iframe
        title="Bản đồ vị trí chỗ nghỉ"
        src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed&t=${mapType === "satellite" ? "k" : "m"}`}
        className="absolute inset-0 h-full w-full border-0 opacity-80"
        loading="lazy"
      />
      <div className="absolute right-8 top-8 z-10 flex rounded-sm bg-white shadow">
        <button type="button" className={`px-6 py-3 font-bold ${mapType === "map" ? "bg-white" : "bg-gray-100"}`} onClick={() => setMapType("map")}>
          Bản đồ
        </button>
        <button type="button" className={`px-6 py-3 font-bold ${mapType === "satellite" ? "bg-white" : "bg-gray-100"}`} onClick={() => setMapType("satellite")}>
          Vệ tinh
        </button>
      </div>
      <div className="relative z-10 px-4 py-20 lg:ml-[110px]">
        <h1 className="mb-8 text-[36px] font-bold tracking-tight">Chỗ nghỉ của Quý vị ở đâu?</h1>
        <div className="w-full max-w-[560px] rounded-md border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex border-b">
            <button type="button" className="border-b-2 border-[#f60057] px-5 py-3 font-semibold text-[#f60057]">
              Tìm kiếm nhanh
            </button>
            <button type="button" className="px-5 py-3">Biểu mẫu Địa chỉ</button>
          </div>
          <label className="mt-6 block text-sm font-bold">Địa chỉ</label>
          <div className="mt-2 flex h-14 items-center gap-3 border border-gray-500 px-3 focus-within:border-[#f60057] focus-within:ring-1 focus-within:ring-[#f60057]">
            <Search className="h-5 w-5 text-gray-500" />
            <input
              value={draft.address}
              onChange={(event) => updateDraft("address", event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
              className="w-full outline-none"
              placeholder="Bắt đầu nhập địa chỉ của Quý vị"
            />
            {draft.address ? (
              <button type="button" onClick={() => updateDraft("address", "")}>
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
          {(touched.address || false) && !draft.address.trim() ? (
            <p className="mt-2 text-sm font-semibold text-red-600">Vui lòng nhập địa chỉ.</p>
          ) : null}
          <div className="mt-4 rounded-md border border-gray-200 bg-white shadow">
            {suggestions.map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={() => updateDraft("address", item)}
                className="flex w-full gap-4 border-b px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
              >
                <MapPin className="mt-1 h-5 w-5 text-[#f60057]" />
                <span>
                  <span className="block font-bold">{item}</span>
                  <span className="text-sm text-gray-600">{draft.district} - {draft.city}, {draft.country}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5">
            <button type="button" className="rounded-full bg-rose-100 px-4 py-2 font-bold text-[#f60057]">
              Maps ↗
            </button>
            <p className="mt-4 text-sm text-gray-600">Nếu đặt ghim sai vị trí, hãy chỉnh lại địa chỉ hoặc nhập tọa độ thủ công sau.</p>
          </div>
        </div>
        <div className="mt-8 flex w-full max-w-[560px] gap-3">
          <button type="button" onClick={onBack} className="h-14 w-20 rounded-sm border border-[#f60057] text-[#f60057]">
            <ArrowLeft className="mx-auto h-5 w-5" />
          </button>
          <button type="button" onClick={onNext} className="h-14 flex-1 rounded-sm bg-[#f60057] font-bold text-white hover:bg-[#d9004c]">
            Tiếp tục
          </button>
        </div>
      </div>
    </section>
  );
}

function ProgressHeader({ currentStep, stageIndex }: { currentStep: number; stageIndex: number }) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="grid grid-cols-6 text-center text-[15px] text-gray-300">
        {stageLabels.map((label, index) => (
          <div key={label} className={`px-2 py-6 ${index <= stageIndex ? "text-gray-900" : ""}`}>
            <span>{label}</span>
            {index < stageIndex ? <Check className="ml-2 inline h-4 w-4 rounded-full bg-emerald-600 p-0.5 text-white" /> : null}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6">
        {stageLabels.map((label, index) => (
          <div key={label} className="flex gap-1 px-6">
            {Array.from({ length: index === 1 || index === 3 ? 5 : 2 }).map((_, segment) => (
              <span
                key={segment}
                className={`h-1 flex-1 ${
                  index < stageIndex ? "bg-emerald-300" : index === stageIndex && segment <= currentStep % 5 ? "bg-[#f60057]" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Question({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <>
      {title ? <h1 className="mb-7 max-w-[620px] text-[36px] font-bold leading-tight tracking-tight text-gray-950">{title}</h1> : null}
      {children}
    </>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`w-full max-w-[560px] rounded-md border border-gray-200 bg-white p-6 ${className}`}>{children}</div>;
}

function BottomNav({
  onBack,
  onNext,
  isLast,
  canContinue,
  pendingText,
  confirmMessage,
}: {
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
  canContinue: boolean;
  pendingText: string;
  confirmMessage: string;
}) {
  return (
    <div className="mt-8 flex w-full max-w-[560px] gap-3">
      <button type="button" onClick={onBack} className="h-14 w-20 rounded-sm border border-[#f60057] text-[#f60057]">
        <ArrowLeft className="mx-auto h-5 w-5" />
      </button>
      {isLast ? (
        <PendingSubmitButton
          disabled={!canContinue}
          pendingText={pendingText}
          confirmMessage={confirmMessage}
          className="h-14 flex-1 rounded-sm bg-[#f60057] font-bold text-white hover:bg-[#d9004c]"
        >
          Gửi duyệt chỗ nghỉ
        </PendingSubmitButton>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="h-14 flex-1 rounded-sm bg-[#f60057] font-bold text-white hover:bg-[#d9004c] disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
        >
          Tiếp tục
        </button>
      )}
    </div>
  );
}

function HelpCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
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

function SelectCard({ active, title, icon, onClick }: { active: boolean; title: string; icon: ReactNode; onClick: () => void }) {
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
      {active ? <Check className="absolute -right-3 -top-3 h-7 w-7 rounded-full bg-[#f60057] p-1 text-white" /> : null}
    </button>
  );
}

function RadioLine({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-b px-6 py-4 text-left last:border-b-0">
      <span className={`h-5 w-5 rounded-full border ${checked ? "border-[#f60057] ring-4 ring-rose-100" : "border-gray-400"}`}>
        {checked ? <span className="mx-auto mt-1 block h-2.5 w-2.5 rounded-full bg-[#f60057]" /> : null}
      </span>
      <span>{label}</span>
    </button>
  );
}

function CheckboxLine({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label className="my-3 flex cursor-pointer items-center gap-3">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className={`flex h-6 w-6 items-center justify-center rounded-sm border ${checked ? "border-[#f60057] bg-[#f60057]" : "border-gray-400 bg-white"}`}>
        {checked ? <Check className="h-4 w-4 text-white" /> : null}
      </span>
      <span>{label}</span>
    </label>
  );
}

function Counter({ label, value, min = 0, onChange }: { label: string; value: number; min?: number; onChange: (value: number) => void }) {
  return (
    <div>
      <p className="mb-3 text-[17px]">{label}</p>
      <Stepper value={value} min={min} onChange={onChange} />
    </div>
  );
}

function Stepper({ value, min = 0, onChange }: { value: number; min?: number; onChange: (value: number) => void }) {
  return (
    <div className="grid h-11 w-36 grid-cols-3 rounded-sm border border-gray-500">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="text-[#f60057] disabled:text-gray-300" disabled={value <= min}>
        <Minus className="mx-auto h-4 w-4" />
      </button>
      <span className="flex items-center justify-center font-bold">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="text-[#f60057]">
        <Plus className="mx-auto h-4 w-4" />
      </button>
    </div>
  );
}

function RadioPair({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div>
      <p className="mb-3 text-[17px]">{label}</p>
      <div className="flex gap-4">
        <button type="button" onClick={() => onChange(true)} className="flex items-center gap-2">
          <span className={`h-5 w-5 rounded-full border ${value ? "border-[#f60057] ring-4 ring-rose-100" : "border-gray-400"}`} />
          Có
        </button>
        <button type="button" onClick={() => onChange(false)} className="flex items-center gap-2">
          <span className={`h-5 w-5 rounded-full border ${!value ? "border-[#f60057] ring-4 ring-rose-100" : "border-gray-400"}`} />
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
          <button key={optionValue} type="button" onClick={() => onChange(optionValue)} className="flex items-center gap-3">
            <span className={`h-5 w-5 rounded-full border ${value === optionValue ? "border-[#f60057] ring-4 ring-rose-100" : "border-gray-400"}`} />
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleLine({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-[#f60057]" : "bg-gray-400"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

function TimeSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-bold">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-sm border border-gray-500 px-3">
        {["06:00", "08:00", "10:00", "11:00", "12:00", "14:00", "15:00", "18:00", "20:00", "22:00"].map((time) => (
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

function HiddenFields({ draft, validPhotos }: { draft: Draft; validPhotos: number }) {
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

  return (
    <div className="hidden" aria-hidden="true">
      <input name="property_type" value={draft.propertyType} readOnly />
      <input name="name" value={draft.name} readOnly />
      <input name="title" value={draft.name} readOnly />
      <input name="short_description" value={description.slice(0, 160)} readOnly />
      <input name="description" value={description} readOnly />
      <input name="detailed_description" value={description} readOnly />
      <input name="country" value={draft.country} readOnly />
      <input name="city" value={draft.city} readOnly />
      <input name="district" value={draft.district} readOnly />
      <input name="address" value={draft.address || `${draft.district}, ${draft.city}`} readOnly />
      <input name="directions_note" value={draft.locationNote} readOnly />
      <input name="latitude" value={draft.latitude} readOnly />
      <input name="longitude" value={draft.longitude} readOnly />
      <input name="price_per_night" value={price} readOnly />
      <input name="base_price_per_night" value={price} readOnly />
      <input name="weekend_price" value={Math.round(price * 1.1)} readOnly />
      <input name="sale_start_date" value="" readOnly />
      <input name="sale_end_date" value="" readOnly />
      <input name="min_nights" value={1} readOnly />
      <input name="available_units" value={draft.unitMode === "multiple" ? 2 : 1} readOnly />
      <input name="max_guests" value={draft.maxGuests} readOnly />
      <input name="bedrooms" value={draft.bedrooms.length} readOnly />
      <input name="beds" value={Math.max(1, beds)} readOnly />
      <input name="bathrooms" value={draft.bathrooms} readOnly />
      <input name="area_sqm" value={draft.area} readOnly />
      <input name="room_name" value={draft.propertyType === "hotel" ? "Phòng tiêu chuẩn" : "Căn hộ 1 phòng ngủ"} readOnly />
      <input name="bed_type" value={draft.bedrooms.some((room) => room.double > 0) ? "double" : "single"} readOnly />
      <input name="bed_count" value={Math.max(1, beds)} readOnly />
      <input name="room_quantity" value={draft.unitMode === "multiple" ? 2 : 1} readOnly />
      <input name="private_bathroom" value="on" readOnly />
      <input name="amenities" value={amenities.join(",")} readOnly />
      <input name="check_in_from" value={draft.checkInFrom} readOnly />
      <input name="check_in_to" value={draft.checkInTo} readOnly />
      <input name="check_out_from" value={draft.checkOutFrom} readOnly />
      <input name="check_out_to" value={draft.checkOutTo} readOnly />
      <input name="house_rules" value={`Hút thuốc: ${draft.allowSmoking ? "Có" : "Không"}. Tiệc tùng: ${draft.allowParties ? "Có" : "Không"}.`} readOnly />
      <input name="owner_name" value={draft.ownerName || draft.partnerName || "Đối tác StaySaga"} readOnly />
      <input name="host_name" value={draft.partnerName || draft.ownerName || "Đối tác StaySaga"} readOnly />
      <input name="contact_phone" value={draft.contactPhone || "0900000000"} readOnly />
      <input name="contact_email" value={draft.contactEmail || ""} readOnly />
      <input name="verification_note" value={`Ảnh hợp lệ: ${validPhotos}. Hồ sơ: ${draft.partnerProfile.join(", ")}`} readOnly />
      {draft.bookingMode === "instant" ? <input name="instant_booking" value="on" readOnly /> : null}
      <input name="free_cancellation" value="on" readOnly />
      <input name="no_prepayment" value="on" readOnly />
      <input name="no_credit_card" value="on" readOnly />
      {draft.welcomeChildren ? <input name="allow_children" value="on" readOnly /> : null}
      {draft.allowSmoking ? <input name="allow_smoking" value="on" readOnly /> : null}
      {draft.allowParties ? <input name="allow_parties" value="on" readOnly /> : null}
      {draft.petsPolicy !== "no" ? <input name="allow_pets" value="on" readOnly /> : null}
      <input name="image_count" value={validPhotos} readOnly />
    </div>
  );
}
