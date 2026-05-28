"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Step2SubmitButton() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const form = e.currentTarget.closest("form");
    if (!form) return;

    // Trigger HTML5 validation check for required inputs
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    e.preventDefault();

    // Copy all existing search params (preserves details, rooms, totalPrice, etc.)
    const params = new URLSearchParams(searchParams.toString());
    
    // Set step to finish
    params.set("step", "finish");

    // Collect all filled input values from the form
    const formData = new FormData(form);
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value !== "") {
        params.set(key, value);
      }
    }

    // Smooth client-side navigation to Step 3
    router.push(`?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-10 py-3 rounded-md text-lg shadow-lg hover:shadow-rose-200 transition-all active:scale-[0.98]"
    >
      Tiếp theo: Chi tiết cuối cùng
    </button>
  );
}
