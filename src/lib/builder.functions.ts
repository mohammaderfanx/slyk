import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GH = "https://api.github.com";
const ghHeaders = { Accept: "application/vnd.github+json", "User-Agent": "slyk-app" };

/** Pulls public GitHub stats for a handle and recomputes reputation. */
export const syncGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ handle: z.string().trim().regex(/^[A-Za-z0-9-]{1,39}$/, "Invalid GitHub username") }).parse(d))
  .handler(async ({ data, context }) => {
    const userRes = await fetch(`${GH}/users/${data.handle}`, { headers: ghHeaders });
    if (userRes.status === 404) throw new Error("GitHub user not found");
    if (!userRes.ok) throw new Error(`GitHub is unavailable right now (${userRes.status}). Try again later.`);
    const user = (await userRes.json()) as { public_repos: number; login: string };
    const reposRes = await fetch(`${GH}/users/${data.handle}/repos?per_page=100&sort=pushed`, { headers: ghHeaders });
    const repos = reposRes.ok ? ((await reposRes.json()) as { stargazers_count: number; language: string | null; fork: boolean; pushed_at: string }[]) : [];
    const own = repos.filter((r) => !r.fork);
    const langs: Record<string, number> = {};
    for (const r of own) if (r.language) langs[r.language] = (langs[r.language] ?? 0) + 1;
    // Recent activity proxy: distinct days with pushes in last 30 days
    const cutoff = Date.now() - 30 * 864e5;
    const activeDays = new Set(own.filter((r) => Date.parse(r.pushed_at) > cutoff).map((r) => r.pushed_at.slice(0, 10))).size;
    const stats = {
      public_repos: user.public_repos,
      total_stars: own.reduce((a, r) => a + r.stargazers_count, 0),
      primary_languages: Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([l]) => l),
      active_days_30d: activeDays,
      synced_at: new Date().toISOString(),
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: taken } = await supabaseAdmin.from("profiles").select("id").eq("github_handle", user.login).neq("id", context.userId).maybeSingle();
    if (taken) throw new Error("That GitHub account is already linked to another Slyk profile.");
    const { error } = await supabaseAdmin.from("profiles").update({ github_handle: user.login, github_stats: stats }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.rpc("refresh_reputation", { _uid: context.userId });
    return stats;
  });

/** Checks a proof link is real (GitHub repo exists / URL responds) and marks it verified. */
export const verifyProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ proofId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // RLS-scoped read confirms the proof exists; ownership checked via project
    const { data: proof } = await context.supabase.from("project_proofs").select("id, url, proof_type, project_id").eq("id", data.proofId).maybeSingle();
    if (!proof) throw new Error("Proof not found");
    const { data: proj } = await context.supabase.from("projects").select("user_id").eq("id", proof.project_id).maybeSingle();
    if (proj?.user_id !== context.userId) throw new Error("Not allowed");

    let ok = false;
    const repo = proof.url.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/);
    if (proof.proof_type === "github_repo") {
      if (repo) ok = (await fetch(`${GH}/repos/${repo[1]}/${repo[2]}`, { headers: ghHeaders })).ok;
    } else {
      try {
        const r = await fetch(proof.url, { method: "GET", redirect: "follow", headers: { "User-Agent": "slyk-app" } });
        ok = r.ok;
      } catch { ok = false; }
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("project_proofs").update({ verified: ok }).eq("id", proof.id);
    return { verified: ok };
  });
