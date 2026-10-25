import type { ActivityLoad, RuntimeMember } from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Parent portable spec §13; vocal/physical load is retained for risk ports only. */
export function conditionAmplifier(exhaustion: number): number {
  return (
    0.62 +
    0.0025 * exhaustion +
    0.75 / (1 + Math.exp(-(exhaustion - 67) / 10))
  );
}

export function applyActivityLoad(input: {
  member: RuntimeMember;
  load: ActivityLoad;
  stamina: number;
}): RuntimeMember {
  const { member, load, stamina } = input;
  if (load.general < 0 || stamina <= 0) throw new Error("Invalid activity load");
  const exhaustion = 100 - member.fitnessCondition;
  // Sta10 is the documented ordinary working calibration; the broader parent
  // stamina multiplier remains an adapter-owned tuning surface.
  const staminaMultiplier = 10 / stamina;
  const deltaExhaustion = load.general * staminaMultiplier * conditionAmplifier(exhaustion);
  return {
    ...member,
    fitnessCondition: clamp(member.fitnessCondition - deltaExhaustion, 0, 100),
  };
}

export function liveSongGeneralLoad(vocalDifficulty: number, danceDifficulty: number): number {
  if (vocalDifficulty <= 0 || danceDifficulty <= 0) {
    throw new Error("Song difficulty must be positive");
  }
  return (
    1.5 * (vocalDifficulty / 12) ** 1.5 +
    1.5 * (danceDifficulty / 12) ** 1.5
  );
}
