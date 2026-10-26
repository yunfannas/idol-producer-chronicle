# Chronicle C3 active Public conversion — actual Runtime 100-seed sweep

- Runtime commit: `39d627a1ccb8ee6f8c3bcd3beca314d897779d1f`
- B/S3-C, C3 only. All five groups use seeds 1–100; only activePublicToOtakuRate changes.
- Current/reference candidate 0.35; requested candidate 0.10.
- Non-conversion mechanics use the same Runtime and parameters; no independent Python population model.

|Rate|P|O (p10–p90)|P attendance|P→O|ΣA|Cheki gross|Cash|
|---|---:|---:|---:|---:|---:|---:|---:|
|0.1|599.557141|275.737739 (256.79578–291.439065)|3530.19|254.74|272.468661|¥713000|¥886787.5|
|0.15|511.80339|368.731451 (350.868066–386.802237)|3270.95|350.9|368.89299|¥953290|¥1079019.5|
|0.2|438.271083|447.161209 (428.990382–461.815389)|3036.55|432.05|449.775685|¥1166360|¥1249475.5|
|0.25|374.741082|515.556231 (500.801758–532.404422)|2826.43|502.81|520.93767|¥1355920|¥1401123.5|
|0.35|284.238173|614.038283 (596.439262–630.18101)|2472.35|605.89|623.170753|¥1681050|¥1661227.5|

- Structural + replay failures: 0 / 500.
- See seeds.csv, events.csv, members.csv, checkpoints.csv, assertions.json and config.json.
- Checkpoint states are taken from the latest *weekly* closure not after each individual event; graduation/one-man boundary dates may be between weekly settlements.
- Do not select a rate only by proximity to O≈300. Assess staged growth, attendance/unique-source assumptions and A distribution.
