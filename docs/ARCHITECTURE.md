# Multi-cohort analytics architecture

## Principle

Every diagnostic query must operate inside exactly one cohort. Cohort selection is required before question, topic, essay, glossary, location, or feedback diagnostics are interpreted.

## Registry

`analytics-cohorts.json` is the source-controlled allowlist of supported cohorts. Its `analyticsKey` must exactly match the Study cohort package's `analyticsKey`.

The build embeds this registry into the Worker. Ingestion rejects unknown cohorts. This prevents a future cohort's Question 12 from being interpreted using the current cohort's Question 12 catalog.

## Catalogs

Today there is one current question catalog and one current essay catalog. Runtime access goes through `catalogForCohort()` so the next migration can replace the current single-catalog implementation with per-cohort maps without changing event payloads.

Do not register a second cohort until:
1. each cohort has its own question and essay catalog modules;
2. dashboard categories come from the selected cohort;
3. all question/essay/fact lookups use that selected catalog;
4. feedback issue/revision/admin-action identity includes cohort.

## Dashboard

The Cohort filter is mandatory and first. Clear Filters must preserve it. URLs should preserve cohort so a shared diagnostic link remains meaningful.

Cross-cohort reporting, if ever added, should be a separate high-level usage view limited to comparable metrics such as learner counts or event volume. It must not reuse the ordinary question/topic/essay diagnostics.

## Chabura and geography

As multiple cohorts are added, options for chabura and geographic filters should be filtered by the selected cohort. Do not allow a chabura that exists only in cohort A to appear as if it belongs to cohort B.

## Feedback

Current feedback reports already store cohort, but legacy issue identity is not yet fully cohort-scoped. This is a launch blocker for a second cohort. Migrate tables and endpoints before enabling the second cohort.
