# 🎰 Casino Mini

A fully-featured browser casino game built with React + Vite + Tailwind CSS. Play 12 different casino games, earn XP, level up, unlock achievements, and climb the leaderboard — all for free, no real money involved.

---

## 🎮 Games

| Game         | Description                                               | House Edge |
| ------------ | --------------------------------------------------------- | ---------- |
| 🎰 Slots     | Match 3 symbols on the payline. Weighted reels, auto-spin | ~15%       |
| 🪙 Coin Flip | Heads or Tails. Win pays 0.95×                            | ~5%        |
| 🎲 Dice      | Pick 1–6, roll the 3D cube. Near miss refunds 30%         | ~25%       |
| 🃏 High/Low  | Guess higher or lower. Streak bonus +0.3× per win         | ~10%       |
| 🚀 Crash     | Cash out before the multiplier crashes                    | ~15%       |
| 🂡 Blackjack  | Hit, Stand, Double Down. Blackjack pays 1.2×              | ~3%        |
| 🎡 Roulette  | European roulette, full betting table                     | ~2.7%      |
| 🎯 Plinko    | Real physics ball drop, neutral result                    | ~12%       |
| ⚔️ War       | Higher card wins. Tie goes to war                         | ~8%        |
| 🃏 Baccarat  | Player 0.95×, Banker 0.92×, Tie ×7                        | ~6%        |
| 🔢 Keno      | Pick up to 5 numbers from 40, 10 drawn                    | ~25%       |
| 🎴 Scratch   | 3×3 grid, match 3 in a line                               | ~20%       |

---

## ✨ Features

- **XP & Level System** — earn XP every game, level up through 20 levels
- **VIP Tiers** — Bronze → Silver → Gold → Platinum → Diamond
- **17 Achievements** — unlock badges for milestones and special plays
- **Daily Bonus** — 7-day streak with increasing rewards (200–1000 coins)
- **Weekly Challenges** — rotating objectives with coin rewards
- **Stats Modal** — overall stats, achievements, leaderboard, per-game history
- **Top Sessions Leaderboard** — top 5 best sessions saved locally
- **PWA Support** — installable on mobile homescreen
- **Swipe Gestures** — swipe left/right to switch games on mobile
- **Sound Effects** — Web Audio API, no external files required
- **Mute Button** — toggle sound on/off
- **Auto-spin** — continuous spinning for Slot Machine
- **3D Animations** — coin flip, dice roll, roulette wheel
- **Error Boundary** — each game isolated, crashes don't break the app
- **Responsive** — works on mobile, tablet, and desktop

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🏗️ Project Structure

```
src/
├── App.jsx              # Main layout + state management
├── constants.js         # Game constants, XP, achievements, odds
├── sounds.js            # Web Audio API sound engine
├── icons.jsx            # SVG icon library (Ic, ACH_ICONS, GameIcons)
├── index.css            # Global styles + casino theme
├── games/
│   ├── SlotMachine.jsx
│   ├── CoinFlip.jsx
│   ├── LuckyNumber.jsx
│   ├── HighLow.jsx
│   ├── CrashGame.jsx
│   ├── Blackjack.jsx
│   ├── Roulette.jsx
│   ├── Plinko.jsx
│   ├── CardWar.jsx
│   ├── Baccarat.jsx
│   ├── Keno.jsx
│   └── ScratchCard.jsx
├── ui/
│   ├── modals.jsx       # All modals + BetSelector + MiniChart
│   ├── widgets.jsx      # XPBar + WeeklyWidget
│   └── ErrorBoundary.jsx
└── hooks/
    └── useSwipe.js      # Touch swipe gesture hook
```

---

## ⌨️ Keyboard Shortcuts

| Key     | Action                  |
| ------- | ----------------------- |
| `Space` | Spin (Slot Machine)     |
| `M`     | Toggle mute             |
| `S`     | Open stats              |
| `W`     | Toggle weekly challenge |
| `1–9`   | Switch to game 1–9      |
| `0`     | Switch to game 10       |

---

## 🛠️ Tech Stack

- **React 19** — UI framework
- **Vite 8** — build tool
- **Tailwind CSS 3** — utility-first styling
- **Web Audio API** — procedural sound effects
- **Canvas API** — Roulette wheel, Plinko physics
- **localStorage** — game state persistence
- **Service Worker** — PWA offline support

---

## ⚠️ Disclaimer

> For entertainment only. No real money involved. All coins are virtual and have no monetary value.
