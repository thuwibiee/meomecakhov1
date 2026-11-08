import React, { useState } from 'react';
import { Character } from '../types.ts';
import { X, BookOpen, Clapperboard, Sparkles } from 'lucide-react';

interface StoryModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ character, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'backstory' | 'openscene'>('backstory');

  if (!isOpen || !character) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-6 sm:p-7 text-[#795653] overflow-hidden max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#795653]/10 text-[#795653]/70 hover:text-[#795653] transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Preview */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-[#795653]/15">
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="w-14 h-16 rounded-2xl object-cover border border-[#795653]/20 shadow-2xs shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#A9C5F2]/40 text-[#526C91] border border-[#526C91]/20"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                {character.category}
              </span>
              <span
                className="text-xs text-[#795653]/70 font-semibold"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                {character.age} tuổi
              </span>
            </div>
            <h3
              className="text-xl font-black tracking-tight mt-0.5"
              style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
            >
              {character.name}
            </h3>
          </div>
        </div>

        {/* Tab Switcher: Back-story vs Open-scene */}
        <div className="flex p-1 bg-[#795653]/10 rounded-2xl my-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('backstory')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'backstory'
                ? 'bg-[#F6A6B8] shadow-xs'
                : 'hover:opacity-90'
            }`}
            style={{ fontFamily: "'Cal Sans', sans-serif", color: '#bc2e64', fontWeight: 'bold' }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Back-story (Cốt truyện)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('openscene')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'openscene'
                ? 'bg-[#A9C5F2] shadow-xs'
                : 'hover:opacity-90'
            }`}
            style={{ fontFamily: "'Cal Sans', sans-serif", color: '#246a93' }}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Open-scene (Mở đầu)</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'backstory' ? (
            <div className="p-4 rounded-2xl bg-white/75 border border-[#795653]/15">
              <p
                className="text-xs sm:text-sm text-[#795653]/90 leading-relaxed whitespace-pre-line"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                {character.backstory || character.fullStory || character.shortBio}
              </p>
            </div>
          ) : (
            <div
              className="p-4 rounded-2xl bg-[#FFF9F4] border-2 border-dashed space-y-3"
              style={{ borderColor: '#3d81a8' }}
            >
              <div
                className="p-3.5 rounded-xl bg-white/80 border border-[#A9C5F2]/40 text-xs sm:text-sm text-[#795653] leading-relaxed whitespace-pre-line"
                style={{ fontFamily: "'Cal Sans', sans-serif", fontStyle: 'normal' }}
              >
                "{character.openScene || 'Đang cập nhật phân cảnh mở đầu độc quyền từ tác giả...'}"
              </div>
              <p
                className="text-[11px] text-[#795653]/70 leading-normal"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                💡 <em>Mẹo:</em> Khi rước cá và nhấn "Nhận Cá", bạn có thể paste đoạn kịch bản mở đầu này trực tiếp vào Google AI Studio để tiếp tục câu chuyện cùng chàng!
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#795653]/15 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-[#795653]/10 hover:bg-[#795653]/15 font-bold text-xs transition-colors cursor-pointer"
            style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
