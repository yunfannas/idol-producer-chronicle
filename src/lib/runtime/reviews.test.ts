import { describe, expect, it } from "vitest";
import { extractEvidence, generateLiveComments, selectOpinions, type SettledLiveReviewInput } from "./reviews";

const base: SettledLiveReviewInput = {
  liveId: "debut-2013-05-24",
  eventKind: "debut",
  reviewEligible: true,
  mediaEligible: true,
  teamImpression: 1.2,
  expectedImpression: 1,
  members: [
    { id: "IPC1-001", nameJa: "星野莉奈", impression: 1.5 },
    { id: "IPC1-002", nameJa: "宮原優花", impression: 1.0 },
    { id: "IPC1-003", nameJa: "小日向陽菜", impression: 0.7 },
  ],
  audience: { otaku: 30, public: 8, external: 12 },
  tokuten: { allowed: true, grossJPY: 24_000, queueLostJPY: 3_000 },
};

describe("deterministic, evidence-grounded Live review generator", () => {
  it("is deterministic and preserves private evidence traceability", () => {
    const first = generateLiveComments(base, { previousTeamSatisfaction: 1, recentEvidenceDimensions: [] }, "review-seed");
    const replay = generateLiveComments(base, { previousTeamSatisfaction: 1, recentEvidenceDimensions: [] }, "review-seed");
    expect(replay).toEqual(first);
    expect(first.comments).toHaveLength(2);
    expect(new Set(first.comments.map((comment) => comment.source)).size).toBe(first.comments.length);
    expect(new Set(first.comments.map((comment) => comment.source))).not.toEqual(new Set(["otaku", "public", "media"]));
    const ids = new Set(first.evidence.map((item) => item.id));
    for (const comment of first.comments) {
      expect(comment.evidenceIds.every((id) => ids.has(id))).toBe(true);
      expect(comment.textJa).not.toMatch(/1\.2|24000|3000/);
      expect(comment.styleVersion).toBe("review-ja-v1");
    }
  });

  it("does not fabricate reviews for an ineligible ordinary event", () => {
    const result = generateLiveComments({ ...base, liveId: "small-taiban", eventKind: "taiban", reviewEligible: false });
    expect(result.comments).toEqual([]);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("makes queue pressure and historical improvement available as separate facts", () => {
    const evidence = extractEvidence(base, { previousTeamSatisfaction: 1.02 });
    expect(evidence.some((item) => item.dimension === "tokuten-queue")).toBe(true);
    expect(evidence.some((item) => item.dimension === "improvement")).toBe(true);
    const opinions = selectOpinions(base, evidence, { recentEvidenceDimensions: ["team-performance"] }, "cooldown");
    expect(opinions.every((opinion) => evidence.find((item) => item.id === opinion.evidenceIds[0])?.dimension !== "team-performance")).toBe(true);
  });

  it("represents mixed and weak settled performances without a score-to-text shortcut", () => {
    const mixed = generateLiveComments({
      ...base,
      liveId: "regular-2014-03-05",
      eventKind: "regular",
      mediaEligible: false,
      teamImpression: 0.82,
      members: [
        { id: "IPC1-001", nameJa: "星野莉奈", impression: 1.1 },
        { id: "IPC1-002", nameJa: "宮原優花", impression: 0.45 },
      ],
      tokuten: { allowed: true, grossJPY: 8_000, queueLostJPY: 0 },
    }, {}, "mixed");
    expect(mixed.evidence.some((item) => item.dimension === "team-performance" && item.sign === "negative")).toBe(true);
    expect(mixed.comments).toHaveLength(2);
    expect(mixed.comments.some((comment) => comment.textJa.includes("0.82"))).toBe(false);
  });
});
