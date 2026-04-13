import { useState, useEffect, useCallback, useRef } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";
import {
  SLOT_SYMBOLS,
  SYM_IDS,
  SYM_PAYOUTS,
  SYM_LABELS,
} from "../slotSymbols.jsx";

// Render a single slot symbol SVG
function SlotSymbol({ id, spinning }) {
  return (
    <div
      className={`select-none transition-all ${spinning ? "reel-spinning" : ""}`}
      style={{
        width: "clamp(56px,14vw,72px)",
        height: "clamp(56px,14vw,72px)",
        flexShrink: 0,
      }}
    >
      {SLOT_SYMBOLS[id]}
    </div>
  );
}

export function SlotMachine({ coins, onResult, turbo }) {
  const [reels, setReels] = useState(["cherry", "cherry", "cherry"]);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [result, setResult] = useState(null);
  const [reelAnim, setReelAnim] = useState([false, false, false]);
  const [autoSpin, setAutoSpin] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const autoRef = useRef(false);
  const spinRef = useRef(null);

  const doSpin = useCallback(
    (currentBet, currentCoins) => {
      if (currentCoins < currentBet) {
        autoRef.current = false;
        setAutoSpin(false);
        return;
      }
      SFX.slotSpinStart();
      setResult(null);
      setSpinning(true);
      setReelAnim([true, true, true]);

      const final = [0, 1, 2].map(
        () => SYM_IDS[Math.floor(Math.random() * SYM_IDS.length)],
      );
      const delay = turbo ? 200 : 600;
      const step = turbo ? 150 : 400;

      [0, 1, 2].forEach((i) => {
        setTimeout(
          () => {
            SFX.slotReelStop(i);
            setReels((prev) => {
              const r = [...prev];
              r[i] = final[i];
              return r;
            });
            setReelAnim((prev) => {
              const a = [...prev];
              a[i] = false;
              return a;
            });

            if (i === 2) {
              SFX.slotSpinStop();
              setTimeout(
                () => {
                  const key = final.join("-");
                  const mult = SYM_PAYOUTS[key] ?? 0;
                  const net =
                    mult > 0 ? currentBet * mult - currentBet : -currentBet;
                  const isJackpot = key === "diamond-diamond-diamond";
                  setResult({
                    win: mult > 0,
                    amount: Math.abs(net),
                    mult,
                    isJackpot,
                    symbols: final,
                  });
                  onResult(net, isJackpot ? "jackpot" : undefined);
                  if (net > 0) {
                    isJackpot || mult >= 20 ? SFX.slotJackpot() : SFX.slotWin();
                  } else SFX.lose();
                  setSpinning(false);
                  if (autoRef.current) setAutoCount((c) => c + 1);
                },
                turbo ? 50 : 200,
              );
            }
          },
          delay + i * step,
        );
      });
    },
    [onResult, turbo],
  );

  useEffect(() => {
    if (!autoSpin || spinning) return;
    spinRef.current = setTimeout(
      () => {
        if (autoRef.current) doSpin(bet, coins);
      },
      turbo ? 200 : 600,
    );
    return () => clearTimeout(spinRef.current);
  }, [autoSpin, spinning, bet, coins, doSpin, turbo]);

  const spin = () => {
    if (spinning || coins < bet) return;
    autoRef.current = false;
    setAutoSpin(false);
    doSpin(bet, coins);
  };

  const toggleAuto = () => {
    if (autoSpin) {
      autoRef.current = false;
      setAutoSpin(false);
      setAutoCount(0);
    } else {
      autoRef.current = true;
      setAutoSpin(true);
      setAutoCount(0);
      doSpin(bet, coins);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.code === "Space" && !e.target.matches("input,textarea,button")) {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spinning, bet, coins]);

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Slot Machine
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Match 3 symbols · Space to spin
        </p>
      </div>

      {/* Reel window */}
      <div
        className="relative w-full rounded-2xl border border-[#3d2e00] overflow-hidden shadow-[inset_0_2px_0_#ffffff08,0_8px_32px_#00000088]"
        style={{
          background:
            "linear-gradient(180deg,#1a1200 0%,#0d0900 60%,#080500 100%)",
        }}
      >
        {/* top decorative line */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent" />

        {/* machine header */}
        <div className="flex items-center justify-center gap-3 px-4 pt-3 pb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-900/50" />
          <span className="text-[9px] tracking-[0.4em] text-yellow-800 font-bold">
            CASINO MINI SLOTS
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-900/50" />
        </div>

        {/* reels container — fills full width */}
        <div className="flex gap-2 px-3 pb-3">
          {reels.map((sym, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 overflow-hidden transition-all duration-200"
              style={{
                minHeight: 100,
                background: reelAnim[i]
                  ? "linear-gradient(180deg,#2a1800,#1a1000)"
                  : "linear-gradient(180deg,#1e1500,#0f0b00)",
                borderColor: reelAnim[i]
                  ? "#f59e0b"
                  : result?.win
                    ? "#78350f"
                    : "#2a1e00",
                boxShadow: reelAnim[i]
                  ? "0 0 24px #f59e0b66, inset 0 1px 0 #ffffff12"
                  : result?.win
                    ? "0 0 14px #f59e0b22, inset 0 1px 0 #ffffff08"
                    : "inset 0 2px 4px #00000044, inset 0 1px 0 #ffffff06",
              }}
            >
              {/* top shadow strip */}
              <div className="w-full h-3 bg-gradient-to-b from-black/40 to-transparent flex-shrink-0" />
              <SlotSymbol id={sym} spinning={reelAnim[i]} />
              {/* bottom shadow strip */}
              <div className="w-full h-3 bg-gradient-to-t from-black/40 to-transparent flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* payline indicator */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-900/40" />
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-600/60" />
            <span className="text-[9px] tracking-[0.35em] text-yellow-900 font-bold">
              PAYLINE
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-600/60" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-900/40" />
        </div>

        {/* bottom decorative line */}
        <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-900/40 to-transparent" />
      </div>

      {/* Result */}
      {result && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${result.win ? "result-win glow-win" : "result-lose shake"}`}
        >
          {result.win ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.win}</span>
              WIN! +{result.amount} coins ×{result.mult}
              {result.isJackpot && (
                <span className="ml-1 text-xs text-yellow-300 tracking-widest">
                  JACKPOT!
                </span>
              )}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.lose}</span>No match — lost{" "}
              {result.amount} coins
            </span>
          )}
        </div>
      )}

      <BetSelector
        bet={bet}
        setBet={setBet}
        coins={coins}
        options={[5, 10, 25, 50]}
        disabled={spinning || autoSpin}
      />

      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={spin}
          disabled={spinning || autoSpin || coins < bet}
          className="btn-gold flex-1 py-3 text-base tracking-[0.2em]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.spin}</span>
            {spinning ? "SPINNING..." : "SPIN"}
          </span>
        </button>
        <button
          type="button"
          onClick={toggleAuto}
          disabled={coins < bet}
          className={`rounded-xl px-4 py-3 text-sm font-bold transition ${autoSpin ? "bg-red-800 border border-red-600 text-red-200" : "btn-outline"}`}
        >
          {autoSpin ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3">{Ic.stand}</span>
              {autoCount}
            </span>
          ) : (
            "AUTO"
          )}
        </button>
      </div>

      {/* Payout table */}
      <details className="w-full">
        <summary className="cursor-pointer text-center text-[10px] tracking-widest text-yellow-800 hover:text-yellow-600 transition">
          PAYOUT TABLE ▾
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {Object.entries(SYM_PAYOUTS).map(([key, mult]) => {
            const [s] = key.split("-");
            return (
              <div
                key={key}
                className="flex items-center gap-1 rounded-lg border border-[#2a1e00] bg-[#0f0c00] px-2 py-1.5"
              >
                <div style={{ width: 26, height: 26, flexShrink: 0 }}>
                  {SLOT_SYMBOLS[s]}
                </div>
                <div style={{ width: 26, height: 26, flexShrink: 0 }}>
                  {SLOT_SYMBOLS[s]}
                </div>
                <div style={{ width: 26, height: 26, flexShrink: 0 }}>
                  {SLOT_SYMBOLS[s]}
                </div>
                <span className="ml-auto font-bold text-yellow-500 text-xs whitespace-nowrap">
                  ×{mult}
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
