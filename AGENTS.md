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
