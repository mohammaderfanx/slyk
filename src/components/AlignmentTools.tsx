import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { alignmentSchema, COMMITMENTS, LOCATIONS, equityEstimate, commitmentText } from "@/lib/ecosystem";
import type { Project } from "@/lib/slyk";

export function EquityCalculator({ project }: { project: Project }) {
  const [hours,setHours]=useState(20),[expertise,setExpertise]=useState(3),[funded,setFunded]=useState(project.stage==="Funded");
  const range=equityEstimate(project.stage,funded,hours,expertise);
  const alignment=useQuery({queryKey:["alignment",project.id],queryFn:async()=>{const {data,error}=await supabase.from("cofounder_alignment_matrix").select("*").eq("project_id",project.id).maybeSingle();if(error)throw error;return data;}});
  return <section className="space-y-3 border-t pt-4">
    <h3 className="flex items-center gap-2 text-sm font-medium"><Calculator className="h-4 w-4 text-primary"/>Co-founder alignment</h3>
    {alignment.data&&<div className="text-xs text-muted-foreground">Offered: {alignment.data.equity_range_offered} · {alignment.data.time_commitment}<br/>{alignment.data.vesting_schedule} · {alignment.data.location_preference} · {alignment.data.timezone_overlap_min}h overlap</div>}
    <div className="flex justify-between text-xs"><Label>Hours per week</Label><span className="font-mono">{hours}h</span></div><Slider aria-label="Hours per week" min={1} max={40} step={1} value={[hours]} onValueChange={v=>setHours(v[0]??20)}/>
    <div className="flex justify-between text-xs"><Label>Domain expertise</Label><span className="font-mono">{expertise}/5</span></div><Slider aria-label="Domain expertise" min={1} max={5} step={1} value={[expertise]} onValueChange={v=>setExpertise(v[0]??3)}/>
    <label className="flex items-center justify-between text-xs">Existing funding<Switch checked={funded} onCheckedChange={setFunded}/></label>
    <div className="flex items-baseline justify-between"><span className="text-xs text-muted-foreground">Discussion range</span><strong className="font-mono text-xl text-primary">{range.low}–{range.high}%</strong></div>
    <p className="text-[11px] text-muted-foreground">Illustrative estimate, not financial or legal advice. Final equity is negotiated.</p>
  </section>;
}

export function AlignmentEditor({project}:{project:Project}){
 const qc=useQueryClient();
 const q=useQuery({queryKey:["alignment",project.id],queryFn:async()=>{const{data,error}=await supabase.from("cofounder_alignment_matrix").select("*").eq("project_id",project.id).maybeSingle();if(error)throw error;return data;}});
 const [draft,setDraft]=useState<ReturnType<typeof alignmentSchema.parse>|null>(null);
 const v=draft??q.data??{project_id:project.id,equity_range_offered:"5% - 15%",vesting_schedule:"4 years, 1-year cliff",time_commitment:COMMITMENTS[1],location_preference:LOCATIONS[0],timezone_overlap_min:4};
 async function save(e:React.FormEvent){e.preventDefault();const parsed=alignmentSchema.safeParse(v);if(!parsed.success){toast.error(parsed.error.issues[0]?.message??"Invalid terms");return;}const prev=q.data;qc.setQueryData(["alignment",project.id],parsed.data);const{error}=await supabase.from("cofounder_alignment_matrix").upsert(parsed.data,{onConflict:"project_id"});if(error){qc.setQueryData(["alignment",project.id],prev);toast.error(error.message);}else{setDraft(null);toast.success("Alignment saved");qc.invalidateQueries({queryKey:["alignment",project.id]});}}
 return <form onSubmit={save} className="grid gap-3 border-t pt-4 sm:grid-cols-2"><h3 className="text-sm font-medium sm:col-span-2">Co-founder terms</h3>
 <div><Label>Equity offered</Label><Input aria-label="Equity offered" maxLength={80} value={v.equity_range_offered} onChange={e=>setDraft({...v,equity_range_offered:e.target.value})}/></div>
 <div><Label>Vesting schedule</Label><Input aria-label="Vesting schedule" maxLength={160} value={v.vesting_schedule} onChange={e=>setDraft({...v,vesting_schedule:e.target.value})}/></div>
 <Select value={v.time_commitment} onValueChange={x=>{const t=COMMITMENTS.find(c=>c===x);if(t)setDraft({...v,time_commitment:t});}}><SelectTrigger aria-label="Time commitment"><SelectValue/></SelectTrigger><SelectContent>{COMMITMENTS.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
 <Select value={v.location_preference} onValueChange={x=>{const l=LOCATIONS.find(c=>c===x);if(l)setDraft({...v,location_preference:l});}}><SelectTrigger aria-label="Location preference"><SelectValue/></SelectTrigger><SelectContent>{LOCATIONS.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
 <div><Label>Timezone overlap (hours)</Label><Input aria-label="Timezone overlap" type="number" min={0} max={24} value={v.timezone_overlap_min} onChange={e=>setDraft({...v,timezone_overlap_min:Number(e.target.value)})}/></div><Button type="submit" variant="outline" className="self-end">Save terms</Button></form>;
}

export function CommitmentChecklist({requestId,userId,project}:{requestId:string;userId:string;project:string}){
 const qc=useQueryClient(),key=["checklist",requestId,userId];
 const q=useQuery({queryKey:key,queryFn:async()=>{const{data,error}=await supabase.from("commitment_checklists").select("*").eq("request_id",requestId).eq("user_id",userId).maybeSingle();if(error)throw error;return data;}});
 const checks=q.data??{request_id:requestId,user_id:userId,vesting:false,ip_assignment:false,time_commitment:false};
 async function toggle(field:"vesting"|"ip_assignment"|"time_commitment",value:boolean){const prev=q.data;const next={...checks,[field]:value};qc.setQueryData(key,next);const{error}=await supabase.from("commitment_checklists").upsert(next);if(error){qc.setQueryData(key,prev);toast.error(error.message);}}
 function download(){const a=document.createElement("a"),url=URL.createObjectURL(new Blob([commitmentText(project,checks)],{type:"text/plain"}));a.href=url;a.download="slyk-cofounder-handoff.txt";a.click();URL.revokeObjectURL(url);}
 return <div className="mt-3 space-y-2 border-t pt-2"><h4 className="text-xs font-medium">Your commitment checklist</h4>{([['vesting','Vesting'],['ip_assignment','IP Assignment'],['time_commitment','Time Commitment']] as const).map(([k,l])=><label key={k} className="flex items-center gap-2 text-xs"><Checkbox checked={checks[k]} onCheckedChange={c=>void toggle(k,c===true)}/>{l}</label>)}<Button size="sm" variant="ghost" onClick={download}><Download/>Handoff</Button></div>;
}