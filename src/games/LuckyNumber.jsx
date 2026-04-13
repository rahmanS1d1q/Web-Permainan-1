import { useState, useEffect, useRef } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";
// ── Lucky Number (3D CSS cube dice) ───────────────────────────────────────────
// dot positions per face [col, row] on a 3×3 grid (0-2)
const FACE_DOTS = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
};

// CSS cube face — pure div with dots
function CubeFace({ face, label, style, isResult, isWin }) {
  const dots = FACE_DOTS[face] ?? FACE_DOTS[1];
  return (
    <div className="dice-face" style={style}>
      <div
        className={`dice-face-inner ${isResult ? (isWin ? "dice-win" : "dice-lose") : ""}`}
      >
        <div className="dice-dots-grid">
          {Array.from({ length: 9 }, (_, i) => {
            const col = i % 3,
              row = Math.floor(i / 3);
            const hasDot = dots.some(([c, r]) => c === col && r === row);
            return (
              <div key={i} className={`dice-dot-cell`}>
                {hasDot && <div className="dice-dot" />}
              </div>
            );
          })}
        </div>
        {label && <div className="dice-label">{label}</div>}
      </div>
    </div>
  );
}

function Dice3D({ rotX, rotY, result, isWin, rolling }) {
  const S = 90; // cube size px
  const h = S / 2;
  return (
    <div
      style={{
        width: S,
        height: S,
        perspective: 600,
        perspectiveOrigin: "50% 50%",
      }}
    >
      <div
        className="dice-cube"
        style={{
          width: S,
          height: S,
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: rolling
            ? "none"
            : "transform 0.6s cubic-bezier(.22,.68,0,1.2)",
        }}
      >
        {/* front  */}
        <CubeFace
          face={1}
          style={{ transform: `translateZ(${h}px)` }}
          isResult={result === 1}
          isWin={isWin}
        />
        {/* back   */}
        <CubeFace
          face={6}
          style={{ transform: `rotateY(180deg) translateZ(${h}px)` }}
          isResult={result === 6}
          isWin={isWin}
        />
        {/* right  */}
        <CubeFace
          face={2}
          style={{ transform: `rotateY(90deg) translateZ(${h}px)` }}
          isResult={result === 2}
          isWin={isWin}
        />
        {/* left   */}
        <CubeFace
          face={5}
          style={{ transform: `rotateY(-90deg) translateZ(${h}px)` }}
          isResult={result === 5}
          isWin={isWin}
        />
        {/* top    */}
        <CubeFace
          face={3}
          style={{ transform: `rotateX(90deg) translateZ(${h}px)` }}
          isResult={result === 3}
          isWin={isWin}
        />
        {/* bottom */}
        <CubeFace
          face={4}
          style={{ transform: `rotateX(-90deg) translateZ(${h}px)` }}
          isResult={result === 4}
          isWin={isWin}
        />
      </div>
    </div>
  );
}

export function LuckyNumber({ coins, onResult }) {
  const [pick, setPick] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [bet, setBet] = useState(10);
  const [displayNum, setDisplayNum] = useState(null);
  const [rotX, setRotX] = useState(-20);
  const [rotY, setRotY] = useState(30);
  const animRef = useRef(null);
  const intervalRef = useRef(null);
  const frameRef = useRef(0);

  const roll = () => {
    if (pick === null || rolling || coins < bet) return;
    SFX.spin();
    setOutcome(null);
    setRolling(true);

    // fast tumbling spin
    frameRef.current = 0;
    const tumble = () => {
      frameRef.current++;
      setRotX((rx) => rx + 23);
      setRotY((ry) => ry + 17);
      if (frameRef.current < 40)
        animRef.current = requestAnimationFrame(tumble);
    };
    animRef.current = requestAnimationFrame(tumble);

    let ticks = 0;
    intervalRef.current = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks > 18) {
        clearInterval(intervalRef.current);
        cancelAnimationFrame(animRef.current);
        const result = Math.floor(Math.random() * 6) + 1;
        setDisplayNum(result);
        // snap to the correct face (result is already 1-6)
        const snaps = {
          1: [0, 0],
          2: [0, -90],
          3: [-90, 0],
          4: [90, 0],
          5: [0, 90],
          6: [0, 180],
        };
        const [sx, sy] = snaps[result];
        // add full rotations to avoid snapping backwards
        setRotX((rx) => Math.round(rx / 360) * 360 + sx);
        setRotY((ry) => Math.round(ry / 360) * 360 + sy);
        const win = result === pick;
        // Near miss: selisih 1 → refund 30% bet
        const nearMiss = !win && Math.abs(result - pick) === 1;
        const payout = win ? bet * 4 : nearMiss ? -Math.floor(bet * 0.7) : -bet;
        setOutcome({ result, win, nearMiss, payout });
        onResult(payout);
        win ? SFX.bigwin() : SFX.lose();
        setRolling(false);
      }
    }, 80);
  };

  useEffect(
    () => () => {
      clearInterval(intervalRef.current);
      cancelAnimationFrame(animRef.current);
    },
    [],
  );

  const diceFace = displayNum ?? null;

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Lucky Number
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Pick 1–6 · Win = ×4 · Near miss = -30%
        </p>
      </div>

      {/* dice area */}
      <div
        className="relative flex flex-col items-center gap-2"
        style={{ minHeight: 130 }}
      >
        {/* ambient glow */}
        <div
          className={`absolute top-0 h-32 w-32 rounded-full blur-2xl transition-all duration-500 pointer-events-none
          ${rolling ? "bg-yellow-500/20 scale-110" : outcome?.win ? "bg-yellow-500/15" : "bg-transparent"}`}
        />

        <Dice3D
          rotX={rotX}
          rotY={rotY}
          result={diceFace}
          isWin={outcome?.win}
          rolling={rolling}
        />
      </div>

      {outcome && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${outcome.win ? "result-win glow-win" : outcome.nearMiss ? "result-push" : "result-lose shake"}`}
        >
          {outcome.win ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.win}</span>JACKPOT! +{bet * 4} coins
            </span>
          ) : outcome.nearMiss ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.push}</span>So close! It was{" "}
              {outcome.result} — lost {Math.floor(bet * 0.7)} coins
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.lose}</span>It was {outcome.result}{" "}
              — lost {bet} coins
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setPick(n);
              SFX.click();
            }}
            disabled={rolling}
            className={`h-11 w-11 rounded-xl text-sm font-bold transition ${pick === n ? "btn-gold shadow-[0_0_12px_#f59e0b44]" : "btn-outline"}`}
          >
            {n}
          </button>
        ))}
      </div>

      <BetSelector
        bet={bet}
        setBet={setBet}
        coins={coins}
        options={[10, 25, 50]}
        disabled={rolling}
      />
      <button
        type="button"
        onClick={roll}
        disabled={pick === null || rolling || coins < bet}
        className="btn-gold w-full py-3 text-base tracking-[0.2em]"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4">{Ic.roll}</span>
          {rolling ? "ROLLING..." : "ROLL"}
        </span>
      </button>
    </div>
  );
}
