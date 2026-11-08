import React, { useState, useEffect } from 'react';
import { CatTownUserProfile, CatTownConfig, CatTownFurniture } from '../../types.ts';
import { firebaseApi } from '../../firebase.ts';
import { TownMap } from './TownMap.tsx';
import { FishingMinigame } from './FishingMinigame.tsx';
import { GrillMinigame } from './GrillMinigame.tsx';
import { CatHouseView } from './CatHouseView.tsx';
import { FortuneMinigame } from './FortuneMinigame.tsx';
import { TownInventoryModal } from './TownInventoryModal.tsx';
import { TownFurnitureShopModal } from './TownFurnitureShopModal.tsx';
import { CatSelectionModal } from './CatSelectionModal.tsx';
import { CatAvatarOption } from './catAvatars.ts';

interface CatTownSectionProps {
  authToken: string | null;
  username: string;
  userBalance: number;
  isAdmin?: boolean;
  onBalanceUpdated: (newBal: number) => void;
  onOpenAuth: () => void;
  onExitToShop: () => void;
}

export const CatTownSection: React.FC<CatTownSectionProps> = ({
  authToken,
  username,
  userBalance,
  isAdmin = false,
  onBalanceUpdated,
  onOpenAuth,
  onExitToShop,
}) => {

  const [currentView, setCurrentView] = useState<'map' | 'fishing' | 'grill' | 'house' | 'fortune'>('map');
  const [profile, setProfile] = useState<CatTownUserProfile | null>(null);
  const [config, setConfig] = useState<CatTownConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isCatSelectionOpen, setIsCatSelectionOpen] = useState<boolean>(false);

  // Fetch Cat Town Profile & Config
  const fetchProfileAndConfig = async () => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await firebaseApi('/api/cat-town/profile', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setConfig(data.config);
        if (typeof data.balance === 'number') {
          onBalanceUpdated(data.balance);
        }
        // Tự động mở Pop-up "CHỌN MÈO" khi vào thị trấn lần đầu tiên
        if (data.profile && data.profile.hasChosenCat === false) {
          setIsCatSelectionOpen(true);
        }
      } else {
        setErrorMessage(data.error || 'Không thể tải thông tin thị trấn.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndConfig();
  }, [authToken]);

  // Handle Save Chosen Cat
  const handleSelectCat = async (catOption: CatAvatarOption, customName: string) => {
    if (!authToken) {
      onOpenAuth();
      return;
    }

    const res = await firebaseApi('/api/cat-town/action/cat/choose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        avatarId: catOption.id,
        avatarUrl: catOption.avatarUrl,
        name: customName,
        breed: catOption.breed,
        coatColor: catOption.color,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi khi lưu thông tin mèo.');
    }

    if (data.profile) {
      setProfile(data.profile);
    } else if (data.cat) {
      setProfile((prev) => (prev ? { ...prev, cat: data.cat, hasChosenCat: true } : prev));
    }
    setIsCatSelectionOpen(false);
  };

  // Handle Buy Item in Shop
  const handleBuyShopItem = async (item: CatTownFurniture) => {
    if (!authToken) {
      onOpenAuth();
      return;
    }

    const res = await firebaseApi('/api/cat-town/shop/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ furnitureId: item.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi khi mua vật phẩm');
    }

    onBalanceUpdated(data.newBalance);
    fetchProfileAndConfig();
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-[#FFE5EC] border-4 border-[#795653] flex items-center justify-center text-3xl shadow-[4px_4px_0px_#795653] animate-bounce mb-3">
          🚂
        </div>
        <h3 className="text-base font-black text-[#D6336C]" style={{ fontFamily: "'Tiny5', monospace" }}>
          ĐANG LÊN CHUYẾN TÀU ĐẾN THỊ TRẤN CÁ MÈO...
        </h3>
        <p className="text-xs text-[#795653]/70 font-semibold mt-1">
          Xin quý khách vui lòng giữ trật tự và chuẩn bị mồi câu nha! 🐾
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-4 px-2 sm:px-4 flex flex-col items-center select-none">
      {errorMessage && (
        <div className="w-full max-w-4xl mb-3 p-3 rounded-2xl bg-[#FFE5EC] border-2 border-[#FF8FAB] text-[#795653] font-bold text-xs flex items-center justify-between shadow-xs">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-[#D6336C] font-black cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO CURRENT SUB-STATE */}
      {currentView === 'map' && (
        <TownMap
          userBalance={userBalance}
          profile={profile}
          config={config}
          isAdmin={isAdmin}
          onSelectLocation={(loc) => setCurrentView(loc)}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenShop={() => setIsShopOpen(true)}
          onExit={onExitToShop}
          onOpenCatSelection={() => setIsCatSelectionOpen(true)}
        />
      )}

      {currentView === 'fishing' && (
        <FishingMinigame
          authToken={authToken}
          profile={profile}
          config={config}
          isAdmin={isAdmin}
          userBalance={userBalance}
          onBalanceUpdated={onBalanceUpdated}
          onRefreshProfile={fetchProfileAndConfig}
          onBackToMap={() => setCurrentView('map')}
          onOpenAuth={onOpenAuth}
        />
      )}


      {currentView === 'grill' && (
        <GrillMinigame
          authToken={authToken}
          profile={profile}
          userBalance={userBalance}
          onBalanceUpdated={onBalanceUpdated}
          onRefreshProfile={fetchProfileAndConfig}
          onBackToMap={() => setCurrentView('map')}
          onOpenAuth={onOpenAuth}
        />
      )}

      {currentView === 'house' && (
        <CatHouseView
          authToken={authToken}
          profile={profile}
          config={config}
          userBalance={userBalance}
          isAdmin={isAdmin}
          onRefreshProfile={fetchProfileAndConfig}
          onOpenShop={() => setIsShopOpen(true)}
          onBackToMap={() => setCurrentView('map')}
          onOpenAuth={onOpenAuth}
          onOpenCatSelection={() => setIsCatSelectionOpen(true)}
        />
      )}

      {currentView === 'fortune' && (
        <FortuneMinigame
          authToken={authToken}
          profile={profile}
          userBalance={userBalance}
          onBalanceUpdated={onBalanceUpdated}
          onRefreshProfile={fetchProfileAndConfig}
          onBackToMap={() => setCurrentView('map')}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* ================= MODALS ================= */}
      {/* 1. Town Inventory Modal */}
      <TownInventoryModal
        isOpen={isInventoryOpen}
        inventory={profile?.inventory || []}
        onClose={() => setIsInventoryOpen(false)}
      />

      {/* 2. Furniture Shop Modal */}
      <TownFurnitureShopModal
        isOpen={isShopOpen}
        catalog={config?.furnitureCatalog || []}
        userBalance={userBalance}
        authToken={authToken}
        onBuyItem={handleBuyShopItem}
        onClose={() => setIsShopOpen(false)}
        onOpenAuth={onOpenAuth}
      />

      {/* 3. Cat Selection & Naming Modal (Hiển thị lần đầu hoặc khi muốn đổi mèo) */}
      <CatSelectionModal
        isOpen={isCatSelectionOpen}
        currentCatId={profile?.cat?.avatarId || 'cat_02'}
        currentCatName={profile?.cat?.name || ''}
        isFirstTime={profile ? profile.hasChosenCat === false : true}
        onSelectCat={handleSelectCat}
        onClose={() => setIsCatSelectionOpen(false)}
      />
    </div>
  );
};
