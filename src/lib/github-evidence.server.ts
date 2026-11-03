const headers={Accept:"application/vnd.github+json","User-Agent":"slyk-app"};
type Repo={name:string;html_url:string;description:string|null;stargazers_count:number;language:string|null;fork:boolean;pushed_at:string};
type Event={type:string;created_at:string;repo:{name:string};payload:{pull_request?:{title:string;html_url:string}}};
async function github<T>(path:string):Promise<T>{const r=await fetch(`https://api.github.com${path}`,{headers,signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error(`GitHub public evidence unavailable (${r.status})`);return await r.json() as T;}
export async function publicGithubEvidence(handle:string){
 if(!/^[A-Za-z0-9-]{1,39}$/.test(handle))throw new Error("Invalid GitHub username");
 const u=await github<{public_repos:number;login:string}>(`/users/${handle}`);
 const repos=await github<Repo[]>(`/users/${handle}/repos?per_page=100&sort=pushed`);
 const events=await github<Event[]>(`/users/${handle}/events/public?per_page=100`);
 const own=repos.filter(r=>!r.fork),langs:Record<string,number>={},days:Record<string,number>={};
 for(const r of own)if(r.language)langs[r.language]=(langs[r.language]??0)+1;
 for(const e of events){const d=e.created_at.slice(0,10);days[d]=(days[d]??0)+1;}
 const prs=events.filter(e=>e.type==="PullRequestEvent"&&e.payload.pull_request).map(e=>({title:e.payload.pull_request?.title??"Pull request",url:e.payload.pull_request?.html_url??"",repo:e.repo.name}));
 const uniquePrs=[...new Map(prs.map(p=>[p.url,p])).values()].slice(0,8);
 return{login:u.login,stats:{public_repos:u.public_repos,total_stars:own.reduce((s,r)=>s+r.stargazers_count,0),primary_languages:Object.entries(langs).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([l])=>l),active_days_30d:Object.keys(days).filter(d=>Date.parse(d)>Date.now()-30*864e5).length,activity_days:days,pull_requests:uniquePrs,repositories:own.sort((a,b)=>b.stargazers_count-a.stargazers_count).slice(0,5).map(r=>({name:r.name,url:r.html_url,description:r.description,stars:r.stargazers_count,language:r.language})),synced_at:new Date().toISOString(),source:"public_events_not_full_contribution_history"}};
}