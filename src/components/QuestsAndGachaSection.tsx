import React, { useState, useEffect } from 'react';
import { GachaConfig } from '../types.ts';
import { firebaseApi } from '../firebase.ts';
import { GachaMachine } from './GachaMachine.tsx';
import { XuCaIcon } from './XuCaIcon.tsx';
import { PawLoyaltyCard } from './PawLoyaltyCard.tsx';

interface QuestsAndGachaSectionProps {
  authToken: string | null;
  userBalance: number;
  onBalanceUpdated: (newBalance: number) => void;
  defaultTab?: 'quests' | 'gacha';
  onNavigateToWalletVouchers?: () => void;
}

export const QuestsAndGachaSection: React.FC<QuestsAndGachaSectionProps> = ({
  authToken,
  userBalance,
  onBalanceUpdated,
  defaultTab = 'quests',
  onNavigateToWalletVouchers,
}) => {
  const [activeTab, setActiveTab] = useState<'quests' | 'gacha'>(defaultTab);

  // Gacha config
  const [gachaConfig, setGachaConfig] = useState<GachaConfig | null>(null);

  // Load Gacha Config
  const loadGachaConfig = async () => {
    try {
      const res = await firebaseApi('/api/gacha/config');
      const data = await res.json();
      if (res.ok) setGachaConfig(data.config);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadGachaConfig();
  }, [authToken]);

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="bg-[#FFF9F4] p-5 sm:p-6 rounded-3xl border-2 border-[#795653]/25 shadow-kawaii flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <XuCaIcon className="w-8 h-8 object-contain shrink-0" />
            <h2
              className="text-2xl font-black tracking-tight"
              style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C', marginLeft: '-7px' }}
            >
              KIẾM XU CÁ
            </h2>
          </div>
          <p
            className="font-semibold"
            style={{
              fontFamily: "'Cal Sans', sans-serif",
              fontWeight: 'normal',
              color: '#F075AE',
              fontSize: '12px',
            }}
          >
            𖹭 tích lũy dấu chân khách quen đủ 7 ngày để rước thưởng xu lớn, hoặc thử vận cùng máy gacha may mắn
          </p>
        </div>

        {/* Tab switch buttons với hiệu ứng liquid glass 3D & shimmer */}
        <div className="flex p-1.5 bg-[#FFF9F4]/80 backdrop-blur-xs rounded-2xl border border-[#795653]/15 self-start sm:self-auto gap-2">
          <button
            onClick={() => setActiveTab('quests')}
            className={`liquid-glass-btn relative overflow-hidden py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
              activeTab === 'quests'
                ? 'text-[#D6336C] shadow-sm border-2 border-white/90 scale-102'
                : 'text-[#795653]/80 opacity-75 hover:opacity-100 border border-white/60'
            }`}
            style={{ height: '50.8945px', width: '120.667px' }}
          >
            <span className="shimmer-liquid" />
            <span className="relative z-10 flex items-center justify-center">
              <span style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', marginLeft: '0px' }}>
                thẻ tích xu 🐾
              </span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('gacha')}
            className={`liquid-glass-btn relative overflow-hidden py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
              activeTab === 'gacha'
                ? 'text-[#D6336C] shadow-sm border-2 border-white/90 scale-102'
                : 'text-[#795653]/80 opacity-75 hover:opacity-100 border border-white/60'
            }`}
            style={{ width: '120.479px' }}
          >
            <span className="shimmer-liquid" />
            <span className="relative z-10 flex items-center justify-center">
              <span style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', fontSize: '11px' }}>
                gacha may mắn
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* ================= TAB A: DẤU CHÂN KHÁCH QUEN (PAW LOYALTY CARD) ================= */}
      {activeTab === 'quests' && (
        <div className="py-1">
          <PawLoyaltyCard
            authToken={authToken}
            userBalance={userBalance}
            onBalanceUpdated={onBalanceUpdated}
          />
        </div>
      )}

      {/* ================= TAB B: GACHA MAY MẮN ================= */}
      {activeTab === 'gacha' && (
        <div className="w-full flex justify-center py-2">
          <GachaMachine
            authToken={authToken}
            userBalance={userBalance}
            config={gachaConfig}
            onBalanceUpdated={onBalanceUpdated}
            onOpenVouchersTab={() => {
              if (onNavigateToWalletVouchers) {
                onNavigateToWalletVouchers();
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

