import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { PROFILE_COLS, type Project } from "@/lib/slyk";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Slyk" },
      { name: "description", content: "Manage your Slyk projects and inbound connect requests." },
      { property: "og:title", content: "Dashboard — Slyk" },
      { property: "og:description", content: "Manage your Slyk projects and inbound connect requests." },
    ],
  }),
  component: Dashboard,
});

type Req = {
  id: string; created_at: string; project_id: string; applicant_id: string;
  role_offered: string; pitch_sentence: string; status: "pending" | "accepted" | "declined";
  applicant?: { full_name: string | null; primary_link: string | null } | undefined;
  project_title?: string | undefined;
};

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

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
      const ids = projects.data!.map((p) => p.id);
      if (!ids.length) return [];
      const { data, error } = await supabase.from("connect_requests").select("*").in("project_id", ids).order("created_at", { ascending: false });
      if (error) throw error;
      const appIds = [...new Set(data.map((r) => r.applicant_id))];
      const { data: profs } = await supabase.from("profiles").select(PROFILE_COLS).in("id", appIds);
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      const titles = new Map(projects.data!.map((p) => [p.id, p.title]));
      return data.map((r) => ({ ...r, applicant: byId.get(r.applicant_id), project_title: titles.get(r.project_id) }));
    },
  });

  const pending = inbound.data?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Slyk Dashboard</h1>
      <Tabs defaultValue="inbound" className="mt-6">
        <TabsList>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="inbound">Inbound Connects {pending > 0 && <Badge className="ml-1.5 h-5 px-1.5">{pending}</Badge>}</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          {projects.isLoading ? <p className="text-muted-foreground">Loading…</p> : !projects.data?.length ? (
            <Empty text="You haven't posted a project yet." cta />
          ) : (
            <div className="divide-y rounded-lg border">
              {projects.data.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="font-medium">{p.title}</div>
                    <div className="truncate text-sm text-muted-foreground">Looking for {p.looking_for}</div>
                  </div>
                  <div className="flex shrink-0 gap-1.5"><Badge variant="secondary">{p.category}</Badge><Badge variant="outline">{p.stage}</Badge></div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inbound" className="mt-4">
          {inbound.isLoading || projects.isLoading ? <p className="text-muted-foreground">Loading…</p> : !inbound.data?.length ? (
            <Empty text="No connect requests yet." />
          ) : (
            <div className="divide-y rounded-lg border">
              {inbound.data.map((r) => <RequestRow key={r.id} r={r} onDone={() => qc.invalidateQueries({ queryKey: ["inbound", user.id] })} />)}
            </div>
          )}
        </TabsContent>

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

function RequestRow({ r, onDone }: { r: Req; onDone: () => void }) {
  const contact = useQuery({
    queryKey: ["contact", r.id],
    enabled: r.status === "accepted",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_applicant_contact", { _request_id: r.id });
      if (error) throw error;
      return data as string | null;
    },
  });
  const update = useMutation({
    mutationFn: async (status: "accepted" | "declined") => {
      const { error } = await supabase.from("connect_requests").update({ status }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: onDone,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{r.applicant?.full_name ?? "Builder"}</span>
          <Badge variant="secondary">{r.role_offered}</Badge>
          <span className="text-xs text-muted-foreground">→ {r.project_title}</span>
        </div>
        <p className="text-sm text-muted-foreground">“{r.pitch_sentence}”</p>
        {r.applicant?.primary_link && (
          <a href={r.applicant.primary_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">
            {r.applicant.primary_link.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="flex items-center gap-2">
        {r.status === "pending" && (
          <>
            <Button size="sm" disabled={update.isPending} onClick={() => update.mutate("accepted")}>Accept</Button>
            <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate("declined")}>Decline</Button>
          </>
        )}
        {r.status === "declined" && <Badge variant="outline" className="text-muted-foreground">Declined</Badge>}
        {r.status === "accepted" && (
          <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm">
            <div className="flex items-center gap-1 text-xs font-medium text-success"><Check className="h-3 w-3" /> Contact Details Shared</div>
            <div className="mt-0.5 font-mono">{contact.isLoading ? "…" : contact.data || "No contact provided"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileForm({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["me", userId],
    queryFn: async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle(),
        supabase.rpc("get_my_contact"),
      ]);
      return { full_name: p?.full_name ?? "", primary_link: p?.primary_link ?? "", direct_contact: (c as string | null) ?? "" };
    },
  });
  const [draft, setDraft] = useState<{ full_name: string; primary_link: string; direct_contact: string } | null>(null);
  const v = draft ?? q.data;
  if (!v) return <p className="text-muted-foreground">Loading…</p>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update(v!).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["me", userId] });
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-4 rounded-lg border bg-card p-5">
      <div className="space-y-1.5"><Label htmlFor="fn">Full name</Label><Input id="fn" value={v.full_name} onChange={(e) => setDraft({ ...v, full_name: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="pl">Primary link</Label><Input id="pl" type="url" placeholder="https://github.com/you" value={v.primary_link} onChange={(e) => setDraft({ ...v, primary_link: e.target.value })} /></div>
      <div className="space-y-1.5">
        <Label htmlFor="dc">Direct contact</Label>
        <Input id="dc" placeholder="Email, @telegram or Calendly link" value={v.direct_contact} onChange={(e) => setDraft({ ...v, direct_contact: e.target.value })} />
        <p className="text-xs text-muted-foreground">Hidden until a project accepts your connect.</p>
      </div>
      <Button type="submit">Save profile</Button>
    </form>
  );
}
