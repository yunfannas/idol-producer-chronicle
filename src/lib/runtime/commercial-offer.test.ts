import { describe, expect, it } from "vitest";
import { advanceWithStaff, startTestRoute } from "./operations";
import { decideCommercialOffer, postDebutCommercialOfferV1 } from "./prologue";
import { createPrologueState } from "./prologue";
import { buildInbox, getReadonlyLiveDetail } from "../presentation/prologue-ui";

function postDebutState() {
  const started = startTestRoute(createPrologueState({ saveId: "commercial-offer" }), 9);
  return { ...started, date: "2013-05-24", gates: { ...started.gates, G05: true } };
}

describe("post-debut commercial Scenario Offer", () => {
  it("does not exist or leak before its gate, then creates one blocking Inbox offer", () => {
    const opening = startTestRoute(createPrologueState({ saveId: "commercial-offer" }), 9);
    expect(opening.events.some((event) => event.id === postDebutCommercialOfferV1.id)).toBe(false);
    expect(buildInbox(opening).some((item) => item.id.includes("commercial-invite"))).toBe(false);

    const triggered = advanceWithStaff(postDebutState(), 1);
    const offer = triggered.state.events.find((event) => event.id === postDebutCommercialOfferV1.id)!;
    expect(triggered.advancedDays).toBe(1);
    expect(offer).toMatchObject({ kind: "closed", status: "OFFERED", contractDecision: "PENDING", chekiAllowed: false });
    expect(buildInbox(triggered.state).find((item) => item.id === `event-${offer.id}`)?.tier).toBe("blocking");
    expect(getReadonlyLiveDetail(triggered.state, offer.id)).toBeUndefined();
    expect(advanceWithStaff(triggered.state, 7)).toMatchObject({ advancedDays: 0, awaitingSettlementEventId: offer.id });
  });

  it("records an idempotent accept/decline decision without fabricating cash", () => {
    const offered = advanceWithStaff(postDebutState(), 1).state;
    const cash = offered.finance.cash;
    const accepted = decideCommercialOffer(offered, { eventId: postDebutCommercialOfferV1.id, choice: "accept" });
    expect(accepted.events.find((event) => event.id === postDebutCommercialOfferV1.id)).toMatchObject({ status: "OFFERED", contractDecision: "ACCEPTED" });
    expect(accepted.scenarioDecisions).toHaveLength(1);
    expect(accepted.finance.cash).toBe(cash);
    expect(getReadonlyLiveDetail(accepted, postDebutCommercialOfferV1.id)?.event.id).toBe(postDebutCommercialOfferV1.id);
    expect(decideCommercialOffer(accepted, { eventId: postDebutCommercialOfferV1.id, choice: "accept" })).toBe(accepted);
    const due = advanceWithStaff(accepted, 7);
    expect(due).toMatchObject({ awaitingSettlementEventId: postDebutCommercialOfferV1.id });
    expect(due.state.finance.entries.some((entry) => entry.eventId === postDebutCommercialOfferV1.id)).toBe(false);

    const declined = decideCommercialOffer(offered, { eventId: postDebutCommercialOfferV1.id, choice: "decline" });
    expect(declined.events.find((event) => event.id === postDebutCommercialOfferV1.id)).toMatchObject({ status: "EXPIRED", contractDecision: "DECLINED" });
    expect(declined.finance.cash).toBe(cash);
    expect(buildInbox(declined).some((item) => item.id.includes("commercial-invite"))).toBe(false);
  });
});
