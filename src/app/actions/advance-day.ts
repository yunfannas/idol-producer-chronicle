"use server";

import { revalidatePath } from "next/cache";
import { writeAdvancedGameDate } from "@/lib/game-date-cookie";

export async function advanceOneDayAction() {
  await writeAdvancedGameDate(1);
  revalidatePath("/inbox");
  revalidatePath("/calendar");
  revalidatePath("/members");
  revalidatePath("/manage");
}
