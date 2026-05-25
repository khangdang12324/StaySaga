"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RealtimeSubscriptionProps = {
  table: "profiles" | "homestays" | "bookings" | "reviews";
  filter?: string; // e.g. "owner_id=eq.user-id"
};

export function RealtimeSubscription({ table, filter }: RealtimeSubscriptionProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let debounceTimer: NodeJS.Timeout | null = null;

    // Trigger router.refresh with a debounce of 450ms
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEvent = (payload: any) => {
      console.log(`Realtime update received for table ${table}:`, payload);
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        console.log(`Triggering router.refresh() for table ${table}`);
        router.refresh();
      }, 450);
    };

    const channelName = `realtime-${table}-${filter ? filter.replace(/[^a-zA-Z0-9]/g, "-") : "all"}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: filter,
        },
        handleEvent
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for table ${table}:`, status);
      });

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      console.log(`Unsubscribing from realtime table ${table}`);
      supabase.removeChannel(channel);
    };
  }, [table, filter, router]);

  return null;
}
