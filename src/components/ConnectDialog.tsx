import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-slyk-data";
import type { Project } from "@/lib/slyk";
import { EquityCalculator } from "@/components/AlignmentTools";
import { eligibleInstantApply } from "@/lib/ecosystem";
import { useQuery } from "@tanstack/react-query";

export function ConnectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const me = useMyProfile(user?.id);
  const [link, setLink] = useState("");
  const [role, setRole] = useState("");
  const [pitch, setPitch] = useState("");
  const preferences = useQuery({queryKey:["power-preferences",user?.id],enabled:!!user,queryFn:async()=>{if(!user)return null;const{data,error}=await supabase.from("builder_preferences").select("master_pitch,master_role").eq("user_id",user.id).maybeSingle();if(error)throw error;return data;}});
  const power = eligibleInstantApply(me.data?.verification_status,me.data?.is_demo??false,preferences.data?.master_pitch,preferences.data?.master_role) && !project?.is_demo;
  async function instantApply(){
    if(!project||!user||!power)return;
    const key=["sent",user.id],prev=qc.getQueryData<string[]>(key)??[];
    qc.setQueryData(key,[...prev,project.id]);const p=project;onClose();
    const{error}=await supabase.rpc("instant_apply",{_project_id:p.id});
    if(error){qc.setQueryData(key,prev);toast.error(error.message);}else toast.success("Master Pitch sent");
  }
  useEffect(()=>{if(!project||!power)return;const handler=(e:KeyboardEvent)=>{if(e.shiftKey&&e.key.toLowerCase()==="a"&&!(e.target instanceof HTMLElement&&e.target.closest("input,textarea,[contenteditable]"))){e.preventDefault();void instantApply();}};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);});

  useEffect(() => {
    if (!project) return;
    setRole(""); setPitch("");
    setLink(me.data?.primary_link ?? "");
  }, [project, me.data]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !user) return;
    const key = ["sent", user.id];
    const prev = qc.getQueryData<string[]>(key) ?? [];
    // Optimistic: mark sent and close immediately
    qc.setQueryData(key, [...prev, project.id]);
    const p = project;
    onClose();
    toast.success("Connect sent. You'll get contact details if accepted.");
    if (link.trim() !== (me.data?.primary_link ?? "")) {
      await supabase.from("profiles").update({ primary_link: link.trim() }).eq("id", user.id);
      qc.invalidateQueries({ queryKey: ["me-public", user.id] });
    }
    const { error } = await supabase.from("connect_requests").insert({
      project_id: p.id, applicant_id: user.id, role_offered: role.trim(), pitch_sentence: pitch.trim(),
    });
    if (error && error.code !== "23505") {
      qc.setQueryData(key, prev);
      toast.error(`Couldn't send to ${p.title}: ${error.message}`);
    }
  }

  const own = project && user && project.user_id === user.id;

  return (
    <Dialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect via Slyk</DialogTitle>
          <DialogDescription>{project?.title} · looking for {project?.looking_for}</DialogDescription>
        </DialogHeader>
        {!user ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Sign in to send a connect request.</p>
            <Button asChild className="w-full"><Link to="/auth">Sign in</Link></Button>
          </div>
        ) : project?.is_demo ? (
          <p className="text-sm text-muted-foreground">Sample listing. Applications are disabled.</p>
        ) : own ? (
          <p className="text-sm text-muted-foreground">This is your project.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="link">Primary Link</Label>
              <Input id="link" type="url" required placeholder="https://github.com/you" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Your Role/Skill</Label>
              <Input id="role" required maxLength={80} placeholder="NLP Engineer" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pitch">Why are you a fit?</Label>
              <Input id="pitch" required maxLength={300} placeholder="One sentence." value={pitch} onChange={(e) => setPitch(e.target.value)} />
            </div>
            {project && project.incentive.includes("Equity") && <EquityCalculator project={project}/>}
            {power&&<Button type="button" variant="outline" className="w-full" onClick={()=>void instantApply()}>Instant Apply · Master Pitch</Button>}
            <Button type="submit" className="w-full">Send connect</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
