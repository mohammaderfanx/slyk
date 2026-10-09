import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Public share image for /p/$id. Reads only public project columns.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const Route = createFileRoute("/api/public/og/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[0-9a-f-]{36}$/i.test(params.id)) return new Response("Not found", { status: 404 });
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false },
          global: { fetch: (input, init) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          } },
        });
        const { data: p } = await sb.from("projects").select("title, looking_for, tech_stack, incentive, category").eq("id", params.id).maybeSingle();
        if (!p) return new Response("Not found", { status: 404 });

        const pills = p.tech_stack.slice(0, 5).map((t) =>
          `<div style="display:flex;padding:8px 18px;border-radius:999px;background:#262626;color:#d4d4d4;font-size:26px;margin-right:12px">${esc(t)}</div>`).join("");
        const html = `
<div style="display:flex;flex-direction:column;justify-content:space-between;width:1200px;height:630px;padding:64px;background:#0a0a0a;color:#fafafa;font-family:sans-serif;border:1px solid #262626">
  <div style="display:flex;align-items:center">
    <div style="display:flex;width:52px;height:52px;border-radius:10px;background:#c6f432;color:#1a2a05;font-size:32px;font-weight:700;align-items:center;justify-content:center">S</div>
    <div style="display:flex;margin-left:18px;font-size:32px;font-weight:700">Slyk</div>
    <div style="display:flex;margin-left:auto;padding:8px 18px;border:2px solid #c6f432;color:#c6f432;border-radius:999px;font-size:26px">${esc(p.incentive)}</div>
  </div>
  <div style="display:flex;flex-direction:column">
    <div style="display:flex;font-size:30px;color:#a3a3a3">${esc(p.category)} · looking for</div>
    <div style="display:flex;font-size:58px;font-weight:700;color:#c6f432;margin-top:6px">${esc(p.looking_for)}</div>
    <div style="display:flex;font-size:72px;font-weight:700;margin-top:14px">${esc(p.title)}</div>
  </div>
  <div style="display:flex">${pills}</div>
</div>`;
        const { ImageResponse } = await import("workers-og");
        const img = new ImageResponse(html, { width: 1200, height: 630 });
        const headers = new Headers(img.headers);
        headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
        return new Response(img.body, { status: 200, headers });
      },
    },
  },
});
