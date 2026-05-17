"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  Home,
  Hotel,
  Lightbulb,
  TentTree,
  ThumbsUp,
} from "lucide-react";
import { createHostHomestay } from "@/core/host/actions";

type PropertyType = "apartment" | "house" | "hotel" | "other";
type UnitCount = "single" | "multiple";

const propertyTypes: {
  value: PropertyType;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}[] = [
  {
    value: "apartment",
    title: "Căn hộ",
    description: "Chỗ nghỉ tự nấu nướng, đầy đủ nội thất mà khách thuê nguyên căn.",
    icon: <Building2 className="h-14 w-14 text-[#123b8b]" />,
    badge: "Bắt đầu nhanh",
  },
  {
    value: "house",
    title: "Nhà",
    description: "Nhà nghỉ dưỡng, biệt thự, nhà phố hoặc homestay nguyên căn.",
    icon: <Home className="h-14 w-14 text-[#123b8b]" />,
  },
  {
    value: "hotel",
    title: "Khách sạn, nhà nghỉ B&B hay tương tự",
    description: "Khách sạn, nhà khách, hostel, khách sạn căn hộ hoặc B&B.",
    icon: <Hotel className="h-14 w-14 text-[#123b8b]" />,
  },
  {
    value: "other",
    title: "Các loại chỗ nghỉ khác",
    description: "Tàu thuyền, khu cắm trại, lều trại sang trọng hoặc mô hình đặc biệt.",
    icon: <TentTree className="h-14 w-14 text-[#123b8b]" />,
  },
];

const steps = [
  "Thông tin cơ bản",
  "Cài đặt chỗ nghỉ",
  "Ảnh",
  "Giá và lịch",
  "Xem lại và hoàn tất",
];

const inputClass =
  "w-full rounded border border-slate-400 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]";

function getTypeTitle(type: PropertyType) {
  return propertyTypes.find((item) => item.value === type)?.title || "Căn hộ";
}

export function PropertyRegistrationWizard() {
  const [step, setStep] = useState(0);
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [unitCount, setUnitCount] = useState<UnitCount>("single");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Đà Lạt");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("550000");
  const [maxGuests, setMaxGuests] = useState("2");
  const [bedrooms, setBedrooms] = useState("1");
  const [beds, setBeds] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");

  const progress = useMemo(() => {
    if (step <= 2) return 0;
    if (step === 3) return 1;
    return Math.min(step - 2, steps.length - 1);
  }, [step]);

  const canContinue =
    step < 3 ||
    (name.trim().length >= 3 && city.trim().length >= 2 && address.trim().length >= 3);

  const next = () => setStep((current) => Math.min(current + 1, 6));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  return (
    <>
      {step >= 3 && (
        <div className="border-b border-slate-200 bg-white">
          <div className="grid grid-cols-5 text-center text-sm font-medium text-slate-300">
            {steps.map((label, index) => (
              <div key={label} className="relative py-7">
                <span className={index <= progress ? "text-slate-900" : ""}>{label}</span>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-200">
                  {index <= progress && <div className="h-full bg-[#006ce4]" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {step === 0 && (
          <section className="mx-auto max-w-6xl">
            <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-tight">
              Đăng chỗ nghỉ của Quý vị trên StaySaga và bắt đầu đón tiếp khách thật nhanh chóng!
            </h1>
            <p className="mt-5 text-2xl text-slate-900">
              Để bắt đầu, chọn loại chỗ nghỉ Quý vị muốn đăng trên StaySaga
            </p>

            <div className="mt-14 grid grid-cols-1 border border-slate-200 bg-white md:grid-cols-4">
              {propertyTypes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setPropertyType(item.value);
                    next();
                  }}
                  className="relative flex min-h-[330px] flex-col items-center justify-between border-b border-slate-200 p-6 text-center transition hover:bg-slate-50 md:border-b-0 md:border-r last:md:border-r-0"
                >
                  {item.badge && (
                    <span className="absolute -top-4 rounded bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                  <div className="mt-8 flex flex-col items-center">
                    {item.icon}
                    <h2 className="mt-6 min-h-14 text-xl font-black">{item.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-800">{item.description}</p>
                  </div>
                  <span className="mt-8 w-full rounded bg-[#006ce4] px-4 py-3 text-base font-bold text-white hover:bg-[#0057b8]">
                    Đăng chỗ nghỉ
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="max-w-2xl">
            <h1 className="text-4xl font-black leading-tight">
              Quý vị định đăng bao nhiêu căn hộ?
            </h1>
            <div className="mt-8 rounded border border-slate-200 bg-white p-6">
              {[
                { value: "single" as UnitCount, title: "Một căn hộ", icon: <Home /> },
                { value: "multiple" as UnitCount, title: "Nhiều căn hộ", icon: <Building2 /> },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setUnitCount(item.value)}
                  className={`relative mb-6 flex w-full items-center gap-8 border p-6 text-left text-lg font-medium last:mb-0 ${
                    unitCount === item.value
                      ? "border-[#006ce4] ring-2 ring-[#006ce4]"
                      : "border-slate-200"
                  }`}
                >
                  <span className="text-[#123b8b]">{item.icon}</span>
                  {item.title}
                  {unitCount === item.value && (
                    <span className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#006ce4] text-white">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <WizardNav onBack={back} onNext={next} />
          </section>
        )}

        {step === 2 && (
          <section className="max-w-2xl">
            <div className="rounded border border-slate-200 bg-white p-8 text-center">
              <p className="text-xl">Quý vị đang đăng:</p>
              <div className="mt-8 flex justify-center">
                <Building2 className="h-20 w-20 text-[#123b8b]" />
              </div>
              <h1 className="mt-8 text-3xl font-black leading-tight">
                {unitCount === "single"
                  ? `Một ${getTypeTitle(propertyType).toLowerCase()} nơi khách có thể đặt nguyên căn`
                  : `Nhiều ${getTypeTitle(propertyType).toLowerCase()} trong cùng một tài khoản`}
              </h1>
              <p className="mt-10 text-xl">Quý vị thấy có đúng như chỗ nghỉ của mình không?</p>
              <button
                type="button"
                onClick={next}
                className="mt-4 w-full rounded bg-[#006ce4] px-4 py-4 text-xl font-bold text-white hover:bg-[#0057b8]"
              >
                Tiếp tục
              </button>
              <button
                type="button"
                onClick={back}
                className="mt-4 w-full rounded border border-[#006ce4] bg-white px-4 py-4 text-xl font-bold text-[#006ce4]"
              >
                Không, tôi cần thay đổi
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-4xl font-black">Tên chỗ nghỉ Quý vị?</h1>
            <div className="mt-8 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
              <div className="min-h-[460px] rounded border border-slate-200 bg-white p-6">
                <label className="block text-base font-bold">Tên chỗ nghỉ</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block font-bold">Thành phố</span>
                    <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                  </label>
                  <label>
                    <span className="mb-2 block font-bold">Địa chỉ</span>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
                  </label>
                </div>
                <label className="mt-6 block">
                  <span className="mb-2 block font-bold">Mô tả ngắn</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className={inputClass}
                  />
                </label>
              </div>
              <Tips />
            </div>
            <WizardNav onBack={back} onNext={next} nextDisabled={!canContinue} />
          </section>
        )}

        {step === 4 && (
          <section className="max-w-3xl">
            <h1 className="text-4xl font-black">Cài đặt chỗ nghỉ</h1>
            <div className="mt-8 rounded border border-slate-200 bg-white p-6">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                <NumberField label="Khách tối đa" value={maxGuests} onChange={setMaxGuests} />
                <NumberField label="Phòng ngủ" value={bedrooms} onChange={setBedrooms} />
                <NumberField label="Giường" value={beds} onChange={setBeds} />
                <NumberField label="Phòng tắm" value={bathrooms} onChange={setBathrooms} />
              </div>
            </div>
            <WizardNav onBack={back} onNext={next} />
          </section>
        )}

        {step === 5 && (
          <section className="max-w-3xl">
            <h1 className="text-4xl font-black">Giá mỗi đêm</h1>
            <div className="mt-8 rounded border border-slate-200 bg-white p-6">
              <label className="block">
                <span className="mb-2 block font-bold">Giá VND</span>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <WizardNav onBack={back} onNext={next} />
          </section>
        )}

        {step === 6 && (
          <section className="max-w-3xl">
            <h1 className="text-4xl font-black">Xem lại và hoàn tất</h1>
            <div className="mt-8 rounded border border-slate-200 bg-white p-6">
              <dl className="grid grid-cols-1 gap-4 text-base md:grid-cols-2">
                <Summary label="Loại chỗ nghỉ" value={getTypeTitle(propertyType)} />
                <Summary label="Quy mô" value={unitCount === "single" ? "Một căn" : "Nhiều căn"} />
                <Summary label="Tên" value={name} />
                <Summary label="Địa chỉ" value={`${address}, ${city}`} />
                <Summary label="Sức chứa" value={`${maxGuests} khách`} />
                <Summary label="Giá" value={`${Number(price || 0).toLocaleString("vi-VN")} VND/đêm`} />
              </dl>
              <form action={createHostHomestay} encType="multipart/form-data" className="mt-8">
                <input type="hidden" name="name" value={name} />
                <input type="hidden" name="city" value={city} />
                <input type="hidden" name="address" value={address} />
                <input type="hidden" name="country" value="Vietnam" />
                <input type="hidden" name="description" value={description || `${getTypeTitle(propertyType)} tại ${city}`} />
                <input type="hidden" name="price_per_night" value={price} />
                <input type="hidden" name="max_guests" value={maxGuests} />
                <input type="hidden" name="bedrooms" value={bedrooms} />
                <input type="hidden" name="beds" value={beds} />
                <input type="hidden" name="bathrooms" value={bathrooms} />
                <button
                  type="submit"
                  className="w-full rounded bg-[#006ce4] px-4 py-4 text-xl font-bold text-white hover:bg-[#0057b8]"
                >
                  Hoàn tất và đăng chỗ nghỉ
                </button>
              </form>
            </div>
            <WizardNav onBack={back} />
          </section>
        )}
      </main>
    </>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-12 flex max-w-2xl gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-16 w-24 items-center justify-center rounded border border-[#006ce4] bg-white text-[#006ce4]"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="h-16 flex-1 rounded bg-[#006ce4] text-xl font-bold text-white hover:bg-[#0057b8] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          Tiếp tục
        </button>
      )}
    </div>
  );
}

function Tips() {
  return (
    <aside className="space-y-5">
      <div className="rounded border border-slate-200 bg-white p-6">
        <div className="flex gap-4">
          <ThumbsUp className="mt-1 h-7 w-7" />
          <div>
            <h2 className="text-xl font-black">Tôi nên chú ý điều gì khi chọn tên?</h2>
            <ul className="mt-8 list-disc space-y-2 pl-5 text-base">
              <li>Chọn tên ngắn và hấp dẫn</li>
              <li>Tránh sử dụng chữ viết tắt</li>
              <li>Đúng với thực tế</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="rounded border border-slate-200 bg-white p-6">
        <div className="flex gap-4">
          <Lightbulb className="mt-1 h-7 w-7" />
          <div>
            <h2 className="text-xl font-black">Tại sao cần đặt tên cho chỗ nghỉ?</h2>
            <p className="mt-5 leading-7">
              Tên này sẽ hiển thị trên StaySaga để khách nhận diện chỗ nghỉ. Không nên đưa địa chỉ đầy đủ vào tên.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block font-bold">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold text-slate-950">{value || "-"}</dd>
    </div>
  );
}
