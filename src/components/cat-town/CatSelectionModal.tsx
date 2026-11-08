import React, { useState } from 'react';
import { CAT_AVATARS, CatAvatarOption } from './catAvatars.ts';
import { retroAudio } from './retroAudio.ts';

interface CatSelectionModalProps {
  isOpen: boolean;
  currentCatId?: string;
  currentCatName?: string;
  onSelectCat: (avatar: CatAvatarOption, customName: string) => Promise<void>;
  onClose?: () => void;
  isFirstTime?: boolean;
}

export const CatSelectionModal: React.FC<CatSelectionModalProps> = ({
  isOpen,
  currentCatId = 'cat_02',
  currentCatName = '',
  onSelectCat,
  onClose,
  isFirstTime = false,
}) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(currentCatId || 'cat_02');
  const selectedCat = CAT_AVATARS.find((c) => c.id === selectedAvatarId) || CAT_AVATARS[1];
  
  const [catName, setCatName] = useState<string>(
    currentCatName || selectedCat.defaultName
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAvatar = (cat: CatAvatarOption) => {
    retroAudio.playBlip(620, 0.05);
    setSelectedAvatarId(cat.id);
    // If the name is empty or matches previous default name, update to new default name
    if (!catName || CAT_AVATARS.some((c) => c.defaultName === catName)) {
      setCatName(cat.defaultName);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = catName.trim() || selectedCat.defaultName;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      retroAudio.playConfirm();
      await onSelectCat(selectedCat, finalName);
    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi lưu thông tin mèo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#795653]/70 backdrop-blur-xs animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl bg-[#FFF9F4] border-4 sm:border-6 border-[#795653] shadow-[8px_8px_0px_#795653] rounded-3xl p-4 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b-3 border-[#795653] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl animate-bounce"
              style={{ fontFamily: 'Tiny5', fontWeight: 'normal' }}
            >
              🐱
            </span>
            <div>
              <h2
                className="text-base sm:text-lg font-black text-[#D6336C] tracking-wide"
                style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
              >
                <span>🐾 </span>
                <span style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}>
                  {isFirstTime ? 'CHÀO MỪNG! HÃY CHỌN BÉ MÈO CỦA BẠN' : 'CHỌN BÉ MÈO ĐỒNG HÀNH'}
                </span>
              </h2>
              <p
                className="text-[11px] sm:text-xs text-[#795653]/80 font-medium"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                Chú mèo bạn chọn sẽ xuất hiện xuyên suốt cả 4 khu vực trong thị trấn! 🐾
              </p>
            </div>
          </div>

          {!isFirstTime && onClose && (
            <button
              onClick={() => {
                retroAudio.playBlip(320, 0.05);
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-[#FFE5EC] hover:bg-[#FFB3C6] border-2 border-[#795653] text-[#795653] font-black text-xs flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#795653]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable Cats Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div className="text-xs font-black text-[#795653] flex items-center gap-1.5" style={{ fontFamily: "'Tiny5', monospace" }}>
            <div style={{ fontFamily: 'Tiny5' }}><span>✨</span></div>
            <div style={{ fontFamily: 'Tiny5' }}><span>BƯỚC 1:</span></div>
            <div style={{ fontFamily: 'Tiny5' }}><span>CHỌN MẪU MÈO BẠN THÍCH (8 CHÚ MÈO ĐỘC QUYỀN):</span></div>
          </div>

          {/* 8 Rounded Square Cat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {CAT_AVATARS.map((cat) => {
              const isSelected = cat.id === selectedAvatarId;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleSelectAvatar(cat)}
                  className={`group relative p-2.5 sm:p-3 rounded-2xl border-3 cursor-pointer transition-all flex flex-col items-center justify-between text-center select-none ${
                    isSelected
                      ? 'bg-[#FFE5EC] border-[#D6336C] shadow-[4px_4px_0px_#D6336C] -translate-y-1'
                      : 'bg-white hover:bg-[#FFF5F8] border-[#795653] shadow-[2px_2px_0px_#795653] hover:-translate-y-0.5'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute -top-2.5 -right-2 px-1.5 py-0.5 bg-[#D6336C] text-white text-[9px] font-black rounded-full border border-white shadow-xs">
                      ✓ ĐANG CHỌN
                    </div>
                  )}

                  {/* Cat Sprite Box */}
                  <div className="w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center mb-1.5">
                    <img
                      src={cat.avatarUrl}
                      alt={cat.name}
                      className={`w-full h-full object-contain transition-transform duration-200 ${
                        isSelected ? 'scale-110 drop-shadow-[0_4px_0_rgba(214,51,108,0.25)]' : 'group-hover:scale-105'
                      }`}
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  {/* Cat Info */}
                  <div className="w-full">
                    <div
                      className="text-[11px] sm:text-xs font-black text-[#795653] truncate"
                      style={{ fontFamily: "'Tiny5', monospace" }}
                    >
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-[#D6336C] font-bold mt-0.5 truncate" style={{ fontFamily: "'Tiny5', monospace" }}>
                      {cat.collar}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Cat Detail Spotlight */}
          <div className="p-3 bg-white border-2 border-[#795653] rounded-2xl shadow-[2px_2px_0px_#795653] flex items-center gap-3">
            <div className="w-14 h-14 bg-[#FFE5EC] border-2 border-[#D6336C] rounded-xl flex items-center justify-center shrink-0">
              <img
                src={selectedCat.avatarUrl}
                alt={selectedCat.name}
                className="w-12 h-12 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#D6336C]" style={{ fontFamily: 'Tiny5' }}>
                  {selectedCat.name}
                </span>
                <span
                  className="text-[10px] px-2 py-0.2 bg-[#F7DDA0] border border-[#795653] rounded-md font-bold text-[#795653]"
                  style={{ fontFamily: "'Cal Sans', 'Tiny5', sans-serif" }}
                >
                  {selectedCat.breed}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-[11px] font-bold text-[#795653]/60" style={{ fontFamily: 'Tiny5' }}>
                  Đặc tính:
                </span>{' '}
                <span className="text-[11px] text-[#795653]/85 leading-tight line-clamp-2" style={{ fontFamily: "'Cal Sans', sans-serif" }}>
                  {selectedCat.description}
                </span>
              </div>
            </div>
          </div>

          {/* Naming Input Section */}
          <form onSubmit={handleConfirm} className="space-y-3 pt-1">
            <div className="text-xs font-black text-[#795653] flex items-center gap-1.5" style={{ fontFamily: "'Tiny5', monospace" }}>
              <span>🏷️</span>
              <span>BƯỚC 2: ĐẶT TÊN CHO CHÚ MÈO CỦA BẠN:</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                maxLength={20}
                placeholder="Nhập tên chú mèo (VD: Bánh Mì, Bé Mập, Hạt Tiêu...)"
                className="flex-1 px-3.5 py-2.5 bg-white border-3 border-[#795653] rounded-xl text-sm font-black text-[#795653] focus:outline-none focus:border-[#D6336C] shadow-[2px_2px_0px_#795653]"
                style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
              />

              {/* Quick name suggestion chips */}
              <button
                type="button"
                onClick={() => setCatName(selectedCat.defaultName)}
                className="px-3 py-1.5 bg-[#F7DDA0] hover:bg-[#FFE39C] border-2 border-[#795653] rounded-xl text-xs font-black text-[#795653] cursor-pointer shadow-[2px_2px_0px_#795653] shrink-0"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                Gợi ý: {selectedCat.defaultName}
              </button>
            </div>

            {errorMessage && (
              <div className="p-2 bg-[#FFE5EC] border-2 border-[#D6336C] rounded-xl text-xs font-black text-[#D6336C]">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#FF8FAB] hover:bg-[#FF7599] disabled:opacity-50 text-white font-black text-sm sm:text-base rounded-2xl border-4 border-[#795653] shadow-[4px_4px_0px_#795653] hover:shadow-[2px_2px_0px_#795653] hover:translate-y-0.5 active:translate-y-1 cursor-pointer flex items-center justify-center gap-2 select-none"
                style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
              >
                {isSubmitting ? (
                  <span>ĐANG LƯU BÉ MÈO VÀO THỊ TRẤN...</span>
                ) : (
                  <>
                    <span>🐾</span>
                    <span>XÁC NHẬN CHỌN BÉ MÈO NÀY & BẮT ĐẦU</span>
                    <span>▶</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
