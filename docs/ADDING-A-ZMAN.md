# Adding analytics support for a new Zman

Complete this before SCP Study exposes the new Zman.

1. Choose a permanent machine ID such as `2026-winter` and a separate human display name.
2. Generate question and essay catalogs from the Study repository's canonical Zman package, not PDFs or old dashboard data.
3. Extend the catalog layer so `catalogForZman(zmanId)` returns that Zman's question, essay, and essay-fact maps.
4. Verify feedback issue identity, learner profiles, notifications, and admin actions remain isolated by Zman.
5. Add the Zman to `analytics-zmanim.json`, setting `latestZmanId` when it should become the default dashboard selection.
6. Make options/category/chabura data reflect the selected Zman.
7. Verify ingestion rejects IDs that only exist in a different Zman.
8. Verify Summary, Essay Analytics, Content Feedback, Question Detail, and URL-persisted filters remain inside the selected Zman.
9. Build, commit to `main`, require a successful Cloudflare Workers Builds check, and then enable the Zman in SCP Study.

Never use question number, essay ID, or fact ID alone as a cross-Zman identity.
