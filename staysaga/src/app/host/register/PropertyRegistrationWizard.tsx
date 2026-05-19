"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ExternalLink,
  HelpCircle,
  Home,
  Hotel,
  Info,
  Languages,
  MapPin,
  Minus,
  Plus,
  Search,
  Star,
  TentTree,
  Upload,
  X,
} from "lucide-react";
import { createHostHomestay } from "@/core/host/actions";

type PropertyType = "apartment" | "house" | "hotel" | "other";
type UnitCount = "single" | "multiple";
type PetsPolicy = "no" | "yes" | "on-request";

type AddressSuggestion = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    county?: string;
  };
};

type RegistrationDraft = {
  step: number;
  propertyType: PropertyType;
  unitCount: UnitCount;
  name: string;
  addressQuery: string;
  selectedSuggestion: AddressSuggestion | null;
  description: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  price: string;
  amenities: string[];
  languages: string[];
  petsPolicy: PetsPolicy;
  smokingAllowed: boolean;
  partiesAllowed: boolean;
  checkInFrom: string;
  checkInTo: string;
  checkOutFrom: string;
  checkOutTo: string;
  hostName: string;
  hostBio: string;
  instantBooking: boolean;
  legalConfirmed: boolean;
  updatedAt: string;
};

type StoredDraftFile = {
  name: string;
  type: string;
  lastModified: number;
  blob: Blob;
};

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 12;
const DRAFT_STORAGE_KEY = "staysaga.hostRegistrationDraft.v2";
const DRAFT_DB_NAME = "staysaga-host-registration";
const DRAFT_STORE_NAME = "drafts";
const DRAFT_FILES_KEY = "property-files";

const steps = [
  "Loại chỗ nghỉ",
  "Số lượng căn",
  "Thông tin cơ bản",
  "Cài đặt chỗ nghỉ",
  "Ảnh",
  "Giá và lịch",
  "Thông tin pháp lý",
  "Xem lại và hoàn tất",
];

const propertyTypes: {
  value: PropertyType;
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
}[] = [
  {
    value: "apartment",
    title: "Căn hộ",
    description: "Chỗ nghỉ tự nấu nướng, đầy đủ nội thất mà khách thuê nguyên căn.",
    icon: <Building2 className="h-14 w-14" />,
    badge: "Bắt đầu nhanh",
  },
  {
    value: "house",
    title: "Nhà",
    description: "Nhà nghỉ dưỡng, biệt thự, nhà phố hoặc homestay nguyên căn.",
    icon: <Home className="h-14 w-14" />,
  },
  {
    value: "hotel",
    title: "Khách sạn, nhà nghỉ B&B hay tương tự",
    description: "Khách sạn, nhà khách, hostel, khách sạn căn hộ hoặc B&B.",
    icon: <Hotel className="h-14 w-14" />,
  },
  {
    value: "other",
    title: "Các loại chỗ nghỉ khác",
    description: "Khu cắm trại, lều trại sang trọng hoặc mô hình lưu trú đặc biệt.",
    icon: <TentTree className="h-14 w-14" />,
  },
];

const languageOptions = ["Tiếng Anh", "Tiếng Pháp", "Tiếng Trung", "Tiếng Tây Ban Nha", "Tiếng Việt"];
const amenityOptions = [
  "WiFi miễn phí",
  "Chỗ đỗ xe",
  "Bếp",
  "Máy giặt",
  "Điều hòa",
  "Ban công",
  "Tầm nhìn đẹp",
  "Cho phép thú cưng",
];

const inputClass =
  "w-full rounded border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:border-[#f60057] focus:ring-2 focus:ring-rose-100";

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DRAFT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DRAFT_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDraftFiles(files: File[]) {
  if (!("indexedDB" in window)) return;
  const db = await openDraftDb();
  const payload: StoredDraftFile[] = files.map((file) => ({
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    blob: file,
  }));

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(DRAFT_STORE_NAME, "readwrite");
    transaction.objectStore(DRAFT_STORE_NAME).put(payload, DRAFT_FILES_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function loadDraftFiles() {
  if (!("indexedDB" in window)) return [];
  const db = await openDraftDb();
  const files = await new Promise<File[]>((resolve, reject) => {
    const transaction = db.transaction(DRAFT_STORE_NAME, "readonly");
    const request = transaction.objectStore(DRAFT_STORE_NAME).get(DRAFT_FILES_KEY);
    request.onsuccess = () => {
      const rows = (request.result || []) as StoredDraftFile[];
      resolve(rows.map((row) => new File([row.blob], row.name, { type: row.type, lastModified: row.lastModified })));
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return files;
}

function inferCity(value: string, suggestion?: AddressSuggestion | null) {
  const fromSuggestion =
    suggestion?.address?.city ||
    suggestion?.address?.town ||
    suggestion?.address?.village ||
    suggestion?.address?.state ||
    suggestion?.address?.county;
  if (fromSuggestion) return fromSuggestion;

  const normalized = value.toLowerCase();
  const cities = [
    "Hà Nội",
    "TP. Hồ Chí Minh",
    "Đà Lạt",
    "Đà Nẵng",
    "Nha Trang",
    "Hội An",
    "Phú Quốc",
    "Sapa",
    "Huế",
    "Cần Thơ",
    "Hạ Long",
    "Ninh Bình",
    "Vũng Tàu",
    "Quy Nhơn",
    "Mũi Né",
    "Hà Giang",
    "Cao Bằng",
  ];
  return cities.find((city) => normalized.includes(city.toLowerCase())) || "Việt Nam";
}

function formatVnd(value: string | number) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function isDuplicateFile(files: File[], index: number) {
  const file = files[index];
  return files.findIndex((item) => item.name === file.name && item.size === file.size) !== index;
}

export function PropertyRegistrationWizard() {
  const [step, setStep] = useState(0);
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [unitCount, setUnitCount] = useState<UnitCount>("single");
  const [name, setName] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [description, setDescription] = useState("");
  const [maxGuests, setMaxGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [price, setPrice] = useState("400000");
  const [amenities, setAmenities] = useState<string[]>(["WiFi miễn phí"]);
  const [languages, setLanguages] = useState<string[]>(["Tiếng Việt"]);
  const [petsPolicy, setPetsPolicy] = useState<PetsPolicy>("no");
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [partiesAllowed, setPartiesAllowed] = useState(false);
  const [checkInFrom, setCheckInFrom] = useState("15:00");
  const [checkInTo, setCheckInTo] = useState("18:00");
  const [checkOutFrom, setCheckOutFrom] = useState("08:00");
  const [checkOutTo, setCheckOutTo] = useState("11:00");
  const [hostName, setHostName] = useState("");
  const [hostBio, setHostBio] = useState("");
  const [instantBooking, setInstantBooking] = useState(true);
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const city = useMemo(() => inferCity(addressQuery, selectedSuggestion), [addressQuery, selectedSuggestion]);
  const mapQuery = selectedSuggestion ? `${selectedSuggestion.lat},${selectedSuggestion.lon}` : addressQuery.trim();
  const mapSrc = mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : "";
  const directionHref = mapQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`
    : "https://www.google.com/maps";
  const hostRevenue = Math.round(Number(price || 0) * 0.85);

  const firstInvalidStep = useMemo(() => {
    if (!propertyType) return 0;
    if (!unitCount) return 1;
    if (!name.trim() || addressQuery.trim().length <= 5 || languages.length === 0) return 2;
    if (maxGuests < 1 || beds < 1 || bathrooms < 1) return 3;
    if (selectedFiles.length < MIN_PHOTOS) return 4;
    if (Number(price) <= 0) return 5;
    if (!legalConfirmed) return 6;
    return -1;
  }, [addressQuery, bathrooms, beds, languages.length, legalConfirmed, maxGuests, name, price, propertyType, selectedFiles.length, unitCount]);

  const canContinue = useMemo(() => {
    if (step === 2) return name.trim().length > 1 && addressQuery.trim().length > 5 && languages.length > 0;
    if (step === 3) return maxGuests >= 1 && beds >= 1 && bathrooms >= 1;
    if (step === 4) return selectedFiles.length >= MIN_PHOTOS;
    if (step === 5) return Number(price) > 0;
    if (step === 6) return legalConfirmed;
    return true;
  }, [addressQuery, bathrooms, beds, languages.length, legalConfirmed, maxGuests, name, price, selectedFiles.length, step]);
  const canSubmit = firstInvalidStep === -1;

  const syncFileInput = useCallback((files: File[]) => {
    if (!imageInputRef.current || !("DataTransfer" in window)) return;
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    imageInputRef.current.files = dataTransfer.files;
  }, []);

  const replaceFiles = useCallback(
    (files: File[]) => {
      const nextFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, MAX_PHOTOS);
      syncFileInput(nextFiles);
      setPhotoPreviews((current) => {
        current.forEach((url) => URL.revokeObjectURL(url));
        return nextFiles.map((file) => URL.createObjectURL(file));
      });
      setSelectedFiles(nextFiles);
    },
    [syncFileInput],
  );

  useEffect(() => {
    let active = true;

    async function restoreDraft() {
      try {
        const rawDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft) as Partial<RegistrationDraft>;
          if (typeof draft.step === "number") setStep(Math.min(Math.max(draft.step, 0), steps.length - 1));
          if (draft.propertyType) setPropertyType(draft.propertyType);
          if (draft.unitCount) setUnitCount(draft.unitCount);
          if (typeof draft.name === "string") setName(draft.name);
          if (typeof draft.addressQuery === "string") setAddressQuery(draft.addressQuery);
          if (draft.selectedSuggestion) setSelectedSuggestion(draft.selectedSuggestion);
          if (typeof draft.description === "string") setDescription(draft.description);
          if (typeof draft.maxGuests === "number") setMaxGuests(draft.maxGuests);
          if (typeof draft.bedrooms === "number") setBedrooms(draft.bedrooms);
          if (typeof draft.beds === "number") setBeds(draft.beds);
          if (typeof draft.bathrooms === "number") setBathrooms(draft.bathrooms);
          if (typeof draft.price === "string") setPrice(draft.price);
          if (Array.isArray(draft.amenities)) setAmenities(draft.amenities);
          if (Array.isArray(draft.languages)) setLanguages(draft.languages);
          if (draft.petsPolicy) setPetsPolicy(draft.petsPolicy);
          if (typeof draft.smokingAllowed === "boolean") setSmokingAllowed(draft.smokingAllowed);
          if (typeof draft.partiesAllowed === "boolean") setPartiesAllowed(draft.partiesAllowed);
          if (typeof draft.checkInFrom === "string") setCheckInFrom(draft.checkInFrom);
          if (typeof draft.checkInTo === "string") setCheckInTo(draft.checkInTo);
          if (typeof draft.checkOutFrom === "string") setCheckOutFrom(draft.checkOutFrom);
          if (typeof draft.checkOutTo === "string") setCheckOutTo(draft.checkOutTo);
          if (typeof draft.hostName === "string") setHostName(draft.hostName);
          if (typeof draft.hostBio === "string") setHostBio(draft.hostBio);
          if (typeof draft.instantBooking === "boolean") setInstantBooking(draft.instantBooking);
          if (typeof draft.legalConfirmed === "boolean") setLegalConfirmed(draft.legalConfirmed);
          setDraftRestored(true);
        }

        const files = await loadDraftFiles();
        if (active && files.length > 0) replaceFiles(files);
      } catch {
        // Khôi phục bản nháp chỉ là hỗ trợ thêm, không chặn luồng đăng ký.
      } finally {
        if (active) setDraftReady(true);
      }
    }

    restoreDraft();

    return () => {
      active = false;
    };
  }, [replaceFiles]);

  useEffect(() => {
    if (!draftReady) return;

    const draft: RegistrationDraft = {
      step,
      propertyType,
      unitCount,
      name,
      addressQuery,
      selectedSuggestion,
      description,
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
      price,
      amenities,
      languages,
      petsPolicy,
      smokingAllowed,
      partiesAllowed,
      checkInFrom,
      checkInTo,
      checkOutFrom,
      checkOutTo,
      hostName,
      hostBio,
      instantBooking,
      legalConfirmed,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [
    addressQuery,
    amenities,
    bathrooms,
    bedrooms,
    beds,
    checkInFrom,
    checkInTo,
    checkOutFrom,
    checkOutTo,
    description,
    draftReady,
    hostBio,
    hostName,
    instantBooking,
    languages,
    legalConfirmed,
    maxGuests,
    name,
    partiesAllowed,
    petsPolicy,
    price,
    propertyType,
    selectedSuggestion,
    smokingAllowed,
    step,
    unitCount,
  ]);

  useEffect(() => {
    if (!draftReady) return;
    saveDraftFiles(selectedFiles).catch(() => undefined);
  }, [draftReady, selectedFiles]);

  useEffect(() => {
    if (addressQuery.trim().length < 3 || selectedSuggestion?.display_name === addressQuery) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=vn&q=${encodeURIComponent(addressQuery)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = (await response.json()) as AddressSuggestion[];
        setSuggestions(data);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [addressQuery, selectedSuggestion?.display_name]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  function next() {
    if (canContinue) setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  function back() {
    setStep((value) => Math.max(value - 1, 0));
  }

  function goToStep(index: number) {
    if (index <= step || index <= firstInvalidStep || firstInvalidStep === -1) {
      setStep(index);
    }
  }

  function toggleAmenity(value: string) {
    setAmenities((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function toggleLanguage(value: string) {
    setLanguages((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function addFiles(files: FileList | null) {
    const incomingFiles = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    replaceFiles([...selectedFiles, ...incomingFiles].slice(0, MAX_PHOTOS));
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function removeFile(index: number) {
    replaceFiles(selectedFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    syncFileInput(selectedFiles);
    if (!canSubmit) {
      event.preventDefault();
      setStep(firstInvalidStep >= 0 ? firstInvalidStep : 0);
    }
  }

  return (
    <form
      action={createHostHomestay}
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8"
    >
      <input type="hidden" name="country" value="Vietnam" />
      <input type="hidden" name="property_type" value={propertyType} />
      <input type="hidden" name="unit_count" value={unitCount} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="address" value={addressQuery} />
      <input type="hidden" name="pets_policy" value={petsPolicy} />
      <input type="hidden" name="instant_booking" value={instantBooking ? "true" : "false"} />
      <input type="hidden" name="languages" value={languages.join(", ")} />
      <input type="hidden" name="amenities" value={amenities.join(", ")} />
      <input type="hidden" name="host_name" value={hostName} />
      <input type="hidden" name="host_bio" value={hostBio} />

      <div className="mb-10 border-b border-slate-200">
        <div className="grid grid-cols-2 gap-0 md:grid-cols-4 xl:grid-cols-8">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => goToStep(index)}
              className={`border-b-4 px-3 py-4 text-left text-sm font-bold ${
                step === index ? "border-[#f60057] text-slate-950" : "border-transparent text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {draftRestored && (
        <div className="mb-6 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-[#f60057]">
          Đã khôi phục bản nháp đăng ký trước đó. Thông tin và ảnh sẽ tiếp tục được tự lưu trên thiết bị này.
        </div>
      )}

      {step === 0 && (
        <section>
          <h1 className="max-w-5xl text-4xl font-black leading-tight md:text-5xl">
            Đăng chỗ nghỉ của Quý vị trên StaySaga và bắt đầu đón tiếp khách thật nhanh chóng!
          </h1>
          <p className="mt-6 text-2xl">Để bắt đầu, chọn loại chỗ nghỉ Quý vị muốn đăng trên StaySaga.</p>
          <div className="mt-14 grid grid-cols-1 border border-slate-200 bg-white md:grid-cols-4">
            {propertyTypes.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setPropertyType(item.value);
                  setStep(1);
                }}
                className={`relative flex min-h-72 flex-col items-center justify-between border-b border-slate-200 p-6 text-center text-slate-950 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${
                  propertyType === item.value ? "ring-2 ring-inset ring-[#f60057]" : ""
                }`}
              >
                {item.badge && (
                  <span className="absolute -top-5 rounded bg-[#f60057] px-4 py-2 text-sm font-bold text-white">
                    {item.badge}
                  </span>
                )}
                <span className="text-[#f60057]">{item.icon}</span>
                <div>
                  <h2 className="text-xl font-black">{item.title}</h2>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{item.description}</p>
                </div>
                <span className="w-full rounded bg-[#f60057] px-4 py-3 font-bold text-white">Đăng chỗ nghỉ</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="max-w-3xl">
          <h1 className="text-4xl font-black">Quý vị định đăng bao nhiêu căn?</h1>
          <div className="mt-8 rounded border border-slate-200 bg-white p-6">
            {[
              ["single", "Một căn", "Phù hợp khi Quý vị quản lý một chỗ nghỉ độc lập."],
              ["multiple", "Nhiều căn", "Phù hợp khi Quý vị quản lý nhiều căn trong cùng tài khoản."],
            ].map(([value, title, subtitle]) => (
              <button
                key={value}
                type="button"
                onClick={() => setUnitCount(value as UnitCount)}
                className={`relative mb-5 flex w-full items-center gap-6 border p-6 text-left last:mb-0 ${
                  unitCount === value ? "border-[#f60057] ring-2 ring-rose-100" : "border-slate-200"
                }`}
              >
                <Building2 className="h-12 w-12 text-[#f60057]" />
                <span>
                  <strong className="block text-lg">{title}</strong>
                  <span className="mt-1 block text-slate-600">{subtitle}</span>
                </span>
                {unitCount === value && (
                  <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#f60057] text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-black">Thông tin cơ bản của chỗ nghỉ</h1>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
            <div className="space-y-6">
              <div className="rounded border border-slate-200 bg-white p-6">
                <label className="block font-bold">
                  Tên chỗ nghỉ
                  <input
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={`${inputClass} mt-2`}
                    placeholder="Ví dụ: Khang Home"
                  />
                </label>

                <div className="relative mt-6">
                  <label className="block font-bold">
                    Địa chỉ
                    <div className="mt-2 flex items-center rounded border border-slate-300 bg-white focus-within:border-[#f60057] focus-within:ring-2 focus-within:ring-rose-100">
                      <Search className="ml-4 h-5 w-5 text-slate-500" />
                      <input
                        value={addressQuery}
                        onChange={(event) => {
                          const value = event.target.value;
                          setAddressQuery(value);
                          setSelectedSuggestion(null);
                          if (value.trim().length < 3) setSuggestions([]);
                        }}
                        className="w-full bg-transparent px-3 py-3 text-base font-semibold text-slate-950 outline-none"
                        placeholder="Bắt đầu nhập địa chỉ của Quý vị"
                      />
                      {addressQuery && (
                        <button type="button" onClick={() => setAddressQuery("")} className="mr-3 text-slate-500">
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </label>
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-20 mt-2 max-h-80 overflow-auto rounded border border-slate-200 bg-white shadow-xl">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => {
                            setAddressQuery(suggestion.display_name);
                            setSelectedSuggestion(suggestion);
                            setSuggestions([]);
                          }}
                          className="flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-rose-50"
                        >
                          <MapPin className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-slate-100 p-1 text-slate-600" />
                          <span>{suggestion.display_name}</span>
                        </button>
                      ))}
                      <div className="px-4 py-2 text-right text-sm font-semibold text-slate-500">Google Maps</div>
                    </div>
                  )}
                  <p className="mt-2 text-sm text-slate-600">
                    Thành phố hệ thống nhận diện: <strong>{city}</strong>
                  </p>
                </div>

                <label className="mt-6 block font-bold">
                  Mô tả ngắn
                  <textarea
                    name="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    className={`${inputClass} mt-2`}
                    placeholder="Mô tả tiện nghi, phong cách và điểm nổi bật của chỗ nghỉ."
                  />
                </label>
              </div>

              <div className="rounded border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <Languages className="h-6 w-6 text-[#f60057]" />
                  <h2 className="text-xl font-black">Quý vị hoặc nhân viên của mình sử dụng ngôn ngữ nào?</h2>
                </div>
                <p className="mt-2 text-slate-600">Chọn ngôn ngữ để khách biết có thể trao đổi bằng ngôn ngữ nào.</p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {languageOptions.map((language) => (
                    <label key={language} className="flex items-center gap-3 rounded border border-slate-200 p-3 font-semibold">
                      <input
                        type="checkbox"
                        checked={languages.includes(language)}
                        onChange={() => toggleLanguage(language)}
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      {language}
                    </label>
                  ))}
                </div>
                <button type="button" className="mt-4 font-bold text-[#f60057]">Thêm các ngôn ngữ khác</button>
              </div>
            </div>

            <aside className="space-y-5">
              <TipCard
                icon={<Info className="h-7 w-7" />}
                title="Tôi nên chú ý điều gì khi chọn tên?"
                items={["Chọn tên ngắn và dễ nhớ", "Không thêm địa chỉ vào tên", "Dùng đúng tên thực tế của chỗ nghỉ"]}
              />
              <div className="overflow-hidden rounded border border-slate-200 bg-white">
                {mapSrc ? (
                  <iframe title="Bản đồ chỗ nghỉ" src={mapSrc} className="h-72 w-full border-0" loading="lazy" allowFullScreen />
                ) : (
                  <div className="flex h-72 items-center justify-center bg-slate-100 text-center text-sm font-semibold text-slate-500">
                    Nhập địa chỉ để xem bản đồ Google Maps
                  </div>
                )}
                <a
                  href={directionHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 border-t border-slate-200 px-4 py-3 font-bold text-[#f60057]"
                >
                  Mở chỉ đường trên Google Maps <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </aside>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-black">Cài đặt chỗ nghỉ</h1>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
            <div className="space-y-6">
              <div className="rounded border border-slate-200 bg-white p-6">
                <h2 className="text-2xl font-black">Khách có thể ngủ ở đâu?</h2>
                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Stepper label="Khách" value={maxGuests} min={1} onChange={setMaxGuests} />
                  <Stepper label="Phòng ngủ" value={bedrooms} min={0} onChange={setBedrooms} />
                  <Stepper label="Giường" value={beds} min={1} onChange={setBeds} />
                  <Stepper label="Phòng tắm" value={bathrooms} min={1} onChange={setBathrooms} />
                </div>
                <input type="hidden" name="max_guests" value={maxGuests} />
                <input type="hidden" name="bedrooms" value={bedrooms} />
                <input type="hidden" name="beds" value={beds} />
                <input type="hidden" name="bathrooms" value={bathrooms} />
              </div>

              <div className="rounded border border-slate-200 bg-white p-6">
                <h2 className="text-2xl font-black">Tiện nghi phổ biến</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {amenityOptions.map((item) => (
                    <label key={item} className="flex items-center gap-3 rounded border border-slate-200 p-3 font-semibold">
                      <input type="checkbox" checked={amenities.includes(item)} onChange={() => toggleAmenity(item)} className="h-5 w-5 accent-[#f60057]" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-6">
                <h2 className="text-2xl font-black">Quy định chung</h2>
                <ToggleRow label="Cho phép hút thuốc" checked={smokingAllowed} onChange={setSmokingAllowed} />
                <ToggleRow label="Cho phép tiệc tùng/sự kiện" checked={partiesAllowed} onChange={setPartiesAllowed} />
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <p className="font-bold">Quý vị có cho phép vật nuôi không?</p>
                  {[
                    ["yes", "Có"],
                    ["on-request", "Theo yêu cầu"],
                    ["no", "Không"],
                  ].map(([value, label]) => (
                    <label key={value} className="mt-3 flex items-center gap-3">
                      <input
                        type="radio"
                        checked={petsPolicy === value}
                        onChange={() => setPetsPolicy(value as PetsPolicy)}
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 md:grid-cols-2">
                  <SelectField label="Nhận phòng từ" value={checkInFrom} onChange={setCheckInFrom} />
                  <SelectField label="Nhận phòng đến" value={checkInTo} onChange={setCheckInTo} />
                  <SelectField label="Trả phòng từ" value={checkOutFrom} onChange={setCheckOutFrom} />
                  <SelectField label="Trả phòng đến" value={checkOutTo} onChange={setCheckOutTo} />
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-6">
                <h2 className="text-2xl font-black">Hồ sơ host</h2>
                <p className="mt-2 text-slate-600">Thông tin này giúp khách biết thêm về chủ chỗ nghỉ và khu vực xung quanh.</p>
                <label className="mt-5 block font-bold">
                  Tên host
                  <input value={hostName} onChange={(event) => setHostName(event.target.value)} className={`${inputClass} mt-2`} maxLength={80} />
                </label>
                <label className="mt-5 block font-bold">
                  Về host
                  <textarea
                    value={hostBio}
                    onChange={(event) => setHostBio(event.target.value)}
                    rows={5}
                    className={`${inputClass} mt-2`}
                    maxLength={1200}
                    placeholder="Sở thích của Quý vị là gì? Quý vị thích điều gì khi làm host?"
                  />
                </label>
              </div>
            </div>
            <TipCard
              icon={<HelpCircle className="h-7 w-7" />}
              title="Nếu quy tắc chung thay đổi thì sao?"
              items={["Quý vị có thể chỉnh lại sau khi hoàn tất đăng ký", "Thông tin rõ ràng giúp khách đặt phòng tự tin hơn", "Các quy định này sẽ hiển thị trên trang chỗ nghỉ"]}
            />
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black">Chỗ nghỉ của Quý vị trông như thế nào?</h1>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded border border-slate-200 bg-white p-6">
              <p>
                <strong>Đăng tải ít nhất {MIN_PHOTOS} ảnh của chỗ nghỉ.</strong> Càng đăng nhiều, Quý vị càng có cơ hội nhận đặt phòng. Quý vị có thể thêm ảnh sau.
              </p>
              <div className="mt-6 rounded border-2 border-dashed border-slate-300 p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-3 font-bold">Kéo và thả hoặc</p>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded border border-[#f60057] px-4 py-2 font-bold text-[#f60057]">
                  <Camera className="h-4 w-4" />
                  Đăng tải ảnh
                  <input
                    ref={imageInputRef}
                    name="images"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => addFiles(event.target.files)}
                    className="sr-only"
                  />
                </label>
                <p className="mt-4 text-sm text-slate-600">jpg/jpeg, png hoặc webp, tối đa 5MB mỗi file</p>
              </div>
              <p className={`mt-4 text-sm font-bold ${selectedFiles.length >= MIN_PHOTOS ? "text-emerald-700" : "text-[#f60057]"}`}>
                Đã chọn {selectedFiles.length}/{MIN_PHOTOS} ảnh tối thiểu. Chọn ít nhất {MIN_PHOTOS} ảnh để tiếp tục.
              </p>

              {selectedFiles.length > 0 && (
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <p className="text-sm text-slate-600">Hãy chọn một ảnh chính để tạo ấn tượng đầu tiên thật tốt. Ảnh đầu tiên sẽ là ảnh chính.</p>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {selectedFiles.map((file, index) => {
                      const duplicate = isDuplicateFile(selectedFiles, index);
                      return (
                        <div key={`${file.name}-${file.lastModified}-${index}`} className={`relative overflow-hidden rounded border ${index === 0 ? "border-[#f60057]" : "border-slate-200"}`}>
                          {index === 0 && <span className="absolute left-3 top-2 z-10 rounded bg-[#f60057] px-2 py-1 text-xs font-bold text-white">Ảnh chính</span>}
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute right-3 top-3 z-10 rounded-full bg-white p-1 shadow"
                            aria-label="Xóa ảnh"
                          >
                            <X className="h-5 w-5" />
                          </button>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoPreviews[index]} alt={`Ảnh chỗ nghỉ ${index + 1}`} className="h-56 w-full object-cover" />
                          <div className={`p-3 text-sm font-semibold ${duplicate ? "bg-rose-50 text-[#f60057]" : "bg-white text-slate-700"}`}>
                            {duplicate ? "Ảnh bị trùng" : file.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <TipCard
              icon={<Camera className="h-7 w-7" />}
              title="Nếu tôi không có ảnh chụp chuyên nghiệp thì sao?"
              items={["Có thể dùng ảnh chụp bằng điện thoại", "Ưu tiên ảnh rõ, đủ sáng và đúng thực tế", "Tránh dùng ảnh không có quyền sử dụng"]}
            />
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-black">Giá và cách nhận đặt phòng</h1>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded border border-slate-200 bg-white p-6">
                <h2 className="text-2xl font-black">Giá mỗi đêm</h2>
                <p className="mt-2 text-slate-600">Đưa ra giá cạnh tranh để tăng khả năng nhận thêm đặt phòng.</p>
                <label className="mt-5 block font-bold">
                  Số tiền khách trả
                  <div className="mt-2 flex rounded border border-slate-300 focus-within:border-[#f60057] focus-within:ring-2 focus-within:ring-rose-100">
                    <span className="border-r border-slate-200 px-4 py-3 font-semibold text-slate-500">VND</span>
                    <input
                      name="price_per_night"
                      type="number"
                      min="1"
                      step="1000"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      className="w-full px-4 py-3 font-semibold outline-none"
                    />
                  </div>
                </label>
                <div className="mt-6 border-t border-slate-200 pt-5 text-slate-700">
                  <p><strong>15%</strong> hoa hồng cho StaySaga</p>
                  <p className="mt-3 text-lg">
                    <strong>VND {formatVnd(hostRevenue)}</strong> doanh thu của Quý vị sau hoa hồng dự kiến
                  </p>
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-6">
                <h2 className="text-2xl font-black">Cách thức nhận đơn đặt phòng</h2>
                <div className="mt-5 space-y-3">
                  <RadioCard
                    title="Tất cả khách có thể đặt phòng ngay lập tức"
                    description="Được đề xuất vì khách có thể hoàn tất đặt phòng nhanh hơn."
                    selected={instantBooking}
                    onClick={() => setInstantBooking(true)}
                  />
                  <RadioCard
                    title="Tất cả khách cần gửi yêu cầu đặt phòng"
                    description="Host kiểm tra yêu cầu trước khi xác nhận đặt phòng."
                    selected={!instantBooking}
                    onClick={() => setInstantBooking(false)}
                  />
                </div>
              </div>
            </div>
            <TipCard
              icon={<Info className="h-7 w-7" />}
              title="Nếu tôi chưa chắc chắn về giá thì sao?"
              items={["Có thể đổi giá sau bất kỳ lúc nào", "Nên bắt đầu bằng giá dễ đặt", "Có thể thêm giá theo tuần hoặc theo mùa sau"]}
            />
          </div>
        </section>
      )}

      {step === 6 && (
        <section className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-black">Thông tin pháp lý</h1>
          <div className="mt-8 rounded border border-slate-200 bg-white p-6">
            <p className="text-slate-700">
              StaySaga cần xác nhận thông tin cơ bản để bảo vệ khách và host. Quý vị có thể bổ sung giấy tờ chi tiết trong trang quản lý sau khi chỗ nghỉ được tạo.
            </p>
            <label className="mt-6 flex items-start gap-3 rounded border border-slate-200 p-4 font-semibold">
              <input
                type="checkbox"
                checked={legalConfirmed}
                onChange={(event) => setLegalConfirmed(event.target.checked)}
                className="mt-1 h-5 w-5 accent-[#f60057]"
              />
              Tôi xác nhận thông tin đã cung cấp là chính xác và có quyền đăng chỗ nghỉ này trên StaySaga.
            </label>
          </div>
        </section>
      )}

      {step === 7 && (
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-black">Xem lại và hoàn tất</h1>
          <div className="mt-8 overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-[2fr_1fr_1fr]">
              <PreviewImage src={photoPreviews[0]} alt="Ảnh chính chỗ nghỉ" large />
              {[1, 2, 3, 4].map((index) => (
                <PreviewImage key={index} src={photoPreviews[index]} alt={`Ảnh chỗ nghỉ ${index + 1}`} />
              ))}
            </div>
            <div className="grid gap-8 p-6 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-black">{name || "Tên chỗ nghỉ"}</h2>
                  <span className="rounded bg-[#f60057] px-3 py-1 text-sm font-bold text-white">Mới trên StaySaga</span>
                </div>
                <p className="mt-3 flex items-start gap-2 text-slate-700">
                  <MapPin className="mt-0.5 h-5 w-5 text-[#f60057]" />
                  {addressQuery || "Địa chỉ chỗ nghỉ"}
                </p>
                <p className="mt-5 text-slate-700">
                  {description || "Mô tả chỗ nghỉ sẽ hiển thị tại đây để khách hiểu rõ hơn trước khi đặt phòng."}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {amenities.map((item) => (
                    <span key={item} className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-sm font-bold text-[#f60057]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <aside className="rounded border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Star className="h-4 w-4 fill-[#f60057] text-[#f60057]" />
                  Dự kiến hiển thị tốt
                </div>
                <p className="mt-4 text-sm text-slate-600">Giá mỗi đêm</p>
                <p className="text-3xl font-black">VND {formatVnd(price)}</p>
                <p className="mt-4 text-slate-700">
                  {maxGuests} khách · {bedrooms} phòng ngủ · {beds} giường · {bathrooms} phòng tắm
                </p>
                <button type="button" className="mt-6 w-full rounded bg-[#f60057] px-5 py-3 font-bold text-white">
                  Xem chỗ trống
                </button>
              </aside>
            </div>
            {mapSrc && <iframe title="Bản đồ xem lại" src={mapSrc} className="h-64 w-full border-0" loading="lazy" allowFullScreen />}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-8 w-full rounded bg-[#f60057] px-5 py-4 text-xl font-bold text-white hover:bg-[#e0004f] disabled:bg-slate-300"
          >
            Lưu chỗ nghỉ vào tài khoản của tôi
          </button>
          <p className="mt-4 text-center text-sm text-slate-600">
            Sau khi lưu, chỗ nghỉ sẽ xuất hiện trong mục “Xem chỗ nghỉ của tôi”.
          </p>
        </section>
      )}

      <div className="mt-10 flex max-w-5xl items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={back} className="rounded border border-[#f60057] px-6 py-3 font-bold text-[#f60057]">
            <ArrowLeft className="mr-2 inline h-4 w-4" />
            Quay lại
          </button>
        )}
        {step < steps.length - 1 && (
          <button
            type="button"
            onClick={next}
            disabled={!canContinue}
            className="ml-auto rounded bg-[#f60057] px-8 py-3 font-bold text-white hover:bg-[#e0004f] disabled:bg-slate-300"
          >
            Tiếp tục
          </button>
        )}
      </div>
    </form>
  );
}

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded border border-slate-200 p-4">
      <p className="font-bold">{label}</p>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-xl font-black">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f60057] text-[#f60057]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-4">
      <span className="font-semibold">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-8 w-14 rounded-full p-1 transition ${checked ? "bg-[#f60057]" : "bg-slate-300"}`}
        aria-pressed={checked}
      >
        <span className={`block h-6 w-6 rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function SelectField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const times = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
  return (
    <label className="block font-bold">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} mt-2`}>
        {times.map((time) => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>
    </label>
  );
}

function RadioCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 rounded border p-4 text-left ${selected ? "border-[#f60057] bg-rose-50" : "border-slate-200"}`}
    >
      <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#f60057]" : "border-slate-400"}`}>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#f60057]" />}
      </span>
      <span>
        <strong className="block">{title}</strong>
        <span className="mt-1 block text-sm text-slate-600">{description}</span>
      </span>
    </button>
  );
}

function TipCard({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <aside className="rounded border border-slate-200 bg-white p-6">
      <div className="flex gap-4">
        <span className="text-[#f60057]">{icon}</span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <ul className="mt-6 list-disc space-y-2 pl-10 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

function PreviewImage({ src, alt, large }: { src?: string; alt: string; large?: boolean }) {
  return (
    <div className={`overflow-hidden rounded bg-slate-100 ${large ? "aspect-[16/10] md:row-span-2" : "aspect-[16/10]"}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-sm font-bold text-slate-400">
          <Camera className="mb-2 h-8 w-8" />
          Ảnh chỗ nghỉ
        </div>
      )}
    </div>
  );
}
