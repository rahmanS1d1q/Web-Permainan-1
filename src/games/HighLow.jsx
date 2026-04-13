import { useState } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";
const CARD_VALUES = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
const CARD_SUITS = ["♠", "♥", "♦", "♣"];
function randomCard() {
  return {
    value: CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)],
    suit: CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)],
  };
}
function cardIndex(c) {
  return CARD_VALUES.indexOf(c.value);
}

export function HighLow({ coins, onResult }) {
  const [current, setCurrent] = useState(() => randomCard());
  const [next, setNext] = useState(null);
  const [guessing, setGuessing] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [bet, setBet] = useState(10);
  const [streak, setStreak] = useState(0);

  const guess = (dir) => {
    if (guessing || coins < bet) return;
    SFX.deal();
    setGuessing(true);
    setOutcome(null);
    const nextCard = randomCard();
    setNext(nextCard);
    setTimeout(() => {
      const ci = cardIndex(current),
        ni = cardIndex(nextCard);
      const win = dir === "higher" ? ni > ci : ni < ci;
      const newStreak = win ? streak + 1 : 0;
      setStreak(newStreak);
      // Base win: 0.9× (house edge 10%), streak bonus: +0.3 per win
      // Streak 0: ×0.9, Streak 1: ×1.2, Streak 2: ×1.5, Streak 3: ×1.8...
      const mult = 0.9 + newStreak * 0.3;
      setOutcome({ win, mult: mult.toFixed(1) });
      onResult(win ? Math.floor(bet * mult) : -bet);
      win ? SFX.win() : SFX.lose();
      setCurrent(nextCard);
      setNext(null);
      setGuessing(false);
    }, 900);
  };

  const isRed = (c) => c.suit === "♥" || c.suit === "♦";

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          High or Low
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Win pays 0.9× · Streak bonus: +0.3× per win
        </p>
      </div>
      {streak > 0 && (
        <div className="streak-badge">
          <span className="flex items-center justify-center gap-1.5">
            <span className="w-3.5 h-3.5">{Ic.fire}</span>Streak {streak} · Next
            ×{(0.9 + streak * 0.3).toFixed(1)}
          </span>
        </div>
      )}
      <div className="flex items-center gap-5">
        <div
          className={`playing-card flex h-28 w-20 flex-col items-center justify-center text-3xl font-bold select-none ${isRed(current) ? "red" : "black"}`}
        >
          <span className="text-4xl">{current.value}</span>
          <span className="text-xl">{current.suit}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-800" />
          <span className="text-lg text-yellow-700">→</span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-800" />
        </div>
        <div
          className={`playing-card flex h-28 w-20 flex-col items-center justify-center text-3xl font-bold select-none transition-all duration-500 ${next ? (isRed(next) ? "red glow-card" : "black glow-card") : ""}`}
          style={{ visibility: next ? "visible" : "hidden" }}
        >
          {next && (
            <>
              <span className="text-4xl">{next.value}</span>
              <span className="text-xl">{next.suit}</span>
            </>
          )}
        </div>
      </div>
      {outcome && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${outcome.win ? "result-win glow-win" : "result-lose shake"}`}
        >
          {outcome.win ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.win}</span>×{outcome.mult} · +
              {Math.floor(bet * parseFloat(outcome.mult))} coins
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.lose}</span>Wrong! -{bet} coins
            </span>
          )}
        </div>
      )}
      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={() => guess("higher")}
          disabled={guessing || coins < bet}
          className="btn-gold flex-1 py-3 text-base tracking-wider"
        >
          <span className="flex items-center justify-center gap-1.5">
            <span className="w-4 h-4">{Ic.higher}</span>HIGHER
          </span>
        </button>
        <button
          type="button"
          onClick={() => guess("lower")}
          disabled={guessing || coins < bet}
          className="btn-outline flex-1 py-3 text-base tracking-wider"
        >
          <span className="flex items-center justify-center gap-1.5">
            <span className="w-4 h-4">{Ic.lower}</span>LOWER
          </span>
        </button>
      </div>
      <BetSelector
        bet={bet}
        setBet={setBet}
        coins={coins}
        disabled={guessing}
      />
    </div>
  );
}
