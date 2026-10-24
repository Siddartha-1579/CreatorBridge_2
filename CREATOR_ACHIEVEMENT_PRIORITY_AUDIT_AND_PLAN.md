# Creator Achievement & Priority System — Audit and Implementation Plan

## Existing algorithm audit (before changes)

### Matching
- The central implementation is `backend/app/services/matching_service.py`.
- The existing match fit is an explainable seven-factor weighted score: skills/portfolio 30%, niche 20%, format/platform 15%, audience 10%, budget 10%, timeline/availability 10%, preferences/values 5%.
- Existing match fit is returned as `overall_match_score`. The current engine reads creator profile reputation and verification inside the skills factor, and sorts by overall score.
- Creator recommendations for briefs use a separate simplified tool/skill overlap calculation and can fall back to hard-coded sample briefs when no real briefs are available. This patch does not change that recommendation fallback.
- Match computation currently loads at most 50 creator profiles before scoring. It does not implement a strict universal hard-requirement eligibility gate; therefore the achievement bonus is capped and must not be interpreted as a replacement for fit checks.

### Trust
- The trust engine is in `backend/app/services/trust_engine.py`; `backend/app/repositories/trust_repository.py` holds the incident/case ledger.
- Trust is calculated from confirmed active incidents and qualifying time-based recovery. Its existing incident/recovery policy is separate from the creator profile's `reputation_score`.
- The current trust repository shown in the source uses in-memory dictionaries for cases/incidents rather than the SQLite persistence used by profile/workspace repositories. That is an existing persistence gap; this feature deliberately does not mix achievement points into trust and does not claim to fix that gap.

## Feature rules

1. **Achievement points** are awarded once per engagement, only when a trusted server-side workflow verifies acceptance. Client-supplied requests cannot mint points.
2. **Quality rubric** (each input 0–100): quality 40%, timeliness 25%, brief compliance 20%, collaboration 15%. Timeliness is currently derived from completion and deadline timestamps. No deadline receives a neutral 75 score; late delivery receives 60. This is a proposed initial policy and should be calibrated against actual reviewed projects.
3. **Lifetime points** accumulate and provide a capped long-term ranking bonus of up to 5 points.
4. **Spendable balance** can be used for temporary boosts of 10–100 points, lasting 24 hours, optionally scoped to one brief. Temporary bonus is capped at 8 points.
5. **Trust remains separate.** Achievement points do not raise, offset, or erase trust demerits. Trust changes only through the existing verified incident/appeal/time-based recovery policy.
6. **Transparency:** match fit, lifetime points, long-term bonus, temporary bonus and final priority score are separate fields. The original fit score is not overwritten.
7. **Integrity:** SQLite transactions guard point spending; unique engagement IDs prevent duplicate awards; no public award endpoint exists.

## Files changed

- `backend/app/services/achievement_service.py`: persistent SQLite ledger, idempotent award method, balances, scoring, active boost lookup and spending.
- `backend/app/api/v1/endpoints/achievements.py`: authenticated creator summary and point-spending endpoint, plus public reputation summary without private balances.
- `backend/app/api/v1/api.py`: registers the new router.
- `backend/app/services/matching_service.py`: reads persisted achievement reputation/active boosts and ranks using a capped, separately exposed priority score.
- `backend/app/schemas/match.py`: additive response fields with defaults to preserve compatibility.

## Rollout plan / remaining integration

1. Run backend tests and verify the deployed database uses a durable Railway volume or Supabase persistence. The current app's SQLite database is file-backed; a container filesystem without a persistent volume is not durable across replacement.
2. Integrate `achievement_service.record_verified_completion(...)` into the real brand acceptance/completion transaction after server-side authorization, evidence review, and delivery/deadline verification. Do not call it from a creator-controlled endpoint. Existing project workspace updates do not yet carry a structured verified quality rubric, so the award hook is intentionally not guessed or auto-triggered by a generic status change.
3. Add UI to show points, event history, active boosts, and a clear confirmation before spending points. Keep API responses as the source of truth.
4. Add tests for duplicate awards, invalid scores, insufficient balances, boost expiry/brief scope, role restrictions, and ranking order; run full backend/frontend CI before merge.
5. Review and resolve the existing trust-ledger persistence gap separately before relying on trust history across process restarts.

## Important limitation
This is a staged implementation branch, not a deployment. The backend ledger and API are added, but the award method still requires integration with the existing verified brand-delivery acceptance workflow before creators can earn points from ordinary project completion. Do not present awards or priority boosts as production-ready until that integration, automated tests, and persistent hosting storage are verified.


## Priority duration tier update

The server now calculates temporary boost duration from the points actually spent: 10–24 points = 1 hour; 25–49 = 6 hours; 50–99 = 12 hours; 100 points = 24 hours. The server computes and persists the expiry; frontend display is only a preview. This is a declared product rule, not a claim about market prices. It must be reviewed and communicated to users before production rollout. The point-spending/boost ledger remains SQLite-backed, so durable hosting storage still needs verification. Automated tests were updated but have not been executed in this tool session.
