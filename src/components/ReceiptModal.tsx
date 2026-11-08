import React from 'react';
import { OrderReceipt } from '../types.ts';
import { X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { XuCaIcon } from './XuCaIcon.tsx';

interface ReceiptModalProps {
  receipt: OrderReceipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs overflow-y-auto transition-opacity duration-200"
    >
      <div 
        className="relative w-full max-w-[360px] sm:max-w-[390px] my-auto bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-4 sm:p-5 text-[#795653] animate-in fade-in zoom-in-95 duration-200 max-h-[96vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cute decorative close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-[#FFF9F4] border border-[#795653]/20 hover:bg-[#F6A6B8]/20 transition-colors z-20 cursor-pointer"
          title="Đóng hóa đơn"
        >
          <X className="w-4 h-4 text-[#795653]" />
        </button>

        {/* PHẦN 1 - ẢNH NHÂN VẬT */}
        <div className="relative mb-3">
          <div className="w-full h-36 sm:h-44 rounded-2xl overflow-hidden border border-[#795653]/20 bg-[#FFF9F4] relative shadow-xs group">
            <img
              src={receipt.characterAvatar}
              alt={receipt.characterName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top transition-transform duration-300"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.img-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'img-fallback w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF9F4] to-[#F6A6B8]/30 p-3 text-center';
                  fallback.innerHTML = `
                    <div class="w-12 h-12 rounded-full bg-[#F6A6B8]/40 flex items-center justify-center text-xl mb-1">🐟</div>
                    <div class="font-bold text-[#795653] text-base uppercase">${(receipt.characterName || '').toLocaleUpperCase('vi-VN')}</div>
                    <div class="text-xs text-[#795653]/70 uppercase">${(receipt.category || '').toLocaleUpperCase('vi-VN')}</div>
                  `;
                  parent.appendChild(fallback);
                }
              }}
            />
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-[#FFF9F4]/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-[#A6536A] border border-[#F6A6B8]/40 shadow-xs uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#A6536A]" />
              <span>THANH TOÁN THÀNH CÔNG</span>
            </div>
          </div>
        </div>

        {/* PHẦN 2 - TÊN TIỆM & TÊN RECEIPT */}
        <div className="text-center mb-2">
          <h2 style={{ fontFamily: 'Agbalumo, cursive', fontSize: '15px', color: '#FFB6C1', fontStyle: 'italic', textDecorationLine: 'underline' }} className="font-black tracking-wide italic underline">
            ୨ৎ welcom to mmck ୨ৎ
          </h2>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: '30px', marginTop: '5px', color: '#ff5d8f' }} className="tracking-wide uppercase font-black leading-tight whitespace-nowrap">
             ₊˚⊹ᰔ RECEIPT ᰔ⊹˚₊ 
          </p>
        </div>

        {/* Line chia ngăn 1 */}
        <div className="flex items-center justify-between text-[#ff5d8f] text-xs font-bold my-2 select-none w-full overflow-hidden">
          <span className="shrink-0">✦</span>
          <span className="flex-1 text-center overflow-hidden whitespace-nowrap tracking-[-2px] mx-1 text-[#ff5d8f]/80">
            ————————————————————————————————─────────────
          </span>
          <span className="shrink-0">✦</span>
        </div>

        {/* PHẦN 3 - THÔNG TIN ĐƠN HÀNG */}
        <div style={{ fontFamily: 'Lexend Deca, sans-serif', fontWeight: 'bold' }} className="py-1 space-y-1.5 text-base uppercase">
          {/* Hàng 1: MÃ ĐƠN HÀNG */}
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'Lexend Deca, sans-serif', fontWeight: 'bold', color: '#fb6f92', fontSize: '15px' }} className="font-bold">MÃ ĐƠN HÀNG</span>
            <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#CD2C58', fontSize: '15px' }} className="font-semibold tracking-tight uppercase">
              {receipt.id}
            </span>
          </div>
          {/* Hàng 2: MÃ CÁ KHÔ */}
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'Lexend Deca, sans-serif', fontWeight: 'bold', color: '#fb6f92', fontSize: '15px' }} className="font-bold">MÃ CÁ KHÔ</span>
            <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#CD2C58', fontSize: '15px' }} className="font-bold tracking-tight uppercase">
              {(receipt.fishCode || 'CK-001').toLocaleUpperCase('vi-VN')}
            </span>
          </div>
          {/* Hàng 3: CÁ KHÔ */}
          <div style={{ fontFamily: 'Lexend Deca, sans-serif', fontWeight: 'bold' }} className="flex items-center justify-between">
            <span style={{ fontFamily: 'Lexend Deca, sans-serif', fontWeight: 'bold', color: '#fb6f92', fontSize: '15px' }} className="font-bold">CÁ KHÔ</span>
            <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#CD2C58', fontSize: '15px' }} className="font-bold uppercase">
              {receipt.characterName.toLocaleUpperCase('vi-VN')}
            </span>
          </div>
          {/* Hàng 4: LOẠI CÁ */}
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'Lexend Deca, sans-serif', fontWeight: 'bold', color: '#fb6f92', fontSize: '15px' }} className="font-bold">LOẠI CÁ</span>
            <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#cd2c58', fontWeight: 'bold', fontSize: '15px' }} className="uppercase">
              {receipt.category.toLocaleUpperCase('vi-VN')}
            </span>
          </div>
        </div>

        {/* Line chia ngăn 2 */}
        <div className="flex items-center justify-between text-[#ff5d8f] text-xs font-bold my-2 select-none w-full overflow-hidden">
          <span className="shrink-0">✦</span>
          <span className="flex-1 text-center overflow-hidden whitespace-nowrap tracking-[-2px] mx-1 text-[#ff5d8f]/80">
            ————————————————————————————————─────────────
          </span>
          <span className="shrink-0">✦</span>
        </div>

        {/* PHẦN 4 - THÔNG TIN THANH TOÁN */}
        <div className="py-1 space-y-1.5 text-base uppercase">
          {/* Hàng 1: GIÁ */}
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'Lexend Deca, sans-serif', fontWeight: 'bold', color: '#fb6f92', fontSize: '15px' }} className="font-bold">GIÁ</span>
            <span className="font-bold flex items-center gap-1.5 uppercase">
              <span style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '18px', color: '#ca4d78' }}>{receipt.pricePaid}</span>
              <XuCaIcon className="w-6.5 h-6.5 object-contain shrink-0" style={{ width: '26px', height: '26px' }} />
            </span>
          </div>
          {/* Hàng 2: TỔNG XU */}
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'Lexend Deca, sans-serif', fontWeight: 'bold', color: '#fb6f92', fontSize: '15px' }} className="font-bold">TỔNG XU</span>
            <span className="font-bold flex items-center gap-1.5 uppercase">
              <span style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '18px', color: '#ca4d78', textDecorationLine: 'none' }}>{receipt.balanceAfter}</span>
              <XuCaIcon className="w-6.5 h-6.5 object-contain shrink-0" style={{ width: '26px', height: '26px' }} />
            </span>
          </div>
        </div>

        {/* Line chia ngăn 3 */}
        <div className="flex items-center justify-between text-[#ff5d8f] text-xs font-bold my-2 select-none w-full overflow-hidden">
          <span className="shrink-0">✦</span>
          <span className="flex-1 text-center overflow-hidden whitespace-nowrap tracking-[-2px] mx-1 text-[#ff5d8f]/80">
            ————————————————————————————————─────────────
          </span>
          <span className="shrink-0">✦</span>
        </div>

        {/* PHẦN 5 - NÚT NHẬN CÁ CHUẨN LIQUID GLASS 3D */}
        <div className="pt-1 pb-2">
          <a
            href={receipt.studioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass-btn relative overflow-hidden w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-[#795653] font-bold shadow-md hover:shadow-xl transition-all duration-300 border border-[#A6536A]/30 active:scale-[0.99] group cursor-pointer"
          >
            <span className="shimmer-liquid pointer-events-none" />
            <span style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '22px', color: '#cd2c58' }} className="relative z-10 tracking-wide">
              NHẬN CÁ
            </span>
            <ExternalLink style={{ color: '#ff477e' }} className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        {/* PHẦN 6 - FOOTER */}
        <div className="pt-1 text-center">
          <p style={{ fontFamily: 'Agbalumo, cursive', fontSize: '14px', color: '#ffb6c1' }} className="font-medium lowercase">
            ꣑ৎ thank you for your purchase ꣑ৎ
          </p>
        </div>
      </div>
    </div>
  );
};

