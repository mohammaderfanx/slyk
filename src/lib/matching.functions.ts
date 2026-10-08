import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Re-embeds the caller's profile and own projects when their text changed.
 * Idempotent: unchanged content (same hash) is skipped, so no AI call is made.
 */
export const refreshMyEmbeddings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { embed, hashText, profileText, projectText, toPgVector } = await import("./embeddings.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;

    const [{ data: prof }, { data: projects }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, skills, github_stats").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("projects").select("id, title, tagline, looking_for, tech_stack, category").eq("user_id", uid).limit(20),
    ]);

    type Job = { kind: "profile" | "project"; id: string; text: string; hash: string };
    const jobs: Job[] = [];
    if (prof && prof.skills.length) {
      const text = profileText(prof);
      jobs.push({ kind: "profile", id: prof.id, text, hash: await hashText(text) });
    }
    for (const p of projects ?? []) {
      const text = projectText(p);
      jobs.push({ kind: "project", id: p.id, text, hash: await hashText(text) });
    }
    if (!jobs.length) return { updated: 0 };

    const [{ data: pe }, { data: fe }] = await Promise.all([
      supabaseAdmin.from("project_embeddings").select("project_id, content_hash").in("project_id", jobs.filter((j) => j.kind === "project").map((j) => j.id)),
      supabaseAdmin.from("profile_embeddings").select("profile_id, content_hash").eq("profile_id", uid),
    ]);
    const existing = new Map<string, string>([
      ...(pe ?? []).map((r) => [`project:${r.project_id}`, r.content_hash] as [string, string]),
      ...(fe ?? []).map((r) => [`profile:${r.profile_id}`, r.content_hash] as [string, string]),
    ]);
    const stale = jobs.filter((j) => existing.get(`${j.kind}:${j.id}`) !== j.hash);
    if (!stale.length) return { updated: 0 };

    const vectors = await embed(stale.map((j) => j.text));
    for (const [i, j] of stale.entries()) {
      const row = { embedding: toPgVector(vectors[i]!), content_hash: j.hash, updated_at: new Date().toISOString() };
      const { error } = j.kind === "project"
        ? await supabaseAdmin.from("project_embeddings").upsert({ project_id: j.id, ...row })
        : await supabaseAdmin.from("profile_embeddings").upsert({ profile_id: j.id, ...row });
      if (error) throw new Error(error.message);
    }
    return { updated: stale.length };
  });
