create extension if not exists vector with schema extensions;

create table public.project_embeddings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  embedding extensions.vector(1536) not null,
  content_hash text not null,
  updated_at timestamptz not null default now()
);
grant all on public.project_embeddings to service_role;
alter table public.project_embeddings enable row level security;

create table public.profile_embeddings (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  embedding extensions.vector(1536) not null,
  content_hash text not null,
  updated_at timestamptz not null default now()
);
grant all on public.profile_embeddings to service_role;
alter table public.profile_embeddings enable row level security;

create index project_embeddings_hnsw on public.project_embeddings using hnsw (embedding extensions.vector_cosine_ops);
create index profile_embeddings_hnsw on public.profile_embeddings using hnsw (embedding extensions.vector_cosine_ops);

-- Semantic similarity of the caller's profile to every project (scores only, no vectors leave the DB)
create or replace function public.my_semantic_scores()
returns table (project_id uuid, similarity float)
language sql stable security definer set search_path = public, extensions as $$
  select pe.project_id, 1 - (pe.embedding <=> me.embedding)
  from public.project_embeddings pe, public.profile_embeddings me
  where me.profile_id = auth.uid()
$$;
revoke execute on function public.my_semantic_scores() from public, anon;
grant execute on function public.my_semantic_scores() to authenticated;

-- Semantic similarity of applicants to the caller's own projects (for inbox ranking)
create or replace function public.applicant_semantic_scores()
returns table (project_id uuid, applicant_id uuid, similarity float)
language sql stable security definer set search_path = public, extensions as $$
  select r.project_id, r.applicant_id, 1 - (pe.embedding <=> ae.embedding)
  from public.connect_requests r
  join public.projects p on p.id = r.project_id and p.user_id = auth.uid()
  join public.project_embeddings pe on pe.project_id = r.project_id
  join public.profile_embeddings ae on ae.profile_id = r.applicant_id
$$;
revoke execute on function public.applicant_semantic_scores() from public, anon;
grant execute on function public.applicant_semantic_scores() to authenticated;

-- Recommended builders: semantic similarity first, skill overlap as fallback, then reputation
drop function public.recommend_builders(uuid);
create function public.recommend_builders(_project_id uuid)
returns table (id uuid, full_name text, primary_link text, skills text[], github_handle text, verification_status public.verification_status, reputation_score int, overlap int, similarity float)
language sql stable security definer set search_path = public, extensions as $$
  select pr.id, pr.full_name, pr.primary_link, pr.skills, pr.github_handle, pr.verification_status, pr.reputation_score,
    (select count(*) from unnest(pr.skills) s
      where lower(s) = any (select lower(t) from unnest(p.tech_stack) t) or position(lower(s) in lower(p.looking_for)) > 0)::int as overlap,
    case when pe.embedding is not null and ae.embedding is not null then 1 - (pe.embedding <=> ae.embedding) end as similarity
  from public.projects p
  cross join public.profiles pr
  left join public.project_embeddings pe on pe.project_id = p.id
  left join public.profile_embeddings ae on ae.profile_id = pr.id
  where p.id = _project_id and p.user_id = auth.uid() and pr.id <> p.user_id and cardinality(pr.skills) > 0
  order by coalesce(1 - (pe.embedding <=> ae.embedding), 0) desc, overlap desc, pr.reputation_score desc
  limit 5
$$;
revoke execute on function public.recommend_builders(uuid) from public, anon;
grant execute on function public.recommend_builders(uuid) to authenticated;

-- Spam filter
alter table public.connect_requests
  add column flagged boolean not null default false,
  add column flag_reason text;
grant update (flagged) on public.connect_requests to authenticated;

create or replace function public.flag_spam_pitch()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  t text := btrim(new.pitch_sentence);
  reasons text[] := '{}';
  letters int := length(regexp_replace(t, '[^A-Za-z]', '', 'g'));
  prof record;
begin
  select primary_link, skills, reputation_score into prof from public.profiles where id = new.applicant_id;
  if length(t) < 20 then reasons := reasons || 'too short'; end if;
  if length(t) > 0 and letters::float / length(t) < 0.5 then reasons := reasons || 'mostly symbols'; end if;
  if t ~ '(.)\1{5,}' then reasons := reasons || 'repeated characters'; end if;
  if (select count(*) from regexp_matches(t, 'https?://', 'g')) > 1 then reasons := reasons || 'multiple links'; end if;
  if length(t) >= 20 and t = upper(t) and letters > 10 then reasons := reasons || 'all caps'; end if;
  if (select count(*) from public.connect_requests
      where applicant_id = new.applicant_id and lower(btrim(pitch_sentence)) = lower(t)
        and created_at > now() - interval '24 hours') >= 2 then
    reasons := reasons || 'copy-pasted to many projects';
  end if;
  if length(t) < 40 and coalesce(prof.primary_link, '') = '' and cardinality(coalesce(prof.skills, '{}')) = 0 then
    reasons := reasons || 'empty profile';
  end if;
  if cardinality(reasons) > 0 then
    new.flagged := true;
    new.flag_reason := array_to_string(reasons, ', ');
  end if;
  return new;
end; $$;
create trigger connect_flag_spam before insert on public.connect_requests for each row execute function public.flag_spam_pitch();

-- Don't notify founders about filtered pitches
create or replace function public.notify_on_connect_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record; a text;
begin
  if new.flagged then return new; end if;
  select id, title, user_id into p from public.projects where id = new.project_id;
  if p.user_id is null then return new; end if;
  select coalesce(full_name,'A builder') into a from public.profiles where id = new.applicant_id;
  insert into public.notifications (user_id, type, title, message)
  values (p.user_id, 'new_connect_request', 'New pitch for ' || p.title, a || ' (' || new.role_offered || '): ' || new.pitch_sentence);
  return new;
end; $$;