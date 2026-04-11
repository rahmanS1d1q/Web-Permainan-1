import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── constants ──────────────────────────────────────────────────────────────────
const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
const PAYOUTS = {
  "💎💎💎": 50,
  "7️⃣7️⃣7️⃣": 30,
  "⭐⭐⭐": 20,
  "🍇🍇🍇": 15,
  "🍊🍊🍊": 10,
  "🍋🍋🍋": 8,
  "🍒🍒🍒": 5,
};
const STARTING_COINS = 500;
const STORAGE_KEY = "casino-mini-state";
const DAILY_KEY = "casino-daily-bonus";
const MUTE_KEY = "casino-muted";
const BIG_WIN_THRESHOLD = 100;
const DAILY_STREAK_BONUSES = [200, 250, 300, 400, 500, 600, 1000]; // day 1-7+

// ── persistence ────────────────────────────────────────────────────────────────
function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

// ── Mute state (module-level so SFX can read it) ───────────────────────────────
let _muted = localStorage.getItem(MUTE_KEY) === "1";
export function setMuted(v) {
  _muted = v;
  localStorage.setItem(MUTE_KEY, v ? "1" : "0");
}
export function getMuted() {
  return _muted;
}

// ── Web Audio sound engine ─────────────────────────────────────────────────────
const AudioCtx =
  typeof window !== "undefined" &&
  (window.AudioContext || window.webkitAudioContext);
let _ctx = null;
function getCtx() {
  if (!_ctx && AudioCtx) _ctx = new AudioCtx();
  return _ctx;
}
function playTone(freq, type = "sine", duration = 0.12, vol = 0.18, delay = 0) {
  if (_muted) return;
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch {}
}
const SFX = {
  spin: () => {
    playTone(220, "sawtooth", 0.08, 0.1);
    playTone(180, "sawtooth", 0.08, 0.08, 0.05);
  },
  click: () => playTone(600, "sine", 0.05, 0.1),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      playTone(f, "sine", 0.15, 0.2, i * 0.1),
    );
  },
  bigwin: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      playTone(f, "triangle", 0.2, 0.3, i * 0.08),
    );
  },
  lose: () => {
    playTone(200, "sawtooth", 0.15, 0.15);
    playTone(150, "sawtooth", 0.15, 0.12, 0.1);
  },
  flip: () => {
    for (let i = 0; i < 6; i++)
      playTone(300 + i * 80, "sine", 0.06, 0.1, i * 0.05);
  },
  deal: () => playTone(800, "sine", 0.06, 0.12),
  crash: () => {
    playTone(400, "sawtooth", 0.3, 0.3);
    playTone(200, "sawtooth", 0.3, 0.2, 0.1);
  },
  cashout: () => {
    [400, 600, 800].forEach((f, i) => playTone(f, "sine", 0.1, 0.2, i * 0.06));
  },
  roulette: () => {
    for (let i = 0; i < 8; i++)
      playTone(200 + i * 30, "sine", 0.08, 0.08, i * 0.12);
  },
  plinko: () => playTone(500 + Math.random() * 300, "sine", 0.05, 0.12),
  bonus: () => {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      playTone(f, "sine", 0.2, 0.25, i * 0.07),
    );
  },
  achieve: () => {
    [800, 1000, 1200, 1000, 800].forEach((f, i) =>
      playTone(f, "triangle", 0.1, 0.25, i * 0.06),
    );
  },
  levelup: () => {
    [400, 500, 600, 800, 1000].forEach((f, i) =>
      playTone(f, "sine", 0.18, 0.3, i * 0.07),
    );
  },
};

// ── Achievements definition ────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  {
    id: "first_win",
    label: "First Blood",
    desc: "Win your first game",
    icon: "🩸",
  },
  { id: "jackpot", label: "Jackpot!", desc: "Hit 💎💎💎 on slots", icon: "💎" },
  {
    id: "lucky7",
    label: "Lucky Seven",
    desc: "Win Lucky Number with 7",
    icon: "7️⃣",
  },
  {
    id: "crash_5x",
    label: "Daredevil",
    desc: "Cash out at 5× or higher in Crash",
    icon: "🚀",
  },
  {
    id: "crash_10x",
    label: "Rocketeer",
    desc: "Cash out at 10× or higher",
    icon: "🌕",
  },
  {
    id: "bj_natural",
    label: "Natural",
    desc: "Get a natural Blackjack",
    icon: "🃏",
  },
  {
    id: "bj_double",
    label: "Double Down",
    desc: "Win a doubled Blackjack hand",
    icon: "✌️",
  },
  { id: "streak_5", label: "On Fire", desc: "Win 5 in a row", icon: "🔥" },
  {
    id: "streak_10",
    label: "Unstoppable",
    desc: "Win 10 in a row",
    icon: "⚡",
  },
  {
    id: "war_won",
    label: "Warlord",
    desc: "Win a Card War battle",
    icon: "⚔️",
  },
  {
    id: "roulette_35",
    label: "Straight Up",
    desc: "Win a straight-up roulette bet",
    icon: "🎡",
  },
  {
    id: "plinko_10x",
    label: "Plinko King",
    desc: "Land on 10× in Plinko",
    icon: "🎯",
  },
  {
    id: "millionaire",
    label: "High Roller",
    desc: "Reach 2000 coins",
    icon: "💰",
  },
  {
    id: "comeback",
    label: "Comeback Kid",
    desc: "Win after having < 50 coins",
    icon: "🦅",
  },
  {
    id: "daily_7",
    label: "Loyal Player",
    desc: "Claim daily bonus 7 days in a row",
    icon: "📅",
  },
];

function checkAchievements(current, event) {
  const unlocked = [];
  const { type, data, stats, coins } = event;
  if (type === "win" && stats.wins === 1) unlocked.push("first_win");
  if (type === "jackpot") unlocked.push("jackpot");
  if (type === "lucky7") unlocked.push("lucky7");
  if (type === "cashout" && data?.mult >= 5) unlocked.push("crash_5x");
  if (type === "cashout" && data?.mult >= 10) unlocked.push("crash_10x");
  if (type === "bj_natural") unlocked.push("bj_natural");
  if (type === "bj_double_win") unlocked.push("bj_double");
  if (stats.currentStreak >= 5) unlocked.push("streak_5");
  if (stats.currentStreak >= 10) unlocked.push("streak_10");
  if (type === "war_won") unlocked.push("war_won");
  if (type === "roulette_straight") unlocked.push("roulette_35");
  if (type === "plinko_10x") unlocked.push("plinko_10x");
  if (coins >= 2000) unlocked.push("millionaire");
  if (type === "win" && data?.prevCoins < 50) unlocked.push("comeback");
  if (type === "daily" && data?.streak >= 7) unlocked.push("daily_7");
  return unlocked.filter((id) => !current.includes(id));
}

// ── Big Win overlay ────────────────────────────────────────────────────────────
function BigWinOverlay({ amount, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="relative flex flex-col items-center gap-3 animate-bigwin">
        <div className="text-6xl animate-bounce">🎉</div>
        <div className="rounded-2xl border-2 border-yellow-400 bg-black/80 px-8 py-5 text-center shadow-[0_0_60px_#f59e0b88] backdrop-blur-sm">
          <p className="text-xs tracking-[0.4em] text-yellow-600 uppercase">
            Big Win!
          </p>
          <p
            className="mt-1 text-5xl font-bold text-yellow-400"
            style={{ textShadow: "0 0 30px #f59e0b" }}
          >
            +{amount}
          </p>
          <p className="mt-1 text-sm text-yellow-600">coins</p>
        </div>
        <div
          className="text-5xl animate-bounce"
          style={{ animationDelay: "0.1s" }}
        >
          🎊
        </div>
      </div>
    </div>
  );
}

// ── Achievement toast ──────────────────────────────────────────────────────────
function AchievementToast({ achievement, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 fadeup pointer-events-none">
      <div className="flex items-center gap-3 rounded-2xl border border-yellow-600/60 bg-black/90 px-5 py-3 shadow-[0_0_30px_#f59e0b44] backdrop-blur-sm">
        <span className="text-3xl">{achievement.icon}</span>
        <div>
          <p className="text-[9px] tracking-[0.3em] text-yellow-700 uppercase">
            Achievement Unlocked!
          </p>
          <p className="text-sm font-bold text-yellow-400">
            {achievement.label}
          </p>
          <p className="text-[10px] text-yellow-700">{achievement.desc}</p>
        </div>
      </div>
    </div>
  );
}

// ── Session Summary modal ──────────────────────────────────────────────────────
function SessionSummary({ session, onClose }) {
  const net = session.endCoins - session.startCoins;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-glass m-4 w-full max-w-xs rounded-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-4xl">{net >= 0 ? "🏆" : "💸"}</div>
        <h2 className="text-lg font-bold text-yellow-400 tracking-widest">
          SESSION OVER
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          {[
            ["Games Played", session.played],
            ["Wins", session.wins],
            ["Net Result", (net >= 0 ? "+" : "") + net + " coins"],
            ["Best Win", session.bestWin > 0 ? "+" + session.bestWin : "—"],
          ].map(([l, v]) => (
            <div
              key={l}
              className="rounded-xl border border-[#2a1e00] bg-[#0f0c00] p-2"
            >
              <p className="text-[9px] text-yellow-800">{l}</p>
              <p
                className={`text-sm font-bold ${l === "Net Result" ? (net >= 0 ? "text-yellow-400" : "text-red-400") : "text-yellow-400"}`}
              >
                {v}
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-gold mt-4 w-full py-2 text-sm"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ── Stats modal ────────────────────────────────────────────────────────────────
function StatsModal({ stats, achievements, leaderboard, onClose }) {
  const [tab, setTab] = useState("stats");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-glass m-4 w-full max-w-sm rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            {["stats", "achievements", "leaderboard"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${tab === t ? "btn-gold" : "btn-outline"}`}
              >
                {t === "stats" ? "📊" : t === "achievements" ? "🏅" : "🏆"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-yellow-700 hover:text-yellow-400 text-xl"
          >
            ✕
          </button>
        </div>

        {tab === "stats" && (
          <div className="grid grid-cols-2 gap-2">
            {[
              ["🎮 Games", stats.played],
              ["🏆 Wins", stats.wins],
              ["💸 Losses", stats.losses],
              [
                "📊 Win Rate",
                stats.played
                  ? Math.round((stats.wins / stats.played) * 100) + "%"
                  : "—",
              ],
              [
                "💰 Biggest Win",
                stats.biggestWin > 0 ? "+" + stats.biggestWin : "—",
              ],
              [
                "📉 Biggest Loss",
                stats.biggestLoss < 0 ? stats.biggestLoss : "—",
              ],
              ["🪙 Total Won", stats.totalWon > 0 ? "+" + stats.totalWon : "0"],
              ["🔥 Best Streak", stats.bestStreak],
            ].map(([l, v]) => (
              <div
                key={l}
                className="rounded-xl border border-[#2a1e00] bg-[#0f0c00] p-3"
              >
                <p className="text-[10px] text-yellow-800">{l}</p>
                <p className="mt-0.5 text-base font-bold text-yellow-400">
                  {v}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "achievements" && (
          <div className="space-y-2">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = achievements.includes(a.id);
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${unlocked ? "border-yellow-700 bg-yellow-950/40" : "border-[#1a1200] bg-[#0a0800] opacity-50"}`}
                >
                  <span className="text-2xl">{unlocked ? a.icon : "🔒"}</span>
                  <div>
                    <p
                      className={`text-sm font-bold ${unlocked ? "text-yellow-400" : "text-yellow-900"}`}
                    >
                      {a.label}
                    </p>
                    <p className="text-[10px] text-yellow-800">{a.desc}</p>
                  </div>
                  {unlocked && (
                    <span className="ml-auto text-[10px] text-yellow-600">
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="space-y-2">
            <p className="text-[10px] tracking-widest text-yellow-800 uppercase mb-3">
              Top Sessions
            </p>
            {leaderboard.length === 0 && (
              <p className="text-center text-yellow-900 text-sm py-4">
                No sessions yet
              </p>
            )}
            {leaderboard.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[#2a1e00] bg-[#0f0c00] px-3 py-2"
              >
                <span className="text-lg">
                  {i === 0
                    ? "🥇"
                    : i === 1
                      ? "🥈"
                      : i === 2
                        ? "🥉"
                        : `${i + 1}.`}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-yellow-400">
                    {entry.coins.toLocaleString()} coins
                  </p>
                  <p className="text-[10px] text-yellow-800">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="btn-gold mt-4 w-full py-2 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Daily Bonus modal (with streak) ───────────────────────────────────────────
function DailyBonusModal({ streak, bonus, onClaim }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="card-glass m-4 w-full max-w-xs rounded-2xl p-6 text-center">
        <div className="mb-3 text-5xl">🎁</div>
        <h2 className="text-xl font-bold text-yellow-400 tracking-widest">
          DAILY BONUS
        </h2>
        <p className="mt-2 text-sm text-yellow-700">Day {streak} streak!</p>
        <div className="mt-3 flex justify-center gap-1 mb-3">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-6 rounded-full transition-all ${i < streak ? "bg-yellow-500" : "bg-yellow-900/40"}`}
            />
          ))}
        </div>
        <p
          className="text-4xl font-bold text-yellow-300"
          style={{ textShadow: "0 0 20px #f59e0b" }}
        >
          +{bonus}
        </p>
        <p className="text-sm text-yellow-600">coins</p>
        {streak < 7 && (
          <p className="mt-2 text-[10px] text-yellow-800">
            Come back tomorrow for +{DAILY_STREAK_BONUSES[Math.min(streak, 6)]}{" "}
            coins!
          </p>
        )}
        {streak >= 7 && (
          <p className="mt-2 text-[10px] text-yellow-500">
            🔥 Max streak bonus!
          </p>
        )}
        <button
          type="button"
          onClick={onClaim}
          className="btn-gold mt-5 w-full py-3 text-base tracking-widest"
        >
          🎁 CLAIM
        </button>
      </div>
    </div>
  );
}

// ── Bet Confirmation modal ─────────────────────────────────────────────────────
function BetConfirm({ amount, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card-glass m-4 w-full max-w-xs rounded-2xl p-5 text-center">
        <div className="mb-3 text-4xl">⚠️</div>
        <h2 className="text-base font-bold text-yellow-400">Large Bet</h2>
        <p className="mt-2 text-sm text-yellow-700">
          You're about to bet{" "}
          <span className="font-bold text-yellow-400">{amount} coins</span>. Are
          you sure?
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline flex-1 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-gold flex-1 py-2 text-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mini history chart ─────────────────────────────────────────────────────────
function MiniChart({ history }) {
  if (history.length < 2) return null;
  const vals = history.slice(0, 20).reverse();
  const max = Math.max(...vals.map((h) => Math.abs(h.delta)), 1);
  const W = 200,
    H = 40;
  const pts = vals
    .map((h, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H / 2 - (h.delta / max) * (H / 2 - 4);
      return `${x},${y}`;
    })
    .join(" ");
  const lastPositive = vals[vals.length - 1]?.delta >= 0;
  return (
    <svg
      width={W}
      height={H}
      className="w-full opacity-60"
      viewBox={`0 0 ${W} ${H}`}
    >
      <line
        x1="0"
        y1={H / 2}
        x2={W}
        y2={H / 2}
        stroke="#2a1e00"
        strokeWidth="1"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={lastPositive ? "#f59e0b" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {vals.map((h, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H / 2 - (h.delta / max) * (H / 2 - 4);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill={h.delta >= 0 ? "#f59e0b" : "#ef4444"}
          />
        );
      })}
    </svg>
  );
}

// ── Shared BetSelector ─────────────────────────────────────────────────────────
function BetSelector({ bet, setBet, options = [10, 25, 50, 100], disabled }) {
  return (
    <div className="flex w-full items-center gap-2">
      <span className="text-[10px] tracking-widest text-yellow-800">BET</span>
      <div className="flex flex-1 gap-1.5">
        {options.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => {
              setBet(b);
              SFX.click();
            }}
            disabled={disabled}
            className={`flex-1 rounded-lg py-1.5 text-sm font-bold transition ${bet === b ? "btn-gold" : "btn-outline"}`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Slot Machine ───────────────────────────────────────────────────────────────
function SlotMachine({ coins, onResult }) {
  const [reels, setReels] = useState(["🍒", "🍒", "🍒"]);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [result, setResult] = useState(null);
  const [reelAnim, setReelAnim] = useState([false, false, false]);
  const [autoSpin, setAutoSpin] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const autoRef = useRef(false);
  const spinRef = useRef(null);

  const doSpin = useCallback(
    (currentBet, currentCoins) => {
      if (currentCoins < currentBet) {
        autoRef.current = false;
        setAutoSpin(false);
        return;
      }
      SFX.spin();
      setResult(null);
      setSpinning(true);
      setReelAnim([true, true, true]);
      const final = [0, 1, 2].map(
        () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      );
      [0, 1, 2].forEach((i) => {
        setTimeout(
          () => {
            setReels((prev) => {
              const r = [...prev];
              r[i] = final[i];
              return r;
            });
            setReelAnim((prev) => {
              const a = [...prev];
              a[i] = false;
              return a;
            });
            if (i === 2) {
              setTimeout(() => {
                const key = final.join("");
                const mult = PAYOUTS[key] ?? 0;
                const net =
                  mult > 0 ? currentBet * mult - currentBet : -currentBet;
                setResult({
                  win: mult > 0,
                  amount: Math.abs(net),
                  mult,
                  isJackpot: key === "💎💎💎",
                });
                onResult(net, key === "💎💎💎" ? "jackpot" : undefined);
                if (net > 0) mult >= 20 ? SFX.bigwin() : SFX.win();
                else SFX.lose();
                setSpinning(false);
                if (autoRef.current) setAutoCount((c) => c + 1);
              }, 200);
            }
          },
          600 + i * 400,
        );
      });
    },
    [onResult],
  );

  // auto-spin trigger
  useEffect(() => {
    if (!autoSpin || spinning) return;
    spinRef.current = setTimeout(() => {
      if (autoRef.current) doSpin(bet, coins);
    }, 600);
    return () => clearTimeout(spinRef.current);
  }, [autoSpin, spinning, bet, coins, doSpin]);

  const spin = () => {
    if (spinning || coins < bet) return;
    autoRef.current = false;
    setAutoSpin(false);
    doSpin(bet, coins);
  };

  const toggleAuto = () => {
    if (autoSpin) {
      autoRef.current = false;
      setAutoSpin(false);
      setAutoCount(0);
    } else {
      autoRef.current = true;
      setAutoSpin(true);
      setAutoCount(0);
      doSpin(bet, coins);
    }
  };

  // keyboard: Space = spin
  useEffect(() => {
    const handler = (e) => {
      if (e.code === "Space" && !e.target.matches("input,textarea,button")) {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spinning, bet, coins]);

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Slot Machine
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Match 3 symbols · Space to spin
        </p>
      </div>
      <div className="relative w-full rounded-2xl border border-[#3d2e00] bg-gradient-to-b from-[#1a1200] to-[#0a0800] p-4 shadow-[inset_0_2px_0_#ffffff08,0_8px_32px_#00000088]">
        <div className="absolute left-4 right-4 top-0 h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent" />
        <div className="flex justify-center gap-3">
          {reels.map((sym, i) => (
            <div
              key={i}
              className={`slot-window w-[72px] rounded-xl border-2 transition-all duration-200
              ${reelAnim[i] ? "border-yellow-400 shadow-[0_0_16px_#f59e0b66] bg-[#1a1200]" : result?.win ? "border-yellow-700 bg-[#0f0c00]" : "border-[#2a1e00] bg-[#0f0c00]"}`}
            >
              <span
                className={`text-4xl select-none ${reelAnim[i] ? "reel-spinning" : ""}`}
              >
                {sym}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-900/40" />
          <span className="text-[9px] tracking-widest text-yellow-900">
            PAYLINE
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-900/40" />
        </div>
      </div>
      {result && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${result.win ? "result-win glow-win" : "result-lose shake"}`}
        >
          {result.win
            ? `🎉 WIN!  +${result.amount} coins  ×${result.mult}`
            : `💸 No match — lost ${result.amount} coins`}
        </div>
      )}
      <BetSelector
        bet={bet}
        setBet={setBet}
        options={[5, 10, 25, 50]}
        disabled={spinning || autoSpin}
      />
      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={spin}
          disabled={spinning || autoSpin || coins < bet}
          className="btn-gold flex-1 py-3 text-base tracking-[0.2em]"
        >
          {spinning ? "⟳  SPINNING..." : "🎰  SPIN"}
        </button>
        <button
          type="button"
          onClick={toggleAuto}
          disabled={coins < bet}
          className={`rounded-xl px-4 py-3 text-sm font-bold transition ${autoSpin ? "bg-red-800 border border-red-600 text-red-200" : "btn-outline"}`}
        >
          {autoSpin ? `⏹ ${autoCount}` : "AUTO"}
        </button>
      </div>
      <details className="w-full">
        <summary className="cursor-pointer text-center text-[10px] tracking-widest text-yellow-800 hover:text-yellow-600 transition">
          PAYOUT TABLE ▾
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {Object.entries(PAYOUTS).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-lg border border-[#2a1e00] bg-[#0f0c00] px-3 py-1.5 text-xs"
            >
              <span className="text-base">{k}</span>
              <span className="font-bold text-yellow-500">×{v}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// ── Coin Flip ──────────────────────────────────────────────────────────────────
function CoinFlip({ coins, onResult }) {
  const [choice, setChoice] = useState(null);
  const [flipping, setFlipping] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [bet, setBet] = useState(10);

  const flip = () => {
    if (!choice || flipping || coins < bet) return;
    SFX.flip();
    setOutcome(null);
    setFlipping(true);
    setTimeout(() => {
      const result = Math.random() < 0.5 ? "heads" : "tails";
      const win = result === choice;
      setOutcome({ result, win });
      onResult(win ? bet : -bet);
      win ? SFX.win() : SFX.lose();
      setFlipping(false);
    }, 1200);
  };

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Coin Flip
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">Double or nothing</p>
      </div>
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute h-36 w-36 rounded-full transition-all duration-500 ${flipping ? "bg-yellow-500/10 blur-xl scale-110" : outcome?.win ? "bg-yellow-500/10 blur-lg" : "bg-transparent"}`}
        />
        <div
          className={`relative flex h-28 w-28 items-center justify-center rounded-full border-4 text-5xl select-none shadow-[0_8px_32px_#00000088]
          ${flipping ? "coin-spinning border-yellow-400 shadow-[0_0_32px_#f59e0b66]" : outcome?.win ? "glow-win border-yellow-400" : outcome ? "border-red-700" : "border-[#3d2e00]"}
          bg-gradient-to-br from-yellow-800 via-yellow-900 to-yellow-950`}
        >
          <span className="drop-shadow-lg">
            {flipping
              ? "🪙"
              : outcome
                ? outcome.result === "heads"
                  ? "👑"
                  : "🦅"
                : "🪙"}
          </span>
        </div>
      </div>
      {outcome && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${outcome.win ? "result-win glow-win" : "result-lose shake"}`}
        >
          {outcome.win
            ? `🎉 Correct! +${bet} coins`
            : `💸 Wrong! -${bet} coins`}
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
      <BetSelector bet={bet} setBet={setBet} disabled={flipping} />
      <button
        type="button"
        onClick={flip}
        disabled={!choice || flipping || coins < bet}
        className="btn-gold w-full py-3 text-base tracking-[0.2em]"
      >
        {flipping ? "⟳  FLIPPING..." : "🪙  FLIP"}
      </button>
    </div>
  );
}

// ── Lucky Number ───────────────────────────────────────────────────────────────
function LuckyNumber({ coins, onResult }) {
  const [pick, setPick] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [bet, setBet] = useState(10);
  const [displayNum, setDisplayNum] = useState(null);
  const intervalRef = useRef(null);

  const roll = () => {
    if (pick === null || rolling || coins < bet) return;
    SFX.spin();
    setOutcome(null);
    setRolling(true);
    let ticks = 0;
    intervalRef.current = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * 10) + 1);
      ticks++;
      if (ticks > 18) {
        clearInterval(intervalRef.current);
        const result = Math.floor(Math.random() * 10) + 1;
        setDisplayNum(result);
        const win = result === pick;
        setOutcome({ result, win });
        onResult(win ? bet * 8 : -bet);
        win ? SFX.bigwin() : SFX.lose();
        setRolling(false);
      }
    }, 80);
  };
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Lucky Number
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Pick 1–10 · Win = ×8 your bet
        </p>
      </div>
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute h-32 w-32 rounded-full blur-2xl transition-all duration-500 ${rolling ? "bg-yellow-500/15 scale-110" : outcome?.win ? "bg-yellow-500/10" : "bg-transparent"}`}
        />
        <div
          className={`relative flex h-28 w-28 items-center justify-center rounded-2xl border-2 text-6xl font-bold select-none shadow-[0_8px_32px_#00000088,inset_0_1px_0_#ffffff08]
          ${rolling ? "border-yellow-500 animate-pulse bg-gradient-to-b from-[#1a1200] to-[#0f0c00]" : outcome?.win ? "glow-win border-yellow-400 bg-gradient-to-b from-[#2a1e00] to-[#1a1200]" : outcome ? "border-red-800 bg-gradient-to-b from-[#1a0000] to-[#0f0000]" : "border-[#2a1e00] bg-gradient-to-b from-[#1a1200] to-[#0f0c00]"}`}
        >
          <span
            className={
              rolling
                ? "text-yellow-400"
                : outcome?.win
                  ? "text-yellow-300"
                  : "text-yellow-600"
            }
          >
            {displayNum ?? "?"}
          </span>
        </div>
      </div>
      {outcome && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${outcome.win ? "result-win glow-win" : "result-lose shake"}`}
        >
          {outcome.win
            ? `🎉 JACKPOT!  +${bet * 8} coins`
            : `💸 It was ${outcome.result} — lost ${bet} coins`}
        </div>
      )}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
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
        options={[10, 25, 50]}
        disabled={rolling}
      />
      <button
        type="button"
        onClick={roll}
        disabled={pick === null || rolling || coins < bet}
        className="btn-gold w-full py-3 text-base tracking-[0.2em]"
      >
        {rolling ? "⟳  ROLLING..." : "🎲  ROLL"}
      </button>
    </div>
  );
}

// ── High Low ───────────────────────────────────────────────────────────────────
const CARD_VALUES = [
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
const CARD_SUITS = ["♠", "♥", "♦", "♣"];
function randomCard() {
  return {
    value: CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)],
    suit: CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)],
  };
}
function cardIndex(c) {
  return CARD_VALUES.indexOf(c.value);
}

function HighLow({ coins, onResult }) {
  const [current, setCurrent] = useState(() => randomCard());
  const [next, setNext] = useState(null);
  const [guessing, setGuessing] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [bet, setBet] = useState(10);
  const [streak, setStreak] = useState(0);

  const guess = (dir) => {
    if (guessing || coins < bet) return;
    SFX.deal();
    setGuessing(true);
    setOutcome(null);
    const nextCard = randomCard();
    setNext(nextCard);
    setTimeout(() => {
      const ci = cardIndex(current),
        ni = cardIndex(nextCard);
      const win = dir === "higher" ? ni > ci : ni < ci;
      const newStreak = win ? streak + 1 : 0;
      setStreak(newStreak);
      const mult = 1 + newStreak * 0.5;
      setOutcome({ win, mult: mult.toFixed(1) });
      onResult(win ? Math.floor(bet * mult) : -bet);
      win ? SFX.win() : SFX.lose();
      setCurrent(nextCard);
      setNext(null);
      setGuessing(false);
    }, 900);
  };

  const isRed = (c) => c.suit === "♥" || c.suit === "♦";

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          High or Low
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Streak bonus: each win adds ×0.5
        </p>
      </div>
      {streak > 0 && (
        <div className="streak-badge">
          🔥 Streak {streak} · Next ×{(1 + streak * 0.5).toFixed(1)}
        </div>
      )}
      <div className="flex items-center gap-5">
        <div
          className={`playing-card flex h-28 w-20 flex-col items-center justify-center text-3xl font-bold select-none ${isRed(current) ? "red" : "black"}`}
        >
          <span className="text-4xl">{current.value}</span>
          <span className="text-xl">{current.suit}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-800" />
          <span className="text-lg text-yellow-700">→</span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-800" />
        </div>
        <div
          className={`playing-card flex h-28 w-20 flex-col items-center justify-center text-3xl font-bold select-none transition-all duration-500 ${next ? (isRed(next) ? "red glow-card" : "black glow-card") : ""}`}
          style={{ visibility: next ? "visible" : "hidden" }}
        >
          {next && (
            <>
              <span className="text-4xl">{next.value}</span>
              <span className="text-xl">{next.suit}</span>
            </>
          )}
        </div>
      </div>
      {outcome && (
        <div
          className={`fadeup w-full rounded-xl px-5 py-3 text-center text-sm font-bold ${outcome.win ? "result-win glow-win" : "result-lose shake"}`}
        >
          {outcome.win
            ? `🎉 ×${outcome.mult} · +${Math.floor(bet * parseFloat(outcome.mult))} coins`
            : `💸 Wrong! -${bet} coins`}
        </div>
      )}
      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={() => guess("higher")}
          disabled={guessing || coins < bet}
          className="btn-gold flex-1 py-3 text-base tracking-wider"
        >
          ⬆ HIGHER
        </button>
        <button
          type="button"
          onClick={() => guess("lower")}
          disabled={guessing || coins < bet}
          className="btn-outline flex-1 py-3 text-base tracking-wider"
        >
          ⬇ LOWER
        </button>
      </div>
      <BetSelector bet={bet} setBet={setBet} disabled={guessing} />
    </div>
  );
}

// ── Crash ──────────────────────────────────────────────────────────────────────
function CrashGame({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [cashedAt, setCashedAt] = useState(null);
  const intervalRef = useRef(null);
  const startRef = useRef(null);
  const crashRef = useRef(null);

  const genCrash = () => Math.max(1.0, 0.95 / (1 - Math.random() * 0.95));

  const startRound = () => {
    if (coins < bet) return;
    SFX.spin();
    crashRef.current = genCrash();
    setCashedAt(null);
    setMultiplier(1.0);
    setPhase("running");
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const cur = Math.pow(Math.E, elapsed * 0.4);
      if (cur >= crashRef.current) {
        clearInterval(intervalRef.current);
        setMultiplier(parseFloat(crashRef.current.toFixed(2)));
        setPhase("crashed");
        onResult(-bet);
        SFX.crash();
      } else {
        setMultiplier(parseFloat(cur.toFixed(2)));
      }
    }, 50);
  };

  const cashOut = () => {
    if (phase !== "running") return;
    clearInterval(intervalRef.current);
    const m = multiplier;
    setCashedAt(m);
    setPhase("cashed");
    const net = Math.floor(bet * m) - bet;
    onResult(net);
    net > bet * 2 ? SFX.bigwin() : SFX.cashout();
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const barPct = Math.min(100, ((multiplier - 1) / 9) * 100);
  const color =
    phase === "crashed"
      ? "#ef4444"
      : multiplier < 2
        ? "#22c55e"
        : multiplier < 5
          ? "#eab308"
          : "#f97316";

  return (
    <div className="fadeup flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Crash
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Cash out before it crashes!
        </p>
      </div>
      <div
        className={`crash-display relative flex h-36 w-full items-center justify-center ${phase === "crashed" ? "border-red-800" : phase === "cashed" ? "border-yellow-600" : "border-[#2a1e00]"}`}
      >
        <div className="crash-grid" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a1200]">
          <div
            className="h-1 transition-all duration-75 rounded-r"
            style={{
              width: `${barPct}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
        <div className="relative text-center">
          <p
            className="text-6xl font-bold tracking-tight transition-all duration-75"
            style={{
              color,
              textShadow: `0 0 30px ${color}88, 0 0 60px ${color}44`,
            }}
          >
            {multiplier.toFixed(2)}×
          </p>
          {phase === "crashed" && (
            <p className="mt-1 text-sm font-bold text-red-400 tracking-widest">
              💥 CRASHED
            </p>
          )}
          {phase === "cashed" && (
            <p className="mt-1 text-sm font-bold text-yellow-300">
              ✅ Cashed at {cashedAt}× · +{Math.floor(bet * cashedAt) - bet}{" "}
              coins
            </p>
          )}
          {phase === "running" && (
            <p className="mt-1 text-[10px] tracking-widest text-yellow-900 animate-pulse">
              LIVE
            </p>
          )}
        </div>
      </div>
      <BetSelector bet={bet} setBet={setBet} disabled={phase === "running"} />
      {phase === "running" ? (
        <button
          type="button"
          onClick={cashOut}
          className="w-full rounded-xl py-3 text-lg font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${color}, #d97706)`,
            boxShadow: `0 0 24px ${color}66`,
          }}
        >
          💰 CASH OUT {multiplier.toFixed(2)}×
        </button>
      ) : (
        <button
          type="button"
          onClick={startRound}
          disabled={coins < bet}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          {phase === "idle" ? "🚀  START" : "🔄  PLAY AGAIN"}
        </button>
      )}
      {phase === "idle" && (
        <p className="text-center text-[10px] text-yellow-900">
          Cash out early for safe wins · Ride it for big multipliers
        </p>
      )}
    </div>
  );
}

// ── Blackjack (with proper deck + Double Down) ─────────────────────────────────
function makeDeck() {
  const suits = ["♠", "♥", "♦", "♣"],
    vals = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];
  for (const s of suits) for (const v of vals) deck.push({ s, v });
  // shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function bjValue(cards) {
  let total = 0,
    aces = 0;
  for (const c of cards) {
    if (c.v === "A") {
      total += 11;
      aces++;
    } else if (["J", "Q", "K"].includes(c.v)) total += 10;
    else total += parseInt(c.v);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function BJCard({ card, hidden }) {
  const isRed = card.s === "♥" || card.s === "♦";
  if (hidden)
    return (
      <div className="playing-card hidden-card flex h-20 w-14 items-center justify-center text-3xl select-none">
        🂠
      </div>
    );
  return (
    <div
      className={`playing-card flex h-20 w-14 flex-col items-center justify-center font-bold select-none ${isRed ? "red" : "black"}`}
    >
      <span className="text-2xl">{card.v}</span>
      <span className="text-base">{card.s}</span>
    </div>
  );
}

function Blackjack({ coins, onResult }) {
  const [phase, setPhase] = useState("bet");
  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState([]);
  const [deckIdx, setDeckIdx] = useState(0);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [doubled, setDoubled] = useState(false);

  const draw = useCallback(
    (d, idx) => ({ card: d[idx % d.length], next: idx + 1 }),
    [],
  );

  const deal = () => {
    if (coins < bet) return;
    SFX.deal();
    const d = makeDeck();
    let idx = 0;
    const r1 = draw(d, idx++),
      r2 = draw(d, idx++),
      r3 = draw(d, idx++),
      r4 = draw(d, idx++);
    const p = [r1.card, r3.card],
      dl = [r2.card, r4.card];
    setDeck(d);
    setDeckIdx(idx);
    setPlayerCards(p);
    setDealerCards(dl);
    setOutcome(null);
    setDoubled(false);
    if (bjValue(p) === 21) {
      setPhase("done");
      setOutcome("blackjack");
      onResult(Math.floor(bet * 1.5));
      SFX.bigwin();
    } else setPhase("playing");
  };

  const hit = () => {
    if (phase !== "playing") return;
    SFX.deal();
    const { card, next } = draw(deck, deckIdx);
    const newCards = [...playerCards, card];
    setPlayerCards(newCards);
    setDeckIdx(next);
    if (bjValue(newCards) > 21) {
      setPhase("done");
      setOutcome("bust");
      onResult(doubled ? -bet * 2 : -bet);
      SFX.lose();
    }
  };

  const stand = () => {
    if (phase !== "playing") return;
    let dc = [...dealerCards],
      idx = deckIdx;
    while (bjValue(dc) < 17) {
      dc.push(deck[idx % deck.length]);
      idx++;
    }
    setDealerCards(dc);
    setDeckIdx(idx);
    const pv = bjValue(playerCards),
      dv = bjValue(dc);
    const effectiveBet = doubled ? bet * 2 : bet;
    let res;
    if (dv > 21 || pv > dv) {
      res = "win";
      onResult(effectiveBet);
      SFX.win();
    } else if (pv === dv) {
      res = "push";
      onResult(0);
    } else {
      res = "lose";
      onResult(-effectiveBet);
      SFX.lose();
    }
    setOutcome(res);
    setPhase("done");
  };

  const doubleDown = () => {
    if (phase !== "playing" || playerCards.length !== 2 || coins < bet * 2)
      return;
    SFX.deal();
    setDoubled(true);
    const { card, next } = draw(deck, deckIdx);
    const newCards = [...playerCards, card];
    setPlayerCards(newCards);
    setDeckIdx(next);
    if (bjValue(newCards) > 21) {
      setPhase("done");
      setOutcome("bust");
      onResult(-bet * 2);
      SFX.lose();
    } else {
      // auto-stand after double
      let dc = [...dealerCards],
        idx = next;
      while (bjValue(dc) < 17) {
        dc.push(deck[idx % deck.length]);
        idx++;
      }
      setDealerCards(dc);
      setDeckIdx(idx);
      const pv = bjValue(newCards),
        dv = bjValue(dc);
      let res;
      if (dv > 21 || pv > dv) {
        res = "win";
        onResult(bet * 2);
        SFX.win();
      } else if (pv === dv) {
        res = "push";
        onResult(0);
      } else {
        res = "lose";
        onResult(-bet * 2);
        SFX.lose();
      }
      setOutcome(res);
      setPhase("done");
    }
  };

  const reset = () => {
    setPhase("bet");
    setPlayerCards([]);
    setDealerCards([]);
    setOutcome(null);
    setDoubled(false);
  };

  const pv = bjValue(playerCards),
    dv = bjValue(dealerCards);
  const outcomeStyle = {
    win: "result-win glow-win",
    blackjack: "result-win glow-win",
    push: "result-push",
    lose: "result-lose shake",
    bust: "result-lose shake",
  };
  const effectiveBet = doubled ? bet * 2 : bet;
  const outcomeMsg = {
    win: `🎉 You win! +${effectiveBet} coins`,
    blackjack: `🃏 BLACKJACK! +${Math.floor(bet * 1.5)} coins`,
    push: "🤝 Push — bet returned",
    lose: `💸 Dealer wins. -${effectiveBet} coins`,
    bust: `💥 Bust! -${effectiveBet} coins`,
  };

  return (
    <div className="fadeup flex flex-col gap-5">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Blackjack
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Dealer stands on 17 · Blackjack pays 1.5× · Double Down available
        </p>
      </div>
      <div className="rounded-2xl border border-[#1a3a1a] bg-gradient-to-b from-[#0a1a0a] to-[#050f05] p-4 shadow-[inset_0_2px_0_#ffffff05]">
        {dealerCards.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[10px] tracking-widest text-green-900 uppercase">
              Dealer {phase === "done" ? `· ${dv}` : "· ??"}
            </p>
            <div className="flex flex-wrap gap-2">
              {dealerCards.map((c, i) => (
                <BJCard
                  key={i}
                  card={c}
                  hidden={phase === "playing" && i === 1}
                />
              ))}
            </div>
          </div>
        )}
        <div className="gold-divider my-3" />
        {playerCards.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] tracking-widest text-green-900 uppercase">
              You · {pv} {doubled ? "· DOUBLED" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {playerCards.map((c, i) => (
                <BJCard key={i} card={c} hidden={false} />
              ))}
            </div>
          </div>
        )}
        {dealerCards.length === 0 && (
          <div className="flex h-24 items-center justify-center">
            <p className="text-[10px] tracking-widest text-green-900">
              PLACE YOUR BET AND DEAL
            </p>
          </div>
        )}
      </div>
      {outcome && (
        <div
          className={`fadeup rounded-xl px-4 py-3 text-center text-sm font-bold ${outcomeStyle[outcome]}`}
        >
          {outcomeMsg[outcome]}
        </div>
      )}
      {phase === "bet" && <BetSelector bet={bet} setBet={setBet} />}
      {phase === "bet" && (
        <button
          type="button"
          onClick={deal}
          disabled={coins < bet}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          🃏 DEAL
        </button>
      )}
      {phase === "playing" && (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={hit}
            className="btn-gold py-3 text-sm tracking-wider"
          >
            👆 HIT
          </button>
          <button
            type="button"
            onClick={stand}
            className="btn-outline py-3 text-sm tracking-wider"
          >
            ✋ STAND
          </button>
          <button
            type="button"
            onClick={doubleDown}
            disabled={playerCards.length !== 2 || coins < bet * 2}
            className="btn-outline py-3 text-sm tracking-wider"
            title="Double Down"
          >
            ✌️ 2×
          </button>
        </div>
      )}
      {phase === "done" && (
        <button
          type="button"
          onClick={reset}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          🔄 NEW HAND
        </button>
      )}
    </div>
  );
}

// ── Roulette ───────────────────────────────────────────────────────────────────
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

function Roulette({ coins, onResult }) {
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
    SFX.roulette();
    setResults(null);
    setWinNum(null);
    setSpinning(true);
    setTimeout(
      () => {
        const num =
          ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
        setWinNum(num);
        setSpinning(false);
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
        net > 0 ? (net > totalBet * 5 ? SFX.bigwin() : SFX.win()) : SFX.lose();
      },
      3500 + Math.random() * 1000,
    );
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
          <span className="mr-1">
            {numColor(results.num) === "red"
              ? "🔴"
              : numColor(results.num) === "black"
                ? "⚫"
                : "🟢"}
          </span>
          <span className="font-mono">{results.num}</span>
          {"  "}
          {results.net > 0
            ? `🎉 +${results.net} coins`
            : results.net === 0
              ? "Push"
              : `💸 ${results.net} coins`}
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
          className="btn-outline px-3 py-2 text-sm"
        >
          ↩
        </button>
        <button
          type="button"
          onClick={clearBets}
          disabled={spinning || totalBet === 0}
          className="btn-outline flex-1 py-2 text-sm"
        >
          ✕ Clear
        </button>
        <button
          type="button"
          onClick={spin}
          disabled={spinning || totalBet === 0 || coins < totalBet}
          className="btn-gold flex-1 py-2 text-base tracking-widest"
        >
          {spinning ? "🎡 Spinning..." : "🎡 SPIN"}
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

// ── Plinko (fixed path + accurate peg tracking) ────────────────────────────────
const PLINKO_ROWS = 8;
const PLINKO_MULTS = [10, 4, 2, 1, 0.5, 1, 2, 4, 10];

function Plinko({ coins, onResult }) {
  const [bet, setBet] = useState(10);
  const [dropping, setDropping] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const W = 280,
    H = 340,
    topPad = 30,
    botPad = 40;
  const usableH = H - topPad - botPad;

  // build peg grid: row r has (r+2) pegs
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

  const drawCanvas = useCallback(
    (ballPos, ballTrail, slot) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      // slots
      const slotW = W / PLINKO_MULTS.length;
      PLINKO_MULTS.forEach((mult, i) => {
        const x = i * slotW,
          isActive = i === slot,
          isHigh = mult >= 4;
        ctx.fillStyle = isActive ? "#fbbf24" : isHigh ? "#92400e" : "#1a1400";
        ctx.strokeStyle = isActive ? "#f59e0b" : "#3d2e00";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 2, H - 28, slotW - 4, 26, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isActive ? "#000" : isHigh ? "#fbbf24" : "#78350f";
        ctx.font = `bold ${mult >= 10 ? 10 : 9}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`${mult}x`, x + slotW / 2, H - 11);
      });
      // pegs
      pegs.forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#d97706";
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      // trail
      if (ballTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ballTrail[0].x, ballTrail[0].y);
        ballTrail.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = "rgba(251,191,36,0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // ball
      if (ballPos) {
        ctx.beginPath();
        ctx.arc(ballPos.x, ballPos.y, 7, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(
          ballPos.x - 2,
          ballPos.y - 2,
          1,
          ballPos.x,
          ballPos.y,
          7,
        );
        g.addColorStop(0, "#fef3c7");
        g.addColorStop(1, "#f59e0b");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    },
    [pegs],
  );

  useEffect(() => {
    drawCanvas(null, [], null);
  }, [drawCanvas]);

  const drop = () => {
    if (dropping || coins < bet) return;
    setActiveSlot(null);
    setLastResult(null);
    setDropping(true);

    // simulate accurate path: track column index within each row
    const dirs = Array.from({ length: PLINKO_ROWS }, () =>
      Math.random() < 0.5 ? -1 : 1,
    );
    // start at center peg of row 0 (row 0 has 2 pegs, start at peg 0)
    let pegCol = 0;
    const waypoints = [{ x: W / 2, y: 10 }];
    for (let r = 0; r < PLINKO_ROWS; r++) {
      const count = r + 2;
      const spacing = W / (count + 1);
      const px = spacing * (pegCol + 1);
      const py = topPad + (usableH / PLINKO_ROWS) * (r + 0.5);
      waypoints.push({ x: px, y: py });
      SFX.plinko();
      // move to next row: right = pegCol+1, left = pegCol (triangle grid)
      if (dirs[r] === 1) pegCol = Math.min(pegCol + 1, r + 1);
      // left: pegCol stays same (maps to left neighbor in next row)
    }
    // final slot: pegCol after 8 rows = slot index (0..8)
    const slotIdx = Math.min(pegCol, PLINKO_MULTS.length - 1);
    const slotW = W / PLINKO_MULTS.length;
    waypoints.push({ x: slotIdx * slotW + slotW / 2, y: H - 28 });

    let wpIdx = 0,
      progress = 0;
    const trail = [];
    const animate = () => {
      if (wpIdx >= waypoints.length - 1) {
        setActiveSlot(slotIdx);
        const mult = PLINKO_MULTS[slotIdx];
        const net = Math.floor(bet * mult) - bet;
        setLastResult({ mult, net });
        onResult(net);
        net >= 0 ? (mult >= 4 ? SFX.bigwin() : SFX.win()) : SFX.lose();
        setDropping(false);
        drawCanvas(null, [], slotIdx);
        return;
      }
      progress += 0.045 + wpIdx * 0.003;
      if (progress >= 1) {
        progress = 0;
        wpIdx++;
      }
      const from = waypoints[wpIdx],
        to = waypoints[Math.min(wpIdx + 1, waypoints.length - 1)];
      const x = from.x + (to.x - from.x) * progress;
      const y = from.y + (to.y - from.y) * progress;
      trail.push({ x, y });
      if (trail.length > 20) trail.shift();
      drawCanvas({ x, y }, [...trail], null);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
    <div className="fadeup flex flex-col items-center gap-3">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-yellow-700 uppercase">
          Plinko
        </p>
        <p className="mt-0.5 text-[10px] text-yellow-900">
          Drop the ball — land on high multipliers!
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
          {lastResult.net >= 0
            ? `🎉 +${lastResult.net}`
            : `💸 ${lastResult.net}`}{" "}
          coins
        </div>
      )}
      <BetSelector
        bet={bet}
        setBet={setBet}
        options={[5, 10, 25, 50]}
        disabled={dropping}
      />
      <button
        type="button"
        onClick={drop}
        disabled={dropping || coins < bet}
        className="btn-gold w-full py-3 text-base tracking-[0.2em]"
      >
        {dropping ? "🎯  Dropping..." : "🎯  DROP BALL"}
      </button>
    </div>
  );
}

// ── Card War ───────────────────────────────────────────────────────────────────
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

function CardWar({ coins, onResult }) {
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
      onResult(bet);
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
      onResult(newPot - bet * 2);
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
    win: `🎉 You win! +${bet} coins`,
    lose: `💸 Dealer wins. -${bet} coins`,
    "war-win": `⚔️ WAR WON! +${pot - bet * 2} coins`,
    "war-lose": `💀 War lost. -${bet * 2} coins`,
    surrender: `🏳️ Surrendered. -${Math.floor(bet / 2)} coins`,
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
          {phase === "war" ? "⚔️" : "VS"}
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
          <p className="mb-2 text-sm font-bold text-yellow-400">
            ⚔️ TIE! Go to WAR?
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
              ⚔️ WAR!
            </button>
            <button
              type="button"
              onClick={surrender}
              className="btn-outline flex-1 py-2 text-sm"
            >
              🏳️ Surrender (-{Math.floor(bet / 2)})
            </button>
          </div>
        </div>
      )}
      {phase === "idle" && <BetSelector bet={bet} setBet={setBet} />}
      {phase === "idle" && (
        <button
          type="button"
          onClick={deal}
          disabled={coins < bet}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          🃏 DEAL
        </button>
      )}
      {phase === "done" && (
        <button
          type="button"
          onClick={reset}
          className="btn-gold w-full py-3 text-base tracking-[0.2em]"
        >
          🔄 PLAY AGAIN
        </button>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
const GAMES = [
  { id: "slot", label: "🎰 Slots", emoji: "🎰" },
  { id: "coin", label: "🪙 Coin Flip", emoji: "🪙" },
  { id: "lucky", label: "🎲 Lucky No.", emoji: "🎲" },
  { id: "highlow", label: "🃏 High/Low", emoji: "🃏" },
  { id: "crash", label: "🚀 Crash", emoji: "🚀" },
  { id: "bj", label: "🂡 Blackjack", emoji: "🂡" },
  { id: "roulette", label: "🎡 Roulette", emoji: "🎡" },
  { id: "plinko", label: "🎯 Plinko", emoji: "🎯" },
  { id: "war", label: "⚔️ War", emoji: "⚔️" },
];

export default function App() {
  const saved = loadState();
  const [coins, setCoins] = useState(saved?.coins ?? STARTING_COINS);
  const [highScore, setHighScore] = useState(
    saved?.highScore ?? STARTING_COINS,
  );
  const [activeGame, setActiveGame] = useState("slot");
  const [prevGame, setPrevGame] = useState(null);
  const [history, setHistory] = useState(saved?.history ?? []);
  const [toast, setToast] = useState(null);
  const [bigWin, setBigWin] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showSession, setShowSession] = useState(null);
  const [muted, setMutedState] = useState(_muted);
  const [achievements, setAchievements] = useState(saved?.achievements ?? []);
  const [pendingAchieve, setPendingAchieve] = useState(null);
  const [leaderboard, setLeaderboard] = useState(saved?.leaderboard ?? []);
  const [dailyStreak, setDailyStreak] = useState(saved?.dailyStreak ?? 0);
  const [stats, setStats] = useState(
    saved?.stats ?? {
      played: 0,
      wins: 0,
      losses: 0,
      biggestWin: 0,
      biggestLoss: 0,
      totalWon: 0,
      bestStreak: 0,
      currentStreak: 0,
    },
  );
  const sessionRef = useRef({
    startCoins: saved?.coins ?? STARTING_COINS,
    played: 0,
    wins: 0,
    bestWin: 0,
  });
  const toastRef = useRef(null);
  const achieveQueue = useRef([]);

  // daily bonus check
  useEffect(() => {
    const last = localStorage.getItem(DAILY_KEY);
    if (last !== new Date().toDateString()) setShowDaily(true);
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        coins,
        highScore,
        history: history.slice(0, 20),
        stats,
        achievements,
        leaderboard,
        dailyStreak,
      }),
    );
  }, [
    coins,
    highScore,
    history,
    stats,
    achievements,
    leaderboard,
    dailyStreak,
  ]);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.matches("input,textarea,button,select")) return;
      if (e.key === "m" || e.key === "M") {
        const n = !_muted;
        setMuted(n);
        setMutedState(n);
      }
      if (e.key === "s" || e.key === "S") setShowStats((v) => !v);
      const idx = parseInt(e.key) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < GAMES.length) {
        setActiveGame(GAMES[idx].id);
        SFX.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // achievement queue
  useEffect(() => {
    if (pendingAchieve) return;
    if (achieveQueue.current.length > 0) {
      setPendingAchieve(achieveQueue.current.shift());
      SFX.achieve();
    }
  }, [pendingAchieve]);

  const showToast = useCallback((msg, win) => {
    clearTimeout(toastRef.current);
    setToast({ msg, win });
    toastRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const handleResult = useCallback(
    (delta, eventType) => {
      let newCoins = 0;
      setCoins((c) => {
        newCoins = Math.max(0, c + delta);
        setHighScore((h) => Math.max(h, newCoins));
        return newCoins;
      });
      setHistory((h) => [
        { delta, game: activeGame, time: Date.now() },
        ...h.slice(0, 19),
      ]);

      let newStats;
      setStats((s) => {
        const streak = delta > 0 ? s.currentStreak + 1 : 0;
        newStats = {
          played: s.played + 1,
          wins: delta > 0 ? s.wins + 1 : s.wins,
          losses: delta < 0 ? s.losses + 1 : s.losses,
          biggestWin: delta > 0 ? Math.max(s.biggestWin, delta) : s.biggestWin,
          biggestLoss:
            delta < 0 ? Math.min(s.biggestLoss, delta) : s.biggestLoss,
          totalWon: delta > 0 ? s.totalWon + delta : s.totalWon,
          bestStreak: Math.max(s.bestStreak, streak),
          currentStreak: streak,
        };
        return newStats;
      });

      sessionRef.current.played++;
      if (delta > 0) {
        sessionRef.current.wins++;
        sessionRef.current.bestWin = Math.max(
          sessionRef.current.bestWin,
          delta,
        );
      }

      showToast(delta > 0 ? `+${delta} coins` : `${delta} coins`, delta > 0);
      if (delta >= BIG_WIN_THRESHOLD) setBigWin(delta);

      // achievements
      if (newStats) {
        const event = {
          type: eventType ?? (delta > 0 ? "win" : "lose"),
          data: { prevCoins: newCoins - delta },
          stats: newStats,
          coins: newCoins,
        };
        setAchievements((cur) => {
          const newOnes = checkAchievements(cur, event);
          if (newOnes.length) {
            newOnes.forEach((id) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id);
              if (a) achieveQueue.current.push(a);
            });
            return [...cur, ...newOnes];
          }
          return cur;
        });
      }

      // session summary on bust
      if (newCoins === 0) {
        setTimeout(
          () =>
            setShowSession({
              startCoins: sessionRef.current.startCoins,
              endCoins: 0,
              played: sessionRef.current.played,
              wins: sessionRef.current.wins,
              bestWin: sessionRef.current.bestWin,
            }),
          800,
        );
      }
    },
    [activeGame, showToast],
  );

  const claimDaily = () => {
    const streak = Math.min(dailyStreak + 1, 7);
    const bonus = DAILY_STREAK_BONUSES[streak - 1];
    localStorage.setItem(DAILY_KEY, new Date().toDateString());
    setShowDaily(false);
    setDailyStreak(streak);
    setCoins((c) => c + bonus);
    setHighScore((h) => Math.max(h, coins + bonus));
    SFX.bonus();
    showToast(`+${bonus} daily bonus!`, true);
    if (streak >= 7) {
      setAchievements((cur) => {
        const n = checkAchievements(cur, {
          type: "daily",
          data: { streak },
          stats,
          coins,
        });
        if (n.length) {
          n.forEach((id) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id);
            if (a) achieveQueue.current.push(a);
          });
          return [...cur, ...n];
        }
        return cur;
      });
    }
  };

  const resetCoins = () => {
    setLeaderboard((lb) =>
      [...lb, { coins: highScore, date: Date.now() }]
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 5),
    );
    sessionRef.current = {
      startCoins: STARTING_COINS,
      played: 0,
      wins: 0,
      bestWin: 0,
    };
    setCoins(STARTING_COINS);
    setHistory([]);
    showToast("Reloaded 500 coins", true);
  };

  const switchGame = (id) => {
    setPrevGame(activeGame);
    setActiveGame(id);
    SFX.click();
    setTimeout(() => setPrevGame(null), 350);
  };
  const toggleMute = () => {
    const n = !_muted;
    setMuted(n);
    setMutedState(n);
  };

  return (
    <div className="casino-bg relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-yellow-600/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-yellow-800/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-yellow-800/5 blur-3xl" />
      </div>

      {showDaily && (
        <DailyBonusModal
          streak={dailyStreak + 1}
          bonus={DAILY_STREAK_BONUSES[Math.min(dailyStreak, 6)]}
          onClaim={claimDaily}
        />
      )}
      {showStats && (
        <StatsModal
          stats={stats}
          achievements={achievements}
          leaderboard={leaderboard}
          onClose={() => setShowStats(false)}
        />
      )}
      {showSession && (
        <SessionSummary
          session={showSession}
          onClose={() => {
            setShowSession(null);
            resetCoins();
          }}
        />
      )}
      {bigWin && (
        <BigWinOverlay amount={bigWin} onDone={() => setBigWin(null)} />
      )}
      {pendingAchieve && (
        <AchievementToast
          achievement={pendingAchieve}
          onDone={() => setPendingAchieve(null)}
        />
      )}

      {toast && (
        <div
          className={`toast fadeup fixed left-1/2 top-4 z-50 -translate-x-1/2 ${toast.win ? "toast-win" : "toast-lose"}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="casino-layout relative">
        {/* header */}
        <div className="mb-5 text-center sm:mb-7">
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-800/60" />
            <span className="text-yellow-800 text-xs">✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-800/60" />
          </div>
          <h1
            className="neon-gold font-bold tracking-[0.2em] sm:tracking-[0.25em]"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(1.6rem, 7vw, 2.4rem)",
            }}
          >
            CASINO MINI
          </h1>
          <p
            className="mt-1 text-yellow-800"
            style={{ fontSize: "clamp(8px,2vw,10px)", letterSpacing: "0.35em" }}
          >
            PLAY · WIN · REPEAT
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-800/60" />
            <span className="text-yellow-800 text-xs">✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-800/60" />
          </div>
        </div>

        {/* balance bar */}
        <div className="balance-bar mb-4 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex-1">
            <p
              style={{
                fontSize: "clamp(8px,2vw,10px)",
                letterSpacing: "0.25em",
              }}
              className="text-yellow-800 uppercase"
            >
              Balance
            </p>
            <p
              className="mt-0.5 font-bold text-yellow-400"
              style={{
                fontSize: "clamp(1.2rem,5vw,1.6rem)",
                textShadow: "0 0 12px #f59e0b44",
              }}
            >
              🪙 {coins.toLocaleString()}
            </p>
          </div>
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-yellow-900 to-transparent" />
          <div className="text-right flex-1">
            <p
              style={{
                fontSize: "clamp(8px,2vw,10px)",
                letterSpacing: "0.25em",
              }}
              className="text-yellow-800 uppercase"
            >
              Best
            </p>
            <p
              className="mt-0.5 font-bold text-yellow-700"
              style={{ fontSize: "clamp(1rem,4vw,1.2rem)" }}
            >
              🏆 {highScore.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setShowStats(true)}
              className="btn-outline px-2 py-1 text-xs"
              title="Stats (S)"
            >
              📊
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="btn-outline px-2 py-1 text-xs"
              title="Mute (M)"
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>

        {/* achievements strip */}
        {achievements.length > 0 && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {achievements.slice(-8).map((id) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id);
              return a ? (
                <span
                  key={id}
                  title={a.label}
                  className="shrink-0 rounded-full border border-yellow-900/60 bg-yellow-950/40 px-2 py-0.5 text-base cursor-default"
                >
                  {a.icon}
                </span>
              ) : null;
            })}
            <span className="shrink-0 text-[10px] text-yellow-900 self-center ml-1">
              {achievements.length}/{ACHIEVEMENTS.length}
            </span>
          </div>
        )}

        {/* game tabs */}
        <div className="mb-3 grid grid-cols-3 gap-1 sm:gap-1.5">
          {GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => switchGame(g.id)}
              className={`game-tab ${activeGame === g.id ? "active" : ""}`}
            >
              <span style={{ fontSize: "clamp(14px,4vw,18px)" }}>
                {g.emoji}
              </span>
              <span>{g.label.split(" ").slice(1).join(" ")}</span>
            </button>
          ))}
        </div>

        {/* game panel */}
        <div
          className={`card-glass rounded-2xl shadow-[0_0_40px_#f59e0b08] ${prevGame ? "fadeup" : ""}`}
          style={{ padding: "clamp(14px,4vw,24px)" }}
        >
          <div className="mb-4 h-px bg-gradient-to-r from-transparent via-yellow-900/60 to-transparent" />
          {activeGame === "slot" && (
            <SlotMachine coins={coins} onResult={handleResult} />
          )}
          {activeGame === "coin" && (
            <CoinFlip coins={coins} onResult={handleResult} />
          )}
          {activeGame === "lucky" && (
            <LuckyNumber coins={coins} onResult={handleResult} />
          )}
          {activeGame === "highlow" && (
            <HighLow coins={coins} onResult={handleResult} />
          )}
          {activeGame === "crash" && (
            <CrashGame coins={coins} onResult={handleResult} />
          )}
          {activeGame === "bj" && (
            <Blackjack coins={coins} onResult={handleResult} />
          )}
          {activeGame === "roulette" && (
            <Roulette coins={coins} onResult={handleResult} />
          )}
          {activeGame === "plinko" && (
            <Plinko coins={coins} onResult={handleResult} />
          )}
          {activeGame === "war" && (
            <CardWar coins={coins} onResult={handleResult} />
          )}
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-yellow-900/40 to-transparent" />
        </div>

        {/* history + mini chart */}
        {history.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <p
                className="text-yellow-900 uppercase"
                style={{
                  fontSize: "clamp(8px,2vw,10px)",
                  letterSpacing: "0.3em",
                }}
              >
                Recent
              </p>
              <p className="text-[10px] text-yellow-900">
                {stats.wins}W / {stats.losses}L
              </p>
            </div>
            <MiniChart history={history} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {history.slice(0, 12).map((h, i) => (
                <span
                  key={i}
                  title={h.game}
                  className={`rounded-full px-2 py-0.5 font-bold border ${h.delta > 0 ? "border-yellow-900/60 bg-yellow-950/60 text-yellow-600" : "border-red-900/40 bg-red-950/40 text-red-700"}`}
                  style={{ fontSize: "clamp(10px,2.5vw,12px)" }}
                >
                  {h.delta > 0 ? "+" : ""}
                  {h.delta}
                </span>
              ))}
            </div>
          </div>
        )}

        {coins > 0 && coins < 10 && (
          <button
            type="button"
            onClick={resetCoins}
            className="btn-outline mt-4 w-full py-2 text-sm"
          >
            🔄 Reload 500 coins
          </button>
        )}

        {/* keyboard hints */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[
            ["Space", "Spin"],
            ["M", "Mute"],
            ["S", "Stats"],
            ["1-9", "Switch Game"],
          ].map(([k, v]) => (
            <span
              key={k}
              className="rounded border border-[#1a1200] bg-[#0a0800] px-2 py-0.5 text-[9px] text-yellow-900"
            >
              <kbd className="text-yellow-700">{k}</kbd> {v}
            </span>
          ))}
        </div>

        <p
          className="mt-4 text-center text-yellow-950"
          style={{ fontSize: "clamp(8px,2vw,10px)", letterSpacing: "0.2em" }}
        >
          FOR ENTERTAINMENT ONLY · NO REAL MONEY
        </p>
      </div>
    </div>
  );
}
