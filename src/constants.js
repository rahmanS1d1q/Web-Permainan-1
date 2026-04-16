// ── Game constants ─────────────────────────────────────────────────────────────
// Slot symbols & payouts moved to src/slotSymbols.jsx (SVG-based)
export const SYMBOLS = [
  "cherry",
  "lemon",
  "bell",
  "grapes",
  "star",
  "bar",
  "diamond",
];
export const PAYOUTS = {
  "diamond-diamond-diamond": 40,
  "bar-bar-bar": 25,
  "star-star-star": 15,
  "grapes-grapes-grapes": 10,
  "bell-bell-bell": 7,
  "lemon-lemon-lemon": 5,
  "cherry-cherry-cherry": 3,
};
export const STARTING_COINS = 500;
export const STORAGE_KEY = "casino-mini-state";
export const DAILY_KEY = "casino-daily-bonus";
export const MUTE_KEY = "casino-muted";
export const WEEKLY_KEY = "casino-weekly";
export const TUTORIAL_KEY = "casino-tutorial-done";
export const JUDOL_WARNING_KEY = "casino-judol-warning-shown";
export const BIG_WIN_THRESHOLD = 100;
export const DAILY_STREAK_BONUSES = [200, 250, 300, 400, 500, 600, 1000];

// ── XP / Level ─────────────────────────────────────────────────────────────────
export const XP_PER_WIN = 10;
export const XP_PER_GAME = 2;
export const MAX_LEVEL = 20;
export const LEVEL_XP = (lvl) => Math.floor(100 * Math.pow(1.4, lvl - 1));
export const LEVEL_REWARDS = {
  2: 100,
  3: 150,
  5: 300,
  7: 500,
  10: 1000,
  15: 2000,
  20: 5000,
};

export function calcLevel(xp) {
  let lvl = 1,
    remaining = xp;
  while (lvl < MAX_LEVEL) {
    const needed = LEVEL_XP(lvl);
    if (remaining < needed) break;
    remaining -= needed;
    lvl++;
  }
  return { level: lvl, xpInLevel: remaining, xpNeeded: LEVEL_XP(lvl) };
}

// ── VIP Tiers ──────────────────────────────────────────────────────────────────
export const VIP_TIERS = [
  { name: "Bronze", minLevel: 1, color: "#cd7f32", glow: "#cd7f3244" },
  { name: "Silver", minLevel: 5, color: "#9ca3af", glow: "#9ca3af44" },
  { name: "Gold", minLevel: 10, color: "#f59e0b", glow: "#f59e0b66" },
  { name: "Platinum", minLevel: 15, color: "#e2e8f0", glow: "#e2e8f088" },
  { name: "Diamond", minLevel: 20, color: "#67e8f9", glow: "#67e8f988" },
];
export function getVipTier(level) {
  return (
    [...VIP_TIERS].reverse().find((t) => level >= t.minLevel) ?? VIP_TIERS[0]
  );
}

// ── Weekly challenges ──────────────────────────────────────────────────────────
export const WEEKLY_CHALLENGES = [
  { id: "w1", desc: "Win 10 games", target: 10, type: "wins", reward: 300 },
  { id: "w2", desc: "Play 20 games", target: 20, type: "played", reward: 200 },
  {
    id: "w3",
    desc: "Win 500 coins total",
    target: 500,
    type: "earned",
    reward: 400,
  },
  { id: "w4", desc: "Win 5 in a row", target: 5, type: "streak", reward: 500 },
  {
    id: "w5",
    desc: "Play Blackjack 5 times",
    target: 5,
    type: "bj",
    reward: 250,
  },
  {
    id: "w6",
    desc: "Cash out Crash at 3×+",
    target: 3,
    type: "crash3x",
    reward: 350,
  },
];
export function getWeeklyChallenge() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length];
}
export function loadWeekly() {
  try {
    const s = localStorage.getItem(WEEKLY_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

// ── Achievements ───────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: "first_win", label: "First Blood", desc: "Win your first game" },
  { id: "jackpot", label: "Jackpot!", desc: "Hit Diamond×3 on slots" },
  {
    id: "lucky7",
    label: "Lucky Seven",
    desc: "Win Dice with 7 (not applicable)",
  },
  {
    id: "crash_5x",
    label: "Daredevil",
    desc: "Cash out at 5× or higher in Crash",
  },
  { id: "crash_10x", label: "Rocketeer", desc: "Cash out at 10× or higher" },
  { id: "bj_natural", label: "Natural", desc: "Get a natural Blackjack" },
  {
    id: "bj_double",
    label: "Double Down",
    desc: "Win a doubled Blackjack hand",
  },
  { id: "streak_5", label: "On Fire", desc: "Win 5 in a row" },
  { id: "streak_10", label: "Unstoppable", desc: "Win 10 in a row" },
  { id: "war_won", label: "Warlord", desc: "Win a Card War battle" },
  {
    id: "roulette_35",
    label: "Straight Up",
    desc: "Win a straight-up roulette bet",
  },
  { id: "plinko_10x", label: "Plinko King", desc: "Land on 10× in Plinko" },
  { id: "millionaire", label: "High Roller", desc: "Reach 2000 coins" },
  {
    id: "comeback",
    label: "Comeback Kid",
    desc: "Win after having < 50 coins",
  },
  {
    id: "daily_7",
    label: "Loyal Player",
    desc: "Claim daily bonus 7 days in a row",
  },
  {
    id: "vip_gold",
    label: "Gold Member",
    desc: "Reach Gold VIP tier (Level 10)",
  },
  {
    id: "vip_diamond",
    label: "Diamond",
    desc: "Reach Diamond VIP tier (Level 20)",
  },
  {
    id: "prestige_1",
    label: "Prestige I",
    desc: "Reach max level and prestige",
  },
  {
    id: "mission_master",
    label: "Mission Master",
    desc: "Complete 10 daily missions",
  },
  { id: "poker_win", label: "Poker Pro", desc: "Win a hand of Texas Hold'em" },
  {
    id: "wheel_jackpot",
    label: "Wheel Jackpot",
    desc: "Land on the jackpot in Wheel of Fortune",
  },
];

export function checkAchievements(current, event) {
  const unlocked = [];
  const { type, data, stats, coins, level } = event;
  if (type === "win" && stats.wins === 1) unlocked.push("first_win");
  if (type === "jackpot") unlocked.push("jackpot");
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
  if (level >= 10) unlocked.push("vip_gold");
  if (level >= 20) unlocked.push("vip_diamond");
  if (type === "prestige") unlocked.push("prestige_1");
  if (type === "mission_complete" && data?.total >= 10)
    unlocked.push("mission_master");
  if (type === "poker_win") unlocked.push("poker_win");
  if (type === "wheel_jackpot") unlocked.push("wheel_jackpot");
  return unlocked.filter((id) => !current.includes(id));
}

// ── Tutorial steps ─────────────────────────────────────────────────────────────
export const TUTORIAL_STEPS = [
  {
    game: null,
    title: "Welcome to Casino Mini!",
    body: "You start with 500 coins. Play 12 casino games, earn XP, level up, and unlock achievements. Coins never run out — reload anytime for free.",
  },
  {
    game: "slot",
    title: "Slot Machine",
    body: "Pick a bet, hit SPIN. Match 3 symbols on the payline to win. Use AUTO to spin continuously. Press Space to spin quickly.",
  },
  {
    game: "coin",
    title: "Coin Flip",
    body: "Pick Heads or Tails, then flip. Win = double your bet. The 3D coin shows both sides as it spins.",
  },
  {
    game: "lucky",
    title: "Dice",
    body: "Pick a number 1–6, then roll. The 3D dice tumbles and lands on a face. Match your pick to win ×5 your bet.",
  },
  {
    game: "highlow",
    title: "High or Low",
    body: "Guess if the next card is higher or lower. Build a streak for bonus multipliers — each win adds ×0.5.",
  },
  {
    game: "crash",
    title: "Crash",
    body: "The multiplier rises exponentially. Cash out before it crashes! The longer you wait, the bigger the reward.",
  },
  {
    game: "bj",
    title: "Blackjack",
    body: "Get closer to 21 than the dealer without going over. Hit, Stand, or Double Down.",
  },
  {
    game: "roulette",
    title: "Roulette",
    body: "Place chips on numbers, colors, or groups. Straight-up number pays 35:1.",
  },
  {
    game: "plinko",
    title: "Plinko",
    body: "Drop the ball — real physics, fully neutral. Land on high multipliers at the edges.",
  },
  {
    game: "baccarat",
    title: "Baccarat",
    body: "Bet on Player, Banker, or Tie. Closest to 9 wins. Banker pays 0.95×, Tie pays 8×.",
  },
];

// ── Daily Missions ─────────────────────────────────────────────────────────────
export const DAILY_MISSIONS_POOL = [
  { id: "dm_win3", desc: "Win 3 games", type: "wins", target: 3, reward: 50 },
  { id: "dm_win5", desc: "Win 5 games", type: "wins", target: 5, reward: 100 },
  {
    id: "dm_play10",
    desc: "Play 10 games",
    type: "played",
    target: 10,
    reward: 80,
  },
  {
    id: "dm_play5",
    desc: "Play 5 games",
    type: "played",
    target: 5,
    reward: 40,
  },
  {
    id: "dm_earn200",
    desc: "Earn 200 coins",
    type: "earned",
    reward: 120,
    target: 200,
  },
  {
    id: "dm_earn500",
    desc: "Earn 500 coins",
    type: "earned",
    reward: 250,
    target: 500,
  },
  {
    id: "dm_streak3",
    desc: "Win 3 in a row",
    type: "streak",
    target: 3,
    reward: 150,
  },
  {
    id: "dm_bj",
    desc: "Play Blackjack 3 times",
    type: "game_bj",
    target: 3,
    reward: 80,
  },
  {
    id: "dm_roulette",
    desc: "Spin Roulette 2 times",
    type: "game_roulette",
    target: 2,
    reward: 60,
  },
  {
    id: "dm_crash",
    desc: "Cash out Crash 2 times",
    type: "cashout_crash",
    target: 2,
    reward: 100,
  },
  {
    id: "dm_slots",
    desc: "Spin Slots 5 times",
    type: "game_slot",
    target: 5,
    reward: 60,
  },
  {
    id: "dm_poker",
    desc: "Play Poker 2 times",
    type: "game_poker",
    target: 2,
    reward: 80,
  },
];
export const DAILY_MISSIONS_KEY = "casino-daily-missions";
export function getDailyMissions() {
  const today = new Date().toDateString();
  try {
    const s = localStorage.getItem(DAILY_MISSIONS_KEY);
    if (s) {
      const d = JSON.parse(s);
      if (d.date === today) return d;
    }
  } catch {}
  // pick 3 random missions for today
  const seed = new Date()
    .toDateString()
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...DAILY_MISSIONS_POOL].sort((a, b) => {
    const ha = Math.sin(seed + a.id.length) * 10000;
    const hb = Math.sin(seed + b.id.length) * 10000;
    return ha - Math.floor(ha) - (hb - Math.floor(hb));
  });
  const missions = shuffled
    .slice(0, 3)
    .map((m) => ({ ...m, progress: 0, claimed: false }));
  const data = { date: today, missions };
  localStorage.setItem(DAILY_MISSIONS_KEY, JSON.stringify(data));
  return data;
}
export function saveDailyMissions(data) {
  localStorage.setItem(DAILY_MISSIONS_KEY, JSON.stringify(data));
}

// ── Prestige System ────────────────────────────────────────────────────────────
export const PRESTIGE_KEY = "casino-prestige";
export const PRESTIGE_BONUSES = [
  {
    level: 1,
    label: "Prestige I",
    bonus: "+5% XP",
    xpMult: 1.05,
    startCoins: 600,
  },
  {
    level: 2,
    label: "Prestige II",
    bonus: "+10% XP, +100 start",
    xpMult: 1.1,
    startCoins: 700,
  },
  {
    level: 3,
    label: "Prestige III",
    bonus: "+15% XP, +200 start",
    xpMult: 1.15,
    startCoins: 800,
  },
  {
    level: 4,
    label: "Prestige IV",
    bonus: "+20% XP, +300 start",
    xpMult: 1.2,
    startCoins: 900,
  },
  {
    level: 5,
    label: "Prestige V",
    bonus: "+25% XP, +500 start",
    xpMult: 1.25,
    startCoins: 1000,
  },
];
export function getPrestige() {
  try {
    const s = localStorage.getItem(PRESTIGE_KEY);
    return s ? JSON.parse(s) : { level: 0, totalPrestiges: 0 };
  } catch {
    return { level: 0, totalPrestiges: 0 };
  }
}
export function savePrestige(data) {
  localStorage.setItem(PRESTIGE_KEY, JSON.stringify(data));
}

// ── Haptic ─────────────────────────────────────────────────────────────────────
export function haptic(type = "light") {
  if (!navigator.vibrate) return;
  const patterns = {
    light: [20],
    medium: [40],
    heavy: [60, 30, 60],
    win: [30, 20, 30, 20, 60],
    lose: [80],
  };
  navigator.vibrate(patterns[type] ?? patterns.light);
}

// ── Persistence ────────────────────────────────────────────────────────────────
export function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

// ── Games list ─────────────────────────────────────────────────────────────────
export const GAMES = [
  { id: "slot", label: "Slots" },
  { id: "coin", label: "Coin Flip" },
  { id: "lucky", label: "Dice" },
  { id: "highlow", label: "High/Low" },
  { id: "crash", label: "Crash" },
  { id: "bj", label: "Blackjack" },
  { id: "roulette", label: "Roulette" },
  { id: "plinko", label: "Plinko" },
  { id: "war", label: "War" },
  { id: "baccarat", label: "Baccarat" },
  { id: "keno", label: "Keno" },
  { id: "scratch", label: "Scratch" },
  { id: "poker", label: "Poker" },
  { id: "wheel", label: "Wheel" },
  { id: "dragon", label: "Dragon" },
  { id: "videopoker", label: "Video Poker" },
];
