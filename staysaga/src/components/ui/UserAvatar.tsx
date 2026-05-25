"use client";

import { useState } from "react";
import { User } from "lucide-react";

type UserAvatarProps = {
  src?: string | null;
  alt?: string;
  className?: string;
};

export default function UserAvatar({
  src,
  alt = "Avatar",
  className = "h-9 w-9",
}: UserAvatarProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200 shrink-0 ${className}`}>
        <User className="h-5 w-5" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={`rounded-full object-cover border border-slate-200 shadow-sm shrink-0 ${className}`}
      onError={() => setError(true)}
    />
  );
}
