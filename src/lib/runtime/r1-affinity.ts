/**
 * R1 relationship formation is separate from R0 P/O acquisition.  Values
 * retain the pre-existing Staff Live formula and the executable-formula
 * Cheki trial candidates; they are TUNABLE, not target-count controls.
 */
export const r1AffinityFormationV1 = {
  version: "r1-affinity-formation-v1",
  existingOtakuLive: { baseProbability: 0.10, maxProbability: 0.12 },
  existingOtakuChekiTrial: { requestBaseProbability: 0.01, affinityProbability: 0.15 },
} as const;

export function existingOtakuLiveAffinityProbability(quality: number, exposureShare: number) {
  const q = Math.max(0, quality);
  return Math.min(
    r1AffinityFormationV1.existingOtakuLive.maxProbability,
    r1AffinityFormationV1.existingOtakuLive.baseProbability * Math.max(0, exposureShare) * q,
  );
}

export function existingOtakuChekiTrialRequestProbability(quality: number) {
  return Math.max(0, Math.min(1, r1AffinityFormationV1.existingOtakuChekiTrial.requestBaseProbability * Math.max(0, quality)));
}

export function existingOtakuChekiAffinityProbability() {
  return r1AffinityFormationV1.existingOtakuChekiTrial.affinityProbability;
}
