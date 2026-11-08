import React, { useState, useMemo } from 'react';
import { CatTownFurniture } from '../../types.ts';
import { PixelFurnitureSprite } from './PixelFurnitureSprite.tsx';
import { XuCaIcon } from '../XuCaIcon.tsx';
import { getCatalogByCategory, getFurnitureAssetUrl } from './furnitureCatalog.ts';

interface TownFurnitureShopModalProps {
  isOpen: boolean;
  catalog: CatTownFurniture[];
  userBalance: number;
  authToken: string | null;
  onBuyItem: (item: CatTownFurniture) => Promise<void>;
  onClose: () => void;
  onOpenAuth: () => void;
}

type ShopCategory = 'bed' | 'sofa' | 'wallpaper' | 'floor' | 'decor';

const CATEGORIES: { id: ShopCategory; label: string; icon: string; countLabel: string }[] = [
  { id: 'bed', label: 'GIƯỜNG NGỦ', icon: '🛏️', countLabel: '16 mẫu' },
  { id: 'sofa', label: 'SOFA', icon: '🛋️', countLabel: '6 mẫu' },
  { id: 'wallpaper', label: 'TƯỜNG', icon: '🧱', countLabel: '15 mẫu' },
  { id: 'floor', label: 'SÀN', icon: '🪵', countLabel: '15 mẫu' },
  { id: 'decor', label: 'TRANG TRÍ', icon: '🪴', countLabel: '104 mẫu' },
];

export const TownFurnitureShopModal: React.FC<TownFurnitureShopModalProps> = ({
  isOpen,
  catalog,
  userBalance,
  authToken,
  onBuyItem,
  onClose,
  onOpenAuth,
}) => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('bed');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [buyFeedback, setBuyFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filter items by category and sort ascending by price
  const displayItems = useMemo(() => {
    return getCatalogByCategory(catalog, activeCategory);
  }, [catalog, activeCategory]);

  if (!isOpen) return null;

  const handleBuy = async (item: CatTownFurniture) => {
    if (!authToken) {
      onOpenAuth();
      return;
    }
    if (userBalance < item.price) {
      setBuyFeedback({
        text: `Bà không đủ Xu Cá! Cần thêm ${(item.price - userBalance).toLocaleString('vi-VN')} Xu Cá nữa.`,
        isError: true,
      });
      setTimeout(() => setBuyFeedback(null), 3500);
      return;
    }

    setBuyingId(item.id);
    setBuyFeedback(null);
    try {
      await onBuyItem(item);
      setBuyFeedback({
        text: `✓ Mua thành công ${item.name}! Đã lập tức chuyển về kho đồ nội thất.`,
      });
      setTimeout(() => setBuyFeedback(null), 3500);
    } catch (err: any) {
      setBuyFeedback({
        text: err?.message || 'Đã có lỗi xảy ra khi mua món đồ này.',
        isError: true,
      });
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#795653]/60 backdrop-blur-xs select-none">
      <div
        className="relative w-full max-w-4xl bg-[#FFF9F4] rounded-none border-4 sm:border-6 border-[#795653] shadow-[8px_8px_0px_#795653] flex flex-col max-h-[90vh] overflow-hidden"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-[#FFE5EC] border-b-4 border-[#795653]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">🛍️</span>
            <div>
              <h3
                className="text-sm sm:text-lg font-black text-[#795653]"
                style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
              >
                TIỆM NỘI THẤT THỊ TRẤN MÈO
              </h3>
              <p className="text-[11px] text-[#795653]/80 font-bold hidden sm:block">
                Sắm sửa giường êm, giấy dán tường, sàn gỗ và đồ trang trí đáng yêu bằng Xu Cá
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Balance Display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-3 border-[#795653] rounded-none shadow-[2px_2px_0px_#795653]">
              <XuCaIcon className="w-4 h-4 object-contain inline-block" />
              <span
                className="text-xs sm:text-sm font-black text-[#0A5EB0] tabular-nums"
                style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
              >
                {userBalance.toLocaleString('vi-VN')}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Đóng tiệm nội thất"
              className="w-8 h-8 rounded-none bg-white hover:bg-[#FF8FAB] text-[#795653] hover:text-white border-3 border-[#795653] font-black text-sm flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Categories Tab Bar (5 Tabs) */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-[#FFF3E0] border-b-3 border-[#795653] overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-black cursor-pointer rounded-none border-3 transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#FF8FAB] text-white border-[#795653] shadow-[3px_3px_0px_#795653] -translate-y-0.5'
                    : 'bg-white text-[#795653] border-[#795653]/60 hover:border-[#795653] hover:bg-[#FFE5EC] shadow-[1px_1px_0px_#795653]'
                }`}
                style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 border rounded-none ${
                    isActive
                      ? 'bg-white/25 text-white border-white/50'
                      : 'bg-[#795653]/10 text-[#795653]/80 border-[#795653]/30'
                  }`}
                >
                  {cat.countLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback Alert Toast */}
        {buyFeedback && (
          <div
            className={`mx-3 sm:mx-4 mt-3 p-2.5 rounded-none border-3 text-xs font-black text-center shadow-[3px_3px_0px_#795653] animate-in fade-in ${
              buyFeedback.isError
                ? 'bg-rose-100 border-[#795653] text-rose-800'
                : 'bg-emerald-100 border-[#795653] text-emerald-900'
            }`}
            style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
          >
            {buyFeedback.text}
          </div>
        )}

        {/* Catalog Items Grid (Sorted Ascending by Price) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5">
          {displayItems.map((item, idx) => {
            const canAfford = userBalance >= item.price;
            const isProcessing = buyingId === item.id;
            const assetUrl = item.imageUrl || getFurnitureAssetUrl(item.id);
            const isWallOrFloor = item.category === 'wallpaper' || item.category === 'floor';

            return (
              <div
                key={item.id}
                className="bg-white border-3 border-[#795653] rounded-none shadow-[3px_3px_0px_#795653] p-2.5 sm:p-3 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#795653] transition-all"
              >
                <div>
                  {/* Item Image Showcase */}
                  <div className="w-full h-24 sm:h-28 bg-[#FFF9F4] border-2 border-[#795653] rounded-none flex items-center justify-center p-2 mb-2 relative overflow-hidden group">
                    {/* Price Rank Badge */}
                    <span
                      className="absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.5 bg-white/90 border border-[#795653] rounded-none shadow-[1px_1px_0px_#795653] text-[#795653]"
                      style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                    >
                      #{idx + 1}
                    </span>

                    {/* Image rendering based on type */}
                    {isWallOrFloor ? (
                      <div className="w-full h-full flex flex-col items-center justify-center relative">
                        <img
                          src={assetUrl}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover border-2 border-[#795653] shadow-[1px_1px_0px_#795653]"
                          style={{ imageRendering: 'pixelated' }}
                          loading="lazy"
                        />
                        <span className="text-[8px] font-bold text-[#795653]/70 mt-1 uppercase">
                          Mẫu {item.category === 'wallpaper' ? 'Tường' : 'Sàn'}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={assetUrl}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain filter drop-shadow-xs transition-transform group-hover:scale-105"
                          style={{ imageRendering: 'pixelated' }}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h4
                    className="text-xs font-black text-[#795653] line-clamp-1"
                    style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                    title={item.name}
                  >
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-[#795653]/70 font-semibold line-clamp-2 mt-0.5 min-h-[26px]">
                    {item.description}
                  </p>
                </div>

                {/* Footer: Price & Buy Button */}
                <div className="mt-2.5 pt-2 border-t-2 border-[#795653]/20 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <XuCaIcon className="w-3.5 h-3.5 object-contain inline-block" />
                    <span
                      className="text-xs font-black text-[#D6336C] tabular-nums"
                      style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                    >
                      {item.price}
                    </span>
                  </div>

                  <button
                    onClick={() => handleBuy(item)}
                    disabled={isProcessing || !canAfford}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-none text-[10px] sm:text-[11px] font-black border-2 border-[#795653] shadow-[2px_2px_0px_#795653] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
                      canAfford
                        ? 'bg-[#FF8FAB] hover:bg-[#f37898] text-white'
                        : 'bg-neutral-200 text-neutral-500 cursor-not-allowed opacity-60'
                    }`}
                    style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                  >
                    {isProcessing ? 'ĐANG MUA...' : canAfford ? 'MUA' : 'THIẾU XU'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shop Footer */}
        <div className="p-3 bg-[#FFF3E0] border-t-4 border-[#795653] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-[#795653]/80">
            💡 Sau khi mua, mở mục <span className="font-black text-[#D6336C]">"🏡 CĂN NHÀ NHỎ"</span> để trang trí hoặc dán tường / lát sàn ngay lập tức!
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-[#FFE5EC] border-3 border-[#795653] rounded-none text-xs font-black text-[#795653] shadow-[3px_3px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
          >
            ĐÓNG TIỆM SHOP
          </button>
        </div>
      </div>
    </div>
  );
};
