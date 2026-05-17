"use client";

import { useState } from "react";
import { 
  Plus, 
  Pencil, 
  MapPin, 
  Info, 
  Camera, 
  DollarSign, 
  Bed, 
  Users, 
  ArrowLeft, 
  ArrowRight,
  Check
} from "lucide-react";
import { HostListing } from "@/core/host/actions";

type Props = {
  listing?: HostListing;
  mode: "create" | "edit";
  action: (formData: FormData) => Promise<any>;
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-rose-950";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function StepperHomestayForm({ listing, mode, action }: Props) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      {listing && <input type="hidden" name="id" value={listing.id} />}

      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center flex-1 relative">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 z-10 ${
                  step === s 
                    ? "bg-rose-600 text-white border-rose-600" 
                    : step > s 
                    ? "bg-emerald-500 text-white border-emerald-500" 
                    : "bg-white text-zinc-400 border-zinc-200"
                }`}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              <span className={`text-xs font-semibold mt-2 ${step >= s ? "text-rose-600" : "text-zinc-400"}`}>
                {s === 1 ? "Thông tin cơ bản" : s === 2 ? "Chi tiết phòng" : "Hình ảnh & Giá"}
              </span>
              
              {/* Line between steps */}
              {s < 3 && (
                <div 
                  className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 ${
                    step > s ? "bg-emerald-500" : "bg-zinc-100"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm">
        
        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 text-rose-600">
              <MapPin className="h-5 w-5" />
              <h3 className="font-bold">Địa điểm & Tên gọi</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Tên chỗ ở *">
                <input
                  name="name"
                  required
                  defaultValue={listing?.name}
                  placeholder="Ví dụ: Villa gần biển Đà Nẵng"
                  className={inputClass}
                />
              </Field>
              <Field label="Thành phố *">
                <input
                  name="city"
                  required
                  defaultValue={listing?.city}
                  placeholder="Ví dụ: Đà Nẵng"
                  className={inputClass}
                />
              </Field>
              <Field label="Địa chỉ">
                <input
                  name="address"
                  defaultValue={listing?.address || ""}
                  placeholder="Ví dụ: Sơn Trà, Đà Nẵng"
                  className={inputClass}
                />
              </Field>
              <Field label="Quốc gia">
                <input
                  name="country"
                  defaultValue={listing?.country || "Vietnam"}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 text-rose-600">
              <Info className="h-5 w-5" />
              <h3 className="font-bold">Chi tiết & Diện tích</h3>
            </div>
            
            <Field label="Mô tả chỗ nghỉ">
              <textarea
                name="description"
                defaultValue={listing?.description || ""}
                rows={4}
                placeholder="Mô tả tiện nghi, phong cách và điểm nổi bật của chỗ ở."
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Field label="Số khách tối đa">
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    name="max_guests"
                    type="number"
                    min="1"
                    defaultValue={listing?.max_guests || 2}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Phòng ngủ">
                <input
                  name="bedrooms"
                  type="number"
                  min="0"
                  defaultValue={listing?.bedrooms || 1}
                  className={inputClass}
                />
              </Field>
              <Field label="Số giường">
                <input
                  name="beds"
                  type="number"
                  min="0"
                  defaultValue={listing?.beds || 1}
                  className={inputClass}
                />
              </Field>
              <Field label="Phòng tắm">
                <input
                  name="bathrooms"
                  type="number"
                  min="0"
                  defaultValue={listing?.bathrooms || 1}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        )}

        {/* STEP 3: Photos & Pricing */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 text-rose-600">
              <Camera className="h-5 w-5" />
              <h3 className="font-bold">Hình ảnh & Giá cả</h3>
            </div>
            
            <Field label="Giá mỗi đêm (VND) *">
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  name="price_per_night"
                  type="number"
                  min="1"
                  step="1000"
                  required
                  defaultValue={listing?.price_per_night}
                  className={`${inputClass} pl-9`}
                  placeholder="Ví dụ: 1500000"
                />
              </div>
            </Field>

            <Field label="Ảnh homestay">
              <input
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="block w-full rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-rose-700 hover:file:bg-rose-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              />
            </Field>

            {mode === "edit" && (
              <label className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-700 w-fit mt-4">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={listing?.is_active}
                  className="h-4 w-4 rounded border-zinc-300 text-rose-600"
                />
                Đang hiển thị trên web
              </label>
            )}
          </div>
        )}

      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={prevStep}
          className={`inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
            step === 1 ? "invisible" : ""
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Tiếp theo
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-rose-700 shadow-sm shadow-rose-100"
          >
            {mode === "create" ? (
              <>
                <Plus className="h-4 w-4" />
                Đăng chỗ nghỉ
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
