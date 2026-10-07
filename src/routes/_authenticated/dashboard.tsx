import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BarChart3, Calendar, Check, ExternalLink, Github, Link2, Mail, Send, ShieldCheck, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { syncGithub, verifyProof } from "@/lib/builder.functions";
import {
  PROFILE_COLS, PROOF_LABELS, PROOF_TYPES, applicantRank, contactLauncher, matchScore, pitchQuality,
  type Launcher, type Project, type Proof,
} from "@/lib/slyk";

const TABS = ["projects", "inbox", "pitches", "profile"] as const;

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: z.object({ tab: z.enum(TABS).optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Dashboard — Slyk" },
      { name: "description", content: "Manage your Slyk projects, inbound pitches and builder profile." },
      { property: "og:title", content: "Dashboard — Slyk" },
      { property: "og:description", content: "Manage your Slyk projects, inbound pitches and builder profile." },
    ],
  }),
  component: Dashboard,
});

type Status = "pending" | "accepted" | "declined";
type Applicant = { id: string; full_name: string | null; primary_link: string | null; skills: string[]; reputation_score: number; verification_status: string; github_handle: string | null };
type Req = {
  id: string; created_at: string; project_id: string; applicant_id: string;
  role_offered: string; pitch_sentence: string; status: Status;
  applicant?: Applicant | undefined; project?: Project | undefined; rank: number; quality: number; match: number;
};
type Handshake = { request_id: string; project_title: string; owner_name: string; owner_contact: string; applicant_name: string; applicant_contact: string };

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { tab = "inbox" } = Route.useSearch();
  const navigate = useNavigate({ from: "/dashboard" });

  const projects = useQuery({
    queryKey: ["my-projects", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const inbound = useQuery({
    queryKey: ["inbound", user.id],
    enabled: !!projects.data,
    queryFn: async (): Promise<Req[]> => {
      const list = projects.data!;
      if (!list.length) return [];
      const { data, error } = await supabase.from("connect_requests").select("*").in("project_id", list.map((p) => p.id)).order("created_at", { ascending: false });
      if (error) throw error;
      const { data: profs } = await supabase.from("profiles").select(PROFILE_COLS).in("id", [...new Set(data.map((r) => r.applicant_id))]);
      const byId = new Map((profs ?? []).map((p) => [p.id, p as unknown as Applicant]));
      const projById = new Map(list.map((p) => [p.id, p]));
      return data
        .map((r) => {
          const applicant = byId.get(r.applicant_id);
          const project = projById.get(r.project_id);
          const match = project ? matchScore(applicant?.skills ?? [], project) ?? 0 : 0;
          const quality = project ? pitchQuality(r.pitch_sentence, project, !!applicant?.primary_link) : 0;
          return { ...r, applicant, project, match, quality, rank: applicantRank(match, applicant?.reputation_score ?? 100, quality) };
        })
        .sort((a, b) => b.rank - a.rank);
    },
  });

  const pending = inbound.data?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Slyk Dashboard</h1>
        <Button asChild variant="outline" size="sm"><Link to="/analytics"><BarChart3 /> Analytics</Link></Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as (typeof TABS)[number] }, replace: true })} className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="inbox">Inbound {pending > 0 && <Badge className="ml-1.5 h-5 px-1.5">{pending}</Badge>}</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="pitches">My Pitches</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-4">
          <Inbox userId={user.id} loading={inbound.isLoading || projects.isLoading} reqs={inbound.data ?? []} hasProjects={!!projects.data?.length} />
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          {projects.isLoading ? <p className="text-muted-foreground">Loading…</p> : !projects.data?.length ? (
            <Empty text="You haven't posted a project yet." cta />
          ) : (
            <div className="space-y-4">{projects.data.map((p) => <ProjectPanel key={p.id} p={p} />)}</div>
          )}
        </TabsContent>
        <TabsContent value="pitches" className="mt-4"><MyPitches userId={user.id} /></TabsContent>
        <TabsContent value="profile" className="mt-4"><ProfileForm userId={user.id} /></TabsContent>
      </Tabs>
    </main>
  );
}

function Empty({ text, cta }: { text: string; cta?: boolean }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
      <p>{text}</p>
      {cta && <Button asChild className="mt-4"><Link to="/projects/new">Post a Project</Link></Button>}
    </div>
  );
}

const LAUNCH_ICON = { email: Mail, telegram: Send, calendly: Calendar, link: Link2 } as const;
function LauncherButton({ l }: { l: Launcher }) {
  const Icon = LAUNCH_ICON[l.kind];
  return <Button asChild size="sm" variant="outline"><a href={l.href} target="_blank" rel="noreferrer"><Icon /> {l.label}</a></Button>;
}

/* ---------------- Inbox ---------------- */
const FILTERS: { key: Status; label: string }[] = [
  { key: "pending", label: "Pending" }, { key: "accepted", label: "Accepted" }, { key: "declined", label: "Archived" },
];

function Inbox({ userId, loading, reqs, hasProjects }: { userId: string; loading: boolean; reqs: Req[]; hasProjects: boolean }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status>("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const key = ["inbound", userId];

  const decide = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: "accepted" | "declined" }) => {
      const handshakes: Handshake[] = [];
      for (const id of ids) {
        if (status === "accepted") {
          const { data, error } = await supabase.rpc("accept_connect", { _request_id: id });
          if (error) throw error;
          if (data?.[0]) handshakes.push(data[0] as Handshake);
        } else {
          const { error } = await supabase.from("connect_requests").update({ status }).eq("id", id);
          if (error) throw error;
        }
      }
      return handshakes;
    },
    // Optimistic: flip status locally before the server answers
    onMutate: async ({ ids, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Req[]>(key);
      qc.setQueryData<Req[]>(key, (old = []) => old.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
      setSelected(new Set());
      return { prev };
    },
    onError: (e: Error, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); toast.error(e.message); },
    onSuccess: (hs) => { for (const h of hs) qc.setQueryData(["handshake", h.request_id], h); },
  });

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!hasProjects) return <Empty text="Post a project to start receiving pitches." cta />;

  const list = reqs.filter((r) => r.status === filter);
  const allSel = list.length > 0 && list.every((r) => selected.has(r.id));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-md border p-1">
          {FILTERS.map((f) => (
            <Button key={f.key} size="sm" variant={filter === f.key ? "secondary" : "ghost"} onClick={() => { setFilter(f.key); setSelected(new Set()); }}>
              {f.label} <span className="font-mono text-xs text-muted-foreground">{reqs.filter((r) => r.status === f.key).length}</span>
            </Button>
          ))}
        </div>
        {filter === "pending" && selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" onClick={() => decide.mutate({ ids: [...selected], status: "accepted" })}><Check /> Accept</Button>
            <Button size="sm" variant="outline" onClick={() => decide.mutate({ ids: [...selected], status: "declined" })}><X /> Decline</Button>
          </div>
        )}
      </div>
      {list.length === 0 ? <Empty text={`No ${FILTERS.find((f) => f.key === filter)!.label.toLowerCase()} pitches.`} /> : (
        <div className="divide-y rounded-lg border">
          {filter === "pending" && (
            <label className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground">
              <Checkbox checked={allSel} onCheckedChange={(c) => setSelected(c ? new Set(list.map((r) => r.id)) : new Set())} />
              Select all · ranked by match + reputation + pitch quality
            </label>
          )}
          {list.map((r) => (
            <div key={r.id} className="grid gap-3 p-4 md:grid-cols-[auto_1fr_auto] md:items-start">
              {filter === "pending" ? <Checkbox className="mt-1" checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} aria-label="Select pitch" /> : <span />}
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.applicant?.full_name ?? "Builder"}</span>
                  {r.applicant?.verification_status === "top_builder" && <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Top Builder</Badge>}
                  {r.applicant?.verification_status === "github_verified" && <Badge variant="outline" className="gap-1"><Github className="h-3 w-3" /> GitHub linked</Badge>}
                  <Badge variant="secondary">{r.role_offered}</Badge>
                  <span className="text-xs text-muted-foreground">→ {r.project?.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">“{r.pitch_sentence}”</p>
                <div className="flex flex-wrap gap-3 font-mono text-[11px] text-muted-foreground">
                  <span className="text-primary">rank {r.rank}</span>
                  <span>match {r.match}%</span><span>rep {r.applicant?.reputation_score ?? 100}</span><span>quality {r.quality}</span>
                  {r.applicant?.primary_link && (
                    <a href={r.applicant.primary_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      {r.applicant.primary_link.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {r.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => decide.mutate({ ids: [r.id], status: "accepted" })}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => decide.mutate({ ids: [r.id], status: "declined" })}>Decline</Button>
                  </>
                )}
                {r.status === "declined" && <Badge variant="outline" className="text-muted-foreground">Archived</Badge>}
                {r.status === "accepted" && <HandshakeCard requestId={r.id} side="owner" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HandshakeCard({ requestId, side }: { requestId: string; side: "owner" | "applicant" }) {
  const hs = useQuery({
    queryKey: ["handshake", requestId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_handshake", { _request_id: requestId });
      if (error) throw error;
      return (data?.[0] ?? null) as Handshake | null;
    },
    retry: 2,
  });
  if (hs.isLoading) return <span className="font-mono text-xs text-muted-foreground">sharing contacts…</span>;
  const h = hs.data;
  if (!h) return <Badge variant="outline">Accepted</Badge>;
  const name = side === "owner" ? h.applicant_name : h.owner_name;
  const contact = side === "owner" ? h.applicant_contact : h.owner_contact;
  const launcher = contactLauncher(contact, name ?? "there", h.project_title);
  return (
    <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm">
      <div className="flex items-center gap-1 text-xs font-medium text-success"><Check className="h-3 w-3" /> Contact Details Shared</div>
      <div className="mt-0.5 font-mono text-xs">{contact || "No contact provided yet"}</div>
      {launcher && <div className="mt-2"><LauncherButton l={launcher} /></div>}
    </div>
  );
}

/* ---------------- Outbound pitches ---------------- */
function MyPitches({ userId }: { userId: string }) {
  const q = useQuery({
    queryKey: ["outbound", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("connect_requests").select("id, project_id, role_offered, pitch_sentence, status, created_at").eq("applicant_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      const { data: projs } = await supabase.from("projects").select("id, title").in("id", data.map((r) => r.project_id));
      const t = new Map((projs ?? []).map((p) => [p.id, p.title]));
      return data.map((r) => ({ ...r, title: t.get(r.project_id) ?? "Project" }));
    },
  });
  if (q.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!q.data?.length) return <Empty text="You haven't pitched any projects yet." />;
  return (
    <div className="divide-y rounded-lg border">
      {q.data.map((r) => (
        <div key={r.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <Link to="/p/$id" params={{ id: r.project_id }} className="font-medium hover:underline">{r.title}</Link>
            <p className="text-sm text-muted-foreground">{r.role_offered} · “{r.pitch_sentence}”</p>
          </div>
          {r.status === "accepted" ? <HandshakeCard requestId={r.id} side="applicant" /> :
            <Badge variant="outline" className={r.status === "declined" ? "text-muted-foreground" : ""}>{r.status === "declined" ? "Declined" : "Pending"}</Badge>}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Project panel: proofs + recommended builders ---------------- */
function ProjectPanel({ p }: { p: Project }) {
  const qc = useQueryClient();
  const verify = useServerFn(verifyProof);
  const [type, setType] = useState<string>("github_repo");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const proofsKey = ["proofs"];
  const proofs = useQuery({
    queryKey: ["proofs-of", p.id],
    queryFn: async () => (await supabase.from("project_proofs").select("*").eq("project_id", p.id).order("created_at")).data as Proof[],
  });
  const recs = useQuery({
    queryKey: ["recs", p.id],
    queryFn: async () => (await supabase.rpc("recommend_builders", { _project_id: p.id })).data ?? [],
  });

  async function addProof(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().url().startsWith("https://").max(500).safeParse(url.trim());
    if (!parsed.success) { toast.error("Use a full https:// link"); return; }
    const { data, error } = await supabase.from("project_proofs")
      .insert({ project_id: p.id, proof_type: type as Proof["proof_type"], url: parsed.data, label: label.trim().slice(0, 80) || PROOF_LABELS[type]! })
      .select().single();
    if (error) { toast.error(error.message); return; }
    setUrl(""); setLabel("");
    qc.invalidateQueries({ queryKey: ["proofs-of", p.id] });
    try {
      const r = await verify({ data: { proofId: data.id } });
      toast[r.verified ? "success" : "warning"](r.verified ? "Proof verified" : "Added, but the link couldn't be verified");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Verification failed"); }
    qc.invalidateQueries({ queryKey: ["proofs-of", p.id] });
    qc.invalidateQueries({ queryKey: proofsKey });
  }

  async function removeProof(id: string) {
    qc.setQueryData<Proof[]>(["proofs-of", p.id], (old = []) => old.filter((x) => x.id !== id));
    await supabase.from("project_proofs").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: proofsKey });
  }

  return (
    <section className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <Link to="/p/$id" params={{ id: p.id }} className="font-medium hover:underline">{p.title}</Link>
          <div className="truncate text-sm text-muted-foreground">Looking for {p.looking_for}</div>
        </div>
        <div className="flex gap-1.5"><Badge variant="secondary">{p.category}</Badge><Badge variant="outline">{p.stage}</Badge></div>
      </div>
      <div className="grid gap-6 p-4 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Proofs</h3>
          {proofs.data?.map((x) => (
            <div key={x.id} className="flex items-center gap-2 text-sm">
              {x.verified ? <ShieldCheck className="h-4 w-4 text-success" /> : <span className="h-4 w-4 rounded-full border" />}
              <a href={x.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:underline">{x.label}</a>
              <span className="font-mono text-[11px] text-muted-foreground">{PROOF_LABELS[x.proof_type]}</span>
              <button onClick={() => removeProof(x.id)} aria-label="Remove proof" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <form onSubmit={addProof} className="grid gap-2 sm:grid-cols-[8rem_1fr]">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROOF_TYPES.map((t) => <SelectItem key={t} value={t}>{PROOF_LABELS[t]}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="https://github.com/org/repo" value={url} onChange={(e) => setUrl(e.target.value)} required />
            <Input placeholder="Label (optional)" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} className="sm:col-span-1" />
            <Button type="submit" size="sm" variant="outline">Add & verify</Button>
          </form>
        </div>
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Recommended builders</h3>
          {recs.isLoading ? <p className="text-sm text-muted-foreground">Finding matches…</p> : !recs.data?.length ? (
            <p className="text-sm text-muted-foreground">No builders with matching skills yet.</p>
          ) : recs.data.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-medium">
                  {b.full_name ?? "Builder"}
                  {b.verification_status === "top_builder" && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="truncate font-mono text-[11px] text-muted-foreground">{b.skills.join(" · ")}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">rep {b.reputation_score}</span>
                {b.primary_link && <Button asChild size="sm" variant="ghost"><a href={b.primary_link} target="_blank" rel="noreferrer"><ExternalLink /></a></Button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Profile ---------------- */
type ProfileDraft = { full_name: string; primary_link: string; direct_contact: string; skills: string };

function ProfileForm({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const sync = useServerFn(syncGithub);
  const [gh, setGh] = useState("");
  const [syncing, setSyncing] = useState(false);
  const q = useQuery({
    queryKey: ["me", userId],
    queryFn: async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle(),
        supabase.rpc("get_my_contact"),
      ]);
      return { profile: p, draft: { full_name: p?.full_name ?? "", primary_link: p?.primary_link ?? "", direct_contact: (c as string | null) ?? "", skills: (p?.skills ?? []).join(", ") } };
    },
  });
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const v = draft ?? q.data?.draft;
  if (!v) return <p className="text-muted-foreground">Loading…</p>;
  const prof = q.data?.profile;
  const stats = prof?.github_stats as { public_repos?: number; total_stars?: number; primary_languages?: string[]; active_days_30d?: number } | null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const schema = z.object({
      full_name: z.string().trim().max(80),
      primary_link: z.union([z.literal(""), z.string().trim().url().startsWith("https://").max(300)]),
      direct_contact: z.string().trim().max(200),
      skills: z.array(z.string().trim().min(1).max(30)).max(20),
    });
    const parsed = schema.safeParse({ ...v, skills: v!.skills.split(",").map((s) => s.trim()).filter(Boolean) });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["me", userId] });
    qc.invalidateQueries({ queryKey: ["me-public", userId] });
  }

  async function doSync(e: React.FormEvent) {
    e.preventDefault();
    setSyncing(true);
    try {
      await sync({ data: { handle: gh || prof?.github_handle || "" } });
      toast.success("GitHub synced");
      qc.invalidateQueries({ queryKey: ["me", userId] });
      qc.invalidateQueries({ queryKey: ["me-public", userId] });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Sync failed"); }
    setSyncing(false);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={save} className="space-y-4 rounded-lg border bg-card p-5">
        <div className="space-y-1.5"><Label htmlFor="fn">Full name</Label><Input id="fn" value={v.full_name} onChange={(e) => setDraft({ ...v, full_name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="pl">Primary link</Label><Input id="pl" type="url" placeholder="https://github.com/you" value={v.primary_link} onChange={(e) => setDraft({ ...v, primary_link: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label htmlFor="sk">Skills</Label>
          <Input id="sk" placeholder="PyTorch, Next.js, FastAPI" value={v.skills} onChange={(e) => setDraft({ ...v, skills: e.target.value })} />
          <p className="text-xs text-muted-foreground">Comma-separated. Powers your match scores on the feed.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dc">Direct contact</Label>
          <Input id="dc" placeholder="Email, @telegram or Calendly link" value={v.direct_contact} onChange={(e) => setDraft({ ...v, direct_contact: e.target.value })} />
          <p className="text-xs text-muted-foreground">Hidden until a pitch is accepted, then shared both ways.</p>
        </div>
        <Button type="submit">Save profile</Button>
      </form>
      <form onSubmit={doSync} className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Builder proof</h3>
          <Badge variant={prof?.verification_status === "top_builder" ? "default" : "outline"}>
            {prof?.verification_status === "top_builder" ? "Top Builder" : prof?.verification_status === "github_verified" ? "GitHub linked" : "Unverified"}
          </Badge>
        </div>
        <div className="font-mono text-3xl font-semibold">{prof?.reputation_score ?? 100}<span className="ml-2 text-xs font-normal text-muted-foreground">reputation</span></div>
        {stats && (
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="rounded border p-2"><div className="text-muted-foreground">repos</div>{stats.public_repos ?? 0}</div>
            <div className="rounded border p-2"><div className="text-muted-foreground">stars</div>{stats.total_stars ?? 0}</div>
            <div className="rounded border p-2"><div className="text-muted-foreground">active days/30</div>{stats.active_days_30d ?? "—"}</div>
            {!!stats.primary_languages?.length && <div className="col-span-3 text-muted-foreground">{stats.primary_languages.join(" · ")}</div>}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="gh">GitHub username</Label>
          <Input id="gh" placeholder={prof?.github_handle ?? "octocat"} value={gh} onChange={(e) => setGh(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={syncing || (!gh && !prof?.github_handle)}><Github /> {syncing ? "Syncing…" : prof?.github_handle ? "Re-sync GitHub" : "Link GitHub"}</Button>
        <p className="text-xs text-muted-foreground">Reputation grows with public repos, stars and accepted pitches.</p>
      </form>
    </div>
  );
}
