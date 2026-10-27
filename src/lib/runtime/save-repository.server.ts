import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPrologueState } from "./prologue";
import { createFanState, ensureFanMembers } from "./fan";
import { createPerformanceProgression } from "./arrangement-familiarity";
import { createReputationState } from "./reputation";
import type { Difficulty, PrologueState } from "./types";

const SAVE_ID = "local-prologue";
const saveDirectory = path.join(process.cwd(), ".chronicle-saves");

function assertSafeSaveId(saveId: string) {
  if (!/^[a-z0-9_-]{1,64}$/i.test(saveId)) throw new Error("Invalid save id");
}

function savePath(saveId: string) {
  assertSafeSaveId(saveId);
  return path.join(saveDirectory, `${saveId}.json`);
}

export async function loadOrCreateSave(input: {
  saveId?: string;
  difficulty?: Difficulty;
} = {}): Promise<PrologueState> {
  const saveId = input.saveId ?? SAVE_ID;
  try {
    const saved = JSON.parse(await readFile(savePath(saveId), "utf8")) as PrologueState;
    // v1.5 save migration adds Followers and four-week Interest without
    // assigning a fictional fan, follower, or relationship to old saves.
    if (!saved.fan || !saved.performanceProgression || !saved.reputation || !saved.fan.followers || !saved.fan.interests || !saved.scenarioDecisions) {
      const migrated = {
        ...saved,
        fan: saved.fan ? ensureFanMembers(saved.fan, saved.members.map((member) => member.id)) : createFanState(saved.members.map((member) => member.id)),
        performanceProgression: saved.performanceProgression ?? createPerformanceProgression({ songId: "prologue-staff-default-song", arrangementVersion: "v1", initialFamiliarity: 0 }),
        reputation: saved.reputation ?? createReputationState(),
        scenarioDecisions: saved.scenarioDecisions ?? [],
      };
      await savePrologueState(migrated);
      return migrated;
    }
    return saved;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const state = createPrologueState({ saveId, difficulty: input.difficulty ?? "normal" });
    await savePrologueState(state);
    return state;
  }
}

/** Atomic rename keeps a completed action recoverable after process restart. */
export async function savePrologueState(state: PrologueState): Promise<void> {
  const target = savePath(state.saveId);
  await mkdir(saveDirectory, { recursive: true });
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(state, null, 2), "utf8");
  await rename(temporary, target);
}

export async function resetLocalSave(difficulty: Difficulty = "normal"): Promise<PrologueState> {
  const state = createPrologueState({ saveId: SAVE_ID, difficulty });
  await savePrologueState(state);
  return state;
}
