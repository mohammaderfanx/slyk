import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const integrationOptionsFn = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("integration_settings").select("id,provider,enabled,settings_json").eq("user_id", context.userId);
  if (error) throw error;
  const { data: preferences, error: prefError } = await context.supabase.from("builder_preferences").select("*").eq("user_id",context.userId).maybeSingle();
  if (prefError) throw prefError;
  return { integrations: data ?? [], preferences, services: { inngest: !!process.env["INNGEST_API_KEY"], resend: !!process.env["RESEND_API_KEY"], sender: !!process.env["SLYK_DIGEST_FROM"] } };
});

export const saveIntegrationRouting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ provider: z.enum(["slack","linear","notion","github","discord","telegram"]), enabled: z.boolean(), min_score: z.number().int().min(0).max(100), event: z.enum(["pitch","accepted"]), webhook: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("integration_settings").select("access_token_encrypted").eq("user_id",context.userId).eq("provider",data.provider).maybeSingle();
    if (data.webhook) {
      // Restrict outgoing destinations to provider-owned HTTPS hosts; never follow redirects.
      const url = new URL(data.webhook);
      const valid = url.protocol === "https:" && !url.username && !url.password && !url.port && ((data.provider === "discord" && url.hostname === "discord.com" && /^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname)));
      if (!valid) throw new Error("Use a valid Discord webhook on discord.com.");
      const key = process.env["SLYK_INTEGRATION_ENCRYPTION_KEY"];
      if (!key) throw new Error("Integration encryption is not configured.");
      const { error } = await supabaseAdmin.rpc("store_integration_secret",{ _uid:context.userId,_provider:data.provider,_plaintext:data.webhook,_key:key });
      if (error) throw error;
    } else if (data.enabled && !existing?.access_token_encrypted) {
      throw new Error(`${data.provider} account setup is required before enabling delivery.`);
    }
    const { error } = await supabaseAdmin.from("integration_settings").upsert({ user_id:context.userId,provider:data.provider,enabled:data.enabled,settings_json:{min_score:data.min_score,event:data.event} },{onConflict:"user_id,provider"});
    if (error) throw error;
    return { ok: true };
  });

export const saveBuilderPreferences = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ master_pitch:z.string().trim().max(300),master_role:z.string().trim().max(80),available:z.boolean(),weekly_digest:z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: identity, error: identityError } = await context.supabase.auth.getUser();
    if (identityError) throw identityError;
    const email = identity.user?.email;
    if (data.weekly_digest && !email) throw new Error("An account email is required for a digest.");
    const { error } = await context.supabase.from("builder_preferences").upsert({user_id:context.userId,...data,digest_email:email ?? null});
    if (error) throw error;
    return {ok:true};
  });

export const getReadmeBadge = createServerFn({method:"GET"}).middleware([requireSupabaseAuth])
  .inputValidator((d:unknown)=>z.object({projectId:z.string().uuid()}).parse(d))
  .handler(async({data,context})=>{
    const {data:p}=await context.supabase.from("projects").select("id,user_id").eq("id",data.projectId).maybeSingle();
    if(p?.user_id!==context.userId) throw new Error("Not allowed");
    const root="https://slykk.lovable.app";
    return `[![Built with Slyk](${root}/api/public/badges/${p.id})](${root}/p/${p.id})`;
  });