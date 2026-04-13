import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACHIEVEMENTS,
  BIG_WIN_THRESHOLD,
  DAILY_KEY,
  DAILY_STREAK_BONUSES,
  GAMES,
  LEVEL_REWARDS,
  MAX_LEVEL,
  STARTING_COINS,
  STORAGE_KEY,
  TUTORIAL_KEY,
  WEEKLY_KEY,
  XP_PER_GAME,
  XP_PER_WIN,
  calcLevel,
  checkAchievements,
  getWeeklyChallenge,
  haptic,
  loadState,
  loadWeekly,
  TUTORIAL_STEPS,
  getDailyMissions,
  saveDailyMissions,
  getPrestige,
  savePrestige,
  PRESTIGE_BONUSES,
} from "./constants.js";
import { SFX, getMuted, setMuted } from "./sounds.js";
import { Ic, GameIcons } from "./icons.jsx";
import { ErrorBoundary } from "./ui/ErrorBoundary.jsx";
import { useSwipe } from "./hooks/useSwipe.js";
import {
  BigWinOverlay,
  AchievementToast,
  SessionSummary,
  StatsModal,
  DailyBonusModal,
  BetConfirm,
  MiniChart,
  TutorialModal,
  DailyMissionsModal,
  PrestigeModal,
  AutoBetModal,
} from "./ui/modals.jsx";
import { XPBar, WeeklyWidget } from "./ui/widgets.jsx";
import { SlotMachine } from "./games/SlotMachine.jsx";
import { CoinFlip } from "./games/CoinFlip.jsx";
import { LuckyNumber } from "./games/LuckyNumber.jsx";
import { HighLow } from "./games/HighLow.jsx";
import { CrashGame } from "./games/CrashGame.jsx";
import { Blackjack } from "./games/Blackjack.jsx";
import { Roulette } from "./games/Roulette.jsx";
import { Plinko } from "./games/Plinko.jsx";
import { CardWar } from "./games/CardWar.jsx";
import { Baccarat } from "./games/Baccarat.jsx";
import { Keno } from "./games/Keno.jsx";
import { ScratchCard } from "./games/ScratchCard.jsx";
import { TexasPoker } from "./games/TexasPoker.jsx";
import { WheelOfFortune } from "./games/WheelOfFortune.jsx";
import { DragonTiger } from "./games/DragonTiger.jsx";
import { VideoPoker } from "./games/VideoPoker.jsx";

const ACH_ICONS_MAP = {};

export default function App() {
  const saved = loadState();
  const prestigeData = getPrestige();
  const prestigeBonus = PRESTIGE_BONUSES[prestigeData.level - 1];
  const startCoins = prestigeBonus ? prestigeBonus.startCoins : STARTING_COINS;

  const [coins, setCoins] = useState(saved?.coins ?? startCoins);
  const [highScore, setHighScore] = useState(saved?.highScore ?? startCoins);
  const [activeGame, setActiveGame] = useState("slot");
  const [prevGame, setPrevGame] = useState(null);
  const [history, setHistory] = useState(saved?.history ?? []);
  const [toast, setToast] = useState(null);
  const [bigWin, setBigWin] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showSession, setShowSession] = useState(null);
  const [muted, setMutedState] = useState(getMuted());
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
      byGame: {},
    },
  );
  const [xp, setXp] = useState(saved?.xp ?? 0);
  const [levelUpMsg, setLevelUpMsg] = useState(null);
  const [tutStep, setTutStep] = useState(null);
  const weeklyChallenge = getWeeklyChallenge();
  const savedWeekly = loadWeekly();
  const [weeklyProgress, setWeeklyProgress] = useState(
    savedWeekly?.progress ?? 0,
  );
  const [weeklyClaimed, setWeeklyClaimed] = useState(
    savedWeekly?.claimed ?? false,
  );
  const [showWeekly, setShowWeekly] = useState(false);
  const [gameStats, setGameStats] = useState(saved?.gameStats ?? {});
  // New features
  const [showMissions, setShowMissions] = useState(false);
  const [dailyMissions, setDailyMissions] = useState(
    () => getDailyMissions().missions,
  );
  const [showPrestige, setShowPrestige] = useState(false);
  const [prestige, setPrestige] = useState(prestigeData);
  const [showAutoBet, setShowAutoBet] = useState(false);
  const [autoBetSettings, setAutoBetSettings] = useState({
    stopLoss: null,
    takeProfit: null,
    turbo: false,
  });
  const [theme, setTheme] = useState(
    () => localStorage.getItem("casino-theme") || "dark",
  );

  const sessionRef = useRef({
    startCoins: saved?.coins ?? startCoins,
    played: 0,
    wins: 0,
    bestWin: 0,
  });
  const toastRef = useRef(null);
  const achieveQueue = useRef([]);
  const gamePanelRef = useRef(null);
  const coinsRef = useRef(coins);
  const missionCompletedRef = useRef(0);

  useEffect(() => {
    coinsRef.current = coins;
  }, [coins]);

  useEffect(() => {
    const last = localStorage.getItem(DAILY_KEY);
    if (last !== new Date().toDateString()) setShowDaily(true);
  }, []);

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
        xp,
        gameStats,
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
    xp,
    gameStats,
  ]);

  useEffect(() => {
    localStorage.setItem("casino-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.matches("input,textarea,button,select")) return;
      if (e.key === "m" || e.key === "M") {
        const n = !getMuted();
        setMuted(n);
        setMutedState(n);
      }
      if (e.key === "s" || e.key === "S") setShowStats((v) => !v);
      if (e.key === "w" || e.key === "W") setShowWeekly((v) => !v);
      if (e.key === "d" || e.key === "D") setShowMissions((v) => !v);
      const idx = e.key === "0" ? 9 : parseInt(e.key) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < GAMES.length) {
        setActiveGame(GAMES[idx].id);
        SFX.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const done = localStorage.getItem(TUTORIAL_KEY);
    if (!done) setTutStep(0);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      WEEKLY_KEY,
      JSON.stringify({
        progress: weeklyProgress,
        claimed: weeklyClaimed,
        week: Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)),
      }),
    );
  }, [weeklyProgress, weeklyClaimed]);

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

  // Update daily missions progress
  const updateMissions = useCallback((eventType, delta, game) => {
    setDailyMissions((prev) => {
      const updated = prev.map((m) => {
        if (m.claimed || m.progress >= m.target) return m;
        let inc = 0;
        if (m.type === "wins" && delta > 0) inc = 1;
        if (m.type === "played") inc = 1;
        if (m.type === "earned" && delta > 0) inc = delta;
        if (m.type === "streak" && delta > 0) inc = 1;
        if (m.type === `game_${game}`) inc = 1;
        if (m.type === "cashout_crash" && eventType === "cashout") inc = 1;
        return { ...m, progress: Math.min(m.progress + inc, m.target) };
      });
      const d = getDailyMissions();
      saveDailyMissions({ ...d, missions: updated });
      return updated;
    });
  }, []);

  const handleResult = useCallback(
    (delta, eventType) => {
      const currentCoins = coinsRef.current;
      const nextCoins = Math.max(0, currentCoins + delta);
      setCoins(nextCoins);
      setHighScore((h) => Math.max(h, nextCoins));
      setHistory((h) => [
        { delta, game: activeGame, time: Date.now() },
        ...h.slice(0, 19),
      ]);
      setGameStats((gs) => {
        const g = gs[activeGame] ?? { played: 0, wins: 0, totalWon: 0 };
        return {
          ...gs,
          [activeGame]: {
            played: g.played + 1,
            wins: delta > 0 ? g.wins + 1 : g.wins,
            totalWon: delta > 0 ? g.totalWon + delta : g.totalWon,
          },
        };
      });
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
      const xpMult =
        prestige.level > 0
          ? (PRESTIGE_BONUSES[prestige.level - 1]?.xpMult ?? 1)
          : 1;
      const xpGain = Math.floor(
        (XP_PER_GAME + (delta > 0 ? XP_PER_WIN : 0)) * xpMult,
      );
      let levelReward = 0;
      setXp((prev) => {
        const newXp = prev + xpGain;
        const oldLvl = calcLevel(prev).level;
        const newLvl = calcLevel(newXp).level;
        if (newLvl > oldLvl && newLvl <= MAX_LEVEL) {
          SFX.levelup();
          levelReward = LEVEL_REWARDS[newLvl] ?? 0;
          showToast(
            levelReward
              ? `Level ${newLvl}! +${levelReward} coins`
              : `Level ${newLvl}!`,
            true,
          );
          setLevelUpMsg(`Level ${newLvl}`);
          setTimeout(() => setLevelUpMsg(null), 2500);
        }
        return newXp;
      });
      setWeeklyProgress((prev) => {
        if (weeklyClaimed) return prev;
        const ch = weeklyChallenge;
        let inc = 0;
        if (ch.type === "wins" && delta > 0) inc = 1;
        if (ch.type === "played") inc = 1;
        if (ch.type === "earned" && delta > 0) inc = delta;
        if (ch.type === "streak" && newStats?.currentStreak > 0)
          inc = newStats.currentStreak >= ch.target ? ch.target - prev : 0;
        if (ch.type === "bj" && activeGame === "bj") inc = 1;
        if (ch.type === "crash3x" && eventType === "cashout") inc = 1;
        return Math.min(prev + inc, ch.target);
      });
      sessionRef.current.played++;
      if (delta > 0) {
        sessionRef.current.wins++;
        sessionRef.current.bestWin = Math.max(
          sessionRef.current.bestWin,
          delta,
        );
      }
      haptic(delta > 0 ? "win" : "lose");
      showToast(delta > 0 ? `+${delta} coins` : `${delta} coins`, delta > 0);
      if (delta >= BIG_WIN_THRESHOLD) setBigWin(delta);
      if (newStats) {
        const event = {
          type: eventType ?? (delta > 0 ? "win" : "lose"),
          data: { prevCoins: currentCoins },
          stats: newStats,
          coins: nextCoins,
          level: calcLevel(0).level,
        };
        setAchievements((cur) => {
          const newOnes = checkAchievements(cur, event);
          if (!newOnes.length) return cur;
          newOnes.forEach((id) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id);
            if (a) achieveQueue.current.push(a);
          });
          return [...cur, ...newOnes];
        });
      }
      if (levelReward > 0) setCoins((c) => c + levelReward);
      updateMissions(eventType, delta, activeGame);
      // Auto-bet stop loss / take profit check
      if (autoBetSettings.stopLoss && nextCoins <= autoBetSettings.stopLoss)
        showToast("Stop Loss hit!", false);
      if (autoBetSettings.takeProfit && nextCoins >= autoBetSettings.takeProfit)
        showToast("Take Profit hit!", true);
      if (nextCoins === 0) {
        setTimeout(() => {
          setShowSession({
            startCoins: sessionRef.current.startCoins,
            endCoins: 0,
            played: sessionRef.current.played,
            wins: sessionRef.current.wins,
            bestWin: sessionRef.current.bestWin,
          });
        }, 900);
      }
    },
    [
      activeGame,
      showToast,
      weeklyChallenge,
      weeklyClaimed,
      prestige,
      updateMissions,
      autoBetSettings,
    ],
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
    if (streak >= 7)
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
  };

  const claimMission = (idx) => {
    const m = dailyMissions[idx];
    if (!m || m.claimed || m.progress < m.target) return;
    SFX.bonus();
    setCoins((c) => c + m.reward);
    showToast(`+${m.reward} mission reward!`, true);
    const updated = dailyMissions.map((ms, i) =>
      i === idx ? { ...ms, claimed: true } : ms,
    );
    setDailyMissions(updated);
    const d = getDailyMissions();
    saveDailyMissions({ ...d, missions: updated });
    missionCompletedRef.current++;
    setAchievements((cur) => {
      const n = checkAchievements(cur, {
        type: "mission_complete",
        data: { total: missionCompletedRef.current },
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
  };

  const doPrestige = () => {
    const newLevel = prestige.level + 1;
    const newPrestige = {
      level: newLevel,
      totalPrestiges: prestige.totalPrestiges + 1,
    };
    savePrestige(newPrestige);
    setPrestige(newPrestige);
    const bonus = PRESTIGE_BONUSES[newLevel - 1];
    setCoins(bonus?.startCoins ?? STARTING_COINS);
    setXp(0);
    setHistory([]);
    setShowPrestige(false);
    SFX.levelup();
    showToast(`Prestige ${newLevel}! ${bonus?.label}`, true);
    setAchievements((cur) => {
      const n = checkAchievements(cur, { type: "prestige", stats, coins });
      if (n.length) {
        n.forEach((id) => {
          const a = ACHIEVEMENTS.find((x) => x.id === id);
          if (a) achieveQueue.current.push(a);
        });
        return [...cur, ...n];
      }
      return cur;
    });
  };

  const resetCoins = () => {
    setLeaderboard((lb) =>
      [...lb, { coins: highScore, date: Date.now() }]
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 5),
    );
    sessionRef.current = {
      startCoins: startCoins,
      played: 0,
      wins: 0,
      bestWin: 0,
    };
    setCoins(startCoins);
    setHighScore((h) => Math.max(h, startCoins));
    setHistory([]);
    setShowSession(null);
    showToast(`Reloaded ${startCoins} coins`, true);
  };

  const shareScore = () => {
    const { level } = calcLevel(xp);
    const text = `Casino Mini — Level ${level} · Best: ${highScore.toLocaleString()} coins · ${stats.wins}W/${stats.losses}L`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Score copied!", true);
    }
  };

  const switchGame = (id) => {
    setPrevGame(activeGame);
    setActiveGame(id);
    SFX.click();
    setTimeout(() => setPrevGame(null), 350);
  };
  const toggleMute = () => {
    const n = !getMuted();
    setMuted(n);
    setMutedState(n);
  };

  useSwipe(
    gamePanelRef,
    useCallback(
      (dir) => {
        const idx = GAMES.findIndex((g) => g.id === activeGame);
        const next =
          dir === "left"
            ? GAMES[(idx + 1) % GAMES.length]
            : GAMES[(idx - 1 + GAMES.length) % GAMES.length];
        SFX.swipe();
        switchGame(next.id);
      },
      [activeGame],
    ),
  );

  const { level } = calcLevel(xp);
  const pendingMissions = dailyMissions.filter(
    (m) => m.progress >= m.target && !m.claimed,
  ).length;

  return (
    <div
      className={`casino-bg relative overflow-x-hidden ${theme === "light" ? "theme-light" : ""}`}
    >
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
          leaderboard={
            highScore > startCoins
              ? [
                  ...leaderboard,
                  { coins: highScore, date: Date.now(), current: true },
                ]
                  .sort((a, b) => b.coins - a.coins)
                  .slice(0, 5)
              : leaderboard
          }
          gameStats={gameStats}
          xp={xp}
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
      {tutStep !== null && (
        <TutorialModal
          step={tutStep}
          total={TUTORIAL_STEPS.length}
          onNext={() => {
            if (tutStep < TUTORIAL_STEPS.length - 1) setTutStep((t) => t + 1);
            else {
              localStorage.setItem(TUTORIAL_KEY, "1");
              setTutStep(null);
            }
          }}
          onSkip={() => {
            localStorage.setItem(TUTORIAL_KEY, "1");
            setTutStep(null);
          }}
        />
      )}
      {showMissions && (
        <DailyMissionsModal
          missions={dailyMissions}
          onClaim={claimMission}
          onClose={() => setShowMissions(false)}
        />
      )}
      {showPrestige && (
        <PrestigeModal
          level={level}
          prestige={prestige}
          onPrestige={doPrestige}
          onClose={() => setShowPrestige(false)}
        />
      )}
      {showAutoBet && (
        <AutoBetModal
          settings={autoBetSettings}
          onChange={setAutoBetSettings}
          onClose={() => setShowAutoBet(false)}
        />
      )}

      {levelUpMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] fadeup pointer-events-none">
          <div className="rounded-full border border-yellow-400 bg-black/90 px-5 py-2 text-sm font-bold text-yellow-400 shadow-[0_0_20px_#f59e0b66]">
            {levelUpMsg} reached!
          </div>
        </div>
      )}
      {toast && (
        <div
          className={`toast fadeup fixed left-1/2 top-4 z-50 -translate-x-1/2 ${toast.win ? "toast-win" : "toast-lose"}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="casino-layout relative">
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

        {/* ── Balance Bar ── */}
        <div className="balance-bar mb-3 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-yellow-800 uppercase"
              style={{
                fontSize: "clamp(8px,2vw,10px)",
                letterSpacing: "0.25em",
              }}
            >
              Balance
            </p>
            <p
              className="mt-0.5 font-bold text-yellow-400 truncate"
              style={{
                fontSize: "clamp(1.2rem,5vw,1.6rem)",
                textShadow: "0 0 12px #f59e0b44",
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="w-5 h-5 inline-block flex-shrink-0">
                  {Ic.coin}
                </span>
                {coins.toLocaleString()}
              </span>
            </p>
          </div>
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-yellow-900 to-transparent flex-shrink-0" />
          <div className="text-right flex-1 min-w-0">
            <p
              className="text-yellow-800 uppercase"
              style={{
                fontSize: "clamp(8px,2vw,10px)",
                letterSpacing: "0.25em",
              }}
            >
              Best
            </p>
            <p
              className="mt-0.5 font-bold text-yellow-700 truncate"
              style={{ fontSize: "clamp(1rem,4vw,1.2rem)" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 h-4 inline-block flex-shrink-0">
                  {Ic.best}
                </span>
                {highScore.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* ── Action Toolbar ── */}
        <div className="toolbar-bar mb-3 flex items-center justify-between gap-1 px-2 py-2">
          {/* Left group: main nav */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowStats(true)}
              className="toolbar-btn"
              title="Stats (S)"
            >
              <span className="w-4 h-4">{Ic.stats}</span>
              <span>Stats</span>
            </button>
            <button
              type="button"
              onClick={() => setShowWeekly((v) => !v)}
              className={`toolbar-btn ${showWeekly ? "toolbar-btn-active" : ""}`}
              title="Weekly (W)"
            >
              <span className="w-4 h-4">{Ic.trophy}</span>
              <span>Weekly</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMissions(true)}
              className={`toolbar-btn relative ${pendingMissions > 0 ? "toolbar-btn-notify" : ""}`}
              title="Missions (D)"
            >
              <span className="w-4 h-4">{Ic.mission}</span>
              <span>Missions</span>
              {pendingMissions > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 text-black text-[8px] font-bold flex items-center justify-center border border-black/20">
                  {pendingMissions}
                </span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-yellow-900/40 flex-shrink-0" />

          {/* Right group: settings */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowAutoBet(true)}
              className="toolbar-btn"
              title="Auto-Bet"
            >
              <span className="w-4 h-4">{Ic.autobet}</span>
              <span>Auto</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPrestige(true)}
              className="toolbar-btn"
              title="Prestige"
            >
              <span className="w-4 h-4">{Ic.prestige}</span>
              <span>Prestige</span>
            </button>
            <button
              type="button"
              onClick={shareScore}
              className="toolbar-btn"
              title="Share"
            >
              <span className="w-4 h-4">{Ic.share}</span>
              <span>Share</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="toolbar-btn"
              title="Theme"
            >
              <span className="w-4 h-4">
                {theme === "dark" ? Ic.sun : Ic.moon}
              </span>
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="toolbar-btn"
              title="Mute (M)"
            >
              <span className="w-4 h-4">{muted ? Ic.muted : Ic.mute}</span>
              <span>{muted ? "Unmute" : "Mute"}</span>
            </button>
            <button
              type="button"
              onClick={() => setTutStep(0)}
              className="toolbar-btn"
              title="Tutorial"
            >
              <span className="w-4 h-4">{Ic.info}</span>
              <span>Help</span>
            </button>
          </div>
        </div>

        <div className="mb-3 px-1">
          <XPBar xp={xp} prestige={prestige} />
        </div>

        {showWeekly && (
          <div className="mb-3">
            <WeeklyWidget
              challenge={weeklyChallenge}
              progress={weeklyProgress}
              onClose={() => setShowWeekly(false)}
            />
            {weeklyProgress >= weeklyChallenge.target && !weeklyClaimed && (
              <button
                type="button"
                onClick={() => {
                  setWeeklyClaimed(true);
                  setCoins((c) => c + weeklyChallenge.reward);
                  showToast(`+${weeklyChallenge.reward} weekly reward!`, true);
                  SFX.bonus();
                  haptic("win");
                }}
                className="btn-gold mt-2 w-full py-2 text-sm"
              >
                Claim +{weeklyChallenge.reward} coins
              </button>
            )}
          </div>
        )}

        {achievements.length > 0 && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {achievements.slice(-8).map((id) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id);
              return a ? (
                <span
                  key={id}
                  title={a.label}
                  className="shrink-0 w-7 h-7 rounded-full border border-yellow-900/60 bg-yellow-950/40 p-1 text-yellow-500 cursor-default"
                >
                  {Ic.medal}
                </span>
              ) : null;
            })}
            <span className="shrink-0 text-[10px] text-yellow-900 self-center ml-1">
              {achievements.length}/{ACHIEVEMENTS.length}
            </span>
          </div>
        )}

        <div className="mb-3 grid grid-cols-4 gap-1 sm:gap-1.5">
          {GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => switchGame(g.id)}
              className={`game-tab ${activeGame === g.id ? "active" : ""}`}
            >
              <span className="game-tab-icon">{GameIcons[g.id]}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>

        <div
          ref={gamePanelRef}
          className={`card-glass rounded-2xl shadow-[0_0_40px_#f59e0b08] ${prevGame ? "fadeup" : ""}`}
          style={{ padding: "clamp(14px,4vw,24px)" }}
        >
          <div className="mb-4 h-px bg-gradient-to-r from-transparent via-yellow-900/60 to-transparent" />
          <ErrorBoundary>
            {activeGame === "slot" && (
              <SlotMachine
                coins={coins}
                onResult={handleResult}
                turbo={autoBetSettings.turbo}
              />
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
            {activeGame === "baccarat" && (
              <Baccarat coins={coins} onResult={handleResult} />
            )}
            {activeGame === "keno" && (
              <Keno coins={coins} onResult={handleResult} />
            )}
            {activeGame === "scratch" && (
              <ScratchCard coins={coins} onResult={handleResult} />
            )}
            {activeGame === "poker" && (
              <TexasPoker coins={coins} onResult={handleResult} />
            )}
            {activeGame === "wheel" && (
              <WheelOfFortune coins={coins} onResult={handleResult} />
            )}
            {activeGame === "dragon" && (
              <DragonTiger coins={coins} onResult={handleResult} />
            )}
            {activeGame === "videopoker" && (
              <VideoPoker coins={coins} onResult={handleResult} />
            )}
          </ErrorBoundary>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-yellow-900/40 to-transparent" />
          <p className="mt-2 text-center text-[9px] text-yellow-900 opacity-60">
            ← swipe to switch game →
          </p>
        </div>

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
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4">{Ic.reload}</span>Reload {startCoins}{" "}
              coins
            </span>
          </button>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[
            ["Space", "Spin"],
            ["M", "Mute"],
            ["S", "Stats"],
            ["W", "Weekly"],
            ["D", "Missions"],
            ["1-9", "Switch"],
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
          FOR ENTERTAINMENT ONLY · NO JUDOL
        </p>
      </div>
    </div>
  );
}
