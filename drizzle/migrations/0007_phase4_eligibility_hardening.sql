REVOKE INSERT,UPDATE ON public.profiles FROM authenticated;
GRANT INSERT(id,full_name,avatar_url,primary_link,direct_contact,skills) ON public.profiles TO authenticated;
GRANT UPDATE(full_name,avatar_url,primary_link,direct_contact,skills) ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF current_user IN ('anon','authenticated') AND (NEW.verification_status IS DISTINCT FROM OLD.verification_status OR NEW.reputation_score IS DISTINCT FROM OLD.reputation_score OR NEW.github_handle IS DISTINCT FROM OLD.github_handle OR NEW.github_stats IS DISTINCT FROM OLD.github_stats OR NEW.is_demo IS DISTINCT FROM OLD.is_demo) THEN RAISE EXCEPTION 'Verified evidence is managed by the server' USING ERRCODE='42501'; END IF; RETURN NEW; END $$;
CREATE TRIGGER profile_privileged_fields BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_fields();
CREATE OR REPLACE FUNCTION public.projects_missing_embeddings() RETURNS SETOF public.projects LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT p.* FROM public.projects p WHERE NOT p.is_demo AND NOT EXISTS(SELECT 1 FROM public.project_embeddings e WHERE e.project_id=p.id) LIMIT 20 $$;
CREATE OR REPLACE FUNCTION public.profiles_missing_embeddings() RETURNS TABLE(id uuid,skills text[],github_stats jsonb) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT p.id,p.skills,p.github_stats FROM public.profiles p WHERE NOT p.is_demo AND cardinality(p.skills)>0 AND NOT EXISTS(SELECT 1 FROM public.profile_embeddings e WHERE e.profile_id=p.id) LIMIT 20 $$;
CREATE TABLE public.autonomous_matches(builder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,score double precision NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(builder_id,project_id));
GRANT SELECT ON public.autonomous_matches TO authenticated;
GRANT ALL ON public.autonomous_matches TO service_role;
ALTER TABLE public.autonomous_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_autonomous_matches ON public.autonomous_matches FOR SELECT TO authenticated USING(builder_id=auth.uid());
CREATE OR REPLACE FUNCTION public.refresh_autonomous_matches(_uid uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; BEGIN INSERT INTO public.autonomous_matches(builder_id,project_id,score,updated_at) SELECT _uid,m.project_id,m.score,now() FROM public.weekly_builder_matches(_uid) m ON CONFLICT(builder_id,project_id) DO UPDATE SET score=excluded.score,updated_at=excluded.updated_at; GET DIAGNOSTICS n=ROW_COUNT; RETURN n; END $$;
REVOKE ALL ON FUNCTION public.refresh_autonomous_matches(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_autonomous_matches(uuid) TO service_role;