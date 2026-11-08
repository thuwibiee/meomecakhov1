import React from 'react';
import { Character } from '../types.ts';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { XuCaIcon } from './XuCaIcon.tsx';

interface PurchaseConfirmModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  userBalance: number;
}

export const PurchaseConfirmModal: React.FC<PurchaseConfirmModalProps> = ({
  character,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  userBalance,
}) => {
  if (!isOpen || !character) return null;

  const isAffordable = userBalance >= character.price;

  return (
    <div
      onClick={() => {
        // Global modal dismissal: Click outside closes unless processing
        if (!isProcessing) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-6 text-[#795653] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#795653]/10 text-[#795653]/70 hover:text-[#795653] transition-colors cursor-pointer disabled:opacity-50"
          title="Hủy"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4" style={{ fontFamily: "'Cal Sans', sans-serif" }}>
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F6A6B8]/30 border border-[#A6536A]/20 flex items-center justify-center p-2 mb-2.5 shadow-2xs">
            <XuCaIcon className="w-8 h-8 object-contain" />
          </div>
          <h3
            className="text-lg font-black tracking-tight uppercase"
            style={{ color: '#e13f7c' }}
          >
            𑣲⋆ XÁC NHẬN THANH TOÁN 𑣲⋆
          </h3>
        </div>

        {/* Character Mini Preview */}
        <div
          className="p-3.5 rounded-2xl bg-white/80 border border-[#795653]/20 flex items-center gap-3 mb-4 shadow-2xs"
          style={{ fontFamily: "'Cal Sans', sans-serif" }}
        >
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="w-14 h-16 rounded-xl object-cover border border-[#795653]/20 shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex-1 min-w-0">
            <h4
              className="font-extrabold text-sm truncate"
              style={{ color: '#e13f7c' }}
            >
              {character.name}
            </h4>
            <div className="text-xs text-[#526C91] font-semibold mt-0.5">
              {character.category} · {character.age} tuổi
            </div>
            <div
              className="text-xs font-black mt-1 flex items-center gap-1"
              style={{ color: '#e13f7c' }}
            >
              <span>Giá:</span>
              <span className="tabular-nums font-black">{character.price}</span>
              <XuCaIcon className="w-4 h-4 object-contain shrink-0" />
            </div>
          </div>
        </div>

        {/* Question Text */}
        <p
          className="text-xs text-center mb-4 leading-relaxed px-1"
          style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#F075AE' }}
        >
          Quý khách chắc chắn muốn dùng <strong className="font-black" style={{ color: '#F075AE', fontStyle: 'normal' }}>{character.price} Xu Cá</strong> để rước em cá <strong className="font-black" style={{ color: '#F075AE' }}>{character.name}</strong> về giỏ không?
        </p>

        {/* Balance warning if not enough */}
        {!isAffordable && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>Hiện số xu cá của quý khách không đủ thanh toán {character.name}, hãy kiếm thêm xu cá và quay lại chọn mua cá nhé -`♡´- </span>
          </div>
        )}

        {/* Action Buttons: Hủy & ĐỒNG Ý */}
        <div className="flex gap-2.5 pt-1" style={{ fontFamily: "'Cal Sans', sans-serif" }}>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#795653]/30 hover:bg-[#795653]/10 text-xs font-bold text-[#795653] transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isProcessing || !isAffordable}
            onClick={onConfirm}
            className="liquid-glass-btn relative flex-1 py-2.5 px-4 rounded-xl text-[#795653] text-xs font-black tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 overflow-hidden"
          >
            <span className="shimmer-liquid" />
            <span className="relative z-10">
              {isProcessing ? (
                <span className="animate-pulse">ĐANG XỬ LÝ...</span>
              ) : (
                <span style={{ color: '#e13f7c' }}>ĐỒNG Ý</span>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
