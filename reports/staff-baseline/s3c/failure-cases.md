# S3-C failures, fixes and limits

- Fixed before the final regression: the Staff adapter applied daily Condition recovery and Monday training to a graduated inactive member. The active-member guard now preserves the retired member's Condition, EXP and Palette after 2014-05-11; the measured seed-1 boundary result is in `invariants.md`.
- No Calendar softlock was accepted as success; all seed terminal statuses are exported in the CSVs.
- Historical per-song setlists, initial arrangement F and graduation inheritance curve are not authoritative Scenario data. This adapter therefore uses named TUNABLE template inputs and must not be treated as a historical reconstruction.
- Personal Duty Preparation (D), Env×PE bridge and full song-part/attribute-EXP adapter remain out of scope and are not represented as completed.
