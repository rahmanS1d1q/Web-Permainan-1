import { useState } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { haptic } from "../constants.js";
import { BetSelector } from "../ui/modals.jsx";

const SCRATCH_SYMBOLS = ["💎", "7", "⭐", "🍒", "🍋", "🍊"];
// Payouts tuned for ~80% RTP, win chance ~18%
const SCRATCH_PAYOUTS = {
  "💎💎💎": 35,
  777: 20,
  "⭐⭐⭐": 10,
  "🍒🍒🍒": 5,
  "🍋🍋🍋": 3,
  "🍊🍊🍊": 2,
};

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calcPayout(cells) {
  let best = 0;
  for (const [a, b, c] of LINES) {
    if (cells[a] === cells[b] && cells[b] === cells[c]) {
      const key = cells[a].repeat(3);
      const p = SCRATCH_PAYOUTS[key] ?? 0;
      if (p > best) best = p;
    }
  }
  return best;
}

export function ScratchCard({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [cells, setCells] = useState(null);
  const [revealed, setRevealed] = useState([]);
  const [result, setResult] = useState(null);
  // guard: track whether onResult has been called for current card
  const [paid, setPaid] = useState(false);

  const settle = (currentCells) => {
    const payout = calcPayout(currentCells);
    const net = payout > 0 ? bet * payout - bet : -bet;
    setResult({ net, payout });
    setPaid(true);
    onResult(net);
    net > 0 ? SFX.win() : SFX.lose();
    haptic(net > 0 ? "win" : "lose");
  };

  const newCard = () => {
    if (coins < bet) return;
    SFX.click();
    const syms = Array.from(
      { length: 9 },
      () => SCRATCH_SYMBOLS[Math.floor(Math.random() * SCRATCH_SYMBOLS.length)],
    );
    // 18% chance to force a winning line
    if (Math.random() < 0.18) {
      const winSym =
        SCRATCH_SYMBOLS[Math.floor(Math.random() * SCRATCH_SYMBOLS.length)];
      // pick a random winning line and set all 3 cells
      const line = LINES[Math.floor(Math.random() * LINES.length)];
      line.forEach((i) => {
        syms[i] = winSym;
      });
    }
    setCells(syms);
    setRevealed([]);
    setResult(null);
    setPaid(false);
  };

  const scratch = (idx) => {
    if (!cells || revealed.includes(idx) || result || paid) return;
    SFX.plinko();
    haptic("light");
    const next = [...revealed, idx];
    setRevealed(next);
    if (next.length === 9) {
      settle(cells);
    }
  };

  const scratchAll = () => {
    if (!cells || result || paid) return;
    setRevealed(Array.from({ length: 9 }, (_, i) => i));
    settle(cells);
  };

  return (
    <div className="fadeup flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Scratch Card
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Tap cells to reveal · Match 3 in a line
        </p>
      </div>

      {!cells ? (
        <div
          className="w-full rounded-2xl border-2 border-dashed border-[#3d2e00] bg-[#0f0c00] flex items-center justify-center"
          style={{ height: 200 }}
        >
          <p className="text-yellow-800 text-sm">Buy a card to start</p>
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {cells.map((sym, i) => {
              const isRevealed = revealed.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => scratch(i)}
                  disabled={isRevealed || !!result}
                  className={`h-16 rounded-xl text-2xl font-bold transition-all duration-200 select-none
                    ${
                      isRevealed
                        ? "bg-gradient-to-b from-[#1a1200] to-[#0f0c00] border border-[#3d2e00] shadow-inner"
                        : "bg-gradient-to-b from-[#3d2e00] to-[#2a1e00] border border-[#5a4200] hover:from-[#4a3800] active:scale-95 cursor-pointer"
                    }`}
                >
                  {isRevealed ? (
                    sym
                  ) : (
                    <span className="text-yellow-800 text-xs">?</span>
                  )}
                </button>
              );
            })}
          </div>
          {!result && revealed.length < 9 && (
            <button
              type="button"
              onClick={scratchAll}
              className="btn-outline w-full py-1.5 text-xs"
            >
              Reveal All
            </button>
          )}
        </div>
      )}

      {result && (
        <div
          className={`fadeup w-full rounded-xl px-4 py-3 text-center text-sm font-bold ${result.net > 0 ? "result-win glow-win" : "result-lose shake"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{result.net > 0 ? Ic.win : Ic.lose}</span>
            {result.net > 0
              ? `Match! ×${result.payout} · +${result.net} coins`
              : `No match — lost ${bet} coins`}
          </span>
        </div>
      )}

      <BetSelector
        bet={bet}
        setBet={setBet}
        coins={coins}
        options={[5, 10, 25, 50]}
        disabled={!!cells && !result}
      />

      <button
        type="button"
        onClick={newCard}
        disabled={coins < bet || (!!cells && !result)}
        className="btn-gold w-full py-3 text-base tracking-[0.2em]"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4">{Ic.coin}</span>
          {cells && !result
            ? "Scratching..."
            : result
              ? "New Card"
              : "Buy Card"}
        </span>
      </button>
    </div>
  );
}
