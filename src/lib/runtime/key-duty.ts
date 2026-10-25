import type { PriorityAssignment, ResolvedKeyDuty } from "./types";

export function resolveKeyDuties(input: {
  liveId: string;
  songId: string;
  arrangementVersion: string;
  familiarityAtResolution: number;
  assignments: PriorityAssignment[];
  lineupMemberIds: string[];
  staffRankedMemberIds: string[];
}): ResolvedKeyDuty[] {
  const eligible = new Set(input.lineupMemberIds);
  return input.assignments.map((assignment) => {
    const candidates = [assignment.firstMemberId, assignment.secondMemberId, assignment.thirdMemberId]
      .filter((memberId): memberId is string => Boolean(memberId));
    const ordered = [
      [assignment.firstMemberId, "first"],
      [assignment.secondMemberId, "second"],
      [assignment.thirdMemberId, "third"],
    ] as const;
    for (const [memberId, selectedFrom] of ordered) {
      if (memberId && eligible.has(memberId)) {
        return {
          liveId: input.liveId,
          songId: input.songId,
          arrangementVersion: input.arrangementVersion,
          keyPartId: assignment.keyPartId,
          partType: assignment.partType,
          selectedMemberId: memberId,
          selectedFrom,
          reasonCode: "eligible_priority_candidate",
          candidatesConsidered: candidates,
          familiarityAtResolution: input.familiarityAtResolution,
        };
      }
    }
    const staffMemberId = [...assignment.autoCandidates ?? [], ...input.staffRankedMemberIds]
      .find((memberId) => eligible.has(memberId));
    return {
      liveId: input.liveId,
      songId: input.songId,
      arrangementVersion: input.arrangementVersion,
      keyPartId: assignment.keyPartId,
      partType: assignment.partType,
      selectedMemberId: staffMemberId ?? null,
      selectedFrom: staffMemberId ? "staff" : "unfilled",
      reasonCode: staffMemberId ? "staff_ranked_eligible_member" : "no_eligible_lineup_member",
      candidatesConsidered: candidates,
      familiarityAtResolution: input.familiarityAtResolution,
    };
  });
}
