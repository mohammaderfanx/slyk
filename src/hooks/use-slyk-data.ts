import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PROFILE_COLS, type Project } from "@/lib/slyk";

export const projectsOptions = queryOptions({
  queryKey: ["projects"],
  queryFn: async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as Project[];
  },
  staleTime: 30_000,
});

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["me-public", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select(PROFILE_COLS).eq("id", userId!).maybeSingle();
      return data;
    },
  });
}

/** Project ids the user has already pitched (for optimistic "Sent" state). */
export function useMySentIds(userId: string | undefined) {
  return useQuery({
    queryKey: ["sent", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("connect_requests").select("project_id").eq("applicant_id", userId!);
      return (data ?? []).map((r) => r.project_id);
    },
  });
}

export const proofsOptions = queryOptions({
  queryKey: ["proofs"],
  queryFn: async () => {
    const { data, error } = await supabase.from("project_proofs").select("*").order("created_at");
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

const SEEN_KEY = "slyk-seen";
/** Records feed impressions once per browser session per project. */
export function trackImpressions(ids: string[]) {
  if (typeof window === "undefined" || !ids.length) return;
  const seen = new Set<string>(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]"));
  const fresh = ids.filter((id) => !seen.has(id));
  if (!fresh.length) return;
  fresh.forEach((id) => seen.add(id));
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  void supabase.rpc("track_project_events", { _project_ids: fresh, _type: "impression" });
}
export function trackEvent(id: string, type: "click" | "reveal") {
  void supabase.rpc("track_project_events", { _project_ids: [id], _type: type });
}
