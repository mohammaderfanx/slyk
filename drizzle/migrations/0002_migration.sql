create type public.verification_status as enum ('unverified','github_verified','top_builder');
alter table public.profiles
  add column github_handle text unique,
  add column github_stats jsonb,
  add column verification_status public.verification_status not null default 'unverified',
  add column reputation_score integer not null default 100;
grant select (github_handle, github_stats, verification_status, reputation_score) on public.profiles to anon, authenticated;
revoke insert, update on public.profiles from authenticated;
grant insert (id, full_name, avatar_url, primary_link, direct_contact, skills) on public.profiles to authenticated;
grant update (full_name, avatar_url, primary_link, direct_contact, skills) on public.profiles to authenticated;

alter table public.connect_requests add column responded_at timestamptz;
create or replace function public.set_responded_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'pending' and new.status <> 'pending' then new.responded_at := now(); end if;
  return new;
end; $$;
create trigger connect_set_responded before update of status on public.connect_requests for each row execute function public.set_responded_at();

create or replace function public.enforce_pitch_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.connect_requests where applicant_id = new.applicant_id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Rate limit: max 5 pitches per hour. Try again later.' using errcode = 'P0001';
  end if;
  return new;
end; $$;
create trigger connect_rate_limit before insert on public.connect_requests for each row execute function public.enforce_pitch_rate_limit();

create type public.proof_type as enum ('github_repo','demo_video','live_metrics','deck_url');
create table public.project_proofs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  proof_type public.proof_type not null,
  url text not null check (url ~ '^https://[^\s]+$' and char_length(url) <= 500),
  label text not null check (char_length(label) between 1 and 80),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.project_proofs to anon, authenticated;
grant insert (project_id, proof_type, url, label), delete on public.project_proofs to authenticated;
grant all on public.project_proofs to service_role;
alter table public.project_proofs enable row level security;
create policy "proofs public read" on public.project_proofs for select to anon, authenticated using (true);
create policy "proofs owner insert" on public.project_proofs for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "proofs owner delete" on public.project_proofs for delete to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create type public.project_event_type as enum ('impression','click','reveal');
create table public.project_events (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid,
  event_type public.project_event_type not null,
  created_at timestamptz not null default now()
);
create index project_events_project_idx on public.project_events (project_id, event_type);
grant select on public.project_events to authenticated;
grant all on public.project_events to service_role;
alter table public.project_events enable row level security;
create policy "events owner read" on public.project_events for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create or replace function public.track_project_events(_project_ids uuid[], _type public.project_event_type)
returns void language sql security definer set search_path = public as $$
  insert into public.project_events (project_id, user_id, event_type)
  select pid, auth.uid(), _type from unnest(_project_ids[1:60]) as pid
  where exists (select 1 from public.projects where id = pid)
$$;
grant execute on function public.track_project_events(uuid[], public.project_event_type) to anon, authenticated;

create view public.match_analytics with (security_invoker = on) as
select p.id as project_id, p.user_id, p.title,
  (select count(*) from public.project_events e where e.project_id = p.id and e.event_type = 'impression')::int as view_count,
  (select count(*) from public.project_events e where e.project_id = p.id and e.event_type = 'click')::int as click_count,
  (select count(*) from public.connect_requests r where r.project_id = p.id)::int as pitch_count,
  (select count(*) from public.connect_requests r where r.project_id = p.id and r.status = 'accepted')::int as accepted_count,
  (select extract(epoch from avg(r.responded_at - r.created_at)) / 3600 from public.connect_requests r where r.project_id = p.id and r.responded_at is not null)::float as avg_ttfr_hours,
  case when (select count(*) from public.project_events e where e.project_id = p.id and e.event_type = 'impression') = 0 then 0
    else (select count(*) from public.connect_requests r where r.project_id = p.id)::float
       / (select count(*) from public.project_events e where e.project_id = p.id and e.event_type = 'impression') end as connect_conversion_rate,
  p.created_at
from public.projects p
where p.user_id = auth.uid();
grant select on public.match_analytics to authenticated;

create or replace function public.refresh_reputation(_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s jsonb; acc int; score int; h text;
begin
  select github_stats, github_handle into s, h from public.profiles where id = _uid;
  select count(*) into acc from public.connect_requests where applicant_id = _uid and status = 'accepted';
  score := 100
    + least(coalesce((s->>'total_stars')::int, 0), 2000) / 20
    + least(coalesce((s->>'public_repos')::int, 0), 50)
    + 20 * acc;
  update public.profiles set reputation_score = score,
    verification_status = case when h is null then 'unverified'::verification_status
      when score >= 250 then 'top_builder'::verification_status else 'github_verified'::verification_status end
  where id = _uid;
end; $$;
revoke execute on function public.refresh_reputation(uuid) from public, anon, authenticated;
grant execute on function public.refresh_reputation(uuid) to service_role;

create or replace function public.reputation_on_accept()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then perform public.refresh_reputation(new.applicant_id); end if;
  return new;
end; $$;
create trigger connect_reputation after update of status on public.connect_requests for each row execute function public.reputation_on_accept();

create or replace function public.recommend_builders(_project_id uuid)
returns table (id uuid, full_name text, primary_link text, skills text[], github_handle text, verification_status public.verification_status, reputation_score int, overlap int)
language sql stable security definer set search_path = public as $$
  select pr.id, pr.full_name, pr.primary_link, pr.skills, pr.github_handle, pr.verification_status, pr.reputation_score,
    (select count(*) from unnest(pr.skills) s
      where lower(s) = any (select lower(t) from unnest(p.tech_stack) t) or position(lower(s) in lower(p.looking_for)) > 0)::int as overlap
  from public.projects p, public.profiles pr
  where p.id = _project_id and p.user_id = auth.uid() and pr.id <> p.user_id and cardinality(pr.skills) > 0
  order by overlap desc, pr.reputation_score desc
  limit 5
$$;
revoke execute on function public.recommend_builders(uuid) from public, anon;
grant execute on function public.recommend_builders(uuid) to authenticated;

insert into public.projects (title, tagline, category, stage, entity_type, looking_for, incentive, tech_stack) values
('Vectorbase OSS','Open-source core for a lightweight embedded vector store in Rust with Python bindings. Hosted cloud tier funded by a pre-seed round.','DevTools','Funded','Company','Rust Systems Engineer','Equity + Paid', array['Rust','Python','PyO3','SIMD']),
('AgentBench Lite','Open benchmark harness for evaluating tool-using LLM agents on real SaaS workflows. Looking for core maintainers.','AI/ML','Prototype','Early Team','LLM Evaluation Engineer','Open Source', array['Python','LangChain','Docker','FastAPI']);

insert into public.project_proofs (project_id, proof_type, url, label, verified)
select p.id, v.t::public.proof_type, v.u, v.l, v.ver
from (values
  ('Ledgerly AI','github_repo','https://github.com/langchain-ai/langchain','LangChain integration',true),
  ('Ledgerly AI','live_metrics','https://stripe.com','Stripe MRR Proof',true),
  ('VoxScribe','github_repo','https://github.com/openai/whisper','Whisper base model',true),
  ('VoxScribe','demo_video','https://www.youtube.com/watch?v=aircAruvnKk','Model walkthrough (YouTube)',true),
  ('PromptOps','github_repo','https://github.com/open-telemetry/opentelemetry-js','OpenTelemetry SDK base',true),
  ('LensLabel','github_repo','https://github.com/ultralytics/ultralytics','YOLO training stack',true),
  ('Vectorbase OSS','github_repo','https://github.com/PyO3/pyo3','PyO3 bindings',true),
  ('Vectorbase OSS','deck_url','https://docs.google.com/presentation','Pre-seed deck',false),
  ('AgentBench Lite','github_repo','https://github.com/langchain-ai/langgraph','Agent runtime',true)
) as v(title, t, u, l, ver)
join public.projects p on p.title = v.title;

update public.profiles set github_handle = 'mayachen-dev', reputation_score = 180, verification_status = 'github_verified',
  github_stats = '{"public_repos":42,"total_stars":1350,"primary_languages":["Python","TypeScript"]}' where id = '00000000-0000-4000-8000-000000000001';
update public.profiles set github_handle = 'diego-builds', reputation_score = 140, verification_status = 'github_verified',
  github_stats = '{"public_repos":28,"total_stars":410,"primary_languages":["TypeScript","Go"]}' where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set github_handle = 'priya-cv', reputation_score = 265, verification_status = 'top_builder',
  github_stats = '{"public_repos":50,"total_stars":2900,"primary_languages":["Python","C++"]}' where id = '00000000-0000-4000-8000-000000000003';