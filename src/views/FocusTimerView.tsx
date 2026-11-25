'use client';

import React, { useState } from 'react';
import { useForestEcosystem } from '@/contexts/ForestEcosystemContext';
import { TREE_SPECIES_CATALOG } from '@/domain/catalog';
import {
  formatClockMMSS,
  formatNumberLocale,
} from '@/translations';
import ProceduralTreeCanvas from '@/three/ProceduralTreeCanvas';
import { getGrowthStageFromProgress } from '@/three/treeGenerator';
import {
  AlertTriangle,
  Award,
  Coins,
  FastForward,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sprout,
  Volume2,
  XCircle,
} from 'lucide-react';

export default function FocusTimerView() {
  const {
    profile,
    lang,
    t,
    subjects,
    timerState,
    remainingSeconds,
    timerProgress,
    lastRewardSummary,
    clearRewardSummary,
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
    setActiveSection,
  } = useForestEcosystem();

  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  const isRunningOrPaused = timerState.status !== 'idle';
  // When session is running/paused, always show real timerProgress. When idle, allow inspecting stages or default to 0.05 (seed)
  const effective3DProgress = isRunningOrPaused
    ? timerProgress
    : previewProgress !== null
      ? previewProgress
      : 0.05;

  const currentStage = getGrowthStageFromProgress(effective3DProgress);
  const stageLabelMap: Record<string, string> = {
    seed: t.timer.stage_seed,
    roots: t.timer.stage_roots,
    sprout: t.timer.stage_sprout,
    sapling: t.timer.stage_sapling,
    young: t.timer.stage_young,
    mature: t.timer.stage_mature,
  };

  // Circular SVG Ring Progress
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - Math.min(1, Math.max(0, timerProgress)) * circumference;

  const ownedSpeciesList = TREE_SPECIES_CATALOG.filter((sp) =>
    profile.ownedSpecies.includes(sp.id)
  );

  return (
    <div
      className={
        timerState.distractionFree
          ? 'fixed inset-0 z-50 bg-[#14251B] text-[#FAF8EF] p-4 sm:p-8 overflow-y-auto flex flex-col justify-between'
          : 'space-y-6 pb-10'
      }
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className={`text-2xl font-bold ${
              timerState.distractionFree
                ? 'text-[#FAF8EF]'
                : 'text-[#16261C] dark:text-[#FAF8EF]'
            }`}
          >
            {t.timer.title}
          </h1>
          <p
            className={`text-xs sm:text-sm ${
              timerState.distractionFree
                ? 'text-[#A9C7A4]'
                : 'text-[#4A5E50] dark:text-[#A9C7A4]'
            }`}
          >
            {t.timer.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Ambient Soundscape Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#3D7950]/30 text-xs">
            <Volume2 className="w-4 h-4 text-[#3D7950] dark:text-[#D6B56D]" />
            <select
              value={timerState.ambientSound}
              onChange={(e) =>
                setTimerAmbientSound(
                  e.target.value as typeof timerState.ambientSound
                )
              }
              className="bg-transparent font-medium text-[#16261C] dark:text-[#FAF8EF] focus:outline-none cursor-pointer"
            >
              <option value="none" className="text-black">
                {t.timer.soundNone}
              </option>
              <option value="rain" className="text-black">
                {t.timer.soundRain}
              </option>
              <option value="wind" className="text-black">
                {t.timer.soundWind}
              </option>
              <option value="stream" className="text-black">
                {t.timer.soundStream}
              </option>
              <option value="night" className="text-black">
                {t.timer.soundNight}
              </option>
            </select>
          </div>

          {/* Distraction-Free Zen Mode Toggle */}
          <button
            type="button"
            onClick={() => setTimerDistractionFree(!timerState.distractionFree)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] transition-colors cursor-pointer"
          >
            {timerState.distractionFree ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>{t.timer.zenModeExit}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>{t.timer.zenModeEnter}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Stage: Left 3D Procedural Tree Canvas | Right Timer & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Cols: 3D Procedural Tree Viewport */}
        <div className="lg:col-span-7 rounded-3xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 dark:border-[#A9C7A4]/15 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#3D7950] dark:text-[#D6B56D]" />
              <div>
                <span className="text-xs uppercase tracking-wider text-[#4A5E50] dark:text-[#A9C7A4] block">
                  {t.timer.growthStageLabel}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
                  {stageLabelMap[currentStage]}
                </h2>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#3D7950]/15 text-[#234B35] dark:text-[#D6B56D]">
              {isRunningOrPaused
                ? t.timer.liveSessionSync
                : `${Math.round(effective3DProgress * 100)}%`}
            </span>
          </div>

          <ProceduralTreeCanvas
            speciesId={timerState.speciesId}
            progress={effective3DProgress}
            isPaused={timerState.status === 'paused'}
            animationsEnabled={profile.animationsEnabled}
            darkMode={profile.theme === 'dark' || timerState.distractionFree}
            heightClass={
              timerState.distractionFree
                ? 'h-[460px] sm:h-[540px]'
                : 'h-[390px] sm:h-[440px]'
            }
          />

          {/* Interactive Stage Preview Scrubber when Timer is Idle */}
          {!isRunningOrPaused && (
            <div className="p-3.5 rounded-2xl bg-[#F4F8F2] dark:bg-[#14251B]/60 border border-[#3D7950]/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#234B35] dark:text-[#A9C7A4]">
                  {t.timer.previewScrubberLabel}
                </span>
                <span className="font-mono font-bold text-[#3D7950] dark:text-[#D6B56D]">
                  {formatNumberLocale(Math.round(effective3DProgress * 100), lang)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(effective3DProgress * 100)}
                onChange={(e) => setPreviewProgress(Number(e.target.value) / 100)}
                className="w-full accent-[#3D7950] cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Right 5 Cols: Timer Ring, Mode Tabs, Subject/Species Pickers & Controls */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 dark:border-[#A9C7A4]/15 shadow-sm flex flex-col justify-between space-y-6">
          {/* Timer Mode Selector Tabs */}
          {!isRunningOrPaused && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-[#F4F8F2] dark:bg-[#14251B]">
                {(
                  [
                    { id: 'focus', label: t.timer.modeFocus },
                    { id: 'short_break', label: t.timer.modeShortBreak },
                    { id: 'long_break', label: t.timer.modeLongBreak },
                    { id: 'custom', label: t.timer.modeCustom },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPreviewProgress(null);
                      setTimerMode(m.id, m.id === 'custom' ? customMinutes : undefined);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      timerState.mode === m.id
                        ? 'bg-[#234B35] text-[#FAF8EF] shadow-sm'
                        : 'text-[#4A5E50] dark:text-[#A9C7A4] hover:bg-[#234B35]/10'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Custom Duration Input or Quick 1-Min Focus Preset */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {timerState.mode === 'custom' ? (
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs font-medium text-[#4A5E50] dark:text-[#A9C7A4]">
                      {t.timer.durationMinutes}:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={customMinutes}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(180, Number(e.target.value) || 1));
                        setCustomMinutes(val);
                        setTimerMode('custom', val);
                      }}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-[#3D7950]/40 bg-white dark:bg-[#14251B] text-sm font-mono font-bold text-center"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
                    {t.timer.durationMinutes}:{' '}
                    <strong className="font-mono">
                      {formatNumberLocale(
                        Math.round(timerState.plannedDurationSec / 60),
                        lang
                      )}{' '}
                      {t.app.minutes}
                    </strong>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCustomMinutes(1);
                    setTimerMode('custom', 1);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#D6B56D]/20 text-[#234B35] dark:text-[#D6B56D] border border-[#D6B56D]/40 hover:bg-[#D6B56D]/30 cursor-pointer"
                >
                  ⚡ {t.timer.quickTestBtn}
                </button>
              </div>
            </div>
          )}

          {/* Circular Countdown Clock */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-[#234B35]/10 dark:text-white/10"
                />
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  fill="none"
                  stroke="#3D7950"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase tracking-widest text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
                  {timerState.mode === 'focus' || timerState.mode === 'custom'
                    ? t.timer.modeFocus
                    : t.timer.modeShortBreak}
                </span>
                <div
                  dir="ltr"
                  className="text-5xl font-extrabold font-mono tracking-tight text-[#16261C] dark:text-[#FAF8EF]"
                >
                  {formatClockMMSS(remainingSeconds, lang)}
                </div>
                <span className="text-xs font-mono text-[#3D7950] dark:text-[#D6B56D] mt-1.5">
                  {formatNumberLocale(Math.round(timerProgress * 100), lang)}%
                </span>
              </div>
            </div>
          </div>

          {/* Subject & Tree Species Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
                {t.timer.selectSubject}
              </label>
              <select
                disabled={isRunningOrPaused}
                value={timerState.subjectId}
                onChange={(e) => setTimerSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs font-semibold text-[#16261C] dark:text-[#FAF8EF] disabled:opacity-60 cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {lang === 'ar' && sub.nameAr ? sub.nameAr : sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A5E50] dark:text-[#A9C7A4] mb-1">
                {t.timer.selectSpecies}
              </label>
              <select
                disabled={isRunningOrPaused}
                value={timerState.speciesId}
                onChange={(e) =>
                  setTimerSpecies(e.target.value as typeof timerState.speciesId)
                }
                className="w-full px-3 py-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/30 text-xs font-semibold text-[#16261C] dark:text-[#FAF8EF] disabled:opacity-60 cursor-pointer"
              >
                {ownedSpeciesList.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Action Controls */}
          <div className="space-y-2.5 pt-2">
            {timerState.status === 'idle' && (
              <button
                type="button"
                onClick={() => {
                  setPreviewProgress(null);
                  startTimer();
                }}
                className="w-full py-4 rounded-2xl font-bold text-base bg-[#234B35] hover:bg-[#3D7950] text-[#FAF8EF] shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{t.timer.startSession}</span>
              </button>
            )}

            {timerState.status === 'running' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={pauseTimer}
                  className="py-3.5 rounded-2xl font-bold text-sm bg-[#D6B56D] text-[#14251B] hover:bg-[#e2c47e] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{t.timer.pauseSession}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="py-3.5 rounded-2xl font-bold text-sm bg-[#C84B31]/15 text-[#C84B31] border border-[#C84B31]/30 hover:bg-[#C84B31]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{t.timer.cancelSession}</span>
                </button>
              </div>
            )}

            {timerState.status === 'paused' && (
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={resumeTimer}
                  className="py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-[#3D7950] text-[#FAF8EF] hover:bg-[#234B35] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t.timer.resumeSession}</span>
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  className="py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-[#234B35]/15 text-[#234B35] dark:text-[#A9C7A4] hover:bg-[#234B35]/25 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.timer.resetTimer}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-[#C84B31]/15 text-[#C84B31] hover:bg-[#C84B31]/25 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{t.timer.cancelSession}</span>
                </button>
              </div>
            )}

            {(timerState.mode === 'short_break' ||
              timerState.mode === 'long_break') && (
              <button
                type="button"
                onClick={skipBreak}
                className="w-full py-2.5 rounded-xl text-xs font-semibold border border-[#3D7950]/40 text-[#3D7950] dark:text-[#A9C7A4] flex items-center justify-center gap-1.5 hover:bg-[#3D7950]/10 cursor-pointer"
              >
                <FastForward className="w-4 h-4" />
                <span>{t.timer.skipBreak}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Session Confirmation Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#C84B31]/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#C84B31]">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold">{t.timer.cancelWarningTitle}</h3>
            </div>
            <p className="text-sm text-[#4A5E50] dark:text-[#A9C7A4] leading-relaxed">
              {t.timer.cancelWarningDesc}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] cursor-pointer"
              >
                {t.timer.keepFocusingBtn}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowCancelModal(false);
                  await cancelTimer();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#C84B31] text-white hover:bg-[#a83820] cursor-pointer"
              >
                {t.timer.confirmCancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Completed Reward Breakdown Modal */}
      {lastRewardSummary && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-3xl p-6 sm:p-8 bg-[#FAF8EF] dark:bg-[#1D3326] border-2 border-[#D6B56D] shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#3D7950]/20 border border-[#D6B56D] mx-auto flex items-center justify-center">
              <Sprout className="w-9 h-9 text-[#3D7950] dark:text-[#D6B56D]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF]">
                {t.timer.rewardModalTitle}
              </h3>
              <p className="text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
                {t.timer.rewardModalSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/20">
                <Coins className="w-5 h-5 text-[#D6B56D] mx-auto mb-1" />
                <div className="text-lg font-extrabold font-mono text-[#D6B56D]">
                  +{formatNumberLocale(lastRewardSummary.coinsEarned, lang)}
                </div>
                <div className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
                  {t.app.leafCoins}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/20">
                <Sparkles className="w-5 h-5 text-[#3D7950] mx-auto mb-1" />
                <div className="text-lg font-extrabold font-mono text-[#3D7950] dark:text-[#A9C7A4]">
                  +{formatNumberLocale(lastRewardSummary.pointsEarned, lang)}
                </div>
                <div className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
                  {t.app.forestPoints}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/20">
                <Award className="w-5 h-5 text-[#D6B56D] mx-auto mb-1" />
                <div className="text-lg font-extrabold font-mono text-[#16261C] dark:text-[#FAF8EF]">
                  +{formatNumberLocale(lastRewardSummary.xpEarned, lang)}
                </div>
                <div className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
                  {t.app.xp}
                </div>
              </div>
            </div>

            {lastRewardSummary.diminishedApplied && (
              <p className="text-xs p-3 rounded-xl bg-[#D9822B]/15 text-[#D9822B] border border-[#D9822B]/30">
                {t.timer.diminishingNotice}
              </p>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  clearRewardSummary();
                  setActiveSection('forest');
                }}
                className="px-5 py-3 rounded-xl text-xs font-bold bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] cursor-pointer"
              >
                {t.dashboard.exploreForest}
              </button>
              <button
                type="button"
                onClick={clearRewardSummary}
                className="px-5 py-3 rounded-xl text-xs font-semibold border border-[#3D7950]/40 text-[#16261C] dark:text-[#FAF8EF] cursor-pointer"
              >
                {t.app.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
