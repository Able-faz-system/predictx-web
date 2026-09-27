"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { requestAccess, isConnected as checkFreighter } from "@stellar/freighter-api";
import {
  MOCK_CONTRACT_ID,
  STELLAR_BASE_FEE,
  XLM_USD_RATE,
} from "@/lib/constants";
import { formatAddress } from "@/lib/calculations";
import { STORAGE_KEYS } from "@/lib/mock-data";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { stellar } from "@/lib/stellar";

export interface ConnectPayload {
  address: string;
  balance: number;
}

export interface TransactionReceipt {
  hash: string;
  ledger: number;
  fee: string;
  from: string;
  to: string;
  amount: number;
  amountXLM: number;
  timestamp: string;
}

export type StellarNetwork = "testnet" | "mainnet";

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string;
  balance: number;
  network: StellarNetwork;

  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: (amount: number) => void;
  switchNetwork: (network: StellarNetwork) => void;
  sendTransaction: (
    amountUSD: number,
    memo: string,
  ) => Promise<TransactionReceipt>;
}

/** Fetch native XLM balance using Stellar client helper */
async function fetchBalance(publicKey: string, network: StellarNetwork): Promise<number> {
  return stellar.getAccountBalance(publicKey, network);
}

/**
 * Module-level latch for {@link useWallet.sendTransaction}.
 *
 * Deliberately outside the store: the guard has to be readable synchronously
 * from inside the transaction body, and it must survive the store being
 * replaced by a `persist` rehydrate mid-flight. One transaction at a time per
 * wallet is the invariant.
 */
let transactionInFlight = false;

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      isConnecting: false,
      address: "",
      balance: 0,
      network: "testnet" as StellarNetwork,

      connect: async () => {
        set({ isConnecting: true });

        try {
          // 1. Check if installed
          const status = await checkFreighter();
          // Freighter v2 returns an object, v1 returned a boolean. This handles both!
          if (!status || (typeof status === 'object' && !status.isConnected)) {
            toast.info("Freighter is not installed. Please install the browser extension.");
            return;
          }

          const accessResponse = await requestAccess();
          
          if ((accessResponse as any).error) {
            throw new Error((accessResponse as any).error);
          }

          const publicKey = typeof accessResponse === "string" 
            ? accessResponse 
            : (accessResponse as any).address;

          if (!publicKey) {
            throw new Error("Failed to retrieve public key");
          }

          const currentNetwork = get().network;
          const balance = await fetchBalance(publicKey, currentNetwork);

          set({
            isConnected: true,
            address: publicKey,
            balance,
          });

          // Analytics — no public key in the payload
          trackEvent({ name: "wallet_connect" });
        } catch (error) {
          console.error("Freighter connect error:", error);
          toast.error("Connection failed", {
            description:
              error instanceof Error
                ? error.message
                : "Could not connect to Freighter. Please try again.",
          });
          throw error;
        } finally {
          set({ isConnecting: false });
        }
      },

      disconnect: () => {
        trackEvent({ name: "wallet_disconnect" });
        set({
          isConnected: false,
          address: "",
          balance: 0,
          isConnecting: false,
        });
      },

      switchNetwork: async (network: StellarNetwork) => {
        const { address, isConnected } = get();
        set({ network });

        // Re-fetch balance from the new network's Horizon
        if (isConnected && address) {
          const balance = await fetchBalance(address, network);
          set({ balance });
        }

        toast.success(`Switched to ${network}`, {
          description: network === "mainnet"
            ? "You are now on Stellar Mainnet"
            : "You are now on Stellar Testnet",
        });
      },

      updateBalance: (amount) =>
        set((state) => ({
          balance: state.balance + amount,
        })),

      /**
       * Simulates a Stellar transaction. Returns a mock receipt with
       * a realistic tx hash, ledger number, stroops fee, etc.
       * 95 % chance of success, 5 % simulated failure (network congestion).
       */
      sendTransaction: async (amountUSD, memo) => {
        const state = useWallet.getState();
        if (!state.isConnected || !state.address) {
          throw new Error("Wallet not connected");
        }

        /**
         * Re-entrancy latch.
         *
         * The simulated latency below is 1-2s, and the balance debit happens
         * *after* it. Without this latch, two overlapping calls both read the
         * same pre-await balance, both pass the sufficiency check, and both
         * then debit — driving the balance negative. The latch rejects the
         * second call outright rather than trying to reconcile it, because a
         * second concurrent transaction from one wallet is never legitimate
         * here: every call site debits as part of placing a single stake.
         *
         * A module-level ref rather than store state, so the check is
         * synchronous and cannot be defeated by two calls in the same tick.
         */
        if (transactionInFlight) {
          throw new Error(
            "A transaction is already in progress. Please wait for it to finish.",
          );
        }
        transactionInFlight = true;

        try {
          // Round to stroop precision (7 decimal places = 10^-7 XLM) to avoid
          // floating-point drift from repeated USD → XLM conversions.
          const STROOPS_PER_XLM = 10_000_000;
          const amountXLM =
            Math.round((amountUSD / XLM_USD_RATE) * STROOPS_PER_XLM) /
            STROOPS_PER_XLM;
          const feeXLM = STELLAR_BASE_FEE / STROOPS_PER_XLM; // 0.0000100 XLM

          if (amountXLM + feeXLM > state.balance) {
            throw new Error("Insufficient balance");
          }

          // simulate network latency (1-2 s)
          await new Promise((r) =>
            setTimeout(r, 1000 + Math.random() * 1000),
          );

        // 5 % failure rate
        if (Math.random() < 0.05) {
          const reasons = [
            "Network congestion — try again shortly",
            "Transaction timeout — Stellar Horizon did not respond",
          ];
          throw new Error(
            reasons[Math.floor(Math.random() * reasons.length)],
          );
        }

          // build mock receipt
          const hashBytes = Array.from({ length: 32 }, () =>
            Math.floor(Math.random() * 256)
              .toString(16)
              .padStart(2, "0"),
          ).join("");

        const receipt: TransactionReceipt = {
          hash: hashBytes,
          ledger: 50_000_000 + Math.floor(Math.random() * 1_000_000),
          fee: `${STELLAR_BASE_FEE} stroops (${feeXLM.toFixed(7)} XLM)`,
          from: state.address,
          to: MOCK_CONTRACT_ID,
          amount: amountUSD,
          amountXLM,
          timestamp: new Date().toISOString(),
        };

        /**
         * Re-check affordability against the live balance rather than the
         * snapshot taken before the await. With the latch above this is
         * belt-and-braces, but the debit is the authoritative moment: if
         * anything else moved the balance while this call was in flight, the
         * check that matters is the one here.
         */
        const liveBalance = useWallet.getState().balance;
        if (amountXLM + feeXLM > liveBalance) {
          throw new Error("Insufficient balance");
        }

        // Deduct both the transfer amount and the network fee so the ledger
        // balance exactly matches the receipt — fixes the drift described in #130.
        set((s) => ({ balance: s.balance - amountXLM - feeXLM }));

        return receipt;

          return receipt;
        } finally {
          transactionInFlight = false;
        }
      },
    }),
    {
      name: STORAGE_KEYS.wallet,
    }
  )
);
