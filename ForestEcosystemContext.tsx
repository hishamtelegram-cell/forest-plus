'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActiveTimerState,
  AppThemeAccentId,
  BilingualText,
  ChallengeRecord,
  DecorationId,
  FocusPowerWeights,
  FocusSessionRecord,
  ForestEnvId,
  ForestSizeId,
  Language,
  MarketplaceItemMeta,
  NavSection,
  NotificationCategory,
  NotificationRecord,
  PersonalRecordItem,
  PlantedTreeRecord,
  StudyPlanItem,
  SubjectRecord,
  TaskPriority,
  TaskRecord,
  ThemeMode,
  TimerMode,
  TreeSpeciesId,
  UserProfileAndSettings,
} from '@/domain/types';
import {
  ACHIEVEMENTS_CATALOG,
  FOREST_SIZES_CATALOG,
  TREE_SPECIES_CATALOG,
} from '@/domain/catalog';
import {
  createDefaultPersonalRecords,
  createDefaultProfile,
  ensureLocalDatabaseInitialized,
  getTodayDateStr,
  localDb,
} from '@/db/localDb';
import { TRANSLATIONS } from '@/translations';
import { soundEngine } from '@/utils/soundEngine';

const TIMER_STORAGE_KEY = 'forest_plus_active_timer_v1';

export interface SessionRewardSummary {
  sessionId: string;
  focusedMinutes: number;
  speciesId: TreeSpeciesId;
  subjectId: string;
  coinsEarned: number;
  pointsEarned: number;
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  diminishedApplied: boolean;
  newRecordsBroken: string[];
  placedInVault: boolean;
}

export interface FocusPowerBreakdown {
  totalScore: number; // 0..1000
  previousScore: number;
  factors: {
    focusTime: number; // 0..100
    sessionRate: number; // 0..100
    dailyGoals: number; // 0..100
    consistency: number; // 0..100
    completedTasks: number; // 0..100
    achievements: number; // 0..100
  };
}

interface ForestEcosystemContextValue {
  isReady: boolean;
  activeSection: NavSection;
  setActiveSection: (sec: NavSection) => void;
  profile: UserProfileAndSettings;
  lang: Language;
  t: (typeof TRANSLATIONS)['en'];
  setLanguage: (lang: Language) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  updateProfileSettings: (patch: Partial<UserProfileAndSettings>) => Promise<void>;
  // Data collections
  sessions: FocusSessionRecord[];
  trees: PlantedTreeRecord[];
  tasks: TaskRecord[];
  subjects: SubjectRecord[];
  plans: StudyPlanItem[];
  notifications: NotificationRecord[];
  challenges: ChallengeRecord[];
  records: PersonalRecordItem[];
  // Timer State & Controls
  timerState: ActiveTimerState;
  elapsedSeconds: number;
  remainingSeconds: number;
  timerProgress: number; // 0.0 to 1.0
  lastRewardSummary: SessionRewardSummary | null;
  clearRewardSummary: () => void;
  recordCelebrationBanner: BilingualText | null;
  clearCelebrationBanner: () => void;
  setTimerMode: (mode: TimerMode, customMinutes?: number) => void;
  setTimerSubject: (subjectId: string) => void;
  setTimerSpecies: (speciesId: TreeSpeciesId) => void;
  setTimerAmbientSound: (sound: ActiveTimerState['ambientSound']) => void;
  setTimerDistractionFree: (df: boolean) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  cancelTimer: () => Promise<void>;
  resetTimer: () => void;
  skipBreak: () => void;
  // Forest & Collection Actions
  relocateTreeSlot: (treeId: string, newSlotIndex: number) => Promise<void>;
  // Marketplace Actions
  purchaseMarketplaceItem: (item: MarketplaceItemMeta) => Promise<{ ok: boolean; message: string }>;
  // Task Actions
  createTask: (data: {
    title: string;
    description: string;
    subjectId: string;
    priority: TaskPriority;
    dueDateStr: string;
    estimatedMinutes: number;
  }) => Promise<void>;
  updateTask: (id: string, patch: Partial<TaskRecord>) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // Subject Actions
  createSubject: (data: { name: string; color: string; description: string }) => Promise<void>;
  updateSubject: (id: string, patch: Partial<SubjectRecord>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  // Study Planner Actions
  createStudyPlan: (data: {
    dayOfWeek: number;
    subjectId: string;
    title: string;
    targetMinutes: number;
  }) => Promise<void>;
  toggleStudyPlanComplete: (id: string) => Promise<void>;
  deleteStudyPlan: (id: string) => Promise<void>;
  // Challenges Actions
  createCustomChallenge: (data: {
    title: string;
    metric: ChallengeRecord['metric'];
    targetValue: number;
    endDateStr: string;
  }) => Promise<void>;
  claimChallengeReward: (challengeId: string) => Promise<void>;
  // Notifications Actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  createCustomReminder: (title: string, description: string) => Promise<void>;
  requestBrowserNotifications: () => Promise<boolean>;
  // Computed Analytics
  focusPower: FocusPowerBreakdown;
  todayFocusMinutes: number;
  todayCompletedSessions: number;
  todayTreesPlanted: number;
  // Data Management
  exportDataAsJson: () => void;
  exportAnalyticsAsCsv: () => void;
  importDataFromJson: (jsonString: string) => Promise<boolean>;
  resetAllApplicationData: () => Promise<void>;
  seedRichDemoSanctuary: () => Promise<void>;
}

const ForestEcosystemContext = createContext<ForestEcosystemContextValue | null>(null);

export function calculateLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  // Progressive curve: Level 1 requires 250 XP, Level 2 requires 350 XP, etc.
  let level = 1;
  let remaining = Math.max(0, xp);
  let needed = 250;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = 250 + (level - 1) * 120;
  }
  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp: needed,
    progressPct: Math.min(100, Math.round((remaining / needed) * 100)),
  };
}

export function ForestEcosystemProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [profile, setProfile] = useState<UserProfileAndSettings>(createDefaultProfile);
  const [sessions, setSessions] = useState<FocusSessionRecord[]>([]);
  const [trees, setTrees] = useState<PlantedTreeRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [challenges, setChallenges] = useState<ChallengeRecord[]>([]);
  const [records, setRecords] = useState<PersonalRecordItem[]>(createDefaultPersonalRecords);

  const [lastRewardSummary, setLastRewardSummary] = useState<SessionRewardSummary | null>(null);
  const [recordCelebrationBanner, setRecordCelebrationBanner] = useState<BilingualText | null>(null);

  const [timerState, setTimerState] = useState<ActiveTimerState>(() => ({
    sessionId: `ses_${Date.now()}`,
    mode: 'focus',
    status: 'idle',
    startedAtTimestamp: null,
    accumulatedElapsedSec: 0,
    plannedDurationSec: 25 * 60,
    subjectId: 'subj_programming',
    speciesId: 'oak',
    sessionStartTimestamp: null,
    ambientSound: 'none',
    distractionFree: false,
  }));

  const [nowTick, setNowTick] = useState<number>(Date.now());
  const processedSessionIdsRef = useRef<Set<string>>(new Set());

  // Reload all tables from IndexedDB into React state
  const reloadAllFromDb = useCallback(async () => {
    if (!localDb) return;
    const [
      prof,
      allSessions,
      allTrees,
      allTasks,
      allSubjects,
      allPlans,
      allNotifs,
      allChallenges,
      allRecords,
    ] = await Promise.all([
      localDb.profile.get('default_user'),
      localDb.sessions.orderBy('startTime').reverse().toArray(),
      localDb.trees.toArray(),
      localDb.tasks.toArray(),
      localDb.subjects.toArray(),
      localDb.plans.toArray(),
      localDb.notifications.orderBy('timestamp').reverse().toArray(),
      localDb.challenges.toArray(),
      localDb.records.toArray(),
    ]);

    if (prof) {
      setProfile(prof);
    }
    setSessions(allSessions);
    setTrees(allTrees.sort((a, b) => b.createdAt - a.createdAt));
    setTasks(allTasks.sort((a, b) => b.createdAt - a.createdAt));
    setSubjects(allSubjects);
    setPlans(allPlans);
    setNotifications(allNotifs);
    setChallenges(allChallenges);
    if (allRecords.length > 0) {
      setRecords(allRecords);
    }
  }, []);

  // Initial Bootstrap & Service Worker Registration
  useEffect(() => {
    let mounted = true;
    (async () => {
      await ensureLocalDatabaseInitialized();
      await reloadAllFromDb();

      // Restore persistent timer state from localStorage if present
      if (typeof window !== 'undefined') {
        const rawTimer = localStorage.getItem(TIMER_STORAGE_KEY);
        if (rawTimer) {
          try {
            const parsed = JSON.parse(rawTimer) as ActiveTimerState;
            if (parsed && parsed.sessionId && parsed.plannedDurationSec > 0) {
              setTimerState(parsed);
            }
          } catch {}
        }

        // Register PWA service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
      }

      if (mounted) {
        setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reloadAllFromDb]);

  // Keep HTML dir="rtl" / "ltr", lang, and dark theme class synchronized
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.lang = profile.language;
    root.dir = profile.language === 'ar' ? 'rtl' : 'ltr';
    if (profile.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('forest_plus_lang', profile.language);
    localStorage.setItem('forest_plus_theme', profile.theme);
  }, [profile.language, profile.theme]);

  // Persist timerState to localStorage on every change
  useEffect(() => {
    if (!isReady || typeof window === 'undefined') return;
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
  }, [timerState, isReady]);

  // Manage Ambient Soundscape playback
  useEffect(() => {
    if (timerState.status === 'running' && timerState.ambientSound !== 'none') {
      soundEngine.setAmbientSound(timerState.ambientSound, profile.soundEnabled);
    } else {
      soundEngine.stopAmbient();
    }
  }, [timerState.status, timerState.ambientSound, profile.soundEnabled]);

  // Helper to push a bilingual notification
  const addNotification = useCallback(
    async (
      category: NotificationCategory,
      title: BilingualText,
      description: BilingualText,
      actionSection?: NavSection,
      actionLabel?: BilingualText
    ) => {
      if (!localDb) return;
      if (!profile.inAppNotificationsEnabled) return;
      if (profile.notifyCategories && !profile.notifyCategories[category]) return;

      const notif: NotificationRecord = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        category,
        title,
        description,
        timestamp: Date.now(),
        read: false,
        actionSection,
        actionLabel,
      };
      await localDb.notifications.put(notif);
      setNotifications((prev) => [notif, ...prev]);

      // Browser Web Notification API if permitted and enabled
      if (
        profile.browserNotificationsEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title[profile.language], {
            body: description[profile.language],
            icon: '/icons/icon.svg',
          });
        } catch {}
      }
    },
    [
      profile.inAppNotificationsEnabled,
      profile.notifyCategories,
      profile.browserNotificationsEnabled,
      profile.language,
    ]
  );

  // Calculate accurate elapsed and remaining seconds from timestamps
  const elapsedSeconds = useMemo(() => {
    if (timerState.status === 'idle') return 0;
    if (timerState.status === 'paused' || !timerState.startedAtTimestamp) {
      return Math.min(timerState.plannedDurationSec, timerState.accumulatedElapsedSec);
    }
    const deltaSec = Math.max(0, (nowTick - timerState.startedAtTimestamp) / 1000);
    return Math.min(
      timerState.plannedDurationSec,
      timerState.accumulatedElapsedSec + deltaSec
    );
  }, [timerState, nowTick]);

  const remainingSeconds = useMemo(() => {
    return Math.max(0, Math.ceil(timerState.plannedDurationSec - elapsedSeconds));
  }, [timerState.plannedDurationSec, elapsedSeconds]);

  const timerProgress = useMemo(() => {
    if (timerState.plannedDurationSec <= 0) return 0;
    return Math.max(0, Math.min(1, elapsedSeconds / timerState.plannedDurationSec));
  }, [elapsedSeconds, timerState.plannedDurationSec]);

  // Complete a Focus or Break session with duplicate prevention
  const handleCompleteSession = useCallback(
    async (completedState: ActiveTimerState) => {
      if (!localDb) return;
      if (processedSessionIdsRef.current.has(completedState.sessionId)) return;
      processedSessionIdsRef.current.add(completedState.sessionId);

      // Double check in IndexedDB
      const existing = await localDb.sessions.get(completedState.sessionId);
      if (existing) return;

      soundEngine.playCompletionChime(profile.soundEnabled);
      soundEngine.stopAmbient();

      const now = Date.now();
      const todayStr = getTodayDateStr(new Date(now));
      const durationMin = Math.max(1, Math.round(completedState.plannedDurationSec / 60));

      if (completedState.mode === 'short_break' || completedState.mode === 'long_break') {
        await addNotification(
          'FOCUS',
          { en: 'Break Finished — Refreshed & Ready!', ar: 'انتهت الاستراحة — مستعد للتركيز!' },
          {
            en: 'Your restorative break is complete. Ready to plant your next tree?',
            ar: 'انتهت فترة استراحتك بنجاح. هل أنت مستعد لزراعة شجرتك التالية؟',
          },
          'timer'
        );

        setTimerState((prev) => ({
          ...prev,
          sessionId: `ses_${Date.now()}`,
          mode: 'focus',
          status: profile.autoStartFocus ? 'running' : 'idle',
          startedAtTimestamp: profile.autoStartFocus ? Date.now() : null,
          accumulatedElapsedSec: 0,
          plannedDurationSec: profile.defaultFocusMinutes * 60,
          sessionStartTimestamp: profile.autoStartFocus ? Date.now() : null,
        }));
        return;
      }

      // FOCUS SESSION COMPLETED: Calculate Balanced Rewards with Diminishing Returns after 240m/day
      const todaySessions = sessions.filter(
        (s) => s.dateStr === todayStr && s.status === 'completed'
      );
      const todayPriorMinutes = todaySessions.reduce(
        (acc, s) => acc + Math.round(s.actualDurationSec / 60),
        0
      );
      const diminishedApplied = todayPriorMinutes >= 240;
      const multiplier = diminishedApplied ? 0.5 : 1.0;

      const baseCoins = Math.max(10, Math.round(durationMin * 2.2 * multiplier));
      const basePoints = Math.max(20, Math.round(durationMin * 4.5 * multiplier));
      const baseXp = Math.max(25, Math.round(durationMin * 5.0 * multiplier));

      // Determine slot in Active Personal Forest
      const activeForestMeta =
        FOREST_SIZES_CATALOG.find((f) => f.id === profile.activeForestSize) ||
        FOREST_SIZES_CATALOG[0];
      const activeForestTrees = trees.filter(
        (t) => t.forestSizeId === profile.activeForestSize
      );
      const usedSlots = new Set(activeForestTrees.map((t) => t.slotIndex));
      let assignedSlot = -1;
      for (let i = 0; i < activeForestMeta.capacity; i++) {
        if (!usedSlots.has(i)) {
          assignedSlot = i;
          break;
        }
      }
      const placedInVault = assignedSlot === -1;

      const newTreeId = `tree_${now}_${Math.random().toString(36).slice(2, 6)}`;
      const newTree: PlantedTreeRecord = {
        id: newTreeId,
        sessionId: completedState.sessionId,
        speciesId: completedState.speciesId,
        subjectId: completedState.subjectId,
        createdAt: now,
        dateStr: todayStr,
        focusDurationSec: completedState.plannedDurationSec,
        growthStage: 'mature',
        forestSizeId: placedInVault ? 'vault' : profile.activeForestSize,
        slotIndex: placedInVault ? 0 : assignedSlot,
        seedVariation: Math.random(),
      };

      const sessionRecord: FocusSessionRecord = {
        id: completedState.sessionId,
        startTime: completedState.sessionStartTimestamp || now - completedState.plannedDurationSec * 1000,
        endTime: now,
        plannedDurationSec: completedState.plannedDurationSec,
        actualDurationSec: completedState.plannedDurationSec,
        status: 'completed',
        mode: completedState.mode,
        subjectId: completedState.subjectId,
        speciesId: completedState.speciesId,
        coinsEarned: baseCoins,
        pointsEarned: basePoints,
        xpEarned: baseXp,
        treeId: newTreeId,
        rewardClaimed: true,
        dateStr: todayStr,
      };

      await localDb.trees.put(newTree);
      await localDb.sessions.put(sessionRecord);

      // Update Study Streak
      const yesterdayStr = getTodayDateStr(new Date(now - 86400000));
      let nextStreak = profile.currentStreak;
      if (todaySessions.length === 0) {
        if (profile.lastActiveDateStr === yesterdayStr) {
          nextStreak = profile.currentStreak + 1;
        } else if (profile.lastActiveDateStr !== todayStr) {
          nextStreak = 1;
        } else if (nextStreak === 0) {
          nextStreak = 1;
        }
      }
      const nextLongestStreak = Math.max(profile.longestStreak, nextStreak);

      // Check Achievements Unlock
      const totalCompletedSessions =
        sessions.filter((s) => s.status === 'completed').length + 1;
      const totalTreesCount = trees.length + 1;
      const totalFocusMinutesAll =
        sessions
          .filter((s) => s.status === 'completed')
          .reduce((a, s) => a + Math.round(s.actualDurationSec / 60), 0) + durationMin;
      const totalCompletedTasks = tasks.filter((t) => t.completed).length;

      let bonusAchCoins = 0;
      let bonusAchPoints = 0;
      const newlyUnlockedAchIds: string[] = [];

      for (const ach of ACHIEVEMENTS_CATALOG) {
        if (profile.unlockedAchievements.includes(ach.id)) continue;
        let currentVal = 0;
        if (ach.metric === 'total_sessions') currentVal = totalCompletedSessions;
        else if (ach.metric === 'total_trees') currentVal = totalTreesCount;
        else if (ach.metric === 'streak_days') currentVal = nextStreak;
        else if (ach.metric === 'total_tasks') currentVal = totalCompletedTasks;
        else if (ach.metric === 'unlocked_species') currentVal = profile.ownedSpecies.length;
        else if (ach.metric === 'total_focus_min') currentVal = totalFocusMinutesAll;

        if (currentVal >= ach.targetValue) {
          newlyUnlockedAchIds.push(ach.id);
          bonusAchCoins += ach.rewardCoins;
          bonusAchPoints += ach.rewardPoints;
          await addNotification(
            'REWARDS',
            {
              en: `Achievement Unlocked: ${ach.title.en}`,
              ar: `تم فتح وسام جديد: ${ach.title.ar}`,
            },
            {
              en: `${ach.description.en} (+${ach.rewardCoins} Leaf Coins)`,
              ar: `${ach.description.ar} (+${ach.rewardCoins} عملة ورقية)`,
            },
            'achievements'
          );
        }
      }

      const newTotalXp = profile.xp + baseXp + bonusAchPoints;
      const prevLevelInfo = calculateLevelFromXp(profile.xp);
      const nextLevelInfo = calculateLevelFromXp(newTotalXp);
      const leveledUp = nextLevelInfo.level > prevLevelInfo.level;

      const updatedProfile: UserProfileAndSettings = {
        ...profile,
        leafCoins: profile.leafCoins + baseCoins + bonusAchCoins,
        forestPoints: profile.forestPoints + basePoints + bonusAchPoints,
        xp: newTotalXp,
        level: nextLevelInfo.level,
        currentStreak: nextStreak,
        longestStreak: nextLongestStreak,
        lastActiveDateStr: todayStr,
        unlockedAchievements: [
          ...profile.unlockedAchievements,
          ...newlyUnlockedAchIds,
        ],
      };
      await localDb.profile.put(updatedProfile);

      // Update Challenges Progress
      const updatedChallenges = challenges.map((ch) => {
        if (ch.completed) return ch;
        let nextVal = ch.currentValue;
        if (ch.metric === 'trees_planted' || ch.metric === 'focus_sessions') {
          nextVal += 1;
        } else if (ch.metric === 'focus_minutes') {
          nextVal += durationMin;
        } else if (ch.metric === 'streak_days') {
          nextVal = Math.max(nextVal, nextStreak);
        } else if (ch.metric === 'subjects_studied') {
          const uniqueSubjs = new Set([
            ...sessions.filter((s) => s.status === 'completed').map((s) => s.subjectId),
            completedState.subjectId,
          ]);
          nextVal = uniqueSubjs.size;
        }
        const isNowDone = nextVal >= ch.targetValue;
        return {
          ...ch,
          currentValue: nextVal,
          completed: isNowDone,
        };
      });
      await localDb.challenges.bulkPut(updatedChallenges);

      // Update Connected Study Planner blocks for today
      const todayDow = new Date(now).getDay();
      const matchingPlans = plans.filter(
        (p) => p.dayOfWeek === todayDow && p.subjectId === completedState.subjectId
      );
      if (matchingPlans.length > 0) {
        const targetPlan = matchingPlans[0];
        const nextCompMin = targetPlan.completedMinutes + durationMin;
        await localDb.plans.put({
          ...targetPlan,
          completedMinutes: nextCompMin,
          completed: nextCompMin >= targetPlan.targetMinutes,
        });
      }

      // Check Personal Records
      const brokenRecordNames: string[] = [];
      const currentRecords = await localDb.records.toArray();
      const recMap = new Map(currentRecords.map((r) => [r.id, r]));

      const checkAndSetRecord = (
        id: PersonalRecordItem['id'],
        candidateValue: number,
        labelEn: string,
        labelAr: string
      ) => {
        const existingRec = recMap.get(id);
        if (existingRec && candidateValue > existingRec.value) {
          recMap.set(id, {
            ...existingRec,
            previousValue: existingRec.value,
            value: candidateValue,
            achievedAt: now,
          });
          brokenRecordNames.push(profile.language === 'ar' ? labelAr : labelEn);
        }
      };

      const newDailyMin = todayPriorMinutes + durationMin;
      const weekAgo = now - 7 * 86400000;
      const weekMin =
        sessions
          .filter((s) => s.status === 'completed' && s.startTime >= weekAgo)
          .reduce((a, s) => a + Math.round(s.actualDurationSec / 60), 0) + durationMin;
      const weekTrees =
        trees.filter((t) => t.createdAt >= weekAgo).length + 1;

      checkAndSetRecord(
        'longest_session_min',
        durationMin,
        'Longest Focus Session',
        'أطول جلسة تركيز'
      );
      checkAndSetRecord(
        'highest_daily_min',
        newDailyMin,
        'Highest Daily Focus Time',
        'أعلى وقت تركيز يومي'
      );
      checkAndSetRecord(
        'highest_weekly_min',
        weekMin,
        'Highest Weekly Focus Time',
        'أعلى وقت تركيز أسبوعي'
      );
      checkAndSetRecord(
        'most_productive_month_min',
        totalFocusMinutesAll,
        'Most Productive Month',
        'الشهر الأكثر إنتاجية'
      );
      checkAndSetRecord(
        'most_trees_week',
        weekTrees,
        'Most Trees Planted in a Week',
        'أكثر أشجار مزروعة في أسبوع'
      );
      checkAndSetRecord(
        'longest_streak_days',
        nextLongestStreak,
        'Longest Study Streak',
        'أطول سلسلة أيام دراسة'
      );

      await localDb.records.bulkPut(Array.from(recMap.values()));

      if (brokenRecordNames.length > 0) {
        const bannerText: BilingualText = {
          en: `New Personal Record Achieved: ${brokenRecordNames.join(', ')}!`,
          ar: `رقم قياسي شخصي جديد: ${brokenRecordNames.join('، ')}!`,
        };
        setRecordCelebrationBanner(bannerText);
        await addNotification('PRODUCTIVITY', bannerText, {
          en: 'Your consistency has set a new personal milestone in your sanctuary.',
          ar: 'لقد سجلت إنجازاً قياسياً شخصياً جديداً في ملاذك.',
        }, 'achievements');
      }

      const speciesMeta =
        TREE_SPECIES_CATALOG.find((s) => s.id === completedState.speciesId) ||
        TREE_SPECIES_CATALOG[0];

      await addNotification(
        'TREE',
        {
          en: `${speciesMeta.name.en} Planted!`,
          ar: `تمت زراعة ${speciesMeta.name.ar}!`,
        },
        {
          en: `You focused for ${durationMin} minutes and earned +${baseCoins} Leaf Coins & +${basePoints} Points.`,
          ar: `ركزت لمدة ${durationMin} دقيقة وكسبت +${baseCoins} عملة ورقية و +${basePoints} نقطة.`,
        },
        'forest'
      );

      if (leveledUp) {
        await addNotification(
          'REWARDS',
          {
            en: `Level Up! You reached Level ${nextLevelInfo.level}`,
            ar: `ارتقيت للمستوى ${nextLevelInfo.level}!`,
          },
          {
            en: 'New tree species, forest sizes, and biomes are now available to unlock in the Marketplace.',
            ar: 'فصائل أشجار وأحجام غابات وبيئات جديدة متاحة الآن للفتح في المتجر.',
          },
          'marketplace'
        );
      }

      await reloadAllFromDb();

      setLastRewardSummary({
        sessionId: completedState.sessionId,
        focusedMinutes: durationMin,
        speciesId: completedState.speciesId,
        subjectId: completedState.subjectId,
        coinsEarned: baseCoins + bonusAchCoins,
        pointsEarned: basePoints + bonusAchPoints,
        xpEarned: baseXp + bonusAchPoints,
        leveledUp,
        newLevel: nextLevelInfo.level,
        diminishedApplied,
        newRecordsBroken: brokenRecordNames,
        placedInVault,
      });

      // Transition timer state (Auto-break if enabled, otherwise reset to ready)
      if (profile.autoStartBreaks) {
        setTimerState((prev) => ({
          ...prev,
          sessionId: `ses_${Date.now()}`,
          mode: 'short_break',
          status: 'running',
          startedAtTimestamp: Date.now(),
          accumulatedElapsedSec: 0,
          plannedDurationSec: profile.shortBreakMinutes * 60,
          sessionStartTimestamp: Date.now(),
        }));
      } else {
        setTimerState((prev) => ({
          ...prev,
          sessionId: `ses_${Date.now()}`,
          status: 'idle',
          startedAtTimestamp: null,
          accumulatedElapsedSec: 0,
          sessionStartTimestamp: null,
        }));
      }
    },
    [
      profile,
      sessions,
      trees,
      tasks,
      challenges,
      plans,
      addNotification,
      reloadAllFromDb,
    ]
  );

  // High-precision timestamp ticker while timer is running
  useEffect(() => {
    if (timerState.status !== 'running') return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      setNowTick(now);
      if (timerState.startedAtTimestamp) {
        const totalElapsed =
          timerState.accumulatedElapsedSec +
          (now - timerState.startedAtTimestamp) / 1000;
        if (totalElapsed >= timerState.plannedDurationSec) {
          handleCompleteSession(timerState);
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [timerState, handleCompleteSession]);

  // Language & Theme setters
  const setLanguage = useCallback(
    async (newLang: Language) => {
      if (!localDb) return;
      const updated = { ...profile, language: newLang };
      setProfile(updated);
      await localDb.profile.put(updated);
    },
    [profile]
  );

  const setTheme = useCallback(
    async (newTheme: ThemeMode) => {
      if (!localDb) return;
      const updated = { ...profile, theme: newTheme };
      setProfile(updated);
      await localDb.profile.put(updated);
    },
    [profile]
  );

  const updateProfileSettings = useCallback(
    async (patch: Partial<UserProfileAndSettings>) => {
      if (!localDb) return;
      const updated = { ...profile, ...patch };
      setProfile(updated);
      await localDb.profile.put(updated);
    },
    [profile]
  );

  // Timer Control Actions
  const setTimerMode = useCallback(
    (mode: TimerMode, customMinutes?: number) => {
      let durationSec = profile.defaultFocusMinutes * 60;
      if (mode === 'short_break') durationSec = profile.shortBreakMinutes * 60;
      else if (mode === 'long_break') durationSec = profile.longBreakMinutes * 60;
      else if (mode === 'custom' && customMinutes) durationSec = customMinutes * 60;

      setTimerState((prev) => ({
        ...prev,
        sessionId: `ses_${Date.now()}`,
        mode,
        status: 'idle',
        startedAtTimestamp: null,
        accumulatedElapsedSec: 0,
        plannedDurationSec: durationSec,
        sessionStartTimestamp: null,
      }));
    },
    [
      profile.defaultFocusMinutes,
      profile.shortBreakMinutes,
      profile.longBreakMinutes,
    ]
  );

  const setTimerSubject = useCallback((subjectId: string) => {
    setTimerState((prev) => ({ ...prev, subjectId }));
  }, []);

  const setTimerSpecies = useCallback(
    (speciesId: TreeSpeciesId) => {
      setTimerState((prev) => ({ ...prev, speciesId }));
      updateProfileSettings({ selectedSpecies: speciesId });
    },
    [updateProfileSettings]
  );

  const setTimerAmbientSound = useCallback(
    (ambientSound: ActiveTimerState['ambientSound']) => {
      setTimerState((prev) => ({ ...prev, ambientSound }));
    },
    []
  );

  const setTimerDistractionFree = useCallback((distractionFree: boolean) => {
    setTimerState((prev) => ({ ...prev, distractionFree }));
  }, []);

  const startTimer = useCallback(() => {
    const now = Date.now();
    soundEngine.playClickPop(profile.soundEnabled);
    setNowTick(now);
    setTimerState((prev) => ({
      ...prev,
      sessionId: prev.status === 'idle' ? `ses_${now}` : prev.sessionId,
      status: 'running',
      startedAtTimestamp: now,
      accumulatedElapsedSec: prev.status === 'idle' ? 0 : prev.accumulatedElapsedSec,
      sessionStartTimestamp: prev.sessionStartTimestamp || now,
    }));
  }, [profile.soundEnabled]);

  const pauseTimer = useCallback(() => {
    const now = Date.now();
    soundEngine.playClickPop(profile.soundEnabled);
    setTimerState((prev) => {
      if (prev.status !== 'running' || !prev.startedAtTimestamp) return prev;
      const delta = Math.max(0, (now - prev.startedAtTimestamp) / 1000);
      return {
        ...prev,
        status: 'paused',
        startedAtTimestamp: null,
        accumulatedElapsedSec: prev.accumulatedElapsedSec + delta,
      };
    });
  }, [profile.soundEnabled]);

  const resumeTimer = useCallback(() => {
    const now = Date.now();
    soundEngine.playClickPop(profile.soundEnabled);
    setNowTick(now);
    setTimerState((prev) => ({
      ...prev,
      status: 'running',
      startedAtTimestamp: now,
    }));
  }, [profile.soundEnabled]);

  const cancelTimer = useCallback(async () => {
    if (!localDb) return;
    soundEngine.stopAmbient();
    const now = Date.now();
    if (timerState.status !== 'idle' && timerState.mode === 'focus') {
      const actualSec = Math.round(elapsedSeconds);
      const cancelledSession: FocusSessionRecord = {
        id: timerState.sessionId,
        startTime: timerState.sessionStartTimestamp || now - actualSec * 1000,
        endTime: now,
        plannedDurationSec: timerState.plannedDurationSec,
        actualDurationSec: actualSec,
        status: 'cancelled',
        mode: timerState.mode,
        subjectId: timerState.subjectId,
        speciesId: timerState.speciesId,
        coinsEarned: 0,
        pointsEarned: 0,
        xpEarned: 0,
        treeId: null,
        rewardClaimed: false,
        dateStr: getTodayDateStr(new Date(now)),
      };
      await localDb.sessions.put(cancelledSession);
      await reloadAllFromDb();
    }
    setTimerState((prev) => ({
      ...prev,
      sessionId: `ses_${Date.now()}`,
      status: 'idle',
      startedAtTimestamp: null,
      accumulatedElapsedSec: 0,
      sessionStartTimestamp: null,
      distractionFree: false,
    }));
  }, [timerState, elapsedSeconds, reloadAllFromDb]);

  const resetTimer = useCallback(() => {
    soundEngine.stopAmbient();
    setTimerState((prev) => ({
      ...prev,
      sessionId: `ses_${Date.now()}`,
      status: 'idle',
      startedAtTimestamp: null,
      accumulatedElapsedSec: 0,
      sessionStartTimestamp: null,
    }));
  }, []);

  const skipBreak = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionId: `ses_${Date.now()}`,
      mode: 'focus',
      status: 'idle',
      startedAtTimestamp: null,
      accumulatedElapsedSec: 0,
      plannedDurationSec: profile.defaultFocusMinutes * 60,
      sessionStartTimestamp: null,
    }));
  }, [profile.defaultFocusMinutes]);

  // Relocate a tree inside the personal forest grid
  const relocateTreeSlot = useCallback(
    async (treeId: string, newSlotIndex: number) => {
      if (!localDb) return;
      const targetTree = trees.find((t) => t.id === treeId);
      if (!targetTree) return;
      await localDb.trees.put({
        ...targetTree,
        forestSizeId: profile.activeForestSize,
        slotIndex: newSlotIndex,
      });
      await reloadAllFromDb();
    },
    [trees, profile.activeForestSize, reloadAllFromDb]
  );

  // Marketplace Purchase Logic with strict validation
  const purchaseMarketplaceItem = useCallback(
    async (item: MarketplaceItemMeta): Promise<{ ok: boolean; message: string }> => {
      if (!localDb) return { ok: false, message: 'Database unavailable' };

      if (profile.level < item.requiredLevel) {
        return {
          ok: false,
          message:
            profile.language === 'ar'
              ? 'يجب الوصول إلى المستوى المطلوب أولاً'
              : `Requires Level ${item.requiredLevel}`,
        };
      }
      if (profile.leafCoins < item.priceCoins) {
        return {
          ok: false,
          message:
            profile.language === 'ar'
              ? 'رصيد عملات الورق غير كافٍ'
              : 'Insufficient Leaf Coins',
        };
      }

      const nextCoins = Math.max(0, profile.leafCoins - item.priceCoins);
      const updatedProfile = { ...profile, leafCoins: nextCoins };

      if (item.category === 'species') {
        const spId = item.refId as TreeSpeciesId;
        if (profile.ownedSpecies.includes(spId)) {
          return { ok: false, message: 'Already owned' };
        }
        updatedProfile.ownedSpecies = [...profile.ownedSpecies, spId];
        updatedProfile.selectedSpecies = spId;
      } else if (item.category === 'forests') {
        const isSize = FOREST_SIZES_CATALOG.some((f) => f.id === item.refId);
        if (isSize) {
          const fId = item.refId as ForestSizeId;
          if (profile.ownedForests.includes(fId)) {
            return { ok: false, message: 'Already owned' };
          }
          updatedProfile.ownedForests = [...profile.ownedForests, fId];
          updatedProfile.activeForestSize = fId;
        } else {
          const eId = item.refId as ForestEnvId;
          if (profile.ownedEnvironments.includes(eId)) {
            return { ok: false, message: 'Already owned' };
          }
          updatedProfile.ownedEnvironments = [...profile.ownedEnvironments, eId];
          updatedProfile.activeEnvironment = eId;
        }
      } else if (item.category === 'themes') {
        const thId = item.refId as AppThemeAccentId;
        if (profile.ownedThemes.includes(thId)) {
          return { ok: false, message: 'Already owned' };
        }
        updatedProfile.ownedThemes = [...profile.ownedThemes, thId];
        updatedProfile.accentTheme = thId;
      } else if (item.category === 'decorations') {
        const decId = item.refId as DecorationId;
        if (profile.ownedDecorations.includes(decId)) {
          return { ok: false, message: 'Already owned' };
        }
        updatedProfile.ownedDecorations = [...profile.ownedDecorations, decId];
      }

      await localDb.profile.put(updatedProfile);
      setProfile(updatedProfile);
      soundEngine.playCompletionChime(profile.soundEnabled);

      await addNotification(
        'REWARDS',
        {
          en: `Purchased: ${item.name.en}`,
          ar: `تم شراء: ${item.name.ar}`,
        },
        {
          en: `Unlocked for ${item.priceCoins} Leaf Coins and added to your sanctuary.`,
          ar: `تم فتحه مقابل ${item.priceCoins} عملة ورقية وإضافته إلى ملاذك.`,
        },
        item.category === 'species' ? 'collection' : 'forest'
      );

      return {
        ok: true,
        message:
          profile.language === 'ar'
            ? 'تم الشراء والفتح بنجاح!'
            : 'Successfully unlocked!',
      };
    },
    [profile, addNotification]
  );

  // Task CRUD & Completion
  const createTask = useCallback(
    async (data: {
      title: string;
      description: string;
      subjectId: string;
      priority: TaskPriority;
      dueDateStr: string;
      estimatedMinutes: number;
    }) => {
      if (!localDb || !data.title.trim()) return;
      const newTask: TaskRecord = {
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: data.title.trim(),
        description: data.description.trim(),
        subjectId: data.subjectId,
        priority: data.priority,
        dueDateStr: data.dueDateStr || getTodayDateStr(),
        completed: false,
        completedAt: null,
        createdAt: Date.now(),
        estimatedMinutes: Math.max(5, data.estimatedMinutes || 25),
        rewardClaimed: false,
      };
      await localDb.tasks.put(newTask);
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<TaskRecord>) => {
      if (!localDb) return;
      const existing = await localDb.tasks.get(id);
      if (!existing) return;
      await localDb.tasks.put({ ...existing, ...patch });
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  const toggleTaskComplete = useCallback(
    async (id: string) => {
      if (!localDb) return;
      const existing = await localDb.tasks.get(id);
      if (!existing) return;
      const nextCompleted = !existing.completed;
      const now = Date.now();
      const shouldReward = nextCompleted && !existing.rewardClaimed;

      await localDb.tasks.put({
        ...existing,
        completed: nextCompleted,
        completedAt: nextCompleted ? now : null,
        rewardClaimed: existing.rewardClaimed || shouldReward,
      });

      if (shouldReward) {
        soundEngine.playClickPop(profile.soundEnabled);
        const nextXp = profile.xp + 30;
        const lvlInfo = calculateLevelFromXp(nextXp);
        const updatedProf: UserProfileAndSettings = {
          ...profile,
          leafCoins: profile.leafCoins + 15,
          forestPoints: profile.forestPoints + 30,
          xp: nextXp,
          level: lvlInfo.level,
        };
        await localDb.profile.put(updatedProf);

        // Update task challenges
        const updatedChallenges = challenges.map((ch) => {
          if (ch.completed || ch.metric !== 'tasks_completed') return ch;
          const nextV = ch.currentValue + 1;
          return {
            ...ch,
            currentValue: nextV,
            completed: nextV >= ch.targetValue,
          };
        });
        await localDb.challenges.bulkPut(updatedChallenges);

        // Check Most Tasks in One Day personal record
        const todayStr = getTodayDateStr(new Date(now));
        const todayCompletedCount =
          tasks.filter(
            (t) =>
              t.completed &&
              t.completedAt &&
              getTodayDateStr(new Date(t.completedAt)) === todayStr
          ).length + 1;

        const rec = await localDb.records.get('most_tasks_day');
        if (rec && todayCompletedCount > rec.value) {
          await localDb.records.put({
            ...rec,
            previousValue: rec.value,
            value: todayCompletedCount,
            achievedAt: now,
          });
        }
      }

      await reloadAllFromDb();
    },
    [profile, challenges, tasks, reloadAllFromDb]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!localDb) return;
      await localDb.tasks.delete(id);
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  // Subject CRUD
  const createSubject = useCallback(
    async (data: { name: string; color: string; description: string }) => {
      if (!localDb || !data.name.trim()) return;
      const newSubj: SubjectRecord = {
        id: `subj_${Date.now()}`,
        name: data.name.trim(),
        color: data.color || '#3D7950',
        description: data.description.trim(),
        createdAt: Date.now(),
        isDefault: false,
      };
      await localDb.subjects.put(newSubj);
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  const updateSubject = useCallback(
    async (id: string, patch: Partial<SubjectRecord>) => {
      if (!localDb) return;
      const existing = await localDb.subjects.get(id);
      if (!existing) return;
      await localDb.subjects.put({ ...existing, ...patch });
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  const deleteSubject = useCallback(
    async (id: string) => {
      if (!localDb || subjects.length <= 1) return;
      await localDb.subjects.delete(id);
      await reloadAllFromDb();
    },
    [subjects.length, reloadAllFromDb]
  );

  // Study Planner Actions
  const createStudyPlan = useCallback(
    async (data: {
      dayOfWeek: number;
      subjectId: string;
      title: string;
      targetMinutes: number;
    }) => {
      if (!localDb || !data.title.trim()) return;
      const item: StudyPlanItem = {
        id: `plan_${Date.now()}`,
        dayOfWeek: data.dayOfWeek,
        subjectId: data.subjectId,
        title: data.title.trim(),
        targetMinutes: Math.max(10, data.targetMinutes || 30),
        completedMinutes: 0,
        completed: false,
      };
      await localDb.plans.put(item);
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  const toggleStudyPlanComplete = useCallback(
    async (id: string) => {
      if (!localDb) return;
      const existing = await localDb.plans.get(id);
      if (!existing) return;
      const nextDone = !existing.completed;
      await localDb.plans.put({
        ...existing,
        completed: nextDone,
        completedMinutes: nextDone ? existing.targetMinutes : 0,
      });
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  const deleteStudyPlan = useCallback(
    async (id: string) => {
      if (!localDb) return;
      await localDb.plans.delete(id);
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  // Challenges Actions
  const createCustomChallenge = useCallback(
    async (data: {
      title: string;
      metric: ChallengeRecord['metric'];
      targetValue: number;
      endDateStr: string;
    }) => {
      if (!localDb || !data.title.trim()) return;
      const target = Math.max(1, Math.min(50, data.targetValue || 5));
      const newChal: ChallengeRecord = {
        id: `chal_custom_${Date.now()}`,
        title: { en: data.title.trim(), ar: data.title.trim() },
        description: {
          en: `Personal custom challenge (${target} target).`,
          ar: `تحدٍ شخصي مخصص (الهدف: ${target}).`,
        },
        metric: data.metric,
        targetValue: target,
        currentValue: 0,
        startDateStr: getTodayDateStr(),
        endDateStr:
          data.endDateStr ||
          getTodayDateStr(new Date(Date.now() + 7 * 86400000)),
        rewardCoins: Math.min(300, target * 25),
        rewardPoints: Math.min(600, target * 50),
        completed: false,
        rewardClaimed: false,
        isCustom: true,
      };
      await localDb.challenges.put(newChal);
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  const claimChallengeReward = useCallback(
    async (challengeId: string) => {
      if (!localDb) return;
      const ch = await localDb.challenges.get(challengeId);
      if (!ch || !ch.completed || ch.rewardClaimed) return;

      await localDb.challenges.put({ ...ch, rewardClaimed: true });
      const nextXp = profile.xp + ch.rewardPoints;
      const lvl = calculateLevelFromXp(nextXp);
      await localDb.profile.put({
        ...profile,
        leafCoins: profile.leafCoins + ch.rewardCoins,
        forestPoints: profile.forestPoints + ch.rewardPoints,
        xp: nextXp,
        level: lvl.level,
      });
      soundEngine.playCompletionChime(profile.soundEnabled);
      await reloadAllFromDb();
    },
    [profile, reloadAllFromDb]
  );

  // Notifications Actions
  const markNotificationRead = useCallback(
    async (id: string) => {
      if (!localDb) return;
      const n = await localDb.notifications.get(id);
      if (!n) return;
      await localDb.notifications.put({ ...n, read: true });
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!localDb) return;
    const all = await localDb.notifications.toArray();
    await localDb.notifications.bulkPut(all.map((n) => ({ ...n, read: true })));
    await reloadAllFromDb();
  }, [reloadAllFromDb]);

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!localDb) return;
      await localDb.notifications.delete(id);
      await reloadAllFromDb();
    },
    [reloadAllFromDb]
  );

  const clearReadNotifications = useCallback(async () => {
    if (!localDb) return;
    const readIds = notifications.filter((n) => n.read).map((n) => n.id);
    await localDb.notifications.bulkDelete(readIds);
    await reloadAllFromDb();
  }, [notifications, reloadAllFromDb]);

  const createCustomReminder = useCallback(
    async (title: string, description: string) => {
      if (!title.trim()) return;
      await addNotification(
        'REMINDERS',
        { en: title.trim(), ar: title.trim() },
        {
          en: description.trim() || 'Scheduled personal study reminder.',
          ar: description.trim() || 'تذكير دراسي شخصي مجدول.',
        },
        'planner'
      );
    },
    [addNotification]
  );

  const requestBrowserNotifications = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      const granted = perm === 'granted';
      await updateProfileSettings({ browserNotificationsEnabled: granted });
      return granted;
    } catch {
      return false;
    }
  }, [updateProfileSettings]);

  // Computed Today Metrics & Focus Power (0 - 1000)
  const todayStr = getTodayDateStr();
  const todayCompletedSessionsList = useMemo(
    () =>
      sessions.filter(
        (s) => s.dateStr === todayStr && s.status === 'completed'
      ),
    [sessions, todayStr]
  );

  const todayFocusMinutes = useMemo(
    () =>
      todayCompletedSessionsList.reduce(
        (acc, s) => acc + Math.round(s.actualDurationSec / 60),
        0
      ),
    [todayCompletedSessionsList]
  );

  const todayCompletedSessions = todayCompletedSessionsList.length;
  const todayTreesPlanted = useMemo(
    () => trees.filter((t) => t.dateStr === todayStr).length,
    [trees, todayStr]
  );

  const focusPower = useMemo<FocusPowerBreakdown>(() => {
    const completedSes = sessions.filter((s) => s.status === 'completed');
    const totalMinutes = completedSes.reduce(
      (a, s) => a + Math.round(s.actualDurationSec / 60),
      0
    );

    // 1. Focus Time Factor (0..100, scales smoothly up to 600 min)
    const fFocusTime = Math.min(100, Math.round((totalMinutes / 600) * 100));

    // 2. Successful Session Rate (0..100)
    const fSessionRate =
      sessions.length > 0
        ? Math.round((completedSes.length / sessions.length) * 100)
        : 0;

    // 3. Daily Goal Completion (0..100)
    const goalTarget = Math.max(15, profile.dailyGoalMinutes);
    const fDailyGoals = Math.min(
      100,
      Math.round((todayFocusMinutes / goalTarget) * 100)
    );

    // 4. Consistency Factor (0..100 based on streak & active days in last 7 days)
    const fConsistency = Math.min(
      100,
      Math.round((profile.currentStreak / 7) * 100)
    );

    // 5. Completed Tasks Factor (0..100)
    const doneTasks = tasks.filter((t) => t.completed).length;
    const fCompletedTasks =
      tasks.length > 0
        ? Math.min(100, Math.round((doneTasks / tasks.length) * 100))
        : 0;

    // 6. Achievement Progress Factor (0..100)
    const fAchievements = Math.min(
      100,
      Math.round(
        (profile.unlockedAchievements.length / ACHIEVEMENTS_CATALOG.length) *
          100
      )
    );

    const w: FocusPowerWeights = profile.focusPowerWeights || {
      focusTime: 25,
      sessionRate: 15,
      dailyGoals: 20,
      consistency: 15,
      completedTasks: 10,
      achievements: 15,
    };
    const weightSum = Math.max(
      1,
      w.focusTime +
        w.sessionRate +
        w.dailyGoals +
        w.consistency +
        w.completedTasks +
        w.achievements
    );

    const weightedHundred =
      (fFocusTime * w.focusTime +
        fSessionRate * w.sessionRate +
        fDailyGoals * w.dailyGoals +
        fConsistency * w.consistency +
        fCompletedTasks * w.completedTasks +
        fAchievements * w.achievements) /
      weightSum;

    const totalScore = Math.min(1000, Math.round(weightedHundred * 10));

    return {
      totalScore,
      previousScore: profile.previousFocusPower || Math.max(0, totalScore - 35),
      factors: {
        focusTime: fFocusTime,
        sessionRate: fSessionRate,
        dailyGoals: fDailyGoals,
        consistency: fConsistency,
        completedTasks: fCompletedTasks,
        achievements: fAchievements,
      },
    };
  }, [sessions, tasks, profile, todayFocusMinutes]);

  // Export JSON
  const exportDataAsJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 'FOREST_PLUS_V1',
      profile,
      sessions,
      trees,
      tasks,
      subjects,
      plans,
      notifications,
      challenges,
      records,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forest-plus-backup-${getTodayDateStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    profile,
    sessions,
    trees,
    tasks,
    subjects,
    plans,
    notifications,
    challenges,
    records,
  ]);

  // Export Analytics CSV
  const exportAnalyticsAsCsv = useCallback(() => {
    const header =
      'SessionID,Date,SubjectID,Species,PlannedMinutes,ActualMinutes,Status,CoinsEarned,PointsEarned\n';
    const rows = sessions
      .map(
        (s) =>
          `${s.id},${s.dateStr},${s.subjectId},${s.speciesId},${Math.round(
            s.plannedDurationSec / 60
          )},${Math.round(s.actualDurationSec / 60)},${s.status},${
            s.coinsEarned
          },${s.pointsEarned}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forest-plus-analytics-${getTodayDateStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessions]);

  // Import JSON
  const importDataFromJson = useCallback(
    async (jsonString: string): Promise<boolean> => {
      if (!localDb) return false;
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || !parsed.profile) return false;
        await localDb.profile.put(parsed.profile);
        if (Array.isArray(parsed.sessions)) {
          await localDb.sessions.clear();
          await localDb.sessions.bulkPut(parsed.sessions);
        }
        if (Array.isArray(parsed.trees)) {
          await localDb.trees.clear();
          await localDb.trees.bulkPut(parsed.trees);
        }
        if (Array.isArray(parsed.tasks)) {
          await localDb.tasks.clear();
          await localDb.tasks.bulkPut(parsed.tasks);
        }
        if (Array.isArray(parsed.subjects)) {
          await localDb.subjects.clear();
          await localDb.subjects.bulkPut(parsed.subjects);
        }
        if (Array.isArray(parsed.plans)) {
          await localDb.plans.clear();
          await localDb.plans.bulkPut(parsed.plans);
        }
        if (Array.isArray(parsed.challenges)) {
          await localDb.challenges.clear();
          await localDb.challenges.bulkPut(parsed.challenges);
        }
        if (Array.isArray(parsed.records)) {
          await localDb.records.clear();
          await localDb.records.bulkPut(parsed.records);
        }
        await reloadAllFromDb();
        return true;
      } catch {
        return false;
      }
    },
    [reloadAllFromDb]
  );

  // Reset All Application Data
  const resetAllApplicationData = useCallback(async () => {
    if (!localDb) return;
    await Promise.all([
      localDb.profile.clear(),
      localDb.sessions.clear(),
      localDb.trees.clear(),
      localDb.tasks.clear(),
      localDb.subjects.clear(),
      localDb.plans.clear(),
      localDb.notifications.clear(),
      localDb.challenges.clear(),
      localDb.records.clear(),
    ]);
    localStorage.removeItem(TIMER_STORAGE_KEY);
    await ensureLocalDatabaseInitialized();
    await reloadAllFromDb();
  }, [reloadAllFromDb]);

  // Optional 1-Click Demo Seeder so users/testers can populate a rich 7-day forest & analytics
  const seedRichDemoSanctuary = useCallback(async () => {
    if (!localDb) return;
    const now = Date.now();
    const demoSpecies: TreeSpeciesId[] = [
      'oak',
      'pine',
      'maple',
      'birch',
      'cherry',
      'willow',
    ];
    const demoSubjects = [
      'subj_programming',
      'subj_ai',
      'subj_math',
      'subj_physics',
      'subj_arabic',
    ];

    const demoSessions: FocusSessionRecord[] = [];
    const demoTrees: PlantedTreeRecord[] = [];

    for (let i = 0; i < 8; i++) {
      const daysAgo = Math.floor(i / 2);
      const ts = now - daysAgo * 86400000 - (i % 2) * 7200000;
      const dStr = getTodayDateStr(new Date(ts));
      const durMin = [25, 45, 30, 50, 25, 40, 35, 60][i];
      const sp = demoSpecies[i % demoSpecies.length];
      const sb = demoSubjects[i % demoSubjects.length];
      const sesId = `ses_demo_${i}_${now}`;
      const trId = `tree_demo_${i}_${now}`;

      demoSessions.push({
        id: sesId,
        startTime: ts - durMin * 60000,
        endTime: ts,
        plannedDurationSec: durMin * 60,
        actualDurationSec: durMin * 60,
        status: 'completed',
        mode: 'focus',
        subjectId: sb,
        speciesId: sp,
        coinsEarned: Math.round(durMin * 2.2),
        pointsEarned: Math.round(durMin * 4.5),
        xpEarned: Math.round(durMin * 5),
        treeId: trId,
        rewardClaimed: true,
        dateStr: dStr,
      });

      demoTrees.push({
        id: trId,
        sessionId: sesId,
        speciesId: sp,
        subjectId: sb,
        createdAt: ts,
        dateStr: dStr,
        focusDurationSec: durMin * 60,
        growthStage: 'mature',
        forestSizeId: profile.activeForestSize,
        slotIndex: i,
        seedVariation: (i + 1) * 0.11,
      });
    }

    await localDb.sessions.bulkPut(demoSessions);
    await localDb.trees.bulkPut(demoTrees);

    const nextXp = profile.xp + 1450;
    const lvlInfo = calculateLevelFromXp(nextXp);
    await localDb.profile.put({
      ...profile,
      leafCoins: profile.leafCoins + 750,
      forestPoints: profile.forestPoints + 1450,
      xp: nextXp,
      level: lvlInfo.level,
      ownedSpecies: ['oak', 'pine', 'maple', 'birch', 'willow', 'cherry'],
      ownedDecorations: ['stone_lantern', 'campfire'],
      currentStreak: 4,
      longestStreak: 4,
      unlockedAchievements: [
        'ach_first_seed',
        'ach_five_sessions',
        'ach_streak_3',
        'ach_botanist_5',
        'ach_focus_300m',
      ],
    });

    await localDb.records.bulkPut([
      { id: 'longest_session_min', value: 60, previousValue: 45, achievedAt: now, unit: 'minutes' },
      { id: 'highest_daily_min', value: 95, previousValue: 50, achievedAt: now, unit: 'minutes' },
      { id: 'highest_weekly_min', value: 310, previousValue: 120, achievedAt: now, unit: 'minutes' },
      { id: 'most_productive_month_min', value: 310, previousValue: 0, achievedAt: now, unit: 'minutes' },
      { id: 'most_trees_week', value: 8, previousValue: 2, achievedAt: now, unit: 'trees' },
      { id: 'longest_streak_days', value: 4, previousValue: 1, achievedAt: now, unit: 'days' },
      { id: 'most_tasks_day', value: 3, previousValue: 1, achievedAt: now, unit: 'tasks' },
    ]);

    soundEngine.playCompletionChime(profile.soundEnabled);
    await reloadAllFromDb();
  }, [profile, reloadAllFromDb]);

  const value = useMemo<ForestEcosystemContextValue>(
    () => ({
      isReady,
      activeSection,
      setActiveSection,
      profile,
      lang: profile.language,
      t: TRANSLATIONS[profile.language] as unknown as (typeof TRANSLATIONS)['en'],
      setLanguage,
      setTheme,
      updateProfileSettings,
      sessions,
      trees,
      tasks,
      subjects,
      plans,
      notifications,
      challenges,
      records,
      timerState,
      elapsedSeconds,
      remainingSeconds,
      timerProgress,
      lastRewardSummary,
      clearRewardSummary: () => setLastRewardSummary(null),
      recordCelebrationBanner,
      clearCelebrationBanner: () => setRecordCelebrationBanner(null),
      setTimerMode,
      setTimerSubject,
      setTimerSpecies,
      setTimerAmbientSound,
      setTimerDistractionFree,
      startTimer,
      pauseTimer,
      resumeTimer,
      cancelTimer,
      resetTimer,
      skipBreak,
      relocateTreeSlot,
      purchaseMarketplaceItem,
      createTask,
      updateTask,
      toggleTaskComplete,
      deleteTask,
      createSubject,
      updateSubject,
      deleteSubject,
      createStudyPlan,
      toggleStudyPlanComplete,
      deleteStudyPlan,
      createCustomChallenge,
      claimChallengeReward,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      clearReadNotifications,
      createCustomReminder,
      requestBrowserNotifications,
      focusPower,
      todayFocusMinutes,
      todayCompletedSessions,
      todayTreesPlanted,
      exportDataAsJson,
      exportAnalyticsAsCsv,
      importDataFromJson,
      resetAllApplicationData,
      seedRichDemoSanctuary,
    }),
    [
      isReady,
      activeSection,
      profile,
      setLanguage,
      setTheme,
      updateProfileSettings,
      sessions,
      trees,
      tasks,
      subjects,
      plans,
      notifications,
      challenges,
      records,
      timerState,
      elapsedSeconds,
      remainingSeconds,
      timerProgress,
      lastRewardSummary,
      recordCelebrationBanner,
      setTimerMode,
      setTimerSubject,
      setTimerSpecies,
      setTimerAmbientSound,
      setTimerDistractionFree,
      startTimer,
      pauseTimer,
      resumeTimer,
      cancelTimer,
      resetTimer,
      skipBreak,
      relocateTreeSlot,
      purchaseMarketplaceItem,
      createTask,
      updateTask,
      toggleTaskComplete,
      deleteTask,
      createSubject,
      updateSubject,
      deleteSubject,
      createStudyPlan,
      toggleStudyPlanComplete,
      deleteStudyPlan,
      createCustomChallenge,
      claimChallengeReward,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      clearReadNotifications,
      createCustomReminder,
      requestBrowserNotifications,
      focusPower,
      todayFocusMinutes,
      todayCompletedSessions,
      todayTreesPlanted,
      exportDataAsJson,
      exportAnalyticsAsCsv,
      importDataFromJson,
      resetAllApplicationData,
      seedRichDemoSanctuary,
    ]
  );

  return (
    <ForestEcosystemContext.Provider value={value}>
      {children}
    </ForestEcosystemContext.Provider>
  );
}

export function useForestEcosystem(): ForestEcosystemContextValue {
  const ctx = useContext(ForestEcosystemContext);
  if (!ctx) {
    throw new Error('useForestEcosystem must be used inside ForestEcosystemProvider');
  }
  return ctx;
}
