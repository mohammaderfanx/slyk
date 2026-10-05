alter table public.profiles add column skills text[] not null default '{}';
grant select (skills) on public.profiles to anon, authenticated;

create type public.notification_type as enum ('new_connect_request','request_accepted','request_declined');
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications read" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "own notifications update" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.notifications replica identity full;
alter publication supabase_realtime add table public.notifications;

create or replace function public.notify_on_connect_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record; a text;
begin
  select id, title, user_id into p from public.projects where id = new.project_id;
  if p.user_id is null then return new; end if;
  select coalesce(full_name,'A builder') into a from public.profiles where id = new.applicant_id;
  insert into public.notifications (user_id, type, title, message)
  values (p.user_id, 'new_connect_request', 'New pitch for ' || p.title, a || ' (' || new.role_offered || '): ' || new.pitch_sentence);
  return new;
end; $$;
create trigger connect_insert_notify after insert on public.connect_requests for each row execute function public.notify_on_connect_insert();

create or replace function public.notify_on_connect_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if old.status = 'pending' and new.status in ('accepted','declined') then
    select title into t from public.projects where id = new.project_id;
    insert into public.notifications (user_id, type, title, message)
    values (new.applicant_id,
      case when new.status = 'accepted' then 'request_accepted'::notification_type else 'request_declined'::notification_type end,
      case when new.status = 'accepted' then 'Accepted: ' || t else 'Declined: ' || t end,
      case when new.status = 'accepted' then 'Your pitch was accepted. Contact details are now shared both ways.' else 'The founder passed on this one. Keep shipping.' end);
  end if;
  return new;
end; $$;
create trigger connect_status_notify after update of status on public.connect_requests for each row execute function public.notify_on_connect_status_change();

create or replace function public.get_handshake(_request_id uuid)
returns table (request_id uuid, project_title text, owner_name text, owner_contact text, applicant_name text, applicant_contact text)
language sql stable security definer set search_path = public as $$
  select r.id, p.title, o.full_name, o.direct_contact, a.full_name, a.direct_contact
  from public.connect_requests r
  join public.projects p on p.id = r.project_id
  join public.profiles o on o.id = p.user_id
  join public.profiles a on a.id = r.applicant_id
  where r.id = _request_id and r.status = 'accepted' and auth.uid() in (p.user_id, r.applicant_id)
$$;
revoke execute on function public.get_handshake(uuid) from public, anon;
grant execute on function public.get_handshake(uuid) to authenticated;

create or replace function public.accept_connect(_request_id uuid)
returns table (request_id uuid, project_title text, owner_name text, owner_contact text, applicant_name text, applicant_contact text)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.connect_requests cr join public.projects pj on pj.id = cr.project_id
                 where cr.id = _request_id and pj.user_id = auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  update public.connect_requests set status = 'accepted' where id = _request_id and status = 'pending';
  return query select * from public.get_handshake(_request_id);
end; $$;
revoke execute on function public.accept_connect(uuid) from public, anon;
grant execute on function public.accept_connect(uuid) to authenticated;

insert into public.projects (title, tagline, category, stage, entity_type, looking_for, incentive, tech_stack) values
('LensLabel','Computer-vision auto-labeling for warehouse robotics datasets. Cuts annotation cost 70% with active learning.','AI/ML','Prototype','Early Team','Computer Vision Engineer','Equity + Paid', array['PyTorch','YOLO','OpenCV','FastAPI']),
('Feedback Loop','Micro-SaaS that clusters customer feedback from Intercom & Slack into roadmap themes with LLM summaries.','SaaS','Live Revenue','Solo Founder','Growth-minded Fullstack Dev','Paid', array['Next.js','OpenAI','Postgres','Tailwind']);

insert into public.profiles (id, full_name, primary_link, direct_contact, skills) values
('00000000-0000-4000-8000-000000000001','Maya Chen','https://github.com/mayachen','maya@example.com', array['PyTorch','LangChain','FastAPI']),
('00000000-0000-4000-8000-000000000002','Diego Alvarez','https://linkedin.com/in/diegoalvarez','@diego_builds', array['Next.js','Tailwind','Postgres']),
('00000000-0000-4000-8000-000000000003','Priya Natarajan','https://priya.dev','https://calendly.com/priya', array['OpenCV','YOLO','PyTorch']);

insert into public.connect_requests (project_id, applicant_id, role_offered, pitch_sentence)
select id, '00000000-0000-4000-8000-000000000001'::uuid, 'RAG Engineer', 'Shipped a pgvector retrieval stack serving 2M queries/month with eval-gated releases.' from public.projects where title = 'Ledgerly AI'
union all
select id, '00000000-0000-4000-8000-000000000002'::uuid, 'Fullstack Engineer', 'Built and sold a Stripe analytics plugin; I know MRR dashboards inside out.' from public.projects where title = 'ShipStack'
union all
select id, '00000000-0000-4000-8000-000000000003'::uuid, 'CV Engineer', 'Led active-learning labeling pipelines at a robotics startup, 5x dataset throughput.' from public.projects where title = 'LensLabel';