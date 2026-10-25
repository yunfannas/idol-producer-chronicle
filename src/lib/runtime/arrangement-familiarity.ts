import type { ArrangementFamiliarity, PerformanceProgressionState } from "./types";

const arrangementKey = (songId: string, arrangementVersion: string) => `${songId}:${arrangementVersion}`;

const clamp = (value: number, lower: number, upper: number) => Math.min(upper, Math.max(lower, value));

export type FamiliaritySettlement = {
  songId: string;
  arrangementVersion: string;
  familiarityOpen: number;
  decayDebt: number;
  rehearsalHours: number;
  stageHours: number;
  maintenancePaid: number;
  growth: number;
  familiarityClose: number;
};

export function createPerformanceProgression(input: { songId: string; arrangementVersion: string; initialFamiliarity?: number }): PerformanceProgressionState {
  const entry: ArrangementFamiliarity = {
    songId: input.songId,
    arrangementVersion: input.arrangementVersion,
    familiarity: clamp(input.initialFamiliarity ?? 0, 0, 100),
    performedPreviousWeek: false,
    rehearsalHoursThisWeek: 0,
    stageHoursThisWeek: 0,
  };
  return { arrangements: { [arrangementKey(entry.songId, entry.arrangementVersion)]: entry }, recordedExposureIds: [], settledWeekIds: [] };
}

export function arrangementFor(state: PerformanceProgressionState, songId: string, arrangementVersion: string): ArrangementFamiliarity {
  const arrangement = state.arrangements[arrangementKey(songId, arrangementVersion)];
  if (!arrangement) throw new Error(`Unknown arrangement ${songId}:${arrangementVersion}`);
  return arrangement;
}

/** Records only real rehearsal/stage exposure. Calls are immutable-state updates for replay safety. */
export function recordArrangementExposure(input: {
  state: PerformanceProgressionState;
  songId: string;
  arrangementVersion: string;
  sourceId: string;
  rehearsalHours?: number;
  stageHours?: number;
}): PerformanceProgressionState {
  if (input.state.recordedExposureIds.includes(input.sourceId)) return input.state;
  const current = arrangementFor(input.state, input.songId, input.arrangementVersion);
  const rehearsalHours = input.rehearsalHours ?? 0;
  const stageHours = input.stageHours ?? 0;
  if (rehearsalHours < 0 || stageHours < 0) throw new Error("Arrangement exposure cannot be negative");
  const key = arrangementKey(input.songId, input.arrangementVersion);
  return {
    arrangements: {
      ...input.state.arrangements,
      [key]: {
        ...current,
        rehearsalHoursThisWeek: current.rehearsalHoursThisWeek + rehearsalHours,
        stageHoursThisWeek: current.stageHoursThisWeek + stageHours,
      },
    },
    recordedExposureIds: [...input.state.recordedExposureIds, input.sourceId],
    settledWeekIds: input.state.settledWeekIds,
  };
}

/**
 * A new arrangement is a distinct state. Its inheritance is Scenario-owned
 * because the Member specification intentionally leaves the loss curve open.
 */
export function createArrangementVersion(input: {
  state: PerformanceProgressionState;
  songId: string;
  fromArrangementVersion: string;
  arrangementVersion: string;
  inheritanceFactor: number;
}): PerformanceProgressionState {
  const previous = arrangementFor(input.state, input.songId, input.fromArrangementVersion);
  const key = arrangementKey(input.songId, input.arrangementVersion);
  if (input.state.arrangements[key]) throw new Error(`Arrangement already exists: ${key}`);
  return {
    arrangements: {
      ...input.state.arrangements,
      [key]: {
        songId: input.songId,
        arrangementVersion: input.arrangementVersion,
        familiarity: clamp(previous.familiarity * clamp(input.inheritanceFactor, 0, 1), 0, 100),
        performedPreviousWeek: false,
        rehearsalHoursThisWeek: 0,
        stageHoursThisWeek: 0,
      },
    },
    recordedExposureIds: input.state.recordedExposureIds,
    settledWeekIds: input.state.settledWeekIds,
  };
}

/** Implements Member v1 §3 once per week, after all real exposure is recorded. */
export function settleArrangementFamiliarityWeek(input: {
  state: PerformanceProgressionState;
  teamCoreAttributeAverage: number;
  weekId: string;
}): { state: PerformanceProgressionState; settlements: FamiliaritySettlement[] } {
  if (input.state.settledWeekIds.includes(input.weekId)) return { state: input.state, settlements: [] };
  const attributeFactor = 0.5 + 0.5 * input.teamCoreAttributeAverage / 14;
  const settlements: FamiliaritySettlement[] = [];
  const arrangements = Object.fromEntries(Object.entries(input.state.arrangements).map(([key, current]) => {
    const familiarityOpen = current.familiarity;
    const decayDebt = 0.02 * familiarityOpen * (current.performedPreviousWeek ? 0.5 : 1);
    const exposureHours = current.rehearsalHoursThisWeek + current.stageHoursThisWeek;
    const rawGain = 6 * exposureHours;
    const maintenancePaid = Math.min(rawGain, decayDebt);
    const remainingGain = rawGain - maintenancePaid;
    const growth = remainingGain * Math.max(0.15, 1 - familiarityOpen / 120) * attributeFactor;
    const familiarityClose = clamp(familiarityOpen - (decayDebt - maintenancePaid) + growth, 0, 100);
    settlements.push({
      songId: current.songId,
      arrangementVersion: current.arrangementVersion,
      familiarityOpen,
      decayDebt,
      rehearsalHours: current.rehearsalHoursThisWeek,
      stageHours: current.stageHoursThisWeek,
      maintenancePaid,
      growth,
      familiarityClose,
    });
    return [key, {
      ...current,
      familiarity: familiarityClose,
      performedPreviousWeek: current.stageHoursThisWeek > 0,
      rehearsalHoursThisWeek: 0,
      stageHoursThisWeek: 0,
    }];
  }));
  return {
    state: {
      arrangements,
      recordedExposureIds: input.state.recordedExposureIds,
      settledWeekIds: [...input.state.settledWeekIds, input.weekId],
    },
    settlements,
  };
}
