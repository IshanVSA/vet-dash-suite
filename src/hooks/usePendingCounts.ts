import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

export function usePendingCounts() {
  const { role } = useUserRole();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);

  useEffect(() => {
    if (!role) return;

    const fetchCounts = async () => {
      if (role === "admin") {
        // Admin Content Requests badge: concierge_preferred requests awaiting admin action
        const { count: reqCount } = await supabase
          .from("content_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "concierge_preferred");
        setPendingRequests(reqCount || 0);

        // Admin Review badge: client_selected requests awaiting final approval
        const { count: revCount } = await supabase
          .from("content_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "client_selected");
        setPendingReview(revCount || 0);
      } else if (role === "concierge") {
        // Concierge: generated requests needing their preference
        const { count: reqCount } = await supabase
          .from("content_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "generated");
        setPendingRequests(reqCount || 0);
      } else if (role === "client") {
        // Client: admin_approved requests needing their selection
        const { count: reqCount } = await supabase
          .from("content_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "admin_approved");
        setPendingRequests(reqCount || 0);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);

    const channel = supabase
      .channel("pending-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_requests" }, fetchCounts)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [role]);

  return { pendingRequests, pendingReview };
}
