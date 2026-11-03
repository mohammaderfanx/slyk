import {createFileRoute} from "@tanstack/react-router";
import {z} from "zod";
export const Route=createFileRoute("/api/public/badges/$id")({server:{handlers:{GET:async({params})=>{
 const id=z.string().uuid().safeParse(params.id);if(!id.success)return new Response("Invalid project",{status:400});
 const{createClient}=await import("@supabase/supabase-js");const url=process.env["SUPABASE_URL"],key=process.env["SUPABASE_PUBLISHABLE_KEY"];if(!url||!key)return new Response("Unavailable",{status:503});
 const db=createClient(url,key,{auth:{persistSession:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith("sb_"))h.delete("Authorization");h.set("apikey",key);return fetch(input,{...init,headers:h});}}});
 const{data,error}=await db.rpc("public_project_badge",{_project_id:id.data});if(error)return new Response("Unavailable",{status:503});const p=data?.[0];if(!p)return new Response("Not found",{status:404});
 const escape=(s:string)=>s.replace(/[<>&"']/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"}[c]??c));
 const label=escape(String(p.looking_for).slice(0,45)),count=Number(p.applicants)||0;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="30" role="img" aria-label="Slyk: ${label}, ${count} applicants"><rect width="520" height="30" rx="4" fill="#202020"/><rect width="110" height="30" rx="4" fill="#cdf55b"/><g font-family="monospace" font-size="12"><text x="12" y="20" fill="#202020">Built with Slyk</text><text x="124" y="20" fill="#eeeeee">${label} · ${count} applicants</text></g></svg>`;
 return new Response(svg,{headers:{"Content-Type":"image/svg+xml","Cache-Control":"public,max-age=60","X-Content-Type-Options":"nosniff"}});
}}});