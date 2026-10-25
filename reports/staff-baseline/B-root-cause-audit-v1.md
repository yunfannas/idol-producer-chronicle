# B route E/E/E root-cause audit (pre-calibration baseline)

Scope: B seeds 1–100 under `staff-autoplay-scenario-v1`; no values changed for this audit.

## Fan data-flow finding

There is no duplicate event settlement, weekly decay runs once on Sunday, and P/O/A/W remain non-negative. The baseline starts `P=O=A=W=0`. Across seed 1, external contract audiences create P gradually (0.99 at May end, 24.19 in December, 61.24 at TIF); O is 0 at May end, 0.92 in December, and 2.72 at TIF. Across 100 seeds final O is 0–12.01, mean 4.3891.

This follows the current executable Fan input: external viewers convert directly to O at `.004 × Q`; the adapter's observed Q is normally `.5`, so the effective initial direct-O probability is `.002`. It is not a phantom-income or dropped-state bug. With almost no O/A, the real shared Cheki queue sees no qualified buyer; seed 1 therefore has ¥0 Cheki gross, commission and queue loss.

## Performance / growth finding

Pre-calibration seed 1 starts near 0.517 at debut, then is clamped at `Q=.5` for almost every later Live. All operational training was recorded only as fixture `trainingExp`; it did **not** change the member Palette used by `resolveOperatingPerformance`, and no arrangement familiarity existed in the adapter. This is an implementation gap, not evidence that the Fan formula should be increased.

## Revenue and cost finding

Seed 1 posts ¥2,085,500 operating revenue, ¥4,138,000 operating cost and ¥615,000 initial assets; final cash is ¥332,500 (minimum ¥231,500). Ticket revenue is the only meaningful revenue stream because the real fan state yields no Cheki buyer. The full monthly and event ledger remains in the adjacent baseline CSV/JSON files.

## Calibration order

1. Fan data flow: audited; no balance value changed.
2. Performance growth/score: implement member Palette exposure from actual rehearsal/live time only, with versioned `performanceGrowth` inputs. The first isolated rerun also found that the adapter applied loads without daily recovery, so recovery is repaired in the same Performance-only phase before interpreting a score distribution.
3. Business: defer until the new Performance/Fan output is measured.
4. Rerun B 100 seeds only after each isolated stage.
