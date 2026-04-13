import { useState, useCallback } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { haptic } from "../constants.js";
import { BetSelector } from "../ui/modals.jsx";

const SUITS = ["♠", "♥", "♦", "♣"];
const VALS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function makeDeck() {
  const d = [];
  for (const s of SUITS) for (const v of VALS) d.push({ s, v });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function rankVal(v) {
  return VALS.indexOf(v);
}

function evaluate(hand) {
  const vals = hand.map((c) => rankVal(c.v)).sort((a, b) => a - b);
  const suits = hand.map((c) => c.s);
  const counts = {};
  vals.forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
  });
  const groups = Object.values(counts).sort((a, b) => b - a);
  const isFlush = suits.every((s) => s === suits[0]);
  const isStraight = vals[4] - vals[0] === 4 && groups[0] === 1;
  const isRoyalStraight = isStraight && vals[0] === 8; // 10-A
  // A-2-3-4-5 wheel straight
  const isWheel = JSON.stringify(vals) === JSON.stringify([0, 1, 2, 3, 12]);

  if (isFlush && isRoyalStraight) return { name: "Royal Flush", mult: 800 };
  if (isFlush && (isStraight || isWheel))
    return { name: "Straight Flush", mult: 50 };
  if (groups[0] === 4) return { name: "Four of a Kind", mult: 25 };
  if (groups[0] === 3 && groups[1] === 2)
    return { name: "Full House", mult: 9 };
  if (isFlush) return { name: "Flush", mult: 6 };
  if (isStraight || isWheel) return { name: "Straight", mult: 4 };
  if (groups[0] === 3) return { name: "Three of a Kind", mult: 3 };
  if (groups[0] === 2 && groups[1] === 2) return { name: "Two Pair", mult: 2 };
  // Jacks or Better
  const pairs = Object.entries(counts)
    .filter(([v, c]) => c === 2)
    .map(([v]) => parseInt(v));
  if (pairs.some((v) => v >= rankVal("J")))
    return { name: "Jacks or Better", mult: 1 };
  return { name: "No Win", mult: 0 };
}

function VPCard({ card, held, onToggle, phase }) {
  if (!card)
    return (
      <div className="h-20 w-14 rounded-xl border-2 border-[#2a1e00] bg-[#0f0c00]" />
    );
  const isRed = card.s === "♥" || card.s === "♦";
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={phase !== "hold"}
        className={`flex h-20 w-14 flex-col items-center justify-center rounded-xl border-2 font-bold select-none transition-all
          ${held ? "border-yellow-400 shadow-[0_0_12px_#f59e0b66] bg-yellow-950/30" : "border-[#3d2e00] bg-gradient-to-b from-[#1e1600] to-[#0f0c00]"}
          ${isRed ? "text-red-400" : "text-gray-200"}`}
      >
        <span className="text-2xl">{card.v}</span>
        <span className="text-base">{card.s}</span>
      </button>
      {phase === "hold" && (
        <span
          className={`text-[9px] font-bold tracking-wider ${held ? "text-yellow-400" : "text-yellow-900"}`}
        >
          {held ? "HELD" : "HOLD?"}
        </span>
      )}
    </div>
  );
}

const PAYTABLE = [
  ["Royal Flush", 800],
  ["Straight Flush", 50],
  ["Four of a Kind", 25],
  ["Full House", 9],
  ["Flush", 6],
  ["Straight", 4],
  ["Three of a Kind", 3],
  ["Two Pair", 2],
  ["Jacks or Better", 1],
];

export function VideoPoker({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState("bet"); // bet | hold | done
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([null, null, null, null, null]);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [result, setResult] = useState(null);

  const deal = useCallback(() => {
    if (coins < bet) return;
    SFX.deal();
    const d = makeDeck();
    setDeck(d.slice(5));
    setHand(d.slice(0, 5));
    setHeld([false, false, false, false, false]);
    setResult(null);
    setPhase("hold");
  }, [coins, bet]);

  const toggleHold = (i) => {
    setHeld((h) => {
      const n = [...h];
      n[i] = !n[i];
      return n;
    });
    SFX.click();
  };

  const draw = useCallback(() => {
    SFX.deal();
    let di = 0;
    const newHand = hand.map((c, i) => (held[i] ? c : deck[di++]));
    setHand(newHand);
    const ev = evaluate(newHand);
    const net = ev.mult > 0 ? bet * ev.mult - bet : -bet;
    setResult({ ...ev, net });
    onResult(net);
    net > 0 ? (ev.mult >= 25 ? SFX.bigwin() : SFX.win()) : SFX.lose();
    haptic(net > 0 ? "win" : "lose");
    setPhase("done");
  }, [hand, held, deck, bet, onResult]);

  const reset = () => {
    setPhase("bet");
    setHand([null, null, null, null, null]);
    setHeld([false, false, false, false, false]);
    setResult(null);
  };

  return (
    <div className="fadeup flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Video Poker
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Jacks or Better · Hold cards · Draw to win
        </p>
      </div>
      <div className="flex gap-2 justify-center">
        {hand.map((c, i) => (
          <VPCard
            key={i}
            card={c}
            held={held[i]}
            onToggle={() => toggleHold(i)}
            phase={phase}
          />
        ))}
      </div>
      {result && (
        <div
          className={`fadeup w-full rounded-xl px-4 py-3 text-center text-sm font-bold ${result.net > 0 ? "result-win glow-win" : "result-lose shake"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{result.net > 0 ? Ic.win : Ic.lose}</span>
            {result.name}{" "}
            {result.net > 0 ? `· +${result.net}` : `· ${result.net}`} coins
          </span>
        </div>
      )}
      {phase === "bet" && (
        <BetSelector
          bet={bet}
          setBet={setBet}
          coins={coins}
          options={[5, 10, 25, 50]}
        />
      )}
      {phase === "bet" && (
        <button
          type="button"
          onClick={deal}
          disabled={coins < bet}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.deal}</span>DEAL
          </span>
        </button>
      )}
      {phase === "hold" && (
        <button
          type="button"
          onClick={draw}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.spin}</span>DRAW
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
            <span className="w-4 h-4">{Ic.replay}</span>NEW HAND
          </span>
        </button>
      )}
      <details className="w-full">
        <summary className="cursor-pointer text-center text-[10px] tracking-widest text-yellow-800 hover:text-yellow-600 transition">
          PAYTABLE ▾
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {PAYTABLE.map(([name, mult]) => (
            <div
              key={name}
              className={`flex items-center justify-between rounded-lg border px-2 py-1 text-xs ${result?.name === name ? "border-yellow-500 bg-yellow-950/40" : "border-[#2a1e00] bg-[#0f0c00]"}`}
            >
              <span className="text-yellow-700">{name}</span>
              <span className="font-bold text-yellow-500">×{mult}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
