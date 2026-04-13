import { useState, useEffect, useRef } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";
export function CoinFlip({ coins, onResult }) {
  const [choice, setChoice] = useState(null);
  const [flipping, setFlipping] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [bet, setBet] = useState(10);
  // track rotation for smooth continuous flip
  const rotationRef = useRef(0);
  const animRef = useRef(null);
  const [rotation, setRotation] = useState(0);

  const flip = () => {
    if (!choice || flipping || coins < bet) return;
    SFX.flip();
    setOutcome(null);
    setFlipping(true);

    const startRot = rotationRef.current;
    const startTime = performance.now();
    const duration = 1200;
    // spin at least 4 full rotations
    const totalSpin = 360 * 4 + Math.random() * 360;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const rot = startRot + totalSpin * eased;
      rotationRef.current = rot;
      setRotation(rot);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const result = Math.random() < 0.5 ? "heads" : "tails";
        // snap to correct face: heads = even 360 (front), tails = odd 180 (back)
        const snapRot =
          result === "heads"
            ? Math.ceil(rot / 360) * 360
            : Math.ceil(rot / 360) * 360 - 180;
        rotationRef.current = snapRot;
        setRotation(snapRot);
        const win = result === choice;
        setOutcome({ result, win });
        // House edge 5%: win pays 0.95× bet
        onResult(win ? Math.floor(bet * 0.95) : -bet);
        win ? SFX.win() : SFX.lose();
        setFlipping(false);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // which face is showing based on rotation
  const normalizedRot = ((rotation % 360) + 360) % 360;
  const showingFront = normalizedRot < 90 || normalizedRot >= 270;

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Coin Flip
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Double or nothing · Win pays 0.95×
        </p>
      </div>

      {/* 3D coin */}
      <div
        className="relative flex items-center justify-center"
        style={{ perspective: "600px" }}
      >
        {/* glow */}
        <div
          className={`absolute h-40 w-40 rounded-full transition-all duration-500 blur-2xl
          ${flipping ? "bg-yellow-500/15 scale-110" : outcome?.win ? "bg-yellow-500/12" : "bg-transparent"}`}
        />

        {/* coin wrapper — rotates on Y axis */}
        <div
          className="relative select-none"
          style={{
            width: 112,
            height: 112,
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
            transition: flipping ? "none" : "transform 0.4s ease-out",
          }}
        >
          {/* FRONT — Heads */}
          <div
            className="coin-face coin-front"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div
              className={`coin-ring ${outcome?.win && outcome.result === "heads" ? "ring-win" : outcome && outcome.result !== "heads" ? "ring-lose" : ""}`}
            >
              {/* outer ring detail */}
              <div className="coin-inner">
                <div className="coin-symbol">👑</div>
                <div className="coin-label">HEADS</div>
              </div>
            </div>
          </div>

          {/* BACK — Tails (rotated 180deg on Y) */}
          <div
            className="coin-face coin-back"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div
              className={`coin-ring ${outcome?.win && outcome.result === "tails" ? "ring-win" : outcome && outcome.result !== "tails" ? "ring-lose" : ""}`}
            >
              <div className="coin-inner">
                <div className="coin-symbol">🦅</div>
                <div className="coin-label">TAILS</div>
              </div>
            </div>
          </div>
        </div>

        {/* edge indicator */}
        {!flipping && !outcome && (
          <div className="absolute -bottom-6 text-[10px] text-yellow-800 tracking-widest">
            {showingFront ? "HEADS" : "TAILS"}
          </div>
        )}
      </div>

      {outcome && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${outcome.win ? "result-win glow-win" : "result-lose shake"}`}
        >
          {outcome.win ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.win}</span>Correct! +
              {Math.floor(bet * 0.95)} coins
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.lose}</span>Wrong! -{bet} coins
            </span>
          )}
          <span className="ml-2 text-xs opacity-60 capitalize">
            ({outcome.result})
          </span>
        </div>
      )}

      <div className="flex w-full gap-3">
        {["heads", "tails"].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setChoice(c);
              SFX.click();
            }}
            disabled={flipping}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${choice === c ? "btn-gold" : "btn-outline"}`}
          >
            {c === "heads" ? "👑  Heads" : "🦅  Tails"}
          </button>
        ))}
      </div>
      <BetSelector
        bet={bet}
        setBet={setBet}
        coins={coins}
        disabled={flipping}
      />
      <button
        type="button"
        onClick={flip}
        disabled={!choice || flipping || coins < bet}
        className="btn-gold w-full py-3 text-base tracking-[0.2em]"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4">{Ic.flip}</span>
          {flipping ? "FLIPPING..." : "FLIP"}
        </span>
      </button>
    </div>
  );
}
