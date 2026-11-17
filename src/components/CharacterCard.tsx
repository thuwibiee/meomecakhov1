import React from 'react';
import { Character } from '../types.ts';
import { Check } from 'lucide-react';
import { XuCaIcon } from './XuCaIcon.tsx';

interface CharacterCardProps {
  character: Character & { isOwned?: boolean };
  onViewDetails: (character: Character) => void;
  onAdminEdit?: (character: Character) => void;
  isAdmin?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onViewDetails,
  onAdminEdit,
  isAdmin = false,
}) => {
  const isComingSoon = Boolean(character.isComingSoon || !character.studioUrl || !character.studioUrl.trim());

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

        {/* Huy hiệu BEST SELLER thủ công (Admin tự quyết, nền gradient hồng dâu đậm, viền trắng, drop shadow) */}
        {character.isBestSeller && (
          <div
            className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF4D6D] via-[#FF5C8A] to-[#FF758F] text-white border-2 border-white/95 shadow-[0_4px_12px_rgba(255,77,109,0.45)] select-none"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            <span className="text-xs leading-none">👑</span>
            <span className="text-[10px] font-black tracking-wider uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
              BEST SELLER
            </span>
          </div>
        )}

        {/* Admin Quick Edit Button right on card */}
        {isAdmin && onAdminEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdminEdit(character);
            }}
            className={`absolute ${character.isBestSeller ? 'top-10.5' : 'top-2.5'} left-2.5 z-20 flex items-center gap-1 bg-white/95 hover:bg-white text-[#795653] px-2.5 py-1 rounded-full text-xs font-black shadow-xs border border-white/90 backdrop-blur-xs cursor-pointer active:scale-95 transition-all`}
            title="Chỉnh sửa thông tin nam chính này"
          >
            <span>✏️</span>
            <span>Sửa</span>
          </button>
        )}

        {/* Coming soon ribbon badge */}
        {isComingSoon ? (
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-[#FFE885] text-[#795653] px-2.5 py-1 rounded-full text-[11px] font-black shadow-md border-2 border-white/90">
            <span>COMING SOON ⏳</span>
          </div>
        ) : character.isOwned ? (
          /* Subtle owned badge over image if owned */
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#A9C5F2]/95 backdrop-blur-xs text-[#526C91] px-2.5 py-1 rounded-full text-xs font-bold shadow-xs border border-white/80">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>ĐÃ THANH TOÁN</span>
          </div>
        ) : null}
      </div>

      {/* (2) Họ và tên nhân vật */}
      <h3
        className="relative z-10 font-extrabold tracking-tight group-hover:text-[#A6536A] transition-colors line-clamp-1"
        style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C', fontSize: '22px' }}
      >
        {character.name}
      </h3>

      {/* (3) Tuổi & (4) Danh mục / Thể loại (Category tag) */}
      <div className="relative z-10 flex items-center gap-2 text-xs font-semibold text-[#795653]/85 mt-1 mb-1.5">
        <span style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#ff6fb2' }}>{character.age} tuổi</span>
        <span aria-hidden="true" className="text-[#F6A6B8] font-bold">·</span>
        <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#599bc2' }}>{character.category}</span>
      </div>

      {/* (3.5) Full Tags nhân vật - Nằm ngay dưới tuổi & category */}
      <div className="relative z-10 flex flex-wrap gap-1.5 mb-2.5">
        {Array.isArray(character.tags) && character.tags.length > 0 ? (
          character.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full bg-[#FFF5F8]/90 text-[#E13F7C] text-[10px] font-normal border border-[#F6A6B8]/40 shadow-2xs backdrop-blur-xs"
              style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
            >
              #{tag.replace(/^#/, '')}
            </span>
          ))
        ) : (
          <span
            className="px-2 py-0.5 rounded-full bg-[#FFF5F8]/90 text-[#E13F7C] text-[10px] font-normal border border-[#F6A6B8]/40 shadow-2xs"
            style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
          >
            #{character.category || 'CáKhô'}
          </span>
        )}
      </div>

      {/* (5) Khung nội dung riêng chứa vài dòng giới thiệu ngắn (short bio/hook) - Auto-fit height according to text */}
      <div
        className="glass-bio-box z-10 rounded-xl p-2.5 text-xs text-[#795653]/90 leading-relaxed mb-3 h-auto"
        style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
      >
        {character.shortBio}
      </div>

      {/* (6) Giá bán bằng Xu Cá (kèm icon xu cá) */}
      <div className="relative z-10 flex items-center justify-between mt-auto pt-2 border-t border-dashed border-white/80">
        <span style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '16px', fontWeight: 'bold', color: '#E13F7C' }}>Giá:</span>
        <div className="flex items-center gap-1.5 font-black text-base text-[#526C91]">
          <span className="tabular-nums" style={{ color: '#E13F7C' }}>{character.price}</span>
          <XuCaIcon
            className="w-6.5 h-6.5 object-contain shrink-0"
            style={{ width: '26px', height: '26px', marginLeft: '-3px', marginTop: '-2px' }}
          />
        </div>
      </div>
    </div>
  );
};
