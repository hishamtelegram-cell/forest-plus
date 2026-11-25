'use client';

import React, { useState } from 'react';
import { useForestEcosystem } from '@/contexts/ForestEcosystemContext';
import { MARKETPLACE_CATALOG, TREE_SPECIES_CATALOG } from '@/domain/catalog';
import { TreeSpeciesId } from '@/domain/types';
import { formatNumberLocale } from '@/translations';
import ProceduralTreeCanvas from '@/three/ProceduralTreeCanvas';
import {
  CheckCircle2,
  Coins,
  Lock,
  Sparkles,
  Sprout,
  Trees,
} from 'lucide-react';

export default function TreeCollectionView() {
  const {
    profile,
    lang,
    t,
    trees,
    setTimerSpecies,
    purchaseMarketplaceItem,
    setActiveSection,
  } = useForestEcosystem();

  const [inspectedSpecies, setInspectedSpecies] = useState<TreeSpeciesId>(
    profile.selectedSpecies || 'oak'
  );
  const [labProgress, setLabProgress] = useState<number>(1.0);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const inspectedMeta =
    TREE_SPECIES_CATALOG.find((s) => s.id === inspectedSpecies) ||
    TREE_SPECIES_CATALOG[0];

  const handleUnlockSpecies = async (spId: TreeSpeciesId) => {
    const mktItem = MARKETPLACE_CATALOG.find(
      (i) => i.category === 'species' && i.refId === spId
    );
    if (!mktItem) return;
    const res = await purchaseMarketplaceItem(mktItem);
    setFeedbackMsg(res.message);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
            <Sprout className="w-6 h-6 text-[#3D7950]" />
            <span>{t.collection.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.collection.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#3D7950]/30 text-xs font-semibold flex items-center gap-2">
            <Trees className="w-4 h-4 text-[#3D7950]" />
            <span>{t.collection.unlockedCount}:</span>
            <strong className="font-mono text-[#234B35] dark:text-[#D6B56D]">
              {formatNumberLocale(profile.ownedSpecies.length, lang)} /{' '}
              {formatNumberLocale(TREE_SPECIES_CATALOG.length, lang)}
            </strong>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-[#3D7950]/20 border border-[#3D7950] text-xs font-bold text-[#234B35] dark:text-[#FAF8EF]">
          {feedbackMsg}
        </div>
      )}

      {/* Top Interactive 3D Species & Growth Stage Laboratory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-3xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 dark:border-[#A9C7A4]/15 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
                {t.collection.inspect3DTitle}:{' '}
                <span className="text-[#3D7950] dark:text-[#D6B56D]">
                  {inspectedMeta.name[lang]}
                </span>
              </h2>
              <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4]">
                {t.collection.scrubGrowthDesc}
              </p>
            </div>
          </div>

          <ProceduralTreeCanvas
            speciesId={inspectedSpecies}
            progress={labProgress}
            animationsEnabled={profile.animationsEnabled}
            darkMode={profile.theme === 'dark'}
            heightClass="h-[360px]"
          />

          {/* 6 Stage Quick Buttons + Continuous Slider */}
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { label: '1. Seed (5%)', val: 0.05 },
                { label: '2. Roots (16%)', val: 0.16 },
                { label: '3. Sprout (30%)', val: 0.3 },
                { label: '4. Sapling (50%)', val: 0.5 },
                { label: '5. Young (75%)', val: 0.75 },
                { label: '6. Mature (100%)', val: 1.0 },
              ].map((st) => (
                <button
                  key={st.label}
                  type="button"
                  onClick={() => setLabProgress(st.val)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    Math.abs(labProgress - st.val) < 0.06
                      ? 'bg-[#234B35] text-[#FAF8EF]'
                      : 'bg-[#F4F8F2] dark:bg-[#14251B] text-[#4A5E50] dark:text-[#A9C7A4] hover:bg-[#3D7950]/15'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(labProgress * 100)}
              onChange={(e) => setLabProgress(Number(e.target.value) / 100)}
              className="w-full accent-[#3D7950] cursor-pointer"
            />
          </div>
        </div>

        {/* Right 5 Cols: Selected Species Botanical Dossier */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 dark:border-[#A9C7A4]/15 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono italic text-[#3D7950] dark:text-[#D6B56D]">
                  {inspectedMeta.scientificName}
                </span>
                <h3 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF]">
                  {inspectedMeta.name[lang]}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-6 h-6 rounded-full border border-white/20 shadow"
                  style={{ backgroundColor: inspectedMeta.leafPrimaryColor }}
                  title="Canopy Color"
                />
                <span
                  className="w-6 h-6 rounded-full border border-white/20 shadow"
                  style={{ backgroundColor: inspectedMeta.trunkColor }}
                  title="Bark Color"
                />
              </div>
            </div>

            <p className="text-sm text-[#4A5E50] dark:text-[#A9C7A4] leading-relaxed">
              {inspectedMeta.description[lang]}
            </p>

            <div className="p-4 rounded-2xl bg-[#F4F8F2] dark:bg-[#14251B] border border-[#3D7950]/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#4A5E50] dark:text-[#A9C7A4]">
                  {t.collection.totalPlantedOfSpecies}:
                </span>
                <strong className="font-mono text-sm">
                  {formatNumberLocale(
                    trees.filter((tr) => tr.speciesId === inspectedMeta.id).length,
                    lang
                  )}{' '}
                  {t.app.trees}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4A5E50] dark:text-[#A9C7A4]">
                  {t.marketplace.requiresLevel}:
                </span>
                <strong className="font-mono">
                  {t.app.level} {formatNumberLocale(inspectedMeta.requiredLevel, lang)}
                </strong>
              </div>
              <div className="pt-1 text-[#234B35] dark:text-[#D6B56D] font-medium">
                {inspectedMeta.unlockRequirementText[lang]}
              </div>
            </div>
          </div>

          <div className="pt-2">
            {profile.ownedSpecies.includes(inspectedMeta.id) ? (
              <button
                type="button"
                onClick={() => {
                  setTimerSpecies(inspectedMeta.id);
                  setActiveSection('timer');
                }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#D6B56D]" />
                <span>
                  {profile.selectedSpecies === inspectedMeta.id
                    ? t.collection.selectedForTimer
                    : t.collection.selectForTimer}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleUnlockSpecies(inspectedMeta.id)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[#D6B56D] text-[#14251B] hover:bg-[#e2c47e] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>
                  {t.app.unlock} ({formatNumberLocale(inspectedMeta.priceCoins, lang)}{' '}
                  {t.app.leafCoins})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* All 10 Species Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {TREE_SPECIES_CATALOG.map((sp) => {
          const isOwned = profile.ownedSpecies.includes(sp.id);
          const isInspected = inspectedSpecies === sp.id;
          const plantedCount = trees.filter((tr) => tr.speciesId === sp.id).length;

          return (
            <div
              key={sp.id}
              onClick={() => setInspectedSpecies(sp.id)}
              className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isInspected
                  ? 'bg-[#234B35] text-[#FAF8EF] border-[#D6B56D] shadow-md scale-[1.01]'
                  : 'bg-[#FAF8EF] dark:bg-[#1D3326] text-[#16261C] dark:text-[#FAF8EF] border-[#234B35]/15 hover:border-[#3D7950]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-white/30"
                      style={{ backgroundColor: sp.leafPrimaryColor }}
                    />
                    <span className="text-[11px] font-mono opacity-80">
                      {t.app.level} {formatNumberLocale(sp.requiredLevel, lang)}
                    </span>
                  </div>
                  {isOwned ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3D7950]/30 text-[#D6B56D]">
                      {t.app.owned}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/20 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {formatNumberLocale(sp.priceCoins, lang)}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm">{sp.name[lang]}</h3>
                  <p className="text-[11px] italic opacity-75">
                    {sp.scientificName}
                  </p>
                </div>

                <p className="text-xs opacity-85 line-clamp-2">
                  {sp.description[lang]}
                </p>
              </div>

              <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#D6B56D]" />
                  {formatNumberLocale(plantedCount, lang)} {t.app.trees}
                </span>
                <span className="font-semibold underline">3D Preview</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
