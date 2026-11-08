import React, { useState, useEffect } from 'react';
import { Character, CharacterFeedback } from '../types.ts';
import { firebaseApi } from '../firebase.ts';
import { X, Star, Heart, MessageSquareHeart, Send, Sparkles, User, AlertCircle } from 'lucide-react';

interface FitBachModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  authToken: string | null;
  currentUsername?: string;
  onRequireAuth: () => void;
}

export const FitBachModal: React.FC<FitBachModalProps> = ({
  character,
  isOpen,
  onClose,
  authToken,
  currentUsername,
  onRequireAuth,
}) => {
  const [feedbacks, setFeedbacks] = useState<CharacterFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && character) {
      loadFeedbacks();
    }
  }, [isOpen, character?.id]);

  const loadFeedbacks = async () => {
    if (!character) return;
    setIsLoading(true);
    try {
      const res = await firebaseApi(`/api/characters/${character.id}/comments`);
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(data.feedbacks || []);
      }
    } catch (err) {
      console.error('Lỗi tải fít bách:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !character) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      onRequireAuth();
      return;
    }
    if (!commentText.trim()) {
      setError('Quý khách chưa nhập nội dung fít bách!');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await firebaseApi(`/api/characters/${character.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: commentText.trim(),
          rating,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không gửi được fít bách.');
      }

      setCommentText('');
      // Reload feedbacks list
      await loadFeedbacks();
    } catch (err: any) {
      setError(err.message || 'Lỗi gửi fít bách.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + (f.rating || 5), 0) / feedbacks.length).toFixed(1)
      : '5.0';

  return (
    <div
      onClick={() => {
        // Global modal dismissal: Click outside closes unless submitting
        if (!isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-6 sm:p-7 text-[#795653] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#795653]/10 text-[#795653]/70 hover:text-[#795653] transition-colors cursor-pointer disabled:opacity-50"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div
          className="flex items-center gap-3.5 pb-4 border-b border-[#795653]/15 shrink-0"
          style={{ fontFamily: "'Cal Sans', sans-serif" }}
        >
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="w-13 h-15 rounded-2xl object-cover border border-[#795653]/20 shadow-2xs shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F6A6B8]/30 text-[#A6536A] border border-[#F6A6B8]/40"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                FÍT BÁCH & REVIEW
              </span>
              <span
                className="text-xs font-semibold"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#599bc2' }}
              >
                {character.category}
              </span>
            </div>
            <h3
              className="text-xl font-black tracking-tight mt-0.5"
              style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
            >
              {character.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-[#A6536A] font-bold mt-0.5">
              <div className="flex text-amber-400">
                {'★'.repeat(Math.round(Number(avgRating)))}
              </div>
              <span>{avgRating}/5.0</span>
              <span className="text-[#795653]/50">({feedbacks.length} lượt đánh giá)</span>
            </div>
          </div>
        </div>

        {/* Feedback List (Newest first) */}
        <div className="flex-1 overflow-y-auto py-3.5 space-y-3 pr-1 my-1">
          {isLoading ? (
            <div className="py-10 text-center text-xs font-bold text-[#795653]/60 animate-pulse">
              Đang tải danh sách fít bách từ khách hàng...
            </div>
          ) : feedbacks.length === 0 ? (
            <div
              className="py-10 text-center bg-white/50 rounded-2xl border border-dashed border-[#795653]/20 px-4"
              style={{ fontFamily: "'Cal Sans', sans-serif", color: '#599bc2' }}
            >
              <MessageSquareHeart className="w-9 h-9 text-[#F6A6B8] mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold" style={{ color: '#e13f7c' }}>Chưa có fít bách nào cho chàng!</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-3.5 rounded-2xl bg-white/80 border border-[#795653]/15 shadow-2xs space-y-1.5"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#F6A6B8]/30 flex items-center justify-center text-xs font-bold text-[#A6536A]">
                      🐾
                    </div>
                    <span className="font-extrabold text-xs text-[#795653]">{fb.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#795653]/50">
                    <div className="flex text-amber-400 text-xs">
                      {'★'.repeat(fb.rating || 5)}
                    </div>
                    <span>{new Date(fb.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <p className="text-xs text-[#795653]/90 leading-relaxed font-medium pl-8 whitespace-pre-line">
                  {fb.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input Form for New Feedback */}
        <div className="pt-3 border-t border-[#795653]/15 shrink-0">
          {error && (
            <div className="mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div
              className="flex items-center justify-between"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              <span className="text-xs font-bold" style={{ color: '#e13f7c' }}>Đánh giá độ mê em cá:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-[#795653]/30'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold ml-1" style={{ color: '#e13f7c' }}>{rating} sao</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  authToken
                    ? `Viết cảm nghĩ/fít bách về ${character.name}...`
                    : 'Đăng nhập để gửi fít bách nhé bà...'
                }
                disabled={isSubmitting}
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#795653]/30 bg-white text-xs text-[#795653] focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8]"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] font-black text-xs border border-[#A6536A]/30 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#bc2e64' }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'GỬI...' : 'GỬI FÍT BÁCH'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
