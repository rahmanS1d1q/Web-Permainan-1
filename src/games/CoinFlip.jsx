import { useState, useEffect, useRef } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";

// SVG Crown — Heads face
const CrownSVG = (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* base bar */}
    <rect
      x="10"
      y="44"
      width="44"
      height="8"
      rx="3"
      fill="#92400e"
      stroke="#d97706"
      strokeWidth="1"
    />
    <rect
      x="10"
      y="44"
      width="44"
      height="4"
      rx="2"
      fill="#fbbf24"
      opacity="0.4"
    />
    {/* crown body */}
    <path
      d="M10 44 L10 28 L20 38 L32 16 L44 38 L54 28 L54 44 Z"
      fill="#d97706"
      stroke="#92400e"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* inner highlight */}
    <path
      d="M14 44 L14 32 L22 40 L32 22 L42 40 L50 32 L50 44 Z"
      fill="#fbbf24"
      opacity="0.35"
    />
    {/* gems on crown points */}
    <circle
      cx="32"
      cy="16"
      r="4"
      fill="#ef4444"
      stroke="#7f1d1d"
      strokeWidth="1"
    />
    <circle cx="32" cy="16" r="2" fill="#fca5a5" opacity="0.7" />
    <circle
      cx="10"
      cy="28"
      r="3.5"
      fill="#3b82f6"
      stroke="#1e3a8a"
      strokeWidth="1"
    />
    <circle cx="10" cy="28" r="1.8" fill="#bfdbfe" opacity="0.7" />
    <circle
      cx="54"
      cy="28"
      r="3.5"
      fill="#3b82f6"
      stroke="#1e3a8a"
      strokeWidth="1"
    />
    <circle cx="54" cy="28" r="1.8" fill="#bfdbfe" opacity="0.7" />
    {/* base gems */}
    <circle
      cx="22"
      cy="48"
      r="2.5"
      fill="#10b981"
      stroke="#065f46"
      strokeWidth="0.8"
    />
    <circle
      cx="32"
      cy="48"
      r="2.5"
      fill="#ef4444"
      stroke="#7f1d1d"
      strokeWidth="0.8"
    />
    <circle
      cx="42"
      cy="48"
      r="2.5"
      fill="#10b981"
      stroke="#065f46"
      strokeWidth="0.8"
    />
    {/* shine on crown */}
    <path
      d="M14 30 Q18 26 22 30"
      stroke="#fef9c3"
      strokeWidth="1.2"
      fill="none"
      opacity="0.5"
      strokeLinecap="round"
    />
    <path
      d="M42 30 Q46 26 50 30"
      stroke="#fef9c3"
      strokeWidth="1.2"
      fill="none"
      opacity="0.5"
      strokeLinecap="round"
    />
  </svg>
);

// SVG Eagle — Tails face
const EagleSVG = (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* body */}
    <ellipse cx="32" cy="36" rx="14" ry="16" fill="#d97706" />
    <ellipse cx="32" cy="36" rx="14" ry="16" fill="#fbbf24" opacity="0.3" />
    {/* left wing */}
    <path
      d="M18 34 Q8 24 6 16 Q12 22 18 28 Q14 18 16 10 Q20 20 20 30 Q16 22 20 16 Q22 26 18 34Z"
      fill="#92400e"
      stroke="#78350f"
      strokeWidth="0.8"
    />
    <path d="M18 34 Q10 26 8 18 Q13 23 18 30" fill="#d97706" opacity="0.5" />
    {/* right wing */}
    <path
      d="M46 34 Q56 24 58 16 Q52 22 46 28 Q50 18 48 10 Q44 20 44 30 Q48 22 44 16 Q42 26 46 34Z"
      fill="#92400e"
      stroke="#78350f"
      strokeWidth="0.8"
    />
    <path d="M46 34 Q54 26 56 18 Q51 23 46 30" fill="#d97706" opacity="0.5" />
    {/* head */}
    <circle cx="32" cy="22" r="10" fill="#fef9c3" />
    <circle cx="32" cy="22" r="10" fill="#fde047" opacity="0.6" />
    {/* head highlight */}
    <circle cx="29" cy="19" r="4" fill="#fff" opacity="0.3" />
    {/* eye */}
    <circle cx="35" cy="21" r="3" fill="#1c1917" />
    <circle cx="35" cy="21" r="1.5" fill="#292524" />
    <circle cx="36" cy="20" r="0.8" fill="#fff" opacity="0.9" />
    {/* beak */}
    <path
      d="M32 25 L38 27 L34 30 Z"
      fill="#d97706"
      stroke="#92400e"
      strokeWidth="0.8"
    />
    {/* white head patch */}
    <ellipse cx="30" cy="20" rx="6" ry="5" fill="#fff" opacity="0.85" />
    <ellipse cx="30" cy="20" rx="4" ry="3.5" fill="#fef9c3" opacity="0.6" />
    {/* tail feathers */}
    <path
      d="M26 50 Q28 56 32 58 Q36 56 38 50 Q34 54 32 52 Q30 54 26 50Z"
      fill="#92400e"
      stroke="#78350f"
      strokeWidth="0.8"
    />
    {/* talons */}
    <path
      d="M26 50 Q22 54 20 56"
      stroke="#78350f"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M38 50 Q42 54 44 56"
      stroke="#78350f"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M32 52 Q32 56 32 58"
      stroke="#78350f"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

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
                <div className="coin-symbol" style={{ width: 44, height: 44 }}>
                  {CrownSVG}
                </div>
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
                <div className="coin-symbol" style={{ width: 44, height: 44 }}>
                  {EagleSVG}
                </div>
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
            {c === "heads" ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  style={{ width: 20, height: 20, display: "inline-block" }}
                >
                  {CrownSVG}
                </span>
                Heads
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span
                  style={{ width: 20, height: 20, display: "inline-block" }}
                >
                  {EagleSVG}
                </span>
                Tails
              </span>
            )}
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
