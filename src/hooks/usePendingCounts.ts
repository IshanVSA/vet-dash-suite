import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

export function usePendingCounts() {
  const { role } = useUserRole();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);

  useEffect(() => {
    if (role !== "admin" && role !== "concierge") return;

    const fetchCounts = async () => {
      // Pending content requests (not yet client_approved)
      const { count: reqCount } = await supabase
        .from("content_requests")
        .select("*", { count: "exact", head: true })
        .not("status", "eq", "client_approved");
      setPendingRequests(reqCount || 0);

      // Pending admin review (calendar submissions needing review)
      if (role === "admin") {
        const { count: revCount } = await supabase
          .from("calendar_submissions")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "needs_review"]);
        setPendingReview(revCount || 0);
      }
    };

    fetchCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);

    // Also listen to realtime changes
    const channel = supabase
      .channel("pending-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_requests" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_submissions" }, fetchCounts)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [role]);

  return { pendingRequests, pendingReview };
}
