"use client";

import { Printer } from "lucide-react";

type PrintConfirmationButtonProps = {
  label: string;
};

export default function PrintConfirmationButton({
  label,
}: PrintConfirmationButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-rose-600 text-rose-600 hover:bg-rose-50 font-bold px-4 py-2 rounded text-sm flex items-center gap-2 transition-all"
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
