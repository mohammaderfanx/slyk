create or replace function public.projects_missing_embeddings()
returns setof public.projects language sql stable security definer set search_path = public as $$
  select p.* from public.projects p
  where not exists (select 1 from public.project_embeddings e where e.project_id = p.id)
  limit 20
$$;
create or replace function public.profiles_missing_embeddings()
returns table (id uuid, skills text[], github_stats jsonb) language sql stable security definer set search_path = public as $$
  select p.id, p.skills, p.github_stats from public.profiles p
  where cardinality(p.skills) > 0 and not exists (select 1 from public.profile_embeddings e where e.profile_id = p.id)
  limit 20
$$;
revoke execute on function public.projects_missing_embeddings() from public, anon, authenticated;
revoke execute on function public.profiles_missing_embeddings() from public, anon, authenticated;
grant execute on function public.projects_missing_embeddings() to service_role;
grant execute on function public.profiles_missing_embeddings() to service_role;