/**
 * Canonical per-team primary colour map, keyed by the exact team name used
 * throughout the app's mock data.
 *
 * Rules:
 * - Keys must match `Match.homeTeam` / `Match.awayTeam` values exactly
 *   (case-sensitive) so look-ups are always O(1) with no fuzzy matching.
 * - Values are CSS colour strings (hex preferred for consistency).
 * - `getTeamColor` returns a safe deterministic fallback for unknown teams
 *   so no component ever renders a missing-colour blank.
 *
 * Single source of truth consumed by:
 *   - components/home/match-card.tsx
 *   - components/voting/voting-card.tsx
 *   - components/match/match-header.tsx
 */

export const TEAM_COLORS: Record<string, string> = {
  Chelsea: "#034694",
  "Manchester United": "#DA291C",
  Arsenal: "#EF0107",
  Liverpool: "#C8102E",
  "Manchester City": "#6CABDD",
  Tottenham: "#132257",
  Newcastle: "#241F20",
  "Aston Villa": "#95BFE5",
  Brighton: "#0057B8",
  "West Ham": "#7A263A",
  Everton: "#003399",
  Wolves: "#FDB913",
};

/**
 * Look up a team's primary colour, falling back to a neutral cyan if the team
 * is not in the map.  Using a single deterministic fallback means every
 * unknown-team badge is visually distinct from "no colour applied" (transparent).
 */
export function getTeamColor(teamName: string): string {
  return TEAM_COLORS[teamName] ?? "#00d9ff";
}
