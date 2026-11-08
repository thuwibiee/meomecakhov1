import React from 'react';
import { Character } from '../types.ts';
import { Check, BookOpen, AlertTriangle, MessageSquareHeart } from 'lucide-react';
import { XuCaIcon } from './XuCaIcon.tsx';

interface CharacterCardProps {
  character: Character & { isOwned?: boolean };
  onBuy: (character: Character) => void;
  onViewDetails: (character: Character) => void;
  onGoToInventory?: () => void;
  onOpenStory?: (character: Character) => void;
  onOpenComplain?: (character: Character) => void;
  onOpenFitBach?: (character: Character) => void;
  onAdminEdit?: (character: Character) => void;
  isAdmin?: boolean;
  isProcessing?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onBuy,
  onViewDetails,
  onGoToInventory,
  onOpenStory,
  onOpenComplain,
  onOpenFitBach,
  onAdminEdit,
  isAdmin = false,
  isProcessing = false,
}) => {
  return (
    <div
      onClick={() => onViewDetails(character)}
      className="glass-character-card group flex flex-col rounded-3xl p-4 cursor-pointer hover:-translate-y-1.5"
    >
      {/* (1) Ảnh đại diện nhân vật: điểm thu hút chính, giữ đúng tỷ lệ khung hình (TRỪ PHẦN HÌNH ẢNH) */}
      <div className="relative z-10 w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white/40 border-2 border-white/95 mb-3.5 shadow-md">
        <img
          src={character.avatarUrl}
          alt={character.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.className = 'w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF9F4] to-[#F6A6B8]/30 p-4 text-center';
              fallback.innerHTML = `
                <div class="text-4xl mb-2">✨</div>
                <div class="font-bold text-[#795653]">${character.name}</div>
                <div class="text-xs text-[#795653]/70">${character.category}</div>
              `;
              parent.appendChild(fallback);
            }
          }}
        />

        {/* Admin Quick Edit Button right on card */}
        {isAdmin && onAdminEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdminEdit(character);
            }}
            className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-white/95 hover:bg-white text-[#795653] px-2.5 py-1 rounded-full text-xs font-black shadow-xs border border-white/90 backdrop-blur-xs cursor-pointer active:scale-95 transition-all"
            title="Chỉnh sửa thông tin nam chính này"
          >
            <span>✏️</span>
            <span>Sửa</span>
          </button>
        )}

        {/* Subtle owned badge over image if owned */}
        {character.isOwned && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#A9C5F2]/95 backdrop-blur-xs text-[#526C91] px-2.5 py-1 rounded-full text-xs font-bold shadow-xs border border-white/80">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>ĐÃ THANH TOÁN</span>
          </div>
        )}
      </div>

      {/* (2) Họ và tên nhân vật */}
      <h3
        className="relative z-10 text-lg font-extrabold tracking-tight group-hover:text-[#A6536A] transition-colors line-clamp-1"
        style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}
      >
        {character.name}
      </h3>

      {/* (3) Tuổi & (4) Danh mục / Thể loại (Category tag) */}
      <div className="relative z-10 flex items-center gap-2 text-xs font-semibold text-[#795653]/85 mt-1 mb-2.5">
        <span style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#ff6fb2' }}>{character.age} tuổi</span>
        <span aria-hidden="true" className="text-[#F6A6B8] font-bold">·</span>
        <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#599bc2' }}>{character.category}</span>
      </div>

      {/* (5) Khung nội dung riêng chứa vài dòng giới thiệu ngắn (short bio/hook) - Frosted Glass Box */}
      <div
        className="glass-bio-box z-10 rounded-xl p-2.5 text-xs text-[#795653]/90 leading-relaxed mb-3 line-clamp-3 min-h-[4.25rem]"
        style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
      >
        {character.shortBio}
      </div>

      {/* (6) Giá bán bằng Xu Cá (kèm icon xu cá) */}
      <div className="relative z-10 flex items-center justify-between mt-auto pt-2 border-t border-dashed border-white/80 mb-2.5">
        <span style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '16px', fontWeight: 'bold', color: '#E13F7C' }}>Giá:</span>
        <div className="flex items-center gap-1.5 font-black text-base text-[#526C91]">
          <span className="tabular-nums" style={{ color: '#E13F7C' }}>{character.price}</span>
          <XuCaIcon
            className="w-6.5 h-6.5 object-contain shrink-0"
            style={{ width: '26px', height: '26px', marginLeft: '-3px', marginTop: '-2px' }}
          />
        </div>
      </div>

      {/* Cụm 4 nút chức năng bố cục lưới 2:2 (STORY · COMPLAIN · FÍT BÁCH · MUA CÁ 𓆜) */}
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
            onOpenStory?.(character);
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
            onOpenComplain?.(character);
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
            onOpenFitBach?.(character);
          }}
          className="glass-pill-btn w-full h-9 px-2 rounded-full text-[#A6536A] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
          title="FÍT BÁCH"
        >
          <MessageSquareHeart className="w-3.5 h-3.5 text-[#A6536A] shrink-0" />
          <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '13px' }}>FÍT BÁCH</span>
        </button>

        {/* Nút 4: MUA CÁ 𓆜 -> VÀO KHO (sau khi mua) */}
        {character.isOwned ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onGoToInventory) onGoToInventory();
            }}
            className="w-full h-9 px-2 rounded-full bg-[#95BDFF] hover:bg-[#83b1fa] text-[#0A5EB0] font-black text-xs tracking-wide shadow-xs hover:shadow-md transition-all duration-200 border border-[#95BDFF] active:scale-95 flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
            title="Đã rước về giỏ cá - Nhấn để vào Giỏ Cá"
          >
            <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '14px' }}>VÀO GIỎ</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              onBuy(character);
            }}
            className="liquid-glass-btn relative w-full h-9 px-2 rounded-full text-[#795653] font-black text-xs tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap overflow-hidden"
            title="Rước em cá về giỏ"
          >
            <span className="shimmer-liquid" />
            <span className="relative z-10 flex items-center gap-1">
              {isProcessing ? (
                <span className="inline-block animate-pulse text-[11px]">ĐANG XỬ LÝ...</span>
              ) : (
                <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '14px' }}>MUA CÁ 𓆜</span>
              )}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
