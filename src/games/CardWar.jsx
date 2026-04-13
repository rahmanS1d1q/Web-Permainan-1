import { useState } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";
const WAR_VALS = [
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
const WAR_SUITS = ["♠", "♥", "♦", "♣"];
function warCard() {
  return {
    v: WAR_VALS[Math.floor(Math.random() * WAR_VALS.length)],
    s: WAR_SUITS[Math.floor(Math.random() * WAR_SUITS.length)],
  };
}
function warRank(c) {
  return WAR_VALS.indexOf(c.v);
}

function WarCard({ card, hidden, glow }) {
  const isRed = card?.s === "♥" || card?.s === "♦";
  if (hidden || !card)
    return (
      <div className="flex h-20 w-14 items-center justify-center rounded-xl border-2 border-[#3d2e00] bg-[#1a1400] text-3xl select-none">
        🂠
      </div>
    );
  return (
    <div
      className={`flex h-20 w-14 flex-col items-center justify-center rounded-xl border-2 select-none transition-all
      ${glow === "win" ? "border-yellow-400 shadow-[0_0_16px_#f59e0b]" : glow === "lose" ? "border-red-500" : "border-[#3d2e00]"}
      bg-[#1a1400] text-lg font-bold ${isRed ? "text-red-400" : "text-white"}`}
    >
      <span className="text-2xl">{card.v}</span>
      <span>{card.s}</span>
    </div>
  );
}

export function CardWar({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState("idle");
  const [playerCard, setPlayerCard] = useState(null);
  const [dealerCard, setDealerCard] = useState(null);
  const [warCards, setWarCards] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [pot, setPot] = useState(0);

  const deal = () => {
    if (coins < bet) return;
    SFX.deal();
    const p = warCard(),
      d = warCard();
    setPlayerCard(p);
    setDealerCard(d);
    setWarCards([]);
    setOutcome(null);
    setPot(bet * 2);
    const pr = warRank(p),
      dr = warRank(d);
    if (pr > dr) {
      setPhase("done");
      setOutcome("win");
      // House edge 5%: win pays 0.95× bet
      onResult(Math.floor(bet * 0.95));
      SFX.win();
    } else if (dr > pr) {
      setPhase("done");
      setOutcome("lose");
      onResult(-bet);
      SFX.lose();
    } else {
      setPhase("war");
    }
  };

  const goToWar = () => {
    if (coins < bet) return;
    SFX.deal();
    const burned = [
      { p: warCard(), d: warCard() },
      { p: warCard(), d: warCard() },
      { p: warCard(), d: warCard() },
    ];
    const p2 = warCard(),
      d2 = warCard();
    setWarCards(burned);
    setPlayerCard(p2);
    setDealerCard(d2);
    const newPot = pot + bet * 2;
    setPot(newPot);
    const pr = warRank(p2),
      dr = warRank(d2);
    if (pr >= dr) {
      setPhase("done");
      setOutcome("war-win");
      // War win: 90% of pot (house takes 10% rake)
      onResult(Math.floor((newPot - bet * 2) * 0.9));
      SFX.bigwin();
    } else {
      setPhase("done");
      setOutcome("war-lose");
      onResult(-bet * 2);
      SFX.lose();
    }
  };

  const surrender = () => {
    setPhase("done");
    setOutcome("surrender");
    onResult(-Math.floor(bet / 2));
  };
  const reset = () => {
    setPhase("idle");
    setPlayerCard(null);
    setDealerCard(null);
    setWarCards([]);
    setOutcome(null);
    setPot(0);
  };

  const outcomeMsg = {
    win: (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.win}</span>You win! +{bet} coins
      </span>
    ),
    lose: (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.lose}</span>Dealer wins. -{bet} coins
      </span>
    ),
    "war-win": (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.war}</span>WAR WON! +{pot - bet * 2} coins
      </span>
    ),
    "war-lose": (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.lose}</span>War lost. -{bet * 2} coins
      </span>
    ),
    surrender: (
      <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4">{Ic.surrender}</span>Surrendered. -
        {Math.floor(bet / 2)} coins
      </span>
    ),
  };
  const outcomeStyle = {
    win: "result-win glow-win",
    "war-win": "result-win glow-win",
    lose: "result-lose shake",
    "war-lose": "result-lose shake",
    surrender: "result-push",
  };

  return (
    <div className="fadeup flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Card War
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Higher card wins · Tie = go to WAR!
        </p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-yellow-700">YOU</span>
          <WarCard
            card={playerCard}
            hidden={false}
            glow={
              outcome === "win" || outcome === "war-win"
                ? "win"
                : outcome
                  ? "lose"
                  : null
            }
          />
          {playerCard && (
            <span className="text-xs text-yellow-600">
              {playerCard.v}
              {playerCard.s}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 text-2xl font-bold text-yellow-600">
          {phase === "war" ? <span className="w-6 h-6">{Ic.war}</span> : "VS"}
          {pot > 0 && (
            <span className="text-xs text-yellow-700">pot: {pot}</span>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-yellow-700">DEALER</span>
          <WarCard
            card={dealerCard}
            hidden={false}
            glow={
              outcome === "lose" || outcome === "war-lose"
                ? "win"
                : outcome
                  ? "lose"
                  : null
            }
          />
          {dealerCard && (
            <span className="text-xs text-yellow-600">
              {dealerCard.v}
              {dealerCard.s}
            </span>
          )}
        </div>
      </div>
      {warCards.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-yellow-700">Burned cards</span>
          <div className="flex gap-1">
            {warCards.map((_, i) => (
              <div
                key={i}
                className="flex h-10 w-7 items-center justify-center rounded-lg border border-[#3d2e00] bg-[#1a1400] text-lg"
              >
                🂠
              </div>
            ))}
          </div>
        </div>
      )}
      {outcome && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-2 text-sm font-bold text-center ${outcomeStyle[outcome]}`}
        >
          {outcomeMsg[outcome]}
        </div>
      )}
      {phase === "war" && (
        <div className="fadeup w-full rounded-xl border border-yellow-600/40 bg-yellow-900/20 p-3 text-center">
          <p className="mb-2 text-sm font-bold text-yellow-400 flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.war}</span>TIE! Go to WAR?
          </p>
          <p className="mb-3 text-xs text-yellow-700">
            War costs extra {bet} coins · Win takes pot ({pot + bet * 2})
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goToWar}
              disabled={coins < bet}
              className="btn-gold flex-1 py-2 text-sm"
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-4 h-4">{Ic.war}</span>WAR!
              </span>
            </button>
            <button
              type="button"
              onClick={surrender}
              className="btn-outline flex-1 py-2 text-sm"
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-4 h-4">{Ic.surrender}</span>Surrender (-
                {Math.floor(bet / 2)})
              </span>
            </button>
          </div>
        </div>
      )}
      {phase === "idle" && (
        <BetSelector bet={bet} setBet={setBet} coins={coins} />
      )}
      {phase === "idle" && (
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
      {phase === "done" && (
        <button
          type="button"
          onClick={reset}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.replay}</span>PLAY AGAIN
          </span>
        </button>
      )}
    </div>
  );
}
