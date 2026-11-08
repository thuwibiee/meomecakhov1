import React, { useState, useEffect } from 'react';
import { WalletTransaction, Voucher } from '../types.ts';
import { firebaseApi } from '../firebase.ts';
import { Gift, History, Ticket, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { XuCaIcon } from './XuCaIcon.tsx';

interface WalletSectionProps {
  username: string;
  balance: number;
  authToken: string | null;
  onBalanceUpdated: (newBalance: number) => void;
  onGoToVouchers?: () => void;
}

export const WalletSection: React.FC<WalletSectionProps> = ({
  username,
  balance,
  authToken,
  onBalanceUpdated,
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Transaction History Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Vouchers state (Moved to WalletSection)
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [claimingVoucherId, setClaimingVoucherId] = useState<string | null>(null);
  const [voucherFeedback, setVoucherFeedback] = useState<string | null>(null);

  // Load Vouchers
  const loadVouchers = async () => {
    if (!authToken) return;
    try {
      const res = await firebaseApi('/api/vouchers', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) setVouchers(data.vouchers || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, [authToken]);

  // Claim Voucher to wallet
  const handleClaimVoucher = async (voucherId: string) => {
    if (!authToken) return;
    setClaimingVoucherId(voucherId);
    setVoucherFeedback(null);

    try {
      const res = await firebaseApi(`/api/vouchers/${voucherId}/claim`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể quy đổi voucher.');
      }

      setVoucherFeedback(data.message);
      onBalanceUpdated(data.updatedBalance);
      loadVouchers();
    } catch (err: any) {
      setVoucherFeedback(err.message || 'Lỗi quy đổi voucher.');
    } finally {
      setClaimingVoucherId(null);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !authToken) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await firebaseApi('/api/wallet/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đổi mã không thành công.');
      }

      setFeedback({ type: 'success', message: data.message });
      onBalanceUpdated(data.updatedBalance);
      setCode('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadHistory = async () => {
    if (!authToken) return;
    setIsLoadingHistory(true);
    try {
      const res = await firebaseApi('/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
    setShowHistoryModal(true);
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'BUY_CHARACTER':
        return { label: 'Rước Cá Khô', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'REDEEM_CODE':
        return { label: 'Đổi Mã Giftcode', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'DAILY_QUEST':
        return { label: 'Thưởng Nhiệm Vụ', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'GACHA_SPIN':
        return { label: 'Quay Máy Gacha', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'VOUCHER_CLAIM':
        return { label: 'Quy Đổi Voucher', color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'ADMIN_ADJUST':
        return { label: 'Quà / Điều Chỉnh', color: 'text-sky-600 bg-sky-50 border-sky-200' };
      default:
        return { label: type, color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  const scrollToVouchers = () => {
    const el = document.getElementById('kho-voucher-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Hero Card */}
      <div className="bg-[#FFF9F4] p-6 sm:p-8 rounded-3xl border-2 border-[#795653]/25 shadow-kawaii relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute -right-6 -bottom-6 opacity-15 select-none pointer-events-none">
          <XuCaIcon className="w-32 h-32 object-contain" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h2
              className="text-[#795653]"
              style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#F075AE', fontSize: '15px' }}
            >
              Tài khoản: <span className="font-black" style={{ color: '#d81c63' }}>{username}</span>
            </h2>
            <div className="mt-2 flex items-center gap-2.5">
              <XuCaIcon className="w-9 h-9 sm:w-11 sm:h-11 object-contain shrink-0" />
              <span
                className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#d22065' }}
              >
                {balance}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={loadHistory}
              className="py-3 px-5 rounded-2xl text-[#795653] font-bold text-xs sm:text-sm border border-[#795653]/25 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{ backgroundColor: '#ffeded' }}
            >
              <History className="w-4 h-4 text-[#795653]" />
              <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}>lịch sử giao dịch xu cá</span>
            </button>

            <button
              onClick={scrollToVouchers}
              className="py-3 px-5 rounded-2xl text-[#795653] font-bold text-xs sm:text-sm border border-[#F7DDA0] shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{ backgroundColor: '#ffeded' }}
            >
              <Ticket className="w-4 h-4 text-[#795653]" />
              <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}>kho voucher ({vouchers.filter((v) => v.status === 'available').length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Giftcode Redeem Module */}
      <div className="bg-[#FFF9F4] p-6 sm:p-7 rounded-3xl border-2 border-[#795653]/25 shadow-kawaii">
        <div className="flex items-center gap-2.5 mb-3">
          <Gift className="w-5 h-5 text-[#A6536A]" />
          <h3
            className="lowercase"
            style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#d81c63', fontSize: '16px' }}
          >
            nhập mã đổi xu cá (giftcode)
          </h3>
        </div>

        {feedback && (
          <div
            className={`mb-4 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="nhập mã"
            className="flex-1 px-4 py-3 rounded-2xl border border-[#795653]/30 bg-white text-sm font-bold tracking-wider placeholder:font-normal uppercase text-[#795653] focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8]"
          />
          <button
            type="submit"
            disabled={isSubmitting || !code.trim()}
            className="liquid-glass-btn relative py-3 px-7 rounded-2xl text-[#795653] font-black text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap cursor-pointer overflow-hidden"
          >
            <span className="shimmer-liquid" />
            <span
              className="relative z-10"
              style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '18px' }}
            >
              {isSubmitting ? 'ĐANG KIỂM TRA...' : 'ĐỔI XU'}
            </span>
          </button>
        </form>
      </div>

      {/* KHO VOUCHER SECTION (Moved from Quests to Wallet) */}
      <div id="kho-voucher-section" className="bg-[#FFF9F4] p-6 sm:p-7 rounded-3xl border-2 border-[#795653]/25 shadow-kawaii space-y-4">
        <div className="flex items-center justify-between border-b border-[#795653]/15 pb-3">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-5 h-5 text-[#A6536A]" />
            <h3
              style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#d81c63', fontSize: '16px' }}
            >
              kho voucher
            </h3>
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full bg-[#F7DDA0]/60 text-[#795653] border border-[#F7DDA0]"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            Có sẵn: {vouchers.filter((v) => v.status === 'available').length}
          </span>
        </div>

        {voucherFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{voucherFeedback}</span>
          </div>
        )}

        {vouchers.length === 0 ? (
          <div className="py-10 px-4 text-center bg-white/60 rounded-2xl border border-dashed border-[#795653]/20">
            <div className="text-3xl mb-2">🎟️</div>
            <h4
              style={{ color: '#F075AE', fontFamily: "'Cal Sans', sans-serif", fontSize: '20px', fontWeight: 'normal' }}
            >
              kho voucher đang trống
            </h4>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {vouchers.map((v) => {
              const isClaimed = v.status === 'claimed';

              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                    isClaimed
                      ? 'bg-[#795653]/5 border-[#795653]/15 opacity-60'
                      : 'bg-white border-[#F7DDA0] shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FFF9F4] border border-[#795653]/15 text-[#526C91]">
                        {v.code}
                      </span>
                      <span className="text-xs font-black text-[#A6536A]">
                        +{v.coinValue} Xu
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-[#795653] mb-1">
                      Voucher {v.coinValue} Xu Cá
                    </h4>
                    <p className="text-[11px] text-[#795653]/60 mb-3">
                      Trúng lúc: {new Date(v.wonAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <button
                    disabled={isClaimed || claimingVoucherId === v.id}
                    onClick={() => handleClaimVoucher(v.id)}
                    className={`relative w-full py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer overflow-hidden ${
                      isClaimed
                        ? 'bg-transparent text-[#795653]/50 cursor-not-allowed border border-[#795653]/20'
                        : 'liquid-glass-btn text-[#795653]'
                    }`}
                  >
                    {!isClaimed && <span className="shimmer-liquid" />}
                    <span className="relative z-10">
                      {isClaimed
                        ? '✓ ĐÃ QUY ĐỔI'
                        : claimingVoucherId === v.id
                        ? 'ĐANG QUY ĐỔI...'
                        : 'QUY ĐỔI THÀNH XU'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History Modal */}
      {showHistoryModal && (
        <div
          onClick={() => setShowHistoryModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs transition-opacity duration-200"
        >
          <div 
            className="relative w-full max-w-2xl bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-6 sm:p-7 text-[#795653] max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#795653]/20">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#526C91]" />
                <h3 className="text-xl font-black text-[#795653]">
                  lịch sử giao dịch xu cá
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="py-1 px-3 rounded-xl border border-[#795653]/20 hover:bg-[#795653]/10 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-xs font-bold text-[#795653]/60 animate-pulse">
                  Đang tải lịch sử giao dịch...
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#795653]/70">
                  Chưa có giao dịch nào được ghi nhận.
                </div>
              ) : (
                transactions.map((tx) => {
                  const typeInfo = formatTransactionType(tx.type);
                  const isPositive = tx.amount > 0;

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-white/70 border border-[#795653]/15 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            <span className="font-semibold text-[#795653]">
                              {tx.description}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#795653]/60 mt-0.5">
                            {new Date(tx.createdAt).toLocaleString('vi-VN')} {tx.referenceId ? `· Mã: ${tx.referenceId}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`font-black text-sm tabular-nums ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? `+${tx.amount}` : tx.amount} Xu Cá
                        </div>
                        <div className="text-[10px] text-[#795653]/60">
                          Số dư sau: {tx.balanceAfter}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
