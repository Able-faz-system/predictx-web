"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { GlowCard } from "@/components/shared/glow-card";
import { TeamBadge } from "@/components/shared/team-badge";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { GamingButton } from "@/components/shared/gaming-button";
import { AchievementToast } from "@/components/shared/achievement-toast";

import { VoteTally } from "./vote-tally";
import { EvidenceSection } from "./evidence-section";

import { type Poll, type Match } from "@/lib/mock-data";
import { useVoting, type VoteDecision } from "@/hooks/use-voting";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { getTeamColor } from "@/lib/team-colors";

interface VotingCardProps {
    poll: Poll;
    match: Match;
}

type CardState = "idle" | "confirming" | "processing" | "voted";

export function VotingCard({ poll, match }: VotingCardProps) {
    const [cardState, setCardState] = useState<CardState>("idle");
    const [selectedDecision, setSelectedDecision] = useState<VoteDecision | null>(null);

    const { castVote, getVoteReward } = useVoting();
    const { isConnected, connect } = useWallet();

    const rewardAmount = getVoteReward(poll.id);

    const homeTeam = {
        id: `home-${match.id}`,
        name: match.homeTeam,
        primaryColor: getTeamColor(match.homeTeam),
    };
    const awayTeam = {
        id: `away-${match.id}`,
        name: match.awayTeam,
        primaryColor: getTeamColor(match.awayTeam),
    };

    const handleSelectVote = (decision: VoteDecision) => {
        if (!isConnected) {
            connect();
            return;
        }
        setSelectedDecision(decision);
        setCardState("confirming");
    };

    const handleConfirm = async () => {
        if (!selectedDecision) return;
        setCardState("processing");

        try {
            await castVote(poll.id, selectedDecision);
            setCardState("voted");

            // Show Achievement Toast
            toast.custom(
                (t) => (
                    <AchievementToast
                        title="Vote Cast"
                        description={`$${rewardAmount.toFixed(2)} earned`}
                        icon={<Scale className="w-6 h-6" />}
                        xp={25}
                        onClose={() => toast.dismiss(t)}
                    />
                ),
                { duration: 4000 }
            );
        } catch (error) {
            // Revert on error
            setCardState("idle");
            setSelectedDecision(null);
        }
    };

    const handleCancel = () => {
        setCardState("idle");
        setSelectedDecision(null);
    };

    // Compute deadline: voting is allowed 2 hours after match lockTime (we use kickoff for demo purposes)
    // Real implementation would calculate properly. Let's add 2 hours to kickoff for mock.
    const lockTarget = new Date(match.kickoff).getTime() + 2 * 60 * 60 * 1000;
    const deadlineTime = new Date(lockTarget).toISOString();

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case "score_prediction": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
            case "player_event": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
            case "team_event": return "text-green-400 bg-green-400/10 border-green-400/20";
            default: return "text-orange-400 bg-orange-400/10 border-orange-400/20";
        }
    };

    return (
        <GlowCard variant="default" className={cn("transition-opacity", cardState === "voted" ? "opacity-60" : "")}>
            {/* Match Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-6 border-b border-border/50 bg-background/30 -mx-6 -mt-6 rounded-t-[10px] mb-6">
                <div className="flex items-center gap-4">
                    <TeamBadge team={homeTeam} size="sm" />
                    <div className="text-center px-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Final Score</div>
                        <div className="font-display font-black text-xl">
                            {match.score?.home ?? 0} <span className="text-muted-foreground font-normal mx-1">—</span> {match.score?.away ?? 0}
                        </div>
                    </div>
                    <TeamBadge team={awayTeam} size="sm" />
                </div>
                <div className="flex items-center gap-4 md:flex-col md:items-end justify-between md:gap-1">
                    {cardState === "voted" ? (
                        <div className="flex items-center gap-2 text-success px-3 py-1 bg-success/10 rounded-full border border-success/30 font-bold text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Voted ✅
                        </div>
                    ) : (
                        <CountdownTimer targetTime={deadlineTime} compact className="text-primary text-sm font-mono" />
                    )}
                    <span className="text-xs text-muted-foreground">Voting closes 2h post-match</span>
                </div>
            </div>

            {/* Poll Details */}
            <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2">
                    <span className={cn("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border", getCategoryColor(poll.category))}>
                        {poll.category.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">#{poll.id}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-black text-foreground">
                    {poll.question}
                </h3>

                <div className="text-sm font-bold text-gold flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Vote to earn ${rewardAmount.toFixed(2)}
                </div>
            </div>

            {/* Evidence Section */}
            <EvidenceSection matchId={match.id} className="mb-8" />

            {/* Vote Tally */}
            <div className="mb-6 p-4 rounded-lg bg-background/50 border border-border">
                <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Community Tally</h4>
                <VoteTally yesVotes={poll.yesPool} noVotes={poll.noPool} unclearVotes={Math.floor(poll.participants / 3)} animated />
            </div>

            {/* Interaction Area */}
            <div className="relative min-h-[140px] flex flex-col justify-end">
                <AnimatePresence mode="wait">
                    {cardState === "idle" && (
                        <motion.div
                            key="voting-options"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-3"
                        >
                            <GamingButton variant="primary" onClick={() => handleSelectVote("yes")} className="h-14 text-sm tracking-wider">
                                <span className="text-xl mr-2">✓</span> YES
                            </GamingButton>
                            <GamingButton variant="danger" onClick={() => handleSelectVote("no")} className="h-14 text-sm tracking-wider">
                                <span className="text-xl mr-2">✗</span> NO
                            </GamingButton>
                            <button
                                type="button"
                                onClick={() => handleSelectVote("unclear")}
                                className="h-14 rounded clip-corner bg-surface border border-border hover:border-muted-foreground hover:bg-surface/80 transition-colors font-bold uppercase tracking-wider text-muted-foreground"
                            >
                                UNCLEAR / DISPUTE
                            </button>
                        </motion.div>
                    )}

                    {cardState === "confirming" && selectedDecision && (
                        <motion.div
                            key="confirming-flow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="p-4 md:p-6 bg-surface border border-primary/50 rounded-lg clip-corner-lg shadow-[0_0_30px_rgba(0,217,255,0.1)]"
                        >
                            <div className="flex items-start gap-3 mb-6">
                                <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                                <div>
                                    <h4 className="font-display font-bold uppercase text-foreground">Confirm Your Vote</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        You are voting <span className={cn("font-bold uppercase", selectedDecision === "yes" ? "text-primary" : selectedDecision === "no" ? "text-danger" : "text-foreground")}>{selectedDecision}</span>. This action cannot be undone and commits your oracle answer.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <GamingButton variant={selectedDecision === "yes" ? "primary" : selectedDecision === "no" ? "danger" : "ghost"} onClick={handleConfirm} className="flex-1">
                                    Confirm Vote
                                </GamingButton>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-3 font-bold uppercase text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {cardState === "processing" && (
                        <motion.div
                            key="processing-flow"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center p-6 bg-surface border border-border/50 rounded-lg"
                        >
                            <div className="w-12 h-12 mb-4 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <div className="text-primary font-mono font-bold uppercase tracking-widest animate-pulse">
                                Recording Vote to Ledger...
                            </div>
                        </motion.div>
                    )}

                    {cardState === "voted" && (
                        <motion.div
                            key="voted-success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center p-6 bg-success/10 border border-success/30 rounded-lg"
                        >
                            <Scale className="w-8 h-8 text-success mb-3" />
                            <h4 className="font-display font-black text-xl uppercase text-success">
                                Thank You For Judging!
                            </h4>
                            <p className="text-sm text-success/80 font-bold mt-1">
                                You earned ${rewardAmount.toFixed(2)}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GlowCard>
    );
}
