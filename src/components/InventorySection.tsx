import React, { useState, useMemo } from 'react';
import { UserCharacterOwnership, OrderReceipt, Character, CHARACTER_CATEGORIES } from '../types.ts';
import { Search, ExternalLink, ReceiptText, Sparkles, ShoppingBag, BookOpen, AlertTriangle, MessageSquareHeart, X } from 'lucide-react';

interface InventorySectionProps {
  items: UserCharacterOwnership[];
  onGoToShop: () => void;
  onOpenReceipt: (receipt: OrderReceipt) => void;
  onOpenStory?: (char: Character) => void;
  onOpenComplain?: (char: Character) => void;
  onOpenFitBach?: (char: Character) => void;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  items,
  onGoToShop,
  onOpenReceipt,
  onOpenStory,
  onOpenComplain,
  onOpenFitBach,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<UserCharacterOwnership | null>(null);

  // Preset categories
  const categories = useMemo(() => {
    return [...CHARACTER_CATEGORIES];
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const char = item.character;
      if (!char) return false;
      const matchesSearch =
        char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.shortBio.toLowerCase().includes(searchTerm.toLowerCase());
      const normalizedCat = char.category === 'khô hai nắng' ? 'khô cá hai nắng' : char.category;
      const matchesCategory = selectedCategory === 'all' || normalizedCat === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#FFF9F4] p-5 sm:p-6 rounded-3xl border-2 border-[#795653]/25 shadow-kawaii flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "'Cal Sans', sans-serif", marginLeft: '0px', color: '#E13F7C' }}
          >
            🧺 GIỎ CÁ
          </h2>
          <p
            className="text-xs sm:text-sm font-medium mt-1"
            style={{ fontFamily: "'Cal Sans', sans-serif", color: '#F075AE' }}
          >
            𖹭 nơi lưu trữ những bé cá khô quý khách đã mua
          </p>
        </div>

        {/* Nút "tổng số cá đã mua" với hiệu ứng liquid glass 3D và shimmer */}
        <div className="liquid-glass-btn relative overflow-hidden flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/80 self-start sm:self-auto shadow-sm select-none">
          <span className="shimmer-liquid" />
          <span
            className="relative z-10 flex items-center gap-2"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            <span className="text-xs font-bold text-[#795653]">Tổng số cá đã mua:</span>
            <span
              className="font-black text-[#D6336C] tabular-nums"
              style={{ marginTop: '-3px', fontSize: '15px', marginRight: '0px', marginLeft: '-4px' }}
            >
              {items.length} em cá
            </span>
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-6 text-center bg-[#FFF9F4] rounded-3xl border-2 border-dashed border-[#795653]/25 shadow-xs max-w-lg mx-auto my-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#F6A6B8]/20 flex items-center justify-center text-4xl mb-4 border border-[#F6A6B8]/40">
            🧺
          </div>
          <h3
            className="font-black"
            style={{ color: '#E13F7C', fontFamily: "'Cal Sans', sans-serif", fontSize: '17px' }}
          >
            giỏ cá hiện đang trống, hãy ghé quầy cá để chọn cá nhé -`♡´-
          </h3>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-[#FFF9F4] p-4 rounded-2xl border border-[#795653]/20 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795653]/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm trong giỏ cá..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#795653]/25 bg-white/70 focus:bg-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#F6A6B8] text-[#795653] shadow-xs'
                    : 'bg-white/80 text-[#795653]/70 hover:bg-white border border-[#795653]/15'
                }`}
              >
                tất cả ({items.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#F6A6B8] text-[#795653] shadow-xs'
                      : 'bg-white/80 text-[#795653]/70 hover:bg-white border border-[#795653]/15'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const char = item.character;
              if (!char) return null;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="glass-character-card group flex flex-col rounded-3xl p-4 cursor-pointer hover:-translate-y-1.5"
                >
                  {/* Image */}
                  <div className="relative z-10 w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white/40 border-2 border-white/95 mb-3.5 shadow-md">
                    <img
                      src={char.avatarUrl}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-[#F6A6B8]/95 backdrop-blur-xs text-[#795653] px-2.5 py-1 rounded-full text-xs font-black shadow-xs border border-white/80">
                      ★ ĐÃ SỞ HỮU
                    </div>
                  </div>

                  {/* Name */}
                  <h3
                    className="relative z-10 text-lg font-extrabold tracking-tight group-hover:text-[#A6536A] transition-colors line-clamp-1"
                    style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}
                  >
                    {char.name}
                  </h3>

                  {/* Metadata */}
                  <div className="relative z-10 flex items-center gap-2 text-xs font-semibold text-[#795653]/85 mt-1 mb-2.5">
                    <span style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#ff6fb2' }}>{char.age} tuổi</span>
                    <span aria-hidden="true" className="text-[#F6A6B8] font-bold">·</span>
                    <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#599bc2' }}>{char.category}</span>
                  </div>

                  {/* Bio */}
                  <div
                    className="glass-bio-box z-10 rounded-xl p-2.5 text-xs text-[#795653]/90 leading-relaxed mb-2.5 line-clamp-2"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
                  >
                    {char.shortBio}
                  </div>

                  {/* Purchased Info */}
                  <div className="relative z-10 pt-2 border-t border-dashed border-white/80 mb-2.5 flex items-center justify-between text-[11px] text-[#795653]/85 font-medium">
                    <span>Ngày rước:</span>
                    <span className="font-semibold text-[#E13F7C]">
                      {new Date(item.purchasedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Cụm 4 nút chức năng bố cục lưới 2:2 (STORY · COMPLAIN · FÍT BÁCH · NHẬN CÁ 𓆜) */}
                  <div
                    className="relative z-10 w-full mt-2"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '10px',
                    }}
                  >
                    {/* Nút 1: STORY */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStory?.(char);
                      }}
                      className="glass-pill-btn w-full h-9 px-2 rounded-full text-[#526C91] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                      title="Xem cốt truyện & phân cảnh mở đầu"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#526C91] shrink-0" />
                      <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '13px', fontWeight: 'bold' }}>STORY</span>
                    </button>

                    {/* Nút 2: COMPLAIN */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenComplain?.(char);
                      }}
                      className="glass-pill-btn w-full h-9 px-2 rounded-full text-[#D97706] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                      title="Báo lỗi nhân vật"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                      <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '13px' }}>COMPLAIN</span>
                    </button>

                    {/* Nút 3: FÍT BÁCH */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFitBach?.(char);
                      }}
                      className="glass-pill-btn w-full h-9 px-2 rounded-full text-[#A6536A] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                      title="Đánh giá & Bình luận (FÍT BÁCH)"
                    >
                      <MessageSquareHeart className="w-3.5 h-3.5 text-[#A6536A] shrink-0" />
                      <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '13px' }}>FÍT BÁCH</span>
                    </button>

                    {/* Nút 4: NHẬN CÁ 𓆜 với 3D liquid glass */}
                    <a
                      href={char.studioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="liquid-glass-btn relative overflow-hidden w-full h-9 px-2 rounded-full text-[#795653] font-black text-xs tracking-wide shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      title="Mở trò chuyện AI Studio"
                    >
                      <span className="shimmer-liquid" />
                      <span className="relative z-10 flex items-center gap-1">
                        <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '13px' }}>NHẬN CÁ 𓆜</span>
                        <ExternalLink className="w-3 h-3 text-[#A6536A]" />
                      </span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detail Modal for Owned Character with Receipt Lookup */}
      {selectedItem && selectedItem.character && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs overflow-y-auto transition-opacity duration-200 cursor-pointer"
        >
          <div 
            className="relative w-full max-w-lg my-8 bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-6 sm:p-7 text-[#795653] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#795653]/10 text-[#795653]/70 hover:text-[#795653] transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-5 items-start mb-5">
              <div className="w-full sm:w-44 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden border border-[#795653]/20 bg-[#F6A6B8]/10 shadow-xs">
                <img
                  src={selectedItem.character.avatarUrl}
                  alt={selectedItem.character.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#A9C5F2]/40 text-[#526C91] border border-[#526C91]/20">
                    {selectedItem.character.category}
                  </span>
                  <span className="text-xs text-[#795653]/70 font-medium">
                    {selectedItem.character.age} tuổi
                  </span>
                </div>

                <h2 className="text-2xl font-black text-[#795653] tracking-tight">
                  {selectedItem.character.name}
                </h2>

                <div className="mt-3 p-3 rounded-2xl bg-white/70 border border-[#795653]/15 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#795653]/70">Mã đơn hàng:</span>
                    <span className="font-mono font-bold text-[#526C91]">{selectedItem.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#795653]/70">Ngày rước về giỏ:</span>
                    <span className="font-semibold">{new Date(selectedItem.purchasedAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#795653]/70">Giá đã thanh toán:</span>
                    <span className="font-bold text-[#A6536A]">{selectedItem.pricePaid} Xu Cá</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cụm 3 nút chức năng phụ trong popup chi tiết */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  onOpenStory?.(selectedItem.character!);
                  setSelectedItem(null);
                }}
                className="py-2 px-2 rounded-xl bg-white hover:bg-[#A9C5F2]/30 text-[#526C91] font-black text-xs border border-[#526C91]/30 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>STORY</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenComplain?.(selectedItem.character!);
                  setSelectedItem(null);
                }}
                className="py-2 px-2 rounded-xl bg-white hover:bg-amber-100 text-amber-800 font-black text-xs border border-amber-300/70 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>COMPLAIN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenFitBach?.(selectedItem.character!);
                  setSelectedItem(null);
                }}
                className="py-2 px-2 rounded-xl bg-white hover:bg-[#F6A6B8]/30 text-[#A6536A] font-black text-xs border border-[#F6A6B8]/60 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <MessageSquareHeart className="w-3.5 h-3.5" />
                <span>FÍT BÁCH</span>
              </button>
            </div>

            {/* Backstory */}
            <div className="mb-6">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#A6536A] mb-1.5">
                Cốt truyện & Ký ức cùng chàng:
              </h4>
              <p className="text-xs leading-relaxed text-[#795653]/90 bg-white/40 p-3 rounded-xl border border-[#795653]/10 max-h-36 overflow-y-auto font-medium whitespace-pre-line">
                {selectedItem.character.backstory || selectedItem.character.fullStory}
              </p>
            </div>

            {/* Actions: View Receipt + Open AI Studio */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  const receiptData: OrderReceipt = {
                    id: selectedItem.orderId,
                    userId: selectedItem.userId,
                    characterId: selectedItem.characterId,
                    characterName: selectedItem.character!.name,
                    category: selectedItem.character!.category,
                    characterAvatar: selectedItem.character!.avatarUrl,
                    pricePaid: selectedItem.pricePaid,
                    balanceAfter: 0,
                    studioUrl: selectedItem.character!.studioUrl,
                    createdAt: selectedItem.purchasedAt,
                  };
                  onOpenReceipt(receiptData);
                  setSelectedItem(null);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#FFF9F4] hover:bg-white text-[#795653] font-bold text-xs sm:text-sm border border-[#795653]/30 flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <ReceiptText className="w-4 h-4 text-[#795653]" />
                <span>Xem lại Receipt (Hóa đơn)</span>
              </button>

              <a
                href={selectedItem.character.studioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-2xl bg-[#F6A6B8] hover:bg-[#f391a6] text-[#795653] font-black text-xs sm:text-sm border border-[#A6536A]/30 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Nhận Cá (AI Studio)</span>
                <ExternalLink className="w-4 h-4 text-[#A6536A]" />
              </a>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full mt-3 py-2 text-xs font-bold text-[#795653]/60 hover:text-[#795653] cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
