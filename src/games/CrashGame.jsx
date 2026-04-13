import { useState, useEffect, useRef } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";
export function CrashGame({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [cashedAt, setCashedAt] = useState(null);
  const intervalRef = useRef(null);
  const startRef = useRef(null);
  const crashRef = useRef(null);

  // House edge ~15%: E[crash] ≈ 1.18
  const genCrash = () => Math.max(1.0, 0.85 / (1 - Math.random() * 0.85));

  const startRound = () => {
    if (coins < bet) return;
    SFX.spin();
    crashRef.current = genCrash();
    setCashedAt(null);
    setMultiplier(1.0);
    setPhase("running");
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const cur = Math.pow(Math.E, elapsed * 0.4);
      if (cur >= crashRef.current) {
        clearInterval(intervalRef.current);
        setMultiplier(parseFloat(crashRef.current.toFixed(2)));
        setPhase("crashed");
        onResult(-bet);
        SFX.crash();
      } else {
        setMultiplier(parseFloat(cur.toFixed(2)));
      }
    }, 50);
  };

  const cashOut = () => {
    if (phase !== "running") return;
    clearInterval(intervalRef.current);
    const m = multiplier;
    setCashedAt(m);
    setPhase("cashed");
    const net = Math.floor(bet * m) - bet;
    onResult(net);
    net > bet * 2 ? SFX.bigwin() : SFX.cashout();
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const barPct = Math.min(100, ((multiplier - 1) / 9) * 100);
  const color =
    phase === "crashed"
      ? "#ef4444"
      : multiplier < 2
        ? "#22c55e"
        : multiplier < 5
          ? "#eab308"
          : "#f97316";

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Crash
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Cash out before it crashes!
        </p>
      </div>
      <div
        className={`crash-display relative flex h-36 w-full items-center justify-center ${phase === "crashed" ? "border-red-800" : phase === "cashed" ? "border-yellow-600" : "border-[#2a1e00]"}`}
      >
        <div className="crash-grid" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a1200]">
          <div
            className="h-1 transition-all duration-75 rounded-r"
            style={{
              width: `${barPct}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
        <div className="relative text-center">
          <p
            className="text-6xl font-bold tracking-tight transition-all duration-75"
            style={{
              color,
              textShadow: `0 0 30px ${color}88, 0 0 60px ${color}44`,
            }}
          >
            {multiplier.toFixed(2)}×
          </p>
          {phase === "crashed" && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-red-400 tracking-widest">
              <span className="w-4 h-4">{Ic.crash}</span>CRASHED
            </p>
          )}
          {phase === "cashed" && (
            <p className="mt-1 text-sm font-bold text-yellow-300">
              <span className="inline-flex items-center gap-1">
                <span className="w-3.5 h-3.5">{Ic.win}</span>Cashed at{" "}
                {cashedAt}× · +{Math.floor(bet * cashedAt) - bet} coins
              </span>
            </p>
          )}
          {phase === "running" && (
            <p className="mt-1 text-[10px] tracking-widest text-yellow-900 animate-pulse">
              LIVE
            </p>
          )}
        </div>
      </div>
      <BetSelector
        bet={bet}
        setBet={setBet}
        coins={coins}
        disabled={phase === "running"}
      />
      {phase === "running" ? (
        <button
          type="button"
          onClick={cashOut}
          className="w-full rounded-xl py-3 text-lg font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${color}, #d97706)`,
            boxShadow: `0 0 24px ${color}66`,
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.cashout}</span>CASH OUT{" "}
            {multiplier.toFixed(2)}×
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={startRound}
          disabled={coins < bet}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">
              {phase === "idle" ? Ic.start : Ic.replay}
            </span>
            {phase === "idle" ? "START" : "PLAY AGAIN"}
          </span>
        </button>
      )}
      {phase === "idle" && (
        <p className="text-center text-[10px] text-yellow-900">
          Cash out early for safe wins · Ride it for big multipliers
        </p>
      )}
    </div>
  );
}
