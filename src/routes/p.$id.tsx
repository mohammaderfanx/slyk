import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Github, Linkedin, ShieldCheck, Twitter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectDialog } from "@/components/ConnectDialog";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent, useMySentIds } from "@/hooks/use-slyk-data";
import { supabase } from "@/integrations/supabase/client";
import { PROOF_LABELS, githubRepoPath, trustBadges, videoEmbed, type Project, type Proof } from "@/lib/slyk";

const projectQuery = (id: string) =>
  queryOptions({
    queryKey: ["project", id],
    queryFn: async () => {
      const [{ data: p }, { data: proofs }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).maybeSingle(),
        supabase.from("project_proofs").select("*").eq("project_id", id).order("created_at"),
      ]);
      return p ? { project: p as Project, proofs: (proofs ?? []) as Proof[] } : null;
    },
  });

export const Route = createFileRoute("/p/$id")({
  loader: async ({ context, params }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound();
    const d = await context.queryClient.ensureQueryData(projectQuery(params.id));
    if (!d) throw notFound();
    return d;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Project not found — Slyk" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.project;
    const title = `${p.title} is looking for a ${p.looking_for} — Slyk`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "JobPosting",
          title: p.looking_for,
          description: p.tagline,
          datePosted: p.created_at,
          employmentType: p.incentive === "Paid" ? "CONTRACTOR" : "OTHER",
          jobLocationType: "TELECOMMUTE",
          hiringOrganization: { "@type": "Organization", name: p.title },
          skills: p.tech_stack.join(", "),
        },
        { "@type": "SoftwareApplication", name: p.title, description: p.tagline, applicationCategory: p.category },
      ],
    };
    return {
      meta: [
        { title },
        { name: "description", content: p.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: p.tagline },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }],
    };
  },
  errorComponent: ({ error }) => <p className="p-8 text-center text-muted-foreground">Couldn't load this project: {error instanceof Error ? error.message : "Unknown error"}</p>,
  notFoundComponent: () => (
    <div className="p-16 text-center">
      <p className="text-muted-foreground">This project doesn't exist or was removed.</p>
      <Button asChild className="mt-4"><Link to="/">Back to feed</Link></Button>
    </div>
  ),
  component: Spotlight,
});

function Spotlight() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(projectQuery(id));
  const { project: p, proofs } = data!;
  const { user } = useAuth();
  const sent = useMySentIds(user?.id);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  useEffect(() => { setUrl(window.location.href); trackEvent(p.id, "click"); }, [p.id]);

  const badges = trustBadges(proofs);
  const isSent = sent.data?.includes(p.id);
  const shareText = `I'm looking for a ${p.looking_for} on Slyk for ${p.title}`;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 md:pb-12">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Feed</Link>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge variant="outline">{p.entity_type}</Badge>
        <Badge variant="secondary">{p.category}</Badge>
        <Badge variant="outline">{p.stage}</Badge>
        {badges.map((b) => <Badge key={b} className="gap-1"><ShieldCheck className="h-3 w-3" /> {b}</Badge>)}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{p.tagline}</p>

      <div className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
        <Fact k="Looking for" v={p.looking_for} />
        <Fact k="Incentive" v={p.incentive} />
        <Fact k="Posted" v={new Date(p.created_at).toLocaleDateString()} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {p.tech_stack.map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{t}</span>)}
      </div>

      <div className="mt-6 hidden items-center gap-2 md:flex">
        {isSent ? <Button disabled variant="outline"><Check /> Pitch sent</Button> : <Button size="lg" onClick={() => setOpen(true)}>Connect in 1-Click</Button>}
        <ShareButtons url={url} text={shareText} />
      </div>

      {proofs.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Proof gallery</h2>
          <div className="mt-3 grid gap-3">{proofs.map((x) => <ProofCard key={x.id} proof={x} />)}</div>
        </section>
      )}

      <div className="mt-8 md:hidden"><ShareButtons url={url} text={shareText} /></div>

      {/* Sticky mobile quick-connect bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur md:hidden">
        {isSent ? <Button disabled variant="outline" className="w-full"><Check /> Pitch sent</Button> :
          <Button className="w-full" size="lg" onClick={() => setOpen(true)}>Connect in 1-Click</Button>}
      </div>
      <ConnectDialog project={open ? p : null} onClose={() => setOpen(false)} />
    </main>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return <div className="bg-card p-4"><div className="text-xs text-muted-foreground">{k}</div><div className="mt-0.5 font-medium">{v}</div></div>;
}

function ShareButtons({ url, text }: { url: string; text: string }) {
  if (!url) return null;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm"><a href={x} target="_blank" rel="noreferrer"><Twitter /> Share on X</a></Button>
      <Button asChild variant="outline" size="sm"><a href={li} target="_blank" rel="noreferrer"><Linkedin /> LinkedIn</a></Button>
    </div>
  );
}

function ProofCard({ proof }: { proof: Proof }) {
  const embed = proof.proof_type === "demo_video" ? videoEmbed(proof.url) : null;
  const repo = proof.proof_type === "github_repo" ? githubRepoPath(proof.url) : null;
  const gh = useQuery({
    queryKey: ["gh-repo", repo],
    enabled: !!repo,
    staleTime: 3600_000,
    queryFn: async () => {
      const r = await fetch(`https://api.github.com/repos/${repo}`);
      if (!r.ok) return null;
      return (await r.json()) as { stargazers_count: number; language: string | null; description: string | null };
    },
  });
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {embed && (
        <div className="aspect-video">
          <iframe src={embed} title={proof.label} className="h-full w-full" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation" />
        </div>
      )}
      <a href={proof.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 hover:bg-accent/40">
        {repo ? <Github className="h-5 w-5 shrink-0" /> : <ExternalLink className="h-5 w-5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-medium">
            {proof.label}
            {proof.verified && <ShieldCheck className="h-4 w-4 text-success" aria-label="Verified" />}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {repo ? `${repo}${gh.data ? ` · ★ ${gh.data.stargazers_count.toLocaleString()}${gh.data.language ? ` · ${gh.data.language}` : ""}` : ""}` : PROOF_LABELS[proof.proof_type]}
          </div>
        </div>
      </a>
    </div>
  );
}
