'use client';

import React, { useState } from 'react';
import { useForestEcosystem } from '@/contexts/ForestEcosystemContext';
import {
  FOREST_SIZES_CATALOG,
  MARKETPLACE_CATALOG,
} from '@/domain/catalog';
import {
  AppThemeAccentId,
  DecorationId,
  ForestEnvId,
  ForestSizeId,
  MarketplaceItemMeta,
  TreeSpeciesId,
} from '@/domain/types';
import { formatNumberLocale } from '@/translations';
import {
  Award,
  CheckCircle2,
  Coins,
  Lock,
  Palette,
  ShoppingBag,
  Sparkles,
  Sprout,
  Trees,
} from 'lucide-react';

export default function MarketplaceView() {
  const {
    profile,
    lang,
    t,
    purchaseMarketplaceItem,
    updateProfileSettings,
  } = useForestEcosystem();

  const [activeCategory, setActiveCategory] = useState<
    'forests' | 'species' | 'themes' | 'decorations'
  >('forests');
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const checkIsOwned = (item: MarketplaceItemMeta): boolean => {
    if (item.initiallyOwned) return true;
    if (item.category === 'species') {
      return profile.ownedSpecies.includes(item.refId as TreeSpeciesId);
    }
    if (item.category === 'forests') {
      return (
        profile.ownedForests.includes(item.refId as ForestSizeId) ||
        profile.ownedEnvironments.includes(item.refId as ForestEnvId)
      );
    }
    if (item.category === 'themes') {
      return profile.ownedThemes.includes(item.refId as AppThemeAccentId);
    }
    if (item.category === 'decorations') {
      return profile.ownedDecorations.includes(item.refId as DecorationId);
    }
    return false;
  };

  const checkIsEquipped = (item: MarketplaceItemMeta): boolean => {
    if (item.category === 'species') {
      return profile.selectedSpecies === item.refId;
    }
    if (item.category === 'forests') {
      return (
        profile.activeForestSize === item.refId ||
        profile.activeEnvironment === item.refId
      );
    }
    if (item.category === 'themes') {
      return profile.accentTheme === item.refId;
    }
    if (item.category === 'decorations') {
      return profile.ownedDecorations.includes(item.refId as DecorationId);
    }
    return false;
  };

  const handleEquipItem = async (item: MarketplaceItemMeta) => {
    if (item.category === 'species') {
      await updateProfileSettings({
        selectedSpecies: item.refId as TreeSpeciesId,
      });
    } else if (item.category === 'forests') {
      const isSize = FOREST_SIZES_CATALOG.some((f) => f.id === item.refId);
      if (isSize) {
        await updateProfileSettings({
          activeForestSize: item.refId as ForestSizeId,
        });
      } else {
        await updateProfileSettings({
          activeEnvironment: item.refId as ForestEnvId,
        });
      }
    } else if (item.category === 'themes') {
      await updateProfileSettings({
        accentTheme: item.refId as AppThemeAccentId,
      });
    }
  };

  const handleBuy = async (item: MarketplaceItemMeta) => {
    const res = await purchaseMarketplaceItem(item);
    setToast({ ok: res.ok, text: res.message });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredItems = MARKETPLACE_CATALOG.filter(
    (i) => i.category === activeCategory
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Wallet Display */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16261C] dark:text-[#FAF8EF] flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-[#D6B56D]" />
            <span>{t.marketplace.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5E50] dark:text-[#A9C7A4]">
            {t.marketplace.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-[#234B35] text-[#FAF8EF] flex items-center gap-2.5 shadow-sm">
            <Coins className="w-5 h-5 text-[#D6B56D]" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#A9C7A4] block">
                {t.marketplace.walletBalance}
              </span>
              <span className="text-base font-extrabold font-mono text-[#D6B56D]">
                {formatNumberLocale(profile.leafCoins, lang)} {t.app.leafCoins}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'forests', label: t.marketplace.catForests, icon: Trees },
            { id: 'species', label: t.marketplace.catSpecies, icon: Sprout },
            { id: 'decorations', label: t.marketplace.catDecorations, icon: Sparkles },
            { id: 'themes', label: t.marketplace.catThemes, icon: Palette },
          ] as const
        ).map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#234B35] text-[#FAF8EF] shadow-md'
                  : 'bg-[#FAF8EF] dark:bg-[#1D3326] text-[#4A5E50] dark:text-[#A9C7A4] border border-[#234B35]/15 hover:bg-[#3D7950]/15'
              }`}
            >
              <Icon className="w-4 h-4 text-[#D6B56D]" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border ${
            toast.ok
              ? 'bg-[#3D7950]/20 border-[#3D7950] text-[#234B35] dark:text-[#FAF8EF]'
              : 'bg-[#C84B31]/20 border-[#C84B31] text-[#C84B31]'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Marketplace Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const owned = checkIsOwned(item);
          const equipped = checkIsEquipped(item);
          const canAfford = profile.leafCoins >= item.priceCoins;
          const meetsLevel = profile.level >= item.requiredLevel;

          return (
            <div
              key={item.id}
              className="rounded-3xl p-5 bg-[#FAF8EF] dark:bg-[#1D3326] border border-[#234B35]/15 dark:border-[#A9C7A4]/15 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Preview Banner */}
                <div
                  className="h-28 rounded-2xl p-4 flex items-end justify-between relative overflow-hidden border border-black/10"
                  style={{
                    background: `linear-gradient(135deg, ${item.previewColor} 0%, ${item.secondaryColor} 100%)`,
                  }}
                >
                  {item.badgeText && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/55 text-white backdrop-blur-sm">
                      {item.badgeText[lang]}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/90 text-[#14251B] flex items-center gap-1">
                    <Award className="w-3 h-3 text-[#3D7950]" />
                    {t.app.level} {formatNumberLocale(item.requiredLevel, lang)}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#16261C] dark:text-[#FAF8EF]">
                    {item.name[lang]}
                  </h3>
                  <p className="text-xs text-[#4A5E50] dark:text-[#A9C7A4] mt-1 leading-relaxed">
                    {item.description[lang]}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#234B35]/10">
                {owned ? (
                  <button
                    type="button"
                    onClick={() => handleEquipItem(item)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      equipped
                        ? 'bg-[#3D7950]/20 text-[#3D7950] dark:text-[#D6B56D] border border-[#3D7950]/40'
                        : 'bg-[#234B35] text-[#FAF8EF] hover:bg-[#3D7950]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{equipped ? t.app.equipped : t.app.equip}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canAfford || !meetsLevel}
                    onClick={() => handleBuy(item)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      canAfford && meetsLevel
                        ? 'bg-[#D6B56D] text-[#14251B] hover:bg-[#e2c47e] shadow-sm'
                        : 'bg-gray-300/60 dark:bg-white/10 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {!meetsLevel ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>
                          {t.marketplace.requiresLevel}{' '}
                          {formatNumberLocale(item.requiredLevel, lang)}
                        </span>
                      </>
                    ) : !canAfford ? (
                      <>
                        <Coins className="w-4 h-4" />
                        <span>
                          {formatNumberLocale(item.priceCoins, lang)} ({t.marketplace.insufficientCoins})
                        </span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        <span>
                          {t.app.unlock} • {formatNumberLocale(item.priceCoins, lang)}{' '}
                          {t.app.leafCoins}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center text-[#4A5E50] dark:text-[#A9C7A4] pt-2">
        {t.marketplace.noRealMoneyNotice}
      </p>
    </div>
  );
}
