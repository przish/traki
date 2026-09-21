import { describe, it, expect, beforeEach, vi } from "vitest";
import { CombatEventBus, CombatEventPayload } from "../src/services/combatEvents";

describe("CombatEventBus - Ledger Event Decoupling & Queueing", () => {
  beforeEach(() => {
    CombatEventBus.clearPending();
  });

  const dummyPayload: CombatEventPayload = {
    id: "tx_12345",
    amount: 150,
    label: "Coffee Pass",
    strikeResult: {
      baseDamage: 100,
      isCrit: false,
      critMultiplier: 1.0,
      streakMultiplier: 1.25,
      diminishingPenalty: 1.0,
      totalDamage: 125,
      dailyCleave: 125,
      weeklyCleave: 44,
      monthlyCleave: 19,
      goldEarned: 63,
      expEarned: 31,
      defeatedBosses: [],
    },
    timestamp: Date.now(),
  };

  it("notifies active subscribers when a combat strike event is emitted", () => {
    const mockListener = vi.fn();
    const unsub = CombatEventBus.subscribe(mockListener);

    CombatEventBus.emitCombatStrike(dummyPayload);

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(dummyPayload);

    unsub();
  });

  it("stops notifying after unsubscribing", () => {
    const mockListener = vi.fn();
    const unsub = CombatEventBus.subscribe(mockListener);

    unsub();
    CombatEventBus.emitCombatStrike(dummyPayload);

    expect(mockListener).not.toHaveBeenCalled();
  });

  it("enqueues events when no listeners are active and flushes upon subscription", () => {
    CombatEventBus.clearPending();

    // Emit while no listener is active (e.g. user is in /quick-log modal)
    CombatEventBus.emitCombatStrike(dummyPayload);
    expect(CombatEventBus.getPendingCount()).toBe(1);

    // Arena mounts and subscribes
    const mockListener = vi.fn();
    const unsub = CombatEventBus.subscribe(mockListener);

    // Queued event was flushed immediately
    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(dummyPayload);
    expect(CombatEventBus.getPendingCount()).toBe(0);

    unsub();
  });

  it("handles rapid-fire emissions without memory leaks or dropped events", () => {
    const received: CombatEventPayload[] = [];
    const unsub = CombatEventBus.subscribe((payload) => {
      received.push(payload);
    });

    const STRIKE_COUNT = 25;
    for (let i = 0; i < STRIKE_COUNT; i++) {
      CombatEventBus.emitCombatStrike({
        ...dummyPayload,
        id: `tx_${i}`,
        amount: (i + 1) * 10,
      });
    }

    expect(received).toHaveLength(STRIKE_COUNT);
    expect(received[0].amount).toBe(10);
    expect(received[STRIKE_COUNT - 1].amount).toBe(250);

    unsub();
  });
});
