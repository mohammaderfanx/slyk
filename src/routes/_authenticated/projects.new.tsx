import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshEmbeddings } from "@/hooks/use-slyk-data";
import { CATEGORIES, ENTITIES, INCENTIVES, STAGES } from "@/lib/slyk";

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Post a Project — Slyk" },
      { name: "description", content: "Post your tech project on Slyk and find engineers and co-founders." },
      { property: "og:title", content: "Post a Project — Slyk" },
      { property: "og:description", content: "Post your tech project on Slyk and find engineers and co-founders." },
    ],
  }),
  component: NewProject,
});

function Pick({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: readonly string[] }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function NewProject() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const refreshAi = useRefreshEmbeddings();
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [stage, setStage] = useState<string>(STAGES[0]);
  const [entity, setEntity] = useState<string>(ENTITIES[0]);
  const [incentive, setIncentive] = useState<string>(INCENTIVES[0]);
  const [lookingFor, setLookingFor] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function addTag() {
    const t = tag.trim().replace(/,$/, "");
    if (t && !tags.includes(t) && tags.length < 10) setTags([...tags, t]);
    setTag("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("projects").insert({
      user_id: user.id, title: title.trim(), tagline: tagline.trim(),
      category: category as never, stage: stage as never, entity_type: entity as never, incentive: incentive as never,
      looking_for: lookingFor.trim(), tech_stack: tags,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Project posted");
    void refreshAi();
    await qc.invalidateQueries({ queryKey: ["projects"] });
    navigate({ to: "/dashboard" });
  }

  const card = "space-y-4 rounded-lg border bg-card p-5";
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Post a Project</h1>
      <p className="mt-1 text-sm text-muted-foreground">Keep it tight. Builders skim.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <section className={card}>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">01 · Pitch</h2>
          <div className="space-y-1.5"><Label htmlFor="t">Title</Label><Input id="t" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5">
            <div className="flex justify-between"><Label htmlFor="tg">Tagline</Label><span className="font-mono text-xs text-muted-foreground">{tagline.length}/280</span></div>
            <Textarea id="tg" required maxLength={280} rows={3} value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>
        </section>
        <section className={card}>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">02 · Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Pick label="Category" value={category} onChange={setCategory} items={CATEGORIES} />
            <Pick label="Stage" value={stage} onChange={setStage} items={STAGES} />
            <Pick label="You are" value={entity} onChange={setEntity} items={ENTITIES} />
            <Pick label="Incentive" value={incentive} onChange={setIncentive} items={INCENTIVES} />
          </div>
        </section>
        <section className={card}>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">03 · Who you need</h2>
          <div className="space-y-1.5"><Label htmlFor="lf">Looking for</Label><Input id="lf" required maxLength={80} placeholder="Fullstack Co-Founder" value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="tag">Tech stack</Label>
            <Input id="tag" placeholder="Type and press Enter" value={tag} onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} />
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-xs">
                  {t}<button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </section>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Posting…" : "Publish project"}</Button>
      </form>
    </main>
  );
}
