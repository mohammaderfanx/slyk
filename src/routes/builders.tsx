import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ExternalLink, Github, Search, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fuzzy } from "@/lib/slyk";

export const Route = createFileRoute("/builders")({
  validateSearch: z.object({ q: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Builders — Slyk" },
      { name: "description", content: "Search AI/ML engineers and developers on Slyk by tech stack and reputation." },
      { property: "og:title", content: "Builders — Slyk" },
      { property: "og:description", content: "Search AI/ML engineers and developers on Slyk by tech stack and reputation." },
    ],
  }),
  component: Builders,
});

function Builders() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/builders" });
  const list = useQuery({
    queryKey: ["builders"],
    queryFn: async () => {
      // Public columns only — direct_contact is never selectable by clients
      const { data, error } = await supabase.from("profiles")
        .select("id, full_name, primary_link, skills, github_handle, verification_status, reputation_score, github_stats")
        .not("skills", "eq", "{}").order("reputation_score", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  const filtered = useMemo(() => {
    const terms = q.trim().split(/\s+/).filter(Boolean);
    return (list.data ?? []).filter((b) => terms.every((t) => [b.full_name ?? "", ...b.skills].some((x) => fuzzy(x, t))));
  }, [list.data, q]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Builders</h1>
      <p className="mt-1 text-sm text-muted-foreground">Ranked by reputation. Contact details are shared only after a pitch is accepted.</p>
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by stack, e.g. PyTorch" value={q} onChange={(e) => navigate({ search: { q: e.target.value || undefined }, replace: true })} />
      </div>
      {list.isLoading ? <p className="mt-6 text-muted-foreground">Loading…</p> : !filtered.length ? (
        <p className="mt-6 rounded-lg border border-dashed p-10 text-center text-muted-foreground">No builders match.</p>
      ) : (
        <div className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
          {filtered.map((b) => {
            const stats = b.github_stats as { total_stars?: number; public_repos?: number } | null;
            return (
              <div key={b.id} className="flex flex-col gap-2 bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{b.full_name ?? "Builder"}</span>
                  {b.verification_status === "top_builder" && <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Top Builder</Badge>}
                  {b.verification_status === "github_verified" && <Badge variant="outline" className="gap-1"><Github className="h-3 w-3" /> GitHub linked</Badge>}
                  <span className="ml-auto font-mono text-xs text-primary">rep {b.reputation_score}</span>
                </div>
                <div className="flex flex-wrap gap-1">{b.skills.map((s) => <span key={s} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{s}</span>)}</div>
                <div className="mt-auto flex items-center justify-between pt-2 font-mono text-[11px] text-muted-foreground">
                  <span>{stats ? `${stats.public_repos ?? 0} repos · ★ ${stats.total_stars ?? 0}` : "No GitHub linked"}</span>
                  {b.primary_link && <Button asChild size="sm" variant="ghost"><a href={b.primary_link} target="_blank" rel="noreferrer"><ExternalLink /> Profile</a></Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
