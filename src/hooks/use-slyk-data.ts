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
