import { NextResponse } from "next/server";
import { buildInbox } from "@/lib/presentation/prologue-ui";
import { loadOrCreateSave } from "@/lib/runtime/save-repository.server";

/**
 * Runtime Inbox read model.  The UI currently renders this server-side, but
 * keeping this endpoint factual makes it safe for a later native client.
 */
export async function GET() {
  const state = await loadOrCreateSave();
  return NextResponse.json({
    items: buildInbox(state),
    date: state.date,
  });
}
