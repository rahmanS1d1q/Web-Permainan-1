import { useEffect, useRef } from "react";

// ── Particle System ────────────────────────────────────────────────────────────

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

class Particle {
  constructor(canvas, type) {
    this.canvas = canvas;
    this.type = type; // "coin" | "confetti"
    this.reset();
  }

  reset() {
    const W = this.canvas.width,
      H = this.canvas.height;
    // Start from random top position
    this.x = randomBetween(W * 0.1, W * 0.9);
    this.y = randomBetween(-40, -10);
    this.vx = randomBetween(-3, 3);
    this.vy = randomBetween(2, 6);
    this.gravity = randomBetween(0.08, 0.18);
    this.rotation = randomBetween(0, Math.PI * 2);
    this.rotSpeed = randomBetween(-0.15, 0.15);
    this.alpha = 1;
    this.fadeSpeed = randomBetween(0.008, 0.015);
    this.scale = randomBetween(0.6, 1.4);

    if (this.type === "coin") {
      this.size = randomBetween(8, 16);
      this.color = ["#fbbf24", "#f59e0b", "#fde047", "#d97706"][
        Math.floor(Math.random() * 4)
      ];
      this.scaleX = 1; // for coin flip effect
      this.flipSpeed = randomBetween(0.08, 0.18);
      this.flipDir = Math.random() > 0.5 ? 1 : -1;
    } else {
      // confetti
      this.w = randomBetween(6, 12);
      this.h = randomBetween(3, 7);
      this.color = [
        "#fbbf24",
        "#f59e0b",
        "#ef4444",
        "#3b82f6",
        "#10b981",
        "#8b5cf6",
        "#f97316",
        "#ec4899",
      ][Math.floor(Math.random() * 8)];
      this.shape = Math.random() > 0.5 ? "rect" : "circle";
    }
  }

  update() {
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;
    this.rotation += this.rotSpeed;
    this.alpha -= this.fadeSpeed;

    if (this.type === "coin") {
      this.scaleX = Math.abs(Math.cos(this.rotation * this.flipDir));
    }

    // Slight horizontal drift
    this.vx *= 0.99;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.type === "coin") {
      ctx.scale(this.scaleX * this.scale, this.scale);
      // Coin body
      const grad = ctx.createRadialGradient(
        -this.size * 0.3,
        -this.size * 0.3,
        1,
        0,
        0,
        this.size,
      );
      grad.addColorStop(0, "#fef9c3");
      grad.addColorStop(0.4, this.color);
      grad.addColorStop(1, "#92400e");
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Coin shine
      ctx.beginPath();
      ctx.arc(
        -this.size * 0.3,
        -this.size * 0.3,
        this.size * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fill();
      // $ symbol
      ctx.fillStyle = "#92400e";
      ctx.font = `bold ${this.size * 0.9}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", 0, 0);
    } else {
      // Confetti
      ctx.scale(this.scale, this.scale);
      ctx.fillStyle = this.color;
      if (this.shape === "rect") {
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  isDead() {
    return this.alpha <= 0 || this.y > this.canvas.height + 50;
  }
}

// ── Coin Rain (Big Win) ────────────────────────────────────────────────────────
export function CoinRain({ active, onDone }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Spawn coins in bursts
    let spawnCount = 0;
    const maxSpawn = 60;
    let lastSpawn = 0;

    const spawn = (now) => {
      if (spawnCount < maxSpawn && now - lastSpawn > 40) {
        const burst = Math.min(4, maxSpawn - spawnCount);
        for (let i = 0; i < burst; i++) {
          particlesRef.current.push(new Particle(canvas, "coin"));
        }
        spawnCount += burst;
        lastSpawn = now;
      }
    };

    const animate = (now) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      spawn(now);
      particlesRef.current = particlesRef.current.filter((p) => !p.isDead());
      particlesRef.current.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      if (particlesRef.current.length > 0 || spawnCount < maxSpawn) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onDone) onDone();
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      particlesRef.current = [];
    };
  }, [active, onDone]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 z-[110] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

// ── Confetti Burst (Jackpot) ───────────────────────────────────────────────────
export function ConfettiBurst({ active, onDone }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Spawn big burst immediately from center-top
    const spawnBurst = () => {
      for (let i = 0; i < 120; i++) {
        const p = new Particle(canvas, "confetti");
        // Burst from center
        p.x = canvas.width / 2 + randomBetween(-80, 80);
        p.y = canvas.height * 0.3;
        p.vx = randomBetween(-8, 8);
        p.vy = randomBetween(-12, 2);
        p.gravity = randomBetween(0.15, 0.3);
        p.fadeSpeed = randomBetween(0.005, 0.012);
        particlesRef.current.push(p);
      }
    };

    spawnBurst();
    // Second burst after 300ms
    const t2 = setTimeout(() => {
      for (let i = 0; i < 80; i++) {
        const p = new Particle(canvas, "confetti");
        p.x = randomBetween(canvas.width * 0.2, canvas.width * 0.8);
        p.y = -10;
        p.vx = randomBetween(-4, 4);
        p.vy = randomBetween(3, 8);
        p.gravity = randomBetween(0.1, 0.2);
        p.fadeSpeed = randomBetween(0.006, 0.014);
        particlesRef.current.push(p);
      }
    }, 300);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => !p.isDead());
      particlesRef.current.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onDone) onDone();
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      clearTimeout(t2);
      cancelAnimationFrame(animRef.current);
      particlesRef.current = [];
    };
  }, [active, onDone]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 z-[110] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
