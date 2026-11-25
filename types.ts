export type Language = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark';

export type NavSection =
  | 'dashboard'
  | 'timer'
  | 'forest'
  | 'collection'
  | 'marketplace'
  | 'tasks'
  | 'subjects'
  | 'planner'
  | 'calendar'
  | 'arena'
  | 'analytics'
  | 'achievements'
  | 'notifications'
  | 'profile'
  | 'settings';

export type TreeSpeciesId =
  | 'oak'
  | 'pine'
  | 'maple'
  | 'birch'
  | 'willow'
  | 'cherry'
  | 'redwood'
  | 'palm'
  | 'sakura'
  | 'magical';

export type TreeGrowthStage =
  | 'seed'
  | 'roots'
  | 'sprout'
  | 'sapling'
  | 'young'
  | 'mature';

export type ForestSizeId =
  | 'small'
  | 'medium'
  | 'large'
  | 'huge'
  | 'legendary';

export type ForestEnvId =
  | 'green_valley'
  | 'cherry_valley'
  | 'autumn_forest'
  | 'snowy_forest'
  | 'tropical_forest'
  | 'mystical_forest'
  | 'mountain_forest'
  | 'rainy_forest';

export type DecorationId =
  | 'stone_lantern'
  | 'wooden_bench'
  | 'koi_pond'
  | 'campfire'
  | 'torii_gate'
  | 'flower_arch'
  | 'crystal_obelisk'
  | 'birdhouse';

export type AppThemeAccentId =
  | 'emerald_sanctuary'
  | 'golden_canopy'
  | 'sakura_zen'
  | 'mystic_aurora';

export interface BilingualText {
  en: string;
  ar: string;
}

export interface TreeSpeciesMeta {
  id: TreeSpeciesId;
  name: BilingualText;
  scientificName: string;
  description: BilingualText;
  unlockRequirementText: BilingualText;
  priceCoins: number;
  requiredLevel: number;
  initiallyUnlocked: boolean;
  trunkColor: string;
  leafPrimaryColor: string;
  leafSecondaryColor: string;
  blossomColor?: string;
  heightScale: number;
  canopyShape: 'round' | 'conical' | 'weeping' | 'spreading' | 'palm' | 'crystal';
}

export interface ForestSizeMeta {
  id: ForestSizeId;
  name: BilingualText;
  description: BilingualText;
  capacity: number;
  gridCols: number;
  gridRows: number;
  priceCoins: number;
  requiredLevel: number;
  initiallyOwned: boolean;
  terrainRadius: number;
}

export interface ForestEnvironmentMeta {
  id: ForestEnvId;
  name: BilingualText;
  description: BilingualText;
  priceCoins: number;
  requiredLevel: number;
  initiallyOwned: boolean;
  groundColor: string;
  secondaryGroundColor: string;
  skyTopColor: string;
  skyBottomColor: string;
  waterColor: string;
  fogColor: string;
  wildlife: string[];
  weatherEffect?: 'petals' | 'snow' | 'rain' | 'fireflies' | 'sunbeams' | 'autumn_leaves';
}

export interface MarketplaceItemMeta {
  id: string;
  category: 'forests' | 'species' | 'themes' | 'decorations';
  refId: string;
  name: BilingualText;
  description: BilingualText;
  priceCoins: number;
  requiredLevel: number;
  initiallyOwned: boolean;
  previewColor: string;
  secondaryColor: string;
  badgeText?: BilingualText;
}

export type TimerMode = 'focus' | 'short_break' | 'long_break' | 'custom';

export interface ActiveTimerState {
  sessionId: string;
  mode: TimerMode;
  status: 'idle' | 'running' | 'paused';
  startedAtTimestamp: number | null; // epoch ms when current run started
  accumulatedElapsedSec: number; // elapsed seconds prior to current run
  plannedDurationSec: number;
  subjectId: string;
  speciesId: TreeSpeciesId;
  sessionStartTimestamp: number | null; // first start timestamp
  ambientSound: 'none' | 'rain' | 'wind' | 'stream' | 'night';
  distractionFree: boolean;
}

export interface FocusSessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  plannedDurationSec: number;
  actualDurationSec: number;
  status: 'completed' | 'cancelled';
  mode: TimerMode;
  subjectId: string;
  speciesId: TreeSpeciesId;
  coinsEarned: number;
  pointsEarned: number;
  xpEarned: number;
  treeId: string | null;
  rewardClaimed: boolean;
  dateStr: string; // YYYY-MM-DD
}

export interface PlantedTreeRecord {
  id: string;
  sessionId: string;
  speciesId: TreeSpeciesId;
  subjectId: string;
  createdAt: number;
  dateStr: string;
  focusDurationSec: number;
  growthStage: TreeGrowthStage;
  forestSizeId: ForestSizeId | 'vault'; // 'vault' if forest was at capacity
  slotIndex: number; // grid slot index inside personal forest
  seedVariation: number; // 0..1 deterministic procedural variation seed
  customNote?: string;
}

export interface PlacedDecoration {
  id: string;
  decorationId: DecorationId;
  slotIndex: number;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  priority: TaskPriority;
  dueDateStr: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
  estimatedMinutes: number;
  rewardClaimed: boolean;
}

export interface SubjectRecord {
  id: string;
  name: string;
  nameAr?: string;
  color: string;
  description: string;
  descriptionAr?: string;
  createdAt: number;
  isDefault?: boolean;
}

export interface StudyPlanItem {
  id: string;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  dateStr?: string; // optional specific date
  subjectId: string;
  taskId?: string;
  title: string;
  targetMinutes: number;
  completedMinutes: number;
  completed: boolean;
}

export type NotificationCategory =
  | 'FOCUS'
  | 'TREE'
  | 'REWARDS'
  | 'PRODUCTIVITY'
  | 'REMINDERS';

export interface NotificationRecord {
  id: string;
  category: NotificationCategory;
  titleKey?: string;
  descKey?: string;
  title: BilingualText;
  description: BilingualText;
  timestamp: number;
  read: boolean;
  actionSection?: NavSection;
  actionLabel?: BilingualText;
}

export interface ChallengeRecord {
  id: string;
  title: BilingualText;
  description: BilingualText;
  metric: 'trees_planted' | 'focus_sessions' | 'subjects_studied' | 'tasks_completed' | 'streak_days' | 'focus_minutes';
  targetValue: number;
  currentValue: number;
  startDateStr: string;
  endDateStr: string;
  rewardCoins: number;
  rewardPoints: number;
  completed: boolean;
  rewardClaimed: boolean;
  isCustom: boolean;
}

export interface PersonalRecordItem {
  id:
    | 'longest_session_min'
    | 'highest_daily_min'
    | 'highest_weekly_min'
    | 'most_productive_month_min'
    | 'most_trees_week'
    | 'longest_streak_days'
    | 'most_tasks_day';
  value: number;
  previousValue: number;
  achievedAt: number | null;
  unit: 'minutes' | 'trees' | 'days' | 'tasks';
}

export interface AchievementMeta {
  id: string;
  title: BilingualText;
  description: BilingualText;
  category: 'focus' | 'trees' | 'consistency' | 'tasks' | 'collection';
  metric: 'total_sessions' | 'total_trees' | 'streak_days' | 'total_tasks' | 'unlocked_species' | 'total_focus_min' | 'level_reached';
  targetValue: number;
  rewardCoins: number;
  rewardPoints: number;
  iconName: string;
}

export interface FocusPowerWeights {
  focusTime: number; // default 25
  sessionRate: number; // default 15
  dailyGoals: number; // default 20
  consistency: number; // default 15
  completedTasks: number; // default 10
  achievements: number; // default 15
}

export interface UserProfileAndSettings {
  id: string; // 'default_user'
  username: string;
  bio: string;
  avatarId: string;
  language: Language;
  theme: ThemeMode;
  accentTheme: AppThemeAccentId;
  leafCoins: number;
  forestPoints: number;
  xp: number;
  level: number;
  activeForestSize: ForestSizeId;
  activeEnvironment: ForestEnvId;
  selectedSpecies: TreeSpeciesId;
  ownedSpecies: TreeSpeciesId[];
  ownedForests: ForestSizeId[];
  ownedEnvironments: ForestEnvId[];
  ownedThemes: AppThemeAccentId[];
  ownedDecorations: DecorationId[];
  placedDecorations: { decorationId: DecorationId; x: number; z: number }[];
  unlockedAchievements: string[];
  // Timer Settings
  defaultFocusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  wildlifeEnabled: boolean;
  // Study Settings
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  defaultSubjectId: string;
  // Notification Settings
  browserNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  notifyCategories: Record<NotificationCategory, boolean>;
  studyReminderTime: string; // e.g., "18:00"
  // Focus Power Weights & History
  focusPowerWeights: FocusPowerWeights;
  previousFocusPower: number;
  lastActiveDateStr: string;
  currentStreak: number;
  longestStreak: number;
}
