import React, { useState } from 'react';
import { Character } from '../types.ts';
import { firebaseApi } from '../firebase.ts';
import { X, AlertTriangle, CheckCircle2, Send } from 'lucide-react';

interface ComplainModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  authToken: string | null;
  onRequireAuth: () => void;
}

export const ComplainModal: React.FC<ComplainModalProps> = ({
  character,
  isOpen,
  onClose,
  authToken,
  onRequireAuth,
}) => {
  const [issueType, setIssueType] = useState('Lỗi link Google AI Studio');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !character) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      onRequireAuth();
      return;
    }
    if (!content.trim()) {
      setError('Vui lòng mô tả chi tiết vấn đề bạn gặp phải.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await firebaseApi(`/api/characters/${character.id}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          issueType,
          content: content.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gửi báo lỗi không thành công.');
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setContent('');
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        className="relative w-full max-w-md bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-6 sm:p-7 text-[#795653] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
        <div className="flex items-center gap-3 mb-4" style={{ color: '#599bc2' }}>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center text-lg shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3
              className="text-lg font-black"
              style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
            >
              Báo Lỗi / Complain Nhân Vật
            </h3>
            <p
              className="text-xs"
              style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
            >
              Nhân vật: <strong className="text-[#A6536A]" style={{ fontFamily: "'Cal Sans', sans-serif" }}>{character.name}</strong>
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-[#795653] text-sm">
              Tiệm đã tiếp nhận báo lỗi của bà!
            </h4>
            <p className="text-xs text-[#795653]/70">
              Admin sẽ kiểm tra link và kịch bản của {character.name} sớm nhất nhé.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
              >
                Loại vấn đề gặp phải
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#795653]/30 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8]"
                style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#d38ca4' }}
              >
                <option value="Lỗi link Google AI Studio">🔗 Lỗi link Google AI Studio (không mở được/hết hạn)</option>
                <option value="Lỗi prompt / tính cách nhân vật">🎭 Lỗi prompt / tính cách nhân vật bị sai lệch</option>
                <option value="Lỗi hình ảnh / avatar hiển thị">🖼️ Lỗi hình ảnh / avatar không tải được</option>
                <option value="Cốt truyện & kịch bản cần sửa">📖 Cốt truyện & kịch bản cần chỉnh sửa</option>
                <option value="Vấn đề khác">💬 Vấn đề khác</option>
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
              >
                Chi tiết nội dung cần hỗ trợ
              </label>
              <textarea
                rows={3}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="VD: Link AI Studio báo lỗi 404, hoặc prompt trả lời không đúng bối cảnh hồ ly..."
                className="w-full p-3 rounded-xl border border-[#795653]/30 bg-white text-xs text-[#795653] focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8] resize-none"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#795653]/30 hover:bg-[#795653]/10 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] font-black text-xs shadow-sm hover:shadow-md transition-all border border-[#A6536A]/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#bc2e64' }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'ĐANG GỬI...' : 'GỬI BÁO LỖI'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
