"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { requestPasswordReset } from "@/core/auth/actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      return await requestPasswordReset(formData);
    },
    null,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Quen mat khau
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Nhap email cua ban de nhan lien ket dat lai mat khau.
          </p>
        </div>

        <form className="space-y-4" action={formAction}>
          {state?.error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm text-center">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm text-center">
              Da gui email dat lai mat khau. Vui long kiem tra hop thu.
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-all"
              placeholder="Dia chi Email"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              "Gui lien ket"
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-rose-600 hover:text-rose-500"
          >
            Quay lai dang nhap
          </Link>
        </div>
      </div>
    </div>
  );
}
