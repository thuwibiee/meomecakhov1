import React, { useState, useMemo } from 'react';
import { Character, OrderReceipt } from '../types.ts';
import { CharacterCard } from './CharacterCard.tsx';
import { Search, Filter, ArrowUpDown, Sparkles, AlertCircle } from 'lucide-react';

interface ShopSectionProps {
  characters: (Character & { isOwned?: boolean })[];
  onRequestBuy: (character: Character) => void;
  onViewDetails: (char: Character) => void;
  onGoToInventory: () => void;
  onOpenStory: (char: Character) => void;
  onOpenComplain: (char: Character) => void;
  onOpenFitBach: (char: Character) => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
  userBalance: number;
  isAdmin?: boolean;
  onAdminEdit?: (character: Character) => void;
}

export const ShopSection: React.FC<ShopSectionProps> = ({
  characters,
  onRequestBuy,
  onViewDetails,
  onGoToInventory,
  onOpenStory,
  onOpenComplain,
  onOpenFitBach,
  onOpenAuth,
  isLoggedIn,
  userBalance,
  isAdmin = false,
  onAdminEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  // Fixed categories list as requested
  const categories = useMemo(() => {
    return [
      'khô cá con',
      'khô cá một nắng',
      'khô hai nắng',
      'khô thượng phẩm',
      'khô gia truyền',
      'khô cá chép',
      'khô tẩm vị',
    ];
  }, []);

  // Filter & Sort
  const filteredCharacters = useMemo(() => {
    return characters
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.shortBio.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [characters, searchTerm, selectedCategory, sortBy]);

  // Handle Buy click: triggers cute purchase confirmation pop-up
  const handleBuyClick = (character: Character) => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    onRequestBuy(character);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Container */}
      <div className="bg-[#FFF9F4] p-4 sm:p-5 rounded-3xl border-2 border-[#795653]/20 shadow-xs flex flex-col gap-4">
        {/* Top Row: Categories Strip & Sorting Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Categories Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none min-w-0 flex-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#F6A6B8] shadow-xs'
                  : 'bg-white/80 hover:bg-white border border-[#795653]/15'
              }`}
              style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#E13F7C' }}
            >
              tất cả ({characters.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#F6A6B8] shadow-xs'
                    : 'bg-white/80 hover:bg-white border border-[#795653]/15'
                }`}
                style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#E13F7C' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <ArrowUpDown className="w-4 h-4 text-[#795653]/60" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-xl border border-[#795653]/25 bg-white text-xs text-[#795653] focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8] cursor-pointer"
              style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
            >
              <option value="newest">Mới cập bến</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* Bottom Row: Character Search Input (Separated, directly below category strip) */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795653]/50" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Quý khách cần tìm cá khô nào?"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#795653]/25 bg-white/70 focus:bg-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8] transition-all"
            style={{ fontFamily: "'Cal Sans', sans-serif", color: '#9e6161' }}
          />
        </div>
      </div>

      {/* Grid on Desktop, Horizontal Swipe Carousel on Mobile/Tablet */}
      {filteredCharacters.length > 0 ? (
        <div className="w-full">
          <div className="flex lg:grid lg:grid-cols-3 flex-nowrap overflow-x-auto scroll-snap-x mandatory gap-4 lg:gap-6 pb-6 pt-2 scrollbar-none">
            {filteredCharacters.map((char) => (
              <div key={char.id} className="w-[84%] sm:w-[55%] lg:w-auto shrink-0 snap-center">
                <CharacterCard
                  character={char}
                  onBuy={handleBuyClick}
                  onViewDetails={onViewDetails}
                  onGoToInventory={onGoToInventory}
                  onOpenStory={onOpenStory}
                  onOpenComplain={onOpenComplain}
                  onOpenFitBach={onOpenFitBach}
                  isAdmin={isAdmin}
                  onAdminEdit={onAdminEdit}
                />
              </div>
            ))}
          </div>

          {/* Swipe Indicator / Hint for Mobile/Tablet */}
          <div className="flex lg:hidden items-center justify-center gap-2 mt-1 mb-2 text-xs font-bold text-[#795653]/80 select-none">
            <span className="animate-pulse text-[#E13F7C]">◀</span>
            <span style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#E13F7C' }}>
              Vuốt ngang để xem thêm cá khô
            </span>
            <span className="animate-pulse text-[#E13F7C]">▶</span>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-[#FFF9F4] rounded-3xl border-2 border-dashed border-[#795653]/20">
          <div className="text-4xl mb-3">🐱🔍</div>
          <h3 className="text-base font-bold text-[#795653]">
            Không tìm thấy em cá khô nào phù hợp
          </h3>
          <p className="text-xs text-[#795653]/70 mt-1">
            Bà hãy thử tìm kiếm từ khóa khác hoặc bỏ chọn bộ lọc nhé!
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#F6A6B8]/50 hover:bg-[#F6A6B8] text-[#795653] text-xs font-bold transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};
