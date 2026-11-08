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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs overflow-y-auto transition-opacity duration-200"
    >
      <div 
        className="relative w-full max-w-lg my-8 bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-6 sm:p-7 overflow-hidden text-[#795653] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#FFF9F4] border border-[#795653]/20 hover:bg-[#F6A6B8]/20 transition-colors z-10"
        >
          <X className="w-5 h-5 text-[#795653]" />
        </button>

        <div className="flex flex-col sm:flex-row gap-5 items-start mb-6">
          <div className="w-full sm:w-44 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden border border-[#795653]/20 bg-[#F6A6B8]/10 shadow-xs">
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#A9C5F2]/40 text-[#526C91] border border-[#526C91]/20">
                {character.category}
              </span>
              <span className="text-xs text-[#795653]/70 font-medium">
                {character.age} tuổi
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-[#795653] tracking-tight" style={{ fontSize: '29px' }}>
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

            <div className="mt-2 text-xs font-medium text-[#795653]/80 bg-[#FFF9F4] border border-[#795653]/15 rounded-xl p-2.5">
              {character.shortBio}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-base font-black text-[#526C91]">
                <span className="tabular-nums">{character.price}</span>
                <XuCaIcon className="w-5 h-5 object-contain shrink-0" />
              </div>
              <span className="text-xs text-[#795653]/60">
                Đã có {character.salesCount || 0} lượt rước
              </span>
            </div>
          </div>
        </div>

        {/* Backstory / Hồ sơ chi tiết */}
        <div className="border-t border-[#795653]/20 pt-4 mb-6">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#A6536A] mb-2 flex items-center gap-1.5">
            <span>📖</span>
            <span>Hồ sơ & Cốt truyện độc quyền</span>
          </h4>
          <p className="text-sm leading-relaxed text-[#795653]/90 bg-white/40 p-3.5 rounded-2xl border border-[#795653]/10 whitespace-pre-line">
            {character.backstory || character.fullStory || character.shortBio}
          </p>
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
