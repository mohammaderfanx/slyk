import { describe, expect, it } from "vitest";
import { contactLauncher, filterProjects, matchScore, sortProjects, type Project } from "@/lib/slyk";

const p = (o: Partial<Project>): Project => ({
  id: "1", created_at: "2026-01-01", user_id: null, title: "Alpha", tagline: "", category: "AI/ML", stage: "Idea",
  entity_type: "Solo Founder", looking_for: "", incentive: "Equity", tech_stack: [], ...o,
});
const all = { q: "", category: "all", stage: "all", incentive: "all" };

describe("filterProjects", () => {
  it("search matches tech stack", () => {
    expect(filterProjects([p({ tech_stack: ["PyTorch"] }), p({ id: "2" })], { ...all, q: "pytorch" })).toHaveLength(1);
  });
  it("fuzzy matches looking_for", () => {
    expect(filterProjects([p({ looking_for: "NLP Engineer" })], { ...all, q: "nlpeng" })).toHaveLength(1);
  });
  it("filters by category", () => {
    expect(filterProjects([p({}), p({ id: "2", category: "SaaS" })], { ...all, category: "SaaS" })[0]?.id).toBe("2");
  });
});

describe("matchScore", () => {
  it("is null without skills", () => expect(matchScore([], p({}))).toBeNull());
  it("100% when all stack and role match", () => {
    expect(matchScore(["PyTorch", "FastAPI", "ML"], p({ tech_stack: ["PyTorch", "FastAPI"], looking_for: "ML Engineer" }))).toBe(100);
  });
  it("partial coverage", () => {
    expect(matchScore(["PyTorch"], p({ tech_stack: ["PyTorch", "Swift", "CoreML"], looking_for: "iOS dev" }))).toBe(25);
  });
});

describe("sortProjects comp", () => {
  it("ranks Equity + Paid above Paid above Equity", () => {
    const r = sortProjects([p({ id: "e" }), p({ id: "ep", incentive: "Equity + Paid" }), p({ id: "pd", incentive: "Paid" })], "comp", []);
    expect(r.map((x) => x.id)).toEqual(["ep", "pd", "e"]);
  });
});

describe("contactLauncher", () => {
  it("email → mailto with prefilled message", () => {
    const l = contactLauncher("a@b.co", "Maya", "Ledgerly");
    expect(l?.kind).toBe("email");
    expect(decodeURIComponent(l!.href)).toContain("Hey Maya, I accepted your Slyk pitch for Ledgerly! Let's talk.");
  });
  it("@handle → telegram", () => expect(contactLauncher("@diego_builds", "D", "X")?.href).toMatch(/^https:\/\/t\.me\/diego_builds/));
  it("calendly", () => expect(contactLauncher("https://calendly.com/p", "P", "X")?.kind).toBe("calendly"));
});

import { pitchQuality, trustBadges, videoEmbed } from "@/lib/slyk";
describe("phase 3 helpers", () => {
  it("verified github repo → Verified Codebase", () => {
    expect(trustBadges([{ proof_type: "github_repo", verified: true }])).toEqual(["Verified Codebase"]);
    expect(trustBadges([{ proof_type: "github_repo", verified: false }])).toEqual([]);
  });
  it("relevant pitch with numbers beats a vague one", () => {
    const proj = { tech_stack: ["PyTorch", "FastAPI"], looking_for: "ML Engineer" };
    expect(pitchQuality("Shipped PyTorch + FastAPI models serving 2M requests/day.", proj, true))
      .toBeGreaterThan(pitchQuality("hi I am interested", proj, false));
  });
  it("youtube embed", () => expect(videoEmbed("https://www.youtube.com/watch?v=aircAruvnKk")).toBe("https://www.youtube-nocookie.com/embed/aircAruvnKk"));
});
