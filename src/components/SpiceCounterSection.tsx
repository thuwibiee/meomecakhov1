import React, { useState, useEffect } from 'react';
import { Spice, SpiceType } from '../types.ts';
import { firebaseApi, subscribeToSpices } from '../firebase.ts';
import { Sparkles, Copy, Check, Plus, Edit, Trash2, Search, X, BookOpen, Terminal, ShieldAlert } from 'lucide-react';

interface SpiceCounterSectionProps {
  authToken: string | null;
  isAdmin?: boolean;
  onOpenAuth: () => void;
  onGoToShop?: () => void;
}

export const SpiceCounterSection: React.FC<SpiceCounterSectionProps> = ({
  authToken,
  isAdmin = false,
  onOpenAuth,
  onGoToShop,
}) => {
  const [spices, setSpices] = useState<Spice[]>([]);
  const [activeTab, setActiveTab] = useState<SpiceType>('command');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lock status (Default: locked = true, so non-admin users cannot view until Admin turns it public)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('meome_spice_locked');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleLock = () => {
    const nextState = !isLocked;
    setIsLocked(nextState);
    try {
      localStorage.setItem('meome_spice_locked', String(nextState));
    } catch {}
  };

  // Modals state
  const [readingSpice, setReadingSpice] = useState<Spice | null>(null);
  const [editingSpice, setEditingSpice] = useState<Partial<Spice> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscribe to real-time Spices from Firestore / API
  useEffect(() => {
    const unsubscribe = subscribeToSpices((data) => {
      setSpices(data);
    });
    return () => unsubscribe();
  }, []);

  // Copy to clipboard helper
  const handleCopyCommand = (text: string, spiceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(spiceId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Delete Spice Item (Admin only)
  const handleDeleteSpice = async (spice: Spice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authToken || !isAdmin) return;
    if (!confirm(`Bà chủ có chắc muốn xóa gia vị "${spice.title}" không?`)) return;

    try {
      const res = await firebaseApi(`/api/admin/spices/${spice.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        setSpices((prev) => prev.filter((s) => s.id !== spice.id));
        if (readingSpice?.id === spice.id) setReadingSpice(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Spice (Create or Edit - Admin only)
  const handleSaveSpice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpice || !authToken || !isAdmin) return;

    const titleStr = (editingSpice.title || '').trim();
    const contentStr = (editingSpice.content || '').trim();
    const authorStr = (editingSpice.author || 'Chủ Tiệm').trim();
    const typeVal: SpiceType = editingSpice.type === 'lore' ? 'lore' : 'command';

    if (!titleStr) {
      setErrorMessage('Vui lòng nhập Tiêu đề cho bài gia vị.');
      return;
    }
    if (!contentStr) {
      setErrorMessage('Vui lòng nhập Nội dung gia vị.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...editingSpice,
        title: titleStr,
        content: contentStr,
        author: authorStr,
        type: typeVal,
      };

      const res = await firebaseApi('/api/admin/spices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu bài viết gia vị.');

      if (data.spices) setSpices(data.spices);
      setEditingSpice(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Thao tác lưu gia vị thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter spices by type and search term
  const filteredSpices = spices
    .filter((s) => s.type === activeTab)
    .filter((s) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return s.title.toLowerCase().includes(term) || s.content.toLowerCase().includes(term);
    });

  // If section is locked and user is NOT Admin -> Render cute Locked Screen
  if (isLocked && !isAdmin) {
    return (
      <div className="p-8 sm:p-12 text-center bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/25 shadow-kawaii space-y-4 max-w-xl mx-auto my-8 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FF8FAB]/20 border-2 border-[#FF8FAB]/40 flex items-center justify-center text-3xl shadow-xs">
          🔒
        </div>
        <div>
          <span
            className="text-[11px] font-black uppercase px-3.5 py-1 rounded-full bg-[#FF8FAB]/25 text-[#D6336C] tracking-wide"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            Chế độ chuẩn bị nội dung 🧂
          </span>
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-[#795653] mt-2.5"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            QUẦY GIA VỊ ĐANG KHÓA 🔒
          </h2>
        </div>
        <p
          className="text-xs sm:text-sm text-[#795653]/80 leading-relaxed max-w-md mx-auto"
          style={{ fontFamily: "'Cal Sans', sans-serif" }}
        >
          Hiện tại Quầy Gia Vị đang được Chủ Tiệm chỉnh sửa, bổ sung công thức nêm nếm và hoàn thiện bối cảnh kịch tính. Sẽ sớm mở public cho các bạn xem và copy lệnh nha! ♡
        </p>
        <div className="pt-3">
          <button
            onClick={onGoToShop}
            className="py-2.5 px-6 rounded-2xl bg-[#FF8FAB] hover:bg-[#ff7aa0] text-white font-black text-xs shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2 border border-white/80"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            <span> Quay về Quầy Cá 🐟</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-[#FFF9F4] p-5 sm:p-7 rounded-3xl border-2 border-[#795653]/25 shadow-kawaii flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10 flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F6A6B8]/25 border-2 border-[#F6A6B8]/50 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            {isLocked ? '🔒' : '🧂'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#795653' }}
              >
                QUẦY GIA VỊ {isLocked ? '🔒' : '🧂'}
              </h2>
              {isLocked && (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  ĐANG KHÓA (CHỈ ADMIN XEM)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#795653]/80 mt-0.5 leading-relaxed">
              Thêm chút mắm muối, rắc chút hành ngò cho cốt truyện roleplay của bà thêm phần đậm đà và kịch tính nha! ♡
            </p>
          </div>
        </div>

        {/* Admin Action & Lock Toggle Buttons */}
        {isAdmin && (
          <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            {/* Toggle Lock Button for Admin */}
            <button
              type="button"
              onClick={handleToggleLock}
              className={`py-2 px-3.5 rounded-2xl font-black text-xs flex items-center gap-1.5 border shadow-2xs transition-all cursor-pointer ${
                isLocked
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
              }`}
              title="Nhấp vào đây để Bật hoặc Tắt khóa Public với khách hàng"
            >
              <span>{isLocked ? '🔒 Đang khóa (Chỉnh sửa)' : '🔓 Đã Public (Mọi người xem)'}</span>
              <span className="underline text-[10px] ml-0.5 opacity-80">
                {isLocked ? '(Mở Public)' : '(Khóa lại)'}
              </span>
            </button>

            <button
              onClick={() => {
                setEditingSpice({
                  type: activeTab,
                  title: '',
                  content: '',
                  author: 'Chủ Tiệm',
                });
                setErrorMessage(null);
              }}
              className="py-2 px-4 rounded-2xl bg-[#FF8FAB] hover:bg-[#ff7aa0] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs hover:shadow-md active:scale-95 cursor-pointer transition-all border border-white/80"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Thêm Gia Vị Mới</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Pill-shape classification tabs */}
        <div className="flex p-1.5 bg-[#FFF9F4] rounded-full border border-[#795653]/20 shadow-xs self-start">
          <button
            onClick={() => setActiveTab('command')}
            className={`py-2 px-5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'command'
                ? 'bg-[#FF8FAB] text-white shadow-xs scale-[1.02]'
                : 'text-[#795653]/80 hover:text-[#795653] hover:bg-white/60'
            }`}
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            <span>🧂 Lệnh Nêm Nếm</span>
            <span className="text-[10px] opacity-90 px-1.5 py-0.2 rounded-full bg-white/30">
              {spices.filter((s) => s.type === 'command').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('lore')}
            className={`py-2 px-5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'lore'
                ? 'bg-[#FF8FAB] text-white shadow-xs scale-[1.02]'
                : 'text-[#795653]/80 hover:text-[#795653] hover:bg-white/60'
            }`}
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            <span>📖 Sổ Tay Bối Cảnh</span>
            <span className="text-[10px] opacity-90 px-1.5 py-0.2 rounded-full bg-white/30">
              {spices.filter((s) => s.type === 'lore').length}
            </span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm gia vị, câu lệnh, luật..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-[#FFF9F4] border border-[#795653]/20 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#FF8FAB] shadow-2xs"
          />
          <Search className="w-4 h-4 text-[#795653]/50 absolute left-3 top-2.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-[#795653]/40 hover:text-[#795653] text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Cards Grid Layout */}
      {filteredSpices.length === 0 ? (
        <div className="p-12 text-center bg-[#FFF9F4]/80 rounded-3xl border-2 border-dashed border-[#795653]/20 space-y-3">
          <div className="text-4xl">🧂</div>
          <h3 className="font-extrabold text-[#795653] text-sm">
            {searchTerm ? 'Không tìm thấy gia vị nào phù hợp' : 'Chưa có công thức gia vị nào trong mục này'}
          </h3>
          <p className="text-xs text-[#795653]/70 max-w-sm mx-auto">
            {searchTerm ? 'Hãy thử gõ từ khóa khác xem sao nha!' : 'Gia vị kịch tính mới sẽ sớm được Chủ Tiệm bổ sung cho các bà nhâm nhi nhé ♡'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSpices.map((spice) => {
            const isCommand = spice.type === 'command';
            const isCopied = copiedId === spice.id;

            return (
              <div
                key={spice.id}
                onClick={() => setReadingSpice(spice)}
                className="group bg-[#FFF9F4] rounded-2xl p-4 sm:p-5 border-2 border-[#795653]/15 hover:border-[#FF8FAB] shadow-kawaii hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base p-1.5 bg-white rounded-xl border border-[#795653]/10 shadow-2xs">
                        {isCommand ? '⚡' : '📜'}
                      </span>
                      <h3
                        className="font-extrabold text-sm sm:text-base text-[#795653] group-hover:text-[#E13F7C] transition-colors line-clamp-1"
                        style={{ fontFamily: "'Cal Sans', sans-serif" }}
                      >
                        {spice.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Author badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F6A6B8]/20 text-[#A6536A]">
                        {spice.author || 'Chủ Tiệm'}
                      </span>

                      {/* Admin Quick Action Buttons */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSpice(spice);
                              setErrorMessage(null);
                            }}
                            className="p-1 rounded-lg hover:bg-amber-100 text-amber-700 cursor-pointer"
                            title="Sửa bài này"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSpice(spice, e)}
                            className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Xóa bài này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content or Code Box */}
                  <div className="mt-2 text-xs text-[#795653]/90 leading-relaxed">
                    {isCommand ? (
                      <div className="relative my-1 p-3 rounded-xl bg-[#FFF0F4] border border-[#FF8FAB]/40 font-mono text-[11px] text-[#526C91] leading-normal group/code">
                        <div className="line-clamp-3 whitespace-pre-wrap">{spice.content}</div>

                        {/* Copy Button inside Code Block */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyCommand(spice.content, spice.id, e)}
                          className={`absolute top-2 right-2 py-1 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs border ${
                            isCopied
                              ? 'bg-emerald-500 text-white border-emerald-400'
                              : 'bg-white hover:bg-[#FF8FAB] text-[#795653] hover:text-white border-[#795653]/20'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>ĐÃ SAO CHÉP! ✓</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>SAO CHÉP</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="line-clamp-4 whitespace-pre-wrap leading-relaxed">{spice.content}</p>
                    )}
                  </div>
                </div>

                {/* Footer read detail link */}
                <div className="mt-3 pt-2 border-t border-dashed border-[#795653]/15 flex items-center justify-between text-[11px]">
                  <span className="text-[#795653]/60 font-medium">
                    {new Date(spice.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="font-bold text-[#E13F7C] group-hover:underline flex items-center gap-1">
                    <span>Xem chi tiết</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Full Reading Modal */}
      {readingSpice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setReadingSpice(null)}
        >
          <div
            className="bg-[#FFF9F4] w-full max-w-2xl rounded-3xl p-6 sm:p-7 border-2 border-[#795653]/30 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#795653]/15 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-2 bg-white rounded-2xl border border-[#795653]/15 shadow-2xs">
                  {readingSpice.type === 'command' ? '⚡' : '📜'}
                </span>
                <div>
                  <h3
                    className="text-lg sm:text-xl font-extrabold text-[#795653]"
                    style={{ fontFamily: "'Cal Sans', sans-serif" }}
                  >
                    {readingSpice.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#795653]/70 mt-0.5">
                    <span className="font-bold text-[#E13F7C]">{readingSpice.author || 'Chủ Tiệm'}</span>
                    <span>·</span>
                    <span>{new Date(readingSpice.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReadingSpice(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-rose-100 text-[#795653] hover:text-rose-600 flex items-center justify-center font-bold text-sm cursor-pointer border border-[#795653]/20 transition-all shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Main content body */}
            {readingSpice.type === 'command' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#795653]">
                    Đoạn lệnh Prompt điều hướng (bấm nút bên phải để sao chép):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCommand(readingSpice.content, readingSpice.id)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                      copiedId === readingSpice.id
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-[#FF8FAB] hover:bg-[#ff7aa0] text-white border-white'
                    }`}
                  >
                    {copiedId === readingSpice.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Đã Sao Chép! ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao Chép Lệnh</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF0F4] border-2 border-[#FF8FAB]/40 font-mono text-xs sm:text-sm text-[#526C91] leading-relaxed whitespace-pre-wrap select-all shadow-inner">
                  {readingSpice.content}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-[#795653]/15 text-xs sm:text-sm text-[#795653] leading-relaxed whitespace-pre-wrap shadow-inner">
                {readingSpice.content}
              </div>
            )}

            {/* Footer action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setReadingSpice(null)}
                className="py-2 px-5 rounded-2xl bg-[#795653] hover:bg-[#634543] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                Đóng Sổ Tay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Admin Add / Edit Spice Modal */}
      {editingSpice && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setEditingSpice(null)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 border-2 border-[#795653]/30 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#795653]/15 pb-3">
              <h3
                className="text-base sm:text-lg font-extrabold text-[#795653]"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                {editingSpice.id ? 'Chỉnh sửa gia vị' : 'Thêm gia vị mới cho cốt truyện'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSpice(null)}
                className="text-xs font-bold text-[#795653]/60 hover:text-[#795653] cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveSpice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#795653] mb-1 block">
                  Tiêu đề bài gia vị <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lệnh neo thời gian (Time-Anchor)"
                  value={editingSpice.title || ''}
                  onChange={(e) => setEditingSpice({ ...editingSpice, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#795653]/25 text-xs font-bold text-[#795653] focus:outline-hidden focus:ring-2 focus:ring-[#FF8FAB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#795653] mb-1 block">Loại gia vị</label>
                  <select
                    value={editingSpice.type || 'command'}
                    onChange={(e) => setEditingSpice({ ...editingSpice, type: e.target.value as SpiceType })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#795653]/25 text-xs font-bold text-[#795653]"
                  >
                    <option value="command">🧂 Lệnh Nêm Nếm (Commands/Prompts)</option>
                    <option value="lore">📖 Sổ Tay Bối Cảnh (Lore/Plot Info)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#795653] mb-1 block">Tác giả / Nguồn</label>
                  <input
                    type="text"
                    value={editingSpice.author || 'Chủ Tiệm'}
                    onChange={(e) => setEditingSpice({ ...editingSpice, author: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#795653]/25 text-xs font-bold text-[#795653]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#795653] mb-1 block">
                  Nội dung chi tiết / Đoạn lệnh Prompt <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Nhập nội dung câu lệnh, quy tắc hoặc thiết lập bối cảnh..."
                  value={editingSpice.content || ''}
                  onChange={(e) => setEditingSpice({ ...editingSpice, content: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-[#795653]/25 text-xs font-medium leading-relaxed bg-[#FFF9F4]/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#FF8FAB] resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#795653]/15">
                <button
                  type="button"
                  onClick={() => setEditingSpice(null)}
                  className="py-2 px-4 rounded-xl border border-[#795653]/20 text-xs font-bold hover:bg-[#795653]/10 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2 px-6 rounded-xl bg-[#FF8FAB] hover:bg-[#ff7aa0] text-white text-xs font-extrabold cursor-pointer shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu Bài Viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
