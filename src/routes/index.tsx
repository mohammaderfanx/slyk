import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConnectDialog } from "@/components/ConnectDialog";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, INCENTIVES, STAGES, filterProjects, type Project } from "@/lib/slyk";

const projectsOptions = queryOptions({
  queryKey: ["projects"],
  queryFn: async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as Project[];
  },
  staleTime: 30_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Slyk — Zero-noise collaboration for tech builders" },
      { name: "description", content: "Find AI/ML engineers, developers and co-founders for your tech project. Browse projects and connect in one click." },
      { property: "og:title", content: "Slyk — Zero-noise collaboration for tech builders" },
      { property: "og:description", content: "Find AI/ML engineers, developers and co-founders for your tech project." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsOptions),
  errorComponent: ({ error }) => <p className="p-8 text-center text-muted-foreground">Couldn't load projects: {error.message}</p>,
  notFoundComponent: () => <p className="p-8 text-center">Not found</p>,
  component: Explore,
});

function FilterSelect({ value, onChange, label, items }: { value: string; onChange: (v: string) => void; label: string; items: readonly string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
        {items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function Explore() {
  const { data } = useSuspenseQuery(projectsOptions);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [stage, setStage] = useState("all");
  const [incentive, setIncentive] = useState("all");
  const [active, setActive] = useState<Project | null>(null);
  const list = useMemo(() => filterProjects(data, { q, category, stage, incentive }), [data, q, category, stage, incentive]);

  return (
    <main>
      <section className="relative border-b">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">{data.length} open projects</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Slyk — Zero-noise collaboration<br className="hidden sm:block" /> for tech builders.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">One-sentence pitches. One-click connects. Contact details shared only on accept.</p>
        </div>
      </section>

      <div className="sticky top-14 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search titles or tech stack…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <FilterSelect label="Category" value={category} onChange={setCategory} items={CATEGORIES} />
          <FilterSelect label="Stage" value={stage} onChange={setStage} items={STAGES} />
          <FilterSelect label="Incentive" value={incentive} onChange={setIncentive} items={INCENTIVES} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {list.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No projects match these filters.</p>
        ) : (
          <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => <ProjectCard key={p.id} p={p} onConnect={() => setActive(p)} />)}
          </div>
        )}
      </div>
      <ConnectDialog project={active} onClose={() => setActive(null)} />
    </main>
  );
}

function ProjectCard({ p, onConnect }: { p: Project; onConnect: () => void }) {
  return (
    <article className="flex flex-col gap-3 bg-card p-5 transition-colors hover:bg-accent/40">
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">{p.entity_type}</Badge>
        <Badge variant="secondary">{p.category}</Badge>
        <Badge variant="outline" className={p.stage === "Live Revenue" || p.stage === "Funded" ? "border-success/40 text-success" : ""}>{p.stage}</Badge>
      </div>
      <div>
        <h2 className="font-semibold tracking-tight">{p.title}</h2>
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
        <Button size="sm" onClick={onConnect}>Connect</Button>
      </div>
    </article>
  );
}
