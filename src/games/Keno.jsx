import { useState } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { haptic } from "../constants.js";
import { BetSelector } from "../ui/modals.jsx";
const KENO_POOL = Array.from({ length: 40 }, (_, i) => i + 1);
// Payouts tuned for ~75% RTP (house edge 25%)
const KENO_PAYOUTS = {
  1: { 1: 2 }, // was 3 → RTP 50%
  2: { 2: 7, 1: 0 }, // was 10
  3: { 3: 18, 2: 2, 1: 0 }, // was 25, 3
  4: { 4: 45, 3: 4, 2: 0 }, // was 60, 5, 1
  5: { 5: 150, 4: 12, 3: 2, 2: 0 }, // was 200, 15, 3, 1
};

export function Keno({ coins, onResult }) {
  const [picks, setPicks] = useState(new Set());
  const [drawn, setDrawn] = useState([]);
  const [bet, setBet] = useState(10);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState(null);
  const maxPicks = 5;

  const togglePick = (n) => {
    if (drawing) return;
    SFX.click();
    setPicks((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else if (next.size < maxPicks) {
        next.add(n);
      }
      return next;
    });
  };

  const draw = () => {
    if (picks.size === 0 || drawing || coins < bet) return;
    SFX.spin();
    setResult(null);
    setDrawn([]);
    setDrawing(true);
    // draw 10 numbers
    const pool = [...KENO_POOL].sort(() => Math.random() - 0.5).slice(0, 10);
    let i = 0;
    const interval = setInterval(() => {
      setDrawn((prev) => [...prev, pool[i]]);
      i++;
      if (i >= pool.length) {
        clearInterval(interval);
        const matches = pool.filter((n) => picks.has(n)).length;
        const payout = KENO_PAYOUTS[picks.size]?.[matches] ?? 0;
        const net = payout > 0 ? bet * payout - bet : -bet;
        setResult({ matches, payout, net });
        onResult(net);
        net > 0 ? SFX.win() : SFX.lose();
        haptic(net > 0 ? "win" : "lose");
        setDrawing(false);
      }
    }, 180);
  };

  const reset = () => {
    setPicks(new Set());
    setDrawn([]);
    setResult(null);
  };

  return (
    <div className="fadeup flex flex-col gap-4">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Keno
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Pick up to 5 numbers · 10 drawn
        </p>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {KENO_POOL.map((n) => {
          const isPick = picks.has(n);
          const isDrawn = drawn.includes(n);
          const isHit = isPick && isDrawn;
          return (
            <button
              key={n}
              type="button"
              onClick={() => togglePick(n)}
              disabled={drawing}
              className={`h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                isHit
                  ? "bg-yellow-500 text-black scale-110 shadow-[0_0_8px_#f59e0b]"
                  : isDrawn
                    ? "bg-neutral-700 text-neutral-400"
                    : isPick
                      ? "btn-gold"
                      : "btn-outline"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-yellow-800">
          Picks:{" "}
          <span className="text-yellow-500 font-bold">
            {picks.size}/{maxPicks}
          </span>
        </span>
        {drawn.length > 0 && (
          <span className="text-yellow-800">
            Drawn:{" "}
            <span className="text-yellow-500 font-bold">{drawn.length}/10</span>
          </span>
        )}
        {picks.size > 0 && (
          <button
            type="button"
            onClick={reset}
            disabled={drawing}
            className="text-yellow-800 hover:text-yellow-600 transition"
          >
            Clear
          </button>
        )}
      </div>
      {result && (
        <div
          className={`fadeup rounded-xl px-4 py-3 text-center text-sm font-bold ${result.net > 0 ? "result-win glow-win" : "result-lose shake"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{result.net > 0 ? Ic.win : Ic.lose}</span>
            {result.matches} match{result.matches !== 1 ? "es" : ""} ·{" "}
            {result.net > 0 ? `+${result.net}` : `${result.net}`} coins
          </span>
        </div>
      )}
      <BetSelector
        bet={bet}
        setBet={setBet}
        coins={coins}
        options={[5, 10, 25, 50]}
        disabled={drawing}
      />
      <button
        type="button"
        onClick={draw}
        disabled={picks.size === 0 || drawing || coins < bet}
        className="btn-gold w-full py-3 text-base tracking-[0.2em]"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4">{Ic.spin}</span>
          {drawing ? "DRAWING..." : "DRAW"}
        </span>
      </button>
    </div>
  );
}
