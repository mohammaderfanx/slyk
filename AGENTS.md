<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Slyk architecture rules
- Private contact data (`profiles.direct_contact`) is never column-granted to clients; it is read only through security-definer RPCs gated on an accepted request. Why: keeps contacts out of every feed payload.
- Vectors live in `project_embeddings` / `profile_embeddings` with RLS and no client policies; clients get only similarity scores via RPCs. Why: embeddings are internal and costly to leak/regenerate.
- Embeddings are generated server-side (`refreshMyEmbeddings`), hash-gated so unchanged text never re-calls AI. Why: bounded AI cost.
- Spam flagging and pitch rate limits run in Postgres triggers, not app code. Why: cannot be bypassed by calling the API directly.
- Phase 4 credentials remain server-only and are encrypted through service-role-only pgcrypto RPCs. Why: routing settings must never expose credential handles or webhook secrets.
- Ecosystem jobs use Inngest signed handlers, bounded batches, database leases, durable completion markers, and persisted pause reasons. Why: concurrent schedules and retries must not duplicate work.
- Cofounder terms and checklists use participant-scoped data; invitation and Instant Apply eligibility is enforced by database RPCs. Why: browser controls are not an authorization boundary.
- Sample builders and listings are explicitly labelled and excluded from real invitations, matching digests, and automated synchronization. Why: fictional metrics must not be presented as verified evidence.
