CREATE OR REPLACE FUNCTION public.routing_match_score(_request_id uuid) RETURNS double precision LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,extensions AS $$ SELECT 1-(p.embedding <=> a.embedding) FROM public.connect_requests r JOIN public.project_embeddings p ON p.project_id=r.project_id JOIN public.profile_embeddings a ON a.profile_id=r.applicant_id WHERE r.id=_request_id $$;
REVOKE ALL ON FUNCTION public.routing_match_score(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.routing_match_score(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.public_project_badge(_project_id uuid) RETURNS TABLE(looking_for text,applicants bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT p.looking_for,(SELECT count(*) FROM public.connect_requests r WHERE r.project_id=p.id AND NOT r.flagged) FROM public.projects p WHERE p.id=_project_id $$;
REVOKE ALL ON FUNCTION public.public_project_badge(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_project_badge(uuid) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.available_builders() RETURNS TABLE(id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT p.id FROM public.profiles p LEFT JOIN public.builder_preferences b ON b.user_id=p.id WHERE coalesce(b.available,true) $$;
REVOKE ALL ON FUNCTION public.available_builders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.available_builders() TO anon,authenticated;