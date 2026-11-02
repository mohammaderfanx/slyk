import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEcosystemActivity(userId?:string){
 const qc=useQueryClient(),[active,setActive]=useState(0);
 const events=useQuery({queryKey:["ecosystem-activity"],queryFn:async()=>{const since=new Date(Date.now()-864e5).toISOString();const{data,error}=await supabase.from("ecosystem_activity").select("id,project_id,event_type,created_at").gte("created_at",since).order("created_at",{ascending:false}).limit(500);if(error)throw error;return data;},staleTime:30000});
 useEffect(()=>{
  const channel=supabase.channel(`ecosystem-events-${crypto.randomUUID()}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"ecosystem_activity"},()=>{qc.invalidateQueries({queryKey:["ecosystem-activity"]});qc.invalidateQueries({queryKey:["inbound"]});}).subscribe();
  return()=>{void supabase.removeChannel(channel);};
 },[qc]);
 useEffect(()=>{
  if(!userId){setActive(0);return;}
  // Presence contains no profile, email, or contact payload: only anonymous session counts.
  const room=supabase.channel("slyk-builder-presence",{config:{presence:{key:crypto.randomUUID()}}});
  room.on("presence",{event:"sync"},()=>setActive(Object.keys(room.presenceState()).length)).subscribe(status=>{if(status==="SUBSCRIBED")void room.track({online:true});});
  return()=>{void room.untrack();void supabase.removeChannel(room);};
 },[userId]);
 const counts=new Map<string,number>();for(const e of events.data??[])if(e.event_type==="pitch")counts.set(e.project_id,(counts.get(e.project_id)??0)+1);
 return{active,counts,accepted:(events.data??[]).filter(e=>e.event_type==="accepted").slice(0,3)};
}