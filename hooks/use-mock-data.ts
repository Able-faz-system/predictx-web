"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MATCHES,
  POLLS,
  PLATFORM_STATS,
  STORAGE_KEYS,
  type Match,
  type Poll,
  type PlatformStats,
} from "@/lib/mock-data";
import { trackEvent } from "@/lib/analytics";

interface MockDataState {
  matches: Match[];
  polls: Poll[];
  platformStats: PlatformStats;
  getMatch: (id: string) => Match | undefined;
  getPolls: (matchId: string) => Poll[];
  getPoll: (pollId: string) => Poll | undefined;
  trendingPolls: () => Poll[];
  /**
   * Update pool amounts and track distinct staker wallets.
   *
   * @param pollId   - The poll to update.
   * @param side     - Which pool the stake goes into.
   * @param amount   - USD amount staked.
   * @param walletAddress - Wallet that placed the stake. When provided,
   *   `participants` reflects the number of *distinct* wallets, not
   *   the total number of stake transactions.
   */
  updatePollPool: (
    pollId: string,
    side: "yes" | "no",
    amount: number,
    walletAddress?: string,
  ) => void;
  addPoll: (poll: Poll) => void;
}

export const useMockData = create<MockDataState>()(
  persist(
    (set, get) => ({
      matches: MATCHES,
      polls: POLLS,
      platformStats: PLATFORM_STATS,

      getMatch: (id) => get().matches.find((m) => m.id === id),

      getPolls: (matchId) => get().polls.filter((p) => p.matchId === matchId),

      getPoll: (pollId) => get().polls.find((p) => p.id === pollId),

      trendingPolls: () =>
        [...get().polls]
          .filter((p) => p.status === "active")
          .sort((a, b) => b.yesPool + b.noPool - (a.yesPool + a.noPool))
          .slice(0, 6),

      updatePollPool: (pollId, side, amount, walletAddress) =>
        set((s) => {
          const poll = s.polls.find((p) => p.id === pollId);

          // Dev warning: unknown poll id should never silently no-op
          if (!poll) {
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                `[updatePollPool] Poll not found: "${pollId}". ` +
                  `Available IDs: ${s.polls.map((p) => p.id).join(", ")}`,
              );
            }
            return s; // no-op — leave state unchanged
          }

          return {
            polls: s.polls.map((p) => {
              if (p.id !== pollId) return p;

              // Build the updated stakers list (deduplicated)
              const currentStakers: string[] = Array.isArray(p.stakers)
                ? p.stakers
                : [];
              const updatedStakers =
                walletAddress && !currentStakers.includes(walletAddress)
                  ? [...currentStakers, walletAddress]
                  : currentStakers;

              // participants = number of distinct wallets
              // stakeCount   = total number of stake transactions
              return {
                ...p,
                yesPool: side === "yes" ? p.yesPool + amount : p.yesPool,
                noPool: side === "no" ? p.noPool + amount : p.noPool,
                stakeCount: (p.stakeCount ?? 0) + 1,
                stakers: updatedStakers,
                participants: walletAddress
                  ? updatedStakers.length
                  : p.participants + 1, // fallback: increment if no address given
              };
            }),
          };
        }),

      /** Prepend a newly-created poll so it appears immediately in all views. */
      addPoll: (poll) => {
        set((s) => ({ polls: [poll, ...s.polls] }));
        trackEvent({
          name: "poll_create",
          pollCategory: poll.category,
          matchId: poll.matchId,
        });
      },
    }),
    {
      name: STORAGE_KEYS.pools,

      /**
       * Migration: recompute `participants` from `stakers` on rehydration.
       * Fixes any inflated counts persisted before this fix was applied.
       */
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.polls = state.polls.map((poll) => {
          if (!Array.isArray(poll.stakers)) {
            return { ...poll, stakers: [], stakeCount: poll.stakeCount ?? 0 };
          }
          const uniqueCount = new Set(poll.stakers).size;
          if (uniqueCount > 0 && uniqueCount !== poll.participants) {
            return { ...poll, participants: uniqueCount };
          }
          return poll;
        });
      },
    },
  ),
);
