"use client";

import { motion, type Transition } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlowIconProps {
  icon: LucideIcon;
  color?: string;
  size?: number;
  animated?: boolean;
  animationType?: "pulse" | "float" | "rotate";
  className?: string;
}

export function GlowIcon({
  icon: Icon,
  color = "#00d9ff",
  size = 24,
  animated = true,
  animationType = "pulse",
  className,
}: GlowIconProps) {
  const getAnimation = () => {
    switch (animationType) {
      case "pulse":
        return {
          scale: [1, 1.1, 1],
          filter: [
            `drop-shadow(0 0 5px ${color})`,
            `drop-shadow(0 0 15px ${color})`,
            `drop-shadow(0 0 5px ${color})`,
          ],
        };
      case "float":
        return {
          y: [0, -5, 0],
          filter: `drop-shadow(0 0 10px ${color})`,
        };
      case "rotate":
        return {
          rotate: [0, 360],
          filter: `drop-shadow(0 0 10px ${color})`,
        };
      default:
        return {};
    }
  };

  const getTransition = (): Transition => {
    switch (animationType) {
      case "pulse":
        return { duration: 2, repeat: Infinity, ease: "easeInOut" };
      case "float":
        return { duration: 3, repeat: Infinity, ease: "easeInOut" };
      case "rotate":
        return { duration: 4, repeat: Infinity, ease: "linear" };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className={cn("inline-flex items-center justify-center", className)}
      animate={animated ? getAnimation() : {}}
      transition={getTransition()}
      whileHover={
        animated
          ? {
              scale: 1.2,
              rotate: animationType === "rotate" ? 0 : 10,
              filter: `drop-shadow(0 0 20px ${color})`,
            }
          : {}
      }
    >
      <Icon
        size={size}
        style={{
          color,
          filter: `drop-shadow(0 0 ${animated ? 5 : 3}px ${color})`,
          strokeWidth: 1.5,
        }}
      />
    </motion.div>
  );
}
