import { describe, expect, it } from "vitest";
import { buildInbox, getReadonlyLiveDetail } from "./prologue-ui";
import { startTestRoute } from "../runtime/operations";
import { createPrologueState } from "../runtime/prologue";

describe("persisted prologue UI read model", () => {
  it("starts with the real blocking opening decision rather than sample inbox content", () => {
    const state = createPrologueState({ saveId: "ui-test" });
    const inbox = buildInbox(state);
    expect(inbox[0]).toMatchObject({ id: "decision-opening", tier: "blocking", href: "/inbox/decision-opening" });
    expect(inbox.some((item) => item.title.includes("優花の雑誌"))).toBe(false);
    expect(inbox.some((item) => item.id.startsWith("upcoming-"))).toBe(false);
  });

  it("turns a confirmed opening into a factual report with the persisted roster and ledger", () => {
    const state = startTestRoute(createPrologueState({ saveId: "ui-test" }), 9);
    const opening = buildInbox(state).find((item) => item.id === "report-opening");
    expect(opening?.summary).toContain("9名");
    expect(opening?.action?.href).toBe("/reports/opening");
    expect(state.finance.entries.filter((entry) => entry.id.startsWith("making:"))).toHaveLength(3);
  });

  it("does not expose dormant future events by Inbox, list, or direct detail", () => {
    const state = startTestRoute(createPrologueState({ saveId: "ui-test" }), 3);
    const event = state.events[0];
    const detail = getReadonlyLiveDetail(state, event.id);
    expect(detail).toBeUndefined();
    expect(buildInbox(state).some((item) => item.id.includes(event.id))).toBe(false);
  });

  it("keeps eligible-but-undelivered events out of player surfaces", () => {
    const state = startTestRoute(createPrologueState({ saveId: "ui-eligible-test" }), 3);
    const event = { ...state.events[0], status: "ELIGIBLE" as const };
    const pending = { ...state, events: [event, ...state.events.slice(1)] };
    expect(getReadonlyLiveDetail(pending, event.id)).toBeUndefined();
    expect(buildInbox(pending).some((item) => item.id.includes(event.id))).toBe(false);
  });
});
