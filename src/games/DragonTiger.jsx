import { useState } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { haptic } from "../constants.js";
import { BetSelector } from "../ui/modals.jsx";

const SUITS = ["♠", "♥", "♦", "♣"];
const VALS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
function randCard() {
  return {
    v: VALS[Math.floor(Math.random() * VALS.length)],
    s: SUITS[Math.floor(Math.random() * SUITS.length)],
  };
}
function cardRank(c) {
  return VALS.indexOf(c.v);
}

function DTCard({ card, label, glow }) {
  if (!card)
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] tracking-widest text-yellow-700">
          {label}
        </span>
        <div className="flex h-24 w-16 items-center justify-center rounded-xl border-2 border-[#3d2e00] bg-[#1a1400]">
          <span className="text-yellow-900 text-xs">?</span>
        </div>
      </div>
    );
  const isRed = card.s === "♥" || card.s === "♦";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] tracking-widest text-yellow-700">
        {label}
      </span>
      <div
        className={`flex h-24 w-16 flex-col items-center justify-center rounded-xl border-2 font-bold select-none transition-all
        ${glow === "win" ? "border-yellow-400 shadow-[0_0_20px_#f59e0b88]" : glow === "lose" ? "border-red-600" : "border-[#3d2e00]"}
        bg-gradient-to-b from-[#1e1600] to-[#0f0c00] ${isRed ? "text-red-400" : "text-gray-200"}`}
      >
        <span className="text-3xl">{card.v}</span>
        <span className="text-lg">{card.s}</span>
      </div>
    </div>
  );
}

export function DragonTiger({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [side, setSide] = useState(null); // "dragon"|"tiger"|"tie"
  const [phase, setPhase] = useState("bet");
  const [dragon, setDragon] = useState(null);
  const [tiger, setTiger] = useState(null);
  const [outcome, setOutcome] = useState(null);

  const deal = () => {
    if (!side || coins < bet) return;
    SFX.deal();
    const d = randCard(),
      t = randCard();
    setDragon(d);
    setTiger(t);
    const dr = cardRank(d),
      tr = cardRank(t);
    let res, net;
    if (dr === tr) {
      res = "tie";
      net = side === "tie" ? bet * 8 : -Math.floor(bet * 0.5);
    } else if (dr > tr) {
      res = "dragon";
      net =
        side === "dragon"
          ? Math.floor(bet * 0.95)
          : side === "tie"
            ? -bet
            : -bet;
    } else {
      res = "tiger";
      net =
        side === "tiger"
          ? Math.floor(bet * 0.95)
          : side === "tie"
            ? -bet
            : -bet;
    }
    setOutcome({ res, net });
    onResult(net);
    net > 0 ? SFX.win() : SFX.lose();
    haptic(net > 0 ? "win" : "lose");
    setPhase("done");
  };

  const reset = () => {
    setPhase("bet");
    setDragon(null);
    setTiger(null);
    setOutcome(null);
  };

  const drGlow = outcome ? (outcome.res === "dragon" ? "win" : "lose") : null;
  const tiGlow = outcome ? (outcome.res === "tiger" ? "win" : "lose") : null;

  return (
    <div className="fadeup flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Dragon Tiger
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Higher card wins · Tie pays 8× · Win pays 0.95×
        </p>
      </div>
      <div className="flex items-center gap-6 w-full justify-center">
        <DTCard card={dragon} label="DRAGON" glow={drGlow} />
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-yellow-700">VS</span>
          {outcome && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${outcome.res === "tie" ? "bg-blue-900/40 text-blue-400" : outcome.res === "dragon" ? "bg-yellow-900/40 text-yellow-400" : "bg-orange-900/40 text-orange-400"}`}
            >
              {outcome.res.toUpperCase()}
            </span>
          )}
        </div>
        <DTCard card={tiger} label="TIGER" glow={tiGlow} />
      </div>
      {outcome && (
        <div
          className={`fadeup w-full rounded-xl px-4 py-3 text-center text-sm font-bold ${outcome.net > 0 ? "result-win glow-win" : "result-lose shake"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">
              {outcome.net > 0 ? Ic.win : Ic.lose}
            </span>
            {outcome.res.charAt(0).toUpperCase() + outcome.res.slice(1)} wins!{" "}
            {outcome.net > 0 ? `+${outcome.net}` : `${outcome.net}`} coins
          </span>
        </div>
      )}
      {phase === "bet" && (
        <div className="grid grid-cols-3 gap-2 w-full">
          {[
            ["dragon", "Dragon 0.95×", "#f59e0b"],
            ["tiger", "Tiger 0.95×", "#f97316"],
            ["tie", "Tie ×8", "#60a5fa"],
          ].map(([s, label, color]) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSide(s);
                SFX.click();
              }}
              className={`rounded-xl py-2.5 text-xs font-bold transition border-2 ${side === s ? "border-current" : "border-transparent btn-outline"}`}
              style={
                side === s
                  ? { background: color + "22", borderColor: color, color }
                  : {}
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {phase === "bet" && (
        <BetSelector bet={bet} setBet={setBet} coins={coins} />
      )}
      {phase === "bet" && (
        <button
          type="button"
          onClick={deal}
          disabled={!side || coins < bet}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.deal}</span>DEAL
          </span>
        </button>
      )}
      {phase === "done" && (
        <button
          type="button"
          onClick={reset}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.replay}</span>NEW ROUND
          </span>
        </button>
      )}
    </div>
  );
}
