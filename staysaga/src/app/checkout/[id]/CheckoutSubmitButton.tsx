"use client";

import { Lock } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function CheckoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded bg-rose-600 px-8 py-3 text-[15px] font-bold text-white shadow-sm transition-all hover:bg-rose-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Lock className="h-4 w-4" />
      {pending ? "Đang hoàn tất..." : "Hoàn tất đặt chỗ"}
    </button>
  );
}
