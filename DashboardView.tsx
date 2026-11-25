'use client';

import React from 'react';
import { useForestEcosystem, calculateLevelFromXp } from '@/contexts/ForestEcosystemContext';
import {
  formatDurationMinutes,
  formatNumberLocale,
} from '@/translations';
import { ACHIEVEMENTS_CATALOG, TREE_SPECIES_CATALOG } from '@/domain/catalog';
import PersonalForestCanvas from '@/three/PersonalForestCanvas';
import {
  Award,
  Bell,
  CheckCircle2,
  Coins,
  Compass,
  Flame,
  Play,
  Sparkles,
  Sprout,
  Target,
  Timer,
  Trees,
  Zap,
} from 'lucide-react';

export default function DashboardView() {
  const {
    profile,
    lang,
    t,
    setActiveSection,
    trees,
    tasks,
    subjects,
    notifications,
    challenges,
    sessions,
    focusPower,
    todayFocusMinutes,
    todayCompletedSessions,
    todayTreesPlanted,
    toggleTaskComplete,
    seedRichDemoSanctuary,
  } = useForestEcosystem();

  const levelInfo = calculateLevelFromXp(profile.xp);
  const dailyGoalPct = Math.min(
    100,
    Math.round((todayFocusMinutes / Math.max(15, profile.dailyGoalMinutes)) * 100)
  );

  const activeForestTrees = trees.filter(
    (tr) => tr.forestSizeId === profile.activeForestSize
  );

  // Determine most studied subject today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCompletedList = sessions.filter(
    (s) => s.dateStr === todayStr && s.status === 'completed'
  );
  const subjectMinutesMap = new Map<string, number>();
  todayCompletedList.forEach((s) => {
    const mins = Math.round(s.actualDurationSec / 60);
    subjectMinutesMap.set(s.subjectId, (subjectMinutesMap.get(s.subjectId) || 0) + mins);
  });
  let topSubjectId: string | null = null;
  let topSubjectMins = 0;
  subjectMinutesMap.forEach((mins, sId) => {
    if (mins > topSubjectMins) {
      topSubjectMins = mins;
      topSubjectId = sId;
    }
  });
  const topSubjectObj = topSubjectId
    ? subjects.find((s) => s.id === topSubjectId)
    : null;
  const topSubjectLabel = topSubjectObj
    ? lang === 'ar' && topSubjectObj.nameAr
      ? topSubjectObj.nameAr
      : topSubjectObj.name
    : t.dashboard.noSubjectYet;

  const todayCoinsEarned = todayCompletedList.reduce(
    (a, s) => a + s.coinsEarned,
    0
  );
  const todayPointsEarned = todayCompletedList.reduce(
    (a, s) => a + s.pointsEarned,
    0
  );
  const todayTasksCompleted = tasks.filter(
    (tk) =>
      tk.completed &&
      tk.completedAt &&
      new Date(tk.completedAt).toISOString().split('T')[0] === todayStr
  ).length;

  // Bilingual Positive Daily Summary
  const dailySummaryParagraph =
    todayCompletedSessions > 0
      ? lang === 'ar'
        ? `اليوم ركزت لمدة ${formatDurationMinutes(
            todayFocusMinutes,
            'ar'
          )}، وأكملت ${formatNumberLocale(
            todayCompletedSessions,
            'ar'
          )} جلسات، وزرعت ${formatNumberLocale(
            todayTreesPlanted,
            'ar'
          )} أشجار في غابتك. استمر في هذا التوازن الرائع!`
        : `Today you focused for ${formatDurationMinutes(
            todayFocusMinutes,
            'en'
          )}, completed ${todayCompletedSessions} session${
            todayCompletedSessions === 1 ? '' : 's'
          }, and planted ${todayTreesPlanted} tree${
            todayTreesPlanted === 1 ? '' : 's'
          }. Your personal forest is thriving!`
      : lang === 'ar'
        ? 'لم تبدأ جلسات التركيز لهذا اليوم بعد. ازرع بذرتك الأولى اليوم لتنمية غابتك بهدوء وتركيز.'
        : 'You have not recorded a focus session today yet. Plant a seed whenever you are ready to begin your study flow.';

  const pendingTasks = tasks.filter((tk) => !tk.completed).slice(0, 4);
  const activeChallenges = challenges.slice(0, 3);
  const recentNotifs = notifications.slice(0, 3);

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Welcome Banner & Quick Focus Action */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#234B35] via-[#1C3D2B] to-[#14251B] text-[#FAF8EF] p-6 sm:p-8 shadow-lg border border-[#3D7950]/30">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3D7950]/35 border border-[#A9C7A4]/30 text-xs font-medium text-[#A9C7A4]">
              <Sprout className="w-3.5 h-3.5 text-[#D6B56D]" />
              <span>{t.app.tagline}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t.dashboard.welcomeBack}{' '}
              <span className="text-[#D6B56D]">{profile.username}</span>
            </h1>
            <p className="text-sm sm:text-base text-[#A9C7A4]/90">
              {t.dashboard.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSection('timer')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold bg-[#D6B56D] text-[#14251B] hover:bg-[#e0c380] transition-all shadow-md cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t.app.quickFocus}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('forest')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium bg-white/10 hover:bg-white/15 text-[#FAF8EF] border border-[#A9C7A4]/30 transition-all cursor-pointer"
            >
              <Trees className="w-4 h-4 text-[#A9C7A4]" />
              <span>{t.dashboard.exploreForest}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State Onboarding Banner if brand-new user has 0 trees */}
      {trees.length === 0 && (
        <div className="rounded-2xl p-6 border-2 border-dashed border-[#3D7950]/40 bg-[#FAF8EF] dark:bg-[#1D3326] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#234B35] dark:text-[#FAF8EF] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D6B56D]" />
              <span>{t.dashboard.emptyStateTitle}</span>
            </h2>
            <p className="text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
              {t.dashboard.emptyStateDesc}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection('timer')}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] transition-colors cursor-pointer"
            >
              {t.dashboard.plantFirstTreeBtn}
            </button>
            <button
              type="button"
              onClick={() => seedRichDemoSanctuary()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[#3D7950]/40 text-[#234B35] dark:text-[#A9C7A4] hover:bg-[#3D7950]/10 transition-colors cursor-pointer"
            >
              {t.dashboard.loadSampleDataBtn}
            </button>
          </div>
        </div>
      )}

      {/* Top 8 Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3.5">
        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
            <span>{t.dashboard.todaysFocus}</span>
            <Timer className="w-4 h-4 text-[#3D7950]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#16261C] dark:text-[#FAF8EF]">
            {formatDurationMinutes(todayFocusMinutes, lang)}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
            <span>{t.dashboard.completedSessions}</span>
            <CheckCircle2 className="w-4 h-4 text-[#3D7950]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#16261C] dark:text-[#FAF8EF]">
            {formatNumberLocale(
              sessions.filter((s) => s.status === 'completed').length,
              lang
            )}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
            <span>{t.dashboard.treesPlanted}</span>
            <Trees className="w-4 h-4 text-[#3D7950]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#16261C] dark:text-[#FAF8EF]">
            {formatNumberLocale(trees.length, lang)}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
            <span>{t.dashboard.currentStreak}</span>
            <Flame className="w-4 h-4 text-[#D9822B]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#16261C] dark:text-[#FAF8EF]">
            {formatNumberLocale(profile.currentStreak, lang)} {t.app.days}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
            <span>{t.dashboard.currentLevel}</span>
            <Award className="w-4 h-4 text-[#D6B56D]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#16261C] dark:text-[#FAF8EF]">
            {t.app.level} {formatNumberLocale(levelInfo.level, lang)}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
            <span>{t.dashboard.availableCoins}</span>
            <Coins className="w-4 h-4 text-[#D6B56D]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#16261C] dark:text-[#FAF8EF]">
            {formatNumberLocale(profile.leafCoins, lang)}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
            <span>{t.dashboard.availablePoints}</span>
            <Sparkles className="w-4 h-4 text-[#3D7950]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#16261C] dark:text-[#FAF8EF]">
            {formatNumberLocale(profile.forestPoints, lang)}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
            <span>{t.dashboard.dailyGoalProgress}</span>
            <Target className="w-4 h-4 text-[#3D7950]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#16261C] dark:text-[#FAF8EF]">
            {formatNumberLocale(dailyGoalPct, lang)}%
          </div>
        </div>
      </div>

      {/* Main Bento Grid: 3D Personal Forest Preview + Focus Power & Daily Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Interactive 3D Personal Forest Preview */}
        <div className="lg:col-span-7 rounded-2xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2">
                <Trees className="w-5 h-5 text-[#3D7950]" />
                <span>{t.dashboard.forestPreviewTitle}</span>
              </h2>
              <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
                {formatNumberLocale(activeForestTrees.length, lang)}{' '}
                {t.app.trees} • {TREE_SPECIES_CATALOG.find((s) => s.id === profile.selectedSpecies)?.name[lang]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('forest')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] transition-colors cursor-pointer"
            >
              {t.dashboard.exploreForest}
            </button>
          </div>

          <PersonalForestCanvas
            forestSizeId={profile.activeForestSize}
            environmentId={profile.activeEnvironment}
            trees={activeForestTrees}
            decorations={profile.ownedDecorations}
            selectedTreeId={null}
            onSelectTree={() => setActiveSection('forest')}
            wildlifeEnabled={profile.wildlifeEnabled}
            animationsEnabled={profile.animationsEnabled}
            heightClass="h-[310px]"
          />
        </div>

        {/* Right 5 Columns: Focus Power Score + Daily Productivity Report */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Focus Power Score Card */}
          <div className="rounded-2xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#D6B56D]" />
                  <span>{t.dashboard.focusPowerTitle}</span>
                </h2>
                <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
                  {t.dashboard.focusPowerSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('analytics')}
                className="text-xs font-semibold text-[#3D7950] dark:text-[#D6B56D] hover:underline cursor-pointer"
              >
                {t.dashboard.viewAll}
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#234B35] to-[#14251B] text-[#FAF8EF] flex flex-col items-center justify-center border border-[#D6B56D]/40 shrink-0">
                <span className="text-2xl font-extrabold font-mono text-[#D6B56D]">
                  {formatNumberLocale(focusPower.totalScore, lang)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#A9C7A4]">
                  / {formatNumberLocale(1000, lang)}
                </span>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#4A5E50] dark:text-[#A9C7A4]">
                      {t.analytics.factorFocusTime}
                    </span>
                    <span className="font-mono font-semibold">
                      {formatNumberLocale(focusPower.factors.focusTime, lang)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#234B35]/15 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#3D7950]"
                      style={{ width: `${focusPower.factors.focusTime}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#4A5E50] dark:text-[#A9C7A4]">
                      {t.analytics.factorDailyGoals}
                    </span>
                    <span className="font-mono font-semibold">
                      {formatNumberLocale(focusPower.factors.dailyGoals, lang)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#234B35]/15 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#D6B56D]"
                      style={{ width: `${focusPower.factors.dailyGoals}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#4A5E50] dark:text-[#A9C7A4]">
                      {t.analytics.factorConsistency}
                    </span>
                    <span className="font-mono font-semibold">
                      {formatNumberLocale(focusPower.factors.consistency, lang)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#234B35]/15 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#529466]"
                      style={{ width: `${focusPower.factors.consistency}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 19: Daily Productivity Report Card */}
          <div className="rounded-2xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#3D7950]" />
                <span>{t.dashboard.dailyReportTitle}</span>
              </h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#3D7950]/15 text-[#234B35] dark:text-[#A9C7A4]">
                {formatDurationMinutes(todayFocusMinutes, lang)} /{' '}
                {formatDurationMinutes(profile.dailyGoalMinutes, lang)}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[#234B35] dark:text-[#A9C7A4] bg-[#234B35]/5 dark:bg-white/5 p-3 rounded-xl border border-[#3D7950]/20">
              {dailySummaryParagraph}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]/60">
                <div className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
                  {t.dashboard.mostStudiedSubject}
                </div>
                <div className="text-xs font-bold truncate mt-0.5">
                  {topSubjectLabel}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]/60">
                <div className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
                  {t.app.leafCoins}
                </div>
                <div className="text-xs font-bold font-mono text-[#D6B56D] mt-0.5">
                  +{formatNumberLocale(todayCoinsEarned, lang)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]/60">
                <div className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
                  {t.app.tasks} / {t.app.forestPoints}
                </div>
                <div className="text-xs font-bold font-mono mt-0.5">
                  {formatNumberLocale(todayTasksCompleted, lang)} • +
                  {formatNumberLocale(todayPointsEarned, lang)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3 Columns: Upcoming Tasks, Current Challenges, Achievements & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Study Tasks */}
        <div className="rounded-2xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#16261C] dark:text-[#FAF8EF]">
              {t.dashboard.upcomingTasks}
            </h3>
            <button
              type="button"
              onClick={() => setActiveSection('tasks')}
              className="text-xs font-semibold text-[#3D7950] dark:text-[#D6B56D] hover:underline cursor-pointer"
            >
              {t.dashboard.viewAll}
            </button>
          </div>
          <div className="space-y-2">
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4] py-4 text-center">
                {t.tasks.emptyTasks}
              </p>
            ) : (
              pendingTasks.map((tk) => {
                const subj = subjects.find((s) => s.id === tk.subjectId);
                return (
                  <div
                    key={tk.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]/60 border border-[#234B35]/10"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskComplete(tk.id)}
                        className="w-4 h-4 rounded border border-[#3D7950] flex items-center justify-center hover:bg-[#3D7950]/20 shrink-0 cursor-pointer"
                        title={t.app.completed}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{tk.title}</p>
                        <span
                          className="inline-block text-[10px] px-1.5 py-0.2 rounded font-medium text-white mt-0.5"
                          style={{ backgroundColor: subj?.color || '#3D7950' }}
                        >
                          {lang === 'ar' && subj?.nameAr ? subj.nameAr : subj?.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[#4A5E50] dark:text-[#A9C7A4] shrink-0">
                      {tk.dueDateStr}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Current Challenges */}
        <div className="rounded-2xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#16261C] dark:text-[#FAF8EF]">
              {t.dashboard.activeChallenges}
            </h3>
            <button
              type="button"
              onClick={() => setActiveSection('achievements')}
              className="text-xs font-semibold text-[#3D7950] dark:text-[#D6B56D] hover:underline cursor-pointer"
            >
              {t.dashboard.viewAll}
            </button>
          </div>
          <div className="space-y-2.5">
            {activeChallenges.map((ch) => {
              const pct = Math.min(
                100,
                Math.round((ch.currentValue / Math.max(1, ch.targetValue)) * 100)
              );
              return (
                <div
                  key={ch.id}
                  className="p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]/60 border border-[#234B35]/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold truncate">
                      {ch.title[lang]}
                    </span>
                    <span className="font-mono text-[11px] text-[#3D7950] dark:text-[#D6B56D]">
                      {formatNumberLocale(ch.currentValue, lang)}/
                      {formatNumberLocale(ch.targetValue, lang)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#234B35]/15 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#3D7950] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Achievements & Notifications */}
        <div className="rounded-2xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#16261C] dark:text-[#FAF8EF]">
              {t.dashboard.recentNotifications}
            </h3>
            <button
              type="button"
              onClick={() => setActiveSection('notifications')}
              className="text-xs font-semibold text-[#3D7950] dark:text-[#D6B56D] hover:underline cursor-pointer"
            >
              {t.dashboard.viewAll}
            </button>
          </div>
          <div className="space-y-2">
            {recentNotifs.map((n) => (
              <div
                key={n.id}
                className="p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]/60 border border-[#234B35]/10 flex items-start gap-2.5"
              >
                <Bell className="w-4 h-4 text-[#D6B56D] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {n.title[lang]}
                  </p>
                  <p className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4] line-clamp-2">
                    {n.description[lang]}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-1 border-t border-[#234B35]/10 flex items-center justify-between text-xs">
            <span className="text-[#4A5E50] dark:text-[#A9C7A4]">
              {t.dashboard.recentAchievements}
            </span>
            <span className="font-mono font-bold text-[#3D7950] dark:text-[#D6B56D]">
              {formatNumberLocale(profile.unlockedAchievements.length, lang)} /{' '}
              {formatNumberLocale(ACHIEVEMENTS_CATALOG.length, lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
