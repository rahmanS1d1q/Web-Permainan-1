import { Ic } from "../icons.jsx";
import { calcLevel, getVipTier, PRESTIGE_BONUSES } from "../constants.js";

export function XPBar({ xp, prestige }) {
  const { level, xpInLevel, xpNeeded } = calcLevel(xp);
  const pct = Math.min(100, (xpInLevel / xpNeeded) * 100);
  const vip = getVipTier(level);
  const prestigeInfo =
    prestige?.level > 0 ? PRESTIGE_BONUSES[prestige.level - 1] : null;
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold flex-shrink-0 transition-all duration-500 relative"
        style={{
          borderColor: vip.color,
          color: vip.color,
          boxShadow: `0 0 8px ${vip.glow}`,
          background: "#0f0c00",
        }}
      >
        {level}
        {prestigeInfo && (
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-yellow-500 text-black text-[7px] font-bold flex items-center justify-center border border-black">
            {prestige.level}
          </span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-bold tracking-wider"
              style={{ color: vip.color }}
            >
              {vip.name}
            </span>
            {prestigeInfo && (
              <span className="text-[8px] text-yellow-600 border border-yellow-800/40 rounded px-1">
                {prestigeInfo.label}
              </span>
            )}
          </div>
          <span className="text-[9px] text-yellow-800">
            {xpInLevel}/{xpNeeded} XP
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#1a1200]">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${vip.color}88, ${vip.color})`,
              boxShadow: `0 0 6px ${vip.glow}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Weekly Challenge widget ────────────────────────────────────────────────────
export function WeeklyWidget({ challenge, progress, onClose }) {
  const pct = Math.min(100, (progress / challenge.target) * 100);
  const done = progress >= challenge.target;
  return (
    <div className="fadeup rounded-xl border border-yellow-800/40 bg-[#1a1200] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-widest text-yellow-700 uppercase">
          Weekly Challenge
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-4 h-4 text-yellow-800 hover:text-yellow-600"
        >
          {Ic.close}
        </button>
      </div>
      <p className="text-sm text-yellow-400 font-bold">{challenge.desc}</p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-[#0a0800]">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${done ? "bg-yellow-400" : "bg-yellow-700"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[10px] text-yellow-800">
          {Math.min(progress, challenge.target)}/{challenge.target}
        </span>
        <span className="text-[10px] text-yellow-600">
          +{challenge.reward} coins
        </span>
      </div>
      {done && (
        <p className="mt-1 text-[10px] text-yellow-400 text-center">
          Complete! Claim in Stats.
        </p>
      )}
    </div>
  );
}

// ── Hot Streak Indicator ───────────────────────────────────────────────────────
export function HotStreak({ streak }) {
  if (streak < 3) return null;

  const level = streak >= 10 ? 3 : streak >= 6 ? 2 : 1;
  const colors = {
    1: { from: "#f97316", to: "#ef4444", glow: "#f9731666", label: "HOT" },
    2: { from: "#fbbf24", to: "#f97316", glow: "#fbbf2488", label: "ON FIRE" },
    3: { from: "#fff", to: "#fbbf24", glow: "#ffffff99", label: "UNSTOPPABLE" },
  }[level];

  return (
    <div
      className="streak-indicator fadeup flex items-center justify-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: `linear-gradient(135deg, ${colors.from}22, ${colors.to}33)`,
        border: `1px solid ${colors.from}66`,
        boxShadow: `0 0 16px ${colors.glow}, inset 0 1px 0 ${colors.from}22`,
      }}
    >
      {/* Flame SVGs */}
      <div className="flex items-end gap-0.5">
        {Array.from({ length: Math.min(streak, 5) }, (_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 28"
            fill="none"
            className="flame-svg"
            style={{
              width: 10 + i * 2,
              height: 14 + i * 2,
              animationDelay: `${i * 0.12}s`,
              filter: `drop-shadow(0 0 ${3 + i}px ${colors.from})`,
            }}
          >
            <path
              d="M10 2 C10 2 6 7 6 12 C6 14 7 15 8 15 C8 12 9 10 10 9 C10 9 12 12 12 15 C13 15 14 14 14 12 C14 8 10 2 10 2Z"
              fill={i % 2 === 0 ? colors.from : colors.to}
              opacity="0.9"
            />
            <path
              d="M10 10 C10 10 8 13 8 16 C8 18 9 19 10 19 C11 19 12 18 12 16 C12 13 10 10 10 10Z"
              fill="#fef9c3"
              opacity="0.7"
            />
            <path
              d="M10 15 C10 15 9 17 9 18.5 C9 19.5 9.5 20 10 20 C10.5 20 11 19.5 11 18.5 C11 17 10 15 10 15Z"
              fill="#fff"
              opacity="0.5"
            />
          </svg>
        ))}
      </div>
      {/* Streak count */}
      <div className="flex flex-col items-center leading-none">
        <span
          className="text-[8px] font-bold tracking-[0.2em]"
          style={{ color: colors.from }}
        >
          {colors.label}
        </span>
        <span
          className="text-base font-black"
          style={{ color: colors.to, textShadow: `0 0 8px ${colors.glow}` }}
        >
          {streak}×
        </span>
      </div>
    </div>
  );
}
