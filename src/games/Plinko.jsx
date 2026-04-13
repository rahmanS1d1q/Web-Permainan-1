import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Ic } from "../icons.jsx";
import { SFX } from "../sounds.js";
import { BetSelector } from "../ui/modals.jsx";
const PLINKO_ROWS = 8;
// Tuned for ~88% RTP: edge slots lebih jarang, tengah lebih sering
// [edge, mid-high, mid, center-high, center, center-high, mid, mid-high, edge]
const PLINKO_MULTS = [8, 3, 1.5, 0.8, 0.3, 0.8, 1.5, 3, 8];

export function Plinko({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [dropping, setDropping] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const W = 300,
    H = 380,
    topPad = 44,
    botPad = 48;
  const usableH = H - topPad - botPad;
  const PEG_R = 5,
    BALL_R = 8;

  const pegs = useMemo(() => {
    const list = [];
    for (let r = 0; r < PLINKO_ROWS; r++) {
      const count = r + 2;
      const rowY = topPad + (usableH / PLINKO_ROWS) * (r + 0.5);
      const spacing = W / (count + 1);
      for (let c = 0; c < count; c++)
        list.push({ x: spacing * (c + 1), y: rowY });
    }
    return list;
  }, []);

  const draw = useCallback(
    (ball, trail, slot) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);

      // background grid
      ctx.strokeStyle = "#1a120033";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // slots
      const slotW = W / PLINKO_MULTS.length;
      PLINKO_MULTS.forEach((mult, i) => {
        const x = i * slotW,
          isActive = i === slot,
          isHigh = mult >= 4;
        const g = ctx.createLinearGradient(x, H - botPad, x, H);
        if (isActive) {
          g.addColorStop(0, "#fbbf24");
          g.addColorStop(1, "#d97706");
        } else if (isHigh) {
          g.addColorStop(0, "#92400e");
          g.addColorStop(1, "#78350f");
        } else {
          g.addColorStop(0, "#1a1400");
          g.addColorStop(1, "#0d0a00");
        }
        ctx.fillStyle = g;
        ctx.strokeStyle = isActive ? "#f59e0b" : "#3d2e00";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 2, H - botPad + 2, slotW - 4, botPad - 4, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isActive ? "#000" : isHigh ? "#fbbf24" : "#78350f";
        ctx.font = `bold ${mult >= 10 ? 10 : 9}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`${mult}x`, x + slotW / 2, H - 14);
      });

      // pegs
      pegs.forEach(({ x, y }) => {
        const halo = ctx.createRadialGradient(x, y, 0, x, y, PEG_R + 5);
        halo.addColorStop(0, "#fbbf2433");
        halo.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, PEG_R + 5, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();
        const pg = ctx.createRadialGradient(x - 1.5, y - 1.5, 0, x, y, PEG_R);
        pg.addColorStop(0, "#fef3c7");
        pg.addColorStop(0.4, "#fbbf24");
        pg.addColorStop(1, "#92400e");
        ctx.beginPath();
        ctx.arc(x, y, PEG_R, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // trail
      for (let i = 1; i < trail.length; i++) {
        const alpha = (i / trail.length) * 0.5;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `rgba(251,191,36,${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // ball
      if (ball) {
        ctx.beginPath();
        ctx.ellipse(
          ball.x,
          ball.y + BALL_R + 2,
          BALL_R * 0.8,
          3,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fill();
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
        bg.addColorStop(0.6, "#f59e0b");
        bg.addColorStop(1, "#d97706");
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = "#92400e";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ball.x - 2.5, ball.y - 2.5, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ball.x + 1.5, ball.y - 1, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fill();
      }
    },
    [pegs],
  );

  useEffect(() => {
    draw(null, [], null);
  }, [draw]);

  const drop = () => {
    if (dropping || coins < bet) return;
    setActiveSlot(null);
    setLastResult(null);
    setDropping(true);

    // ── Pure physics — no pre-determined result ──
    const GRAVITY = 0.32;
    const RESTITUTION = 0.58; // energy kept on peg bounce
    const PEG_FRIC = 0.82; // horizontal damping on peg hit
    const WALL_REST = 0.35;
    const FLOOR_Y = H - botPad + BALL_R;

    // ball starts at top center, tiny random offset so it's not perfectly symmetric
    const ball = {
      x: W / 2 + (Math.random() - 0.5) * 4,
      y: topPad - 20,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.5,
    };

    const trail = [];
    let lastPegSound = 0;
    let floorBounces = 0;

    const simulate = (ts) => {
      // gravity
      ball.vy += GRAVITY;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // wall collisions
      if (ball.x - BALL_R < 1) {
        ball.x = 1 + BALL_R;
        ball.vx = Math.abs(ball.vx) * WALL_REST;
      }
      if (ball.x + BALL_R > W - 1) {
        ball.x = W - 1 - BALL_R;
        ball.vx = -Math.abs(ball.vx) * WALL_REST;
      }

      // peg collisions — check every peg every frame
      for (const peg of pegs) {
        const dx = ball.x - peg.x,
          dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minD = BALL_R + PEG_R;
        if (dist < minD && dist > 0.001) {
          const nx = dx / dist,
            ny = dy / dist;
          // push ball out of overlap
          ball.x = peg.x + nx * (minD + 0.5);
          ball.y = peg.y + ny * (minD + 0.5);
          // reflect velocity along collision normal
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx = (ball.vx - 2 * dot * nx) * RESTITUTION;
          ball.vy = (ball.vy - 2 * dot * ny) * RESTITUTION;
          // horizontal friction + small random nudge (natural spread)
          ball.vx *= PEG_FRIC;
          ball.vx += (Math.random() - 0.5) * 0.9;
          // clamp so ball doesn't fly sideways
          ball.vx = Math.max(-4.5, Math.min(4.5, ball.vx));
          if (ts - lastPegSound > 80) {
            SFX.plinko();
            lastPegSound = ts;
          }
        }
      }

      // floor bounce
      if (ball.y + BALL_R >= FLOOR_Y) {
        ball.y = FLOOR_Y - BALL_R;
        ball.vy = -Math.abs(ball.vy) * 0.32;
        ball.vx *= 0.78;
        floorBounces++;
      }

      // trail
      trail.push({ x: ball.x, y: ball.y });
      if (trail.length > 35) trail.shift();
      draw({ x: ball.x, y: ball.y }, trail, null);

      // settle: on floor, slow enough, bounced at least twice
      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      if (floorBounces >= 2 && speed < 0.5 && ball.y + BALL_R >= FLOOR_Y - 2) {
        // slot determined by where ball actually stopped — fully neutral
        const slotW = W / PLINKO_MULTS.length;
        const rawSlot = Math.floor(ball.x / slotW);
        const slotIdx = Math.max(0, Math.min(PLINKO_MULTS.length - 1, rawSlot));
        const targetX = slotIdx * slotW + slotW / 2;
        const startX = ball.x;
        let t = 0;
        const slide = () => {
          t += 0.06;
          const cx = startX + (targetX - startX) * Math.min(t, 1);
          draw({ x: cx, y: FLOOR_Y - BALL_R }, [], slotIdx);
          if (t < 1) {
            animRef.current = requestAnimationFrame(slide);
            return;
          }
          const mult = PLINKO_MULTS[slotIdx];
          const net = Math.floor(bet * mult) - bet;
          setLastResult({ mult, net });
          setActiveSlot(slotIdx);
          onResult(net);
          net >= 0 ? (mult >= 4 ? SFX.bigwin() : SFX.win()) : SFX.lose();
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
          Drop the ball — watch it bounce!
        </p>
      </div>
      <div className="plinko-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ background: "#0d0a00", display: "block" }}
        />
      </div>
      {lastResult && !dropping && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-2 text-sm font-bold text-center ${lastResult.net >= 0 ? "result-win glow-win" : "result-lose shake"}`}
        >
          {lastResult.mult}× →{" "}
          {lastResult.net >= 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-3.5 h-3.5">{Ic.win}</span>+{lastResult.net}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="w-3.5 h-3.5">{Ic.lose}</span>
              {lastResult.net}
            </span>
          )}{" "}
          coins
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
    </div>
  );
}
