import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicOption {
  id: string;
  clinic_name: string;
}

export function useClinicSelector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedClinicId = searchParams.get("clinic") || "";

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("id, clinic_name")
        .eq("status", "active")
        .order("clinic_name");
      if (!error && data) {
        setClinics(data);
        // Auto-select first clinic if none selected
        if (!searchParams.get("clinic") && data.length > 0) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("clinic", data[0].id);
            return next;
          }, { replace: true });
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const setSelectedClinicId = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("clinic", id);
      return next;
    }, { replace: true });
  };

  return { clinics, selectedClinicId, setSelectedClinicId, loading };
}
