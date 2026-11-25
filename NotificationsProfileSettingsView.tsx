'use client';

import React, { useRef, useState } from 'react';
import {
  calculateLevelFromXp,
  useForestEcosystem,
} from '@/contexts/ForestEcosystemContext';
import { NotificationCategory } from '@/domain/types';
import { ACHIEVEMENTS_CATALOG } from '@/domain/catalog';
import {
  formatDateLocale,
  formatNumberLocale,
} from '@/translations';
import {
  AlertTriangle,
  Award,
  Bell,
  Check,
  CheckCheck,
  Download,
  Edit3,
  FileSpreadsheet,
  Flame,
  Globe,
  Moon,
  Plus,
  RotateCcw,
  Settings,
  Sprout,
  Sun,
  Trash2,
  Trees,
  Upload,
  User,
  Zap,
} from 'lucide-react';

export function NotificationsView() {
  const {
    profile,
    lang,
    t,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearReadNotifications,
    createCustomReminder,
    requestBrowserNotifications,
    setActiveSection,
  } = useForestEcosystem();

  const [catFilter, setCatFilter] = useState<'ALL' | NotificationCategory>('ALL');
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remDesc, setRemDesc] = useState('');

  const filteredNotifs = notifications.filter((n) =>
    catFilter === 'ALL' ? true : n.category === catFilter
  );

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;
    await createCustomReminder(remTitle, remDesc);
    setRemTitle('');
    setRemDesc('');
    setShowReminderForm(false);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#D6B56D]" />
            <span>{t.notifications.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.notifications.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReminderForm(!showReminderForm)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.notifications.addReminderBtn}</span>
          </button>

          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#3D7950]" />
            <span>{t.notifications.markAllRead}</span>
          </button>

          <button
            type="button"
            onClick={clearReadNotifications}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-[#C84B31]" />
            <span>{t.notifications.clearAll}</span>
          </button>
        </div>
      </div>

      {/* Create Reminder Modal */}
      {showReminderForm && (
        <form
          onSubmit={handleAddReminder}
          className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border-2 border-[#3D7950]/40 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                {t.notifications.reminderTitleLabel}
              </label>
              <input
                type="text"
                required
                value={remTitle}
                onChange={(e) => setRemTitle(e.target.value)}
                placeholder="e.g., Physics Midterm Exam Prep at 18:00"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {t.tasks.taskDescLabel}
              </label>
              <input
                type="text"
                value={remDesc}
                onChange={(e) => setRemDesc(e.target.value)}
                placeholder="Review chapters 1-5 and complete 2 focus sessions"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReminderForm(false)}
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

      {/* Category Filter Pills & Browser Notification Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'ALL', label: t.notifications.catAll },
              { id: 'FOCUS', label: t.notifications.catFOCUS },
              { id: 'TREE', label: t.notifications.catTREE },
              { id: 'REWARDS', label: t.notifications.catREWARDS },
              { id: 'PRODUCTIVITY', label: t.notifications.catPRODUCTIVITY },
              { id: 'REMINDERS', label: t.notifications.catREMINDERS },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCatFilter(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                catFilter === c.id
                  ? 'bg-[#234B35] text-[#FAF8EF]'
                  : 'bg-[#FAF8EF] dark:bg-[#1D3326] text-[#4A5E50] dark:text-[#A9C7A4]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={requestBrowserNotifications}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
            profile.browserNotificationsEnabled
              ? 'bg-[#3D7950]/15 text-[#3D7950] border-[#3D7950]/40'
              : 'bg-[#FAF8EF] dark:bg-[#1D3326] border-[#234B35]/20'
          }`}
        >
          {profile.browserNotificationsEnabled
            ? `✓ ${t.notifications.browserNotifActive}`
            : t.notifications.enableBrowserNotif}
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="rounded-3xl p-8 text-center bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.notifications.emptyNotifications}
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                n.read
                  ? 'bg-[#FAF8EF]/65 dark:bg-[#1D3326]/55 border-[#234B35]/10 opacity-75'
                  : 'bg-[#FAF8EF] dark:bg-[#1D3326] border-[#3D7950]/40 shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#234B35] text-[#D6B56D]">
                    {n.category}
                  </span>
                  <h3 className="text-sm font-bold text-[#16261C] dark:text-[#FAF8EF]">
                    {n.title[lang]}
                  </h3>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#D6B56D]" />
                  )}
                </div>
                <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
                  {n.description[lang]}
                </p>
                <span className="text-[10px] font-mono text-gray-400 block">
                  {formatDateLocale(n.timestamp, lang)}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {n.actionSection && (
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      setActiveSection(n.actionSection!);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] cursor-pointer"
                  >
                    {n.actionLabel ? n.actionLabel[lang] : t.dashboard.viewAll}
                  </button>
                )}
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className="p-2 rounded-lg hover:bg-[#3D7950]/15 text-[#3D7950] cursor-pointer"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteNotification(n.id)}
                  className="p-2 rounded-lg hover:bg-[#C84B31]/15 text-[#C84B31] cursor-pointer"
                  title={t.app.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const AVATAR_EMBLEMS = [
  { id: 'oak_guardian', label: 'Oak Guardian', color: '#3D7950' },
  { id: 'sakura_sage', label: 'Sakura Sage', color: '#E15A87' },
  { id: 'alpine_ranger', label: 'Alpine Ranger', color: '#2E86AB' },
  { id: 'lumina_mystic', label: 'Lumina Mystic', color: '#48C9B0' },
  { id: 'golden_scholar', label: 'Golden Scholar', color: '#D6B56D' },
];

export function ProfileView() {
  const {
    profile,
    lang,
    t,
    sessions,
    trees,
    records,
    focusPower,
    updateProfileSettings,
  } = useForestEcosystem();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarId, setAvatarId] = useState(profile.avatarId);

  const levelInfo = calculateLevelFromXp(profile.xp);
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalHours =
    Math.round(
      (completedSessions.reduce(
        (a, s) => a + Math.round(s.actualDurationSec / 60),
        0
      ) /
        60) *
        10
    ) / 10;

  const activeAvatar =
    AVATAR_EMBLEMS.find((a) => a.id === profile.avatarId) || AVATAR_EMBLEMS[0];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileSettings({
      username: username.trim() || 'Sanctuary Scholar',
      bio: bio.trim(),
      avatarId,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Profile Hero Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#234B35] via-[#1C3D2B] to-[#14251B] text-[#FAF8EF] border border-[#3D7950]/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center border-2 border-[#D6B56D] shadow-md shrink-0"
            style={{ backgroundColor: activeAvatar.color }}
          >
            <Sprout className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#D6B56D] text-[#14251B]">
                {t.app.level} {formatNumberLocale(levelInfo.level, lang)}
              </span>
            </div>
            <p className="text-sm text-[#A9C7A4]">{profile.bio}</p>

            {/* XP Progress Bar */}
            <div className="w-64 max-w-full space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-[#A9C7A4]">
                <span>
                  {formatNumberLocale(levelInfo.currentLevelXp, lang)} /{' '}
                  {formatNumberLocale(levelInfo.nextLevelXp, lang)} {t.app.xp}
                </span>
                <span>{formatNumberLocale(levelInfo.progressPct, lang)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-[#D6B56D]"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setUsername(profile.username);
            setBio(profile.bio);
            setAvatarId(profile.avatarId);
            setIsEditing(!isEditing);
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-[#FAF8EF] border border-white/20 flex items-center gap-2 self-start md:self-center cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>{t.profile.editProfile}</span>
        </button>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border-2 border-[#3D7950]/40 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                {t.profile.usernameLabel}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {t.profile.bioLabel}
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-2">
              {t.profile.chooseAvatar}
            </label>
            <div className="flex flex-wrap gap-3">
              {AVATAR_EMBLEMS.map((em) => (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => setAvatarId(em.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer ${
                    avatarId === em.id
                      ? 'border-2 border-[#D6B56D] bg-[#234B35] text-white'
                      : 'border-gray-300 dark:border-white/10'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: em.color }}
                  />
                  <span>{em.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
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

      {/* Lifetime Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <Zap className="w-5 h-5 text-[#D6B56D] mb-1" />
          <div className="text-xl font-extrabold font-mono">
            {formatNumberLocale(focusPower.totalScore, lang)}
          </div>
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.dashboard.focusPowerTitle}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <User className="w-5 h-5 text-[#3D7950] mb-1" />
          <div className="text-xl font-extrabold font-mono">
            {formatNumberLocale(totalHours, lang)}h
          </div>
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.profile.lifetimeHours}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <Award className="w-5 h-5 text-[#3D7950] mb-1" />
          <div className="text-xl font-extrabold font-mono">
            {formatNumberLocale(completedSessions.length, lang)}
          </div>
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.profile.lifetimeSessions}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <Trees className="w-5 h-5 text-[#3D7950] mb-1" />
          <div className="text-xl font-extrabold font-mono">
            {formatNumberLocale(trees.length, lang)}
          </div>
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.profile.lifetimeTrees}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <Flame className="w-5 h-5 text-[#D9822B] mb-1" />
          <div className="text-xl font-extrabold font-mono">
            {formatNumberLocale(profile.currentStreak, lang)} {t.app.days}
          </div>
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.dashboard.currentStreak}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10">
          <Award className="w-5 h-5 text-[#D6B56D] mb-1" />
          <div className="text-xl font-extrabold font-mono">
            {formatNumberLocale(profile.unlockedAchievements.length, lang)} /{' '}
            {formatNumberLocale(ACHIEVEMENTS_CATALOG.length, lang)}
          </div>
          <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.nav.achievements}
          </span>
        </div>
      </div>

      <p className="text-xs text-center text-[#4A5E50] dark:text-[#A9C7A4]">
        {t.profile.noAuthNotice}
      </p>
    </div>
  );
}

export function SettingsView() {
  const {
    profile,
    lang,
    t,
    subjects,
    setLanguage,
    setTheme,
    updateProfileSettings,
    exportDataAsJson,
    exportAnalyticsAsCsv,
    importDataFromJson,
    resetAllApplicationData,
  } = useForestEcosystem();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = await importDataFromJson(text);
    setImportStatus(
      ok
        ? lang === 'ar'
          ? 'تم استيراد النسخة الاحتياطية بنجاح!'
          : 'Backup imported successfully!'
        : lang === 'ar'
          ? 'ملف غير صالح'
          : 'Invalid JSON backup file.'
    );
    setTimeout(() => setImportStatus(null), 4000);
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#3D7950]" />
          <span>{t.settings.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
          {t.settings.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. General & Appearance */}
        <div className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 space-y-4">
          <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#3D7950]" />
            <span>{t.settings.secGeneral}</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#234B35]/10">
              <span className="font-semibold">{t.settings.languageLabel}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                    lang === 'en'
                      ? 'bg-[#234B35] text-white'
                      : 'bg-black/5 dark:bg-white/10'
                  }`}
                >
                  English (LTR)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ar')}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                    lang === 'ar'
                      ? 'bg-[#234B35] text-white'
                      : 'bg-black/5 dark:bg-white/10'
                  }`}
                >
                  العربية (RTL)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#234B35]/10">
              <span className="font-semibold">{t.settings.themeLabel}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                    profile.theme === 'light'
                      ? 'bg-[#234B35] text-white'
                      : 'bg-black/5 dark:bg-white/10'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{t.settings.themeLight}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                    profile.theme === 'dark'
                      ? 'bg-[#234B35] text-white'
                      : 'bg-black/5 dark:bg-white/10'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{t.settings.themeDark}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#234B35]/10">
              <span className="font-semibold">{t.settings.soundLabel}</span>
              <input
                type="checkbox"
                checked={profile.soundEnabled}
                onChange={(e) =>
                  updateProfileSettings({ soundEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-[#3D7950] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="font-semibold">{t.settings.animationsLabel}</span>
              <input
                type="checkbox"
                checked={profile.animationsEnabled}
                onChange={(e) =>
                  updateProfileSettings({ animationsEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-[#3D7950] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. Timer & Study Defaults */}
        <div className="rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 space-y-4">
          <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
            {t.settings.secTimer} & {t.settings.secStudy}
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5">
              <span className="font-semibold">
                {t.settings.defaultFocusLabel}
              </span>
              <input
                type="number"
                min={1}
                max={180}
                value={profile.defaultFocusMinutes}
                onChange={(e) =>
                  updateProfileSettings({
                    defaultFocusMinutes: Math.max(1, Number(e.target.value)),
                  })
                }
                className="w-20 px-2.5 py-1.5 rounded-lg bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 font-mono font-bold text-center"
              />
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="font-semibold">
                {t.settings.shortBreakLabel}
              </span>
              <input
                type="number"
                min={1}
                max={60}
                value={profile.shortBreakMinutes}
                onChange={(e) =>
                  updateProfileSettings({
                    shortBreakMinutes: Math.max(1, Number(e.target.value)),
                  })
                }
                className="w-20 px-2.5 py-1.5 rounded-lg bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 font-mono font-bold text-center"
              />
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="font-semibold">{t.settings.longBreakLabel}</span>
              <input
                type="number"
                min={5}
                max={90}
                value={profile.longBreakMinutes}
                onChange={(e) =>
                  updateProfileSettings({
                    longBreakMinutes: Math.max(5, Number(e.target.value)),
                  })
                }
                className="w-20 px-2.5 py-1.5 rounded-lg bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 font-mono font-bold text-center"
              />
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="font-semibold">{t.settings.dailyGoalLabel}</span>
              <input
                type="number"
                min={15}
                max={480}
                value={profile.dailyGoalMinutes}
                onChange={(e) =>
                  updateProfileSettings({
                    dailyGoalMinutes: Math.max(15, Number(e.target.value)),
                  })
                }
                className="w-20 px-2.5 py-1.5 rounded-lg bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 font-mono font-bold text-center"
              />
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="font-semibold">{t.settings.autoBreakLabel}</span>
              <input
                type="checkbox"
                checked={profile.autoStartBreaks}
                onChange={(e) =>
                  updateProfileSettings({ autoStartBreaks: e.target.checked })
                }
                className="w-4 h-4 accent-[#3D7950] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Data Management: JSON Export, CSV Export, JSON Import, Safe Reset */}
        <div className="lg:col-span-2 rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 space-y-4">
          <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
            {t.settings.secData}
          </h2>

          {importStatus && (
            <div className="p-3 rounded-xl bg-[#3D7950]/20 text-xs font-bold text-[#234B35] dark:text-[#FAF8EF]">
              {importStatus}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={exportDataAsJson}
              className="p-3.5 rounded-2xl bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#D6B56D]" />
              <span>{t.settings.exportJsonBtn}</span>
            </button>

            <button
              type="button"
              onClick={exportAnalyticsAsCsv}
              className="p-3.5 rounded-2xl bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#D6B56D]" />
              <span>{t.settings.exportCsvBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-2xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/40 text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#3D7950]/15 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#3D7950]" />
              <span>{t.settings.importJsonBtn}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="p-3.5 rounded-2xl bg-[#C84B31]/15 text-[#C84B31] border border-[#C84B31]/30 hover:bg-[#C84B31]/25 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.settings.resetDataBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explicit Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border-2 border-[#C84B31] space-y-4">
            <div className="flex items-center gap-3 text-[#C84B31]">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold">
                {t.settings.resetConfirmTitle}
              </h3>
            </div>
            <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4] leading-relaxed">
              {t.settings.resetConfirmDesc}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-400/40 cursor-pointer"
              >
                {t.app.cancel}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowResetConfirm(false);
                  await resetAllApplicationData();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C84B31] text-white hover:bg-[#a83820] cursor-pointer"
              >
                {t.settings.confirmResetBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
