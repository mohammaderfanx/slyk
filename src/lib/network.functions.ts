import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PROFILE_COLS } from "./slyk";

function publicClient() {
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Public data unavailable");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  } } });
}
export const getPublicNetwork = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const [workspaces, links, bounties, projects] = await Promise.all([db.from("workspaces").select("*").eq("is_demo", true).order("name"), db.from("workspace_projects").select("*"), db.from("project_bounties").select("*").order("reward_amount", { ascending: false }), db.from("projects").select("*")]);
  for (const r of [workspaces, links, bounties, projects]) if (r.error) throw r.error;
  return { workspaces: workspaces.data ?? [], links: links.data ?? [], bounties: bounties.data ?? [], projects: projects.data ?? [] };
});
export const getBuilderPassport = createServerFn({ method: "GET" }).inputValidator((d: unknown) => z.object({ username: z.string().max(60) }).parse(d)).handler(async ({ data }) => {
  const db = publicClient();
  const { data: passport, error } = await db.from("builder_passports").select("*").eq("username", data.username).maybeSingle();
  if (error) throw error;
  if (!passport) return null;
  const [profile, credentials, endorsements] = await Promise.all([db.from("profiles").select(PROFILE_COLS).eq("id", passport.user_id).single(), db.from("builder_verifiable_credentials").select("*").eq("user_id", passport.user_id), db.from("builder_endorsements").select("id,skill,created_at").eq("subject_id", passport.user_id)]);
  if (profile.error) throw profile.error;
  if (credentials.error) throw credentials.error;
  if (endorsements.error) throw endorsements.error;
  return { passport, profile: profile.data, credentials: credentials.data ?? [], endorsements: endorsements.data ?? [] };
});
export const startScout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ workspaceId: z.string().uuid(), projectId: z.string().uuid() }).parse(d)).handler(async ({ data, context }) => {
  const { data: runId, error } = await context.supabase.rpc("queue_scout", { _workspace: data.workspaceId, _project: data.projectId });
  if (error) throw error;
  if (!runId) throw new Error("Scout run not created");
  const { runScout } = await import("./scout.server");
  return runScout(runId);
});