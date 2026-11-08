import React, { useState } from 'react';
import { CatTownInventoryItem } from '../../types.ts';
import { PixelFishSprite } from './PixelFishSprite.tsx';
import { PixelFurnitureSprite } from './PixelFurnitureSprite.tsx';

interface TownInventoryModalProps {
  isOpen: boolean;
  inventory: CatTownInventoryItem[];
  onClose: () => void;
}

export const TownInventoryModal: React.FC<TownInventoryModalProps> = ({
  isOpen,
  inventory,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'fish' | 'cooked_fish' | 'furniture'>('all');

  if (!isOpen) return null;

  const filteredItems = inventory.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'furniture') return item.itemType === 'furniture' || item.itemType === 'toy';
    return item.itemType === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/50 backdrop-blur-xs animate-in fade-in select-none">
      <div
        className="relative w-full max-w-lg bg-[#FFF9F4] rounded-3xl border-4 border-[#795653] p-5 sm:p-6 shadow-[6px_6px_0px_#795653] flex flex-col max-h-[85vh] overflow-hidden"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#795653]/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            <div>
              <h3 className="text-base font-black text-[#795653]" style={{ fontFamily: "'Tiny5', monospace" }}>
                TÚI ĐỒ THỊ TRẤN MÈO CÁ
              </h3>
              <p className="text-[10px] text-[#795653]/70 font-semibold">
                Chứa cá đã câu, món nướng và vật phẩm nội thất (Độc lập với Kho Cá Tiệm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-[#FFE5EC] border-2 border-[#795653] font-black text-sm flex items-center justify-center cursor-pointer active:translate-y-0.5"
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 py-3 overflow-x-auto">
          {[
            { id: 'all', label: 'TẤT CẢ' },
            { id: 'fish', label: '🐟 CÁ TƯƠI' },
            { id: 'cooked_fish', label: '🍢 MÓN NƯỚNG' },
            { id: 'furniture', label: '🪑 NỘI THẤT & ĐỒ CHƠI' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border-2 ${
                filter === tab.id
                  ? 'bg-[#FF8FAB] text-white border-[#795653] shadow-[1px_1px_0px_#795653]'
                  : 'bg-white text-[#795653] border-[#795653]/30 hover:bg-[#FFE5EC]'
              }`}
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto pr-1 py-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#795653]/60 italic bg-white/60 rounded-2xl border-2 border-dashed border-[#795653]/25">
              Chưa có vật phẩm nào trong mục này. Hãy tham gia câu cá, nướng cá hoặc mua đồ tại cửa hàng nhé!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white border-2 border-[#795653] shadow-[2px_2px_0px_#795653] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {item.itemType === 'fish' || item.itemType === 'cooked_fish' ? (
                      <PixelFishSprite fishId={item.itemId.replace('cooked_', '')} size={40} />
                    ) : (
                      <PixelFurnitureSprite itemId={item.itemId} size={40} />
                    )}

                    <div>
                      <h4 className="text-xs font-black text-[#795653] leading-tight">
                        {item.name}
                      </h4>
                      <div className="text-[10px] text-[#526C91] font-bold uppercase mt-0.5">
                        {item.rarity ? `Độ hiếm: ${item.rarity}` : item.itemType}
                        {item.details?.weight ? ` • ${item.details.weight}g` : ''}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-[#FFE5EC] border border-[#FF8FAB] text-xs font-black text-[#D6336C]">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-[#795653]/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-[#FFE5EC] border-2 border-[#795653] rounded-xl text-xs font-black text-[#795653] shadow-[2px_2px_0px_#795653] cursor-pointer"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            ĐÓNG TÚI ĐỒ
          </button>
        </div>
      </div>
    </div>
  );
};
