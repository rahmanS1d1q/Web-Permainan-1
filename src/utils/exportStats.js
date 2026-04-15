// ── Export Stats to CSV ────────────────────────────────────────────────────────
import { GAMES } from "../constants.js";

export function exportStatsCSV({
  stats,
  gameStats,
  history,
  achievements,
  xp,
  highScore,
  coins,
}) {
  const rows = [];
  const now = new Date().toLocaleString("id-ID");

  // ── Section 1: Overview ──
  rows.push(["=== CASINO MINI — STATS EXPORT ===", ""]);
  rows.push(["Exported at", now]);
  rows.push([""]);

  rows.push(["=== OVERVIEW ===", ""]);
  rows.push(["Current Balance", coins]);
  rows.push(["Best Balance", highScore]);
  rows.push(["Total Games Played", stats.played]);
  rows.push(["Total Wins", stats.wins]);
  rows.push(["Total Losses", stats.losses]);
  rows.push([
    "Win Rate",
    stats.played > 0
      ? `${Math.round((stats.wins / stats.played) * 100)}%`
      : "0%",
  ]);
  rows.push(["Biggest Win", stats.biggestWin]);
  rows.push(["Biggest Loss", stats.biggestLoss]);
  rows.push(["Total Coins Won", stats.totalWon]);
  rows.push(["Best Win Streak", stats.bestStreak]);
  rows.push(["Current Streak", stats.currentStreak]);
  rows.push([""]);

  // ── Section 2: Per-game stats ──
  rows.push(["=== PER GAME STATS ===", ""]);
  rows.push(["Game", "Played", "Wins", "Win Rate", "Total Won"]);
  GAMES.forEach((g) => {
    const gs = gameStats?.[g.id] ?? { played: 0, wins: 0, totalWon: 0 };
    const wr =
      gs.played > 0 ? `${Math.round((gs.wins / gs.played) * 100)}%` : "0%";
    rows.push([g.label, gs.played, gs.wins, wr, gs.totalWon]);
  });
  rows.push([""]);

  // ── Section 3: Achievements ──
  rows.push(["=== ACHIEVEMENTS ===", ""]);
  rows.push(["Unlocked", achievements.length]);
  rows.push(["Achievement IDs", achievements.join(", ")]);
  rows.push([""]);

  // ── Section 4: Recent history (last 20) ──
  rows.push(["=== RECENT HISTORY (last 20 rounds) ===", ""]);
  rows.push(["#", "Game", "Result", "Time"]);
  history.slice(0, 20).forEach((h, i) => {
    const game = GAMES.find((g) => g.id === h.game)?.label ?? h.game;
    const result = h.delta > 0 ? `+${h.delta}` : `${h.delta}`;
    const time = h.time ? new Date(h.time).toLocaleString("id-ID") : "-";
    rows.push([i + 1, game, result, time]);
  });

  // Convert to CSV string
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          // Quote cells that contain commas or quotes
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(","),
    )
    .join("\n");

  // Trigger download
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `casino-mini-stats-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
