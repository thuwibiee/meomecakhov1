import React from 'react';
import { Character } from '../types.ts';
import { X, ExternalLink, Check, ShoppingBag, Edit } from 'lucide-react';
import { XuCaIcon } from './XuCaIcon.tsx';

interface CharacterDetailModalProps {
  character: (Character & { isOwned?: boolean }) | null;
  onClose: () => void;
  onBuy: (character: Character) => void;
  onOpenReceipt?: () => void;
  isProcessing?: boolean;
  isAdmin?: boolean;
  onAdminEdit?: (character: Character) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  onClose,
  onBuy,
  isProcessing = false,
  isAdmin = false,
  onAdminEdit,
}) => {
  if (!character) return null;

  return (
    <div
      onClick={() => {
        if (!isProcessing) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#795653]/45 backdrop-blur-xs overflow-y-auto transition-opacity duration-200 cursor-pointer"
    >
      <div 
        className="relative w-full max-w-xl my-6 bg-[#FFF9F4] rounded-3xl border-3 border-[#795653]/30 shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto text-[#795653] animate-in fade-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#FFF9F4] border border-[#795653]/20 hover:bg-[#F6A6B8]/20 transition-colors z-10 cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5 text-[#795653]" />
        </button>

        {/* Prominent Enlarged Character Info Section */}
        <div className="flex flex-col sm:flex-row gap-5 items-start mb-5" style={{ fontFamily: "'Cal Sans', sans-serif" }}>
          <div className="w-full sm:w-52 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#795653]/25 bg-[#F6A6B8]/10 shadow-md">
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
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#A9C5F2]/40 text-[#526C91] border border-[#526C91]/30">
                  {character.category}
                </span>
                <span className="text-xs text-[#795653]/80 font-bold">
                  {character.age} tuổi
                </span>
                {character.fishCode && (
                  <span className="text-xs font-mono font-bold text-[#7209B7] bg-[#E0AAFF]/30 px-2.5 py-0.5 rounded-full border border-[#7209B7]/30">
                    🐟 {character.fishCode}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="text-2xl sm:text-3xl font-black text-[#E13F7C] tracking-tight leading-tight" style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '32px' }}>
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
              <div className="text-xs sm:text-sm font-semibold text-[#795653] bg-white/70 border-2 border-[#FFB3C6]/60 rounded-2xl p-3.5 leading-relaxed shadow-2xs">
                {character.shortBio}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-dashed border-[#795653]/20">
              <div className="flex items-center gap-2 text-lg sm:text-xl font-black text-[#526C91]">
                <span className="text-[#E13F7C] font-black">{character.price}</span>
                <XuCaIcon className="w-6 h-6 object-contain shrink-0" />
              </div>
              <span className="text-xs font-bold text-[#795653]/70">
                Đã có {character.salesCount || 0} lượt rước
              </span>
            </div>
          </div>
        </div>

        {/* Compact Tags List (No "TAGS NHÂN VẬT" heading text) */}
        <div className="border-t border-[#795653]/15 pt-3 mb-5">
          <div className="flex flex-wrap gap-1.5">
            {/* Category Tag */}
            <span className="px-2.5 py-0.5 rounded-xl bg-[#FFE5EC] text-[#D6336C] border border-[#FF8FAB]/50 text-[11px] font-bold shadow-2xs flex items-center gap-1">
              <span>✦</span>
              <span>{character.category}</span>
            </span>

            {/* Fish code tag if available */}
            {character.fishCode && (
              <span className="px-2.5 py-0.5 rounded-xl bg-[#E0AAFF]/30 text-[#7209B7] border border-[#7209B7]/30 text-[11px] font-bold shadow-2xs flex items-center gap-1 font-mono">
                <span>🐟</span>
                <span>{character.fishCode}</span>
              </span>
            )}

            {/* Age tag */}
            <span className="px-2.5 py-0.5 rounded-xl bg-[#A9C5F2]/30 text-[#526C91] border border-[#526C91]/30 text-[11px] font-bold shadow-2xs flex items-center gap-1">
              <span>🎂</span>
              <span>{character.age} tuổi</span>
            </span>

            {/* Custom tags if provided by character object */}
            {character.tags && character.tags.length > 0 ? (
              character.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-xl bg-white text-[#795653]/85 border border-[#795653]/20 text-[11px] font-bold shadow-2xs flex items-center gap-1"
                >
                  <span className="text-[#D6336C]">#</span>
                  <span>{tag}</span>
                </span>
              ))
            ) : (
              <>
                <span className="px-2.5 py-0.5 rounded-xl bg-white text-[#795653]/85 border border-[#795653]/20 text-[11px] font-bold shadow-2xs flex items-center gap-1">
                  <span className="text-[#D6336C]">#</span>
                  <span>ThơMộng</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-xl bg-white text-[#795653]/85 border border-[#795653]/20 text-[11px] font-bold shadow-2xs flex items-center gap-1">
                  <span className="text-[#D6336C]">#</span>
                  <span>CáKhô</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-xl bg-white text-[#795653]/85 border border-[#795653]/20 text-[11px] font-bold shadow-2xs flex items-center gap-1">
                  <span className="text-[#D6336C]">#</span>
                  <span>NamChính</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-xl bg-white text-[#795653]/85 border border-[#795653]/20 text-[11px] font-bold shadow-2xs flex items-center gap-1">
                  <span className="text-[#D6336C]">#</span>
                  <span>MèoMêCá</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-3">
          {character.isOwned ? (
            <div className="flex flex-col sm:flex-row w-full gap-2.5">
              <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#A9C5F2]/40 text-[#526C91] font-bold text-sm border border-[#526C91]/30">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Cá này đang nằm trong Giỏ Cá của quý khách</span>
              </div>
              <a
                href={character.studioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-btn relative overflow-hidden py-3 px-5 rounded-2xl text-[#795653] font-bold text-sm border border-[#A6536A]/30 flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span className="shimmer-liquid" />
                <span className="relative z-10 flex items-center gap-2 font-black">
                  <span>Nhận Cá</span>
                  <ExternalLink className="w-4 h-4 text-[#A6536A]" />
                </span>
              </a>
            </div>
          ) : (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onBuy(character)}
              className="liquid-glass-btn relative w-full py-3.5 px-6 rounded-2xl text-[#795653] font-black text-base transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 overflow-hidden cursor-pointer"
            >
              <span className="shimmer-liquid" />
              <span className="relative z-10 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#A6536A]" />
                <span>{isProcessing ? 'ĐANG XỬ LÝ GIAO DỊCH...' : `MUA CÁ NGAY (${character.price} XU CÁ)`}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
