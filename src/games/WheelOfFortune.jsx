import { useState, useRef, useEffect, useCallback } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";

const SEGMENTS = [
  { label: "2×", mult: 2, color: "#dc2626", textColor: "#fff" },
  { label: "0×", mult: 0, color: "#1c1c1c", textColor: "#9ca3af" },
  { label: "5×", mult: 5, color: "#d97706", textColor: "#000" },
  { label: "0×", mult: 0, color: "#1c1c1c", textColor: "#9ca3af" },
  { label: "1.5×", mult: 1.5, color: "#16a34a", textColor: "#fff" },
  { label: "0×", mult: 0, color: "#1c1c1c", textColor: "#9ca3af" },
  { label: "3×", mult: 3, color: "#7c3aed", textColor: "#fff" },
  { label: "0×", mult: 0, color: "#1c1c1c", textColor: "#9ca3af" },
  { label: "JACKPOT", mult: 20, color: "#fbbf24", textColor: "#000" },
  { label: "0×", mult: 0, color: "#1c1c1c", textColor: "#9ca3af" },
  { label: "1×", mult: 1, color: "#0891b2", textColor: "#fff" },
  { label: "0×", mult: 0, color: "#1c1c1c", textColor: "#9ca3af" },
];

const SLICE = (2 * Math.PI) / SEGMENTS.length;

function drawWheel(canvas, angle) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    cx = W / 2,
    cy = W / 2,
    r = cx - 6;
  ctx.clearRect(0, 0, W, W);

  // ── Outer ring (fixed, tidak rotate) ──
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, 2 * Math.PI);
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 8;
  ctx.stroke();

  // ── Segments (rotate dengan angle) ──
  SEGMENTS.forEach((seg, i) => {
    const start = angle + i * SLICE - Math.PI / 2;
    const end = start + SLICE;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = "#0d0a00";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // label — di tengah segment
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + SLICE / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = seg.textColor;
    ctx.font = `bold ${seg.label === "JACKPOT" ? 9 : 11}px sans-serif`;
    ctx.fillText(seg.label, r - 8, 4);
    ctx.restore();
  });

  // ── Center hub (fixed) ──
  const hub = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 22);
  hub.addColorStop(0, "#fde047");
  hub.addColorStop(0.4, "#d97706");
  hub.addColorStop(1, "#78350f");
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
  ctx.fillStyle = hub;
  ctx.fill();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "#fbbf24";
  ctx.fill();

  // ── Pointer — FIXED di top center, tidak ikut rotate ──
  // Pointer menunjuk ke bawah (ke dalam wheel) dari posisi top
  const ptrTip = 2; // ujung pointer (atas)
  const ptrBase = 20; // pangkal pointer
  const ptrW = 10; // setengah lebar pangkal
  ctx.beginPath();
  ctx.moveTo(cx, ptrTip);
  ctx.lineTo(cx - ptrW, ptrBase);
  ctx.lineTo(cx + ptrW, ptrBase);
  ctx.closePath();
  const pg = ctx.createLinearGradient(cx, ptrTip, cx, ptrBase);
  pg.addColorStop(0, "#fbbf24");
  pg.addColorStop(1, "#d97706");
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // shine
  ctx.beginPath();
  ctx.moveTo(cx - 3, ptrTip + 3);
  ctx.lineTo(cx + 3, ptrTip + 3);
  ctx.lineTo(cx + 1, ptrBase - 4);
  ctx.lineTo(cx - 1, ptrBase - 4);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fill();
}

export function WheelOfFortune({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const animRef = useRef(null);

  const draw = useCallback((angle) => {
    if (canvasRef.current) drawWheel(canvasRef.current, angle);
  }, []);

  useEffect(() => {
    draw(0);
  }, [draw]);

  const spin = () => {
    if (spinning || coins < bet) return;
    SFX.roulette();
    setResult(null);
    setSpinning(true);

    // Pick result segment
    const segIdx = Math.floor(Math.random() * SEGMENTS.length);
    const seg = SEGMENTS[segIdx];

    // ── Kalkulasi target angle yang benar ──
    // Pointer ada di TOP canvas = sudut -π/2 dalam koordinat canvas
    // Segment i digambar mulai dari: wheelAngle + i*SLICE - π/2
    // Center segment i ada di:       wheelAngle + i*SLICE - π/2 + SLICE/2
    //
    // Supaya CENTER segment segIdx tepat di pointer (top = -π/2):
    //   wheelAngle + segIdx*SLICE - π/2 + SLICE/2 = -π/2  (mod 2π)
    //   wheelAngle = -segIdx*SLICE - SLICE/2               (mod 2π)
    //
    // Normalisasi ke [0, 2π]:
    const rawTarget =
      (-(segIdx * SLICE) - SLICE / 2 + 2 * Math.PI * 10) % (2 * Math.PI);

    // Dari posisi saat ini, tambah minimal 5 putaran penuh ke depan
    const currentNorm =
      ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    let delta = rawTarget - currentNorm;
    if (delta <= 0) delta += 2 * Math.PI; // pastikan maju ke depan
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    const endAngle = angleRef.current + delta + extraSpins;

    const duration = 4000;
    const startAngle = angleRef.current;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // ease-out quart — smooth deceleration
      const eased = 1 - Math.pow(1 - t, 4);
      const angle = startAngle + (endAngle - startAngle) * eased;
      angleRef.current = angle;
      draw(angle);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Snap tepat ke target
        angleRef.current = endAngle;
        draw(endAngle);
        const net = seg.mult > 0 ? Math.floor(bet * seg.mult) - bet : -bet;
        setResult({ seg, net });
        onResult(net, seg.mult === 20 ? "wheel_jackpot" : undefined);
        net > 0 ? (seg.mult >= 10 ? SFX.bigwin() : SFX.win()) : SFX.lose();
        setSpinning(false);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
    <div className="fadeup flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Wheel of Fortune
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Spin to win · Jackpot = 20×
        </p>
      </div>
      <div className="relative" style={{ width: 240, height: 240 }}>
        <canvas
          ref={canvasRef}
          width={240}
          height={240}
          className="drop-shadow-[0_0_24px_rgba(245,158,11,0.35)]"
        />
      </div>
      {result && !spinning && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${result.net > 0 ? "result-win glow-win" : "result-lose shake"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4">{result.net > 0 ? Ic.win : Ic.lose}</span>
            {result.seg.label} —{" "}
            {result.net > 0 ? `+${result.net}` : `${result.net}`} coins
          </span>
        </div>
      )}
      <BetSelector
        bet={bet}
        setBet={setBet}
        coins={coins}
        options={[5, 10, 25, 50]}
        disabled={spinning}
      />
      <button
        type="button"
        onClick={spin}
        disabled={spinning || coins < bet}
        className="btn-gold w-full py-3 text-base tracking-[0.2em]"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4">{Ic.spin}</span>
          {spinning ? "SPINNING..." : "SPIN"}
        </span>
      </button>
      <div className="w-full grid grid-cols-4 gap-1">
        {SEGMENTS.filter((s) => s.mult > 0).map((s, i) => (
          <div
            key={i}
            className="rounded-lg px-2 py-1 text-center text-xs font-bold"
            style={{
              background: s.color + "33",
              border: `1px solid ${s.color}66`,
              color: s.color === "#1c1c1c" ? "#9ca3af" : s.color,
            }}
          >
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
