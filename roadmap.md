# Slyk roadmap

## Phase 2 (finish)
- [x] Header: notification bell + Cmd+K palette
- [x] Dashboard: Pending/Accepted/Archived tabs, optimistic accept/decline, contact launchers, My Pitches, skills on profile

## Phase 3
- [x] DB: builder fields on profiles, project_proofs, project_events + match_analytics view, 5 pitches/hour limit, TTFR, reputation
- [x] GitHub sync + reputation (server)
- [x] Proof verification (server) + Verified badges
- [x] Pitch quality score + applicant ranking + batch actions
- [x] Recommended builders for owners
- [x] /p/$id spotlight page: proofs gallery, JSON-LD, share links, sticky mobile connect
- [x] /analytics funnel + TTFR
- [x] /builders search page
- [x] Cmd+K: pending pitches, export, builders by stack, high-contrast toggle
- [x] Seed to 10 projects with real GitHub proofs
- [x] AI semantic matching (embeddings) for feed, inbox ranking, recommended builders
- [x] Spam pitch filter (Filtered tab, no notification)
- [ ] Blocked: per-project share images (renderer needs WebAssembly that the preview server cannot load)
- [ ] Blocked: email/Telegram alerts (need Resend or Telegram key)

## Phase 4
- [x] Secure alignment, feedback, integration settings, invites, master pitches and activity schema
- [x] Co-founder calculator, alignment editor and accepted-connection checklist
- [x] Deep-proof builder directory, verified invitation/Instant Apply RPCs and eligibility rejection checks
- [x] Integration manager and encrypted Discord routing configuration
- [x] Live anonymous presence counts, trending targets and aggregate acceptance activity
- [x] Inngest job definitions for public GitHub sync, stored-vector matching, weekly digest, routing and re-engagement
- [x] Five clearly labelled sample builders and four new sample projects
- [x] 20 tests passed; signed-in preferences and co-founder terms saved/read back; desktop/mobile settings and evidence checked; badge returned 200; privilege escalation and unverified Instant Apply rejected with 403
- [ ] Blocked: activate and verify scheduled jobs after publishing and Inngest sync; unsigned registration request returned 401
- [ ] Blocked: weekly Resend delivery needs a verified sender email, not only the display name "Slyk"; domain lookup unavailable with send-only key
- [ ] Blocked: GitHub/Slack per-user account setup skipped; Linear/Notion OAuth clients and Telegram bot credentials absent
- [ ] Blocked: external Discord delivery needs a real destination; successful invite/Instant Apply and accepted-handshake checks need a real verified builder and pending pitch
