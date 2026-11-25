'use client';

import React, { useState } from 'react';
import { useForestEcosystem } from '@/contexts/ForestEcosystemContext';
import { getTodayDateStr } from '@/db/localDb';
import { TREE_SPECIES_CATALOG } from '@/domain/catalog';
import {
  formatDurationMinutes,
  formatNumberLocale,
} from '@/translations';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Plus,
  Sprout,
  Target,
  Trash2,
} from 'lucide-react';

export function StudyPlannerView() {
  const {
    profile,
    lang,
    t,
    plans,
    subjects,
    updateProfileSettings,
    createStudyPlan,
    toggleStudyPlanComplete,
    deleteStudyPlan,
    setTimerSubject,
    setActiveSection,
  } = useForestEcosystem();

  const [showAdd, setShowAdd] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<number>(new Date().getDay());
  const [subjectId, setSubjectId] = useState<string>(
    subjects[0]?.id || 'subj_programming'
  );
  const [title, setTitle] = useState<string>('');
  const [targetMinutes, setTargetMinutes] = useState<number>(45);

  const totalPlannedMin = plans.reduce((a, p) => a + p.targetMinutes, 0);
  const totalCompletedMin = plans.reduce((a, p) => a + p.completedMinutes, 0);

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createStudyPlan({
      dayOfWeek,
      subjectId,
      title,
      targetMinutes,
    });
    setTitle('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
            <Target className="w-6 h-6 text-[#3D7950]" />
            <span>{t.planner.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.planner.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.planner.addPlanBlock}</span>
        </button>
      </div>

      {/* Daily & Weekly Target Controls + Planned vs Completed Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">{t.planner.dailyGoalSetting}</span>
            <span className="font-mono font-bold text-[#3D7950] dark:text-[#D6B56D]">
              {formatDurationMinutes(profile.dailyGoalMinutes, lang)}
            </span>
          </div>
          <input
            type="range"
            min={15}
            max={300}
            step={15}
            value={profile.dailyGoalMinutes}
            onChange={(e) =>
              updateProfileSettings({
                dailyGoalMinutes: Number(e.target.value),
              })
            }
            className="w-full accent-[#3D7950] cursor-pointer"
          />
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">{t.planner.weeklyGoalSetting}</span>
            <span className="font-mono font-bold text-[#3D7950] dark:text-[#D6B56D]">
              {formatDurationMinutes(profile.weeklyGoalMinutes, lang)}
            </span>
          </div>
          <input
            type="range"
            min={60}
            max={1500}
            step={30}
            value={profile.weeklyGoalMinutes}
            onChange={(e) =>
              updateProfileSettings({
                weeklyGoalMinutes: Number(e.target.value),
              })
            }
            className="w-full accent-[#3D7950] cursor-pointer"
          />
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4] block">
              {t.planner.plannedMinutes} vs. {t.planner.completedMinutes}
            </span>
            <strong className="text-lg font-mono font-bold text-[#16261C] dark:text-[#FAF8EF]">
              {formatDurationMinutes(totalCompletedMin, lang)} /{' '}
              {formatDurationMinutes(totalPlannedMin, lang)}
            </strong>
          </div>
          <Clock className="w-7 h-7 text-[#D6B56D]" />
        </div>
      </div>

      {/* Add Study Block Form */}
      {showAdd && (
        <form
          onSubmit={handleAddPlan}
          className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border-2 border-[#3D7950]/40 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">
                {t.planner.planTitleLabel}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 4 Review & Practice"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {t.planner.dayOfWeekLabel}
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
              >
                {t.planner.daysFull.map((dName, idx) => (
                  <option key={dName} value={idx}>
                    {dName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {t.planner.targetMinLabel}
              </label>
              <input
                type="number"
                min={10}
                max={240}
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">
                {t.timer.selectSubject}
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {lang === 'ar' && s.nameAr ? s.nameAr : s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-400/40 cursor-pointer"
            >
              {t.app.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] cursor-pointer"
            >
              {t.app.save}
            </button>
          </div>
        </form>
      )}

      {/* 7-Day Weekly Planning Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
        {t.planner.daysFull.map((dayName, dayIdx) => {
          const dayPlans = plans.filter((p) => p.dayOfWeek === dayIdx);
          const isToday = new Date().getDay() === dayIdx;

          return (
            <div
              key={dayName}
              className={`rounded-2xl p-3.5 border flex flex-col justify-between space-y-3 min-h-[240px] ${
                isToday
                  ? 'bg-[#234B35]/10 dark:bg-[#234B35]/30 border-[#3D7950]'
                  : 'bg-[#FAF8EF] dark:bg-[#1D3326] border-[#234B35]/10'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-current/10 pb-2">
                  <span className="text-xs font-bold">{dayName}</span>
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D6B56D] text-[#14251B]">
                      {t.app.today}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {dayPlans.map((pl) => {
                    const subj = subjects.find((s) => s.id === pl.subjectId);
                    return (
                      <div
                        key={pl.id}
                        className="p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#234B35]/10 space-y-1.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStudyPlanComplete(pl.id)}
                            className="text-[#3D7950] mt-0.5 cursor-pointer"
                          >
                            {pl.completed ? (
                              <CheckCircle2 className="w-4 h-4 fill-[#3D7950] text-white" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span
                            className={`font-semibold flex-1 ${
                              pl.completed ? 'line-through opacity-65' : ''
                            }`}
                          >
                            {pl.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteStudyPlan(pl.id)}
                            className="text-[#C84B31] opacity-70 hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span
                            className="px-1.5 py-0.5 rounded text-white font-medium truncate max-w-[90px]"
                            style={{ backgroundColor: subj?.color || '#3D7950' }}
                          >
                            {lang === 'ar' && subj?.nameAr
                              ? subj.nameAr
                              : subj?.name}
                          </span>
                          <span className="font-mono font-semibold">
                            {formatNumberLocale(pl.completedMinutes, lang)}/
                            {formatNumberLocale(pl.targetMinutes, lang)}m
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDayOfWeek(dayIdx);
                  setShowAdd(true);
                }}
                className="w-full py-1.5 rounded-lg text-[11px] font-semibold border border-dashed border-[#3D7950]/40 text-[#3D7950] dark:text-[#A9C7A4] hover:bg-[#3D7950]/10 cursor-pointer"
              >
                + {t.app.create}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StudyCalendarView() {
  const { lang, t, sessions, trees, tasks, subjects } = useForestEcosystem();

  const [currentMonthDate, setCurrentMonthDate] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    getTodayDateStr()
  );

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayDow = new Date(year, month, 1).getDay();

  const monthTitle = new Intl.DateTimeFormat(
    lang === 'ar' ? 'ar-EG' : 'en-US',
    { month: 'long', year: 'numeric' }
  ).format(currentMonthDate);

  const completedSessions = sessions.filter((s) => s.status === 'completed');

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthSessions = completedSessions.filter((s) =>
    s.dateStr.startsWith(monthPrefix)
  );
  const monthTrees = trees.filter((tr) => tr.dateStr.startsWith(monthPrefix));
  const activeStudyDaysCount = new Set(monthSessions.map((s) => s.dateStr)).size;
  const monthTotalMinutes = monthSessions.reduce(
    (a, s) => a + Math.round(s.actualDurationSec / 60),
    0
  );

  const daySessions = completedSessions.filter(
    (s) => s.dateStr === selectedDateStr
  );
  const dayTrees = trees.filter((tr) => tr.dateStr === selectedDateStr);
  const dayTasks = tasks.filter(
    (tk) =>
      tk.completed &&
      tk.completedAt &&
      getTodayDateStr(new Date(tk.completedAt)) === selectedDateStr
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-[#3D7950]" />
            <span>{t.calendar.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.calendar.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setCurrentMonthDate(new Date(year, month - 1, 1))
            }
            className="p-2 rounded-xl bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 hover:bg-[#3D7950]/15 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 rounded-xl bg-[#234B35] text-[#FAF8EF] text-xs font-bold min-w-[140px] text-center">
            {monthTitle}
          </span>
          <button
            type="button"
            onClick={() =>
              setCurrentMonthDate(new Date(year, month + 1, 1))
            }
            className="p-2 rounded-xl bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 hover:bg-[#3D7950]/15 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.calendar.activeStudyDays}
          </span>
          <div className="text-xl font-bold font-mono mt-1">
            {formatNumberLocale(activeStudyDaysCount, lang)} {t.app.days}
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.calendar.monthlyTrees}
          </span>
          <div className="text-xl font-bold font-mono mt-1 text-[#3D7950] dark:text-[#D6B56D]">
            {formatNumberLocale(monthTrees.length, lang)} {t.app.trees}
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.calendar.monthlyMinutes}
          </span>
          <div className="text-xl font-bold font-mono mt-1">
            {formatDurationMinutes(monthTotalMinutes, lang)}
          </div>
        </div>
      </div>

      {/* Calendar Grid + Selected Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-3xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 shadow-sm space-y-3">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.planner.daysShort.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayDow }).map((_, i) => (
              <div key={`empty_${i}`} className="h-16 sm:h-20" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dStr = `${year}-${String(month + 1).padStart(
                2,
                '0'
              )}-${String(dayNum).padStart(2, '0')}`;
              const dSes = completedSessions.filter((s) => s.dateStr === dStr);
              const dMins = dSes.reduce(
                (a, s) => a + Math.round(s.actualDurationSec / 60),
                0
              );
              const dTreesCount = trees.filter((tr) => tr.dateStr === dStr).length;
              const isSelected = selectedDateStr === dStr;

              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => setSelectedDateStr(dStr)}
                  className={`h-16 sm:h-20 rounded-2xl p-2 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-[#D6B56D] bg-[#234B35] text-[#FAF8EF] shadow-md'
                      : dMins > 0
                        ? 'border-[#3D7950]/40 bg-[#3D7950]/15 text-[#16261C] dark:text-[#FAF8EF]'
                        : 'border-[#234B35]/10 bg-[#F4F8F2] dark:bg-[#14251B]/60'
                  }`}
                >
                  <span className="text-xs font-mono font-bold">
                    {formatNumberLocale(dayNum, lang)}
                  </span>
                  {dMins > 0 && (
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-mono font-semibold truncate">
                        {formatDurationMinutes(dMins, lang)}
                      </div>
                      <div className="flex items-center gap-0.5 text-[10px] text-[#3D7950] dark:text-[#D6B56D]">
                        <Sprout className="w-3 h-3" />
                        <span>{formatNumberLocale(dTreesCount, lang)}</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Breakdown Sidebar */}
        <div className="lg:col-span-4 rounded-3xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 shadow-sm space-y-4">
          <div className="border-b border-[#234B35]/10 pb-3">
            <span className="text-xs font-mono text-[#3D7950] dark:text-[#D6B56D]">
              {selectedDateStr}
            </span>
            <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
              {t.calendar.selectedDaySummary}
            </h2>
          </div>

          {daySessions.length === 0 && dayTasks.length === 0 ? (
            <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4] py-6">
              {t.calendar.noActivityOnDay}
            </p>
          ) : (
            <div className="space-y-3">
              {dayTrees.map((tr) => {
                const sp = TREE_SPECIES_CATALOG.find(
                  (s) => s.id === tr.speciesId
                );
                const sub = subjects.find((s) => s.id === tr.subjectId);
                return (
                  <div
                    key={tr.id}
                    className="p-3 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold">{sp?.name[lang]}</div>
                      <div className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
                        {lang === 'ar' && sub?.nameAr ? sub.nameAr : sub?.name}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#3D7950] dark:text-[#D6B56D]">
                      {formatDurationMinutes(
                        Math.round(tr.focusDurationSec / 60),
                        lang
                      )}
                    </span>
                  </div>
                );
              })}

              {dayTasks.map((tk) => (
                <div
                  key={tk.id}
                  className="p-2.5 rounded-xl bg-[#3D7950]/10 border border-[#3D7950]/25 flex items-center gap-2 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#3D7950] shrink-0" />
                  <span className="font-semibold truncate">{tk.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
