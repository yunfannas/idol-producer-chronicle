# Operating Simulation v3 — Staff Decisions & Weekly Gameplay

## Purpose and boundary

v3 tests decision consequences on top of the frozen v2
Fan × Cheki × Performance baseline. It does not alter `.05`, `P / O / A_i /
W_i`, the member-Impression conversion, Cheki products, Performance formulas,
or Finance posting rules.

This is an in-memory integration fixture, not a migration of `PrologueState`,
Calendar UI, day-advance flow, or save format. It exists to prove the Staff
proposal/confirmation contract before those production surfaces consume it.

The implementation respects the Chronicle decision boundary:

- routine training and ordinary Live work are Staff-automated;
- a proposal is viewable and has `decisionRequired: false`, so v3 does not
  create a compulsory weekly meeting;
- `confirmWeek()` is an authorization seam for Scenario-permitted workflow
  choices, such as an important lineup/setlist decision; it is not a general
  player editor for R2/R3/R4 policy.

## Weekly proposal and confirmation interface

`createOperatingSimulationV3Session(15, seed)` provides three in-memory
operations:

1. `proposeWeek()` returns the next contract, recommended decision, the
   candidate assessments, recommended actual 10-person lineup, and Staff AP
   capacity.
2. `confirmWeek(optionalOverride)` applies only an allowed fixture decision,
   schedules training, resolves one or two explicit contracts through the
   existing Performance → Fan → Cheki → Finance path, and returns a full
   weekly report.
3. `result()` returns the twelve settled reports and final state. It is not a
   serialized game state.

Each report records the selected/trained members, Staff AP used/available,
contracts, attendance, Impression/expected Impression, `A_i/W_i`, training
EXP, Condition, requested/completed/lost Cheki yen, weekly ledger revenue and
cost, and ending cash.

## Staff strategies

For rosters through ten, everyone performs. For 11–18 members, Staff selects
an actual ten-person lineup per Live. The four v3 strategies are:

| Strategy | Selection rationale | Intended trade-off |
| --- | --- | --- |
| `performance-first` | Forecast technical result from the same attributes and Condition inputs as the Live kernel, using expected failure penalties | Reliable short-term show quality, concentrated development |
| `affinity-first` | Current `A_i` | Existing supporter service and Cheki opportunity, potentially weaker or fatigued stage choices |
| `development-first` | Lowest accumulated training EXP | Rotates training/stage time to developing members, sacrificing specialist continuity |
| `condition-song-fit` | Forecast performance, current Condition, and the existing eight-color song fit | Protects availability and match quality, less focused growth |

The forecast is a Staff planning input, not a second Performance score or a
player-visible hidden metric. Actual Live Impression still comes only from the
existing performance path.

## Training, fatigue, contracts and Staff AP

The three fixture plans are conservative (4 h), normal (6 h) and aggressive
(8 h). They use the existing training-load equation; room cost is the explicit
fixture rate of ¥2,500/hour, retaining v2's ¥15,000 normal-week cost. Training
targets are the selected strategy group; non-targets rest and receive only
fixture recovery. Staff applies the existing target floors (conservative 65,
normal 55, aggressive 45), with an absolute non-essential-training floor of
Condition 25; an unsafe member is not scheduled for that training. This
implements the Condition protection rather than treating aggressive training
as a licence to force unsafe load.

Staff capacity retains the locked weekly formula. With one manager and fifteen
active members, usable Manager AP is `80 − 4×15 = 20`. v3 reserves 2 AP/hour
for the shared training session and 4 AP for each Live as explicit fixture
planning allocation. Therefore normal training plus one Live uses 16 AP;
aggressive training plus an additional Live would require 24 and is rejected,
not silently granted. Coach AP is reported separately.

The high-frequency experiment adds one named `staff-extra-taiban-week-*`
fixture contract. It contains actual receipt, nomination, venue-cost and Cheki
terms. It is the only source of its ticket income: v3 never creates ticket
revenue merely because Staff selects more Live activity.

## 12-week, 20-seed results — 15 members

All rows use the same neutral v2 initial market and seeds
`operating-v3:1…20`. Values are means. `Training` is final mean EXP per member;
`spread` is the within-roster max−min EXP, which shows how unevenly development
was allocated.

| Plan | Final O | Final ΣA | Cheki gross | Total revenue | Final cash | Lowest mean Condition | Training / spread | Attendance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Performance-first / normal | 40.06 | 29.86 | ¥34,650 | ¥109,650 | ¥2,392,720 | 39.20 | 18.80 / 24.00 | 649.05 |
| Affinity-first / normal | 40.06 | 29.85 | ¥35,150 | ¥110,150 | ¥2,393,120 | 38.43 | 19.34 / 9.30 | 649.05 |
| Development-first / normal | 40.06 | 29.56 | ¥34,150 | ¥109,150 | ¥2,392,320 | 41.11 | 16.80 / 12.00 | 649.15 |
| Condition/song-fit / conservative | 40.06 | 30.21 | ¥35,300 | ¥110,300 | ¥2,453,240 | 46.93 | 13.60 / 24.00 | 649.05 |
| Performance-first / normal + explicit extra taiban | 39.49 | 33.35 | ¥70,450 | ¥205,450 | ¥2,433,360 | 15.29 | 10.40 / 12.00 | 989.05 |
| Condition/song-fit / aggressive | 40.06 | 29.62 | ¥33,000 | ¥108,000 | ¥2,331,400 | 33.89 | 22.93 / 16.00 | 649.05 |

## Interpretation

- There is no unconditional winner. The extra contracted Live more than
  doubles Cheki/revenue and adds attendance, but reduces final O in this
  neutral fixture, lowers Condition and consumes enough Staff capacity to make
  aggressive training illegal. It is not a free growth button.
- Aggressive training creates the most growth but ends with the least cash.
  The low-Condition safeguard can skip a proposed session, so it correctly
  does not promise an always-worse health result.
- Development-first narrows training inequality versus the performance-first
  plan and changes member-level Affinity/Cheki outcomes; it gives rotation a
  measurable purpose even before a persistent career layer exists.
- The schedule-only plans have nearly identical O in this exact fixture. The
  frozen v2 team-`Q` floor is active for these low early-stage lineups, so their
  small team-Impression differences do not currently move `P→O`. Their member
  selection still changes exposure, `A_i`, Cheki and training allocation. This
  is a calibration observation to carry forward, not a reason to retune v2 in
  the Staff implementation.

## Verification

- deterministic proposal → confirmation → next proposal sequence;
- Manager AP conflicts reject the plan (aggressive training plus an extra Live
  in a 15-member roster);
- 12-week × 20-seed strategy matrix, with repeated inputs producing identical
  results;
- development allocation, explicit-contract income, training/cash trade-off,
  and low-Condition training guard;
- the existing v1/v2 Fan, Cheki, Performance and Finance tests remain intact.

## Deferred production work

1. Map these proposal and result fields into the formal GameState with stable
   `liveId`/week idempotency and save migration.
2. Let Calendar and Inbox show only Scenario-authorized proposal overrides;
   routine decisions remain Staff-automated.
3. Replace the fixture extra contract and planning allocations with approved
   Scenario contract/Staff data. Do not promote v3 fixture numbers to chapter
   policy.
