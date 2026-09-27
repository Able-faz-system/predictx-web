"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_STAKES, STORAGE_KEYS, type Stake } from "@/lib/mock-data";
import {
	calculatePotentialWinnings,
	type WinningsCalculation,
} from "@/lib/calculations";
import { useMockData } from "@/hooks/use-mock-data";
import { useWallet, type TransactionReceipt } from "@/hooks/use-wallet";
import { trackEvent } from "@/lib/analytics";

interface StakingState {
	stakes: Stake[];
	activeStakes: () => Stake[];
	pendingStakes: () => Stake[];
	completedStakes: () => Stake[];
	placeStake: (
		pollId: string,
		matchId: string,
		matchName: string,
		question: string,
		side: "yes" | "no",
		amount: number,
	) => Promise<{ stake: Stake; receipt: TransactionReceipt }>;
	calculateWinnings: (
		amount: number,
		side: "yes" | "no",
		yesPool: number,
		noPool: number,
	) => WinningsCalculation;
}

export const useStaking = create<StakingState>()(
	persist(
		(set, get) => ({
			stakes: MOCK_STAKES,

			activeStakes: () => get().stakes.filter((s) => s.status === "active"),
			pendingStakes: () =>
				get().stakes.filter((s) => s.status === "pending_resolution"),
			completedStakes: () =>
				get().stakes.filter((s) => s.status === "completed"),

			placeStake: async (
				pollId,
				matchId,
				matchName,
				question,
				side,
				amount,
			) => {
				// Calls the wallet's simulated Stellar transaction
				const receipt = await useWallet
					.getState()
					.sendTransaction(
						amount,
						`Staked $${amount} on "${question}" – ${side.toUpperCase()}`,
					);

				// Update the poll pool in mock data store, passing the wallet
				// address so participants counts distinct wallets only
				const walletAddress = useWallet.getState().address ?? undefined;
				useMockData.getState().updatePollPool(pollId, side, amount, walletAddress);

				const stake: Stake = {
					id: `stake-${receipt.hash.slice(0, 8)}`,
					pollId,
					matchId,
					matchName,
					question,
					side,
					amount,
					status: "active",
				};

				set((s) => ({ stakes: [...s.stakes, stake] }));

				// Analytics — no wallet address or seeds
				const poll = useMockData.getState().getPoll(pollId);
				trackEvent({
					name: "stake_placed",
					pollCategory: poll?.category ?? "other",
					matchId,
					side,
					amountUSD: amount,
				});

				return { stake, receipt };
			},

			calculateWinnings: (amount, side, yesPool, noPool) =>
				calculatePotentialWinnings(amount, side, yesPool, noPool),
		}),
		{ name: STORAGE_KEYS.stakes },
	),
);
