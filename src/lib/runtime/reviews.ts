import { createSeededRandom } from "./random";

export type ReviewSource = "otaku" | "public" | "media";
export type ReviewEvidenceDimension =
  | "team-performance"
  | "team-cohesion"
  | "member-highlight"
  | "member-caveat"
  | "song-highlight"
  | "song-caveat"
  | "mc-rapport"
  | "mc-caveat"
  | "first-impression"
  | "audience-response"
  | "tokuten-flow"
  | "tokuten-queue"
  | "production-flow"
  | "production-caveat"
  | "improvement";
export type ReviewEvidenceSign = "positive" | "negative" | "mixed";
export type ReviewOpinionAct = "notice" | "praise" | "caveat" | "comparison" | "return-intent";

export type SettledLiveReviewInput = {
  liveId: string;
  eventKind: "debut" | "taiban" | "regular" | "one-man" | "festival";
  /** The completed contract/report decides whether this event receives commentary. */
  reviewEligible: boolean;
  /** Actual press/newsworthiness recorded by the completed event, never inferred from performance. */
  mediaEligible?: boolean;
  teamImpression: number;
  expectedImpression: number;
  members: Array<{ id: string; nameJa: string; impression: number }>;
  songs?: Array<{ id: string; titleJa: string; impression: number; expectedImpression: number }>;
  mc?: { reception: "warm" | "uneven" };
  stageManagement?: { execution: "smooth" | "uneven" };
  audience: { otaku: number; public: number; external: number; expectedTotal?: number };
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
  songId?: string;
  songTitleJa?: string;
};

export type ReviewOpinion = { source: ReviewSource; evidenceIds: string[]; act: ReviewOpinionAct };
export type RenderedLiveComment = {
  liveId: string;
  source: ReviewSource;
  textJa: string;
  evidenceIds: string[];
  styleVersion: "review-ja-v2";
  seed: string;
};

function evidenceId(input: SettledLiveReviewInput, dimension: ReviewEvidenceDimension, subjectId?: string) {
  return `${input.liveId}:${dimension}${subjectId ? `:${subjectId}` : ""}`;
}

function addEvidence(
  evidence: LiveReviewEvidence[],
  input: SettledLiveReviewInput,
  dimension: ReviewEvidenceDimension,
  sign: ReviewEvidenceSign,
  magnitude: number,
  subject: Partial<Pick<LiveReviewEvidence, "memberId" | "memberNameJa" | "songId" | "songTitleJa">> = {},
) {
  evidence.push({ id: evidenceId(input, dimension, subject.memberId ?? subject.songId), dimension, sign, magnitude, ...subject });
}

/** Extracts only observed or calculated facts from an already-settled Live report. */
export function extractEvidence(input: SettledLiveReviewInput, history: ReviewHistory = {}): LiveReviewEvidence[] {
  if (input.expectedImpression <= 0) throw new Error("Expected Impression must be positive for review evidence");
  const satisfaction = input.teamImpression / input.expectedImpression;
  const evidence: LiveReviewEvidence[] = [];

  if (satisfaction >= 1.05 || satisfaction <= 0.95) {
    addEvidence(evidence, input, "team-performance", satisfaction >= 1.05 ? "positive" : "negative", Math.abs(satisfaction - 1));
  }

  const meanMemberImpression = input.members.reduce((sum, member) => sum + member.impression, 0) / Math.max(1, input.members.length);
  if (input.members.length > 1 && meanMemberImpression > 0) {
    const spread = (Math.max(...input.members.map((member) => member.impression)) - Math.min(...input.members.map((member) => member.impression))) / meanMemberImpression;
    if (spread <= 0.22 || spread >= 0.65) {
      addEvidence(evidence, input, "team-cohesion", spread <= 0.22 ? "positive" : "mixed", Math.abs(spread - 0.22));
    }
  }
  for (const member of input.members) {
    if (meanMemberImpression <= 0) continue;
    const relative = member.impression / meanMemberImpression;
    if (relative >= 1.16) addEvidence(evidence, input, "member-highlight", "positive", relative - 1, { memberId: member.id, memberNameJa: member.nameJa });
    if (relative <= 0.82) addEvidence(evidence, input, "member-caveat", "mixed", 1 - relative, { memberId: member.id, memberNameJa: member.nameJa });
  }

  for (const song of input.songs ?? []) {
    if (song.expectedImpression <= 0) continue;
    const quality = song.impression / song.expectedImpression;
    if (quality >= 1.1 || quality <= 0.9) {
      addEvidence(evidence, input, quality >= 1.1 ? "song-highlight" : "song-caveat", quality >= 1.1 ? "positive" : "mixed", Math.abs(quality - 1), { songId: song.id, songTitleJa: song.titleJa });
    }
  }
  if (input.mc) addEvidence(evidence, input, input.mc.reception === "warm" ? "mc-rapport" : "mc-caveat", input.mc.reception === "warm" ? "positive" : "mixed", 0.1);
  if (input.stageManagement) addEvidence(evidence, input, input.stageManagement.execution === "smooth" ? "production-flow" : "production-caveat", input.stageManagement.execution === "smooth" ? "positive" : "mixed", 0.1);

  const totalAudience = input.audience.otaku + input.audience.public + input.audience.external;
  if (input.audience.public + input.audience.external > 0) addEvidence(evidence, input, "first-impression", "mixed", input.audience.external / Math.max(1, totalAudience));
  if (input.audience.expectedTotal && input.audience.expectedTotal > 0) {
    const attendanceRatio = totalAudience / input.audience.expectedTotal;
    if (attendanceRatio >= 1.15 || attendanceRatio <= 0.8) addEvidence(evidence, input, "audience-response", attendanceRatio >= 1.15 ? "positive" : "mixed", Math.abs(attendanceRatio - 1));
  }
  if (input.tokuten?.allowed && input.tokuten.grossJPY > 0) {
    const lostRatio = input.tokuten.queueLostJPY / Math.max(1, input.tokuten.grossJPY + input.tokuten.queueLostJPY);
    addEvidence(evidence, input, lostRatio > 0 ? "tokuten-queue" : "tokuten-flow", lostRatio > 0 ? "negative" : "positive", lostRatio || 0.1);
  }
  if (history.previousTeamSatisfaction !== undefined && satisfaction - history.previousTeamSatisfaction >= 0.08) {
    addEvidence(evidence, input, "improvement", "positive", satisfaction - history.previousTeamSatisfaction);
  }
  return evidence;
}

function sourceCanNotice(source: ReviewSource, evidence: LiveReviewEvidence) {
  if (source === "otaku") return true;
  if (source === "public") return !["member-caveat", "song-caveat", "tokuten-flow", "tokuten-queue"].includes(evidence.dimension);
  return ["team-performance", "team-cohesion", "member-highlight", "song-highlight", "audience-response", "production-flow", "production-caveat", "improvement"].includes(evidence.dimension);
}

function shuffled<T>(items: T[], random: () => number) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function opinionActs(evidence: LiveReviewEvidence): ReviewOpinionAct[] {
  if (evidence.dimension === "improvement") return ["comparison", "praise", "return-intent"];
  if (evidence.sign === "negative" || evidence.sign === "mixed") return ["notice", "caveat", "return-intent"];
  return ["notice", "praise", "return-intent"];
}

/** Selects one or two distinct perspectives; no report is required to use every source. */
export function selectOpinions(input: SettledLiveReviewInput, evidence: LiveReviewEvidence[], history: ReviewHistory = {}, seed = input.liveId): ReviewOpinion[] {
  if (!input.reviewEligible || evidence.length === 0) return [];
  const random = createSeededRandom(`review:opinions:${seed}`);
  const sources: ReviewSource[] = [];
  if (input.audience.otaku > 0 || input.tokuten?.grossJPY || input.tokuten?.queueLostJPY) sources.push("otaku");
  if (input.audience.public + input.audience.external > 0) sources.push("public");
  if (input.mediaEligible && ["debut", "one-man", "festival"].includes(input.eventKind)) sources.push("media");
  const selectedSources = shuffled(sources, random).slice(0, Math.min(2, sources.length));
  const recent = new Set(history.recentEvidenceDimensions ?? []);
  const usedDimensions = new Set<ReviewEvidenceDimension>();
  return selectedSources.flatMap((source) => {
    const relevant = evidence.filter((item) => sourceCanNotice(source, item));
    const fresh = relevant.filter((item) => !recent.has(item.dimension) && !usedDimensions.has(item.dimension));
    const pool = fresh.length > 0 ? fresh : relevant.filter((item) => !usedDimensions.has(item.dimension));
    if (pool.length === 0) return [];
    const picked = shuffled(pool, random).sort((left, right) => right.magnitude - left.magnitude)[0];
    usedDimensions.add(picked.dimension);
    const act = shuffled(opinionActs(picked), random)[0];
    return [{ source, evidenceIds: [picked.id], act }];
  });
}

function phrases(item: LiveReviewEvidence): string[] {
  const name = item.memberNameJa ?? "そのメンバー";
  const song = item.songTitleJa ? `「${item.songTitleJa}」` : "その曲";
  switch (item.dimension) {
    case "team-performance": return item.sign === "positive"
      ? ["ステージ全体に芯が通っていた", "曲ごとの切り替えに勢いがあった", "最後まで集中が途切れなかった"]
      : ["全体の呼吸がまだそろいきらない場面があった", "切り替えで少し迷いが見えた", "形になるまでにもう一歩必要そうだった"];
    case "team-cohesion": return item.sign === "positive"
      ? ["一人ひとりの動きが自然につながっていた", "全員で同じ方向を向けていた", "見せ場の受け渡しがきれいだった"]
      : ["見せ場ごとの熱量に差が出ていた", "全体のまとまりはこれから作れそうだった", "個々の良さがまだ一つに結びつききっていなかった"];
    case "member-highlight": return [`${name}の表情が強く残った`, `${name}が空気を引き寄せていた`, `${name}の視線の置き方が印象的だった`];
    case "member-caveat": return [`${name}には少し硬さが見えた`, `${name}は力を出し切る前に終わったように見えた`, `${name}の変化をもう少し見てみたい`];
    case "song-highlight": return [`${song}の山場がよく届いていた`, `${song}で会場の視線が集まった`, `${song}の見せ方に輪郭があった`];
    case "song-caveat": return [`${song}はまだ手になじみきっていないようだった`, `${song}の山場には整える余地がある`, `${song}で少し緊張が見えた`];
    case "mc-rapport": return ["曲間の言葉で会場との距離が縮まっていた", "MCのやり取りに自然な笑いがあった", "話し始めてから会場の空気がやわらいだ"];
    case "mc-caveat": return ["曲間の言葉が少し急ぎ足だった", "MCではまだ探り合っている感じがあった", "話題の受け渡しにぎこちなさが残った"];
    case "first-impression": return ["通りがかりの人も足を止めていた", "初めて見る人の視線がステージに集まっていた", "初見でも入りやすい空気があった"];
    case "audience-response": return item.sign === "positive"
      ? ["予想よりも会場の熱が早く上がっていた", "客席の反応が途切れなかった", "開演前から期待する空気があった"]
      : ["客席の温度はゆっくり上がっていった", "会場の反応をつかむまで少し時間がかかった", "最初は客席との距離を探っているようだった"];
    case "tokuten-flow": return ["終演後の流れが落ち着いていた", "会いに行くまでの導線がスムーズだった", "終演後も気持ちよく余韻を残せた"];
    case "tokuten-queue": return ["終演後の列がかなり伸びていた", "会いに行くまでの待ち時間が長くなっていた", "特典会の導線には改善の余地がありそうだった"];
    case "production-flow": return ["転換まで含めて見やすくまとまっていた", "舞台の進行が引っかからなかった", "見せ場が途切れずにつながっていた"];
    case "production-caveat": return ["舞台の進行で少し待たされる場面があった", "見せ場のつながりに整える余地があった", "演出の切り替えで集中が途切れた"];
    case "improvement": return ["修正が舞台の見え方に出ていた", "前回からの積み重ねが伝わった", "以前より見せ方が一段まとまっていた"];
  }
}

const frames: Record<ReviewSource, Record<ReviewOpinionAct, string[]>> = {
  otaku: {
    notice: ["{p}。", "{p}のがよかった。", "{p}ところに目がいった。"],
    praise: ["{p}。あの瞬間がいちばん残ってる。", "{p}。今日の収穫だった。", "{p}。思わず見入ってしまった。"],
    caveat: ["{p}。次にどう整えてくるかも見たい。", "{p}。でも、だからこそ目が離せない。", "{p}。また確かめに行きたい。"],
    comparison: ["前に見たときより、{p}。", "前回よりも、{p}。", "以前からの変化として、{p}。"],
    "return-intent": ["{p}。また次も見に行きたい。", "{p}。次の現場も気になる。", "{p}。もう一度見届けたい。"],
  },
  public: {
    notice: ["{p}と感じました。", "{p}のが印象に残りました。", "{p}ように見えました。"],
    praise: ["{p}。思わず足を止めてしまいました。", "{p}。自然と目が向きました。", "{p}。見ていて楽しかったです。"],
    caveat: ["{p}。次の機会にも見てみたいです。", "{p}。気になるところでした。", "{p}。これからどう変わるのか気になります。"],
    comparison: ["前に見たときより、{p}と感じました。", "以前よりも、{p}ように見えました。", "今回のほうが、{p}印象でした。"],
    "return-intent": ["{p}。また見かけたら立ち寄りたいです。", "{p}。次も見てみたいと思いました。", "{p}。気になるグループです。"],
  },
  media: {
    notice: ["{p}。", "{p}点が目を引いた。", "{p}印象を残した。"],
    praise: ["{p}。短い持ち時間でも輪郭を示していた。", "{p}。舞台の強みとして機能していた。", "{p}。観客に届く要素になっていた。"],
    caveat: ["{p}。今後の調整が注目される。", "{p}。次の舞台での修正を待ちたい。", "{p}。伸びしろとして残った。"],
    comparison: ["前回と比べて、{p}。", "以前より、{p}。", "継続して追うと、{p}ことが分かる。"],
    "return-intent": ["{p}。次の機会にも注目したい。", "{p}。今後の舞台を見守りたい。", "{p}。続く活動での変化が期待される。"],
  },
};

function choose<T>(items: T[], random: () => number) {
  return items[Math.floor(random() * items.length)];
}

/** Renders from the offline v2 Japanese library; it performs no network or model call. */
export function realizeJapanese(input: SettledLiveReviewInput, opinion: ReviewOpinion, evidence: LiveReviewEvidence[], seed: string): RenderedLiveComment {
  const primary = evidence.find((item) => item.id === opinion.evidenceIds[0]);
  if (!primary) throw new Error("Review opinion references missing evidence");
  const random = createSeededRandom(`review:render:${seed}`);
  const phrase = choose(phrases(primary), random);
  const frame = choose(frames[opinion.source][opinion.act], random);
  return {
    liveId: input.liveId,
    source: opinion.source,
    textJa: frame.replace("{p}", phrase),
    evidenceIds: opinion.evidenceIds,
    styleVersion: "review-ja-v2",
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
