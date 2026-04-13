import { useState, useEffect } from "react";
import { Ic, ACH_ICONS, GameIcons } from "../icons.jsx";
import {
  calcLevel,
  ACHIEVEMENTS,
  MAX_LEVEL,
  DAILY_STREAK_BONUSES,
  GAMES,
} from "../constants.js";
import { SFX } from "../sounds.js";

// ── Big Win overlay ────────────────────────────────────────────────────────────
export function BigWinOverlay({ amount, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="relative flex flex-col items-center gap-3 animate-bigwin">
        <div className="w-16 h-16 mx-auto animate-bounce text-yellow-400">
          {Ic.win}
        </div>
        <div className="rounded-2xl border-2 border-yellow-400 bg-black/80 px-8 py-5 text-center shadow-[0_0_60px_#f59e0b88] backdrop-blur-sm">
          <p className="text-xs tracking-[0.4em] text-yellow-600 uppercase">
            Big Win!
          </p>
          <p
            className="mt-1 text-5xl font-bold text-yellow-400"
            style={{ textShadow: "0 0 30px #f59e0b" }}
          >
            +{amount}
          </p>
          <p className="mt-1 text-sm text-yellow-600">coins</p>
        </div>
        <div
          className="w-12 h-12 mx-auto animate-bounce text-yellow-500"
          style={{ animationDelay: "0.1s" }}
        >
          {Ic.trophy}
        </div>
      </div>
    </div>
  );
}

// ── Achievement toast ──────────────────────────────────────────────────────────
export function AchievementToast({ achievement, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 fadeup pointer-events-none">
      <div className="flex items-center gap-3 rounded-2xl border border-yellow-600/60 bg-black/90 px-5 py-3 shadow-[0_0_30px_#f59e0b44] backdrop-blur-sm">
        <span className="text-3xl">{achievement.icon}</span>
        <div>
          <p className="text-[9px] tracking-[0.3em] text-yellow-700 uppercase">
            Achievement Unlocked!
          </p>
          <p className="text-sm font-bold text-yellow-400">
            {achievement.label}
          </p>
          <p className="text-[10px] text-yellow-700">{achievement.desc}</p>
        </div>
      </div>
    </div>
  );
}

// ── Session Summary modal ──────────────────────────────────────────────────────
export function SessionSummary({ session, onClose }) {
  const net = session.endCoins - session.startCoins;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-glass m-4 w-full max-w-xs rounded-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 w-12 h-12 mx-auto text-yellow-400">
          {net >= 0 ? Ic.trophy : Ic.lose}
        </div>
        <h2 className="text-lg font-bold text-yellow-400 tracking-widest">
          SESSION OVER
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          {[
            ["Games Played", session.played],
            ["Wins", session.wins],
            ["Net Result", (net >= 0 ? "+" : "") + net + " coins"],
            ["Best Win", session.bestWin > 0 ? "+" + session.bestWin : "—"],
          ].map(([l, v]) => (
            <div
              key={l}
              className="rounded-xl border border-[#2a1e00] bg-[#0f0c00] p-2"
            >
              <p className="text-[9px] text-yellow-800">{l}</p>
              <p
                className={`text-sm font-bold ${l === "Net Result" ? (net >= 0 ? "text-yellow-400" : "text-red-400") : "text-yellow-400"}`}
              >
                {v}
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-gold mt-4 w-full py-2 text-sm"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ── Stats modal ────────────────────────────────────────────────────────────────
export function StatsModal({
  stats,
  achievements,
  leaderboard,
  gameStats,
  xp,
  onClose,
}) {
  const [tab, setTab] = useState("stats");
  const { level, xpInLevel, xpNeeded } = calcLevel(xp);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-glass m-4 w-full max-w-sm rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {["stats", "achievements", "leaderboard", "games"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${tab === t ? "btn-gold" : "btn-outline"}`}
              >
                {t === "stats" ? (
                  <span className="w-4 h-4">{Ic.stats}</span>
                ) : t === "achievements" ? (
                  <span className="w-4 h-4">{Ic.medal}</span>
                ) : t === "leaderboard" ? (
                  <span className="w-4 h-4">{Ic.trophy}</span>
                ) : (
                  <span className="w-4 h-4">{Ic.roll}</span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-yellow-700 hover:text-yellow-400 w-6 h-6 flex items-center justify-center"
          >
            <span className="w-4 h-4">{Ic.close}</span>
          </button>
        </div>

        {tab === "stats" && (
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Games", stats.played],
              ["Wins", stats.wins],
              ["Losses", stats.losses],
              [
                "Win Rate",
                stats.played
                  ? Math.round((stats.wins / stats.played) * 100) + "%"
                  : "—",
              ],
              [
                "Biggest Win",
                stats.biggestWin > 0 ? "+" + stats.biggestWin : "—",
              ],
              ["Biggest Loss", stats.biggestLoss < 0 ? stats.biggestLoss : "—"],
              ["Total Won", stats.totalWon > 0 ? "+" + stats.totalWon : "0"],
              ["Best Streak", stats.bestStreak],
            ].map(([l, v]) => (
              <div
                key={l}
                className="rounded-xl border border-[#2a1e00] bg-[#0f0c00] p-3"
              >
                <p className="text-[10px] text-yellow-800">{l}</p>
                <p className="mt-0.5 text-base font-bold text-yellow-400">
                  {v}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "achievements" && (
          <div className="space-y-2">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = achievements.includes(a.id);
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${unlocked ? "border-yellow-700 bg-yellow-950/40" : "border-[#1a1200] bg-[#0a0800] opacity-50"}`}
                >
                  <span className="w-7 h-7 flex-shrink-0 text-yellow-400">
                    {unlocked ? (
                      (ACH_ICONS[a.id] ?? Ic.win)
                    ) : (
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        opacity="0.35"
                      >
                        <rect x="6" y="9" width="8" height="8" rx="1.5" />
                        <path d="M8 9V7a2 2 0 0 1 4 0v2" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-bold ${unlocked ? "text-yellow-400" : "text-yellow-900"}`}
                    >
                      {a.label}
                    </p>
                    <p className="text-[10px] text-yellow-800">{a.desc}</p>
                  </div>
                  {unlocked && (
                    <span className="ml-auto w-4 h-4 text-yellow-600">
                      {Ic.win}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="space-y-2">
            <p className="text-[10px] tracking-widest text-yellow-800 uppercase mb-3">
              Top Sessions
            </p>
            {leaderboard.length === 0 && (
              <p className="text-center text-yellow-900 text-sm py-4">
                Play a session to see your best scores here
              </p>
            )}
            {leaderboard.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${entry.current ? "border-yellow-600/60 bg-yellow-950/30" : "border-[#2a1e00] bg-[#0f0c00]"}`}
              >
                <span className="text-lg flex-shrink-0">
                  {i === 0 ? (
                    <span className="w-5 h-5">{Ic.gold}</span>
                  ) : i === 1 ? (
                    <span className="w-5 h-5">{Ic.silver}</span>
                  ) : i === 2 ? (
                    <span className="w-5 h-5">{Ic.bronze}</span>
                  ) : (
                    <span className="text-yellow-800 text-xs">{i + 1}</span>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-yellow-400">
                    {entry.coins.toLocaleString()} coins
                    {entry.current && (
                      <span className="ml-2 text-[9px] text-yellow-600 tracking-wider">
                        CURRENT
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-yellow-800">
                    {entry.current
                      ? "This session"
                      : new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "games" && (
          <div className="space-y-2">
            <div className="rounded-xl border border-[#2a1e00] bg-[#0f0c00] p-3 mb-2">
              <p className="text-[10px] text-yellow-800">Level</p>
              <p className="text-xl font-bold text-yellow-400">
                {level}{" "}
                <span className="text-sm text-yellow-700">/ {MAX_LEVEL}</span>
              </p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-[#1a1200]">
                <div
                  className="h-1.5 rounded-full bg-yellow-500 transition-all"
                  style={{ width: `${(xpInLevel / xpNeeded) * 100}%` }}
                />
              </div>
              <p className="mt-0.5 text-[9px] text-yellow-800">
                {xpInLevel}/{xpNeeded} XP to next level
              </p>
            </div>
            {GAMES.map((g) => {
              const gs = gameStats?.[g.id] ?? {
                played: 0,
                wins: 0,
                totalWon: 0,
              };
              const wr =
                gs.played > 0 ? Math.round((gs.wins / gs.played) * 100) : 0;
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-3 rounded-xl border border-[#2a1e00] bg-[#0f0c00] px-3 py-2"
                >
                  <span className="w-5 h-5 text-yellow-600 flex-shrink-0">
                    {GameIcons[g.id]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-yellow-400">
                      {g.label}
                    </p>
                    <p className="text-[9px] text-yellow-800">
                      {gs.played} games · {wr}% win
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold ${gs.totalWon > 0 ? "text-yellow-500" : "text-yellow-900"}`}
                  >
                    {gs.totalWon > 0 ? `+${gs.totalWon}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="btn-gold mt-4 w-full py-2 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Daily Bonus modal (with streak) ───────────────────────────────────────────
export function DailyBonusModal({ streak, bonus, onClaim }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="card-glass m-4 w-full max-w-xs rounded-2xl p-6 text-center">
        <div className="mb-3 w-14 h-14 mx-auto text-yellow-400">{Ic.gift}</div>
        <h2 className="text-xl font-bold text-yellow-400 tracking-widest">
          DAILY BONUS
        </h2>
        <p className="mt-2 text-sm text-yellow-700">Day {streak} streak!</p>
        <div className="mt-3 flex justify-center gap-1 mb-3">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-6 rounded-full transition-all ${i < streak ? "bg-yellow-500" : "bg-yellow-900/40"}`}
            />
          ))}
        </div>
        <p
          className="text-4xl font-bold text-yellow-300"
          style={{ textShadow: "0 0 20px #f59e0b" }}
        >
          +{bonus}
        </p>
        <p className="text-sm text-yellow-600">coins</p>
        {streak < 7 && (
          <p className="mt-2 text-[10px] text-yellow-800">
            Come back tomorrow for +{DAILY_STREAK_BONUSES[Math.min(streak, 6)]}{" "}
            coins!
          </p>
        )}
        {streak >= 7 && (
          <p className="mt-2 text-[10px] text-yellow-500 flex items-center justify-center gap-1">
            <span className="w-3.5 h-3.5 inline-block">{Ic.fire}</span> Max
            streak bonus!
          </p>
        )}
        <button
          type="button"
          onClick={onClaim}
          className="btn-gold mt-5 w-full py-3 text-base tracking-widest"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.gift}</span>CLAIM
          </span>
        </button>
      </div>
    </div>
  );
}

// ── Bet Confirmation modal ─────────────────────────────────────────────────────
export function BetConfirm({ amount, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card-glass m-4 w-full max-w-xs rounded-2xl p-5 text-center">
        <div className="mb-3 w-12 h-12 mx-auto text-yellow-500">{Ic.warn}</div>
        <h2 className="text-base font-bold text-yellow-400">Large Bet</h2>
        <p className="mt-2 text-sm text-yellow-700">
          You're about to bet{" "}
          <span className="font-bold text-yellow-400">{amount} coins</span>. Are
          you sure?
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline flex-1 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-gold flex-1 py-2 text-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mini history chart ─────────────────────────────────────────────────────────
export function MiniChart({ history }) {
  if (history.length < 2) return null;
  const vals = history.slice(0, 20).reverse();
  const max = Math.max(...vals.map((h) => Math.abs(h.delta)), 1);
  const W = 200,
    H = 40;
  const pts = vals
    .map((h, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H / 2 - (h.delta / max) * (H / 2 - 4);
      return `${x},${y}`;
    })
    .join(" ");
  const lastPositive = vals[vals.length - 1]?.delta >= 0;
  return (
    <svg
      width={W}
      height={H}
      className="w-full opacity-60"
      viewBox={`0 0 ${W} ${H}`}
    >
      <line
        x1="0"
        y1={H / 2}
        x2={W}
        y2={H / 2}
        stroke="#2a1e00"
        strokeWidth="1"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={lastPositive ? "#f59e0b" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {vals.map((h, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H / 2 - (h.delta / max) * (H / 2 - 4);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill={h.delta >= 0 ? "#f59e0b" : "#ef4444"}
          />
        );
      })}
    </svg>
  );
}

// ── Shared BetSelector ─────────────────────────────────────────────────────────
export function BetSelector({
  bet,
  setBet,
  options = [10, 25, 50, 100],
  disabled,
  coins,
}) {
  // Auto-reset bet to highest affordable option when coins drop
  useEffect(() => {
    if (coins !== undefined && bet > coins) {
      const affordable = [...options].reverse().find((o) => o <= coins);
      if (affordable) setBet(affordable);
      else setBet(options[0]);
    }
  }, [coins, bet, options, setBet]);

  return (
    <div className="flex w-full items-center gap-2">
      <span className="text-[10px] tracking-widest text-yellow-800">BET</span>
      <div className="flex flex-1 gap-1.5">
        {options.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => {
              setBet(b);
              SFX.click();
            }}
            disabled={disabled || (coins !== undefined && b > coins)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-bold transition ${bet === b ? "btn-gold" : "btn-outline"} ${coins !== undefined && b > coins ? "opacity-30" : ""}`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tutorial Modal ─────────────────────────────────────────────────────────────
import { TUTORIAL_STEPS } from "../constants.js";

export function TutorialModal({ step, total, onNext, onSkip }) {
  const s = TUTORIAL_STEPS[step];
  const progress = ((step + 1) / total) * 100;
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="card-glass w-full max-w-sm rounded-2xl p-5 fadeup">
        <div className="mb-4 h-1 w-full rounded-full bg-[#1a1200]">
          <div
            className="h-1 rounded-full bg-yellow-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] tracking-widest text-yellow-800 uppercase">
            Step {step + 1} of {total}
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="text-[10px] text-yellow-800 hover:text-yellow-600 transition"
          >
            Skip
          </button>
        </div>
        <h3 className="text-base font-bold text-yellow-400 mb-2">{s.title}</h3>
        <p className="text-sm text-yellow-700 leading-relaxed">{s.body}</p>
        <button
          type="button"
          onClick={onNext}
          className="btn-gold mt-4 w-full py-2.5 text-sm tracking-wider"
        >
          {step < total - 1 ? "Next →" : "Let's Play!"}
        </button>
      </div>
    </div>
  );
}
