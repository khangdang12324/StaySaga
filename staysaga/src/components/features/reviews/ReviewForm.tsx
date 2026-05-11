"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { createReview } from "@/core/reviews/actions";

type ReviewOption = {
  id: string;
  name: string;
  city?: string | null;
};

type ActionState = {
  error?: string;
  success?: boolean;
} | null;

export default function ReviewForm({ options }: { options: ReviewOption[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prevState: ActionState, formData: FormData) => {
      return await createReview(formData);
    },
    null,
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  if (!options.length) {
    return null;
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-600">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600">
          Da gui danh gia. Cam on ban!
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Cho o
          </label>
          <select
            name="homestayId"
            required
            defaultValue={options[0]?.id}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {option.city ? ` - ${option.city}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            So sao
          </label>
          <select
            name="rating"
            required
            defaultValue="5"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="5">5 - Tuyet voi</option>
            <option value="4">4 - Rat tot</option>
            <option value="3">3 - Tot</option>
            <option value="2">2 - Can cai thien</option>
            <option value="1">1 - Te</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Nhan xet
        </label>
        <textarea
          name="comment"
          required
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
          placeholder="Chia se cam nhan cua ban..."
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Gui danh gia"
        )}
      </button>
    </form>
  );
}
