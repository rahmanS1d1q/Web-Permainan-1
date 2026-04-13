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

function RouletteWheel({ spinning, winNumber }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);
  const spinRef = useRef(false);

  const draw = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2,
      cy = canvas.height / 2,
      r = cx - 4;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const count = ROULETTE_NUMBERS.length,
      slice = (2 * Math.PI) / count;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, 2 * Math.PI);
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 6;
    ctx.stroke();
    ROULETTE_NUMBERS.forEach((num, i) => {
      const start = angle + i * slice - Math.PI / 2,
        end = start + slice;
      const color =
        num === 0 ? "#16a34a" : RED_NUMS.has(num) ? "#dc2626" : "#1c1c1c";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText(num, r - 6, 3);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#78350f";
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx - 7, 18);
    ctx.lineTo(cx + 7, 18);
    ctx.closePath();
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
  }, []);

  useEffect(() => {
    draw(angleRef.current);
  }, [draw]);
  useEffect(() => {
    if (!spinning) {
      cancelAnimationFrame(animRef.current);
      spinRef.current = false;
      if (winNumber !== null) {
        const idx = ROULETTE_NUMBERS.indexOf(winNumber);
        const slice = (2 * Math.PI) / ROULETTE_NUMBERS.length;
        angleRef.current = -(idx * slice) + Math.PI / 2 - slice / 2;
        draw(angleRef.current);
      }
      return;
    }
    spinRef.current = true;
    const animate = () => {
      if (!spinRef.current) return;
      angleRef.current += 0.22;
      draw(angleRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      spinRef.current = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [spinning, winNumber, draw]);

  return (
    <div className="roulette-canvas-wrap">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]"
      />
    </div>
  );
}

export function Roulette({ coins, onResult }) {
  const [bets, setBets] = useState({});
  const [chip, setChip] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [winNum, setWinNum] = useState(null);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
  const placeBet = (betId) => {
    if (spinning || coins - totalBet < chip) return;
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
    const spinDuration = 3500 + Math.random() * 1000;

    // Mulai suara bola berputar
    rouletteSpinStart(spinDuration);

    setResults(null);
    setWinNum(null);
    setSpinning(true);

    setTimeout(() => {
      const num =
        ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
      setWinNum(num);
      setSpinning(false);

      // Suara bola jatuh ke pocket
      rouletteBallDrop();

      let totalWin = 0;
      for (const [betId, amount] of Object.entries(bets)) {
        if (checkBetWin(betId, num))
          totalWin += amount * (getBetPayout(betId) + 1);
      }
      const net = totalWin - totalBet;
      setResults({ num, net });
      setHistory((h) => [{ num, net }, ...h.slice(0, 14)]);
      onResult(net);
      setBets({});

      // Suara hasil setelah bola settle (delay sedikit)
      setTimeout(() => {
        if (net > 0) {
          net > totalBet * 5 ? SFX.bigwin() : rouletteWin();
        } else {
          rouletteLose();
        }
      }, 500);
    }, spinDuration);
  };

  const numBg = (n) => {
    const c = numColor(n);
    return c === "green"
      ? "bg-green-700 hover:bg-green-600"
      : c === "red"
        ? "bg-red-700 hover:bg-red-600"
        : "bg-neutral-800 hover:bg-neutral-700";
  };

  return (
    <div className="fadeup flex flex-col gap-3">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          European Roulette
        </p>
      </div>
      <RouletteWheel spinning={spinning} winNumber={winNum} />
      {results && !spinning && (
        <div
          className={`fadeup rounded-xl px-4 py-2 text-center text-sm font-bold ${results.net > 0 ? "result-win glow-win" : results.net === 0 ? "result-push" : "result-lose shake"}`}
        >
          <span className="w-3 h-3 inline-block">
            {numColor(results.num) === "red"
              ? Ic.redDot
              : numColor(results.num) === "black"
                ? Ic.blackDot
                : Ic.greenDot}
          </span>
          <span className="font-mono">{results.num}</span>
          {"  "}
          {results.net > 0 ? (
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-3.5 h-3.5">{Ic.win}</span>+{results.net} coins
            </span>
          ) : results.net === 0 ? (
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-3.5 h-3.5">{Ic.push}</span>Push
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-3.5 h-3.5">{Ic.lose}</span>
              {results.net} coins
            </span>
          )}
        </div>
      )}
      {/* chip selector */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] text-yellow-800 mr-1 tracking-widest">
          CHIP
        </span>
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
        <span className="ml-auto text-xs text-yellow-700">
          Bet: <span className="text-yellow-400 font-bold">{totalBet}</span>
        </span>
      </div>
      {/* betting table */}
      <div className="rounded-xl border border-[#3d2e00] bg-[#0d0a00] p-2">
        <div className="flex gap-1 mb-1">
          <button
            type="button"
            onClick={() => placeBet("n0")}
            disabled={spinning}
            className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold text-white bg-green-700 hover:bg-green-600 border-2 ${bets["n0"] ? "border-yellow-400" : "border-transparent"}`}
          >
            0{bets["n0"] && <span className="bet-badge">{bets["n0"]}</span>}
          </button>
          <div className="grid grid-cols-12 gap-0.5 flex-1">
            {Array.from({ length: 12 }, (_, col) =>
              [col * 3 + 3, col * 3 + 2, col * 3 + 1].map((num) => {
                const bid = `n${num}`;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => placeBet(bid)}
                    disabled={spinning}
                    className={`relative flex h-8 w-full items-center justify-center rounded text-[10px] font-bold text-white transition border-2 ${numBg(num)} ${bets[bid] ? "border-yellow-400" : "border-transparent"}`}
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
        </div>
        <div className="grid grid-cols-3 gap-0.5 mb-1 ml-9">
          {[
            ["c1", "Col 1"],
            ["c2", "Col 2"],
            ["c3", "Col 3"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => placeBet(id)}
              disabled={spinning}
              className={`relative rounded py-1 text-[10px] font-bold text-yellow-400 border transition btn-outline ${bets[id] ? "border-yellow-400 bg-yellow-900/30" : ""}`}
            >
              {label} 2:1
              {bets[id] && <span className="bet-badge">{bets[id]}</span>}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-0.5 mb-1">
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
              className={`relative rounded py-1 text-[10px] font-bold text-yellow-400 border transition btn-outline ${bets[id] ? "border-yellow-400 bg-yellow-900/30" : ""}`}
            >
              {label}
              {bets[id] && <span className="bet-badge">{bets[id]}</span>}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-0.5 mb-0.5">
          {[
            ["low", "1-18"],
            ["even", "Even"],
            ["red", "🔴 Red"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => placeBet(id)}
              disabled={spinning}
              className={`relative rounded py-1.5 text-[10px] font-bold border-2 transition ${id === "red" ? "bg-red-800 hover:bg-red-700 text-white" : "btn-outline text-yellow-400"} ${bets[id] ? "border-yellow-400" : "border-transparent"}`}
            >
              {label}
              {bets[id] && <span className="bet-badge">{bets[id]}</span>}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {[
            ["high", "19-36"],
            ["odd", "Odd"],
            ["black", "⚫ Black"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => placeBet(id)}
              disabled={spinning}
              className={`relative rounded py-1.5 text-[10px] font-bold border-2 transition ${id === "black" ? "bg-neutral-700 hover:bg-neutral-600 text-white" : "btn-outline text-yellow-400"} ${bets[id] ? "border-yellow-400" : "border-transparent"}`}
            >
              {label}
              {bets[id] && <span className="bet-badge">{bets[id]}</span>}
            </button>
          ))}
        </div>
      </div>
      {Object.keys(bets).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(bets).map(([id, amt]) => (
            <span
              key={id}
              className="rounded-full bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-400"
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
          className="btn-outline px-3 py-2"
        >
          <span className="w-4 h-4 block">{Ic.undo}</span>
        </button>
        <button
          type="button"
          onClick={clearBets}
          disabled={spinning || totalBet === 0}
          className="btn-outline flex-1 py-2 text-sm"
        >
          <span className="flex items-center justify-center gap-1.5">
            <span className="w-3.5 h-3.5">{Ic.clear}</span>Clear
          </span>
        </button>
        <button
          type="button"
          onClick={spin}
          disabled={spinning || totalBet === 0 || coins < totalBet}
          className="btn-gold flex-1 py-2 text-base tracking-widest"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{Ic.spin}</span>
            {spinning ? "Spinning..." : "SPIN"}
          </span>
        </button>
      </div>
      {history.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {history.map((h, i) => (
            <span
              key={i}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ${numColor(h.num) === "red" ? "bg-red-700" : numColor(h.num) === "black" ? "bg-neutral-700" : "bg-green-700"}`}
            >
              {h.num}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
