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

import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { refreshMyEmbeddings } from "@/lib/matching.functions";
import { simToPct } from "@/lib/slyk";

/** project_id -> semantic match % for the signed-in builder. */
export function useSemanticScores(userId: string | undefined) {
  return useQuery({
    queryKey: ["semantic", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("my_semantic_scores");
      return new Map((data ?? []).map((r) => [r.project_id, simToPct(r.similarity)]));
    },
  });
}

/** Returns a function that refreshes AI match data, then refetches scores. */
export function useRefreshEmbeddings() {
  const fn = useServerFn(refreshMyEmbeddings);
  const qc = useQueryClient();
  return async () => {
    try {
      const r = await fn();
      if (r.updated) {
        qc.invalidateQueries({ queryKey: ["semantic"] });
        qc.invalidateQueries({ queryKey: ["inbound"] });
        qc.invalidateQueries({ queryKey: ["recs"] });
      }
    } catch (e) {
      console.warn("AI matching refresh skipped:", e instanceof Error ? e.message : e);
    }
  };
}

const REFRESHED_KEY = "slyk-emb-refreshed";
/** Once per browser session for a signed-in user. */
export function useEmbeddingsOnSignIn(userId: string | undefined) {
  const refresh = useRefreshEmbeddings();
  useEffect(() => {
    if (!userId || sessionStorage.getItem(REFRESHED_KEY) === userId) return;
    sessionStorage.setItem(REFRESHED_KEY, userId);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
