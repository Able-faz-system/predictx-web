"use client"

import { TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { EmptyState } from "./shared/empty-state"

const completedPredictions = [
  {
    id: 1,
    match: "Newcastle vs Aston Villa",
    question: "Will Gordon score a goal?",
    yourSide: "yes",
    yourStake: 250,
    result: "yes",
    payout: 412,
    profit: 162,
    roi: 64.8,
    date: "Dec 15, 2025",
    won: true,
  },
  {
    id: 2,
    match: "Liverpool vs Chelsea",
    question: "Will Chelsea keep a clean sheet?",
    yourSide: "yes",
    yourStake: 180,
    result: "no",
    payout: 0,
    profit: -180,
    roi: -100,
    date: "Dec 14, 2025",
    won: false,
  },
  {
    id: 3,
    match: "Man United vs Arsenal",
    question: "Will there be 4+ goals?",
    yourSide: "no",
    yourStake: 200,
    result: "no",
    payout: 356,
    profit: 156,
    roi: 78,
    date: "Dec 13, 2025",
    won: true,
  },
  {
    id: 4,
    match: "Tottenham vs Brighton",
    question: "Will Son be subbed out?",
    yourSide: "yes",
    yourStake: 120,
    result: "no",
    payout: 0,
    profit: -120,
    roi: -100,
    date: "Dec 12, 2025",
    won: false,
  },
  {
    id: 5,
    match: "West Ham vs Wolves",
    question: "Will Bowen score or assist?",
    yourSide: "yes",
    yourStake: 150,
    result: "yes",
    payout: 289,
    profit: 139,
    roi: 92.7,
    date: "Dec 11, 2025",
    won: true,
  },
  {
    id: 6,
    match: "Crystal Palace vs Brentford",
    question: "Will Palace win?",
    yourSide: "no",
    yourStake: 95,
    result: "yes",
    payout: 0,
    profit: -95,
    roi: -100,
    date: "Dec 10, 2025",
    won: false,
  },
]

export function CompletedPredictions() {
  const totalProfit = completedPredictions.reduce((sum, pred) => sum + pred.profit, 0)
  const totalStaked = completedPredictions.reduce((sum, pred) => sum + pred.yourStake, 0)
  const winRate = (completedPredictions.filter((p) => p.won).length / completedPredictions.length) * 100

  if (completedPredictions.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-10 h-10" />}
        title="No Completed Predictions"
        description="Your resolved stakes will appear here once a poll is settled."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border clip-corner p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total P/L</div>
          <div
            className={`font-display text-2xl font-black ${totalProfit > 0 ? "text-success" : "text-accent"} ${totalProfit > 0 ? "text-glow-green" : ""}`}
          >
            {totalProfit > 0 ? "+" : ""}${totalProfit.toFixed(0)}
          </div>
        </div>
        <div className="bg-surface border border-border clip-corner p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Win Rate</div>
          <div className="font-display text-2xl font-black text-primary text-glow-cyan">{winRate.toFixed(0)}%</div>
        </div>
        <div className="bg-surface border border-border clip-corner p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total ROI</div>
          <div className={`font-display text-2xl font-black ${totalProfit > 0 ? "text-success" : "text-accent"}`}>
            {((totalProfit / totalStaked) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        {completedPredictions.map((pred) => (
          <div
            key={pred.id}
            className={`bg-surface border-2 clip-corner-lg p-5 transition-all ${pred.won ? "border-success/30 hover:border-success/50" : "border-accent/30 hover:border-accent/50"}`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {pred.won ? (
                    <div className="flex items-center gap-2 px-2 py-1 bg-success/20 text-success rounded text-xs font-bold uppercase">
                      <TrendingUp className="h-3 w-3" />
                      WON
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1 bg-accent/20 text-accent rounded text-xs font-bold uppercase">
                      <TrendingDown className="h-3 w-3" />
                      LOST
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">{pred.match}</div>
                </div>
                <h3 className="font-bold text-foreground">{pred.question}</h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {pred.date}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Your Side</div>
                <div
                  className={`text-sm font-bold uppercase ${pred.yourSide === "yes" ? "text-success" : "text-accent"}`}
                >
                  {pred.yourSide}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Result</div>
                <div className="text-sm font-bold uppercase text-foreground">{pred.result}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Stake</div>
                <div className="text-sm font-mono font-bold">${pred.yourStake}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Payout</div>
                <div className={`text-sm font-mono font-bold ${pred.won ? "text-gold" : "text-muted"}`}>
                  ${pred.payout}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">P/L</div>
                <div className={`text-sm font-mono font-bold ${pred.profit > 0 ? "text-success" : "text-accent"}`}>
                  {pred.profit > 0 ? "+" : ""}${pred.profit} ({pred.roi.toFixed(0)}%)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
