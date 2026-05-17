"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RealtimeNotification({ userId }: { userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as { message?: string };
          console.log("Realtime Notification:", newNotification.message);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  if (unreadCount === 0) return null;

  return (
    <div className="absolute top-0 right-0 -mt-1 -mr-1">
      <span className="flex h-4 w-4 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] items-center justify-center text-white font-bold">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      </span>
    </div>
  );
}
