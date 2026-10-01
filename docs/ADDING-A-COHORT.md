# Adding analytics support for a new Study cohort

Do this before the Study app exposes the new cohort.

1. Read the new Study cohort's stable `id` and `analyticsKey`.
2. Generate an analytics question catalog from that cohort's canonical question bank and an essay catalog from its canonical essay/fact bank. Do not derive catalogs from stale PDFs or dashboard data.
3. Extend the analytics catalog layer so `catalogForCohort(analyticsKey)` returns that cohort's own question map, essay map, and essay-fact map.
4. Migrate feedback identity to `cohort + content_type + content_id` if this has not already been completed. The second cohort must not launch before this step.
5. Add the cohort to `analytics-cohorts.json` only after steps 2–4 are ready.
6. Make `/api/options` return that cohort and only that cohort's categories/chaburas when selected.
7. Verify ingestion rejects mismatched IDs: an ID valid only in another cohort must not validate.
8. Verify Summary, Essay Analytics, Content Feedback, Question Detail, and all URL-persisted filters stay inside the selected cohort.
9. Build, deploy, and verify the health endpoint/version before enabling the cohort in SCP Study.

Never use question number alone as a cross-cohort identity.
