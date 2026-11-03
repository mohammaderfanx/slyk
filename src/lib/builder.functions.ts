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
    const { publicGithubEvidence } = await import("./github-evidence.server");
    const {login,stats}=await publicGithubEvidence(data.handle);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: taken } = await supabaseAdmin.from("profiles").select("id").eq("github_handle", login).neq("id", context.userId).maybeSingle();
    if (taken) throw new Error("That GitHub account is already linked to another Slyk profile.");
    const { error } = await supabaseAdmin.from("profiles").update({ github_handle: login, github_stats: stats }).eq("id", context.userId);
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
