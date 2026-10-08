# Working on this interview copy

Keep the app easy to run and the claims easy to check. The README is the starting point; root `architecture.md` explains the design. Add another document only when those two cannot carry the information clearly.

Application code lives in `application/`, tests in `automated-tests/`, tooling in `development-tools/`, four PNG diagrams in `documentation/` and the import fixture in `automated-tests/`. Put local output in ignored `generated-output/`. Keep required root configuration and the lockfile. This layout is intentional for the interview handoff.

Preserve the UX, source files, revision checks and server-enforced permissions. Keep generation, tool calls and generated-app releases labelled as simulations. The AWS/E2B design is proposed infrastructure.

Run `npm run check` after a change and test affected browser journeys. `npm run eval` checks current in-memory workflows; it does not use the original project's private before/after snapshot.

Never copy credentials, private projects, dependency folders or local evidence into Git. Use your own development backend. Ask before deploying, changing a live schema or deleting data. `npm run backend` can sync a live development service.

Write Markdown in natural English, with Rishi Voice at roughly 60% rawness: direct, concrete and technically honest. Keep commands exact. No invented stories, forced slogans or unsupported claims.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`application/backend/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
