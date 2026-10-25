import type { Color8, DevelopedPalette, SongPalette } from "./types";

export const COLOR_WHEEL: Color8[] = ["red", "pink", "orange", "aqua", "yellow", "green", "blue", "purple"];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function emptyPalette(value = 0): DevelopedPalette {
  return Object.fromEntries(COLOR_WHEEL.map((color) => [color, value])) as DevelopedPalette;
}

export function averageParticipantPalette(palettes: DevelopedPalette[]): DevelopedPalette {
  if (palettes.length === 0) throw new Error("A performed song needs at least one participant");
  const average = emptyPalette();
  for (const color of COLOR_WHEEL) {
    average[color] = palettes.reduce((sum, palette) => sum + palette[color], 0) / palettes.length;
  }
  return average;
}

export function basePaletteExecution(song: SongPalette, participants: DevelopedPalette[]): number {
  const average = averageParticipantPalette(participants);
  return COLOR_WHEEL.reduce((sum, color) => sum + song[color] * average[color], 0);
}

function oppositeNeighbors(color: Color8): [Color8, Color8, Color8] {
  const opposite = (COLOR_WHEEL.indexOf(color) + 4) % COLOR_WHEEL.length;
  return [COLOR_WHEEL[(opposite + 7) % 8], COLOR_WHEEL[opposite], COLOR_WHEEL[(opposite + 1) % 8]];
}

export function contrastFit(song: SongPalette, dutyPalette: DevelopedPalette): number {
  return COLOR_WHEEL.reduce((total, color) => {
    const [left, center, right] = oppositeNeighbors(color);
    const effective = (candidate: number) => Math.max(0, candidate - 35) / 65;
    const oppositeScore = 0.25 * effective(dutyPalette[left]) + 0.5 * effective(dutyPalette[center]) + 0.25 * effective(dutyPalette[right]);
    return total + song[color] * oppositeScore;
  }, 0);
}

export function finalPaletteExecution(input: {
  song: SongPalette;
  participantPalettes: DevelopedPalette[];
  keyParts: { maxBonus: number; dutyPalette: DevelopedPalette; familiarity: number }[];
}): number {
  return paletteExecutionBreakdown(input).finalPE;
}

export function paletteExecutionBreakdown(input: {
  song: SongPalette;
  participantPalettes: DevelopedPalette[];
  keyParts: { maxBonus: number; dutyPalette: DevelopedPalette; familiarity: number }[];
}): { basePE: number; keyBonus: number; finalPE: number } {
  const base = basePaletteExecution(input.song, input.participantPalettes);
  const uncappedKeyBonus = input.keyParts.reduce((sum, part) =>
    sum + part.maxBonus * contrastFit(input.song, part.dutyPalette) * clamp(part.familiarity / 100, 0, 1), 0);
  const keyBonus = Math.min(12, uncappedKeyBonus);
  return { basePE: base, keyBonus, finalPE: Math.min(100, base + keyBonus) };
}

export function paletteMultiplier(finalPE: number): number {
  const pe = clamp(finalPE, 0, 100);
  return pe < 45 ? 0.4 + 0.6 * (pe / 45) ** 1.2 : 1 + (pe - 45) / 55;
}
