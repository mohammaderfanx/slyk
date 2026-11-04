import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Analytics — Slyk" },
      { name: "description", content: "Conversion funnel and response times for your Slyk projects." },
      { property: "og:title", content: "Analytics — Slyk" },
      { property: "og:description", content: "Conversion funnel and response times for your Slyk projects." },
    ],
  }),
  component: Analytics,
});

type Row = { project_id: string; title: string; view_count: number; click_count: number; pitch_count: number; accepted_count: number; avg_ttfr_hours: number | null };

function Analytics() {
  const q = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("match_analytics").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });
  const rows = q.data ?? [];
  const sum = (k: keyof Row) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const totals = { views: sum("view_count"), clicks: sum("click_count"), pitches: sum("pitch_count"), accepted: sum("accepted_count") };
  const ttfrs = rows.map((r) => r.avg_ttfr_hours).filter((x): x is number => x != null);
  const ttfr = ttfrs.length ? ttfrs.reduce((a, b) => a + b, 0) / ttfrs.length : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Analytics</h1>
      {q.isLoading ? <p className="mt-6 text-muted-foreground">Loading…</p> : !rows.length ? (
        <p className="mt-6 rounded-lg border border-dashed p-10 text-center text-muted-foreground">Post a project to start collecting data.</p>
      ) : (
        <>
          <Funnel steps={[["Impressions", totals.views], ["Page opens", totals.clicks], ["Pitches", totals.pitches], ["Accepted", totals.accepted]]} />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Avg. time to first response: {ttfr == null ? "—" : fmtHours(ttfr)}</p>
          <div className="mt-8 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3 text-left">Project</th><th className="p-3 text-right">Views</th><th className="p-3 text-right">Opens</th><th className="p-3 text-right">Pitches</th><th className="p-3 text-right">Accepted</th><th className="p-3 text-right">Conv.</th><th className="p-3 text-right">Response</th></tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.project_id}>
                    <td className="p-3"><Link to="/p/$id" params={{ id: r.project_id }} className="hover:underline">{r.title}</Link></td>
                    <td className="p-3 text-right font-mono">{r.view_count}</td>
                    <td className="p-3 text-right font-mono">{r.click_count}</td>
                    <td className="p-3 text-right font-mono">{r.pitch_count}</td>
                    <td className="p-3 text-right font-mono">{r.accepted_count}</td>
                    <td className="p-3 text-right font-mono">{r.view_count ? `${((r.pitch_count / r.view_count) * 100).toFixed(1)}%` : "—"}</td>
                    <td className="p-3 text-right font-mono">{r.avg_ttfr_hours == null ? "—" : fmtHours(r.avg_ttfr_hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

function fmtHours(h: number) { return h < 1 ? `${Math.round(h * 60)}m` : h < 48 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`; }

function Funnel({ steps }: { steps: [string, number][] }) {
  const max = Math.max(1, steps[0]![1]);
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-4">
      {steps.map(([label, n], i) => {
        const prev = i > 0 ? steps[i - 1]![1] : null;
        return (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 font-mono text-2xl font-semibold">{n}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${(n / max) * 100}%` }} /></div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">{prev ? `${((n / prev) * 100).toFixed(0)}% of previous` : "\u00a0"}</div>
          </div>
        );
      })}
    </div>
  );
}
