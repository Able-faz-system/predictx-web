"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useBadges } from "@/hooks/use-badges";
import { BadgeComponent } from "@/components/shared/badge-component";

export function BadgesStrip() {
  const badges = useBadges();

  return (
    <section aria-label="Your Badges" className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-[var(--accent-cyan)] shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
        <h2 className="font-display text-lg font-black uppercase text-[var(--accent-cyan)] text-glow-cyan tracking-wider">
          Your Badges
        </h2>
        <span className="text-xs text-muted-foreground font-mono">
          {badges.filter((b) => b.earned).length}/{badges.length} earned
        </span>
      </div>

      {/* Badge cards row */}
      <div className="flex flex-wrap gap-4">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="relative flex flex-col items-center gap-2"
          >
            {badge.earned ? (
              <BadgeComponent
                type={badge.type}
                label={badge.label}
                variant={badge.variant}
              />
            ) : (
              /* Locked state */
              <div
                className="relative inline-flex items-center gap-2 px-3 py-1.5 opacity-40 grayscale"
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                aria-label={`${badge.label} — locked`}
              >
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {badge.label}
                </span>
              </div>
            )}

            {/* Tooltip description */}
            <span className="text-[10px] text-muted-foreground text-center max-w-[100px] leading-tight">
              {badge.description}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
