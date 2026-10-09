import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/use-auth";
import { useEmbeddingsOnSignIn } from "@/hooks/use-slyk-data";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user } = useAuth();
  useEmbeddingsOnSignIn(user?.id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "projects" && q.queryKey[0] !== "proofs" });
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded bg-primary font-mono text-xs font-bold text-primary-foreground">S</span>
          Slyk
        </Link>
        <nav className="flex items-center gap-1.5">
          <CommandPalette />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/builders">Builders</Link></Button>
          {user && <Button asChild variant="ghost" size="sm"><Link to="/dashboard">Dashboard</Link></Button>}
          {user && <NotificationBell userId={user.id} />}
          <Button asChild size="sm">
            <Link to="/projects/new"><Plus /><span className="hidden sm:inline">Post a Project</span></Link>
          </Button>
          {user ? (
            <Button variant="outline" size="icon" onClick={signOut} title={`Sign out ${user.email ?? ""}`} aria-label="Sign out"><LogOut /></Button>
          ) : (
            <Button asChild variant="outline" size="sm"><Link to="/auth">Sign in</Link></Button>
          )}
        </nav>
      </div>
    </header>
  );
}
