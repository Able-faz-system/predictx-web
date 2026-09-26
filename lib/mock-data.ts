// All dates are computed relative to new Date() — no hardcoded past/future dates.

const addDays = (n: number, hour = 15): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const XLM_RATE = 0.12; // 1 XLM ≈ $0.12

// ── Storage keys ──────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  wallet: "predictx_wallet",
  stakes: "predictx_stakes",
  votes: "predictx_votes",
  pools: "predictx_pools",
};

export function resetAllData() {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem("wallet-storage");
  localStorage.removeItem("predictx_wallet");
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type MatchStatus = "upcoming" | "live" | "completed";
export type PollStatus = "active" | "locked" | "voting" | "resolved";
export type LockTime = "kickoff" | "halftime" | "60min";
export type PollCategory =
  | "player_event"
  | "team_event"
  | "score_prediction"
  | "other";
export type WalletProvider = "Freighter" | "Lobstr" | "xBull";

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  kickoff: string;
  status: MatchStatus;
  score?: { home: number; away: number };
}

export interface Poll {
  id: string;
  matchId: string;
  question: string;
  category: PollCategory;
  yesPool: number;
  noPool: number;
  participants: number;
  status: PollStatus;
  lockTime: LockTime;
  recentActivity: string;
  outcome?: "yes" | "no";
}

export interface Stake {
  id: string;
  pollId: string;
  matchId: string;
  matchName: string;
  question: string;
  side: "yes" | "no";
  amount: number;
  status: "active" | "pending_resolution" | "completed";
  outcome?: "won" | "lost";
  profit?: number;
  roi?: number;
  resolutionNote?: string;
}

export interface VotingOpportunity {
  pollId: string;
  matchId: string;
  matchName: string;
  question: string;
  reward: number;
  evidence: string;
}

export interface Transaction {
  hash: string;
  type: "stake" | "claim" | "vote_reward" | "poll_creation";
  amount: number;
  amountXLM: number;
  description: string;
  timestamp: string;
  ledger: number;
  fee: string;
  status: "confirmed" | "failed";
}

export interface PlatformStats {
  totalValueLocked: number;
  activePredictions: number;
  communityMembers: number;
  totalPayouts: number;
}

// ── Matches ───────────────────────────────────────────────────────────────────
export const MATCHES: Match[] = [
  {
    id: "m1",
    homeTeam: "Chelsea",
    awayTeam: "Manchester United",
    venue: "Stamford Bridge",
    kickoff: addDays(1, 15),
    status: "upcoming",
  },
  {
    id: "m2",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    venue: "Emirates Stadium",
    kickoff: addDays(2, 17),
    status: "upcoming",
  },
  {
    id: "m3",
    homeTeam: "Manchester City",
    awayTeam: "Tottenham",
    venue: "Etihad Stadium",
    kickoff: addDays(3, 12),
    status: "upcoming",
  },
  {
    id: "m4",
    homeTeam: "Newcastle",
    awayTeam: "Aston Villa",
    venue: "St. James' Park",
    kickoff: addDays(4, 15),
    status: "upcoming",
  },
  {
    id: "m5",
    homeTeam: "Brighton",
    awayTeam: "West Ham",
    venue: "Amex Stadium",
    kickoff: addDays(0, 13),
    status: "live",
    score: { home: 1, away: 0 },
  },
  {
    id: "m6",
    homeTeam: "Everton",
    awayTeam: "Wolves",
    venue: "Goodison Park",
    kickoff: addDays(-1, 15),
    status: "completed",
    score: { home: 2, away: 1 },
  },
];

// ── Polls (4–5 per match, 28 total) ───────────────────────────────────────────
export const POLLS: Poll[] = [
  // m1 — Chelsea vs Manchester United
  {
    id: "m1-p1",
    matchId: "m1",
    question: "Will Palmer score a goal?",
    category: "player_event",
    yesPool: 8400,
    noPool: 3600,
    participants: 67,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "34 people staked Yes in last hour",
  },
  {
    id: "m1-p2",
    matchId: "m1",
    question: "Will Rashford be subbed out before 70min?",
    category: "player_event",
    yesPool: 2100,
    noPool: 5400,
    participants: 45,
    status: "active",
    lockTime: "halftime",
    recentActivity: "Pool grew $800 in last 2 hours",
  },
  {
    id: "m1-p3",
    matchId: "m1",
    question: "Will Chelsea win?",
    category: "team_event",
    yesPool: 9200,
    noPool: 4300,
    participants: 78,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "12 people staked No in last 30min",
  },
  {
    id: "m1-p4",
    matchId: "m1",
    question: "Will there be a penalty?",
    category: "team_event",
    yesPool: 3800,
    noPool: 7200,
    participants: 55,
    status: "active",
    lockTime: "60min",
    recentActivity: "Pool grew $1,200 in last hour",
  },

  // m2 — Arsenal vs Liverpool
  {
    id: "m2-p1",
    matchId: "m2",
    question: "Will Saka get an assist?",
    category: "player_event",
    yesPool: 5600,
    noPool: 4400,
    participants: 62,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "28 people staked Yes in last hour",
  },
  {
    id: "m2-p2",
    matchId: "m2",
    question: "Will Arsenal keep a clean sheet?",
    category: "team_event",
    yesPool: 3200,
    noPool: 8800,
    participants: 74,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "Pool grew $2,000 in 30min",
  },
  {
    id: "m2-p3",
    matchId: "m2",
    question: "Will both teams score?",
    category: "score_prediction",
    yesPool: 9100,
    noPool: 2900,
    participants: 58,
    status: "active",
    lockTime: "halftime",
    recentActivity: "19 people staked Yes in last 2 hours",
  },
  {
    id: "m2-p4",
    matchId: "m2",
    question: "Will the first goal be scored before 20min?",
    category: "team_event",
    yesPool: 4700,
    noPool: 5300,
    participants: 49,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "Pool grew $600 in last hour",
  },
  {
    id: "m2-p5",
    matchId: "m2",
    question: "Will total goals be over 2.5?",
    category: "score_prediction",
    yesPool: 7300,
    noPool: 3700,
    participants: 66,
    status: "active",
    lockTime: "60min",
    recentActivity: "41 people staked Yes in last hour",
  },

  // m3 — Manchester City vs Tottenham
  {
    id: "m3-p1",
    matchId: "m3",
    question: "Will Haaland receive a yellow card?",
    category: "player_event",
    yesPool: 1200,
    noPool: 8800,
    participants: 38,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "Pool grew $400 in last hour",
  },
  {
    id: "m3-p2",
    matchId: "m3",
    question: "Will Manchester City win by 2+ goals?",
    category: "score_prediction",
    yesPool: 7800,
    noPool: 4200,
    participants: 72,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "52 people staked Yes in last hour",
  },
  {
    id: "m3-p3",
    matchId: "m3",
    question: "Will there be a VAR review?",
    category: "other",
    yesPool: 6400,
    noPool: 5600,
    participants: 44,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "Pool grew $1,500 in last 2 hours",
  },
  {
    id: "m3-p4",
    matchId: "m3",
    question: "Will total goals be over 2.5?",
    category: "score_prediction",
    yesPool: 5500,
    noPool: 4500,
    participants: 56,
    status: "active",
    lockTime: "halftime",
    recentActivity: "22 people staked Yes in last 30min",
  },

  // m4 — Newcastle vs Aston Villa
  {
    id: "m4-p1",
    matchId: "m4",
    question: "Will there be a red card?",
    category: "other",
    yesPool: 2300,
    noPool: 9700,
    participants: 41,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "Pool grew $300 in last hour",
  },
  {
    id: "m4-p2",
    matchId: "m4",
    question: "Will Newcastle win?",
    category: "team_event",
    yesPool: 6100,
    noPool: 5900,
    participants: 63,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "17 people staked Yes in last hour",
  },
  {
    id: "m4-p3",
    matchId: "m4",
    question: "Will both teams score?",
    category: "score_prediction",
    yesPool: 7200,
    noPool: 4800,
    participants: 57,
    status: "active",
    lockTime: "halftime",
    recentActivity: "Pool grew $900 in last hour",
  },
  {
    id: "m4-p4",
    matchId: "m4",
    question: "Will there be a penalty?",
    category: "team_event",
    yesPool: 3500,
    noPool: 8500,
    participants: 39,
    status: "active",
    lockTime: "60min",
    recentActivity: "Pool grew $700 in last 2 hours",
  },
  {
    id: "m4-p5",
    matchId: "m4",
    question: "Will Watkins score?",
    category: "player_event",
    yesPool: 4900,
    noPool: 6100,
    participants: 48,
    status: "active",
    lockTime: "kickoff",
    recentActivity: "25 people staked No in last hour",
  },

  // m5 — Brighton vs West Ham (live)
  {
    id: "m5-p1",
    matchId: "m5",
    question: "Will Brighton win?",
    category: "team_event",
    yesPool: 8900,
    noPool: 3100,
    participants: 74,
    status: "locked",
    lockTime: "kickoff",
    recentActivity: "61 people staked Yes before kickoff",
  },
  {
    id: "m5-p2",
    matchId: "m5",
    question: "Will total goals be over 2.5?",
    category: "score_prediction",
    yesPool: 5800,
    noPool: 4200,
    participants: 55,
    status: "locked",
    lockTime: "halftime",
    recentActivity: "Pool reached $10K before halftime",
  },
  {
    id: "m5-p3",
    matchId: "m5",
    question: "Will there be a VAR review?",
    category: "other",
    yesPool: 6200,
    noPool: 5800,
    participants: 47,
    status: "locked",
    lockTime: "60min",
    recentActivity: "Pool grew $1,800 before 60min",
  },
  {
    id: "m5-p4",
    matchId: "m5",
    question: "Will both teams score?",
    category: "score_prediction",
    yesPool: 4100,
    noPool: 7900,
    participants: 60,
    status: "locked",
    lockTime: "halftime",
    recentActivity: "43 people staked No before halftime",
  },

  // m6 — Everton vs Wolves (completed)
  {
    id: "m6-p1",
    matchId: "m6",
    question: "Will Everton win?",
    category: "team_event",
    yesPool: 7200,
    noPool: 4800,
    participants: 71,
    status: "voting",
    lockTime: "kickoff",
    recentActivity: "Voting in progress — 2 hours remaining",
  },
  {
    id: "m6-p2",
    matchId: "m6",
    question: "Will total goals be over 2.5?",
    category: "score_prediction",
    yesPool: 5400,
    noPool: 5600,
    participants: 64,
    status: "voting",
    lockTime: "halftime",
    recentActivity: "Voting in progress",
  },
  {
    id: "m6-p3",
    matchId: "m6",
    question: "Will there be a red card?",
    category: "other",
    yesPool: 1800,
    noPool: 9200,
    participants: 43,
    status: "voting",
    lockTime: "kickoff",
    recentActivity: "Voting in progress — cast your vote now",
  },
  {
    id: "m6-p4",
    matchId: "m6",
    question: "Will both teams score?",
    category: "score_prediction",
    yesPool: 8100,
    noPool: 2900,
    participants: 58,
    status: "voting",
    lockTime: "halftime",
    recentActivity: "Voting in progress",
  },
  {
    id: "m6-p5",
    matchId: "m6",
    question: "Will there be a VAR review?",
    category: "other",
    yesPool: 4300,
    noPool: 6700,
    participants: 36,
    status: "voting",
    lockTime: "60min",
    recentActivity: "Admin review in progress",
  },
];

// ── Mock User ─────────────────────────────────────────────────────────────────
export const MOCK_USER = {
  address: "GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H",
  displayAddress: "GDKX...9F3H",
  balanceUSD: 2500,
  balanceXLM: 2500 / XLM_RATE, // ~20,833 XLM
};

export const MOCK_BADGES = ["Early Predictor", "3-Win Streak"];

// ── Default stakes ────────────────────────────────────────────────────────────
export const MOCK_STAKES: Stake[] = [
  // Active (3)
  {
    id: "s1",
    pollId: "m1-p1",
    matchId: "m1",
    matchName: "Chelsea vs Man Utd",
    question: "Will Palmer score a goal?",
    side: "yes",
    amount: 200,
    status: "active",
  },
  {
    id: "s2",
    pollId: "m2-p2",
    matchId: "m2",
    matchName: "Arsenal vs Liverpool",
    question: "Will Arsenal keep a clean sheet?",
    side: "no",
    amount: 500,
    status: "active",
  },
  {
    id: "s3",
    pollId: "m3-p4",
    matchId: "m3",
    matchName: "Man City vs Tottenham",
    question: "Will total goals be over 2.5?",
    side: "yes",
    amount: 150,
    status: "active",
  },
  // Pending resolution (2)
  {
    id: "s4",
    pollId: "m6-p3",
    matchId: "m6",
    matchName: "Everton vs Wolves",
    question: "Will there be a red card?",
    side: "no",
    amount: 300,
    status: "pending_resolution",
    resolutionNote: "Voting in progress",
  },
  {
    id: "s5",
    pollId: "m6-p5",
    matchId: "m6",
    matchName: "Everton vs Wolves",
    question: "Will there be a VAR review?",
    side: "no",
    amount: 180,
    status: "pending_resolution",
    resolutionNote: "Admin review",
  },
  // Completed — 4 wins, 2 losses
  {
    id: "s6",
    pollId: "m6-p1",
    matchId: "m6",
    matchName: "Everton vs Wolves",
    question: "Will Everton win?",
    side: "yes",
    amount: 100,
    status: "completed",
    outcome: "won",
    profit: 50,
    roi: 50.0,
  },
  {
    id: "s7",
    pollId: "m6-p2",
    matchId: "m6",
    matchName: "Everton vs Wolves",
    question: "Will total goals be over 2.5?",
    side: "yes",
    amount: 200,
    status: "completed",
    outcome: "won",
    profit: 120,
    roi: 60.0,
  },
  {
    id: "s8",
    pollId: "m5-p1",
    matchId: "m5",
    matchName: "Brighton vs West Ham",
    question: "Will Brighton win?",
    side: "yes",
    amount: 250,
    status: "completed",
    outcome: "won",
    profit: 187,
    roi: 74.8,
  },
  {
    id: "s9",
    pollId: "m5-p2",
    matchId: "m5",
    matchName: "Brighton vs West Ham",
    question: "Will total goals be over 2.5?",
    side: "no",
    amount: 400,
    status: "completed",
    outcome: "won",
    profit: 350,
    roi: 87.5,
  },
  {
    id: "s10",
    pollId: "m4-p1",
    matchId: "m4",
    matchName: "Newcastle vs Aston Villa",
    question: "Will there be a red card?",
    side: "yes",
    amount: 100,
    status: "completed",
    outcome: "lost",
    profit: -100,
    roi: -100.0,
  },
  {
    id: "s11",
    pollId: "m3-p1",
    matchId: "m3",
    matchName: "Man City vs Tottenham",
    question: "Will Haaland receive a yellow card?",
    side: "yes",
    amount: 300,
    status: "completed",
    outcome: "lost",
    profit: -300,
    roi: -100.0,
  },
];

// ── Voting opportunities ──────────────────────────────────────────────────────
export const MOCK_VOTING_OPPORTUNITIES: VotingOpportunity[] = [
  {
    pollId: "m6-p3",
    matchId: "m6",
    matchName: "Everton vs Wolves",
    question: "Will there be a red card?",
    reward: 12,
    evidence: "Match ended without red cards per official report",
  },
  {
    pollId: "m6-p5",
    matchId: "m6",
    matchName: "Everton vs Wolves",
    question: "Will there be a VAR review?",
    reward: 8,
    evidence: "VAR used to review handball in 74th minute",
  },
  {
    pollId: "m5-p3",
    matchId: "m5",
    matchName: "Brighton vs West Ham",
    question: "Will there be a VAR review?",
    reward: 25,
    evidence: "Live — VAR review pending from 52nd min incident",
  },
  {
    pollId: "m5-p4",
    matchId: "m5",
    matchName: "Brighton vs West Ham",
    question: "Will both teams score?",
    reward: 18,
    evidence: "Brighton lead 1–0 at half; West Ham yet to score",
  },
];

// ── Platform stats ────────────────────────────────────────────────────────────
export const PLATFORM_STATS: PlatformStats = {
  totalValueLocked: 847_293,
  activePredictions: 234,
  communityMembers: 12_847,
  totalPayouts: 3_200_000,
};

// ── Transactions (Stellar format — 64 hex chars, 100 stroops fee) ─────────────
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    hash: "a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    type: "stake",
    amount: 200,
    amountXLM: 200 / XLM_RATE,
    description: 'Staked $200 on "Will Palmer score?" – YES',
    timestamp: addDays(-3, 10),
    ledger: 50_123_456,
    fee: "100 stroops (0.0000100 XLM)",
    status: "confirmed",
  },
  {
    hash: "b4e5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5",
    type: "stake",
    amount: 500,
    amountXLM: 500 / XLM_RATE,
    description: 'Staked $500 on "Will Arsenal keep a clean sheet?" – NO',
    timestamp: addDays(-3, 11),
    ledger: 50_123_789,
    fee: "100 stroops (0.0000100 XLM)",
    status: "confirmed",
  },
  {
    hash: "c5f6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6",
    type: "stake",
    amount: 150,
    amountXLM: 150 / XLM_RATE,
    description: 'Staked $150 on "Will total goals be over 2.5?" – YES',
    timestamp: addDays(-2, 14),
    ledger: 50_134_012,
    fee: "100 stroops (0.0000100 XLM)",
    status: "confirmed",
  },
  {
    hash: "d6a7e8f9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
    type: "claim",
    amount: 437,
    amountXLM: 437 / XLM_RATE,
    description: 'Claimed winnings from "Will Brighton win?" pool',
    timestamp: addDays(-1, 18),
    ledger: 50_145_678,
    fee: "100 stroops (0.0000100 XLM)",
    status: "confirmed",
  },
  {
    hash: "e7b8f9a0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    type: "vote_reward",
    amount: 15,
    amountXLM: 15 / XLM_RATE,
    description: 'Vote reward for resolving "Will Everton win?" poll',
    timestamp: addDays(-1, 19),
    ledger: 50_145_901,
    fee: "100 stroops (0.0000100 XLM)",
    status: "confirmed",
  },
  {
    hash: "f8c9a0b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
    type: "vote_reward",
    amount: 8,
    amountXLM: 8 / XLM_RATE,
    description: "Vote reward for resolving VAR review poll",
    timestamp: addDays(0, 9),
    ledger: 50_156_234,
    fee: "100 stroops (0.0000100 XLM)",
    status: "confirmed",
  },
  {
    hash: "a9d0b1c2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    type: "poll_creation",
    amount: 0,
    amountXLM: 0,
    description: 'Poll creation fee — "Will there be a red card?"',
    timestamp: addDays(-4, 12),
    ledger: 50_098_765,
    fee: "100 stroops (0.0000100 XLM)",
    status: "confirmed",
  },
];
/**
 * Mock/sample data for development and testing
 */

export const mockData = {
  // Implementation placeholder
};
