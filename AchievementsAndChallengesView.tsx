'use client';

import React, { useState } from 'react';
import { useForestEcosystem } from '@/contexts/ForestEcosystemContext';
import { ACHIEVEMENTS_CATALOG } from '@/domain/catalog';
import { ChallengeRecord } from '@/domain/types';
import { getTodayDateStr } from '@/db/localDb';
import {
  formatDateLocale,
  formatNumberLocale,
} from '@/translations';
import {
  Award,
  CheckCircle2,
  Coins,
  Flame,
  Plus,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';

export default function AchievementsAndChallengesView() {
  const {
    profile,
    lang,
    t,
    challenges,
    records,
    createCustomChallenge,
    claimChallengeReward,
  } = useForestEcosystem();

  const [activeTab, setActiveTab] = useState<
    'badges' | 'records' | 'challenges'
  >('badges');

  // Custom Challenge Form
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [chalTitle, setChalTitle] = useState('');
  const [chalMetric, setChalMetric] =
    useState<ChallengeRecord['metric']>('trees_planted');
  const [chalTarget, setChalTarget] = useState(5);
  const [chalEndDate, setChalEndDate] = useState(
    getTodayDateStr(new Date(Date.now() + 7 * 86400000))
  );

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chalTitle.trim()) return;
    await createCustomChallenge({
      title: chalTitle,
      metric: chalMetric,
      targetValue: chalTarget,
      endDateStr: chalEndDate,
    });
    setChalTitle('');
    setShowNewChallenge(false);
  };

  const recordLabelsMap: Record<string, string> = {
    longest_session_min: t.achievements.recordLongestSession,
    highest_daily_min: t.achievements.recordHighestDaily,
    highest_weekly_min: t.achievements.recordHighestWeekly,
    most_productive_month_min: t.achievements.recordProductiveMonth,
    most_trees_week: t.achievements.recordMostTreesWeek,
    longest_streak_days: t.achievements.recordLongestStreak,
    most_tasks_day: t.achievements.recordMostTasksDay,
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#D6B56D]" />
            <span>{t.achievements.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.achievements.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'badges', label: t.achievements.tabBadges },
              { id: 'records', label: t.achievements.tabRecords },
              { id: 'challenges', label: t.achievements.tabChallenges },
            ] as const
          ).map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setActiveTab(tb.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tb.id
                  ? 'bg-[#234B35] text-[#FAF8EF]'
                  : 'bg-[#FAF8EF] dark:bg-[#1D3326] text-[#4A5E50] dark:text-[#A9C7A4] border border-[#234B35]/15'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Achievement Badges */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ACHIEVEMENTS_CATALOG.map((ach) => {
            const isUnlocked = profile.unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  isUnlocked
                    ? 'bg-[#FAF8EF] dark:bg-[#1D3326] border-[#D6B56D] shadow-md'
                    : 'bg-[#FAF8EF]/60 dark:bg-[#1D3326]/50 border-[#234B35]/10 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-[#234B35] text-[#D6B56D]'
                          : 'bg-gray-300/50 dark:bg-white/10 text-gray-500'
                      }`}
                    >
                      <Trophy className="w-5 h-5" />
                    </div>
                    {isUnlocked ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#3D7950]/20 text-[#3D7950] dark:text-[#D6B56D] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.app.completed}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/10 dark:bg-white/10">
                        {t.app.locked}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
                      {ach.title[lang]}
                    </h3>
                    <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4] mt-1">
                      {ach.description[lang]}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#234B35]/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#D6B56D] font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />+
                    {formatNumberLocale(ach.rewardCoins, lang)}
                  </span>
                  <span className="text-[#3D7950] dark:text-[#A9C7A4] font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />+
                    {formatNumberLocale(ach.rewardPoints, lang)} {t.app.xp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: 7 Personal Records */}
      {activeTab === 'records' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map((rec) => {
            const label = recordLabelsMap[rec.id] || rec.id;
            const unitLabel =
              rec.unit === 'minutes'
                ? t.app.minutes
                : rec.unit === 'trees'
                  ? t.app.trees
                  : rec.unit === 'days'
                    ? t.app.days
                    : t.app.tasks;

            return (
              <div
                key={rec.id}
                className="rounded-3xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#234B35] text-[#D6B56D] flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-[#4A5E50] dark:text-[#A9C7A4]">
                    {rec.achievedAt
                      ? formatDateLocale(rec.achievedAt, lang)
                      : t.achievements.notSetYet}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A5E50] dark:text-[#A9C7A4]">
                    {label}
                  </h3>
                  <div className="text-3xl font-extrabold font-mono text-[#16261C] dark:text-[#FAF8EF] mt-1">
                    {formatNumberLocale(rec.value, lang)}{' '}
                    <span className="text-sm font-normal">{unitLabel}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#234B35]/10 text-xs text-[#4A5E50] dark:text-[#A9C7A4] flex justify-between">
                  <span>Previous Record:</span>
                  <span className="font-mono font-semibold">
                    {formatNumberLocale(rec.previousValue, lang)} {unitLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Personal Challenges */}
      {activeTab === 'challenges' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowNewChallenge(!showNewChallenge)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.achievements.newChallengeBtn}</span>
            </button>
          </div>

          {showNewChallenge && (
            <form
              onSubmit={handleCreateChallenge}
              className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border-2 border-[#3D7950]/40 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t.achievements.challengeTitleLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={chalTitle}
                    onChange={(e) => setChalTitle(e.target.value)}
                    placeholder="e.g., Plant 6 Trees for Finals Prep"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t.achievements.challengeMetricLabel}
                  </label>
                  <select
                    value={chalMetric}
                    onChange={(e) =>
                      setChalMetric(
                        e.target.value as ChallengeRecord['metric']
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
                  >
                    <option value="trees_planted">Trees Planted</option>
                    <option value="focus_sessions">Focus Sessions</option>
                    <option value="tasks_completed">Tasks Completed</option>
                    <option value="streak_days">Study Streak Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t.achievements.challengeTargetLabel}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={chalTarget}
                    onChange={(e) => setChalTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewChallenge(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-400/40 cursor-pointer"
                >
                  {t.app.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] cursor-pointer"
                >
                  {t.app.create}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {challenges.map((ch) => {
              const pct = Math.min(
                100,
                Math.round(
                  (ch.currentValue / Math.max(1, ch.targetValue)) * 100
                )
              );

              return (
                <div
                  key={ch.id}
                  className="rounded-3xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#4A5E50] dark:text-[#A9C7A4]">
                        {ch.startDateStr} → {ch.endDateStr}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#D6B56D]/20 text-[#234B35] dark:text-[#D6B56D]">
                        +{formatNumberLocale(ch.rewardCoins, lang)}{' '}
                        {t.app.leafCoins}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#3D7950]" />
                      <span>{ch.title[lang]}</span>
                    </h3>
                    <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
                      {ch.description[lang]}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span>
                        {formatNumberLocale(ch.currentValue, lang)} /{' '}
                        {formatNumberLocale(ch.targetValue, lang)}
                      </span>
                      <span className="font-bold">
                        {formatNumberLocale(pct, lang)}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#234B35]/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[#3D7950] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {ch.completed && !ch.rewardClaimed && (
                      <button
                        type="button"
                        onClick={() => claimChallengeReward(ch.id)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#D6B56D] text-[#14251B] hover:bg-[#e2c47e] cursor-pointer mt-2"
                      >
                        {t.app.claim} (+{ch.rewardCoins} {t.app.leafCoins})
                      </button>
                    )}
                    {ch.rewardClaimed && (
                      <div className="text-center text-xs font-bold text-[#3D7950] pt-1">
                        ✓ {t.app.claimed}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
