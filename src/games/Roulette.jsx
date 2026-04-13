import { useState, useEffect, useCallback, useRef } from "react";
import { Ic } from "../icons.jsx";
import {
  SFX,
  rouletteSpinStart,
  rouletteBallDrop,
  rouletteWin,
  rouletteLose,
} from "../sounds.js";

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED_NUMS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 21, 23, 25, 27, 30, 32, 34, 36,
]);
const numColor = (n) => (n === 0 ? "green" : RED_NUMS.has(n) ? "red" : "black");

function checkBetWin(betId, winNum) {
  if (betId.startsWith("n")) return parseInt(betId.slice(1)) === winNum;
  switch (betId) {
    case "red":
      return RED_NUMS.has(winNum);
    case "black":
      return winNum > 0 && !RED_NUMS.has(winNum);
    case "odd":
      return winNum > 0 && winNum % 2 === 1;
    case "even":
      return winNum > 0 && winNum % 2 === 0;
    case "low":
      return winNum >= 1 && winNum <= 18;
    case "high":
      return winNum >= 19 && winNum <= 36;
    case "d1":
      return winNum >= 1 && winNum <= 12;
    case "d2":
      return winNum >= 13 && winNum <= 24;
    case "d3":
      return winNum >= 25 && winNum <= 36;
    case "c1":
      return winNum > 0 && winNum % 3 === 1;
    case "c2":
      return winNum > 0 && winNum % 3 === 2;
    case "c3":
      return winNum > 0 && winNum % 3 === 0;
    default:
      return false;
  }
}
function getBetPayout(betId) {
  if (betId.startsWith("n")) return 35;
  return (
    {
      red: 1,
      black: 1,
      odd: 1,
      even: 1,
      low: 1,
      high: 1,
      d1: 2,
      d2: 2,
      d3: 2,
      c1: 2,
      c2: 2,
      c3: 2,
    }[betId] ?? 1
  );
}

// -- Professional Roulette Wheel -----------------------------------------------
function RouletteWheel({ spinning, winNumber, onSpinComplete }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({
    // wheel
    wheelAngle: 0,
    wheelTarget: 0,
    wheelSpeed: 0,
    // ball
    ballAngle: 0,
    ballTarget: 0,
    ballRadius: 0, // current orbit radius (shrinks as ball falls in)
    ballSpeed: 0,
    // phase: "idle" | "spinning" | "settling" | "done"
    phase: "idle",
    winIdx: -1,
  });

  const SLICE = (2 * Math.PI) / ROULETTE_NUMBERS.length;
  // Pointer is at top (angle = -PI/2 from canvas coords)
  // Segment i starts at: wheelAngle + i*SLICE - PI/2
  // Center of segment i: wheelAngle + i*SLICE - PI/2 + SLICE/2
  // For segment i to be under pointer (top = -PI/2):
  //   wheelAngle + i*SLICE - PI/2 + SLICE/2 = -PI/2  (mod 2PI)
  //   wheelAngle = -i*SLICE  (mod 2PI)

  const draw = useCallback(
    (wAngle, bAngle, bRadius, showBall, winIdx, phase) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const W = canvas.width,
        cx = W / 2,
        cy = W / 2;
      const outerR = cx - 2;
      const wheelR = cx - 14;
      const innerR = cx - 44;
      const trackR = innerR - 10; // ball track radius
      const hubR = 22;
      const isDone = phase === "done";

      ctx.clearRect(0, 0, W, W);

      // -- Outer decorative ring --
      const outerGrad = ctx.createRadialGradient(
        cx,
        cy,
        wheelR,
        cx,
        cy,
        outerR,
      );
      outerGrad.addColorStop(0, "#3d2000");
      outerGrad.addColorStop(0.5, "#d97706");
      outerGrad.addColorStop(1, "#92400e");
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
      ctx.fillStyle = outerGrad;
      ctx.fill();

      // Diamond separators on outer ring (rotate with wheel)
      for (let i = 0; i < ROULETTE_NUMBERS.length; i++) {
        const a = wAngle + i * SLICE - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(
          cx + (outerR - 5) * Math.cos(a),
          cy + (outerR - 5) * Math.sin(a),
          2.5,
          0,
          2 * Math.PI,
        );
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
      }

      // -- Number segments --
      ROULETTE_NUMBERS.forEach((num, i) => {
        const start = wAngle + i * SLICE - Math.PI / 2;
        const end = start + SLICE;
        const isWin = isDone && i === winIdx;
        const baseColor =
          num === 0 ? "#15803d" : RED_NUMS.has(num) ? "#b91c1c" : "#1c1917";
        const lightColor =
          num === 0 ? "#16a34a" : RED_NUMS.has(num) ? "#dc2626" : "#292524";

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, wheelR, start, end);
        ctx.closePath();

        if (isWin) {
          const g = ctx.createRadialGradient(cx, cy, innerR, cx, cy, wheelR);
          g.addColorStop(0, "#fef9c3");
          g.addColorStop(0.4, "#fbbf24");
          g.addColorStop(1, lightColor);
          ctx.fillStyle = g;
        } else {
          const g = ctx.createRadialGradient(cx, cy, innerR, cx, cy, wheelR);
          g.addColorStop(0, lightColor);
          g.addColorStop(1, baseColor);
          ctx.fillStyle = g;
        }
        ctx.fill();

        // Divider
        ctx.beginPath();
        ctx.moveTo(
          cx + innerR * Math.cos(start),
          cy + innerR * Math.sin(start),
        );
        ctx.lineTo(
          cx + wheelR * Math.cos(start),
          cy + wheelR * Math.sin(start),
        );
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Number
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + SLICE / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = isWin ? "#000" : "#fff";
        ctx.font = `bold ${isWin ? "10" : "8.5"}px Arial, sans-serif`;
        if (isWin) {
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 8;
        }
        ctx.fillText(num, wheelR - 5, 3.5);
        ctx.restore();
      });

      // -- Inner track --
      const trackGrad = ctx.createRadialGradient(
        cx,
        cy,
        innerR - 10,
        cx,
        cy,
        innerR,
      );
      trackGrad.addColorStop(0, "#1a0d00");
      trackGrad.addColorStop(0.6, "#2d1800");
      trackGrad.addColorStop(1, "#3d2000");
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
      ctx.fillStyle = trackGrad;
      ctx.fill();
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, innerR - 6, 0, 2 * Math.PI);
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1;
      ctx.stroke();

      // -- Ball --
      if (showBall) {
        const bx = cx + bRadius * Math.cos(bAngle);
        const by = cy + bRadius * Math.sin(bAngle);
        // shadow
        ctx.beginPath();
        ctx.arc(bx + 1.5, by + 1.5, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fill();
        // body
        const bg = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 6);
        bg.addColorStop(0, "#fff");
        bg.addColorStop(0.3, "#e5e7eb");
        bg.addColorStop(1, "#9ca3af");
        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, 2 * Math.PI);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // shine
        ctx.beginPath();
        ctx.arc(bx - 2, by - 2, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fill();
      }

      // -- Hub --
      const hubGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, hubR);
      hubGrad.addColorStop(0, "#fde047");
      hubGrad.addColorStop(0.4, "#d97706");
      hubGrad.addColorStop(1, "#78350f");
      ctx.beginPath();
      ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
      ctx.fillStyle = hubGrad;
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, hubR - 6, 0, 2 * Math.PI);
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();

      // -- Pointer (fixed, top center) --
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.lineTo(cx - 9, 20);
      ctx.lineTo(cx + 9, 20);
      ctx.closePath();
      const pg = ctx.createLinearGradient(cx, 2, cx, 20);
      pg.addColorStop(0, "#fbbf24");
      pg.addColorStop(1, "#d97706");
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 3, 5);
      ctx.lineTo(cx + 3, 5);
      ctx.lineTo(cx + 1, 13);
      ctx.lineTo(cx - 1, 13);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fill();
    },
    [SLICE],
  );

  useEffect(() => {
    const s = stateRef.current;
    draw(s.wheelAngle, s.ballAngle, 0, false, -1, "idle");
  }, [draw]);

  useEffect(() => {
    const s = stateRef.current;
    cancelAnimationFrame(animRef.current);

    if (!spinning && winNumber === null) {
      // Reset
      s.phase = "idle";
      draw(s.wheelAngle, 0, 0, false, -1, "idle");
      return;
    }

    if (spinning) {
      // -- Start spin --
      s.phase = "spinning";
      s.wheelSpeed = 0.04 + Math.random() * 0.02; // wheel clockwise slow
      s.ballSpeed = -(0.25 + Math.random() * 0.05); // ball counter-clockwise fast
      s.ballRadius = 260 / 2 - 44 - 10; // start at track radius

      const animate = () => {
        if (s.phase !== "spinning") return;
        s.wheelAngle += s.wheelSpeed;
        s.ballAngle += s.ballSpeed;
        draw(s.wheelAngle, s.ballAngle, s.ballRadius, true, -1, "spinning");
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
      return;
    }

    // -- Settle: spinning just became false, winNumber is set --
    if (!spinning && winNumber !== null) {
      cancelAnimationFrame(animRef.current);
      s.phase = "settling";

      const winIdx = ROULETTE_NUMBERS.indexOf(winNumber);
      s.winIdx = winIdx;

      // Target wheel angle: segment winIdx center must be at top (angle = -PI/2)
      // Center of segment i at angle: wheelAngle + i*SLICE - PI/2 + SLICE/2
      // We want that = -PI/2 (top)
      // => wheelAngle = -i*SLICE  (mod 2PI)
      // Add extra full rotations so wheel keeps spinning forward
      const rawTarget = -winIdx * SLICE;
      const currentNorm =
        ((s.wheelAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const targetNorm =
        ((rawTarget % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      let delta = targetNorm - currentNorm;
      if (delta < 0) delta += 2 * Math.PI;
      // Add 3-5 extra full rotations for dramatic effect
      const extraSpins = (3 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
      s.wheelTarget = s.wheelAngle + delta + extraSpins;

      // Ball target: land in the winning segment
      // Ball angle when it lands = wheel angle of segment center at that moment
      // = wheelTarget + winIdx*SLICE - PI/2 + SLICE/2
      const ballLandAngle =
        s.wheelTarget + winIdx * SLICE - Math.PI / 2 + SLICE / 2;
      // Ball needs to travel to that angle � add extra rotations
      const ballCurrentNorm =
        ((s.ballAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const ballTargetNorm =
        ((ballLandAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      let ballDelta = ballTargetNorm - ballCurrentNorm;
      // Ball was going negative (counter-clockwise), keep going that way
      if (ballDelta > 0) ballDelta -= 2 * Math.PI;
      const ballExtraSpins = -(2 + Math.floor(Math.random() * 2)) * 2 * Math.PI;
      s.ballTarget = s.ballAngle + ballDelta + ballExtraSpins;

      const trackR = 260 / 2 - 44 - 10;
      const finalBallR = 260 / 2 - 44 - 28; // ball falls into segment (closer to center)
      s.ballRadius = trackR;

      const duration = 2800; // ms for settling animation
      const startTime = performance.now();
      const startWheelAngle = s.wheelAngle;
      const startBallAngle = s.ballAngle;
      const startBallR = trackR;

      const settle = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease out quart � smooth deceleration
        const eased = 1 - Math.pow(1 - t, 4);

        s.wheelAngle =
          startWheelAngle + (s.wheelTarget - startWheelAngle) * eased;
        s.ballAngle = startBallAngle + (s.ballTarget - startBallAngle) * eased;
        // Ball radius: stays on track until 80% done, then falls in
        const rProgress = Math.max(0, (t - 0.7) / 0.3);
        s.ballRadius =
          startBallR +
          (finalBallR - startBallR) * (1 - Math.pow(1 - rProgress, 2));

        draw(s.wheelAngle, s.ballAngle, s.ballRadius, true, -1, "settling");

        if (t < 1) {
          animRef.current = requestAnimationFrame(settle);
        } else {
          // Final snap � draw with win highlight
          s.wheelAngle = s.wheelTarget;
          s.ballAngle = s.ballTarget;
          s.ballRadius = finalBallR;
          s.phase = "done";
          draw(s.wheelAngle, s.ballAngle, s.ballRadius, true, winIdx, "done");
          if (onSpinComplete) onSpinComplete();
        }
      };
      animRef.current = requestAnimationFrame(settle);
    }

    return () => cancelAnimationFrame(animRef.current);
  }, [spinning, winNumber, draw, onSpinComplete]);

  const SIZE = 260;
  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: spinning
              ? "0 0 40px #f59e0b55, 0 0 80px #f59e0b22"
              : "0 0 20px #f59e0b33",
            transition: "box-shadow 0.5s",
          }}
        />
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ borderRadius: "50%", display: "block" }}
        />
      </div>
    </div>
  );
}

// ── Main Roulette Component ───────────────────────────────────────────────────
export function Roulette({ coins, onResult }) {
  const [bets, setBets] = useState({});
  const [chip, setChip] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [winNum, setWinNum] = useState(null);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const placeBet = (betId) => {
    if (spinning || totalBet + chip > coins) return;
    SFX.click();
    setBets((prev) => ({ ...prev, [betId]: (prev[betId] ?? 0) + chip }));
  };

  const undoLast = () => {
    if (spinning) return;
    const keys = Object.keys(bets);
    if (!keys.length) return;
    const last = keys[keys.length - 1];
    setBets((prev) => {
      const next = { ...prev };
      if (next[last] <= chip) delete next[last];
      else next[last] -= chip;
      return next;
    });
  };

  const clearBets = () => {
    if (!spinning) setBets({});
  };

  const spin = () => {
    if (spinning || totalBet === 0 || coins < totalBet) return;

    // Tentukan angka pemenang
    const num =
      ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];

    // Hitung hasil sekarang — simpan snapshot bets sebelum di-clear
    let totalWin = 0;
    const wonBets = [];
    for (const [betId, amount] of Object.entries(bets)) {
      if (checkBetWin(betId, num)) {
        const payout = getBetPayout(betId);
        totalWin += amount * (payout + 1);
        wonBets.push({ betId, amount, payout });
      }
    }
    const net = totalWin - totalBet;
    const snap = { num, net, totalBet, totalWin, wonBets };

    // Mulai animasi wheel
    rouletteSpinStart(4000);
    setResults(null);
    setWinNum(null);
    setSpinning(true);

    // Setelah 3.5 detik: set angka → wheel mulai settling animation (~2.8 detik)
    setTimeout(() => {
      setWinNum(snap.num);
      setSpinning(false);
    }, 3500);

    // Setelah 6.5 detik: tampilkan hasil (3.5 + 2.8 + buffer 0.2)
    setTimeout(() => {
      rouletteBallDrop();
      setResults(snap);
      setHistory((h) => [{ num: snap.num, net: snap.net }, ...h.slice(0, 19)]);
      onResult(snap.net);
      setBets({});
      setTimeout(() => {
        snap.net > 0
          ? snap.net > snap.totalBet * 3
            ? SFX.bigwin()
            : rouletteWin()
          : rouletteLose();
      }, 300);
    }, 6500);
  };

  const numBg = (n) => {
    const c = numColor(n);
    return c === "green"
      ? "bg-green-700 hover:bg-green-600"
      : c === "red"
        ? "bg-red-800 hover:bg-red-700"
        : "bg-neutral-800 hover:bg-neutral-700";
  };

  return (
    <div className="fadeup flex flex-col gap-3">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          European Roulette
        </p>
        <p className="text-[10px] text-yellow-900 mt-0.5">
          Single zero · Straight up pays 35:1
        </p>
      </div>

      <RouletteWheel
        spinning={spinning}
        winNumber={winNum}
        onSpinComplete={null}
      />

      {results && !spinning && (
        <div
          className={`fadeup rounded-xl px-4 py-3 text-sm font-bold ${results.net > 0 ? "result-win glow-win" : results.net === 0 ? "result-push" : "result-lose shake"}`}
        >
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white flex-shrink-0 ${numColor(results.num) === "red" ? "bg-red-700" : numColor(results.num) === "black" ? "bg-neutral-700" : "bg-green-700"}`}
            >
              {results.num}
            </span>
            {results.net > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4">{Ic.win}</span>+{results.net} coins
              </span>
            ) : results.net === 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4">{Ic.push}</span>Push — bet returned
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4">{Ic.lose}</span>
                {results.net} coins
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 text-[10px] border-t border-current/20 pt-1.5 opacity-75">
            <span>
              Bet: <b>{results.totalBet}</b>
            </span>
            <span>
              Return: <b>{results.totalWin}</b>
            </span>
            {results.wonBets.length > 0 && (
              <span className="text-green-300">
                Won:{" "}
                {results.wonBets
                  .slice(0, 3)
                  .map((w) =>
                    w.betId.startsWith("n") ? `#${w.betId.slice(1)}` : w.betId,
                  )
                  .join(", ")}
                {results.wonBets.length > 3
                  ? ` +${results.wonBets.length - 3}`
                  : ""}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-yellow-800 tracking-widest font-bold">
          CHIP
        </span>
        <div className="flex gap-1.5 flex-1">
          {[5, 10, 25, 50, 100].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setChip(c);
                SFX.click();
              }}
              disabled={spinning}
              className={`chip ${c === 5 ? "chip-5" : c === 10 ? "chip-10" : c === 25 ? "chip-25" : c === 50 ? "chip-50" : "chip-100"} ${chip === c ? "active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-xs text-yellow-700 flex-shrink-0">
          Bet: <span className="text-yellow-400 font-bold">{totalBet}</span>
        </span>
      </div>

      <div className="rounded-xl border border-[#3d2e00] bg-[#0a0800] overflow-hidden">
        <div className="p-1.5">
          <div className="flex gap-0.5 mb-0.5">
            <button
              type="button"
              onClick={() => placeBet("n0")}
              disabled={spinning}
              className={`relative flex items-center justify-center rounded text-[10px] font-bold text-white bg-green-800 hover:bg-green-700 border-2 transition-all ${bets["n0"] ? "border-yellow-400 scale-105" : "border-transparent"}`}
              style={{ width: 28, height: 52 }}
            >
              0{bets["n0"] && <span className="bet-badge">{bets["n0"]}</span>}
            </button>
            <div
              className="flex-1 grid gap-0.5"
              style={{
                gridTemplateColumns: "repeat(12, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
              }}
            >
              {Array.from({ length: 12 }, (_, col) =>
                [col * 3 + 3, col * 3 + 2, col * 3 + 1].map((num) => {
                  const bid = `n${num}`;
                  const isWin = results && results.num === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => placeBet(bid)}
                      disabled={spinning}
                      className={`relative flex items-center justify-center rounded text-[9px] font-bold text-white transition-all border-2 ${numBg(num)} ${bets[bid] ? "border-yellow-400 scale-105" : "border-transparent"} ${isWin ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-black" : ""}`}
                      style={{ height: 24 }}
                    >
                      {num}
                      {bets[bid] && (
                        <span className="bet-badge">{bets[bid]}</span>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
            <div className="flex flex-col gap-0.5" style={{ width: 28 }}>
              {[
                ["c3", "3:1"],
                ["c2", "3:1"],
                ["c1", "3:1"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => placeBet(id)}
                  disabled={spinning}
                  className={`relative flex-1 flex items-center justify-center rounded text-[8px] font-bold text-yellow-400 border transition-all btn-outline ${bets[id] ? "border-yellow-400 bg-yellow-900/30" : ""}`}
                >
                  {label}
                  {bets[id] && <span className="bet-badge">{bets[id]}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0.5 mb-0.5 ml-7 mr-7">
            {[
              ["d1", "1st 12"],
              ["d2", "2nd 12"],
              ["d3", "3rd 12"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => placeBet(id)}
                disabled={spinning}
                className={`relative rounded py-1 text-[9px] font-bold text-yellow-400 border transition-all btn-outline ${bets[id] ? "border-yellow-400 bg-yellow-900/30" : ""}`}
              >
                {label}
                {bets[id] && <span className="bet-badge">{bets[id]}</span>}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-0.5 ml-7 mr-7">
            {[
              ["low", "1-18", "btn-outline text-yellow-400"],
              ["even", "Even", "btn-outline text-yellow-400"],
              ["red", "Red", "bg-red-800 hover:bg-red-700 text-white border-2"],
              [
                "black",
                "Black",
                "bg-neutral-800 hover:bg-neutral-700 text-white border-2",
              ],
              ["odd", "Odd", "btn-outline text-yellow-400"],
              ["high", "19-36", "btn-outline text-yellow-400"],
            ].map(([id, label, cls]) => (
              <button
                key={id}
                type="button"
                onClick={() => placeBet(id)}
                disabled={spinning}
                className={`relative rounded py-1.5 text-[9px] font-bold transition-all ${cls} ${bets[id] ? "border-yellow-400 bg-yellow-900/20" : id === "red" || id === "black" ? "border-transparent" : ""}`}
              >
                {id === "red" && (
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-0.5 align-middle" />
                )}
                {id === "black" && (
                  <span className="inline-block w-2 h-2 rounded-full bg-neutral-400 mr-0.5 align-middle" />
                )}
                {label}
                {bets[id] && <span className="bet-badge">{bets[id]}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {Object.keys(bets).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(bets).map(([id, amt]) => (
            <span
              key={id}
              className="rounded-full border border-yellow-900/50 bg-yellow-950/40 px-2 py-0.5 text-[10px] text-yellow-500"
            >
              {id.startsWith("n") ? `#${id.slice(1)}` : id} · {amt}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={undoLast}
          disabled={spinning || totalBet === 0}
          className="btn-outline px-3 py-2.5"
          title="Undo"
        >
          <span className="w-4 h-4 block">{Ic.undo}</span>
        </button>
        <button
          type="button"
          onClick={clearBets}
          disabled={spinning || totalBet === 0}
          className="btn-outline px-4 py-2.5 text-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5">{Ic.clear}</span>Clear
          </span>
        </button>
        <button
          type="button"
          onClick={spin}
          disabled={spinning || totalBet === 0 || coins < totalBet}
          className="btn-gold flex-1 py-2.5 text-sm tracking-widest"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.spin}</span>
            {spinning ? "SPINNING..." : "SPIN"}
          </span>
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <p className="text-[9px] text-yellow-900 tracking-widest mb-1.5">
            LAST RESULTS
          </p>
          <div className="flex flex-wrap gap-1">
            {history.map((h, i) => (
              <span
                key={i}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white transition-all ${numColor(h.num) === "red" ? "bg-red-700" : numColor(h.num) === "black" ? "bg-neutral-700" : "bg-green-700"} ${i === 0 ? "ring-2 ring-yellow-400 scale-110" : ""}`}
              >
                {h.num}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
