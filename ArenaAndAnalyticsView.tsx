'use client';

import React, { useState } from 'react';
import { useForestEcosystem } from '@/contexts/ForestEcosystemContext';
import { ACHIEVEMENTS_CATALOG, TREE_SPECIES_CATALOG } from '@/domain/catalog';
import { getTodayDateStr } from '@/db/localDb';
import {
  formatDurationMinutes,
  formatNumberLocale,
} from '@/translations';
import {
  Award,
  BarChart3,
  Crown,
  Flame,
  ShieldCheck,
  Sparkles,
  Trees,
  Trophy,
  Zap,
} from 'lucide-react';

export function FocusArenaView() {
  const {
    profile,
    lang,
    t,
    sessions,
    trees,
    records,
    focusPower,
  } = useForestEcosystem();

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalFocusMinutes = completedSessions.reduce(
    (a, s) => a + Math.round(s.actualDurationSec / 60),
    0
  );
  const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10;

  const getRecordValue = (id: string) =>
    records.find((r) => r.id === id)?.value || 0;

  const getPersonalTier = (ratio: number) => {
    if (ratio >= 1.0) return { name: t.arena.tierLegend, rank: '#1 (MAX)', color: '#D6B56D' };
    if (ratio >= 0.75) return { name: t.arena.tierMaster, rank: 'Tier IV', color: '#3D7950' };
    if (ratio >= 0.45) return { name: t.arena.tierGuardian, rank: 'Tier III', color: '#529466' };
    if (ratio >= 0.2) return { name: t.arena.tierSapling, rank: 'Tier II', color: '#84A950' };
    return { name: t.arena.tierSeedling, rank: 'Tier I', color: '#A9C7A4' };
  };

  const arenaCategories = [
    {
      id: 'most_hours',
      title: t.arena.catMostHours,
      statText: `${formatNumberLocale(totalFocusHours, lang)} ${t.app.hours}`,
      progress: Math.min(1, totalFocusMinutes / 600),
      targetDesc: `${formatNumberLocale(totalFocusMinutes, lang)} / ${formatNumberLocale(600, lang)} ${t.app.minutes}`,
      icon: Zap,
    },
    {
      id: 'most_trees',
      title: t.arena.catMostTrees,
      statText: `${formatNumberLocale(trees.length, lang)} ${t.app.trees}`,
      progress: Math.min(1, trees.length / 25),
      targetDesc: `${formatNumberLocale(trees.length, lang)} / ${formatNumberLocale(25, lang)} ${t.app.trees}`,
      icon: Trees,
    },
    {
      id: 'most_consistent',
      title: t.arena.catMostConsistent,
      statText: `${formatNumberLocale(focusPower.factors.consistency, lang)}%`,
      progress: focusPower.factors.consistency / 100,
      targetDesc: `Focus Power: ${formatNumberLocale(focusPower.totalScore, lang)}/1000`,
      icon: ShieldCheck,
    },
    {
      id: 'daily_champion',
      title: t.arena.catDailyChampion,
      statText: formatDurationMinutes(
        Math.max(getRecordValue('highest_daily_min'), 0),
        lang
      ),
      progress: Math.min(1, getRecordValue('highest_daily_min') / 180),
      targetDesc: `${formatNumberLocale(getRecordValue('highest_daily_min'), lang)} / 180 ${t.app.minutes}`,
      icon: Crown,
    },
    {
      id: 'weekly_champion',
      title: t.arena.catWeeklyChampion,
      statText: formatDurationMinutes(
        Math.max(getRecordValue('highest_weekly_min'), 0),
        lang
      ),
      progress: Math.min(1, getRecordValue('highest_weekly_min') / 600),
      targetDesc: `${formatNumberLocale(getRecordValue('highest_weekly_min'), lang)} / 600 ${t.app.minutes}`,
      icon: Trophy,
    },
    {
      id: 'monthly_champion',
      title: t.arena.catMonthlyChampion,
      statText: formatDurationMinutes(
        Math.max(getRecordValue('most_productive_month_min'), totalFocusMinutes),
        lang
      ),
      progress: Math.min(1, totalFocusMinutes / 1200),
      targetDesc: `${formatNumberLocale(totalFocusMinutes, lang)} / 1200 ${t.app.minutes}`,
      icon: Award,
    },
    {
      id: 'best_streak',
      title: t.arena.catBestStreak,
      statText: `${formatNumberLocale(
        Math.max(profile.longestStreak, profile.currentStreak),
        lang
      )} ${t.app.days}`,
      progress: Math.min(
        1,
        Math.max(profile.longestStreak, profile.currentStreak) / 14
      ),
      targetDesc: `${formatNumberLocale(profile.currentStreak, lang)} / 14 ${t.app.days}`,
      icon: Flame,
    },
    {
      id: 'most_achievements',
      title: t.arena.catMostAchievements,
      statText: `${formatNumberLocale(
        profile.unlockedAchievements.length,
        lang
      )} / ${formatNumberLocale(ACHIEVEMENTS_CATALOG.length, lang)}`,
      progress:
        profile.unlockedAchievements.length / ACHIEVEMENTS_CATALOG.length,
      targetDesc: `${Math.round(
        (profile.unlockedAchievements.length / ACHIEVEMENTS_CATALOG.length) * 100
      )}% Unlocked`,
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Arena Header with Mandatory PERSONAL RANKINGS Badge */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#234B35] via-[#1B3A29] to-[#14251B] text-[#FAF8EF] border border-[#D6B56D]/40 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider bg-[#D6B56D] text-[#14251B]">
            {t.arena.personalBadge}
          </span>
          <span className="text-xs font-mono text-[#A9C7A4]">
            {profile.username} • {t.app.level}{' '}
            {formatNumberLocale(profile.level, lang)}
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-[#D6B56D]" />
            <span>{t.arena.title}</span>
          </h1>
          <p className="text-sm text-[#A9C7A4] max-w-3xl">{t.arena.subtitle}</p>
        </div>

        {/* Summary Personal Identity Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-[#A9C7A4] block">
              {t.app.level}
            </span>
            <strong className="text-lg font-mono text-[#D6B56D]">
              {formatNumberLocale(profile.level, lang)}
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-[#A9C7A4] block">
              {t.profile.lifetimeHours}
            </span>
            <strong className="text-lg font-mono">
              {formatNumberLocale(totalFocusHours, lang)}h
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-[#A9C7A4] block">
              {t.dashboard.treesPlanted}
            </span>
            <strong className="text-lg font-mono">
              {formatNumberLocale(trees.length, lang)}
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-[#A9C7A4] block">
              {t.dashboard.currentStreak}
            </span>
            <strong className="text-lg font-mono">
              {formatNumberLocale(profile.currentStreak, lang)} {t.app.days}
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-[#A9C7A4] block">
              {t.nav.achievements}
            </span>
            <strong className="text-lg font-mono text-[#D6B56D]">
              {formatNumberLocale(profile.unlockedAchievements.length, lang)}
            </strong>
          </div>
        </div>
      </div>

      {/* 8 Personal Ranking Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {arenaCategories.map((cat) => {
          const Icon = cat.icon;
          const tier = getPersonalTier(cat.progress);
          const pct = Math.min(100, Math.round(cat.progress * 100));

          return (
            <div
              key={cat.id}
              className="rounded-3xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 dark:border-[#A9C7A4]/15 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#234B35] text-[#D6B56D] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white"
                    style={{ backgroundColor: tier.color }}
                  >
                    {tier.rank} • {tier.name}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#4A5E50] dark:text-[#A9C7A4]">
                    {cat.title}
                  </h3>
                  <div className="text-2xl font-extrabold font-mono text-[#16261C] dark:text-[#FAF8EF] mt-1">
                    {cat.statText}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#234B35]/10">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#4A5E50] dark:text-[#A9C7A4]">
                    {t.arena.nextTierTarget}
                  </span>
                  <span className="font-mono font-semibold">{cat.targetDesc}</span>
                </div>
                <div className="h-2 rounded-full bg-[#234B35]/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: tier.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center text-[#4A5E50] dark:text-[#A9C7A4]">
        {t.arena.honestNotice}
      </p>
    </div>
  );
}

export function AnalyticsView() {
  const {
    profile,
    lang,
    t,
    sessions,
    trees,
    tasks,
    subjects,
    focusPower,
    todayFocusMinutes,
    todayCompletedSessions,
    todayTreesPlanted,
    updateProfileSettings,
  } = useForestEcosystem();

  const [tab, setTab] = useState<'weekly' | 'monthly' | 'focus_power'>('weekly');

  const completedSessions = sessions.filter((s) => s.status === 'completed');

  // Build Last 7 Days Daily Breakdown
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dStr = getTodayDateStr(d);
    const dayMins = completedSessions
      .filter((s) => s.dateStr === dStr)
      .reduce((a, s) => a + Math.round(s.actualDurationSec / 60), 0);
    const dayTrees = trees.filter((tr) => tr.dateStr === dStr).length;
    const label = t.planner.daysShort[d.getDay()];
    return { dateStr: dStr, label, minutes: dayMins, trees: dayTrees };
  });

  const maxDayMins = Math.max(60, ...last7Days.map((d) => d.minutes));
  const weeklyTotalMins = last7Days.reduce((a, d) => a + d.minutes, 0);
  const weeklyTotalTrees = last7Days.reduce((a, d) => a + d.trees, 0);
  const bestDay = [...last7Days].sort((a, b) => b.minutes - a.minutes)[0];

  // Subject Distribution
  const subjectStats = subjects.map((sub) => {
    const mins = completedSessions
      .filter((s) => s.subjectId === sub.id)
      .reduce((a, s) => a + Math.round(s.actualDurationSec / 60), 0);
    return {
      id: sub.id,
      name: lang === 'ar' && sub.nameAr ? sub.nameAr : sub.name,
      color: sub.color,
      minutes: mins,
    };
  });
  const totalSubjMinutes = Math.max(
    1,
    subjectStats.reduce((a, s) => a + s.minutes, 0)
  );

  // Species Breakdown
  const speciesStats = TREE_SPECIES_CATALOG.map((sp) => ({
    id: sp.id,
    name: sp.name[lang],
    color: sp.leafPrimaryColor,
    count: trees.filter((tr) => tr.speciesId === sp.id).length,
  })).filter((s) => s.count > 0);

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#3D7950]" />
            <span>{t.analytics.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.analytics.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'weekly', label: t.analytics.tabWeekly },
              { id: 'monthly', label: t.analytics.tabMonthly },
              { id: 'focus_power', label: t.analytics.tabFocusPower },
            ] as const
          ).map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                tab === tb.id
                  ? 'bg-[#234B35] text-[#FAF8EF]'
                  : 'bg-[#FAF8EF] dark:bg-[#1D3326] text-[#4A5E50] dark:text-[#A9C7A4] border border-[#234B35]/15'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.analytics.tabWeekly}
          </span>
          <div className="text-xl font-extrabold font-mono mt-1">
            {formatDurationMinutes(weeklyTotalMins, lang)}
          </div>
          <span className="text-[11px] text-[#3D7950]">
            {formatNumberLocale(weeklyTotalTrees, lang)} {t.app.trees}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.analytics.bestDayOfWeek}
          </span>
          <div className="text-xl font-extrabold font-mono mt-1">
            {bestDay.label} ({formatDurationMinutes(bestDay.minutes, lang)})
          </div>
          <span className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
            {bestDay.dateStr}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.dashboard.todaysFocus}
          </span>
          <div className="text-xl font-extrabold font-mono mt-1">
            {formatDurationMinutes(todayFocusMinutes, lang)}
          </div>
          <span className="text-[11px] text-[#3D7950]">
            {formatNumberLocale(todayCompletedSessions, lang)} {t.app.sessions} •{' '}
            {formatNumberLocale(todayTreesPlanted, lang)} {t.app.trees}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.dashboard.focusPowerTitle}
          </span>
          <div className="text-xl font-extrabold font-mono mt-1 text-[#D6B56D]">
            {formatNumberLocale(focusPower.totalScore, lang)} /{' '}
            {formatNumberLocale(1000, lang)}
          </div>
          <span className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
            Prev: {formatNumberLocale(focusPower.previousScore, lang)}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: 7-Day Daily Focus Bar Chart */}
        <div className="lg:col-span-7 rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
              {t.analytics.dailyFocusChartTitle}
            </h2>
            <span className="text-xs font-mono text-[#3D7950] dark:text-[#D6B56D]">
              {t.planner.dailyGoalSetting}:{' '}
              {formatDurationMinutes(profile.dailyGoalMinutes, lang)}
            </span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2 border-b border-[#234B35]/15">
            {last7Days.map((day) => {
              const heightPct = Math.max(
                6,
                Math.round((day.minutes / maxDayMins) * 100)
              );
              return (
                <div
                  key={day.dateStr}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <span className="text-[10px] font-mono font-bold text-[#3D7950] dark:text-[#D6B56D]">
                    {day.minutes > 0 ? `${day.minutes}m` : ''}
                  </span>
                  <div
                    className="w-full max-w-[42px] rounded-t-xl transition-all duration-500"
                    style={{
                      height: `${heightPct}%`,
                      background:
                        day.minutes >= profile.dailyGoalMinutes
                          ? 'linear-gradient(180deg, #D6B56D 0%, #3D7950 100%)'
                          : '#3D7950',
                      opacity: day.minutes > 0 ? 1 : 0.2,
                    }}
                  />
                  <span className="text-xs font-bold pb-2">{day.label}</span>
                </div>
              );
            })}
          </div>

          {/* Cultivated Species Breakdown */}
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A5E50] dark:text-[#A9C7A4]">
              {t.analytics.speciesDistChartTitle}
            </h3>
            {speciesStats.length === 0 ? (
              <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
                No trees planted yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {speciesStats.map((sp) => (
                  <div
                    key={sp.id}
                    className="px-3 py-1.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#234B35]/10 flex items-center gap-2 text-xs"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sp.color }}
                    />
                    <span className="font-semibold">{sp.name}</span>
                    <strong className="font-mono">
                      {formatNumberLocale(sp.count, lang)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Subject Distribution & Focus Power 6-Factor Breakdown */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Subject Distribution */}
          <div className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
              {t.analytics.subjectDistChartTitle}
            </h2>
            <div className="space-y-3">
              {subjectStats.map((st) => {
                const pct =
                  completedSessions.length > 0
                    ? Math.round((st.minutes / totalSubjMinutes) * 100)
                    : 0;
                return (
                  <div key={st.id} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold">{st.name}</span>
                      <span className="font-mono">
                        {formatDurationMinutes(st.minutes, lang)} (
                        {formatNumberLocale(pct, lang)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: st.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Focus Power 6-Factor Breakdown */}
          <div className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
              {t.analytics.focusPowerTrendTitle}
            </h2>
            <div className="space-y-2.5 text-xs">
              {[
                {
                  key: 'focusTime',
                  label: t.analytics.factorFocusTime,
                  score: focusPower.factors.focusTime,
                  weight: profile.focusPowerWeights.focusTime,
                },
                {
                  key: 'sessionRate',
                  label: t.analytics.factorSessionRate,
                  score: focusPower.factors.sessionRate,
                  weight: profile.focusPowerWeights.sessionRate,
                },
                {
                  key: 'dailyGoals',
                  label: t.analytics.factorDailyGoals,
                  score: focusPower.factors.dailyGoals,
                  weight: profile.focusPowerWeights.dailyGoals,
                },
                {
                  key: 'consistency',
                  label: t.analytics.factorConsistency,
                  score: focusPower.factors.consistency,
                  weight: profile.focusPowerWeights.consistency,
                },
                {
                  key: 'completedTasks',
                  label: t.analytics.factorCompletedTasks,
                  score: focusPower.factors.completedTasks,
                  weight: profile.focusPowerWeights.completedTasks,
                },
                {
                  key: 'achievements',
                  label: t.analytics.factorAchievements,
                  score: focusPower.factors.achievements,
                  weight: profile.focusPowerWeights.achievements,
                },
              ].map((fac) => (
                <div key={fac.key} className="space-y-1">
                  <div className="flex justify-between">
                    <span>
                      {fac.label}{' '}
                      <span className="opacity-60 font-mono">({fac.weight}%)</span>
                    </span>
                    <strong className="font-mono">
                      {formatNumberLocale(fac.score, lang)} / 100
                    </strong>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#234B35]/15 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#3D7950]"
                      style={{ width: `${fac.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
