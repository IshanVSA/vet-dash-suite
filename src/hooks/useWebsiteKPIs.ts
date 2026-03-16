import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WebsiteKPIs {
  visitorsToday: number;
  visitorsLastWeek: number;
  engagementRate: number;
  engagementRatePrev: number;
  avgSessionDuration: number;
  avgSessionDurationPrev: number;
  pagesPerSession: number;
  pagesPerSessionPrev: number;
  dailyTraffic: { label: string; value: number }[];
  loading: boolean;
}

export function useWebsiteKPIs(clinicId?: string): WebsiteKPIs {
  const [data, setData] = useState<WebsiteKPIs>({
    visitorsToday: 0, visitorsLastWeek: 0,
    bounceRate: 0, bounceRatePrev: 0,
    avgSessionDuration: 0, avgSessionDurationPrev: 0,
    pagesPerSession: 0, pagesPerSessionPrev: 0,
    dailyTraffic: [],
    loading: true,
  });

  useEffect(() => {
    if (!clinicId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchKPIs = async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

      // Fetch last 14 days of data for comparisons
      const { data: rows } = await (supabase as any)
        .from("website_pageviews")
        .select("session_id, path, created_at")
        .eq("clinic_id", clinicId)
        .gte("created_at", fourteenDaysAgo)
        .order("created_at", { ascending: true }) as { data: unknown[] | null };

      const pageviews = (rows || []) as { session_id: string; path: string; created_at: string }[];

      // Visitors today
      const todayViews = pageviews.filter(p => p.created_at >= todayStart);
      const visitorsToday = new Set(todayViews.map(p => p.session_id)).size;

      // Visitors same day last week
      const lastWeekDayStart = new Date(now.getTime() - 7 * 86400000);
      lastWeekDayStart.setHours(0, 0, 0, 0);
      const lastWeekDayEnd = new Date(lastWeekDayStart.getTime() + 86400000);
      const lastWeekViews = pageviews.filter(p => p.created_at >= lastWeekDayStart.toISOString() && p.created_at < lastWeekDayEnd.toISOString());
      const visitorsLastWeek = new Set(lastWeekViews.map(p => p.session_id)).size;

      // Split into current week (last 7 days) and previous week
      const currentWeek = pageviews.filter(p => p.created_at >= sevenDaysAgo);
      const prevWeek = pageviews.filter(p => p.created_at < sevenDaysAgo);

      const calcMetrics = (views: typeof pageviews) => {
        const sessions: Record<string, { paths: string[]; times: number[] }> = {};
        views.forEach(p => {
          if (!sessions[p.session_id]) sessions[p.session_id] = { paths: [], times: [] };
          sessions[p.session_id].paths.push(p.path);
          sessions[p.session_id].times.push(new Date(p.created_at).getTime());
        });

        const sessionList = Object.values(sessions);
        const totalSessions = sessionList.length;
        if (totalSessions === 0) return { bounceRate: 0, avgDuration: 0, pagesPerSession: 0 };

        const bounces = sessionList.filter(s => s.paths.length === 1).length;
        const bounceRate = Math.round((bounces / totalSessions) * 1000) / 10;

        const totalPages = sessionList.reduce((sum, s) => sum + s.paths.length, 0);
        const pagesPerSession = Math.round((totalPages / totalSessions) * 10) / 10;

        const durations = sessionList
          .filter(s => s.times.length > 1)
          .map(s => (Math.max(...s.times) - Math.min(...s.times)) / 1000);
        const avgDuration = durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;

        return { bounceRate, avgDuration, pagesPerSession };
      };

      const current = calcMetrics(currentWeek);
      const prev = calcMetrics(prevWeek);

      // Daily traffic for chart (last 7 days)
      const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dailyTraffic: { label: string; value: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
        const count = currentWeek.filter(p => p.created_at >= dayStart && p.created_at < dayEnd).length;
        dailyTraffic.push({ label: dayLabels[d.getDay()], value: count });
      }

      setData({
        visitorsToday,
        visitorsLastWeek,
        bounceRate: current.bounceRate,
        bounceRatePrev: prev.bounceRate,
        avgSessionDuration: current.avgDuration,
        avgSessionDurationPrev: prev.avgDuration,
        pagesPerSession: current.pagesPerSession,
        pagesPerSessionPrev: prev.pagesPerSession,
        dailyTraffic,
        loading: false,
      });
    };

    fetchKPIs();
  }, [clinicId]);

  return data;
}
