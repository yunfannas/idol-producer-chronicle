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

  it("exposes only an event contract until a Live has actually been settled", () => {
    const state = startTestRoute(createPrologueState({ saveId: "ui-test" }), 3);
    const event = state.events[0];
    const detail = getReadonlyLiveDetail(state, event.id);
    expect(detail).toBeUndefined();
  });
});
