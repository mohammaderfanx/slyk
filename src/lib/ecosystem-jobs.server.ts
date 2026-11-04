import { Inngest } from "inngest";
import { serve } from "inngest/edge";
import { publicGithubEvidence } from "./github-evidence.server";
import { routeQualifies } from "./ecosystem";
import { simToPct } from "./slyk";

export function ecosystemHandler(){
 const signingKey=process.env["INNGEST_SIGNING_KEY"];
 if(!signingKey)throw new Error("Inngest signing is not configured");
 const client=new Inngest({id:"slyk-ecosystem",signingKey});
 const make=(id:string,cron:string,kind:"github"|"digest"|"routes"|"reengagement")=>client.createFunction({id,triggers:[{cron}],retries:0,concurrency:1},async({step})=>step.run(`bounded-${kind}`,()=>runJob(kind)));
 return serve({client,functions:[make("daily-github-proof","0 4 * * *","github"),make("weekly-matches","0 9 * * 1","digest"),make("application-routing","*/5 * * * *","routes"),make("weekly-reengagement","0 10 * * 4","reengagement")]});
}
async function runJob(kind:"github"|"digest"|"routes"|"reengagement"){
 const {supabaseAdmin:db}=await import("@/integrations/supabase/client.server");
 const {data:locked,error:lockError}=await db.rpc("acquire_ecosystem_job",{_name:kind});if(lockError)throw lockError;if(!locked)return{skipped:true};
 const period=new Date().toISOString().slice(0,10);
 let processed=0;
 try{
  if(kind==="github"){
   const{data,error}=await db.from("profiles").select("id,github_handle,github_stats").eq("is_demo",false).not("github_handle","is",null).order("id").limit(20);if(error)throw error;
   for(const p of data??[]){const key=`${period}:${p.id}`;const{data:done}=await db.from("ecosystem_job_items").select("item_key").eq("job_name",kind).eq("item_key",key).maybeSingle();if(done||!p.github_handle)continue;
    const{stats}=await publicGithubEvidence(p.github_handle);const{error}=await db.from("profiles").update({github_stats:stats}).eq("id",p.id);if(error)throw error;await db.rpc("refresh_reputation",{_uid:p.id});await mark(kind,key);processed++;
   }
  }else if(kind==="digest"){
   const from=process.env["SLYK_DIGEST_FROM"];if(!from)throw new Error("Weekly digest paused: verified sender email required.");
   const cutoff=new Date(Date.now()-6*864e5).toISOString();
   const{data,error}=await db.from("builder_preferences").select("user_id,digest_email,last_digest_at").eq("weekly_digest",true).eq("available",true).or(`last_digest_at.is.null,last_digest_at.lt.${cutoff}`).order("last_digest_at",{nullsFirst:true}).limit(20);if(error)throw error;
   for(const p of data??[]){if(!p.digest_email)continue;const key=`${period}:${p.user_id}`;const{data:done}=await db.from("ecosystem_job_items").select("item_key").eq("job_name",kind).eq("item_key",key).maybeSingle();if(done)continue;
    const{data:matches,error}=await db.rpc("weekly_builder_matches",{_uid:p.user_id});if(error)throw error;if(!matches?.length)continue;
    await sendDigest(from,p.digest_email,matches,key);const{error:updateError}=await db.from("builder_preferences").update({last_digest_at:new Date().toISOString()}).eq("user_id",p.user_id);if(updateError)throw updateError;await mark(kind,key);processed++;
   }
  }else if(kind==="routes"){
   const{data,error}=await db.from("ecosystem_outbox").select("*").is("completed_at",null).is("last_error",null).order("created_at").limit(20);if(error)throw error;
   for(const event of data??[]){const{data:settings,error}=await db.from("integration_settings").select("provider,settings_json").eq("user_id",event.user_id).eq("enabled",true);if(error)throw error;
    const{data:req}=await db.from("connect_requests").select("project_id,applicant_id").eq("id",event.request_id).single();
    const{data:p}=req?await db.from("projects").select("title,looking_for").eq("id",req.project_id).single():{data:null};
    // Scores are computed inside the database; neither vectors nor private contacts leave it.
    const{data:score}=await db.rpc("routing_match_score",{_request_id:event.request_id});
    for(const setting of settings??[]){const config=setting.settings_json as {event?:string;min_score?:number};if(config.event!==event.event_type||!routeQualifies(score===null?null:simToPct(score),config.min_score??85))continue;
     if(setting.provider!=="discord")continue;
     const key=process.env["SLYK_INTEGRATION_ENCRYPTION_KEY"];if(!key)throw new Error("Integration encryption unavailable");
     const{data:url,error}=await db.rpc("read_integration_secret",{_uid:event.user_id,_provider:setting.provider,_key:key});if(error)throw error;if(!url)continue;
     const u=new URL(url);if(u.protocol!=="https:"||u.hostname!=="discord.com"||!/^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(u.pathname))throw new Error("Invalid webhook destination");
     const sent=await fetch(u,{method:"POST",redirect:"error",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:`Slyk · ${event.event_type==="pitch"?"New pitch":"Accepted connection"} for ${p?.title??"project"}\n${p?.looking_for??""}\nhttps://slykk.lovable.app/dashboard`}),signal:AbortSignal.timeout(10000)});
     if(!sent.ok){await db.from("ecosystem_outbox").update({last_error:`Discord delivery failed (${sent.status})`}).eq("id",event.id);throw new Error(`Discord delivery failed (${sent.status})`);}
    }
    const{error:finishError}=await db.from("ecosystem_outbox").update({completed_at:new Date().toISOString()}).eq("id",event.id);if(finishError)throw finishError;processed++;
   }
  }else{
   const{data,error}=await db.from("connect_requests").select("id,project_id").eq("status","pending").eq("flagged",false).lt("created_at",new Date(Date.now()-7*864e5).toISOString()).order("created_at").limit(20);if(error)throw error;
   for(const r of data??[]){const key=r.id;const{data:done}=await db.from("ecosystem_job_items").select("item_key").eq("job_name",kind).eq("item_key",key).maybeSingle();if(done)continue;const{data:p}=await db.from("projects").select("user_id,title").eq("id",r.project_id).single();if(!p?.user_id)continue;
    const{error}=await db.from("notifications").insert({user_id:p.user_id,type:"new_connect_request",title:`Pending pitch: ${p.title}`,message:"A builder has been waiting a week. Review your inbound pitches."});if(error)throw error;await mark(kind,key);processed++;
   }
  }
  return{processed};
 }catch(e){const message=e instanceof Error?e.message:"Background job failed";await db.from("ecosystem_job_state").update({paused:true,pause_reason:message}).eq("name",kind);throw e;
 }finally{await db.from("ecosystem_job_state").update({lease_until:new Date().toISOString()}).eq("name",kind);}
}
async function mark(job:string,key:string){const{ supabaseAdmin:db}=await import("@/integrations/supabase/client.server");const{error}=await db.from("ecosystem_job_items").upsert({job_name:job,item_key:key});if(error)throw error;}
async function sendDigest(from:string,to:string,matches:{title:string;project_id:string;score:number}[],id:string){
 const api=process.env["LOVABLE_API_KEY"],connection=process.env["RESEND_API_KEY"];if(!api||!connection)throw new Error("Resend connection unavailable");
 const r=await fetch("https://connector-gateway.lovable.dev/resend/emails",{method:"POST",headers:{Authorization:`Bearer ${api}`,"X-Connection-Api-Key":connection,"Content-Type":"application/json","Idempotency-Key":`slyk-weekly-${id}`},body:JSON.stringify({from,to:[to],subject:"Slyk Matches of the Week",text:`Your top matches this week:\n\n${matches.slice(0,3).map((m,i)=>`${i+1}. ${m.title} · ${simToPct(m.score)}% match\nhttps://slykk.lovable.app/p/${m.project_id}`).join("\n\n")}\n\nManage weekly emails: https://slykk.lovable.app/dashboard/integrations`})});
 if(!r.ok){const body=await r.text();console.error(`Resend failure [${r.status}]`,body);throw new Error(`Weekly email delivery failed (${r.status}). Review Resend sender and account configuration.`);}
}