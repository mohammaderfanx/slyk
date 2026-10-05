import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type N = Database["public"]["Tables"]["notifications"]["Row"];

export function NotificationBell({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const key = ["notifications", userId];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data as N[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`notif-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        qc.setQueryData<N[]>(["notifications", userId], (old = []) => [payload.new as N, ...old]);
        const n = payload.new as N;
        if (n.type === "new_connect_request") qc.invalidateQueries({ queryKey: ["inbound", userId] });
        else qc.invalidateQueries({ queryKey: ["outbound", userId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, qc]);

  const unread = data.filter((n) => !n.read).length;

  async function markAll() {
    qc.setQueryData<N[]>(key, data.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unread} unread)`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-primary-foreground">{unread}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unread > 0 && <button className="text-xs text-muted-foreground hover:text-foreground" onClick={markAll}>Mark all read</button>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {data.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Nothing yet.</p>
          ) : data.map((n) => (
            <Link key={n.id} to="/dashboard" className="block border-b px-3 py-2.5 last:border-b-0 hover:bg-accent">
              <div className="flex items-center gap-2">
                {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                <span className="truncate text-sm font-medium">{n.title}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
