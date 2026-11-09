import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, ArrowUpRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { networkOptions } from "@/hooks/use-network";
import { networkHead, workspaceSchema } from "@/lib/network";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/org")({ head: () => networkHead("Portfolio Workspaces", "Manage multi-project talent pipelines in role-scoped Slyk workspaces."), loader: ({ context }) => context.queryClient.ensureQueryData(networkOptions), component: Organizations });
function Organizations() {
  const { data } = useSuspenseQuery(networkOptions), { user } = useAuth(), qc = useQueryClient();
  const [open, setOpen] = useState(false), [name, setName] = useState(""), [slug, setSlug] = useState(""), [busy, setBusy] = useState(false);
  const mine = useQuery({ queryKey: ["my-workspaces", user?.id], enabled: !!user, queryFn: async () => { const { data, error } = await supabase.from("workspaces").select("*").eq("is_demo", false); if (error) throw error; return data ?? []; } });
  async function create() { const parsed = workspaceSchema.safeParse({ name, slug }); if (!parsed.success) { toast.error("Use a name and a lowercase URL name with letters, numbers or hyphens."); return; } setBusy(true); const { error } = await supabase.rpc("create_workspace", { _name: parsed.data.name, _slug: parsed.data.slug }); setBusy(false); if (error) toast.error(error.message); else { setOpen(false); void qc.invalidateQueries({ queryKey: ["my-workspaces"] }); toast.success("Workspace created"); } }
  const list = [...(mine.data ?? []), ...data.workspaces];
  return <main className="mx-auto max-w-6xl px-4 py-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase text-primary">Slyk / enterprise</p><h1 className="mt-2 text-3xl font-semibold">Portfolio Workspaces</h1><p className="mt-2 text-sm text-muted-foreground">One talent pipeline. Every project.</p></div>{user ? <Button onClick={() => setOpen(true)}><Plus />New workspace</Button> : <Button asChild variant="outline"><Link to="/auth">Sign in to create</Link></Button>}</div><div className="mt-8 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3">{list.map(w => <article key={w.id} className="flex flex-col gap-4 bg-card p-5"><Building2 className="h-8 w-8 text-primary" /><div><h2 className="text-lg font-semibold">{w.name}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">{w.tier.replaceAll("_", " ")}</p></div>{w.is_demo && <Badge variant="outline" className="w-fit">Sample portfolio</Badge>}<span className="text-xs text-muted-foreground">{w.is_demo ? `${data.links.filter(l => l.workspace_id === w.id).length} projects · illustrative portfolio` : "Private workspace"}</span><Button asChild variant="outline" className="mt-auto"><Link to="/org/$slug" params={{ slug: w.slug }}>Open portfolio<ArrowUpRight /></Link></Button></article>)}</div><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Create workspace</DialogTitle></DialogHeader><Input aria-label="Workspace name" placeholder="Workspace name" value={name} onChange={e => setName(e.target.value)} /><Input aria-label="Workspace URL name" placeholder="my-workspace" value={slug} onChange={e => setSlug(e.target.value)} /><p className="text-xs text-muted-foreground">Free workspace. Enterprise tier and billing are not enabled by creation.</p><Button disabled={busy} onClick={() => void create()}>Create workspace</Button></DialogContent></Dialog></main>;
}