"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS, type Poll } from "@/lib/mock-data";
import { useMockData } from "@/hooks/use-mock-data";
import { useStaking } from "@/hooks/use-staking";
import { trackEvent } from "@/lib/analytics";
import { useWallet } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import {
  VOTER_REWARD_MIN,
  VOTER_REWARD_MAX,
  AUTO_APPROVE_THRESHOLD,
  XLM_USD_RATE,
} from "@/lib/constants";

export type VoteDecision = "yes" | "no" | "unclear";

/**
 * A reward that has been earned (vote cast, non-unclear, poll not yet resolved)
 * but not yet paid out.
 */
interface PendingReward {
  pollId: string;
  matchName: string;
  question: string;
  /** USD amount owed if vote is later confirmed correct */
  amount: number;
  /** The user's vote — "unclear" votes are never eligible */
  decision: VoteDecision;
}

interface VotingState {
  /** pollId → the decision the user cast */
  userVotes: Record<string, VoteDecision>;
  /** Rewards waiting for poll resolution before payout */
  pendingRewards: Record<string, PendingReward>;
  /** Total USD credited to the wallet after settlement — readable by UI */
  userEarnings: number;
  /** Tracks the number of real "unclear" votes cast per poll, keyed by pollId. */
  unclearVotesByPoll: Record<string, number>;
  availablePolls: () => Poll[];
  getVoteReward: (pollId: string) => number;

  /**
   * Record the user's vote.
   * - Stores the decision in userVotes (prevents double-voting).
   * - For non-unclear votes, queues a PendingReward owed-but-unpaid.
   * - "unclear" votes are recorded but earn nothing (farmable reward closed).
   * - Actual wallet credit + ledger entry only happen in settleRewards().
   */
  castVote: (pollId: string, decision: VoteDecision) => Promise<void>;

  /**
   * Settle pending rewards for any polls that have now resolved.
   * Call this whenever poll statuses are refreshed (e.g. on page focus).
   *
   * For each pending reward where:
   *   1. The corresponding poll is now "resolved"
   *   2. The poll has a known outcome ("yes" | "no")
   *   3. The user's non-unclear vote matches the outcome (consensus)
   *
   * The reward is: credited to the wallet balance, written as a
   * "vote_reward" ledger entry, and removed from pendingRewards.
   *
   * Votes that are "unclear" or that did not match the outcome are
   * removed from pendingRewards silently (no payout).
   */
  settleRewards: () => void;

  getAccuracy: () => number;
  /** Returns the real count of "unclear" votes cast for a poll (0 if none). */
  getUnclearVotes: (pollId: string) => number;
}

export const useVoting = create<VotingState>()(
  persist(
    (set, get) => ({
      userVotes: {},
      pendingRewards: {},
      userEarnings: 0,
      unclearVotesByPoll: {},

      availablePolls: () => {
        const { polls } = useMockData.getState();
        const { stakes } = useStaking.getState();
        const { userVotes } = get();

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
        // Interpolate between VOTER_REWARD_MIN (0.5%) and VOTER_REWARD_MAX (1%)
        // based on the consensus ratio towards AUTO_APPROVE_THRESHOLD.
        const totalPool = poll.yesPool + poll.noPool;
        if (totalPool <= 0) return 0;
        const consensusRatio = Math.max(poll.yesPool, poll.noPool) / totalPool;
        const progress = Math.min(1, Math.max(0, (consensusRatio - 0.5) / (AUTO_APPROVE_THRESHOLD - 0.5)));
        const rate = VOTER_REWARD_MIN + (VOTER_REWARD_MAX - VOTER_REWARD_MIN) * progress;
        return totalPool * rate;
      },

      castVote: async (pollId: string, decision: VoteDecision) => {
        // Simulate network delay for the voting transaction
        await new Promise((resolve) => setTimeout(resolve, 800));

        set((state) => {
          // Already voted — no-op (guard against double-submit races)
          if (state.userVotes[pollId]) return state;

          const newVotes = { ...state.userVotes, [pollId]: decision };
          const newPending = { ...state.pendingRewards };

          // "unclear" votes are recorded but earn nothing — reward is 0 and
          // no pending entry is queued, making it impossible to farm.
          if (decision !== "unclear") {
            const poll = useMockData.getState().getPoll(pollId);
            if (poll) {
              const reward = get().getVoteReward(pollId);
              const matchData = useMockData.getState().getMatch(poll.matchId);
              newPending[pollId] = {
                pollId,
                matchName: matchData
                  ? `${matchData.homeTeam} vs ${matchData.awayTeam}`
                  : poll.matchId,
                question: poll.question,
                amount: reward,
                decision,
              };
            }
          }

          return {
            userVotes: newVotes,
            pendingRewards: newPending,
            // Increment the real unclear counter only when the user votes "unclear"
            unclearVotesByPoll:
              decision === "unclear"
                ? {
                    ...state.unclearVotesByPoll,
                    [pollId]: (state.unclearVotesByPoll[pollId] ?? 0) + 1,
                  }
                : state.unclearVotesByPoll,
          };
        });

        // Analytics — no wallet addresses
        const votedPoll = useMockData.getState().getPoll(pollId);
        trackEvent({
          name: "vote_cast",
          pollCategory: votedPoll?.category ?? "other",
          matchId: votedPoll?.matchId ?? "unknown",
          decision,
        });
      },

      settleRewards: () => {
        const { pendingRewards } = get();
        if (Object.keys(pendingRewards).length === 0) return;

        const polls = useMockData.getState().polls;
        const pollMap = new Map(polls.map((p) => [p.id, p]));

        const wallet = useWallet.getState();
        const addTx = useTransactions.getState().addTransaction;

        let earned = 0;
        const remainingPending = { ...pendingRewards };

        for (const [pollId, pending] of Object.entries(pendingRewards)) {
          const poll = pollMap.get(pollId);
          if (!poll) {
            // Poll no longer exists — discard
            delete remainingPending[pollId];
            continue;
          }

          // Only settle polls that are fully resolved with a definitive outcome
          if (poll.status !== "resolved" || !poll.outcome) continue;

          // Remove from pending regardless of outcome (no payout if wrong/unclear)
          delete remainingPending[pollId];

          // Unclear decisions are ineligible (already blocked in castVote, but
          // guard here for any legacy state that might exist)
          if (pending.decision === "unclear") continue;

          // Reward is only paid if the user's vote matched the resolved outcome
          if (pending.decision !== poll.outcome) continue;

          // Eligible: credit wallet and write ledger entry
          const amountXLM = pending.amount / XLM_USD_RATE;
          wallet.updateBalance(amountXLM);
          earned += pending.amount;

          addTx({
            type: "vote_reward",
            amount: pending.amount,
            amountXLM,
            description: `Vote reward — "${pending.question}" (${pending.matchName})`,
            timestamp: new Date().toISOString(),
            status: "confirmed",
          });
        }

        set((s) => ({
          pendingRewards: remainingPending,
          userEarnings: s.userEarnings + earned,
        }));
      },

      getUnclearVotes: (pollId: string) => {
        return get().unclearVotesByPoll[pollId] ?? 0;
      },

      getAccuracy: () => {
        const votesCast = Object.keys(get().userVotes).length;
        if (votesCast === 0) return 0;
        // Mock accuracy — real accuracy would compare userVotes to resolved poll outcomes
        return 89;
      },
    }),
    { name: STORAGE_KEYS.votes },
  ),
);
