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

function rv(v) {
  return VALS.indexOf(v);
}

function evalHand(cards) {
  // best 5 from 7
  const combos = [];
  for (let i = 0; i < cards.length; i++)
    for (let j = i + 1; j < cards.length; j++) {
      const five = cards.filter((_, k) => k !== i && k !== j);
      combos.push(five);
    }
  let best = null;
  for (const c of combos) {
    const score = score5(c);
    if (
      !best ||
      score.rank > best.rank ||
      (score.rank === best.rank && score.tiebreak > best.tiebreak)
    )
      best = score;
  }
  return best;
}

function score5(hand) {
  const vals = hand.map((c) => rv(c.v)).sort((a, b) => b - a);
  const suits = hand.map((c) => c.s);
  const counts = {};
  vals.forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
  });
  const groups = Object.values(counts).sort((a, b) => b - a);
  const isFlush = suits.every((s) => s === suits[0]);
  const isStraight = vals[0] - vals[4] === 4 && groups[0] === 1;
  const isWheel =
    JSON.stringify([...vals].sort((a, b) => a - b)) ===
    JSON.stringify([0, 1, 2, 3, 12]);
  const tb = vals.reduce((a, v, i) => a + v * Math.pow(14, 4 - i), 0);

  if (isFlush && isStraight && vals[0] === 12)
    return { rank: 9, name: "Royal Flush", tiebreak: tb };
  if (isFlush && (isStraight || isWheel))
    return { rank: 8, name: "Straight Flush", tiebreak: tb };
  if (groups[0] === 4) return { rank: 7, name: "Four of a Kind", tiebreak: tb };
  if (groups[0] === 3 && groups[1] === 2)
    return { rank: 6, name: "Full House", tiebreak: tb };
  if (isFlush) return { rank: 5, name: "Flush", tiebreak: tb };
  if (isStraight || isWheel) return { rank: 4, name: "Straight", tiebreak: tb };
  if (groups[0] === 3)
    return { rank: 3, name: "Three of a Kind", tiebreak: tb };
  if (groups[0] === 2 && groups[1] === 2)
    return { rank: 2, name: "Two Pair", tiebreak: tb };
  if (groups[0] === 2) return { rank: 1, name: "Pair", tiebreak: tb };
  return { rank: 0, name: "High Card", tiebreak: tb };
}

function Card({ card, hidden, small }) {
  if (hidden || !card)
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-[#3d2e00] bg-[#1a1400] select-none ${small ? "h-14 w-10" : "h-20 w-14"}`}
      >
        <span className="text-yellow-900 text-xs">🂠</span>
      </div>
    );
  const isRed = card.s === "♥" || card.s === "♦";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-[#3d2e00] bg-gradient-to-b from-[#1e1600] to-[#0f0c00] font-bold select-none ${isRed ? "text-red-400" : "text-gray-200"} ${small ? "h-14 w-10" : "h-20 w-14"}`}
    >
      <span className={small ? "text-lg" : "text-2xl"}>{card.v}</span>
      <span className={small ? "text-sm" : "text-base"}>{card.s}</span>
    </div>
  );
}

const HAND_MULT = {
  "Royal Flush": 50,
  "Straight Flush": 20,
  "Four of a Kind": 10,
  "Full House": 5,
  Flush: 4,
  Straight: 3,
  "Three of a Kind": 2,
  "Two Pair": 1.5,
  Pair: 1,
  "High Card": 0,
};

export function TexasPoker({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState("bet"); // bet|preflop|flop|turn|river|done
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [community, setCommunity] = useState([]);
  const [pot, setPot] = useState(0);
  const [result, setResult] = useState(null);
  const [deckIdx, setDeckIdx] = useState(0);

  const startGame = useCallback(() => {
    if (coins < bet) return;
    SFX.deal();
    const d = makeDeck();
    const p = [d[0], d[2]];
    const dl = [d[1], d[3]];
    setDeck(d);
    setPlayer(p);
    setDealer(dl);
    setCommunity([]);
    setPot(bet * 2);
    setDeckIdx(4);
    setResult(null);
    setPhase("preflop");
  }, [coins, bet]);

  const nextStreet = useCallback(
    (action) => {
      SFX.deal();
      let newPot = pot;
      if (action === "call") newPot += bet;
      else if (action === "raise") newPot += bet * 2;
      setPot(newPot);

      if (phase === "preflop") {
        setCommunity((c) => [
          ...c,
          deck[deckIdx],
          deck[deckIdx + 1],
          deck[deckIdx + 2],
        ]);
        setDeckIdx((i) => i + 3);
        setPhase("flop");
      } else if (phase === "flop") {
        setCommunity((c) => [...c, deck[deckIdx]]);
        setDeckIdx((i) => i + 1);
        setPhase("turn");
      } else if (phase === "turn") {
        setCommunity((c) => [...c, deck[deckIdx]]);
        setDeckIdx((i) => i + 1);
        setPhase("river");
      } else if (phase === "river") {
        // showdown
        const allP = [...player, ...community, deck[deckIdx]].slice(0, 7);
        const allD = [...dealer, ...community, deck[deckIdx]].slice(0, 7);
        const ph = evalHand(
          allP.length >= 5
            ? allP
            : [
                ...allP,
                ...deck.slice(deckIdx + 1, deckIdx + 1 + (7 - allP.length)),
              ],
        );
        const dh = evalHand(
          allD.length >= 5
            ? allD
            : [
                ...allD,
                ...deck.slice(deckIdx + 1, deckIdx + 1 + (7 - allD.length)),
              ],
        );
        let net, winner;
        if (
          ph.rank > dh.rank ||
          (ph.rank === dh.rank && ph.tiebreak > dh.tiebreak)
        ) {
          winner = "player";
          const mult = HAND_MULT[ph.name] ?? 1;
          net = Math.floor(newPot * Math.max(1, mult) * 0.5);
        } else if (ph.rank === dh.rank && ph.tiebreak === dh.tiebreak) {
          winner = "tie";
          net = 0;
        } else {
          winner = "dealer";
          net = -Math.floor(newPot * 0.5);
        }
        setResult({ winner, playerHand: ph, dealerHand: dh, net });
        onResult(net, winner === "player" ? "poker_win" : undefined);
        net > 0 ? SFX.win() : SFX.lose();
        haptic(net > 0 ? "win" : "lose");
        setPhase("done");
      }
    },
    [phase, pot, bet, deck, deckIdx, player, dealer, community, onResult],
  );

  const fold = () => {
    const net = -Math.floor(pot * 0.5);
    setResult({
      winner: "dealer",
      playerHand: null,
      dealerHand: null,
      net,
      folded: true,
    });
    onResult(net);
    SFX.lose();
    setPhase("done");
  };

  const reset = () => {
    setPhase("bet");
    setPlayer([]);
    setDealer([]);
    setCommunity([]);
    setPot(0);
    setResult(null);
  };

  const phaseLabel = {
    preflop: "Pre-Flop",
    flop: "Flop",
    turn: "Turn",
    river: "River",
  };

  return (
    <div className="fadeup flex flex-col gap-4">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Texas Hold'em
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Best 5-card hand wins · Call, Raise, or Fold
        </p>
      </div>

      {phase !== "bet" && (
        <div className="rounded-2xl border border-[#1a3a1a] bg-gradient-to-b from-[#0a1a0a] to-[#050f05] p-3">
          {/* Dealer */}
          <div className="mb-2">
            <p className="text-[10px] tracking-widest text-green-900 mb-1.5">
              DEALER {result ? `· ${result.dealerHand?.name ?? "—"}` : "· ??"}
            </p>
            <div className="flex gap-1.5">
              {dealer.map((c, i) => (
                <Card
                  key={i}
                  card={c}
                  hidden={!result && phase !== "done"}
                  small
                />
              ))}
            </div>
          </div>
          {/* Community */}
          <div className="my-2">
            <p className="text-[10px] tracking-widest text-green-900 mb-1.5">
              COMMUNITY
            </p>
            <div className="flex gap-1.5">
              {community.map((c, i) => (
                <Card key={i} card={c} small />
              ))}
              {Array.from({ length: 5 - community.length }, (_, i) => (
                <div
                  key={i}
                  className="h-14 w-10 rounded-lg border border-dashed border-[#2a1e00] bg-[#0a0800]"
                />
              ))}
            </div>
          </div>
          {/* Player */}
          <div>
            <p className="text-[10px] tracking-widest text-green-900 mb-1.5">
              YOU {result ? `· ${result.playerHand?.name ?? "Folded"}` : ""}
            </p>
            <div className="flex gap-1.5">
              {player.map((c, i) => (
                <Card key={i} card={c} small />
              ))}
            </div>
          </div>
        </div>
      )}

      {phase !== "bet" && phase !== "done" && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-yellow-700 font-bold">{phaseLabel[phase]}</span>
          <span className="text-yellow-600">
            Pot: <span className="text-yellow-400 font-bold">{pot}</span>
          </span>
        </div>
      )}

      {result && (
        <div
          className={`fadeup rounded-xl px-4 py-3 text-center text-sm font-bold ${result.net > 0 ? "result-win glow-win" : result.net === 0 ? "result-push" : "result-lose shake"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">
              {result.net > 0 ? Ic.win : result.net === 0 ? Ic.push : Ic.lose}
            </span>
            {result.folded
              ? "Folded"
              : result.winner === "player"
                ? `You win! ${result.playerHand?.name}`
                : result.winner === "tie"
                  ? "Chop pot"
                  : `Dealer wins. ${result.dealerHand?.name}`}{" "}
            {result.net > 0
              ? `+${result.net}`
              : result.net === 0
                ? ""
                : `${result.net}`}{" "}
            coins
          </span>
        </div>
      )}

      {phase === "bet" && (
        <BetSelector bet={bet} setBet={setBet} coins={coins} />
      )}
      {phase === "bet" && (
        <button
          type="button"
          onClick={startGame}
          disabled={coins < bet}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.deal}</span>DEAL
          </span>
        </button>
      )}

      {["preflop", "flop", "turn", "river"].includes(phase) && (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={fold}
            className="btn-outline py-2.5 text-sm"
          >
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-4 h-4">{Ic.fold}</span>Fold
            </span>
          </button>
          <button
            type="button"
            onClick={() => nextStreet("call")}
            disabled={coins < bet}
            className="btn-outline py-2.5 text-sm"
          >
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-4 h-4">{Ic.call}</span>Call
            </span>
          </button>
          <button
            type="button"
            onClick={() => nextStreet("raise")}
            disabled={coins < bet * 2}
            className="btn-gold py-2.5 text-sm"
          >
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-4 h-4">{Ic.raise}</span>Raise
            </span>
          </button>
        </div>
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
    </div>
  );
}
