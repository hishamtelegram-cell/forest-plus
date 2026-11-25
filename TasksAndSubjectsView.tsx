'use client';

import React, { useState } from 'react';
import { useForestEcosystem } from '@/contexts/ForestEcosystemContext';
import { TaskPriority } from '@/domain/types';
import { getTodayDateStr } from '@/db/localDb';
import {
  formatDurationMinutes,
  formatNumberLocale,
} from '@/translations';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Edit3,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

export function TasksView() {
  const {
    lang,
    t,
    tasks,
    subjects,
    createTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
  } = useForestEcosystem();

  const [filterTab, setFilterTab] = useState<
    'today' | 'upcoming' | 'completed' | 'overdue' | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Create / Edit Form state
  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'subj_programming');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDateStr, setDueDateStr] = useState(getTodayDateStr());
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);

  const todayStr = getTodayDateStr();
  const completedCount = tasks.filter((tk) => tk.completed).length;
  const completionPct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter((tk) => {
    if (subjectFilter !== 'all' && tk.subjectId !== subjectFilter) return false;
    if (
      searchQuery.trim() &&
      !tk.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !tk.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (filterTab === 'completed') return tk.completed;
    if (filterTab === 'today') return !tk.completed && tk.dueDateStr === todayStr;
    if (filterTab === 'upcoming') return !tk.completed && tk.dueDateStr > todayStr;
    if (filterTab === 'overdue') return !tk.completed && tk.dueDateStr < todayStr;
    return true;
  });

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (editingTaskId) {
      await updateTask(editingTaskId, {
        title: title.trim(),
        description: description.trim(),
        subjectId,
        priority,
        dueDateStr,
        estimatedMinutes,
      });
    } else {
      await createTask({
        title,
        description,
        subjectId,
        priority,
        dueDateStr,
        estimatedMinutes,
      });
    }
    setTitle('');
    setDescription('');
    setEditingTaskId(null);
    setShowForm(false);
  };

  const openEditTask = (tk: typeof tasks[0]) => {
    setEditingTaskId(tk.id);
    setTitle(tk.title);
    setDescription(tk.description);
    setSubjectId(tk.subjectId);
    setPriority(tk.priority);
    setDueDateStr(tk.dueDateStr);
    setEstimatedMinutes(tk.estimatedMinutes);
    setShowForm(true);
  };

  const priorityBadge = (p: TaskPriority) => {
    if (p === 'high') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C84B31]/15 text-[#C84B31]">
          {t.tasks.priorityHigh}
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9822B]/15 text-[#D9822B]">
          {t.tasks.priorityMedium}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3D7950]/15 text-[#3D7950]">
        {t.tasks.priorityLow}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF]">
            {t.tasks.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.tasks.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTaskId(null);
            setTitle('');
            setDescription('');
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.tasks.newTaskBtn}</span>
        </button>
      </div>

      {/* Task Completion Progress Bar */}
      <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#16261C] dark:text-[#FAF8EF]">
            {t.tasks.completionProgress}
          </span>
          <span className="font-mono font-bold text-[#3D7950] dark:text-[#D6B56D]">
            {formatNumberLocale(completedCount, lang)} /{' '}
            {formatNumberLocale(tasks.length, lang)} (
            {formatNumberLocale(completionPct, lang)}%)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#234B35]/10 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#3D7950] transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <p className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
          {t.tasks.taskRewardHint}
        </p>
      </div>

      {/* Create / Edit Task Modal Form */}
      {showForm && (
        <form
          onSubmit={handleSaveTask}
          className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border-2 border-[#3D7950]/40 shadow-md space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">
                {t.tasks.taskTitleLabel}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Complete Calculus Integration Problem Set"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">
                {t.tasks.taskDescLabel}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
              />
            </div>

            <div>
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

            <div>
              <label className="block text-xs font-bold mb-1">
                {t.tasks.priorityLabel}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
              >
                <option value="low">{t.tasks.priorityLow}</option>
                <option value="medium">{t.tasks.priorityMedium}</option>
                <option value="high">{t.tasks.priorityHigh}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {t.tasks.dueDateLabel}
              </label>
              <input
                type="date"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {t.tasks.estimatedMinLabel}
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-400/40 cursor-pointer"
            >
              {t.app.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] cursor-pointer"
            >
              {t.app.save}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: t.tasks.tabAll },
              { id: 'today', label: t.tasks.tabToday },
              { id: 'upcoming', label: t.tasks.tabUpcoming },
              { id: 'overdue', label: t.tasks.tabOverdue },
              { id: 'completed', label: t.tasks.tabCompleted },
            ] as const
          ).map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setFilterTab(tb.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterTab === tb.id
                  ? 'bg-[#234B35] text-[#FAF8EF]'
                  : 'bg-[#FAF8EF] dark:bg-[#1D3326] text-[#4A5E50] dark:text-[#A9C7A4]'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.app.searchPlaceholder}
              className="pl-8 pr-3 py-2 rounded-xl bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 text-xs"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 text-xs"
          >
            <option value="all">{t.app.all}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {lang === 'ar' && s.nameAr ? s.nameAr : s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl p-8 text-center bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.tasks.emptyTasks}
          </div>
        ) : (
          filteredTasks.map((tk) => {
            const subj = subjects.find((s) => s.id === tk.subjectId);
            return (
              <div
                key={tk.id}
                className={`rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  tk.completed
                    ? 'opacity-70 border-[#3D7950]/20'
                    : 'border-[#234B35]/15 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleTaskComplete(tk.id)}
                    className="mt-0.5 text-[#3D7950] hover:scale-110 transition-transform cursor-pointer"
                  >
                    {tk.completed ? (
                      <CheckCircle2 className="w-5 h-5 fill-[#3D7950] text-white" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          tk.completed ? 'line-through opacity-75' : ''
                        }`}
                      >
                        {tk.title}
                      </span>
                      {priorityBadge(tk.priority)}
                      {subj && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: subj.color }}
                        >
                          {lang === 'ar' && subj.nameAr ? subj.nameAr : subj.name}
                        </span>
                      )}
                    </div>
                    {tk.description && (
                      <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
                        {tk.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-mono text-[#4A5E50] dark:text-[#A9C7A4] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {tk.dueDateStr}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditTask(tk)}
                    className="p-2 rounded-lg hover:bg-[#3D7950]/15 text-[#3D7950] cursor-pointer"
                    title={t.app.edit}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(tk.id)}
                    className="p-2 rounded-lg hover:bg-[#C84B31]/15 text-[#C84B31] cursor-pointer"
                    title={t.app.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function SubjectsView() {
  const {
    lang,
    t,
    subjects,
    sessions,
    tasks,
    createSubject,
    updateSubject,
    deleteSubject,
    setTimerSubject,
    setActiveSection,
  } = useForestEcosystem();

  const [showModal, setShowModal] = useState(false);
  const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3D7950');
  const [description, setDescription] = useState('');

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalMinutesAll = Math.max(
    1,
    completedSessions.reduce((a, s) => a + Math.round(s.actualDurationSec / 60), 0)
  );

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingSubjId) {
      await updateSubject(editingSubjId, {
        name: name.trim(),
        color,
        description: description.trim(),
      });
    } else {
      await createSubject({ name, color, description });
    }
    setName('');
    setDescription('');
    setEditingSubjId(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#3D7950]" />
            <span>{t.subjects.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.subjects.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingSubjId(null);
            setName('');
            setDescription('');
            setShowModal(!showModal);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.subjects.newSubjectBtn}</span>
        </button>
      </div>

      {showModal && (
        <form
          onSubmit={handleSaveSubject}
          className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border-2 border-[#3D7950]/40 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">
                {t.subjects.subjectNameLabel}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {t.subjects.subjectColorLabel}
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 rounded-xl cursor-pointer"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold mb-1">
                {t.subjects.subjectDescLabel}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => {
          const subSessions = completedSessions.filter(
            (s) => s.subjectId === sub.id
          );
          const subMins = subSessions.reduce(
            (a, s) => a + Math.round(s.actualDurationSec / 60),
            0
          );
          const subTasks = tasks.filter((tk) => tk.subjectId === sub.id);
          const sharePct =
            completedSessions.length > 0
              ? Math.round((subMins / totalMinutesAll) * 100)
              : 0;

          const displayName =
            lang === 'ar' && sub.nameAr ? sub.nameAr : sub.name;
          const displayDesc =
            lang === 'ar' && sub.descriptionAr
              ? sub.descriptionAr
              : sub.description;

          return (
            <div
              key={sub.id}
              className="rounded-3xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 dark:border-[#A9C7A4]/15 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <div>
                      <h3 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
                        {displayName}
                      </h3>
                      <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4] line-clamp-2">
                        {displayDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubjId(sub.id);
                        setName(sub.name);
                        setColor(sub.color);
                        setDescription(sub.description);
                        setShowModal(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[#3D7950]/15 text-[#3D7950] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteSubject(sub.id)}
                        className="p-1.5 rounded-lg hover:bg-[#C84B31]/15 text-[#C84B31] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]">
                    <div className="text-[10px] text-[#4A5E50] dark:text-[#A9C7A4]">
                      {t.subjects.totalFocusTime}
                    </div>
                    <div className="font-mono font-bold mt-0.5">
                      {formatDurationMinutes(subMins, lang)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]">
                    <div className="text-[10px] text-[#4A5E50] dark:text-[#A9C7A4]">
                      {t.subjects.sessionsCompleted}
                    </div>
                    <div className="font-mono font-bold mt-0.5">
                      {formatNumberLocale(subSessions.length, lang)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]">
                    <div className="text-[10px] text-[#4A5E50] dark:text-[#A9C7A4]">
                      {t.subjects.relatedTasks}
                    </div>
                    <div className="font-mono font-bold mt-0.5">
                      {formatNumberLocale(subTasks.length, lang)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#4A5E50] dark:text-[#A9C7A4]">
                      {t.subjects.shareOfStudy}
                    </span>
                    <span className="font-mono font-bold">
                      {formatNumberLocale(sharePct, lang)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${sharePct}%`,
                        backgroundColor: sub.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTimerSubject(sub.id);
                  setActiveSection('timer');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.subjects.studyNowWithSubject}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
