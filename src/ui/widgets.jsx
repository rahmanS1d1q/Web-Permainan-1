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
