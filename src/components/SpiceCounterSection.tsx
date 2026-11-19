import React, { useState, useEffect } from 'react';
import { Spice, SpiceType } from '../types.ts';
import { firebaseApi, subscribeToSpices, subscribeToSpiceConfig } from '../firebase.ts';
import { Copy, Check, Plus, Edit, Trash2, Search, ShieldAlert, CheckCircle2, ExternalLink, Link2 } from 'lucide-react';

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

  // Lock status synced with Firestore (fallback localStorage)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('meome_spice_locked');
      return saved !== 'false';
    } catch {
      return true;
    }
  });
  const [isTogglingLock, setIsTogglingLock] = useState(false);

  // Modals state
  const [readingSpice, setReadingSpice] = useState<Spice | null>(null);
  const [editingSpice, setEditingSpice] = useState<Partial<Spice> | null>(null);
  const [confirmDeleteSpice, setConfirmDeleteSpice] = useState<Spice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Subscribe to real-time Spices & Config from Firestore
  useEffect(() => {
    const unsubSpices = subscribeToSpices((data) => {
      setSpices(data);
    });
    const unsubConfig = subscribeToSpiceConfig(({ isLocked: remoteLocked }) => {
      setIsLocked(remoteLocked);
      try {
        localStorage.setItem('meome_spice_locked', String(remoteLocked));
      } catch {}
    });
    return () => {
      unsubSpices();
      unsubConfig();
    };
  }, []);

  const handleToggleLock = async () => {
    if (!isAdmin || isTogglingLock) return;
    if (!authToken) {
      setErrorMessage('Phiên đăng nhập Admin đã hết hạn. Vui lòng đăng nhập lại.');
      onOpenAuth();
      return;
    }

    const nextState = !isLocked;
    setIsLocked(nextState);
    setIsTogglingLock(true);
    try {
      localStorage.setItem('meome_spice_locked', String(nextState));
    } catch {}

    try {
      const res = await firebaseApi('/api/admin/spices/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ isLocked: nextState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể lưu trạng thái khóa Quầy Gia Vị.');
      showStatus(nextState ? 'Đã khóa Quầy Gia Vị (chỉ Admin xem).' : 'Đã mở Public Quầy Gia Vị cho tất cả khách xem!');
    } catch (err: any) {
      setIsLocked(!nextState);
      setErrorMessage(err.message || 'Lỗi khi lưu trạng thái Quầy Gia Vị lên máy chủ.');
    } finally {
      setIsTogglingLock(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyCommand = (text: string, spiceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(spiceId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Delete Spice Item (Admin only, inline confirmation - never uses window.confirm)
  const executeDeleteSpice = async () => {
    if (!confirmDeleteSpice || !isAdmin) return;
    if (!authToken) {
      setErrorMessage('Phiên đăng nhập Admin đã hết hạn. Vui lòng đăng nhập lại.');
      setConfirmDeleteSpice(null);
      onOpenAuth();
      return;
    }

    const target = confirmDeleteSpice;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await firebaseApi(`/api/admin/spices/${target.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xóa bài viết gia vị.');

      if (Array.isArray(data.spices)) {
        setSpices(data.spices);
      } else {
        setSpices((prev) => prev.filter((s) => s.id !== target.id));
      }
      if (readingSpice?.id === target.id) setReadingSpice(null);
      setConfirmDeleteSpice(null);
      showStatus(`Đã xóa "${target.title}" khỏi Firestore.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Xóa gia vị thất bại.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save Spice (Create or Edit - Admin only)
  const handleSaveSpice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpice || !isAdmin) return;
    if (!authToken) {
      setErrorMessage('Phiên đăng nhập Admin đã hết hạn. Vui lòng đăng nhập lại để lưu.');
      onOpenAuth();
      return;
    }

    const titleStr = (editingSpice.title || '').trim();
    const contentStr = (editingSpice.content || '').trim();
    const rawDocsUrl = (editingSpice.docsUrl || '').trim();
    const docsUrlStr = rawDocsUrl
      ? (rawDocsUrl.startsWith('http://') || rawDocsUrl.startsWith('https://') ? rawDocsUrl : `https://${rawDocsUrl}`)
      : '';
    const authorStr = (editingSpice.author || '').trim() || 'Chủ Tiệm';
    const typeVal: SpiceType = editingSpice.type === 'lore' ? 'lore' : 'command';

    if (!titleStr) {
      setErrorMessage('Vui lòng nhập Tiêu đề cho bài gia vị.');
      return;
    }
    if (typeVal === 'command') {
      if (!contentStr && !docsUrlStr) {
        setErrorMessage('Vui lòng nhập ít nhất 1 trong 2 mục: Lệnh để sao chép hoặc Link GG Docs của lệnh.');
        return;
      }
    } else if (!contentStr) {
      setErrorMessage('Vui lòng nhập Nội dung chi tiết cho Tủ Ướp Cá.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...editingSpice,
        title: titleStr,
        content: contentStr,
        docsUrl: typeVal === 'command' ? docsUrlStr : '',
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

      if (Array.isArray(data.spices)) {
        setSpices(data.spices);
      }
      if (readingSpice && data.spice && readingSpice.id === data.spice.id) {
        setReadingSpice(data.spice);
      }
      if (activeTab !== typeVal) {
        setActiveTab(typeVal);
      }
      setEditingSpice(null);
      showStatus(
        editingSpice.id
          ? `Đã lưu chỉnh sửa "${titleStr}" vào ${typeVal === 'lore' ? 'Tủ Ướp Cá' : 'Lệnh Nêm Nếm'}!`
          : `Đã thêm mới "${titleStr}" vào ${typeVal === 'lore' ? 'Tủ Ướp Cá' : 'Lệnh Nêm Nếm'}!`
      );
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
            <p
              className="text-xs sm:text-sm text-[#795653]/80 mt-0.5 leading-relaxed"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              𖹭 nêm thêm tí gia vị cho cá khô đậm đà hơn
            </p>
          </div>
        </div>

        {/* Admin Action & Lock Toggle Buttons */}
        {isAdmin && (
          <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            {/* Toggle Lock Button for Admin */}
            <button
              type="button"
              disabled={isTogglingLock}
              onClick={handleToggleLock}
              className={`py-2 px-3.5 rounded-2xl font-black text-xs flex items-center gap-1.5 border shadow-2xs transition-all cursor-pointer disabled:opacity-60 ${
                isLocked
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
              }`}
              title="Nhấp vào đây để Bật hoặc Tắt khóa Public với khách hàng"
            >
              <span>{isLocked ? '🔒 Đang khóa (Chỉnh sửa)' : '🔓 Đã Public (Mọi người xem)'}</span>
              <span className="underline text-[10px] ml-0.5 opacity-80">
                {isTogglingLock ? '(Đang lưu...)' : isLocked ? '(Mở Public)' : '(Khóa lại)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingSpice({
                  type: activeTab,
                  title: '',
                  content: '',
                  docsUrl: '',
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

      {/* Feedback Status Banners */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700/70 hover:text-emerald-900 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && !editingSpice && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600/70 hover:text-rose-900 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

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
            <span>ᯓ★ LỆNH NÊM NẾM</span>
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
            <span>ᯓ★ TỦ ƯỚP CÁ</span>
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
          <h3
            className="font-extrabold text-[#795653] text-sm"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            {searchTerm
              ? 'Không tìm thấy gia vị nào phù hợp'
              : activeTab === 'lore'
              ? 'TỦ ƯỚP CÁ HIỆN ĐANG TRỐNG.'
              : 'Chưa có công thức gia vị nào trong mục này'}
          </h3>
          {searchTerm && (
            <p
              className="text-xs text-[#795653]/70 max-w-sm mx-auto"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              Hãy thử gõ từ khóa khác xem sao nha!
            </p>
          )}
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
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F6A6B8]/20 text-[#A6536A]"
                        style={{ fontFamily: "'Cal Sans', sans-serif" }}
                      >
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteSpice(spice);
                              setErrorMessage(null);
                            }}
                            className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Xóa bài này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content, Code Box & Google Docs Link */}
                  <div className="mt-2 text-xs text-[#795653]/90 leading-relaxed space-y-2">
                    {isCommand ? (
                      <>
                        {spice.content && (
                          <div
                            className="relative my-1 p-3 rounded-xl bg-[#FFF0F4] border border-[#FF8FAB]/40 font-mono text-[11px] text-[#526C91] leading-normal group/code"
                            style={{ fontFamily: "'Cal Sans', sans-serif" }}
                          >
                            <div className="line-clamp-3 whitespace-pre-wrap pr-20">{spice.content}</div>

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
                        )}
                        {spice.docsUrl && (
                          <div
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-sky-50/90 border border-sky-200 text-sky-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Link2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span className="text-[11px] font-bold truncate">Link Google Docs của lệnh</span>
                            </div>
                            <a
                              href={spice.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-2.5 rounded-lg bg-white hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 text-[10px] font-extrabold inline-flex items-center gap-1 shrink-0 transition-all shadow-2xs"
                            >
                              <span>MỞ DOCS</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="line-clamp-4 whitespace-pre-wrap leading-relaxed">{spice.content}</p>
                    )}
                  </div>
                </div>

                {/* Footer read detail link */}
                <div className="mt-3 pt-2 border-t border-dashed border-[#795653]/15 flex items-center justify-between text-[11px]">
                  <span
                    className="text-[#795653]/60 font-medium"
                    style={{ fontFamily: "'Cal Sans', sans-serif" }}
                  >
                    {new Date(spice.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                  </span>
                  <span
                    className="font-bold text-[#E13F7C] group-hover:underline flex items-center gap-1"
                    style={{ fontFamily: "'Cal Sans', sans-serif" }}
                  >
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
              <div className="space-y-4">
                {readingSpice.content && (
                  <div
                    className="space-y-2"
                    style={{ fontFamily: "'Cal Sans', sans-serif" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#795653]">
                        Lệnh để sao chép (bấm nút bên phải để copy nhanh):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCommand(readingSpice.content, readingSpice.id)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border shrink-0 ${
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
                )}

                {readingSpice.docsUrl && (
                  <div className="p-4 rounded-2xl bg-sky-50/90 border-2 border-sky-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-sky-900">
                        <Link2 className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>Link Google Docs của lệnh</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCommand(readingSpice.docsUrl || '', `${readingSpice.id}_docs`)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                            copiedId === `${readingSpice.id}_docs`
                              ? 'bg-emerald-500 text-white border-emerald-400'
                              : 'bg-white hover:bg-sky-100 text-sky-800 border-sky-200'
                          }`}
                        >
                          {copiedId === `${readingSpice.id}_docs` ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Đã Copy Link ✓</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao Chép Link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={readingSpice.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <span>Mở Google Docs</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] text-sky-700/90 font-mono break-all bg-white/80 px-3 py-2 rounded-xl border border-sky-200/80">
                      {readingSpice.docsUrl}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-[#795653]/15 text-xs sm:text-sm text-[#795653] leading-relaxed whitespace-pre-wrap shadow-inner">
                {readingSpice.content}
              </div>
            )}

            {/* Footer action */}
            <div className="flex justify-end gap-2 pt-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const target = readingSpice;
                    setReadingSpice(null);
                    setEditingSpice(target);
                    setErrorMessage(null);
                  }}
                  className="py-2 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa bài này</span>
                </button>
              )}
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
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSaving) setEditingSpice(null);
          }}
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
                    <option value="command">ᯓ★ LỆNH NÊM NẾM (Commands/Prompts)</option>
                    <option value="lore">ᯓ★ TỦ ƯỚP CÁ (Lore/Plot Info)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#795653] mb-1 block">Tác giả / Nguồn</label>
                  <input
                    type="text"
                    placeholder="Chủ Tiệm"
                    value={editingSpice.author ?? ''}
                    onChange={(e) => setEditingSpice({ ...editingSpice, author: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#795653]/25 text-xs font-bold text-[#795653]"
                  />
                </div>
              </div>

              {editingSpice.type === 'lore' ? (
                <div>
                  <label className="text-xs font-bold text-[#795653] mb-1 block">
                    Nội dung chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Nhập nội dung bối cảnh, luật ngầm hoặc thiết lập nhân vật..."
                    value={editingSpice.content || ''}
                    onChange={(e) => setEditingSpice({ ...editingSpice, content: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-[#795653]/25 text-xs font-medium leading-relaxed bg-[#FFF9F4]/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#FF8FAB] resize-y"
                  />
                </div>
              ) : (
                <div className="space-y-3 p-3.5 rounded-2xl bg-[#FFF9F4] border border-[#FF8FAB]/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#E13F7C]">
                      2 Tùy chọn cho Lệnh Nêm Nếm
                    </span>
                    <span className="text-[10px] font-bold text-[#795653]/70">
                      (Điền 1 trong 2 hoặc cả 2)
                    </span>
                  </div>

                  {/* Option 1: Lệnh để sao chép */}
                  <div>
                    <label className="text-xs font-bold text-[#795653] mb-1 flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5 text-[#E13F7C]" />
                      <span>Option 1: Lệnh để sao chép (Prompt / Text)</span>
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Nhập đoạn lệnh Prompt để người dùng bấm Sao Chép trực tiếp..."
                      value={editingSpice.content || ''}
                      onChange={(e) => setEditingSpice({ ...editingSpice, content: e.target.value })}
                      className="w-full p-3.5 rounded-xl border border-[#795653]/25 text-xs font-mono leading-relaxed bg-white focus:outline-hidden focus:ring-2 focus:ring-[#FF8FAB] resize-y"
                    />
                  </div>

                  {/* Option 2: Link GG Docs của lệnh */}
                  <div>
                    <label className="text-xs font-bold text-[#795653] mb-1 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Option 2: Link GG Docs của lệnh</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/document/d/..."
                      value={editingSpice.docsUrl ?? ''}
                      onChange={(e) => setEditingSpice({ ...editingSpice, docsUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#795653]/25 text-xs font-medium text-[#795653] bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>
              )}

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

      {/* 6. Admin Delete Confirmation Modal (Safe inside iframe) */}
      {confirmDeleteSpice && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setConfirmDeleteSpice(null);
          }}
        >
          <div className="bg-[#FFF9F4] w-full max-w-sm rounded-3xl p-6 border-2 border-rose-300 shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <h3
                className="text-base font-extrabold text-rose-700"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                Xác nhận xóa gia vị?
              </h3>
              <p className="text-xs text-[#795653]/85 leading-relaxed">
                Bà chủ có chắc muốn xóa bài{' '}
                <span className="font-extrabold text-[#795653]">"{confirmDeleteSpice.title}"</span> không? Thao tác này sẽ xóa vĩnh viễn khỏi cơ sở dữ liệu.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteSpice(null)}
                className="py-2 px-4 rounded-xl border border-[#795653]/20 text-xs font-bold text-[#795653] hover:bg-[#795653]/10 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteSpice}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
