"use server";

import { revalidatePath } from "next/cache";
import { advanceWithStaff, startTestRoute } from "@/lib/runtime/operations";
import { loadOrCreateSave, resetLocalSave, savePrologueState } from "@/lib/runtime/save-repository.server";

export async function advanceOneDayAction() {
  const state = await loadOrCreateSave();
  const result = advanceWithStaff(state, 7);
  await savePrologueState(result.state);
  revalidateChronicle();
}

export async function startTestRouteAction(formData: FormData) {
  const rosterSize = Number(formData.get("rosterSize"));
  if (rosterSize !== 3 && rosterSize !== 5 && rosterSize !== 9 && rosterSize !== 15) {
    throw new Error("Unsupported local test route");
  }
  const state = await loadOrCreateSave();
  if (state.gates.G01) return;
  await savePrologueState(startTestRoute(state, rosterSize));
  revalidateChronicle();
}

export async function resetPrologueAction() {
  await resetLocalSave();
  revalidateChronicle();
}

function revalidateChronicle() {
  revalidatePath("/inbox");
  revalidatePath("/calendar");
  revalidatePath("/members");
  revalidatePath("/manage");
}
