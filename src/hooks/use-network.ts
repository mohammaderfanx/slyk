import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicNetwork } from "@/lib/network.functions";

export const networkOptions = queryOptions({ queryKey: ["public-network"], queryFn: () => getPublicNetwork(), staleTime: 30_000 });
export function useNetworkRealtime(workspaceId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase.channel(`network-${crypto.randomUUID()}`);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "project_bounties" }, () => { void qc.invalidateQueries({ queryKey: ["public-network"] }); });
    if (workspaceId) for (const table of ["workspace_candidates", "workspace_candidate_notes", "scout_candidates", "scout_runs"]) channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `workspace_id=eq.${workspaceId}` }, () => { void qc.invalidateQueries({ queryKey: ["portfolio", workspaceId] }); });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [workspaceId, qc]);
}