import Dexie, { type Table } from 'dexie';
import {
  ChallengeRecord,
  FocusSessionRecord,
  NotificationRecord,
  PersonalRecordItem,
  PlantedTreeRecord,
  StudyPlanItem,
  SubjectRecord,
  TaskRecord,
  UserProfileAndSettings,
} from '@/domain/types';
import { createDefaultChallenges, DEFAULT_SUBJECTS } from '@/domain/catalog';

export class ForestPlusLocalDB extends Dexie {
  profile!: Table<UserProfileAndSettings, string>;
  sessions!: Table<FocusSessionRecord, string>;
  trees!: Table<PlantedTreeRecord, string>;
  tasks!: Table<TaskRecord, string>;
  subjects!: Table<SubjectRecord, string>;
  plans!: Table<StudyPlanItem, string>;
  notifications!: Table<NotificationRecord, string>;
  challenges!: Table<ChallengeRecord, string>;
  records!: Table<PersonalRecordItem, string>;

  constructor() {
    super('ForestPlusEcosystemDB_v1');
    this.version(1).stores({
      profile: 'id',
      sessions: 'id, startTime, dateStr, subjectId, status',
      trees: 'id, sessionId, speciesId, subjectId, dateStr, forestSizeId, slotIndex',
      tasks: 'id, subjectId, priority, dueDateStr, completed',
      subjects: 'id, name',
      plans: 'id, dayOfWeek, subjectId, completed',
      notifications: 'id, category, timestamp, read',
      challenges: 'id, metric, completed',
      records: 'id',
    });
  }
}

export const localDb = typeof window !== 'undefined' ? new ForestPlusLocalDB() : null;

export function getTodayDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultProfile(): UserProfileAndSettings {
  const savedLang =
    typeof window !== 'undefined'
      ? (localStorage.getItem('forest_plus_lang') as 'en' | 'ar' | null)
      : null;
  const savedTheme =
    typeof window !== 'undefined'
      ? (localStorage.getItem('forest_plus_theme') as 'light' | 'dark' | null)
      : null;

  return {
    id: 'default_user',
    username: 'Sanctuary Scholar',
    bio: 'Growing focus one living tree at a time.',
    avatarId: 'oak_guardian',
    language: savedLang === 'ar' ? 'ar' : 'en',
    theme: savedTheme === 'dark' ? 'dark' : 'light',
    accentTheme: 'emerald_sanctuary',
    leafCoins: 180,
    forestPoints: 120,
    xp: 120,
    level: 1,
    activeForestSize: 'small',
    activeEnvironment: 'green_valley',
    selectedSpecies: 'oak',
    ownedSpecies: ['oak', 'pine', 'maple'],
    ownedForests: ['small'],
    ownedEnvironments: ['green_valley'],
    ownedThemes: ['emerald_sanctuary'],
    ownedDecorations: [],
    placedDecorations: [],
    unlockedAchievements: [],
    defaultFocusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
    animationsEnabled: true,
    wildlifeEnabled: true,
    dailyGoalMinutes: 90,
    weeklyGoalMinutes: 450,
    defaultSubjectId: 'subj_programming',
    browserNotificationsEnabled: false,
    inAppNotificationsEnabled: true,
    notifyCategories: {
      FOCUS: true,
      TREE: true,
      REWARDS: true,
      PRODUCTIVITY: true,
      REMINDERS: true,
    },
    studyReminderTime: '18:00',
    focusPowerWeights: {
      focusTime: 25,
      sessionRate: 15,
      dailyGoals: 20,
      consistency: 15,
      completedTasks: 10,
      achievements: 15,
    },
    previousFocusPower: 0,
    lastActiveDateStr: getTodayDateStr(),
    currentStreak: 0,
    longestStreak: 0,
  };
}

export function createDefaultPersonalRecords(): PersonalRecordItem[] {
  return [
    { id: 'longest_session_min', value: 0, previousValue: 0, achievedAt: null, unit: 'minutes' },
    { id: 'highest_daily_min', value: 0, previousValue: 0, achievedAt: null, unit: 'minutes' },
    { id: 'highest_weekly_min', value: 0, previousValue: 0, achievedAt: null, unit: 'minutes' },
    { id: 'most_productive_month_min', value: 0, previousValue: 0, achievedAt: null, unit: 'minutes' },
    { id: 'most_trees_week', value: 0, previousValue: 0, achievedAt: null, unit: 'trees' },
    { id: 'longest_streak_days', value: 0, previousValue: 0, achievedAt: null, unit: 'days' },
    { id: 'most_tasks_day', value: 0, previousValue: 0, achievedAt: null, unit: 'tasks' },
  ];
}

export async function ensureLocalDatabaseInitialized(): Promise<void> {
  if (!localDb) return;

  const existingProfile = await localDb.profile.get('default_user');
  if (!existingProfile) {
    await localDb.profile.put(createDefaultProfile());
  }

  const subjectCount = await localDb.subjects.count();
  if (subjectCount === 0) {
    await localDb.subjects.bulkPut(DEFAULT_SUBJECTS);
  }

  const challengeCount = await localDb.challenges.count();
  if (challengeCount === 0) {
    await localDb.challenges.bulkPut(createDefaultChallenges());
  }

  const recordsCount = await localDb.records.count();
  if (recordsCount === 0) {
    await localDb.records.bulkPut(createDefaultPersonalRecords());
  }

  const notifCount = await localDb.notifications.count();
  if (notifCount === 0) {
    await localDb.notifications.put({
      id: 'notif_welcome_1',
      category: 'FOCUS',
      title: {
        en: 'Welcome to FOREST+ Sanctuary',
        ar: 'مرحباً بك في ملاذ FOREST+ البيئي',
      },
      description: {
        en: 'Your personal local-first focus ecosystem is ready. Plant your first 3D tree in the Focus Timer!',
        ar: 'نظام التركيز الشخصي الخاص بك جاهز للعمل محلياً. ازرع شجرتك الأولى ثلاثية الأبعاد في مؤقت التركيز!',
      },
      timestamp: Date.now(),
      read: false,
      actionSection: 'timer',
      actionLabel: { en: 'Open Focus Timer', ar: 'افتح مؤقت التركيز' },
    });
  }

  const taskCount = await localDb.tasks.count();
  if (taskCount === 0) {
    const todayStr = getTodayDateStr();
    const tomorrowStr = getTodayDateStr(new Date(Date.now() + 86400000));
    await localDb.tasks.bulkPut([
      {
        id: 'task_initial_1',
        title: 'Complete a 25-minute deep focus session',
        description: 'Grow your first procedural 3D tree in the sanctuary.',
        subjectId: 'subj_programming',
        priority: 'high',
        dueDateStr: todayStr,
        completed: false,
        completedAt: null,
        createdAt: Date.now() - 3600000,
        estimatedMinutes: 25,
        rewardClaimed: false,
      },
      {
        id: 'task_initial_2',
        title: 'Review neural network backpropagation notes',
        description: 'Summarize gradient descent derivations and matrix dimensions.',
        subjectId: 'subj_ai',
        priority: 'medium',
        dueDateStr: todayStr,
        completed: false,
        completedAt: null,
        createdAt: Date.now() - 7200000,
        estimatedMinutes: 45,
        rewardClaimed: false,
      },
      {
        id: 'task_initial_3',
        title: 'Solve linear algebra eigenvalue problem set',
        description: 'Complete exercises 1 through 8 with full proofs.',
        subjectId: 'subj_math',
        priority: 'high',
        dueDateStr: tomorrowStr,
        completed: false,
        completedAt: null,
        createdAt: Date.now() - 10800000,
        estimatedMinutes: 50,
        rewardClaimed: false,
      },
    ]);
  }

  const planCount = await localDb.plans.count();
  if (planCount === 0) {
    const todayDow = new Date().getDay();
    await localDb.plans.bulkPut([
      {
        id: 'plan_init_1',
        dayOfWeek: todayDow,
        subjectId: 'subj_programming',
        title: 'Full-Stack Architecture & TypeScript Deep Work',
        targetMinutes: 50,
        completedMinutes: 0,
        completed: false,
      },
      {
        id: 'plan_init_2',
        dayOfWeek: (todayDow + 1) % 7,
        subjectId: 'subj_math',
        title: 'Multivariable Calculus & Problem Solving',
        targetMinutes: 45,
        completedMinutes: 0,
        completed: false,
      },
      {
        id: 'plan_init_3',
        dayOfWeek: (todayDow + 2) % 7,
        subjectId: 'subj_ai',
        title: 'Transformer Attention Mechanisms Study',
        targetMinutes: 60,
        completedMinutes: 0,
        completed: false,
      },
    ]);
  }
}
