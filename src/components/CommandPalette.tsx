import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Contrast, Download, FolderPlus, Inbox, LayoutDashboard, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { projectsOptions } from "@/hooks/use-slyk-data";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const HC_KEY = "slyk-high-contrast";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data = [] } = useQuery(projectsOptions);
  const stacks = [...new Set(data.flatMap((p) => p.tech_stack))].sort();

  useEffect(() => {
    if (localStorage.getItem(HC_KEY) === "1") document.documentElement.classList.add("hc");
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (fn: () => void) => { setOpen(false); fn(); };

  function toggleContrast() {
    const on = document.documentElement.classList.toggle("hc");
    localStorage.setItem(HC_KEY, on ? "1" : "0");
    toast(on ? "High-contrast mode on" : "High-contrast mode off");
  }

  async function exportMine() {
    if (!user) { navigate({ to: "/auth" }); return; }
    const [{ data: projects }, { data: pitches }] = await Promise.all([
      supabase.from("projects").select("*").eq("user_id", user.id),
      supabase.from("connect_requests").select("project_id, role_offered, pitch_sentence, status, created_at").eq("applicant_id", user.id),
    ]);
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), my_projects: projects ?? [], my_pitches: pitches ?? [] }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "slyk-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <Button variant="outline" size="sm" className="hidden gap-2 text-muted-foreground md:inline-flex" onClick={() => setOpen(true)}>
        <Search /> Search <kbd className="rounded border px-1 font-mono text-[10px]">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Find projects, builders, stack, or run an action…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => go(() => navigate({ to: "/dashboard", search: { tab: "pending" } }))}><Inbox /> Jump to my pending pitches</CommandItem>
            <CommandItem onSelect={() => go(() => navigate({ to: "/dashboard" }))}><LayoutDashboard /> Dashboard</CommandItem>
            <CommandItem onSelect={() => go(() => navigate({ to: "/dashboard/analytics" }))}><LayoutDashboard /> Analytics</CommandItem>
            <CommandItem onSelect={() => go(() => navigate({ to: "/projects/new" }))}><FolderPlus /> Post a Project</CommandItem>
            <CommandItem onSelect={() => go(exportMine)}><Download /> Export my projects & pitches</CommandItem>
            <CommandItem onSelect={() => go(toggleContrast)}><Contrast /> Toggle high-contrast performance mode</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Search builders by stack">
            {stacks.map((s) => (
              <CommandItem key={`b-${s}`} value={`builders ${s}`} onSelect={() => go(() => navigate({ to: "/builders", search: { q: s } }))}>
                <Users /> Builders with <span className="font-mono">{s}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Projects by stack">
            {stacks.map((s) => (
              <CommandItem key={s} value={`stack ${s}`} onSelect={() => go(() => navigate({ to: "/", search: { q: s } }))}>
                <span className="font-mono">{s}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Projects">
            {data.map((p) => (
              <CommandItem key={p.id} value={`${p.title} ${p.looking_for} ${p.tech_stack.join(" ")}`} onSelect={() => go(() => navigate({ to: "/p/$id", params: { id: p.id } }))}>
                {p.title}<span className="ml-auto text-xs text-muted-foreground">{p.looking_for}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
