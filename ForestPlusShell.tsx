'use client';

import React, { useState } from 'react';
import {
  calculateLevelFromXp,
  useForestEcosystem,
} from '@/contexts/ForestEcosystemContext';
import { NavSection } from '@/domain/types';
import {
  formatClockMMSS,
  formatNumberLocale,
} from '@/translations';
import DashboardView from '@/components/views/DashboardView';
import FocusTimerView from '@/components/views/FocusTimerView';
import PersonalForestView from '@/components/views/PersonalForestView';
import TreeCollectionView from '@/components/views/TreeCollectionView';
import MarketplaceView from '@/components/views/MarketplaceView';
import {
  SubjectsView,
  TasksView,
} from '@/components/views/TasksAndSubjectsView';
import {
  StudyCalendarView,
  StudyPlannerView,
} from '@/components/views/PlannerAndCalendarView';
import {
  AnalyticsView,
  FocusArenaView,
} from '@/components/views/ArenaAndAnalyticsView';
import AchievementsAndChallengesView from '@/components/views/AchievementsAndChallengesView';
import {
  NotificationsView,
  ProfileView,
  SettingsView,
} from '@/components/views/NotificationsProfileSettingsView';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  Coins,
  Compass,
  LayoutDashboard,
  Menu,
  Moon,
  Settings,
  ShoppingBag,
  Sparkles,
  Sprout,
  Sun,
  Target,
  Timer,
  Trees,
  Trophy,
  User,
  X,
} from 'lucide-react';

export default function ForestPlusShell() {
  const {
    isReady,
    activeSection,
    setActiveSection,
    profile,
    lang,
    t,
    setLanguage,
    setTheme,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    timerState,
    remainingSeconds,
    recordCelebrationBanner,
    clearCelebrationBanner,
  } = useForestEcosystem();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const levelInfo = calculateLevelFromXp(profile.xp);

  const navGroups: {
    groupTitle: string;
    items: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[];
  }[] = [
    {
      groupTitle: t.nav.groupCore,
      items: [
        { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
        { id: 'timer', label: t.nav.timer, icon: Timer },
      ],
    },
    {
      groupTitle: t.nav.groupBotanical,
      items: [
        { id: 'forest', label: t.nav.forest, icon: Trees },
        { id: 'collection', label: t.nav.collection, icon: Sprout },
        { id: 'marketplace', label: t.nav.marketplace, icon: ShoppingBag },
      ],
    },
    {
      groupTitle: t.nav.groupStudy,
      items: [
        { id: 'tasks', label: t.nav.tasks, icon: CheckSquare },
        { id: 'subjects', label: t.nav.subjects, icon: BookOpen },
        { id: 'planner', label: t.nav.planner, icon: Target },
        { id: 'calendar', label: t.nav.calendar, icon: Calendar },
      ],
    },
    {
      groupTitle: t.nav.groupInsights,
      items: [
        { id: 'arena', label: t.nav.arena, icon: Trophy },
        { id: 'analytics', label: t.nav.analytics, icon: BarChart3 },
        { id: 'achievements', label: t.nav.achievements, icon: Award },
      ],
    },
    {
      groupTitle: t.nav.groupSystem,
      items: [
        { id: 'notifications', label: t.nav.notifications, icon: Bell },
        { id: 'profile', label: t.nav.profile, icon: User },
        { id: 'settings', label: t.nav.settings, icon: Settings },
      ],
    },
  ];

  const currentSectionLabel =
    navGroups
      .flatMap((g) => g.items)
      .find((i) => i.id === activeSection)?.label || t.nav.dashboard;

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#14251B] text-[#FAF8EF] p-6">
        <div className="w-14 h-14 rounded-2xl bg-[#234B35] border border-[#D6B56D] flex items-center justify-center animate-pulse mb-4">
          <Trees className="w-8 h-8 text-[#D6B56D]" />
        </div>
        <p className="text-sm font-semibold text-[#A9C7A4]">{t.app.loading}</p>
      </div>
    );
  }

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col lg:flex-row transition-colors ${
        profile.theme === 'dark'
          ? 'bg-[#14251B] text-[#FAF8EF]'
          : 'bg-[#F4F8F2] text-[#16261C]'
      }`}
    >
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-[#1B3727] text-[#FAF8EF] border-e border-[#3D7950]/25 select-none">
        {/* Brand Logo Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3D7950] to-[#234B35] border border-[#D6B56D]/60 flex items-center justify-center shadow">
              <Trees className="w-5 h-5 text-[#D6B56D]" />
            </div>
            <div className="text-start">
              <div className="text-base font-extrabold tracking-tight text-[#FAF8EF] leading-none">
                {t.app.name}
              </div>
              <div className="text-[10px] text-[#A9C7A4] mt-0.5">
                {t.app.localBadge}
              </div>
            </div>
          </button>
        </div>

        {/* All 15 Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#A9C7A4]/65">
                {group.groupTitle}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const isRunningTimer =
                  item.id === 'timer' && timerState.status === 'running';
                const hasUnreadBadge =
                  item.id === 'notifications' && unreadCount > 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#3D7950] text-white shadow-sm border-s-4 border-[#D6B56D]'
                        : 'text-[#FAF8EF]/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-[#D6B56D]' : 'text-[#A9C7A4]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {isRunningTimer && (
                      <span className="px-1.5 py-0.5 rounded bg-[#D6B56D] text-[#14251B] font-mono text-[10px] font-bold">
                        {formatClockMMSS(remainingSeconds, lang)}
                      </span>
                    )}
                    {hasUnreadBadge && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#D6B56D] text-[#14251B] font-mono text-[10px] font-bold">
                        {formatNumberLocale(unreadCount, lang)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Sidebar Level & XP Summary */}
        <div className="p-4 m-3 rounded-2xl bg-[#14251B]/80 border border-[#3D7950]/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#D6B56D]">
              {t.app.level} {formatNumberLocale(levelInfo.level, lang)}
            </span>
            <span className="font-mono text-[11px] text-[#A9C7A4]">
              {formatNumberLocale(levelInfo.progressPct, lang)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-[#D6B56D]"
              style={{ width: `${levelInfo.progressPct}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[82vw] bg-[#1B3727] text-[#FAF8EF] h-full flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Trees className="w-6 h-6 text-[#D6B56D]" />
                <span className="font-extrabold text-lg">{t.app.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-4">
              {navGroups.map((group) => (
                <div key={group.groupTitle} className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#A9C7A4]/70">
                    {group.groupTitle}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? 'bg-[#3D7950] text-white'
                            : 'text-[#FAF8EF]/80'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#D6B56D]" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Persistent Top Header */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 backdrop-blur-md bg-[#FAF8EF]/85 dark:bg-[#14251B]/85 border-b border-[#234B35]/10 dark:border-[#A9C7A4]/15 flex items-center justify-between gap-3">
          {/* Left: Mobile Menu Button + Logo (Mobile) + Current Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#234B35] text-[#FAF8EF]"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="lg:hidden font-extrabold text-sm text-[#234B35] dark:text-[#D6B56D]">
                {t.app.name}
              </span>
              <span className="lg:hidden text-gray-400">•</span>
              <h2 className="text-sm sm:text-base font-bold truncate">
                {currentSectionLabel}
              </h2>
            </div>
          </div>

          {/* Right: Wallet Pills, Level Progress, Theme Toggle, Mandatory EN | AR Switcher, Notification Bell, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Wallet Pill: Leaf Coins & Forest Points */}
            <button
              type="button"
              onClick={() => setActiveSection('marketplace')}
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#234B35]/10 dark:bg-white/10 border border-[#3D7950]/30 text-xs font-mono font-bold cursor-pointer"
            >
              <span className="flex items-center gap-1 text-[#B8862D] dark:text-[#D6B56D]">
                <Coins className="w-3.5 h-3.5" />
                {formatNumberLocale(profile.leafCoins, lang)}
              </span>
              <span className="opacity-30">|</span>
              <span className="flex items-center gap-1 text-[#3D7950] dark:text-[#A9C7A4]">
                <Sparkles className="w-3.5 h-3.5" />
                {formatNumberLocale(profile.forestPoints, lang)}
              </span>
            </button>

            {/* Level Pill */}
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#234B35] text-[#FAF8EF] text-xs font-bold cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-[#D6B56D]" />
              <span>
                {t.app.level} {formatNumberLocale(levelInfo.level, lang)}
              </span>
            </button>

            {/* MANDATORY BILINGUAL LANGUAGE SWITCHER: EN | AR */}
            <div
              role="group"
              aria-label="Language Switcher"
              className="flex items-center p-0.5 rounded-xl bg-[#234B35] text-[#FAF8EF] border border-[#D6B56D]/50 text-xs font-extrabold shadow-xs"
            >
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#D6B56D] text-[#14251B]'
                    : 'text-[#FAF8EF]/80 hover:text-white'
                }`}
              >
                EN
              </button>
              <span className="text-[#A9C7A4]/40 px-0.5">|</span>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'ar'
                    ? 'bg-[#D6B56D] text-[#14251B]'
                    : 'text-[#FAF8EF]/80 hover:text-white'
                }`}
              >
                AR
              </button>
            </div>

            {/* Light / Dark Theme Toggle */}
            <button
              type="button"
              onClick={() =>
                setTheme(profile.theme === 'dark' ? 'light' : 'dark')
              }
              className="p-2 rounded-xl bg-[#234B35]/10 dark:bg-white/10 hover:bg-[#3D7950]/20 transition-colors cursor-pointer"
              title={t.settings.themeLabel}
            >
              {profile.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#D6B56D]" />
              ) : (
                <Moon className="w-4 h-4 text-[#234B35]" />
              )}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl bg-[#234B35]/10 dark:bg-white/10 hover:bg-[#3D7950]/20 transition-colors cursor-pointer"
                aria-label={t.nav.notifications}
              >
                <Bell className="w-4 h-4 text-[#234B35] dark:text-[#FAF8EF]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C84B31] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/20 dark:border-[#A9C7A4]/20 shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-current/10 pb-2">
                    <span className="text-xs font-bold">
                      {t.notifications.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead()}
                      className="text-[11px] font-semibold text-[#3D7950] dark:text-[#D6B56D] hover:underline cursor-pointer"
                    >
                      {t.notifications.markAllRead}
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifDropdownOpen(false);
                          if (n.actionSection) {
                            setActiveSection(n.actionSection);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          n.read
                            ? 'bg-black/5 dark:bg-white/5 border-transparent opacity-70'
                            : 'bg-[#3D7950]/10 border-[#3D7950]/30'
                        }`}
                      >
                        <div className="font-bold">{n.title[lang]}</div>
                        <div className="text-[11px] opacity-80 line-clamp-2 mt-0.5">
                          {n.description[lang]}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      setActiveSection('notifications');
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] cursor-pointer"
                  >
                    {t.dashboard.viewAll}
                  </button>
                </div>
              )}
            </div>

            {/* User Profile Button */}
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-[#234B35]/10 dark:bg-white/10 hover:bg-[#3D7950]/20 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-[#3D7950] text-white flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="hidden xl:inline text-xs font-bold truncate max-w-[100px]">
                {profile.username}
              </span>
            </button>
          </div>
        </header>

        {/* Active Focus Session Floating Banner when navigating other pages */}
        {timerState.status !== 'idle' && activeSection !== 'timer' && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-[#234B35] text-[#FAF8EF] border border-[#D6B56D] shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <Sprout className="w-4 h-4 text-[#D6B56D] animate-bounce" />
              <span>{t.app.activeTimerBanner}:</span>
              <strong className="font-mono text-sm text-[#D6B56D]">
                {formatClockMMSS(remainingSeconds, lang)}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('timer')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#D6B56D] text-[#14251B] hover:bg-[#e2c47e] cursor-pointer"
            >
              {t.app.returnToTimer}
            </button>
          </div>
        )}

        {/* New Personal Record Celebration Banner */}
        {recordCelebrationBanner && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#D6B56D] to-[#e4c887] text-[#14251B] shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold">
              <Trophy className="w-5 h-5" />
              <span>{recordCelebrationBanner[lang]}</span>
            </div>
            <button
              type="button"
              onClick={clearCelebrationBanner}
              className="p-1 rounded-lg bg-black/10 hover:bg-black/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeSection === 'dashboard' && <DashboardView />}
          {activeSection === 'timer' && <FocusTimerView />}
          {activeSection === 'forest' && <PersonalForestView />}
          {activeSection === 'collection' && <TreeCollectionView />}
          {activeSection === 'marketplace' && <MarketplaceView />}
          {activeSection === 'tasks' && <TasksView />}
          {activeSection === 'subjects' && <SubjectsView />}
          {activeSection === 'planner' && <StudyPlannerView />}
          {activeSection === 'calendar' && <StudyCalendarView />}
          {activeSection === 'arena' && <FocusArenaView />}
          {activeSection === 'analytics' && <AnalyticsView />}
          {activeSection === 'achievements' && (
            <AchievementsAndChallengesView />
          )}
          {activeSection === 'notifications' && <NotificationsView />}
          {activeSection === 'profile' && <ProfileView />}
          {activeSection === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
