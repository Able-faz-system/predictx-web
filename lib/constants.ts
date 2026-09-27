/**
 * Application constants
 *
*
 * ── Conventions ────────────────────────────────────────────────────────────
 * - All monetary display values are in USD unless explicitly noted otherwise.
 * - All on-chain / Soroban values use stroops (1 XLM = 10,000,000 stroops).
 * - Constants that will eventually be enforced by the Soroban contract are
 *   marked "Soroban:" so they can be cross-checked against the contract source.
 *
 * Import individual constants by name for effective tree-shaking:
 * @example
 *   import { PLATFORM_FEE_PERCENTAGE, QUICK_STAKE_AMOUNTS } from "@/lib/constants";
 */

/*Platform Economics*/
/*
 * Percentage of gross winnings retained by the platform as a service fee.
 * Applied at claim time, not at stake time — losers pay nothing beyond their stake.
 * Soroban: must match the `platform_fee_bps` value (500 basis points) in the contract.
 * @example netWinnings = estimatedWinnings * (1 - PLATFORM_FEE_PERCENTAGE)
 */
export const PLATFORM_FEE_PERCENTAGE = 0.05; // 5%

/**
 * Minimum reward rate paid to community voters who vote with the majority consensus.
 * Expressed as a decimal fraction of the poll's total pool.
 * Soroban: mirrors `voter_reward_min_bps` (50 basis points) in the contract.
 * @example totalPool * VOTER_REWARD_MIN = minimum total voter reward budget
 */
export const VOTER_REWARD_MIN = 0.005; // 0.5%

/**
 * Maximum reward rate paid to community voters who vote with the majority consensus.
 * Actual rate is interpolated between MIN and MAX based on voter participation ratio.
 * Soroban: mirrors `voter_reward_max_bps` (100 basis points) in the contract.
 */
export const VOTER_REWARD_MAX = 0.01; // 1%

/*Resolution Thresholds*/
/**
 * Minimum vote-share fraction required for a poll to be auto-approved without
 * human intervention. If the winning side's share of valid votes meets or
 * exceeds this threshold, the result is confirmed automatically on-chain.
 * Soroban: mirrors `auto_approve_threshold_bps` (8500 basis points) in the contract.
 * @example if (winningShare >= AUTO_APPROVE_THRESHOLD) → status = "resolved"
 */
export const AUTO_APPROVE_THRESHOLD = 0.85; // 85% consensus

/**
 * Minimum vote-share fraction required to route a poll to admin review rather
 * than escalating to multi-sig. Below this, the poll enters `multi-sig-review`.
 * Soroban: mirrors `admin_review_threshold_bps` (6000 basis points) in the contract.
 * @example if (winningShare >= ADMIN_REVIEW_THRESHOLD) → "admin-review"; else "multi-sig-review"
 */
export const ADMIN_REVIEW_THRESHOLD = 0.6; // 60% consensus

/**
 * Hours after a poll enters `resolved` status during which participants may
 * raise a formal on-chain dispute. After this window, resolution is final.
 * Soroban: mirrors `dispute_window_seconds` (86400) in the contract.
 */
export const DISPUTE_WINDOW_HOURS = 24;

/**
 * Hours that community voting remains open after a poll is locked.
 * After this window, vote tallies determine the resolution pathway.
 * Soroban: mirrors `voting_window_seconds` (7200) in the contract.
 */
export const VOTING_WINDOW_HOURS = 2;

/* Staking*/
/**
 * Preset USD stake amounts surfaced as quick-select buttons in the staking UI.
 * `as const` infers the literal tuple type `[50, 100, 500]` so mapped UI
 * components can iterate without widening to `number[]`.
 */
export const QUICK_STAKE_AMOUNTS = [50, 100, 500] as const; // USD

/**
 * Minimum USD value of any single stake.
 * Enforced on the frontend for UX; also enforced by the Soroban contract
 * via `MIN_STAKE_AMOUNT_STROOPS` to prevent dust attacks.
 * Soroban: cross-reference with `min_stake_amount` in the contract.
 */
export const MIN_STAKE_AMOUNT = 1; // USD

/**
 * Minimum stake amount in stroops — the authoritative on-chain minimum.
 * Derived from MIN_STAKE_AMOUNT using the mock XLM_USD_RATE; replace with
 * a dynamic calculation against a live oracle before mainnet deployment.
 * Soroban: must match `min_stake_amount` (i128) in the contract exactly.
 */
export const MIN_STAKE_AMOUNT_STROOPS = BigInt(
  Math.round((MIN_STAKE_AMOUNT / 0.12) * 10_000_000)
); // stroops — recalculate when XLM_USD_RATE changes

/**
 * Maximum stake expressed as a multiplier of the user's available balance.
 * A value of 1 means users may stake at most 100% of their balance in one tx.
 * Prevents accidental over-commitment; adjust if credit / margin features are added.
 */
export const MAX_STAKE_MULTIPLIER = 1; // 1× balance (100%)



/**
 * Stellar network used for all blockchain interactions.
 * `as const` narrows the type to the literal `"testnet"` so it can be passed
 * to Stellar SDK network config objects without a type cast.
 * Switch to `"mainnet"` for production deployments.
 */
export const STELLAR_NETWORK = "testnet" as const;

/**
 * Stellar base fee in stroops per operation (1 XLM = 10,000,000 stroops).
 * 100 stroops = 0.00001 XLM — the network minimum.
 * Complex transactions (multiple operations) multiply this by the operation count.
 * Soroban: Soroban transactions include an additional resource fee on top of this base.
 */
export const STELLAR_BASE_FEE = 100; // stroops

/**
 * Mock USD / XLM exchange rate used for balance display and USD ↔ stroops conversion.
 * This is intentionally a static mock; replace with a live Stellar oracle price feed
 * (e.g. Stellar's decentralised exchange SDEX mid-price) before mainnet deployment.
 * @example xlmAmount * XLM_USD_RATE ≈ USD value; usdAmount / XLM_USD_RATE ≈ XLM amount
 */
export const XLM_USD_RATE = 0.12; // 1 XLM ≈ $0.12 USD (mock — not production-safe)

/**
 * Soroban smart contract ID for the PredictX prediction market contract on testnet.
 * This is a Stellar contract address (C..., 56 characters) — NOT an Ethereum
 * contract address (0x...). Replace with the mainnet contract ID before launch.
 */
export const MOCK_CONTRACT_ID =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/* UI / Validation*/
/**
 * Maximum character length enforced on poll question text.
 * Keeps questions legible in card-based layouts and on narrow mobile viewports.
 * Also enforced by the Soroban contract to cap on-chain storage costs.
 */
export const POLL_QUESTION_MAX_LENGTH = 120; // characters

/**
 * Minimum character length enforced on poll question text.
 * Prevents trivially short or ambiguous questions from being created.
 */
export const POLL_QUESTION_MIN_LENGTH = 10; // characters

/**
 * XLM amount charged to the creator when a new poll is submitted on-chain.
 * Used by both the UI copy and the sendTransaction call so the advertised fee
 * always matches the amount actually debited from the creator's wallet.
 * Soroban: mirrors `poll_creation_fee_stroops` (10000 stroops = 0.001 XLM)
 * in the contract.
 * @example sendTransaction(CREATE_POLL_FEE_XLM, `Create poll: ${question}`)
 */
export const CREATE_POLL_FEE_XLM = 0.001; // XLM