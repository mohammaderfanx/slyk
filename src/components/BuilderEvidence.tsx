import { Github, GitPullRequest, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Json } from "@/integrations/supabase/types";

export type EvidenceBuilder={id:string;full_name:string|null;github_handle:string|null;github_stats:Json|null;skills:string[];reputation_score:number;is_demo?:boolean};
type Evidence={total_stars?:number;public_repos?:number;primary_languages?:string[];activity_days?:Record<string,number>;pull_requests?:{title:string;url:string;repo:string}[];repositories?:{name:string;description:string|null;url:string;stars:number;language:string|null}[];synced_at?:string};
export function BuilderEvidence({builder,onClose}:{builder:EvidenceBuilder|null;onClose:()=>void}){
 const s=(builder?.github_stats??{}) as Evidence;
 const days=Array.from({length:84},(_,i)=>{const d=new Date();d.setUTCDate(d.getUTCDate()-83+i);return d.toISOString().slice(0,10);});
 return <Dialog open={!!builder} onOpenChange={o=>!o&&onClose()}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{builder?.full_name} · Work evidence</DialogTitle></DialogHeader>
 {builder?.is_demo&&<Badge variant="outline">Sample profile · illustrative metrics</Badge>}
 <div className="flex flex-wrap gap-4 font-mono text-sm"><span><Star className="mr-1 inline h-4 w-4 text-primary"/>{s.total_stars??0} stars</span><span>{s.public_repos??0} repositories</span><span className="text-muted-foreground">rep {builder?.reputation_score}</span></div>
 <div className="flex flex-wrap gap-1">{builder?.skills.map(x=><Badge variant="secondary" key={x}>{x}</Badge>)}</div>
 <section className="space-y-2 border-t pt-4"><h3 className="text-xs font-medium">Public activity · last 12 weeks</h3>{s.activity_days?<div className="grid grid-flow-col grid-rows-7 gap-1">{days.map(d=><span key={d} title={`${d}: ${s.activity_days?.[d]??0} public events`} className={`aspect-square rounded-sm ${!s.activity_days?.[d]?"bg-muted":s.activity_days[d]>3?"bg-primary":"bg-success/50"}`}/>)}</div>:<p className="text-xs text-muted-foreground">Public event history has not been synced. Private contributions are not included.</p>}</section>
 <div className="text-xs text-muted-foreground">{s.primary_languages?.join(" · ")}</div>
 <section className="space-y-3 border-t pt-4"><h3 className="flex items-center gap-2 text-sm font-medium"><GitPullRequest className="h-4 w-4"/>Pull request activity</h3>{s.pull_requests?.length?s.pull_requests.map(p=><a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="block text-sm hover:text-primary">{p.title}<span className="block font-mono text-xs text-muted-foreground">{p.repo}</span></a>):<p className="text-xs text-muted-foreground">No pull requests in the available public event window.</p>}</section>
 <section className="space-y-3 border-t pt-4"><h3 className="text-sm font-medium">Key repositories</h3>{s.repositories?.map(r=><div key={r.url}><a className="text-sm font-medium hover:text-primary" href={r.url} target="_blank" rel="noreferrer">{r.name} · ★ {r.stars}</a><p className="text-xs text-muted-foreground">{r.description??r.language}</p></div>)}</section>
 {builder?.github_handle&&<Button asChild variant="outline"><a href={`https://github.com/${builder.github_handle}`} target="_blank" rel="noreferrer"><Github/>GitHub profile</a></Button>}
 </DialogContent></Dialog>;
}