"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/core/favorites/actions";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  propertyId: string;
  initialFavorited?: boolean;
  className?: string;
  iconClassName?: string;
};

export default function FavoriteButton({
  propertyId,
  initialFavorited = false,
  className,
  iconClassName,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleFavorite(propertyId);
      if (result?.error) {
        alert(result.error);
        return;
      }
      if (typeof result?.isFavorited === "boolean") {
        setIsFavorited(result.isFavorited);
      }
    });
  };

  return (
    <button
      type="button"
      aria-pressed={isFavorited}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleToggle();
      }}
      disabled={isPending}
      className={cn(
        "rounded-full transition-colors",
        isPending && "opacity-70",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          isFavorited ? "text-rose-600 fill-rose-600" : "text-gray-500",
          iconClassName,
        )}
      />
    </button>
  );
}
