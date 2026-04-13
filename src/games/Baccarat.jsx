import { useState } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { haptic } from "../constants.js";
import { BetSelector } from "../ui/modals.jsx";
const BAC_DECK = (() => {
  const suits = ["♠", "♥", "♦", "♣"],
    vals = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const d = [];
  for (const s of suits) for (const v of vals) d.push({ s, v });
  return d;
})();
function bacValue(cards) {
  return cards.reduce((t, c) => {
    const v = ["J", "Q", "K"].includes(c.v)
      ? 0
      : c.v === "A"
        ? 1
        : Math.min(parseInt(c.v), 9);
    return (t + v) % 10;
  }, 0);
}
function bacDraw() {
  return BAC_DECK[Math.floor(Math.random() * BAC_DECK.length)];
}

function BacCard({ card, hidden }) {
  const isRed = card?.s === "♥" || card?.s === "♦";
  if (hidden || !card)
    return (
      <div className="playing-card hidden-card flex h-16 w-11 items-center justify-center text-2xl select-none">
        🂠
      </div>
    );
  return (
    <div
      className={`playing-card flex h-16 w-11 flex-col items-center justify-center font-bold select-none ${isRed ? "red" : "black"}`}
    >
      <span className="text-xl">{card.v}</span>
      <span className="text-sm">{card.s}</span>
    </div>
  );
}

export function Baccarat({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [side, setSide] = useState(null); // "player"|"banker"|"tie"
  const [phase, setPhase] = useState("bet");
  const [pCards, setPCards] = useState([]);
  const [bCards, setBCards] = useState([]);
  const [outcome, setOutcome] = useState(null);

  const deal = () => {
    if (!side || coins < bet) return;
    SFX.deal();
    const p = [bacDraw(), bacDraw()];
    const b = [bacDraw(), bacDraw()];
    // natural check
    const pv = bacValue(p),
      bv = bacValue(b);
    let fp = [...p],
      fb = [...b];
    // third card rules (simplified)
    if (pv <= 5 && pv !== 8 && pv !== 9) fp.push(bacDraw());
    if (bv <= 5 && bv !== 8 && bv !== 9) fb.push(bacDraw());
    const fpv = bacValue(fp),
      fbv = bacValue(fb);
    setPCards(fp);
    setBCards(fb);
    let res, net;
    if (fpv === fbv) {
      res = "tie";
      // Tie pays ×7 (was ×8) — house edge on tie ~14%
      net = side === "tie" ? bet * 7 : -Math.floor(bet * 0.5); // lose half bet on tie if not betting tie
    } else if (fpv > fbv) {
      res = "player";
      // Player win pays 0.95× (house edge 5%)
      net =
        side === "player"
          ? Math.floor(bet * 0.95)
          : side === "tie"
            ? -bet
            : -bet;
    } else {
      res = "banker";
      // Banker win pays 0.92× (5% commission + extra house edge)
      net =
        side === "banker"
          ? Math.floor(bet * 0.92)
          : side === "tie"
            ? -bet
            : -bet;
    }
    setOutcome({ res, net, pv: fpv, bv: fbv });
    onResult(net);
    net > 0 ? SFX.win() : net === 0 ? null : SFX.lose();
    setPhase("done");
    haptic(net > 0 ? "win" : "lose");
  };

  const reset = () => {
    setPhase("bet");
    setPCards([]);
    setBCards([]);
    setOutcome(null);
  };

  const sideLabel = { player: "Player", banker: "Banker", tie: "Tie" };
  const outcomeColor =
    outcome?.net > 0
      ? "result-win glow-win"
      : outcome?.net === 0
        ? "result-push"
        : "result-lose shake";

  return (
    <div className="fadeup flex flex-col gap-4">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Baccarat
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Player 0.95× · Banker 0.92× · Tie ×7
        </p>
      </div>
      <div className="rounded-2xl border border-[#1a3a1a] bg-gradient-to-b from-[#0a1a0a] to-[#050f05] p-4">
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] tracking-widest text-green-900 uppercase">
            Banker {phase === "done" ? `· ${outcome?.bv}` : ""}
          </p>
          <div className="flex gap-2">
            {bCards.map((c, i) => (
              <BacCard key={i} card={c} hidden={false} />
            ))}
          </div>
        </div>
        <div className="gold-divider my-2" />
        <div>
          <p className="mb-1.5 text-[10px] tracking-widest text-green-900 uppercase">
            Player {phase === "done" ? `· ${outcome?.pv}` : ""}
          </p>
          <div className="flex gap-2">
            {pCards.map((c, i) => (
              <BacCard key={i} card={c} hidden={false} />
            ))}
          </div>
        </div>
        {pCards.length === 0 && (
          <div className="flex h-16 items-center justify-center">
            <p className="text-[10px] tracking-widest text-green-900">
              PLACE YOUR BET
            </p>
          </div>
        )}
      </div>
      {outcome && (
        <div
          className={`fadeup rounded-xl px-4 py-3 text-center text-sm font-bold ${outcomeColor}`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">
              {outcome.net > 0 ? Ic.win : outcome.net === 0 ? Ic.push : Ic.lose}
            </span>
            {sideLabel[outcome.res]} wins!{" "}
            {outcome.net > 0
              ? `+${outcome.net}`
              : outcome.net === 0
                ? "Push"
                : `${outcome.net}`}{" "}
            coins
          </span>
        </div>
      )}
      {phase === "bet" && (
        <div className="grid grid-cols-3 gap-2">
          {["player", "banker", "tie"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSide(s);
                SFX.click();
              }}
              className={`rounded-xl py-2.5 text-sm font-bold capitalize transition ${side === s ? "btn-gold" : "btn-outline"}`}
            >
              {s === "player"
                ? "Player 0.95×"
                : s === "banker"
                  ? "Banker 0.92×"
                  : `Tie ×7`}
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
