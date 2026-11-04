import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Check, LayoutGrid, Rows3, Search, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ConnectDialog } from "@/components/ConnectDialog";
import { useAuth } from "@/hooks/use-auth";
import { projectsOptions, proofsOptions, trackImpressions, useMyProfile, useMySentIds, useSemanticScores } from "@/hooks/use-slyk-data";
import { CATEGORIES, INCENTIVES, SORTS, STAGES, filterProjects, matchScore, sortProjects, trustBadges, type Project } from "@/lib/slyk";
import { useEcosystemActivity } from "@/hooks/use-ecosystem-activity";

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  category: z.string().optional().catch(undefined),
  stage: z.string().optional().catch(undefined),
  incentive: z.string().optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
  view: z.enum(["grid", "terminal"]).optional().catch(undefined),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Slyk — Zero-noise collaboration for tech builders" },
      { name: "description", content: "Find AI/ML engineers, developers and co-founders for your tech project. Browse projects and connect in one click." },
      { property: "og:title", content: "Slyk — Zero-noise collaboration for tech builders" },
      { property: "og:description", content: "Find AI/ML engineers, developers and co-founders for your tech project." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsOptions),
  errorComponent: ({ error }) => <p className="p-8 text-center text-muted-foreground">Couldn't load projects: {error instanceof Error ? error.message : "Unknown error"}</p>,
  notFoundComponent: () => <p className="p-8 text-center">Not found</p>,
  component: Explore,
});

function FilterSelect({ value, onChange, label, items }: { value: string; onChange: (v: string) => void; label: string; items: readonly string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full lg:w-36"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
        {items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function Explore() {
  const { data } = useSuspenseQuery(projectsOptions);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const { user } = useAuth();
  const me = useMyProfile(user?.id);
  const activity = useEcosystemActivity(user?.id);
  const sent = useMySentIds(user?.id);
  const skills = me.data?.skills ?? [];
  const semantic = useSemanticScores(user?.id);
  const scoreOf = (p: Project) => semantic.data?.get(p.id) ?? matchScore(skills, p);
  const [active, setActive] = useState<Project | null>(null);

  const q = search.q ?? "";
  const category = search.category ?? "all";
  const stage = search.stage ?? "all";
  const incentive = search.incentive ?? "all";
  const sort = search.sort ?? "recent";
  const view = search.view ?? "grid";

  const set = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({
      search: (prev) => {
        const next: Record<string, string | undefined> = { ...prev, ...patch };
        for (const k of Object.keys(next)) if (!next[k] || next[k] === "all") delete next[k];
        return next;
      },
      replace: true,
    });

  const list = useMemo(
    () => sortProjects(filterProjects(data, { q, category, stage, incentive }), sort, skills, semantic.data),
    [data, q, category, stage, incentive, sort, skills, semantic.data],
  );
  const sentSet = new Set(sent.data ?? []);
  const proofs = useQuery(proofsOptions);
  const badgesFor = (id: string) => trustBadges((proofs.data ?? []).filter((x) => x.project_id === id));
  const listKey = list.map((p) => p.id).join(",");
  useEffect(() => { trackImpressions(listKey ? listKey.split(",") : []); }, [listKey]);

  return (
    <main>
      <section className="relative border-b">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-10">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">{data.length} open projects</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Slyk — Zero-noise collaboration<br className="hidden sm:block" /> for tech builders.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            One-sentence pitches. One-click connects. Contact details shared only on accept.
            <span className="ml-2 hidden font-mono text-xs sm:inline"><kbd className="rounded border px-1">⌘K</kbd> to jump</span>
          </p>
        </div>
      </section>

      <div className="sticky top-14 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Fuzzy search titles, roles, stack…" value={q} onChange={(e) => set({ q: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
            <FilterSelect label="Category" value={category} onChange={(v) => set({ category: v })} items={CATEGORIES} />
            <FilterSelect label="Stage" value={stage} onChange={(v) => set({ stage: v })} items={STAGES} />
            <FilterSelect label="Incentive" value={incentive} onChange={(v) => set({ incentive: v })} items={INCENTIVES} />
            <Select value={sort} onValueChange={(v) => set({ sort: v as typeof sort })}>
              <SelectTrigger className="w-full lg:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="match" disabled={!skills.length && !semantic.data?.size}>Highest Match{!skills.length && " (add skills)"}</SelectItem>
                <SelectItem value="comp">Compensation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => v && set({ view: v as typeof view })}>
            <ToggleGroupItem value="grid" aria-label="Standard grid"><LayoutGrid /></ToggleGroupItem>
            <ToggleGroupItem value="terminal" aria-label="Compact terminal view"><Rows3 /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
          {user && <span className="text-success">{activity.active} active builder sessions</span>}
          {activity.accepted.map(e=><span key={e.id}>Accepted connection · {data.find(p=>p.id===e.project_id)?.title??"Project"}</span>)}
        </div>
        {list.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No projects match these filters.</p>
        ) : view === "grid" ? (
          <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => <ProjectCard key={p.id} p={p} badges={[...badgesFor(p.id),...((activity.counts.get(p.id)??0)>=5?["Trending Pitch Target"]:[])]} score={scoreOf(p)} sent={sentSet.has(p.id)} onConnect={() => setActive(p)} />)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border font-mono text-xs">
            <div className="hidden grid-cols-[3rem_1.4fr_1fr_0.8fr_0.8fr_1.4fr_5.5rem] gap-3 border-b bg-muted/40 px-3 py-2 uppercase tracking-wider text-muted-foreground md:grid">
              <span>Match</span><span>Project</span><span>Role</span><span>Stage</span><span>Incentive</span><span>Stack</span><span />
            </div>
            {list.map((p) => <TerminalRow key={p.id} p={p} score={scoreOf(p)} sent={sentSet.has(p.id)} onConnect={() => setActive(p)} />)}
          </div>
        )}
      </div>
      <ConnectDialog project={active} onClose={() => setActive(null)} />
    </main>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const tone = score >= 60 ? "border-primary/50 text-primary" : score >= 30 ? "text-foreground" : "text-muted-foreground";
  return <Badge variant="outline" className={`font-mono ${tone}`}>{score}% match</Badge>;
}

function ConnectButton({ sent, onConnect }: { sent: boolean; onConnect: () => void }) {
  return sent ? (
    <Button size="sm" variant="outline" disabled><Check /> Sent</Button>
  ) : (
    <Button size="sm" onClick={onConnect}>Connect</Button>
  );
}

function ProjectCard({ p, badges, score, sent, onConnect }: { p: Project; badges: string[]; score: number | null; sent: boolean; onConnect: () => void }) {
  return (
    <article className="flex flex-col gap-3 bg-card p-5 transition-colors hover:bg-accent/40">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{p.entity_type}</Badge>
        {p.is_demo&&<Badge variant="outline">Sample listing</Badge>}
        <Badge variant="secondary">{p.category}</Badge>
        <Badge variant="outline" className={p.stage === "Live Revenue" || p.stage === "Funded" ? "border-success/40 text-success" : ""}>{p.stage}</Badge>
        <span className="ml-auto"><ScoreBadge score={score} /></span>
      </div>
      <div>
        <h2 className="font-semibold tracking-tight"><Link to="/p/$id" params={{ id: p.id }} className="hover:underline">{p.title}</Link></h2>
        {badges.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">{badges.map((b) => <span key={b} className="inline-flex items-center gap-1 font-mono text-[11px] text-success"><ShieldCheck className="h-3 w-3" />{b}</span>)}</div>
        )}
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.tagline}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {p.tech_stack.map((t) => (
          <span key={t} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{t}</span>
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
        <div className="min-w-0 text-xs">
          <div className="text-muted-foreground">Looking for · {p.incentive}</div>
          <div className="truncate font-medium">{p.looking_for}</div>
        </div>
        <ConnectButton sent={sent} onConnect={onConnect} />
      </div>
    </article>
  );
}

function TerminalRow({ p, score, sent, onConnect }: { p: Project; score: number | null; sent: boolean; onConnect: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b px-3 py-2 last:border-b-0 hover:bg-accent/40 md:grid-cols-[3rem_1.4fr_1fr_0.8fr_0.8fr_1.4fr_5.5rem] md:items-center md:gap-3">
      <span className={score !== null && score >= 60 ? "text-primary" : "text-muted-foreground"}>{score === null ? "—" : `${score}%`}</span>
      <span className="truncate font-sans text-sm font-medium" title={p.tagline}><Link to="/p/$id" params={{ id: p.id }} className="hover:underline">{p.title}</Link> <span className="text-muted-foreground">· {p.category}</span></span>
      <span className="truncate">{p.looking_for}</span>
      <span className="truncate text-muted-foreground">{p.stage}</span>
      <span className="truncate text-muted-foreground">{p.incentive}</span>
      <span className="truncate text-muted-foreground">{p.tech_stack.join(" · ")}</span>
      <span className="md:text-right"><ConnectButton sent={sent} onConnect={onConnect} /></span>
    </div>
  );
}
