import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";

const PLINKO_ROWS = 12; // row terakhir = 13 peg, spacing cukup untuk bola lewat
const PLINKO_MULTS_MEDIUM = [110, 40, 15, 8, 4, 2, 0.3, 2, 4, 8, 15, 40, 110];

function multColor(m) {
  if (m >= 30) return { bg: "#4c1d95", light: "#a78bfa" }; // jackpot — ungu
  if (m >= 10) return { bg: "#b45309", light: "#fbbf24" }; // tinggi — emas
  if (m >= 3) return { bg: "#15803d", light: "#4ade80" }; // sedang — hijau
  if (m >= 1) return { bg: "#1d4ed8", light: "#60a5fa" }; // rendah — biru
  return { bg: "#1c1917", light: "#78716c" }; // rugi — abu
}

// Kalkulasi: row terakhir (row 11) punya 13 peg
// spacing = W / (13+1) = 340/14 ≈ 24.3px
// gap antar peg = 24.3 - 2×PEG_R = 24.3 - 8 = 16.3px
// ball diameter = 2×BALL_R = 12px → 16.3 > 12 ✓ bola bisa lewat
const W = 340,
  H = 480,
  TOP_PAD = 32,
  BOT_PAD = 52,
  PEG_R = 4,
  BALL_R = 6;

export function Plinko({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [dropping, setDropping] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [riskLevel, setRiskLevel] = useState("medium"); // low | medium | high
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Tengah = multiplier TINGGI, tepi = rendah
  // Bola secara natural jatuh ke tengah (distribusi binomial) → lebih sering menang
  const MULT_TABLE = {
    //        tepi                    tengah                   tepi
    //   [0]  [1]  [2]  [3]  [4]  [5]  [6]  [5]  [4]  [3]  [2]  [1]  [0]
    low: [0.2, 0.3, 0.5, 0.8, 1.2, 1.8, 3.0, 1.8, 1.2, 0.8, 0.5, 0.3, 0.2],
    medium: [0.2, 0.3, 0.5, 1.0, 2.0, 5.0, 15, 5.0, 2.0, 1.0, 0.5, 0.3, 0.2],
    high: [0.2, 0.2, 0.3, 0.5, 1.0, 3.0, 50, 3.0, 1.0, 0.5, 0.3, 0.2, 0.2],
  };
  const mults = MULT_TABLE[riskLevel];
  const usableH = H - TOP_PAD - BOT_PAD;
  const pegs = useMemo(() => {
    const list = [];
    for (let r = 0; r < PLINKO_ROWS; r++) {
      const count = r + 2; // row 0: 2 peg, row 11: 13 peg
      const rowY = TOP_PAD + (usableH / PLINKO_ROWS) * (r + 0.5);
      const spacing = W / (count + 1);
      for (let c = 0; c < count; c++) {
        list.push({ x: spacing * (c + 1), y: rowY, row: r, col: c });
      }
    }
    return list;
  }, [usableH]);

  const draw = useCallback(
    (ball, trail, slot, hitPeg) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);

      // ── Background ──
      ctx.fillStyle = "#0a0800";
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "#1a120022";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // ── Slots ──
      const slotW = W / mults.length;
      mults.forEach((mult, i) => {
        const x = i * slotW;
        const isActive = i === slot;
        const col = multColor(mult);

        // slot body
        const g = ctx.createLinearGradient(x, H - BOT_PAD, x, H);
        if (isActive) {
          g.addColorStop(0, col.light);
          g.addColorStop(1, col.bg);
        } else {
          g.addColorStop(0, col.bg + "cc");
          g.addColorStop(1, col.bg + "88");
        }
        ctx.fillStyle = g;
        ctx.strokeStyle = isActive ? col.light : col.bg;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(x + 1.5, H - BOT_PAD + 2, slotW - 3, BOT_PAD - 4, 4);
        ctx.fill();
        ctx.stroke();

        // active glow
        if (isActive) {
          ctx.shadowColor = col.light;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.roundRect(x + 1.5, H - BOT_PAD + 2, slotW - 3, BOT_PAD - 4, 4);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // multiplier text
        ctx.fillStyle = isActive ? col.text : col.light;
        const fontSize = mult >= 100 ? 8 : mult >= 10 ? 9 : 10;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = "center";
        const label = mult >= 1 ? `${mult}×` : `${mult}×`;
        ctx.fillText(label, x + slotW / 2, H - BOT_PAD + BOT_PAD / 2 + 4);
      });

      // ── Pegs ──
      pegs.forEach(({ x, y }) => {
        const isHit =
          hitPeg && Math.abs(hitPeg.x - x) < 2 && Math.abs(hitPeg.y - y) < 2;

        if (isHit) {
          // flash white on hit
          ctx.beginPath();
          ctx.arc(x, y, PEG_R + 6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.fill();
        }

        // peg glow
        const halo = ctx.createRadialGradient(x, y, 0, x, y, PEG_R + 4);
        halo.addColorStop(0, isHit ? "#ffffff44" : "#fbbf2422");
        halo.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, PEG_R + 4, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // peg body
        const pg = ctx.createRadialGradient(x - 1.2, y - 1.2, 0, x, y, PEG_R);
        pg.addColorStop(0, isHit ? "#ffffff" : "#fef3c7");
        pg.addColorStop(0.35, isHit ? "#fbbf24" : "#f59e0b");
        pg.addColorStop(1, "#92400e");
        ctx.beginPath();
        ctx.arc(x, y, PEG_R, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.strokeStyle = isHit ? "#fff" : "#d97706";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // ── Trail ──
      for (let i = 1; i < trail.length; i++) {
        const alpha = (i / trail.length) * 0.6;
        const width = 1 + (i / trail.length) * 2;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `rgba(251,191,36,${alpha})`;
        ctx.lineWidth = width;
        ctx.stroke();
      }

      // ── Ball ──
      if (ball) {
        // shadow
        ctx.beginPath();
        ctx.ellipse(
          ball.x,
          ball.y + BALL_R + 2,
          BALL_R * 0.85,
          3,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fill();

        // body gradient
        const bg = ctx.createRadialGradient(
          ball.x - 2.5,
          ball.y - 2.5,
          1,
          ball.x,
          ball.y,
          BALL_R,
        );
        bg.addColorStop(0, "#ffffff");
        bg.addColorStop(0.2, "#fef3c7");
        bg.addColorStop(0.55, "#f59e0b");
        bg.addColorStop(1, "#d97706");
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = "#92400e";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // shine
        ctx.beginPath();
        ctx.arc(ball.x - 2.5, ball.y - 2.5, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ball.x + 1.5, ball.y - 1, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fill();
      }
    },
    [pegs, mults],
  );

  useEffect(() => {
    draw(null, [], null, null);
  }, [draw]);

  const drop = () => {
    if (dropping || coins < bet) return;
    setActiveSlot(null);
    setLastResult(null);
    setDropping(true);

    const GRAVITY = 0.26;
    const RESTITUTION = 0.5;
    const PEG_FRIC = 0.75;
    const WALL_REST = 0.3;
    const FLOOR_Y = H - BOT_PAD + BALL_R;

    const ball = {
      x: W / 2 + (Math.random() - 0.5) * 4,
      y: TOP_PAD - 20,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 0.3,
    };

    const trail = [];
    let lastPegSound = 0;
    let floorBounces = 0;
    let lastHitPeg = null;
    let hitFlashFrames = 0;

    const simulate = (ts) => {
      ball.vy += GRAVITY;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // walls
      if (ball.x - BALL_R < 2) {
        ball.x = 2 + BALL_R;
        ball.vx = Math.abs(ball.vx) * WALL_REST;
      }
      if (ball.x + BALL_R > W - 2) {
        ball.x = W - 2 - BALL_R;
        ball.vx = -Math.abs(ball.vx) * WALL_REST;
      }

      // peg collisions
      for (const peg of pegs) {
        const dx = ball.x - peg.x,
          dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minD = BALL_R + PEG_R;
        if (dist < minD && dist > 0.001) {
          const nx = dx / dist,
            ny = dy / dist;
          ball.x = peg.x + nx * (minD + 0.5);
          ball.y = peg.y + ny * (minD + 0.5);
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx = (ball.vx - 2 * dot * nx) * RESTITUTION;
          ball.vy = (ball.vy - 2 * dot * ny) * RESTITUTION;
          ball.vx *= PEG_FRIC;
          ball.vx += (Math.random() - 0.5) * 0.7;
          ball.vx = Math.max(-4, Math.min(4, ball.vx));
          if (ts - lastPegSound > 60) {
            SFX.plinko();
            lastPegSound = ts;
          }
          lastHitPeg = peg;
          hitFlashFrames = 6;
        }
      }

      // floor
      if (ball.y + BALL_R >= FLOOR_Y) {
        ball.y = FLOOR_Y - BALL_R;
        ball.vy = -Math.abs(ball.vy) * 0.28;
        ball.vx *= 0.75;
        floorBounces++;
      }

      if (hitFlashFrames > 0) hitFlashFrames--;
      else lastHitPeg = null;

      trail.push({ x: ball.x, y: ball.y });
      if (trail.length > 45) trail.shift();
      draw({ x: ball.x, y: ball.y }, trail, null, lastHitPeg);

      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      if (floorBounces >= 2 && speed < 0.5 && ball.y + BALL_R >= FLOOR_Y - 2) {
        const slotW = W / mults.length;
        const rawSlot = Math.floor(ball.x / slotW);
        const slotIdx = Math.max(0, Math.min(mults.length - 1, rawSlot));
        const targetX = slotIdx * slotW + slotW / 2;
        const startX = ball.x;
        let t = 0;
        const slide = () => {
          t += 0.07;
          const cx = startX + (targetX - startX) * Math.min(t, 1);
          draw({ x: cx, y: FLOOR_Y - BALL_R }, [], slotIdx, null);
          if (t < 1) {
            animRef.current = requestAnimationFrame(slide);
            return;
          }
          const mult = mults[slotIdx];
          const net = mult > 0 ? Math.floor(bet * mult) - bet : -bet;
          setLastResult({ mult, net });
          setActiveSlot(slotIdx);
          onResult(net, mult >= 30 ? "plinko_10x" : undefined);
          net >= 0 ? (mult >= 10 ? SFX.bigwin() : SFX.win()) : SFX.lose();
          setDropping(false);
        };
        animRef.current = requestAnimationFrame(slide);
        return;
      }

      animRef.current = requestAnimationFrame(simulate);
    };

    animRef.current = requestAnimationFrame(simulate);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
    <div className="fadeup flex flex-col items-center gap-3">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Plinko
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          12 rows · 13 slots · Drop the ball!
        </p>
      </div>

      {/* Risk selector */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-[10px] text-yellow-800 tracking-widest font-bold flex-shrink-0">
          RISK
        </span>
        <div className="flex gap-1.5 flex-1">
          {[
            ["low", "Low", "text-green-400 border-green-800"],
            ["medium", "Medium", "text-yellow-400 border-yellow-800"],
            ["high", "High", "text-red-400 border-red-800"],
          ].map(([val, label, cls]) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setRiskLevel(val);
                SFX.click();
              }}
              disabled={dropping}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold border transition-all ${riskLevel === val ? `${cls} bg-opacity-20 border-opacity-80` : "btn-outline opacity-50"}`}
              style={riskLevel === val ? { borderWidth: 2 } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="plinko-canvas-wrap w-full">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            background: "#0a0800",
            display: "block",
            borderRadius: 12,
            border: "1px solid #2a1e00",
          }}
        />
      </div>

      {/* Result */}
      {lastResult && !dropping && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-2.5 text-sm font-bold text-center ${lastResult.net >= 0 ? "result-win glow-win" : "result-lose shake"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5">
              {lastResult.net >= 0 ? Ic.win : Ic.lose}
            </span>
            {lastResult.mult}× →{" "}
            {lastResult.net >= 0 ? `+${lastResult.net}` : `${lastResult.net}`}{" "}
            coins
          </span>
        </div>
      )}

      <BetSelector
        bet={bet}
        setBet={setBet}
        coins={coins}
        options={[5, 10, 25, 50]}
        disabled={dropping}
      />

      <button
        type="button"
        onClick={drop}
        disabled={dropping || coins < bet}
        className="btn-gold w-full py-3 text-base tracking-[0.2em]"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4">{Ic.drop}</span>
          {dropping ? "Dropping..." : "DROP BALL"}
        </span>
      </button>

      {/* Multiplier legend */}
      <div
        className="w-full grid gap-1"
        style={{ gridTemplateColumns: `repeat(${mults.length}, 1fr)` }}
      >
        {mults.map((m, i) => {
          const col = multColor(m);
          return (
            <div
              key={i}
              className={`rounded text-center py-0.5 text-[8px] font-bold transition-all ${activeSlot === i ? "scale-110 ring-1 ring-white" : ""}`}
              style={{
                background: col.bg,
                color: col.light,
                fontSize: m >= 100 ? 7 : 8,
              }}
            >
              {m}×
            </div>
          );
        })}
      </div>
    </div>
  );
}
