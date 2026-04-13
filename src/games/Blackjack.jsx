import { useState, useCallback } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";
function makeDeck() {
  const suits = ["♠", "♥", "♦", "♣"],
    vals = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];
  for (const s of suits) for (const v of vals) deck.push({ s, v });
  // shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function bjValue(cards) {
  let total = 0,
    aces = 0;
  for (const c of cards) {
    if (c.v === "A") {
      total += 11;
      aces++;
    } else if (["J", "Q", "K"].includes(c.v)) total += 10;
    else total += parseInt(c.v);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function BJCard({ card, hidden }) {
  const isRed = card.s === "♥" || card.s === "♦";
  if (hidden)
    return (
      <div className="playing-card hidden-card flex h-20 w-14 items-center justify-center text-3xl select-none">
        🂠
      </div>
    );
  return (
    <div
      className={`playing-card flex h-20 w-14 flex-col items-center justify-center font-bold select-none ${isRed ? "red" : "black"}`}
    >
      <span className="text-2xl">{card.v}</span>
      <span className="text-base">{card.s}</span>
    </div>
  );
}

export function Blackjack({ coins, onResult }) {
  const [phase, setPhase] = useState("bet");
  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState([]);
  const [deckIdx, setDeckIdx] = useState(0);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [doubled, setDoubled] = useState(false);

  const draw = useCallback(
    (d, idx) => ({ card: d[idx % d.length], next: idx + 1 }),
    [],
  );

  const deal = () => {
    if (coins < bet) return;
    SFX.deal();
    const d = makeDeck();
    let idx = 0;
    const r1 = draw(d, idx++),
      r2 = draw(d, idx++),
      r3 = draw(d, idx++),
      r4 = draw(d, idx++);
    const p = [r1.card, r3.card],
      dl = [r2.card, r4.card];
    setDeck(d);
    setDeckIdx(idx);
    setPlayerCards(p);
    setDealerCards(dl);
    setOutcome(null);
    setDoubled(false);
    if (bjValue(p) === 21) {
      setPhase("done");
      setOutcome("blackjack");
      // Blackjack pays 1.2× (was 1.5×) — tighter house edge
      onResult(Math.floor(bet * 1.2));
      SFX.bigwin();
    } else setPhase("playing");
  };

  const hit = () => {
    if (phase !== "playing") return;
    SFX.deal();
    const { card, next } = draw(deck, deckIdx);
    const newCards = [...playerCards, card];
    setPlayerCards(newCards);
    setDeckIdx(next);
    if (bjValue(newCards) > 21) {
      setPhase("done");
      setOutcome("bust");
      onResult(doubled ? -bet * 2 : -bet);
      SFX.lose();
    }
  };

  const stand = () => {
    if (phase !== "playing") return;
    let dc = [...dealerCards],
      idx = deckIdx;
    while (bjValue(dc) < 17) {
      dc.push(deck[idx % deck.length]);
      idx++;
    }
    setDealerCards(dc);
    setDeckIdx(idx);
    const pv = bjValue(playerCards),
      dv = bjValue(dc);
    const effectiveBet = doubled ? bet * 2 : bet;
    let res;
    if (dv > 21 || pv > dv) {
      res = "win";
      onResult(effectiveBet);
      SFX.win();
    } else if (pv === dv) {
      res = "push";
      onResult(0);
    } else {
      res = "lose";
      onResult(-effectiveBet);
      SFX.lose();
    }
    setOutcome(res);
    setPhase("done");
  };

  const doubleDown = () => {
    if (phase !== "playing" || playerCards.length !== 2 || coins < bet * 2)
      return;
    SFX.deal();
    setDoubled(true);
    const { card, next } = draw(deck, deckIdx);
    const newCards = [...playerCards, card];
    setPlayerCards(newCards);
    setDeckIdx(next);
    if (bjValue(newCards) > 21) {
      setPhase("done");
      setOutcome("bust");
      onResult(-bet * 2);
      SFX.lose();
    } else {
      // auto-stand after double
      let dc = [...dealerCards],
        idx = next;
      while (bjValue(dc) < 17) {
        dc.push(deck[idx % deck.length]);
        idx++;
      }
      setDealerCards(dc);
      setDeckIdx(idx);
      const pv = bjValue(newCards),
        dv = bjValue(dc);
      let res;
      if (dv > 21 || pv > dv) {
        res = "win";
        onResult(bet * 2);
        SFX.win();
      } else if (pv === dv) {
        res = "push";
        onResult(0);
      } else {
        res = "lose";
        onResult(-bet * 2);
        SFX.lose();
      }
      setOutcome(res);
      setPhase("done");
    }
  };

  const reset = () => {
    setPhase("bet");
    setPlayerCards([]);
    setDealerCards([]);
    setOutcome(null);
    setDoubled(false);
  };

  const pv = bjValue(playerCards),
    dv = bjValue(dealerCards);
  const outcomeStyle = {
    win: "result-win glow-win",
    blackjack: "result-win glow-win",
    push: "result-push",
    lose: "result-lose shake",
    bust: "result-lose shake",
  };
  const effectiveBet = doubled ? bet * 2 : bet;
  const outcomeMsg = {
    win: (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.win}</span>You win! +{effectiveBet} coins
      </span>
    ),
    blackjack: (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.win}</span>BLACKJACK! +
        {Math.floor(bet * 1.2)} coins
      </span>
    ),
    push: (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.push}</span>Push — bet returned
      </span>
    ),
    lose: (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.lose}</span>Dealer wins. -{effectiveBet}{" "}
        coins
      </span>
    ),
    bust: (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.crash}</span>Bust! -{effectiveBet} coins
      </span>
    ),
  };

  return (
    <div className="fadeup flex flex-col gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Blackjack
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Dealer stands on 17 · Blackjack pays 1.2× · Double Down available
        </p>
      </div>
      <div className="rounded-2xl border border-[#1a3a1a] bg-gradient-to-b from-[#0a1a0a] to-[#050f05] p-4 shadow-[inset_0_2px_0_#ffffff05]">
        {dealerCards.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[10px] tracking-widest text-green-900 uppercase">
              Dealer {phase === "done" ? `· ${dv}` : "· ??"}
            </p>
            <div className="flex flex-wrap gap-2">
              {dealerCards.map((c, i) => (
                <BJCard
                  key={i}
                  card={c}
                  hidden={phase === "playing" && i === 1}
                />
              ))}
            </div>
          </div>
        )}
        <div className="gold-divider my-3" />
        {playerCards.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] tracking-widest text-green-900 uppercase">
              You · {pv} {doubled ? "· DOUBLED" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {playerCards.map((c, i) => (
                <BJCard key={i} card={c} hidden={false} />
              ))}
            </div>
          </div>
        )}
        {dealerCards.length === 0 && (
          <div className="flex h-24 items-center justify-center">
            <p className="text-[10px] tracking-widest text-green-900">
              PLACE YOUR BET AND DEAL
            </p>
          </div>
        )}
      </div>
      {outcome && (
        <div
          className={`fadeup rounded-xl px-4 py-3 text-center text-sm font-bold ${outcomeStyle[outcome]}`}
        >
          {outcomeMsg[outcome]}
        </div>
      )}
      {phase === "bet" && (
        <BetSelector bet={bet} setBet={setBet} coins={coins} />
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
      {phase === "playing" && (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={hit}
            className="btn-gold py-3 text-sm tracking-wider"
          >
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-4 h-4">{Ic.hit}</span>HIT
            </span>
          </button>
          <button
            type="button"
            onClick={stand}
            className="btn-outline py-3 text-sm tracking-wider"
          >
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-4 h-4">{Ic.stand}</span>STAND
            </span>
          </button>
          <button
            type="button"
            onClick={doubleDown}
            disabled={playerCards.length !== 2 || coins < bet * 2}
            className="btn-outline py-3 text-sm tracking-wider"
            title="Double Down"
          >
            <span className="flex items-center justify-center gap-1">
              <span className="w-4 h-4">{Ic.double}</span>2×
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
