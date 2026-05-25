"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "font-sans font-bold text-sm",
        duration: 3000,
        style: {
          background: "#fff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          borderRadius: "0.75rem",
        },
      }}
    />
  );
}
