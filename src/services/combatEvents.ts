import { CombatStrikeResult } from "../types";

/**
 * Combat Event Bus & Ledger Event Dispatcher
 * Built by Kurt-Claude (Backend Architect)
 * Decouples transaction ledger commits from the 2D Battle Arena stage animations.
 */

export interface CombatEventPayload {
  id: string;
  amount: number;
  label: string;
  strikeResult: CombatStrikeResult;
  timestamp: number;
}

type CombatEventListener = (payload: CombatEventPayload) => void;

class CombatEventEmitter {
  private listeners: Set<CombatEventListener> = new Set();
  private pendingQueue: CombatEventPayload[] = [];

  /**
   * Subscribe to ledger combat strike events.
   * If there are pending strikes (e.g. from modal transition), immediately flush them.
   */
  public subscribe(listener: CombatEventListener): () => void {
    this.listeners.add(listener);

    // Flush any pending strikes that occurred while the arena view was unmounted
    if (this.pendingQueue.length > 0) {
      const queued = [...this.pendingQueue];
      this.pendingQueue = [];
      queued.forEach((payload) => {
        try {
          listener(payload);
        } catch (err) {
          console.error("[CombatEventBus] Error dispatching queued combat event:", err);
        }
      });
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatches a combat strike event to all active listeners (BattlefieldArena).
   * If no listeners are currently subscribed (e.g. user is in /quick-log modal),
   * enqueue the event so it replays as soon as the arena mounts.
   */
  public emitCombatStrike(payload: CombatEventPayload): void {
    if (this.listeners.size === 0) {
      this.pendingQueue.push(payload);
      return;
    }

    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error("[CombatEventBus] Error dispatching combat strike event:", err);
      }
    });
  }

  /**
   * Returns current count of pending queued strikes.
   */
  public getPendingCount(): number {
    return this.pendingQueue.length;
  }

  /**
   * Clears pending strikes.
   */
  public clearPending(): void {
    this.pendingQueue = [];
  }
}

export const CombatEventBus = new CombatEventEmitter();
