import { useState, useEffect, useCallback, useRef } from "react";
import { Ic } from "../icons.jsx";
import { SYMBOLS, PAYOUTS } from "../constants.js";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";
export function SlotMachine({ coins, onResult }) {
  const [reels, setReels] = useState(["🍒", "🍒", "🍒"]);
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

      // Mulai suara spin slot machine
      SFX.slotSpinStart();

      setResult(null);
      setSpinning(true);
      setReelAnim([true, true, true]);
      // Weighted reel: 🍒 most common, 💎 rarest → ~88% RTP
      // Weights: 🍒×6, 🍋×5, 🍊×4, 🍇×3, ⭐×2, 💎×1, 7️⃣×1 = 22 total
      const REEL = [
        "🍒",
        "🍒",
        "🍒",
        "🍒",
        "🍒",
        "🍒",
        "🍋",
        "🍋",
        "🍋",
        "🍋",
        "🍋",
        "🍊",
        "🍊",
        "🍊",
        "🍊",
        "🍇",
        "🍇",
        "🍇",
        "⭐",
        "⭐",
        "💎",
        "7️⃣",
      ];
      const final = [0, 1, 2].map(
        () => REEL[Math.floor(Math.random() * REEL.length)],
      );

      [0, 1, 2].forEach((i) => {
        setTimeout(
          () => {
            // Suara klik saat setiap reel berhenti
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
              // Hentikan suara spin saat reel terakhir berhenti
              SFX.slotSpinStop();

              setTimeout(() => {
                const key = final.join("");
                const mult = PAYOUTS[key] ?? 0;
                const net =
                  mult > 0 ? currentBet * mult - currentBet : -currentBet;
                setResult({
                  win: mult > 0,
                  amount: Math.abs(net),
                  mult,
                  isJackpot: key === "💎💎💎",
                });
                onResult(net, key === "💎💎💎" ? "jackpot" : undefined);

                // Suara hasil
                if (net > 0) {
                  if (key === "💎💎💎") SFX.slotJackpot();
                  else if (mult >= 20) SFX.slotJackpot();
                  else SFX.slotWin();
                } else {
                  SFX.lose();
                }

                setSpinning(false);
                if (autoRef.current) setAutoCount((c) => c + 1);
              }, 200);
            }
          },
          600 + i * 400,
        );
      });
    },
    [onResult],
  );

  // auto-spin trigger
  useEffect(() => {
    if (!autoSpin || spinning) return;
    spinRef.current = setTimeout(() => {
      if (autoRef.current) doSpin(bet, coins);
    }, 600);
    return () => clearTimeout(spinRef.current);
  }, [autoSpin, spinning, bet, coins, doSpin]);

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

  // keyboard: Space = spin
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
      <div className="relative w-full rounded-2xl border border-[#3d2e00] bg-gradient-to-b from-[#1a1200] to-[#0a0800] p-4 shadow-[inset_0_2px_0_#ffffff08,0_8px_32px_#00000088]">
        <div className="absolute left-4 right-4 top-0 h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent" />
        <div className="flex justify-center gap-3">
          {reels.map((sym, i) => (
            <div
              key={i}
              className={`slot-window w-[72px] rounded-xl border-2 transition-all duration-200
              ${reelAnim[i] ? "border-yellow-400 shadow-[0_0_16px_#f59e0b66] bg-[#1a1200]" : result?.win ? "border-yellow-700 bg-[#0f0c00]" : "border-[#2a1e00] bg-[#0f0c00]"}`}
            >
              <span
                className={`text-4xl select-none ${reelAnim[i] ? "reel-spinning" : ""}`}
              >
                {sym}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-900/40" />
          <span className="text-[9px] tracking-widest text-yellow-900">
            PAYLINE
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-900/40" />
        </div>
      </div>
      {result && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${result.win ? "result-win glow-win" : "result-lose shake"}`}
        >
          {result.win ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.win}</span>WIN! +{result.amount}{" "}
              coins ×{result.mult}
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
      <details className="w-full">
        <summary className="cursor-pointer text-center text-[10px] tracking-widest text-yellow-800 hover:text-yellow-600 transition">
          PAYOUT TABLE ▾
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {Object.entries(PAYOUTS).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-lg border border-[#2a1e00] bg-[#0f0c00] px-3 py-1.5 text-xs"
            >
              <span className="text-base">{k}</span>
              <span className="font-bold text-yellow-500">×{v}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
