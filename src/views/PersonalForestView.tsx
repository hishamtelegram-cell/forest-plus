'use client';

import React, { useState } from 'react';
import { useForestEcosystem } from '@/contexts/ForestEcosystemContext';
import {
  FOREST_ENVIRONMENTS_CATALOG,
  FOREST_SIZES_CATALOG,
  TREE_SPECIES_CATALOG,
} from '@/domain/catalog';
import {
  formatDateLocale,
  formatDurationMinutes,
  formatNumberLocale,
} from '@/translations';
import PersonalForestCanvas from '@/three/PersonalForestCanvas';
import {
  Bird,
  Compass,
  Info,
  Lock,
  Move,
  ShoppingBag,
  Sparkles,
  Trees,
} from 'lucide-react';

export default function PersonalForestView() {
  const {
    profile,
    lang,
    t,
    trees,
    subjects,
    updateProfileSettings,
    relocateTreeSlot,
    setActiveSection,
  } = useForestEcosystem();

  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(
    trees[0]?.id || null
  );
  const [isRelocating, setIsRelocating] = useState<boolean>(false);

  const activeSizeMeta =
    FOREST_SIZES_CATALOG.find((f) => f.id === profile.activeForestSize) ||
    FOREST_SIZES_CATALOG[0];
  const activeEnvMeta =
    FOREST_ENVIRONMENTS_CATALOG.find((e) => e.id === profile.activeEnvironment) ||
    FOREST_ENVIRONMENTS_CATALOG[0];

  const activeTrees = trees.filter(
    (tr) => tr.forestSizeId === profile.activeForestSize
  );
  const vaultedTrees = trees.filter((tr) => tr.forestSizeId === 'vault');
  const selectedTree = trees.find((tr) => tr.id === selectedTreeId) || null;
  const selectedSpeciesMeta = selectedTree
    ? TREE_SPECIES_CATALOG.find((s) => s.id === selectedTree.speciesId)
    : null;
  const selectedSubject = selectedTree
    ? subjects.find((s) => s.id === selectedTree.subjectId)
    : null;

  const slotToTreeMap = new Map<number, typeof trees[0]>();
  activeTrees.forEach((tr) => {
    slotToTreeMap.set(tr.slotIndex, tr);
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Biome / Size Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
            <Trees className="w-6 h-6 text-[#3D7950]" />
            <span>{t.forest.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.forest.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Wildlife Toggle */}
          <button
            type="button"
            onClick={() =>
              updateProfileSettings({ wildlifeEnabled: !profile.wildlifeEnabled })
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              profile.wildlifeEnabled
                ? 'bg-[#3D7950]/15 text-[#234B35] dark:text-[#A9C7A4] border-[#3D7950]/40'
                : 'bg-transparent text-[#4A5E50] border-gray-400/30'
            }`}
          >
            <Bird className="w-4 h-4" />
            <span>{t.forest.toggleWildlife}</span>
          </button>

          {/* Expand / Unlock in Marketplace */}
          <button
            type="button"
            onClick={() => setActiveSection('marketplace')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#D6B56D] text-[#14251B] hover:bg-[#e2c47e] transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.nav.marketplace}</span>
          </button>
        </div>
      </div>

      {/* Forest Size & Environment Biome Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 5 Forest Sizes */}
        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#16261C] dark:text-[#FAF8EF]">
              {t.forest.activeSize}: {activeSizeMeta.name[lang]}
            </span>
            <span className="font-mono text-[#3D7950] dark:text-[#D6B56D]">
              {formatNumberLocale(activeTrees.length, lang)} /{' '}
              {formatNumberLocale(activeSizeMeta.capacity, lang)} {t.app.trees}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FOREST_SIZES_CATALOG.map((sz) => {
              const isOwned = profile.ownedForests.includes(sz.id);
              const isActive = profile.activeForestSize === sz.id;
              return (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => {
                    if (isOwned) {
                      updateProfileSettings({ activeForestSize: sz.id });
                    } else {
                      setActiveSection('marketplace');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#234B35] text-[#FAF8EF] shadow-sm'
                      : isOwned
                        ? 'bg-[#F4F8F2] dark:bg-[#14251B] text-[#16261C] dark:text-[#FAF8EF] hover:bg-[#3D7950]/20'
                        : 'bg-gray-200/60 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {!isOwned && <Lock className="w-3 h-3" />}
                  <span>{sz.name[lang]}</span>
                  <span className="font-mono text-[10px] opacity-75">
                    ({sz.capacity})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 8 Forest Environments */}
        <div className="rounded-2xl p-4 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/10 dark:border-[#A9C7A4]/15 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#16261C] dark:text-[#FAF8EF]">
              {t.forest.activeBiome}: {activeEnvMeta.name[lang]}
            </span>
            <span className="text-[11px] text-[#4A5E50] dark:text-[#A9C7A4]">
              {activeEnvMeta.wildlife.join(' • ')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FOREST_ENVIRONMENTS_CATALOG.map((env) => {
              const isOwned = profile.ownedEnvironments.includes(env.id);
              const isActive = profile.activeEnvironment === env.id;
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => {
                    if (isOwned) {
                      updateProfileSettings({ activeEnvironment: env.id });
                    } else {
                      setActiveSection('marketplace');
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#234B35] text-[#FAF8EF] shadow-sm'
                      : isOwned
                        ? 'bg-[#F4F8F2] dark:bg-[#14251B] text-[#16261C] dark:text-[#FAF8EF] hover:bg-[#3D7950]/20'
                        : 'bg-gray-200/60 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: env.groundColor }}
                  />
                  {!isOwned && <Lock className="w-3 h-3" />}
                  <span>{env.name[lang]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 3D Sanctuary Viewport + Tree Inspector Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <PersonalForestCanvas
            forestSizeId={profile.activeForestSize}
            environmentId={profile.activeEnvironment}
            trees={activeTrees}
            decorations={profile.ownedDecorations}
            selectedTreeId={selectedTreeId}
            onSelectTree={(id) => {
              setSelectedTreeId(id);
              setIsRelocating(false);
            }}
            wildlifeEnabled={profile.wildlifeEnabled}
            animationsEnabled={profile.animationsEnabled}
            heightClass="h-[460px] sm:h-[520px]"
          />
          <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#3D7950]" />
            <span>{t.forest.clickTreeHint}</span>
          </p>
        </div>

        {/* Right 4 Cols: Selected Tree Inspector & Plot Grid Rearrangement */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Selected Tree Inspector Card */}
          <div className="rounded-2xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 dark:border-[#A9C7A4]/15 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#3D7950]" />
              <span>{t.forest.inspectTreeTitle}</span>
            </h2>

            {selectedTree && selectedSpeciesMeta ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/25 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#16261C] dark:text-[#FAF8EF]">
                      {selectedSpeciesMeta.name[lang]}
                    </div>
                    <div className="text-xs italic text-[#4A5E50] dark:text-[#A9C7A4]">
                      {selectedSpeciesMeta.scientificName}
                    </div>
                  </div>
                  <span
                    className="w-8 h-8 rounded-xl border border-white/20"
                    style={{ backgroundColor: selectedSpeciesMeta.leafPrimaryColor }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]/60">
                    <span className="text-[#4A5E50] dark:text-[#A9C7A4] block">
                      {t.forest.subjectStudied}
                    </span>
                    <strong className="mt-0.5 block truncate">
                      {selectedSubject
                        ? lang === 'ar' && selectedSubject.nameAr
                          ? selectedSubject.nameAr
                          : selectedSubject.name
                        : 'General'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]/60">
                    <span className="text-[#4A5E50] dark:text-[#A9C7A4] block">
                      {t.forest.focusDuration}
                    </span>
                    <strong className="mt-0.5 block font-mono">
                      {formatDurationMinutes(
                        Math.round(selectedTree.focusDurationSec / 60),
                        lang
                      )}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F4F8F2] dark:bg-[#14251B]/60 col-span-2">
                    <span className="text-[#4A5E50] dark:text-[#A9C7A4] block">
                      {t.forest.plantedOn}
                    </span>
                    <strong className="mt-0.5 block font-mono">
                      {formatDateLocale(selectedTree.createdAt, lang)} (Slot #
                      {formatNumberLocale(selectedTree.slotIndex + 1, lang)})
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRelocating(!isRelocating)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isRelocating
                      ? 'bg-[#D6B56D] text-[#14251B]'
                      : 'bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950]'
                  }`}
                >
                  <Move className="w-4 h-4" />
                  <span>
                    {isRelocating
                      ? t.forest.selectDestinationSlot
                      : t.forest.relocateTree}
                  </span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4] py-4">
                {t.forest.emptyForestNote}
              </p>
            )}
          </div>

          {/* Interactive Forest Plot Slot Grid (Click to Select or Relocate) */}
          <div className="rounded-2xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 dark:border-[#A9C7A4]/15 shadow-sm space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A5E50] dark:text-[#A9C7A4]">
                {t.forest.arrangeGridTitle}
              </h3>
              {vaultedTrees.length > 0 && (
                <span className="text-[11px] font-semibold text-[#D6B56D]">
                  {t.forest.vaultedTrees}: {vaultedTrees.length}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1">
              {Array.from({ length: activeSizeMeta.capacity }).map((_, slotIdx) => {
                const treeAtSlot = slotToTreeMap.get(slotIdx);
                const spMeta = treeAtSlot
                  ? TREE_SPECIES_CATALOG.find((s) => s.id === treeAtSlot.speciesId)
                  : null;
                const isSelectedSlot =
                  treeAtSlot && treeAtSlot.id === selectedTreeId;

                return (
                  <button
                    key={slotIdx}
                    type="button"
                    onClick={async () => {
                      if (isRelocating && selectedTreeId && !treeAtSlot) {
                        await relocateTreeSlot(selectedTreeId, slotIdx);
                        setIsRelocating(false);
                      } else if (treeAtSlot) {
                        setSelectedTreeId(treeAtSlot.id);
                      }
                    }}
                    className={`h-11 rounded-xl border text-[11px] font-mono flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelectedSlot
                        ? 'border-2 border-[#D6B56D] bg-[#234B35] text-[#FAF8EF] scale-105'
                        : treeAtSlot
                          ? 'border-[#3D7950]/40 bg-[#3D7950]/15 text-[#16261C] dark:text-[#FAF8EF]'
                          : isRelocating
                            ? 'border-dashed border-[#D6B56D] bg-[#D6B56D]/10 text-[#D6B56D] hover:bg-[#D6B56D]/25'
                            : 'border-[#234B35]/10 bg-[#F4F8F2] dark:bg-[#14251B]/50 text-gray-400'
                    }`}
                    title={
                      treeAtSlot
                        ? spMeta?.name[lang]
                        : `Slot #${slotIdx + 1}`
                    }
                  >
                    {treeAtSlot && spMeta ? (
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: spMeta.leafPrimaryColor }}
                      />
                    ) : (
                      <span>{slotIdx + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#234B35]/10 flex items-center justify-between text-xs">
              <span className="text-[#4A5E50] dark:text-[#A9C7A4] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D6B56D]" />
                {t.forest.decorationsTitle}
              </span>
              <span className="font-mono font-bold">
                {formatNumberLocale(profile.ownedDecorations.length, lang)} /{' '}
                {formatNumberLocale(8, lang)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
