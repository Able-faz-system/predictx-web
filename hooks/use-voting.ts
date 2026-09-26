"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS, type Poll } from "@/lib/mock-data";
import { useMockData } from "@/hooks/use-mock-data";
import { useStaking } from "@/hooks/use-staking";
import { trackEvent } from "@/lib/analytics";

export type VoteDecision = "yes" | "no" | "unclear";

interface VotingState {
  userVotes: Record<string, VoteDecision>;
  userEarnings: number;
  /** Tracks the number of real "unclear" votes cast per poll, keyed by pollId. */
  unclearVotesByPoll: Record<string, number>;
  availablePolls: () => Poll[];
  getVoteReward: (pollId: string) => number;
  castVote: (pollId: string, decision: VoteDecision) => Promise<void>;
  getAccuracy: () => number;
  /** Returns the real count of "unclear" votes cast for a poll (0 if none). */
  getUnclearVotes: (pollId: string) => number;
}

export const useVoting = create<VotingState>()(
  persist(
    (set, get) => ({
      userVotes: {},
      userEarnings: 0,
      unclearVotesByPoll: {},

      availablePolls: () => {
        const { polls } = useMockData.getState();
        const { stakes } = useStaking.getState();
        const { userVotes } = get();

        // Staked poll IDs
        const stakedPollIds = new Set(stakes.map((s) => s.pollId));

        return polls.filter(
          (p) =>
            p.status === "voting" &&
            !stakedPollIds.has(p.id) &&
            !userVotes[p.id],
        );
      },

      getVoteReward: (pollId: string) => {
        const poll = useMockData.getState().getPoll(pollId);
        if (!poll) return 0;
        // 0.5% of total pool as reward
        return (poll.yesPool + poll.noPool) * 0.005;
      },

      castVote: async (pollId: string, decision: VoteDecision) => {
        // Simulate network delay for the voting transaction
        await new Promise((resolve) => setTimeout(resolve, 800));

        const reward = get().getVoteReward(pollId);

        set((state) => ({
          userVotes: { ...state.userVotes, [pollId]: decision },
          userEarnings: state.userEarnings + reward,
          // Increment the real unclear counter only when the user votes "unclear"
          unclearVotesByPoll:
            decision === "unclear"
              ? {
                  ...state.unclearVotesByPoll,
                  [pollId]: (state.unclearVotesByPoll[pollId] ?? 0) + 1,
                }
              : state.unclearVotesByPoll,
        }));

        // Analytics — no wallet addresses
        const poll = useMockData.getState().getPoll(pollId);
        trackEvent({
          name: "vote_cast",
          pollCategory: poll?.category ?? "other",
          matchId: poll?.matchId ?? "unknown",
          decision,
        });
      },

      getUnclearVotes: (pollId: string) => {
        return get().unclearVotesByPoll[pollId] ?? 0;
      },

      getAccuracy: () => {
        // Mock accuracy since we don't have historical resolution mapped back to user votes perfectly yet
        const votesCast = Object.keys(get().userVotes).length;
        if (votesCast === 0) return 0;
        // Mocking a high accuracy for UI demonstration
        return 89;
      },
    }),
    { name: STORAGE_KEYS.votes },
  ),
);
