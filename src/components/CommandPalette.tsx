import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FolderPlus, LayoutDashboard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { projectsOptions } from "@/hooks/use-slyk-data";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data = [] } = useQuery(projectsOptions);
  const stacks = [...new Set(data.flatMap((p) => p.tech_stack))].sort();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (fn: () => void) => { setOpen(false); fn(); };

  return (
    <>
      <Button variant="outline" size="sm" className="hidden gap-2 text-muted-foreground md:inline-flex" onClick={() => setOpen(true)}>
        <Search /> Search <kbd className="rounded border px-1 font-mono text-[10px]">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Find projects, tech stack, or jump to…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => go(() => navigate({ to: "/dashboard" }))}><LayoutDashboard /> Dashboard</CommandItem>
            <CommandItem onSelect={() => go(() => navigate({ to: "/projects/new" }))}><FolderPlus /> Post a Project</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Tech stack">
            {stacks.map((s) => (
              <CommandItem key={s} value={`stack ${s}`} onSelect={() => go(() => navigate({ to: "/", search: { q: s } }))}>
                <span className="font-mono">{s}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Projects">
            {data.map((p) => (
              <CommandItem key={p.id} value={`${p.title} ${p.looking_for} ${p.tech_stack.join(" ")}`} onSelect={() => go(() => navigate({ to: "/", search: { q: p.title } }))}>
                {p.title}<span className="ml-auto text-xs text-muted-foreground">{p.looking_for}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
