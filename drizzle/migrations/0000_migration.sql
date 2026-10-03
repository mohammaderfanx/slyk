create type public.project_category as enum ('AI/ML','SaaS','DevTools','Web3');
create type public.project_stage as enum ('Idea','Prototype','Live Revenue','Funded');
create type public.entity_type as enum ('Solo Founder','Early Team','Company');
create type public.incentive_type as enum ('Equity','Paid','Equity + Paid','Open Source');
create type public.request_status as enum ('pending','accepted','declined');

create table public.profiles (
  id uuid primary key,
  full_name text,
  avatar_url text,
  primary_link text,
  direct_contact text,
  created_at timestamptz not null default now()
);
grant select (id, full_name, avatar_url, primary_link, created_at) on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles public read" on public.profiles for select to anon, authenticated using (true);
create policy "profiles own insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles own update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  tagline text not null check (char_length(tagline) <= 280),
  category public.project_category not null,
  stage public.project_stage not null,
  entity_type public.entity_type not null,
  looking_for text not null,
  incentive public.incentive_type not null,
  tech_stack text[] not null default '{}'
);
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "projects public read" on public.projects for select to anon, authenticated using (true);
create policy "projects own insert" on public.projects for insert to authenticated with check (auth.uid() = user_id);
create policy "projects own update" on public.projects for update to authenticated using (auth.uid() = user_id);
create policy "projects own delete" on public.projects for delete to authenticated using (auth.uid() = user_id);

create table public.connect_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  role_offered text not null,
  pitch_sentence text not null check (char_length(pitch_sentence) <= 300),
  status public.request_status not null default 'pending',
  unique (project_id, applicant_id)
);
grant select, insert on public.connect_requests to authenticated;
grant update (status) on public.connect_requests to authenticated;
grant all on public.connect_requests to service_role;
alter table public.connect_requests enable row level security;
create policy "requests applicant insert" on public.connect_requests for insert to authenticated
  with check (auth.uid() = applicant_id and status = 'pending'
    and not exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "requests read" on public.connect_requests for select to authenticated
  using (auth.uid() = applicant_id or exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "requests owner update" on public.connect_requests for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create or replace function public.get_my_contact()
returns text language sql stable security definer set search_path = public as $$
  select direct_contact from public.profiles where id = auth.uid()
$$;

create or replace function public.get_applicant_contact(_request_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select pr.direct_contact from public.connect_requests r
  join public.projects p on p.id = r.project_id
  join public.profiles pr on pr.id = r.applicant_id
  where r.id = _request_id and r.status = 'accepted' and p.user_id = auth.uid()
$$;
revoke execute on function public.get_my_contact() from public, anon;
revoke execute on function public.get_applicant_contact(uuid) from public, anon;
grant execute on function public.get_my_contact() to authenticated;
grant execute on function public.get_applicant_contact(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, direct_contact)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.projects (title, tagline, category, stage, entity_type, looking_for, incentive, tech_stack) values
('Ledgerly AI','LLM copilot that reconciles messy SMB bookkeeping in minutes. 40 paying accounts, need someone to own the retrieval pipeline and eval harness.','AI/ML','Live Revenue','Solo Founder','RAG / NLP Engineer','Equity + Paid', array['LangChain','FastAPI','pgvector','Next.js']),
('Patchwise','Autonomous PR reviewer fine-tuned on your codebase conventions. Catches regressions before CI does.','DevTools','Prototype','Early Team','ML Engineer (fine-tuning)','Equity', array['PyTorch','LoRA','Python','GitHub API']),
('ShipStack','Micro-SaaS that turns Stripe events into investor-ready MRR dashboards. Profitable, looking to scale distribution.','SaaS','Live Revenue','Solo Founder','Fullstack Co-Founder','Equity', array['Next.js','Tailwind','Stripe','Postgres']),
('VoxScribe','On-device speech-to-notes for clinicians. Whisper distillation running under 300ms on M-series chips.','AI/ML','Funded','Company','Senior Audio ML Engineer','Paid', array['PyTorch','Whisper','CoreML','Swift']),
('PromptOps','Open-source observability for LLM apps — traces, costs, and prompt diffs in one panel.','DevTools','Prototype','Early Team','Frontend Engineer','Open Source', array['TypeScript','React','ClickHouse','OpenTelemetry']),
('Onchain Ledger Agents','AI agents that monitor DAO treasuries and draft governance proposals automatically.','Web3','Idea','Solo Founder','Smart Contract + LLM Dev','Equity', array['Solidity','LangChain','Foundry','FastAPI']);