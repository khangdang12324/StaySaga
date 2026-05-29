"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, DollarSign, Info, MapPin, Pencil, Plus, Users } from "lucide-react";
import { type HostListing } from "@/core/host/actions";

type Props = {
  listing?: HostListing;
  mode: "create" | "edit";
  action: (formData: FormData) => Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#f60057] focus:ring-2 focus:ring-rose-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

export default function StepperHomestayForm({ listing, mode, action }: Props) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => setStep((value) => Math.min(value + 1, totalSteps));
  const prevStep = () => setStep((value) => Math.max(value - 1, 1));

  return (
    <form action={action} className="space-y-6">
      {listing && <input type="hidden" name="id" value={listing.id} />}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((item) => (
            <div key={item} className="relative flex flex-1 flex-col items-center">
              <div
                className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  step === item
                    ? "border-[#f60057] bg-[#f60057] text-white"
                    : step > item
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-200 bg-white text-zinc-400"
                }`}
              >
                {step > item ? <Check className="h-5 w-5" /> : item}
              </div>
              <span className={`mt-2 text-xs font-semibold ${step >= item ? "text-[#f60057]" : "text-zinc-400"}`}>
                {item === 1 ? "Thông tin cơ bản" : item === 2 ? "Chi tiết phòng" : "Hình ảnh và giá"}
              </span>
              {item < 3 && (
                <div className={`absolute left-1/2 top-5 h-0.5 w-full ${step > item ? "bg-emerald-500" : "bg-zinc-100"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {step === 1 && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2 text-[#f60057]">
              <MapPin className="h-5 w-5" />
              <h3 className="font-bold">Địa điểm và tên gọi</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Tên chỗ nghỉ *">
                <input name="name" required defaultValue={listing?.name} placeholder="Ví dụ: Villa gần biển Đà Nẵng" className={inputClass} />
              </Field>
              <Field label="Thành phố *">
                <input name="city" required defaultValue={listing?.city} placeholder="Ví dụ: Đà Nẵng" className={inputClass} />
              </Field>
              <Field label="Địa chỉ">
                <input name="address" defaultValue={listing?.address || ""} placeholder="Ví dụ: Sơn Trà, Đà Nẵng" className={inputClass} />
              </Field>
              <Field label="Quốc gia">
                <input name="country" defaultValue={listing?.country || "Vietnam"} className={inputClass} />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2 text-[#f60057]">
              <Info className="h-5 w-5" />
              <h3 className="font-bold">Chi tiết và diện tích</h3>
            </div>
            <Field label="Mô tả chỗ nghỉ">
              <textarea
                name="description"
                defaultValue={listing?.description || ""}
                rows={4}
                placeholder="Mô tả tiện nghi, phong cách và điểm nổi bật của chỗ nghỉ."
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Field label="Số khách tối đa">
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input name="max_guests" type="number" min="1" defaultValue={listing?.max_guests || 2} className={`${inputClass} pl-9`} />
                </div>
              </Field>
              <Field label="Phòng ngủ">
                <input name="bedrooms" type="number" min="0" defaultValue={listing?.bedrooms || 1} className={inputClass} />
              </Field>
              <Field label="Số giường">
                <input name="beds" type="number" min="0" defaultValue={listing?.beds || 1} className={inputClass} />
              </Field>
              <Field label="Phòng tắm">
                <input name="bathrooms" type="number" min="0" defaultValue={listing?.bathrooms || 1} className={inputClass} />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2 text-[#f60057]">
              <Camera className="h-5 w-5" />
              <h3 className="font-bold">Hình ảnh và giá</h3>
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
                className="block w-full rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#f60057] hover:file:bg-rose-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              />
            </Field>
            {mode === "edit" && listing?.status === "APPROVED" && (
              <label className="mt-4 flex w-fit items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-700">
                <input name="is_active" type="checkbox" defaultChecked={listing?.is_active} className="h-4 w-4 rounded border-zinc-300 accent-[#f60057]" />
                Đang hiển thị trên web
              </label>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
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
            className="inline-flex items-center gap-2 rounded-lg bg-[#f60057] px-6 py-2 text-sm font-bold text-white shadow-sm shadow-rose-100 transition hover:bg-[#f60057]"
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
