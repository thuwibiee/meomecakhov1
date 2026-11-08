import React, { useState, useEffect } from 'react';
import {
  Send,
  Copy,
  Check,
  Heart,
  Ticket,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Mail,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SpecialOrder, User } from '../types.ts';
import { firebaseApi } from '../firebase.ts';

interface SpecialOrderSectionProps {
  user: User | null;
  authToken: string | null;
  onOpenAuth: () => void;
  onGoToShop: () => void;
}

export const SpecialOrderSection: React.FC<SpecialOrderSectionProps> = ({
  user,
  authToken,
  onOpenAuth,
  onGoToShop,
}) => {
  // 5 Form Fields
  const [characterName, setCharacterName] = useState('');
  const [fishType, setFishType] = useState('');
  const [description, setDescription] = useState('');
  const [plotIdea, setPlotIdea] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  // UI / Submission state
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<SpecialOrder | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Gentle wind chime sound synthesizer (Web Audio API)
  const playWindChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Pentatonic crystal wind chime frequencies (E6, G6, A6, C7, D7, E7)
      const notes = [
        { freq: 1567.98, delay: 0 },
        { freq: 2093.00, delay: 0.08 },
        { freq: 1318.51, delay: 0.16 },
        { freq: 2349.32, delay: 0.24 },
        { freq: 1760.00, delay: 0.35 },
        { freq: 2637.02, delay: 0.46 },
      ];

      notes.forEach(({ freq, delay }) => {
        const startTime = ctx.currentTime + delay;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2.76, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.0);

        overtoneGain.gain.setValueAtTime(0, startTime);
        overtoneGain.gain.linearRampToValueAtTime(0.05, startTime + 0.005);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        overtone.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 2.05);
        overtone.start(startTime);
        overtone.stop(startTime + 1.05);
      });
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  };

  // User's previous orders history state
  const [myOrders, setMyOrders] = useState<SpecialOrder[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch user's orders history
  const fetchMyOrders = async () => {
    if (!authToken) return;
    setIsLoadingHistory(true);
    try {
      const res = await firebaseApi('/api/special-orders/my', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMyOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching my orders:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user && authToken) {
      fetchMyOrders();
    }
  }, [user, authToken]);

  // Copy code helper
  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Reset form for a new order
  const handleStartNewOrder = () => {
    setSubmittedOrder(null);
    setCharacterName('');
    setFishType('');
    setDescription('');
    setPlotIdea('');
    setExtraNotes('');
    setFieldErrors({});
    setErrorMessage(null);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Sound and visual press effect matching "Sốp Ping Chọn Cá"
    playWindChime();
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 420);

    // Check auth
    if (!user || !authToken) {
      onOpenAuth();
      return;
    }

    const errors: { [key: string]: string } = {};

    const cleanCharName = characterName.trim();
    const cleanFishType = fishType.trim();
    const cleanDesc = description.trim();
    const cleanPlot = plotIdea.trim();
    const cleanNotes = extraNotes.trim();

    // Validation: Only require content in necessary fields.
    // At least description OR plotIdea must be provided so the shop has info to work with!
    if (!cleanDesc && !cleanPlot) {
      errors.description = 'Quý khách vui lòng nhập miêu tả em cá hoặc ý tưởng cốt truyện để tiệm có thông tin nhé ♡';
    }

    if (cleanCharName.length > 150) {
      errors.characterName = 'Tên cá khô tối đa 150 ký tự.';
    }

    if (cleanFishType.length > 300) {
      errors.fishType = 'Loại cá tối đa 300 ký tự.';
    }

    if (cleanDesc.length > 5000) {
      errors.description = 'Miêu tả cá khô tối đa 5000 ký tự.';
    }

    if (cleanPlot.length > 8000) {
      errors.plotIdea = 'Ý tưởng cốt truyện tối đa 8000 ký tự.';
    }

    if (cleanNotes.length > 3000) {
      errors.extraNotes = 'Thông tin khác tối đa 3000 ký tự.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await firebaseApi('/api/special-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          characterName: cleanCharName,
          fishType: cleanFishType,
          description: cleanDesc,
          plotIdea: cleanPlot,
          extraNotes: cleanNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.error });
        } else {
          setErrorMessage(data.error || 'Có lỗi xảy ra khi gửi phiếu đặt cá.');
        }
        return;
      }

      setSubmittedOrder(data.order);
      fetchMyOrders();
    } catch (err: any) {
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[820px] mx-auto py-2 sm:py-6 px-1 sm:px-4">
      {/* ================= SUCCESS STATE ================= */}
      {submittedOrder ? (
        <div className="bg-[#FFF9F4] rounded-[28px] border-2 border-[#FFB3C6] p-6 sm:p-10 shadow-kawaii text-[#795653] animate-in fade-in zoom-in-95 duration-200 space-y-6">
          {/* Header Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFE5EC] border-2 border-[#FF8FAB] text-2xl shadow-inner mb-2 animate-bounce">
              💌
            </div>
            <h2
              className="text-xl sm:text-2xl font-bold text-[#E13F7C] tracking-wide"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              TIỆM ĐÃ NHẬN PHIẾU ĐẶT CÁ CỦA QUÝ KHÁCH! ♡
            </h2>
            <p
              className="text-xs sm:text-sm text-[#795653]/85 max-w-lg mx-auto italic leading-relaxed"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              *Đơn đặt hàng thành công. Cảm ơn quý khách đã ghé tiệm, đơn đặt hàng sẽ được thực hiện nhanh nhất có thể trong khả năng của Mèo ⋆🐾° *
            </p>
          </div>

          {/* Receipt Details Ticket */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#FFB3C6] p-5 sm:p-6 space-y-4 shadow-xs">
            {/* Order Code Highlight */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#FFE5EC]/60 border border-[#FF8FAB]/40">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-5 h-5 text-[#E13F7C] shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#795653]/70 tracking-wider">
                    MÃ PHIẾU ĐẶT CÁ
                  </div>
                  <div
                    className="text-lg sm:text-xl font-black text-[#E13F7C] font-mono tracking-wider"
                  >
                    {submittedOrder.requestId}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(submittedOrder.requestId)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FFE5EC] text-[#795653] border border-[#FF8FAB]/50 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#E13F7C]" />
                    <span style={{ fontFamily: "'Cal Sans', sans-serif" }}>Sao chép mã</span>
                  </>
                )}
              </button>
            </div>

            {/* Other details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-[#FFF9F4] border border-[#795653]/15">
                <span className="text-[10px] uppercase font-bold text-[#795653]/60 block mb-1">
                  TÊN CÁ KHÔ
                </span>
                <span
                  className="font-bold text-[#795653] text-sm truncate block"
                  style={{ fontFamily: "'Cal Sans', sans-serif" }}
                >
                  {submittedOrder.characterName || 'Chưa đặt tên (để tiệm tự đặt)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF9F4] border border-[#795653]/15">
                <span className="text-[10px] uppercase font-bold text-[#795653]/60 block mb-1">
                  TRẠNG THÁI
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã nhận phiếu
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF9F4] border border-[#795653]/15">
                <span className="text-[10px] uppercase font-bold text-[#795653]/60 block mb-1">
                  THỜI GIAN GỬI
                </span>
                <span className="font-medium text-[#795653] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#795653]/60" />
                  {new Date(submittedOrder.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Quick summary of what was written */}
            {submittedOrder.description && (
              <div className="p-3.5 rounded-xl bg-[#FFF9F4] border border-[#795653]/15 text-xs space-y-1">
                <span className="font-bold text-[#795653] block text-[11px]">
                  Miêu tả tóm tắt:
                </span>
                <p className="text-[#795653]/85 italic line-clamp-3 leading-relaxed">
                  "{submittedOrder.description}"
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onGoToShop}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#A9C5F2] hover:bg-[#98b8ec] text-[#2c4770] font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              <ArrowLeft className="w-4 h-4" />
              QUAY VỀ QUẦY CÁ
            </button>

            <button
              type="button"
              onClick={handleStartNewOrder}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#FF8FAB] hover:bg-[#ff7b9d] text-[#795653] font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              <Send className="w-4 h-4" />
              ĐẶT THÊM PHIẾU MỚI ♡
            </button>
          </div>
        </div>
      ) : (
        /* ================= ORDER SHEET FORM ================= */
        <div className="bg-[#FFF9F4] rounded-[28px] border-2 border-[#FFB3C6] p-5 sm:p-9 shadow-kawaii text-[#795653] relative space-y-6">
          {/* Top Cute Hanging Clip / Corner Ribbon */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FFE5EC] border border-[#FF8FAB] shadow-2xs text-[11px] font-bold text-[#E13F7C] flex items-center gap-1.5 tracking-wider uppercase">
            <span>⋆🐾°</span>
            <span className="text-[9px] sm:text-[11px]" style={{ fontFamily: "'Cal Sans', sans-serif" }}>MÈO MÊ CÁ KHÔ · SPECIAL ORDER</span>
            <span>⋆🐾°</span>
          </div>

          {/* ================= 2. PHẦN ĐẦU PHIẾU ================= */}
          <div className="text-center pt-3 pb-2 space-y-2 border-b-2 border-dashed border-[#FFB3C6]/60">
            {/* Main Header Title */}
            <div className="flex items-center justify-center">
              <h1
                className="text-[22px] sm:text-3xl font-extrabold text-[#E13F7C] tracking-wide text-center"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                ⋆.𐙚 ̊ PHIẾU ĐẶT CÁ KHÔ ⋆.𐙚 ̊
              </h1>
            </div>

            {/* Welcoming Greeting */}
            <p
              className="max-w-xl mx-auto leading-relaxed"
              style={{ fontFamily: "'Cal Sans', sans-serif", color: '#ff81b3', fontSize: '13px' }}
            >
              Chào mừng quý khách đến khu vực đặt cá khô theo yêu cầu! Hãy để lại đơn đặt cá khô của mình tại đây nhé ♡
            </p>

            {/* < LƯU Ý > Notice Box */}
            <div className="mt-3 inline-block max-w-2xl mx-auto p-3 sm:p-3.5 rounded-2xl bg-[#FFE5EC]/70 border border-[#FF8FAB]/50 text-left text-xs leading-relaxed shadow-2xs">
              <div className="flex items-start gap-2">
                <span className="text-sm shrink-0">⚠️</span>
                <div>
                  <span
                    className="font-bold text-[#E13F7C] uppercase tracking-wide block mb-0.5 text-[11px]"
                    style={{ fontFamily: "'Cal Sans', sans-serif" }}
                  >
                    &lt; LƯU Ý &gt;
                  </span>
                  <p
                    className="text-[#795653]/85 text-xs font-medium"
                    style={{ fontFamily: "'Cal Sans', sans-serif" }}
                  >
                    𑣲⋆ Tiệm không nhận đơn đặt cá khô thuộc thể loại Open-world/ Anime vì đó không phải sở trường của Tiệm. Mong quý khách thông cảm!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= 3. MÃ PHIẾU ĐẶT CÁ ================= */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-dashed border-[#FFB3C6] flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFE5EC] border border-[#FF8FAB]/40 flex items-center justify-center text-[#E13F7C] text-sm shrink-0">
                🏷️
              </div>
              <div>
                <span
                  className="text-[10px] uppercase font-bold tracking-wider block"
                  style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
                >
                  MÃ PHIẾU ĐẶT CÁ
                </span>
                <span
                  className="text-xs sm:text-sm italic"
                  style={{ fontFamily: "'Nunito', sans-serif", color: '#cfacac', fontWeight: 'normal' }}
                >
                  Mã phiếu sẽ được cấp sau khi gửi thành công
                </span>
              </div>
            </div>

            <div
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#E13F7C]/60 bg-[#FFF9F4] px-2.5 py-1 rounded-lg border border-[#FFB3C6]/40"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              REQ-XXXX
            </div>
          </div>

          {/* Guest Auth Notice if Not Logged In */}
          {!user && (
            <div className="p-3.5 rounded-2xl bg-[#FFF3CD]/80 border border-[#F7DDA0] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-[#795653]">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Quý khách vui lòng <strong>đăng nhập</strong> để tiệm lưu mã phiếu vào tài khoản của bà nhé!
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="py-1.5 px-4 rounded-xl bg-[#FF8FAB] hover:bg-[#ff7b9d] text-[#795653] font-bold text-xs shrink-0 transition-transform active:scale-95 shadow-2xs cursor-pointer"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                Đăng Nhập Ngay ♡
              </button>
            </div>
          )}

          {/* Server Error Banner if any */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= 4. NỘI DUNG ĐƠN ĐẶT (5 TRƯỜNG TỪ TRÊN XUỐNG DƯỚI) ================= */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Trường 1 — TÊN CÁ KHÔ */}
            <div className="space-y-1.5">
              <label
                htmlFor="character-name-input"
                className="text-xs sm:text-sm font-bold flex items-center gap-1.5"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}
              >
                <span>𑣲⋆</span>
                <span>TÊN CÁ KHÔ (NẾU CÓ)</span>
              </label>

              <input
                id="character-name-input"
                type="text"
                maxLength={150}
                value={characterName}
                onChange={(e) => {
                  setCharacterName(e.target.value);
                  if (fieldErrors.characterName) {
                    setFieldErrors((prev) => ({ ...prev, characterName: '' }));
                  }
                }}
                placeholder="Quý khách đã có tên cho em cá của mình chưa?"
                className={`w-full px-4 py-3 rounded-2xl border bg-white text-xs sm:text-sm text-[#795653] placeholder:text-[#795653]/45 transition-all outline-hidden shadow-2xs ${
                  fieldErrors.characterName
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : 'border-[#FFB3C6]/60 focus:border-[#FF8FAB] focus:ring-2 focus:ring-[#FF8FAB]/20'
                }`}
              />

              {fieldErrors.characterName && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">
                  {fieldErrors.characterName}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-[#FFB3C6]/40" />

            {/* Trường 2 — LOẠI CÁ */}
            <div className="space-y-1.5">
              <label
                htmlFor="fish-type-input"
                className="text-xs sm:text-sm font-bold flex items-center gap-1.5"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}
              >
                <span>𑣲⋆</span>
                <span>LOẠI CÁ</span>
              </label>

              <input
                id="fish-type-input"
                type="text"
                maxLength={300}
                value={fishType}
                onChange={(e) => {
                  setFishType(e.target.value);
                  if (fieldErrors.fishType) {
                    setFieldErrors((prev) => ({ ...prev, fishType: '' }));
                  }
                }}
                placeholder="Ví dụ: Thanh xuân vườn trường, enemies to lovers, cưới trước yêu sau, thanh mai trúc mã, giới giải trí, cổ trang..."
                className={`w-full px-4 py-3 rounded-2xl border bg-white text-xs sm:text-sm text-[#795653] placeholder:text-[#795653]/45 transition-all outline-hidden shadow-2xs ${
                  fieldErrors.fishType
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : 'border-[#FFB3C6]/60 focus:border-[#FF8FAB] focus:ring-2 focus:ring-[#FF8FAB]/20'
                }`}
              />

              {fieldErrors.fishType && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">
                  {fieldErrors.fishType}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-[#FFB3C6]/40" />

            {/* Trường 3 — MIÊU TẢ CÁ KHÔ */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between" style={{ color: '#E13F7C' }}>
                <label
                  htmlFor="description-textarea"
                  className="text-xs sm:text-sm font-bold flex items-center gap-1.5"
                  style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}
                >
                  <span>𑣲⋆</span>
                  <span style={{ fontSize: '15px', fontFamily: 'Tiny5' }}>MIÊU TẢ CÁ KHÔ</span>
                </label>
                <span className="text-xs font-medium" style={{ color: '#E13F7C', fontSize: '15px', fontFamily: 'Tiny5' }}>
                  {description.length}/5000
                </span>
              </div>

              <textarea
                id="description-textarea"
                rows={4}
                maxLength={5000}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) {
                    setFieldErrors((prev) => ({ ...prev, description: '' }));
                  }
                }}
                placeholder="Hãy kể cho chủ tiệm nghe về em cá mà quý khách mong muốn: ngoại hình, tính cách, tuổi tác, nghề nghiệp, xuất thân, gia đình, thói quen hoặc bất kỳ đặc điểm nào khác..."
                className={`w-full p-4 rounded-2xl border bg-white text-xs sm:text-sm text-[#795653] placeholder:text-[#795653]/45 leading-relaxed transition-all outline-hidden shadow-2xs resize-y min-h-[110px] ${
                  fieldErrors.description
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : 'border-[#FFB3C6]/60 focus:border-[#FF8FAB] focus:ring-2 focus:ring-[#FF8FAB]/20'
                }`}
              />

              {fieldErrors.description && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">
                  {fieldErrors.description}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-[#FFB3C6]/40" />

            {/* Trường 4 — IDEA CỐT TRUYỆN (Lớn nhất trong toàn bộ phiếu) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between" style={{ color: '#E13F7C' }}>
                <label
                  htmlFor="plot-idea-textarea"
                  className="text-xs sm:text-sm font-bold flex items-center gap-1.5"
                  style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}
                >
                  <span>𑣲⋆</span>
                  <span>IDEA CỐT TRUYỆN</span>
                </label>
                <span className="text-[10px] font-medium" style={{ color: '#E13F7C' }}>
                  {plotIdea.length}/8000
                </span>
              </div>

              <textarea
                id="plot-idea-textarea"
                rows={7}
                maxLength={8000}
                value={plotIdea}
                onChange={(e) => {
                  setPlotIdea(e.target.value);
                  if (fieldErrors.plotIdea) {
                    setFieldErrors((prev) => ({ ...prev, plotIdea: '' }));
                  }
                }}
                placeholder="Quý khách có thể kể về bối cảnh, mối quan hệ giữa các nhân vật, hoàn cảnh gặp gỡ, cảnh mở đầu hoặc bất kỳ tình tiết, tình huống và ý tưởng nào muốn xuất hiện trong câu chuyện..."
                className={`w-full p-4 rounded-2xl border bg-white text-xs sm:text-sm text-[#795653] placeholder:text-[#795653]/45 leading-relaxed transition-all outline-hidden shadow-2xs resize-y min-h-[170px] ${
                  fieldErrors.plotIdea
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : 'border-[#FFB3C6]/60 focus:border-[#FF8FAB] focus:ring-2 focus:ring-[#FF8FAB]/20'
                }`}
              />

              {fieldErrors.plotIdea && (
                <p className="text-xs text-rose-600 font-medium pl-1" style={{ fontSize: '12px' }}>
                  {fieldErrors.plotIdea}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-[#FFB3C6]/40" />

            {/* Trường 5 — THÔNG TIN KHÁC */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between" style={{ color: '#E13F7C' }}>
                <label
                  htmlFor="extra-notes-textarea"
                  className="text-xs sm:text-sm font-bold flex items-center gap-1.5"
                  style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}
                >
                  <span>𑣲⋆</span>
                  <span>THÔNG TIN KHÁC</span>
                </label>
                <span className="text-[10px] font-medium" style={{ color: '#E13F7C' }}>
                  {extraNotes.length}/3000
                </span>
              </div>

              <textarea
                id="extra-notes-textarea"
                rows={3}
                maxLength={3000}
                value={extraNotes}
                onChange={(e) => {
                  setExtraNotes(e.target.value);
                  if (fieldErrors.extraNotes) {
                    setFieldErrors((prev) => ({ ...prev, extraNotes: '' }));
                  }
                }}
                placeholder="Quý khách có yêu cầu hoặc lưu ý đặc biệt nào khác muốn nhắn gửi đến chủ tiệm không?"
                className={`w-full p-3.5 rounded-2xl border bg-white text-xs sm:text-sm text-[#795653] placeholder:text-[#795653]/45 leading-relaxed transition-all outline-hidden shadow-2xs resize-y min-h-[90px] ${
                  fieldErrors.extraNotes
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : 'border-[#FFB3C6]/60 focus:border-[#FF8FAB] focus:ring-2 focus:ring-[#FF8FAB]/20'
                }`}
              />

              {fieldErrors.extraNotes && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">
                  {fieldErrors.extraNotes}
                </p>
              )}
            </div>

            {/* ================= 5. NÚT GỬI PHIẾU ================= */}
            <div className="pt-3 flex items-center justify-center w-full">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`liquid-glass-btn relative w-full py-3.5 sm:py-4 px-6 rounded-full font-black text-sm sm:text-base md:text-lg tracking-wider flex items-center justify-center gap-2.5 cursor-pointer select-none active:outline-hidden transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${
                  isButtonPressed ? 'btn-pressed' : ''
                }`}
                style={{
                  color: '#D6336C',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.95)',
                  fontFamily: "'Cal Sans', sans-serif",
                }}
              >
                {/* Shimmer sweep effect */}
                <span className="shimmer-liquid" />

                {isSubmitting ? (
                  <span className="relative z-10 flex items-center justify-center gap-2 font-black">
                    <Loader2 className="w-5 h-5 animate-spin text-[#D6336C]" />
                    <span>ĐANG GỬI PHIẾU ĐẶT CÁ...</span>
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2 font-black">
                    <span>GỬI PHIẾU ĐẶT CÁ ♡‧₊˚</span>
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Stationery Stamp / Note */}
          <div className="text-center pt-2 pb-1 border-t border-[#FFB3C6]/30">
            <span
              className="text-[11px] italic"
              style={{ color: '#E13F7C', fontFamily: "'Cal Sans', sans-serif" }}
            >
              Tiệm Mèo Mê Cá Khô cảm ơn quý khách đã ghé chơi và gửi gắm những ý tưởng dễ thương ⋆🐾°
            </span>
          </div>
        </div>
      )}

      {/* ================= USER'S ORDER HISTORY ================= */}
      {user && (
        <div className="mt-8 bg-white/80 rounded-3xl border border-[#FFB3C6]/60 p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-left cursor-pointer group"
            >
              <Ticket className="w-4 h-4 text-[#E13F7C]" />
              <span
                className="text-sm font-bold uppercase transition-colors"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#e13f7c' }}
              >
                LỊCH SỬ ĐẶT PHIẾU ({myOrders.length})
              </span>
              {showHistory ? (
                <ChevronUp className="w-4 h-4 text-[#795653]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#795653]/60" />
              )}
            </button>

            <button
              type="button"
              onClick={fetchMyOrders}
              disabled={isLoadingHistory}
              className="p-1.5 rounded-lg hover:bg-[#FFE5EC] text-[#795653]/70 hover:text-[#E13F7C] transition-colors cursor-pointer"
              title="Làm mới lịch sử"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {showHistory && (
            <div className="space-y-3 pt-2">
              {isLoadingHistory ? (
                <div className="p-6 text-center text-xs text-[#795653]/70">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-[#E13F7C]" />
                  Đang tải danh sách phiếu đặt...
                </div>
              ) : myOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#795653]/70 bg-[#FFF9F4] rounded-2xl border border-dashed border-[#FFB3C6]/60">
                  Bà chưa gửi phiếu đặt cá nào. Hãy gửi ý tưởng đầu tiên ở trên nhé ♡
                </div>
              ) : (
                myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[#FFF9F4] border border-[#FFB3C6]/60 text-xs space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#E13F7C]">
                          {ord.requestId}
                        </span>
                        {ord.characterName && (
                          <span
                            className="font-bold text-[#795653]"
                            style={{ fontFamily: "'Cal Sans', sans-serif" }}
                          >
                            · {ord.characterName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#795653]/60">
                          {new Date(ord.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            ord.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'accepted'
                              ? 'bg-purple-100 text-purple-800'
                              : ord.status === 'in_review'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.status === 'declined'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status === 'completed'
                            ? 'Đã hoàn thành'
                            : ord.status === 'accepted'
                            ? 'Đã tiếp nhận'
                            : ord.status === 'in_review'
                            ? 'Đang xem xét'
                            : ord.status === 'declined'
                            ? 'Tạm hoãn'
                            : 'Đã nhận phiếu'}
                        </span>
                      </div>
                    </div>

                    {ord.fishType && (
                      <div className="text-[11px] text-[#526C91]">
                        <strong>Loại cá:</strong> {ord.fishType}
                      </div>
                    )}

                    {ord.description && (
                      <p className="text-[#795653]/85 line-clamp-2 leading-relaxed bg-white p-2.5 rounded-xl border border-[#795653]/10">
                        {ord.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
