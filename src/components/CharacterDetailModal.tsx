import React from 'react';
import { Character } from '../types.ts';
import { X, ExternalLink, Check, Edit, BookOpen, AlertTriangle, MessageSquareHeart } from 'lucide-react';
import { XuCaIcon } from './XuCaIcon.tsx';

interface CharacterDetailModalProps {
  character: (Character & { isOwned?: boolean }) | null;
  onClose: () => void;
  onBuy: (character: Character) => void;
  onGoToInventory?: () => void;
  onOpenStory?: (character: Character) => void;
  onOpenComplain?: (character: Character) => void;
  onOpenFitBach?: (character: Character) => void;
  onOpenReceipt?: () => void;
  isProcessing?: boolean;
  isAdmin?: boolean;
  onAdminEdit?: (character: Character) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  onClose,
  onBuy,
  onGoToInventory,
  onOpenStory,
  onOpenComplain,
  onOpenFitBach,
  isProcessing = false,
  isAdmin = false,
  onAdminEdit,
}) => {
  if (!character) return null;

  const isComingSoon = Boolean(character.isComingSoon || !character.studioUrl || !character.studioUrl.trim());

  return (
    <div
      onClick={() => {
        if (!isProcessing) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-[#795653]/35 backdrop-blur-sm overflow-y-auto transition-opacity duration-200 cursor-pointer"
    >
      <div
        className="glass-modal-panel relative w-full max-w-[820px] my-2 sm:my-6 rounded-3xl p-4 sm:p-8 max-h-[95dvh] sm:max-h-[92vh] overflow-y-auto text-[#795653] animate-in fade-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-2 sm:p-2.5 rounded-full bg-white/70 backdrop-blur-md border border-white/90 hover:bg-white/95 shadow-xs transition-colors z-20 cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#795653]" />
        </button>

        {/* Modal Title: MUA CÁ KHÔ */}
        <div className="relative z-10 flex items-center gap-2 pb-2.5 mb-3.5 sm:pb-3.5 sm:mb-5 border-b border-dashed border-white/80 pr-10">
          <span className="text-lg sm:text-xl">🐟</span>
          <h3
            className="text-base sm:text-xl font-black uppercase tracking-wide text-[#E13F7C]"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            MUA CÁ KHÔ
          </h3>
        </div>

        {/* Prominent Enlarged Character Info Section */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3.5 sm:gap-6 items-start mb-3.5 sm:mb-5" style={{ fontFamily: "'Cal Sans', sans-serif" }}>
          <div
            className="mx-auto sm:mx-0 shrink-0 rounded-2xl overflow-hidden border-2 border-white/90 bg-white/40 shadow-md"
            style={{ width: '159.993px', height: '226.654px' }}
          >
            <img
              src={character.avatarUrl}
              alt={character.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 w-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                {character.isBestSeller && (
                  <span className="text-xs sm:text-[13px] font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-[#FF4D6D] to-[#FF758F] text-white border border-white shadow-xs flex items-center gap-1 select-none">
                    <span>👑</span>
                    <span>BEST SELLER</span>
                  </span>
                )}
                <span className="text-xs sm:text-[13px] font-bold px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-[#A9C5F2]/55 backdrop-blur-xs text-[#526C91] border border-white/80">
                  {character.category}
                </span>
                <span className="text-xs sm:text-sm text-[#795653]/85 font-bold">
                  {character.age} tuổi
                </span>
                {character.fishCode && (
                  <span className="text-xs sm:text-[13px] font-mono font-bold text-[#7209B7] bg-[#E0AAFF]/40 backdrop-blur-xs px-2.5 sm:px-3 py-0.5 rounded-full border border-white/75">
                    🐟 {character.fishCode}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-2 sm:mb-3">
                <h2
                  className="text-2xl sm:text-4xl font-black text-[#E13F7C] tracking-tight leading-tight"
                  style={{ fontFamily: "'Cal Sans', sans-serif" }}
                >
                  {character.name}
                </h2>
                {isAdmin && onAdminEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAdminEdit(character);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#D6336C] text-white hover:bg-[#b02253] text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                    title="Chỉnh sửa hồ sơ cá này trong Admin Dashboard"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Sửa thông tin</span>
                  </button>
                )}
              </div>

              {/* Enlarged Short Bio Box */}
              <div
                className="glass-bio-box font-semibold text-[#795653] rounded-2xl p-3 sm:p-4 leading-snug sm:leading-relaxed"
                style={{ fontSize: '13px' }}
              >
                {character.shortBio}
              </div>
            </div>

            {/* Giá Xu Cá */}
            <div className="mt-3 sm:mt-5 flex items-center justify-between pt-2.5 sm:pt-3 border-t border-dashed border-white/80">
              <div className="flex items-center gap-2 text-lg sm:text-2xl font-black text-[#526C91]">
                <span className="text-[#E13F7C] font-black">{character.price}</span>
                <XuCaIcon className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#795653]/75">
                Đã có {character.salesCount || 0} lượt rước
              </span>
            </div>

            {/* Cụm 4 nút chức năng bố cục lưới 2:2 đặt ngay dưới Giá Xu Cá (STORY · COMPLAIN · FÍT BÁCH · MUA CÁ 𓆜) */}
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-2.5">
              <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Nút 1: STORY */}
                <button
                  type="button"
                  onClick={() => onOpenStory?.(character)}
                  className="glass-pill-btn w-full h-10 sm:h-11 px-3 sm:px-4 rounded-full text-[#526C91] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Xem cốt truyện & phân cảnh mở đầu"
                >
                  <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#526C91] shrink-0" />
                  <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 'bold' }}>STORY</span>
                </button>

                {/* Nút 2: COMPLAIN */}
                <button
                  type="button"
                  onClick={() => onOpenComplain?.(character)}
                  className="glass-pill-btn w-full h-10 sm:h-11 px-3 sm:px-4 rounded-full text-[#D97706] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Báo lỗi nhân vật"
                >
                  <AlertTriangle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#D97706] shrink-0" />
                  <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 'bold' }}>COMPLAIN</span>
                </button>

                {/* Nút 3: FÍT BÁCH */}
                <button
                  type="button"
                  onClick={() => onOpenFitBach?.(character)}
                  className="glass-pill-btn w-full h-10 sm:h-11 px-3 sm:px-4 rounded-full text-[#A6536A] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                  title="FÍT BÁCH"
                >
                  <MessageSquareHeart className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#A6536A] shrink-0" />
                  <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 'bold' }}>FÍT BÁCH</span>
                </button>

                {/* Nút 4: MUA CÁ 𓆜 -> VÀO GIỎ (sau khi mua) HOẶC ĐANG ẤP PLOT (nếu sắp ra mắt) */}
                {isComingSoon ? (
                  <button
                    type="button"
                    disabled
                    className="w-full h-10 sm:h-11 px-3 sm:px-4 rounded-full bg-slate-200/80 backdrop-blur-xs text-slate-500 border border-white/80 font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-1 cursor-not-allowed whitespace-nowrap shadow-inner select-none opacity-90"
                    title="Cá đang được ấp cốt truyện, chưa mở bán"
                  >
                    <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 'bold' }}>ĐANG ẤP PLOT 🥚</span>
                  </button>
                ) : character.isOwned ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToInventory?.();
                    }}
                    className="w-full h-10 sm:h-11 px-3 sm:px-4 rounded-full bg-[#95BDFF]/90 hover:bg-[#83b1fa] backdrop-blur-xs text-[#0A5EB0] font-black text-sm sm:text-[15px] tracking-wide shadow-xs hover:shadow-md transition-all duration-200 border border-white/90 active:scale-95 flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    title="Đã rước về giỏ cá - Nhấn để vào Giỏ Cá"
                  >
                    <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 'bold' }}>VÀO GIỎ</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onBuy(character)}
                    className="liquid-glass-btn relative w-full h-10 sm:h-11 px-3 sm:px-4 rounded-full text-[#795653] font-black text-sm sm:text-[15px] tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap overflow-hidden"
                    title="Rước em cá về giỏ"
                  >
                    <span className="shimmer-liquid" />
                    <span className="relative z-10 flex items-center gap-1">
                      {isProcessing ? (
                        <span className="inline-block animate-pulse text-xs">ĐANG XỬ LÝ...</span>
                      ) : (
                        <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 'bold' }}>MUA CÁ 𓆜</span>
                      )}
                    </span>
                  </button>
                )}
              </div>

              {isComingSoon ? (
                <p className="text-xs sm:text-[13px] text-center text-[#795653]/80 font-semibold pt-0.5">
                  Bé cá này đang được ấp cốt truyện Google AI. Bạn vẫn có thể đọc trước tiểu sử và lore bên trên để hóng truyện!
                </p>
              ) : character.isOwned ? (
                <div className="flex flex-col sm:flex-row w-full gap-2 pt-0.5">
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-[#A9C5F2]/40 backdrop-blur-xs text-[#526C91] font-bold text-xs sm:text-[13px] border border-white/80">
                    <Check className="w-4 h-4 stroke-[3] shrink-0" />
                    <span>Đã nằm trong Giỏ Cá</span>
                  </div>
                  {character.studioUrl && (
                    <a
                      href={character.studioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass-btn relative overflow-hidden py-2 px-4 rounded-2xl text-[#795653] font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span className="shimmer-liquid" />
                      <span className="relative z-10 flex items-center gap-1.5 font-black">
                        <span>Nhận Cá</span>
                        <ExternalLink className="w-4 h-4 text-[#A6536A]" />
                      </span>
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Tags List - Matches exact tags and count shown on Character Card */}
        <div className="relative z-10 border-t border-white/80 pt-3 sm:pt-3.5">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {Array.isArray(character.tags) && character.tags.length > 0 ? (
              character.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/75 backdrop-blur-xs text-[#E13F7C] text-[11px] sm:text-xs font-normal border border-white/90 shadow-2xs"
                  style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))
            ) : (
              <span
                className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/75 backdrop-blur-xs text-[#E13F7C] text-[11px] sm:text-xs font-normal border border-white/90 shadow-2xs"
                style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
              >
                #{character.category || 'CáKhô'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
