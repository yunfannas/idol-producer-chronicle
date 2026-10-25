import { createSeededRandom } from "./random";

export type ReviewSource = "otaku" | "public" | "media";
export type ReviewEvidenceDimension = "team-performance" | "member-highlight" | "member-caveat" | "first-impression" | "tokuten-flow" | "tokuten-queue" | "improvement";
export type ReviewEvidenceSign = "positive" | "negative" | "mixed";

export type SettledLiveReviewInput = {
  liveId: string;
  eventKind: "debut" | "taiban" | "regular" | "one-man" | "festival";
  reviewEligible: boolean;
  mediaEligible?: boolean;
  teamImpression: number;
  expectedImpression: number;
  members: Array<{ id: string; nameJa: string; impression: number }>;
  audience: { otaku: number; public: number; external: number };
  tokuten?: { allowed: boolean; grossJPY: number; queueLostJPY: number };
};

export type ReviewHistory = {
  previousTeamSatisfaction?: number;
  recentEvidenceDimensions?: ReviewEvidenceDimension[];
};

export type LiveReviewEvidence = {
  id: string;
  dimension: ReviewEvidenceDimension;
  sign: ReviewEvidenceSign;
  magnitude: number;
  memberId?: string;
  memberNameJa?: string;
};

export type ReviewOpinion = { source: ReviewSource; evidenceIds: string[] };
export type RenderedLiveComment = {
  liveId: string;
  source: ReviewSource;
  textJa: string;
  evidenceIds: string[];
  styleVersion: "review-ja-v1";
  seed: string;
};

function evidenceId(input: SettledLiveReviewInput, dimension: ReviewEvidenceDimension, memberId?: string) {
  return `${input.liveId}:${dimension}${memberId ? `:${memberId}` : ""}`;
}

/** Extracts only facts already present in the settled Live outcome. */
export function extractEvidence(input: SettledLiveReviewInput, history: ReviewHistory = {}): LiveReviewEvidence[] {
  if (input.expectedImpression <= 0) throw new Error("Expected Impression must be positive for review evidence");
  const satisfaction = input.teamImpression / input.expectedImpression;
  const evidence: LiveReviewEvidence[] = [];
  if (satisfaction >= 1.05 || satisfaction <= 0.95) {
    evidence.push({
      id: evidenceId(input, "team-performance"), dimension: "team-performance",
      sign: satisfaction >= 1.05 ? "positive" : "negative", magnitude: Math.abs(satisfaction - 1),
    });
  }
  const meanMemberImpression = input.members.reduce((sum, member) => sum + member.impression, 0) / Math.max(1, input.members.length);
  for (const member of input.members) {
    if (meanMemberImpression <= 0) continue;
    const relative = member.impression / meanMemberImpression;
    if (relative >= 1.16) evidence.push({
      id: evidenceId(input, "member-highlight", member.id), dimension: "member-highlight", sign: "positive",
      magnitude: relative - 1, memberId: member.id, memberNameJa: member.nameJa,
    });
    if (relative <= 0.82) evidence.push({
      id: evidenceId(input, "member-caveat", member.id), dimension: "member-caveat", sign: "mixed",
      magnitude: 1 - relative, memberId: member.id, memberNameJa: member.nameJa,
    });
  }
  if (input.audience.public + input.audience.external > 0) {
    evidence.push({
      id: evidenceId(input, "first-impression"), dimension: "first-impression", sign: "mixed",
      magnitude: input.audience.external / Math.max(1, input.audience.otaku + input.audience.public + input.audience.external),
    });
  }
  if (input.tokuten?.allowed && input.tokuten.grossJPY > 0) {
    const lostRatio = input.tokuten.queueLostJPY / Math.max(1, input.tokuten.grossJPY + input.tokuten.queueLostJPY);
    evidence.push({
      id: evidenceId(input, lostRatio > 0 ? "tokuten-queue" : "tokuten-flow"),
      dimension: lostRatio > 0 ? "tokuten-queue" : "tokuten-flow",
      sign: lostRatio > 0 ? "negative" : "positive", magnitude: lostRatio > 0 ? lostRatio : 0.1,
    });
  }
  if (history.previousTeamSatisfaction !== undefined && satisfaction - history.previousTeamSatisfaction >= 0.08) {
    evidence.push({
      id: evidenceId(input, "improvement"), dimension: "improvement", sign: "positive",
      magnitude: satisfaction - history.previousTeamSatisfaction,
    });
  }
  return evidence;
}

function sourceCanNotice(source: ReviewSource, evidence: LiveReviewEvidence) {
  if (source === "otaku") return ["member-highlight", "member-caveat", "tokuten-flow", "tokuten-queue", "improvement", "team-performance"].includes(evidence.dimension);
  if (source === "public") return ["team-performance", "member-highlight", "first-impression"].includes(evidence.dimension);
  return ["team-performance", "member-highlight", "improvement"].includes(evidence.dimension);
}

function shuffled<T>(items: T[], random: () => number) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

/** Selects one or two source perspectives; it never requires every source. */
export function selectOpinions(input: SettledLiveReviewInput, evidence: LiveReviewEvidence[], history: ReviewHistory = {}, seed = input.liveId): ReviewOpinion[] {
  if (!input.reviewEligible || evidence.length === 0) return [];
  const random = createSeededRandom(`review:opinions:${seed}`);
  const sources: ReviewSource[] = [];
  if (input.audience.otaku > 0 || input.tokuten?.grossJPY || input.tokuten?.queueLostJPY) sources.push("otaku");
  if (input.audience.public + input.audience.external > 0) sources.push("public");
  if (input.mediaEligible && ["debut", "one-man", "festival"].includes(input.eventKind)) sources.push("media");
  const selectedSources = shuffled(sources, random).slice(0, Math.min(2, sources.length));
  const recentlyUsed = new Set(history.recentEvidenceDimensions ?? []);
  const usedDimensions = new Set<ReviewEvidenceDimension>();
  return selectedSources.flatMap((source) => {
    const relevant = evidence.filter((item) => sourceCanNotice(source, item));
    const fresh = relevant.filter((item) => !recentlyUsed.has(item.dimension) && !usedDimensions.has(item.dimension));
    const pool = fresh.length > 0 ? fresh : relevant.filter((item) => !usedDimensions.has(item.dimension));
    if (pool.length === 0) return [];
    const picked = shuffled(pool, random).sort((left, right) => right.magnitude - left.magnitude)[0];
    usedDimensions.add(picked.dimension);
    return [{ source, evidenceIds: [picked.id] }];
  });
}

const templates: Record<ReviewSource, Record<ReviewEvidenceDimension, (evidence: LiveReviewEvidence) => string>> = {
  otaku: {
    "team-performance": (item) => item.sign === "positive" ? "今日のステージ、全体のまとまりがいつもより強く感じた。" : "まだ揃いきらない場面はあったけど、次の変化も見届けたい。",
    "member-highlight": (item) => `${item.memberNameJa}の表情が、終演してからも頭に残ってる。`,
    "member-caveat": (item) => `${item.memberNameJa}は少し硬さが見えたかも。でも目が離せなかった。`,
    "first-impression": () => "初見らしい人が、終演後もステージの話をしていた。",
    "tokuten-flow": () => "終演後も流れがよくて、気持ちよく会いに行けた。",
    "tokuten-queue": () => "終演後の列はかなり伸びていた。次はもう少し早く並びたい。",
    improvement: () => "前に見たときより、見せ方が一段まとまっていた気がする。",
  },
  public: {
    "team-performance": (item) => item.sign === "positive" ? "初めて見たけれど、自然と目がステージに向いた。" : "気になる子がいたので、次の機会にもう一度見てみたい。",
    "member-highlight": (item) => `${item.memberNameJa}さんの表情が印象に残りました。`,
    "member-caveat": (item) => `${item.memberNameJa}さんのことが少し気になりました。`,
    "first-impression": () => "通りがかりだったけれど、足を止めて見入ってしまった。",
    "tokuten-flow": () => "終演後も会場の空気が明るかった。",
    "tokuten-queue": () => "終演後は人が集まっていて、熱気があった。",
    improvement: () => "前よりもチームらしさが伝わってきた。",
  },
  media: {
    "team-performance": (item) => item.sign === "positive" ? "限られた尺の中でも、グループの輪郭を示したステージだった。" : "課題を残しつつも、次の伸びしろを感じさせる内容だった。",
    "member-highlight": (item) => `${item.memberNameJa}の存在感が、舞台全体の印象を支えた。`,
    "member-caveat": (item) => `${item.memberNameJa}には、今後の変化を期待したい。`,
    "first-impression": () => "初見の観客にも届く導線が見えた。",
    "tokuten-flow": () => "終演後まで含めて、無理のない運営が保たれていた。",
    "tokuten-queue": () => "終演後の導線には、改善の余地が見える。",
    improvement: () => "前回からの修正が、舞台の見え方に表れていた。",
  },
};

/** Renders from a static Japanese library. It performs no network or model call. */
export function realizeJapanese(input: SettledLiveReviewInput, opinion: ReviewOpinion, evidence: LiveReviewEvidence[], seed: string): RenderedLiveComment {
  const primary = evidence.find((item) => item.id === opinion.evidenceIds[0]);
  if (!primary) throw new Error("Review opinion references missing evidence");
  return {
    liveId: input.liveId,
    source: opinion.source,
    textJa: templates[opinion.source][primary.dimension](primary),
    evidenceIds: opinion.evidenceIds,
    styleVersion: "review-ja-v1",
    seed,
  };
}

/** Editorial pass keeps source/dimension variety and applies recent-topic cooldown. */
export function curateComments(comments: RenderedLiveComment[], evidence: LiveReviewEvidence[], history: ReviewHistory = {}) {
  const recent = new Set(history.recentEvidenceDimensions ?? []);
  const usedSources = new Set<ReviewSource>();
  const usedDimensions = new Set<ReviewEvidenceDimension>();
  const byId = new Map(evidence.map((item) => [item.id, item]));
  return comments.filter((comment) => {
    const dimension = byId.get(comment.evidenceIds[0])?.dimension;
    if (!dimension || usedSources.has(comment.source) || usedDimensions.has(dimension) || recent.has(dimension)) return false;
    usedSources.add(comment.source);
    usedDimensions.add(dimension);
    return true;
  }).slice(0, 2);
}

export function generateLiveComments(input: SettledLiveReviewInput, history: ReviewHistory = {}, seed = input.liveId) {
  const evidence = extractEvidence(input, history);
  const opinions = selectOpinions(input, evidence, history, seed);
  const candidates = opinions.map((opinion, index) => realizeJapanese(input, opinion, evidence, `${seed}:${index + 1}`));
  return { evidence, comments: curateComments(candidates, evidence, history) };
}
