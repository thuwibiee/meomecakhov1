import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CatTownUserProfile, CatTownConfig, CatTownPlacedItem } from '../../types.ts';
import { firebaseApi } from '../../firebase.ts';
import { XuCaIcon } from '../XuCaIcon.tsx';
import { PIXEL_WINDOW_IMAGE } from './pixelRoomAssets.ts';
import { getFurnitureAssetUrl, getCatalogByCategory, DEFAULT_FURNITURE_CATALOG } from './furnitureCatalog.ts';

interface CatHouseViewProps {
  authToken: string | null;
  profile: CatTownUserProfile | null;
  config: CatTownConfig | null;
  userBalance: number;
  isAdmin?: boolean;
  onRefreshProfile: () => void;
  onOpenShop: () => void;
  onBackToMap: () => void;
  onOpenAuth: () => void;
  onOpenCatSelection?: () => void;
}

// Chuyển đổi tọa độ cũ nếu có sang phần trăm (0 - 100) và chuẩn hóa rotation / scale
function normalizePlacedItemCoords(item: CatTownPlacedItem, index: number): CatTownPlacedItem {
  let x = typeof item.x === 'number' ? item.x : undefined;
  let y = typeof item.y === 'number' ? item.y : undefined;

  if (typeof x !== 'number' || typeof y !== 'number') {
    const gx = typeof item.gridX === 'number' ? item.gridX : (index % 5) + 1;
    const gy = typeof item.gridY === 'number' ? item.gridY : Math.floor(index / 5) + 1;
    x = Math.max(5, Math.min(85, Math.round(((gx - 1) / 4) * 70 + 15)));
    y = Math.max(10, Math.min(80, Math.round(((gy - 1) / 2) * 55 + 25)));
  }

  return {
    ...item,
    x,
    y,
    rotation: typeof item.rotation === 'number' ? item.rotation : 0,
    scale: typeof item.scale === 'number' ? Math.max(0.4, Math.min(2.5, item.scale)) : 1,
    customImageUrl: typeof item.customImageUrl === 'string' ? item.customImageUrl : undefined,
  };
}

export const CatHouseView: React.FC<CatHouseViewProps> = ({
  authToken,
  profile,
  config,
  userBalance,
  isAdmin = false,
  onRefreshProfile,
  onOpenShop,
  onBackToMap,
  onOpenAuth,
  onOpenCatSelection,
}) => {
  const [isEditingHouse, setIsEditingHouse] = useState<boolean>(false);
  const [placedItems, setPlacedItems] = useState<CatTownPlacedItem[]>(() => {
    const raw = profile?.house?.placedItems || [];
    return raw.map((item, idx) => normalizePlacedItemCoords(item, idx));
  });

  const [currentWallpaper, setCurrentWallpaper] = useState<string>(
    profile?.house?.wallpaper || '/assets/furniture/wallpapers/wall_01.png'
  );
  const [currentFloor, setCurrentFloor] = useState<string>(
    profile?.house?.floor || '/assets/furniture/floors/floor_01.png'
  );
  const [wallpaperMode, setWallpaperMode] = useState<'repeat' | 'cover'>(
    profile?.house?.wallpaperMode || 'repeat'
  );
  const [floorMode, setFloorMode] = useState<'repeat' | 'cover'>(
    profile?.house?.floorMode || 'repeat'
  );

  // Chỉ Admin mới được mặc định vào phòng khách để chỉnh sửa; người dùng thường mặc định mở Chăm Bé Mèo
  const [activeTab, setActiveTab] = useState<'cat' | 'house'>(isAdmin ? 'house' : 'cat');
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>(profile?.cat.name || '');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'furniture' | 'wallpaper' | 'floor'>('all');

  // Modal thay Tường / thay Sàn
  const [wallFloorModalType, setWallFloorModalType] = useState<'wallpaper' | 'floor' | null>(null);
  const [customWallFloorUrl, setCustomWallFloorUrl] = useState<string>('');

  // Selected item state & handles
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState<string | null>(null);
  const [customUrlText, setCustomUrlText] = useState<string>('');

  // Sàn tham chiếu cho Drag & Drop
  const floorRef = useRef<HTMLDivElement>(null);

  // Vị trí mèo trên sàn
  const [catPos, setCatPos] = useState<{ x: number; y: number }>(() => {
    if (profile?.house?.catPosition) return profile.house.catPosition;
    if (typeof profile?.house?.catX === 'number' && typeof profile?.house?.catY === 'number') {
      return { x: profile.house.catX, y: profile.house.catY };
    }
    return { x: 25, y: 55 };
  });

  const cat = profile?.cat;

  // Đồng bộ khi profile từ server/firebase thay đổi
  useEffect(() => {
    if (profile?.house) {
      if (profile.house.placedItems) {
        setPlacedItems(profile.house.placedItems.map((item, idx) => normalizePlacedItemCoords(item, idx)));
      }
      if (profile.house.wallpaper) setCurrentWallpaper(profile.house.wallpaper);
      if (profile.house.floor) setCurrentFloor(profile.house.floor);
      if (profile.house.wallpaperMode) setWallpaperMode(profile.house.wallpaperMode);
      if (profile.house.floorMode) setFloorMode(profile.house.floorMode);
      if (profile.house.catPosition) {
        setCatPos(profile.house.catPosition);
      } else if (typeof profile.house.catX === 'number' && typeof profile.house.catY === 'number') {
        setCatPos({ x: profile.house.catX, y: profile.house.catY });
      }
    }
  }, [profile?.house]);

  // Danh mục nội thất trong kho đồ người dùng
  const ownedFurniture = (profile?.inventory || []).filter(
    (item) => item.itemType === 'furniture' || item.itemType === 'toy'
  );

  // Danh sách mẫu giấy dán tường & sàn nhà từ catalog
  const catalogWallpapers = useMemo(() => {
    const list = getCatalogByCategory(config?.furnitureCatalog || DEFAULT_FURNITURE_CATALOG, 'wallpaper');
    return list.length > 0 ? list : DEFAULT_FURNITURE_CATALOG.filter((f) => f.category === 'wallpaper');
  }, [config?.furnitureCatalog]);

  const catalogFloors = useMemo(() => {
    const list = getCatalogByCategory(config?.furnitureCatalog || DEFAULT_FURNITURE_CATALOG, 'floor');
    return list.length > 0 ? list : DEFAULT_FURNITURE_CATALOG.filter((f) => f.category === 'floor');
  }, [config?.furnitureCatalog]);

  // Cập nhật thuộc tính transform (xoay, kích thước, ảnh tùy chỉnh) của món đồ
  const handleUpdateItemTransform = (
    id: string,
    updates: { rotation?: number; scale?: number; customImageUrl?: string }
  ) => {
    setPlacedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextRotation =
          typeof updates.rotation === 'number'
            ? updates.rotation
            : item.rotation || 0;
        const nextScale =
          typeof updates.scale === 'number'
            ? Math.max(0.4, Math.min(2.5, Number(updates.scale.toFixed(2))))
            : item.scale || 1;
        const nextCustomUrl =
          typeof updates.customImageUrl === 'string'
            ? updates.customImageUrl
            : item.customImageUrl;

        return {
          ...item,
          rotation: nextRotation,
          scale: nextScale,
          customImageUrl: nextCustomUrl,
        };
      })
    );
  };

  // Đặt món đồ mới từ kho vào phòng
  const handlePlaceItem = (furnitureId: string) => {
    const offset = (placedItems.length % 6) * 6;
    const newItem: CatTownPlacedItem = {
      id: `placed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      furnitureId,
      x: Math.max(10, Math.min(80, 42 + (offset - 15))),
      y: Math.max(15, Math.min(75, 45 + (offset - 15))),
      rotation: 0,
      scale: 1,
    };

    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    setActionFeedback('✓ Đã đặt vào phòng! Bấm vào món đồ để Xoay, Phóng to/Thu nhỏ hoặc Kéo thả.');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Thu hồi món đồ cất lại vào kho
  const handleRemovePlacedItem = (id: string) => {
    setPlacedItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
    setActionFeedback('✓ Đã thu hồi món đồ cất lại vào kho!');
    setTimeout(() => setActionFeedback(null), 2500);
  };

  // Kéo thả tự do không chia ô
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!isEditingHouse) return;
    e.preventDefault();
    e.stopPropagation();

    const floorEl = floorRef.current;
    if (!floorEl) return;
    const rect = floorEl.getBoundingClientRect();

    setDraggingId(id);
    setSelectedItemId(id);

    let startX = 0;
    let startY = 0;

    if (id === 'cat') {
      startX = catPos.x;
      startY = catPos.y;
    } else {
      const item = placedItems.find((p) => p.id === id);
      if (item) {
        startX = typeof item.x === 'number' ? item.x : 50;
        startY = typeof item.y === 'number' ? item.y : 50;
      }
    }

    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - startClientX;
      const dy = moveEvt.clientY - startClientY;
      const dxPct = (dx / rect.width) * 100;
      const dyPct = (dy / rect.height) * 100;

      if (id === 'cat') {
        const nextX = clamp(Math.round(startX + dxPct), 4, 94);
        const nextY = clamp(Math.round(startY + dyPct), 6, 92);
        setCatPos({ x: nextX, y: nextY });
      } else {
        const nextX = clamp(Math.round(startX + dxPct), 4, 94);
        const nextY = clamp(Math.round(startY + dyPct), 6, 92);
        setPlacedItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, x: nextX, y: nextY } : item))
        );
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setDraggingId(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Áp dụng mẫu giấy dán tường (Seamless Wall)
  const handleApplyWallpaperUrl = (url: string, name?: string) => {
    setCurrentWallpaper(url);
    setActionFeedback(`✓ Đã thay đổi giấy dán tường ${name ? `"${name}"` : ''} liền mạch toàn bộ phòng! ✨`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Áp dụng mẫu sàn nhà (Seamless Floor)
  const handleApplyFloorUrl = (url: string, name?: string) => {
    setCurrentFloor(url);
    setActionFeedback(`✓ Đã thay đổi sàn nhà ${name ? `"${name}"` : ''} liền mạch toàn bộ phòng! ✨`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Lưu bố cục phòng & transform đồ đạc lên Server/Firebase
  const handleSaveHouseLayout = async () => {
    if (!authToken) return;
    setIsSaving(true);
    try {
      const res = await firebaseApi('/api/cat-town/house/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          wallpaper: currentWallpaper,
          floor: currentFloor,
          wallpaperMode,
          floorMode,
          placedItems,
          catPosition: catPos,
          catX: catPos.x,
          catY: catPos.y,
        }),
      });

      if (res.ok) {
        setIsEditingHouse(false);
        setSelectedItemId(null);
        setActionFeedback('✓ Đã lưu bố cục liền mạch & kích thước, góc xoay đồ vật thành công!');
        onRefreshProfile();
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Chăm sóc bé mèo
  const handleCatCare = async (actionType: 'feed' | 'pet' | 'play' | 'bath') => {
    if (!authToken) {
      onOpenAuth();
      return;
    }

    try {
      const res = await firebaseApi('/api/cat-town/action/cat/care', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ actionType }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionFeedback(data.message);
        onRefreshProfile();
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Đổi tên bé mèo
  const handleRenameCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !newName.trim()) return;

    try {
      const res = await firebaseApi('/api/cat-town/action/cat/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (res.ok) {
        setShowRenameModal(false);
        onRefreshProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tìm món đồ đang được chọn
  const selectedPlacedItem = placedItems.find((p) => p.id === selectedItemId);
  const selectedFurnitureCatalogItem = selectedPlacedItem
    ? DEFAULT_FURNITURE_CATALOG.find((f) => f.id === selectedPlacedItem.furnitureId)
    : null;

  return (
    <div
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Top Header Controls */}
      <div className="w-full bg-[#FFF9F4] border-4 border-[#795653] rounded-none p-3 mb-4 flex items-center justify-between shadow-[4px_4px_0px_#795653]">
        <button
          onClick={onBackToMap}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FFE5EC] text-[#795653] font-black text-xs rounded-none border-2 border-[#795653] shadow-[2px_2px_0px_#795653] cursor-pointer active:translate-y-0.5"
          style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
        >
          <span>←</span>
          <span>BẢN ĐỒ THỊ TRẤN</span>
        </button>

        {/* Tab switch between Cat Care & House Room (House Room is locked for non-admin) */}
        <div className="flex bg-[#FFE5EC] p-1 rounded-none border-2 border-[#795653]">
          <button
            onClick={() => {
              if (!isAdmin) {
                setActionFeedback('🔒 Chức năng "Phòng Khách Mèo Cưng" đang tạm khóa bảo trì.');
                setTimeout(() => setActionFeedback(null), 4000);
                return;
              }
              setActiveTab('house');
            }}
            className={`px-3 py-1 text-xs font-black transition-all cursor-pointer rounded-none flex items-center gap-1.5 ${
              activeTab === 'house'
                ? 'bg-white text-[#D6336C] shadow-[1px_1px_0px_#795653]'
                : 'text-[#795653]/70 hover:text-[#795653]'
            } ${!isAdmin ? 'opacity-85' : ''}`}
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            <span style={{ fontFamily: "'Tiny5', monospace" }}>{isAdmin ? '🏡' : '🔒'}</span>
            <span style={{ fontFamily: "'Tiny5', monospace" }}>PHÒNG KHÁCH MÈO CƯNG</span>
            {isAdmin ? (
              <span className="text-[9px] px-1 py-0.2 bg-[#D6336C] text-white font-bold ml-1" style={{ fontFamily: "'Tiny5', monospace" }}>
                ADMIN ONLY
              </span>
            ) : (
              <span className="text-[9px] px-1 py-0.2 bg-[#795653]/20 text-[#795653] font-bold ml-1" style={{ fontFamily: "'Tiny5', monospace" }}>
                TẠM KHÓA
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('cat')}
            className={`px-3 py-1 text-xs font-black transition-all cursor-pointer rounded-none ${
              activeTab === 'cat'
                ? 'bg-white text-[#D6336C] shadow-[1px_1px_0px_#795653]'
                : 'text-[#795653]/70 hover:text-[#795653]'
            }`}
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            <span style={{ fontFamily: "'Tiny5', monospace" }}>🐱 CHĂM BÉ MÈO</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#795653] rounded-none shadow-[2px_2px_0px_#795653]">
          <XuCaIcon className="w-4 h-4 object-contain inline-block" />
          <span
            className="text-xs font-black text-[#0A5EB0] tabular-nums"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            {userBalance.toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {actionFeedback && (
        <div className="w-full mb-3 p-3 rounded-none bg-[#FFE5EC] border-3 border-[#FF8FAB] text-[#795653] font-bold text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <span>💖 {actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-[#D6336C] font-black cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ================= NẾU USER KHÔNG PHẢI ADMIN MÀ TRUY CẬP PHÒNG KHÁCH ================= */}
      {activeTab === 'house' && !isAdmin && (
        <div className="w-full bg-[#FFF9F4] border-4 border-[#795653] rounded-none p-6 sm:p-8 shadow-[6px_6px_0px_#795653] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#FFE5EC] border-3 border-[#795653] flex items-center justify-center text-3xl shadow-[3px_3px_0px_#795653] mb-3 animate-bounce">
            🔒
          </div>
          <div
            className="px-3 py-1 bg-[#F7DDA0] border-2 border-[#795653] text-[11px] font-black text-[#795653] mb-2"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            ⚡ CHỨC NĂNG ĐANG TẠM KHÓA BẢO TRÌ
          </div>
          <h3
            className="text-base sm:text-lg font-black text-[#D6336C]"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            PHÒNG KHÁCH MÈO CƯNG ĐANG TẠM KHÓA BẢO TRÌ
          </h3>
          <p
            className="text-xs text-[#795653]/85 font-semibold max-w-md mt-2 leading-relaxed"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            Chức năng "Phòng Khách Mèo Cưng" đang tạm khóa bảo trì. Bạn vẫn có thể ghé mục <strong>"🐱 CHĂM BÉ MÈO"</strong> để cho mèo ăn, vuốt ve và chơi đùa với bé mèo cưng nha!
          </p>
          <button
            onClick={() => setActiveTab('cat')}
            className="mt-5 px-6 py-2.5 bg-[#FF8FAB] hover:bg-[#ff7599] text-white font-black text-xs rounded-none border-3 border-[#795653] shadow-[3px_3px_0px_#795653] cursor-pointer flex items-center gap-2"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            <span>🐱</span>
            <span>CHUYỂN SANG MỤC CHĂM BÉ MÈO</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* ================= TAB 1: PHÒNG KHÁCH MÈO CƯNG (SEAMLESS 2D FLAT RPG ROOM - CHỈ HIỂN THỊ CHO ADMIN) ================= */}
      {activeTab === 'house' && isAdmin && (
        <div className="w-full bg-[#FFF9F4] border-4 border-[#795653] rounded-none p-4 sm:p-5 shadow-[6px_6px_0px_#795653] flex flex-col">
          {/* Admin editing mode banner */}
          <div
            className="mb-3 px-3 py-2 bg-[#F7DDA0] border-3 border-[#795653] text-[#795653] flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs font-black shadow-[2px_2px_0px_#795653]"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            <div className="flex items-center gap-2" style={{ fontFamily: "'Tiny5', monospace" }}>
              <span className="text-base" style={{ fontFamily: "'Tiny5', monospace" }}>👑</span>
              <span style={{ fontFamily: "'Tiny5', monospace" }}>CHẾ ĐỘ ADMIN: BẠN CÓ TOÀN QUYỀN THIẾT KẾ PHÒNG KHÁCH, XOAY, THU PHÓNG VÀ CHỈNH SỬA VẬT PHẨM!</span>
            </div>
            <span className="px-2 py-0.5 bg-[#D6336C] text-white text-[10px] font-bold shrink-0" style={{ fontFamily: "'Tiny5', monospace" }}>
              ADMIN ONLY
            </span>
          </div>

          {/* Room Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h3
                className="text-sm sm:text-base font-black text-[#795653]"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                PHÒNG KHÁCH MÈO CƯNG (NỀN LIỀN MẠCH & PHƯƠNG THẲNG 2D)
              </h3>
              <p
                className="text-[11px] text-[#795653]/75 font-bold"
                style={{ fontFamily: "'Tiny5', monospace", fontWeight: 'bold' }}
              >
                {isEditingHouse
                  ? '⚡ Bấm vào bất kỳ món đồ nào để mở Bảng điều khiển: Xoay, Phóng to/Thu nhỏ, Đổi link ảnh hoặc Thu hồi!'
                  : 'Không gian phòng khách nguyên khối mượt mà. Nhấn "BỐ TRÍ PHÒNG" để chỉnh sửa đồ vật.'}
              </p>
            </div>

            {/* Quick Action Buttons: THAY TƯỜNG, THAY SÀN, SHOP, BỐ TRÍ */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Nút THAY TƯỜNG */}
              <button
                onClick={() => setWallFloorModalType('wallpaper')}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#795653] font-black text-xs rounded-none border-3 border-[#795653] shadow-[3px_3px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                style={{ fontFamily: "'Tiny5', monospace" }}
                title="Thay đổi mẫu giấy dán tường liền mạch"
              >
                <span style={{ fontFamily: "'Tiny5', monospace" }}>🧱</span>
                <span style={{ fontFamily: "'Tiny5', monospace" }}>THAY TƯỜNG</span>
              </button>

              {/* Nút THAY SÀN */}
              <button
                onClick={() => setWallFloorModalType('floor')}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#795653] font-black text-xs rounded-none border-3 border-[#795653] shadow-[3px_3px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                style={{ fontFamily: "'Tiny5', monospace" }}
                title="Thay đổi mẫu sàn nhà liền mạch"
              >
                <span style={{ fontFamily: "'Tiny5', monospace" }}>🪵</span>
                <span style={{ fontFamily: "'Tiny5', monospace" }}>THAY SÀN</span>
              </button>

              <button
                onClick={onOpenShop}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-[#FF8FAB] hover:bg-[#f37898] text-white font-black text-xs rounded-none border-3 border-[#795653] shadow-[3px_3px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                <span style={{ fontFamily: "'Tiny5', monospace" }}>🛍️ SHOP</span>
              </button>

              {!isEditingHouse ? (
                <button
                  onClick={() => setIsEditingHouse(true)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#F7DDA0] hover:bg-[#f5cf80] text-[#795653] font-black text-xs rounded-none border-3 border-[#795653] shadow-[3px_3px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  <span style={{ fontFamily: "'Tiny5', monospace" }}>✏️ BỐ TRÍ PHÒNG</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveHouseLayout}
                  disabled={isSaving}
                  className="px-4 sm:px-5 py-1.5 sm:py-2 bg-[#06D6A0] hover:bg-[#05b587] text-[#1E3A8A] font-black text-xs rounded-none border-3 border-[#795653] shadow-[3px_3px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  <span style={{ fontFamily: "'Tiny5', monospace" }}>{isSaving ? 'ĐANG LƯU...' : '💾 LƯU BỐ CỤC'}</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEAMLESS 2D FLAT RPG ROOM CONTAINER (HOÀN TOÀN KHÔNG CÓ THẺ DIV CHIA Ô) */}
          {/* ========================================================================= */}
          <div className="w-full h-84 sm:h-96 md:h-[440px] rounded-none border-4 sm:border-6 border-[#795653] shadow-[6px_6px_0px_#795653] relative overflow-hidden flex flex-col select-none">
            {/* ================= 1. KHUNG TƯỜNG (MỘT THẺ DIV DUY NHẤT KÉO DÀI TỪ TRÁI SANG PHẢI) ================= */}
            <div
              className="w-full h-[35%] relative flex items-center justify-between px-6 z-0 overflow-hidden shrink-0"
              style={{
                backgroundColor: '#FFF1D0',
                backgroundImage: currentWallpaper ? `url(${currentWallpaper})` : 'none',
                backgroundRepeat: wallpaperMode === 'cover' ? 'no-repeat' : 'repeat',
                backgroundSize: wallpaperMode === 'cover' ? 'cover' : '96px 96px',
                backgroundPosition: 'center bottom',
                imageRendering: 'pixelated',
              }}
            >
              {/* Bảng tên dinh thự bé mèo (Gắn trên tường phẳng) */}
              <div className="px-3 py-1 bg-[#FFF9F4]/95 border-2 border-[#795653] shadow-[2px_2px_0px_#795653] flex items-center gap-1.5">
                <span className="text-xs">🐾</span>
                <span
                  className="text-[11px] sm:text-xs font-black text-[#D6336C]"
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  DINH THỰ {cat?.name ? cat.name.toUpperCase() : 'BÉ MÈO'}
                </span>
              </div>

              {/* Cửa sổ Pixel phương thẳng 2D phẳng */}
              <div className="flex flex-col items-center">
                <img
                  src={PIXEL_WINDOW_IMAGE}
                  alt="Cửa sổ pixel phương thẳng"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain pixelated filter drop-shadow-md"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>

            {/* ================= BASEBOARD: PHÀO CHỈ CHÂN TƯỜNG LIỀN MẠCH ================= */}
            <div className="w-full h-3 sm:h-3.5 bg-[#8B5E3C] border-t-2 border-[#5C3D2E] border-b-2 border-[#4A332D] shadow-xs shrink-0 z-10 flex items-center justify-around">
              <div className="w-full h-[1px] bg-[#DDB892]/40" />
            </div>

            {/* ================= 2. KHUNG SÀN (MỘT THẺ DIV DUY NHẤT KÉO DÀI TỪ TRÁI SANG PHẢI) ================= */}
            <div
              ref={floorRef}
              onClick={(e) => {
                if (e.target === floorRef.current) {
                  setSelectedItemId(null);
                  setShowCustomUrlInput(null);
                }
              }}
              className={`w-full h-[65%] relative flex-1 overflow-hidden select-none ${
                isEditingHouse ? 'cursor-default ring-inset ring-2 ring-[#FF8FAB]/40' : ''
              }`}
              style={{
                backgroundColor: '#E6C280',
                backgroundImage: currentFloor ? `url(${currentFloor})` : 'none',
                backgroundRepeat: floorMode === 'cover' ? 'no-repeat' : 'repeat',
                backgroundSize: floorMode === 'cover' ? 'cover' : '64px 64px',
                backgroundPosition: 'top left',
                imageRendering: 'pixelated',
              }}
            >
              {/* Edit Mode Helper Indicator */}
              {isEditingHouse && (
                <div className="absolute top-2 right-3 pointer-events-none z-10 px-2 py-1 bg-black/50 text-white text-[10px] font-black rounded-none border border-white/40">
                  ✏️ BẤM VÀO ĐỒ ĐẠC ĐỂ XOAY & THU PHÓNG | KÉO THẢ TỰ DO
                </div>
              )}

              {/* ================= BÉ MÈO CƯNG (GÓC NHÌN PHƯƠNG THẲNG 2D) ================= */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'cat')}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditingHouse) setSelectedItemId('cat');
                }}
                onMouseEnter={() => setHoveredItemId('cat')}
                onMouseLeave={() => setHoveredItemId(null)}
                style={{
                  left: `${catPos.x}%`,
                  top: `${catPos.y}%`,
                  zIndex: Math.floor(catPos.y) + 30,
                  transform: 'translate(-50%, -50%)',
                  touchAction: 'none',
                }}
                className={`absolute flex flex-col items-center select-none transition-shadow ${
                  isEditingHouse ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'pointer-events-none'
                } ${
                  isEditingHouse && selectedItemId === 'cat'
                    ? 'ring-2 ring-[#06D6A0] rounded-none bg-[#06D6A0]/15 p-1'
                    : ''
                }`}
              >
                <img
                  src={cat?.avatarUrl || '/assets/cats/cat_02.png'}
                  alt={cat?.name || 'Mèo cưng'}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain animate-cat-breathe pixelated"
                  style={{ imageRendering: 'pixelated' }}
                  draggable={false}
                />
                <div className="w-11 sm:w-12 h-2.5 bg-black/30 rounded-full blur-[0.6px] -mt-1.5 pointer-events-none" />
                <span
                  className="text-[9px] font-black text-[#795653] bg-white/95 px-1.5 py-0.5 border border-[#795653] rounded-none shadow-[1px_1px_0px_#795653] mt-0.5 pointer-events-none"
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  {cat?.name || 'Bé Mèo'}
                </span>
              </div>

              {/* ================= TẤT CẢ ĐỒ VẬT NỘI THẤT (PHƯƠNG THẲNG 2D, RESIZE & ROTATE) ================= */}
              {placedItems
                .filter((placed) => {
                  const assetUrl = placed.customImageUrl || getFurnitureAssetUrl(placed.furnitureId);
                  return Boolean(
                    assetUrl &&
                      (assetUrl.startsWith('/assets/furniture/') ||
                        assetUrl.startsWith('http://') ||
                        assetUrl.startsWith('https://'))
                  );
                })
                .map((placed) => {
                  const posX = typeof placed.x === 'number' ? placed.x : 50;
                  const posY = typeof placed.y === 'number' ? placed.y : 50;
                  const rotation = typeof placed.rotation === 'number' ? placed.rotation : 0;
                  const scale = typeof placed.scale === 'number' ? placed.scale : 1;
                  const assetUrl = placed.customImageUrl || getFurnitureAssetUrl(placed.furnitureId);
                  const isSelected = selectedItemId === placed.id;
                  const isHovered = hoveredItemId === placed.id;
                  const isItemDragging = draggingId === placed.id;

                  // 2.5D Depth Sorting: món đồ ở vị trí Y thấp hơn sẽ nằm ở lớp trước
                  const zIndex = isItemDragging ? 9999 : (isSelected ? 9990 : Math.floor(posY) + 10);
                  const catalogItem = DEFAULT_FURNITURE_CATALOG.find((f) => f.id === placed.furnitureId);

                  return (
                    <div
                      key={placed.id}
                      onPointerDown={(e) => handlePointerDown(e, placed.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditingHouse) {
                          setSelectedItemId(placed.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredItemId(placed.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                      style={{
                        left: `${posX}%`,
                        top: `${posY}%`,
                        zIndex,
                        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
                        transformOrigin: 'center center',
                        touchAction: 'none',
                      }}
                      className={`absolute flex flex-col items-center select-none group transition-all duration-75 ${
                        isEditingHouse ? 'cursor-grab active:cursor-grabbing' : ''
                      } ${
                        isEditingHouse && isSelected
                          ? 'ring-2 ring-dashed ring-[#FF8FAB] ring-offset-2 ring-offset-transparent'
                          : ''
                      }`}
                    >
                      {/* Bốn điểm neo (corner handles) hiển thị khi chọn đồ vật */}
                      {isEditingHouse && isSelected && (
                        <>
                          <div className="absolute -top-1.5 -left-1.5 w-2 h-2 bg-white border border-[#795653] shadow-xs pointer-events-none" />
                          <div className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-white border border-[#795653] shadow-xs pointer-events-none" />
                          <div className="absolute -bottom-1.5 -left-1.5 w-2 h-2 bg-white border border-[#795653] shadow-xs pointer-events-none" />
                          <div className="absolute -bottom-1.5 -right-1.5 w-2 h-2 bg-white border border-[#795653] shadow-xs pointer-events-none" />
                        </>
                      )}

                      {/* Đồ vật góc nhìn Phương thẳng (Front-facing / 2D phẳng) */}
                      <img
                        src={assetUrl}
                        alt={catalogItem?.name || placed.furnitureId}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain pixelated pointer-events-none drop-shadow-sm select-none"
                        style={{ imageRendering: 'pixelated' }}
                        draggable={false}
                      />

                      {/* Bóng đổ chân đồ vật */}
                      <div className="w-11 sm:w-14 h-2 bg-black/25 rounded-full blur-[0.6px] -mt-1 pointer-events-none" />

                      {/* ========================================================================= */}
                      {/* BẢNG ĐIỀU KHIỂN ĐỒ VẬT (MINI CONTROL PANEL: ROTATE, RESIZE, DELETE, URL)  */}
                      {/* ========================================================================= */}
                      {isEditingHouse && isSelected && !isItemDragging && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            // Đảo chiều transform ngược lại để Bảng điều khiển không bị xoay/phóng theo đồ vật
                            transform: `rotate(${-rotation}deg) scale(${1 / scale})`,
                            transformOrigin: 'bottom center',
                            imageRendering: 'pixelated',
                            fontFamily: "'Tiny5 Duo', 'Tiny5', monospace",
                          }}
                          className={`absolute ${
                            posY > 30 ? 'bottom-full mb-3' : 'top-full mt-3'
                          } left-1/2 -translate-x-1/2 z-[10000] bg-[#FFF9F4] border-3 border-[#795653] shadow-[4px_4px_0px_#795653] p-2.5 rounded-none flex flex-col gap-2 min-w-[240px] max-w-[290px]`}
                        >
                          {/* Header Bảng điều khiển */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-[#795653]/30">
                            <span className="text-[11px] font-black text-[#795653] truncate max-w-[190px]">
                              ⚙️ {catalogItem?.name || placed.furnitureId}
                            </span>
                            <button
                              onClick={() => setSelectedItemId(null)}
                              className="text-[10px] px-1.5 py-0.2 bg-white border border-[#795653] text-[#795653] hover:bg-[#FFE5EC] cursor-pointer"
                              title="Đóng bảng điều khiển"
                            >
                              ✕
                            </button>
                          </div>

                          {/* 1. TÍNH NĂNG XOAY (ROTATE) */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] font-black text-[#795653]">
                              <span>🔄 XOAY GÓC:</span>
                              <span className="text-[#D6336C] tabular-nums font-bold">
                                {rotation}°
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  handleUpdateItemTransform(placed.id, {
                                    rotation: ((rotation - 15 + 360) % 360),
                                  })
                                }
                                className="px-1.5 py-0.5 bg-white hover:bg-[#FFE5EC] border border-[#795653] text-[9px] font-black shadow-[1px_1px_0px_#795653] active:translate-y-0.5 cursor-pointer"
                                title="Xoay trái 15°"
                              >
                                ⟲ -15°
                              </button>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="5"
                                value={rotation}
                                onChange={(e) =>
                                  handleUpdateItemTransform(placed.id, {
                                    rotation: Number(e.target.value),
                                  })
                                }
                                className="flex-1 h-2 accent-[#D6336C] cursor-pointer"
                              />
                              <button
                                onClick={() =>
                                  handleUpdateItemTransform(placed.id, {
                                    rotation: ((rotation + 15) % 360),
                                  })
                                }
                                className="px-1.5 py-0.5 bg-white hover:bg-[#FFE5EC] border border-[#795653] text-[9px] font-black shadow-[1px_1px_0px_#795653] active:translate-y-0.5 cursor-pointer"
                                title="Xoay phải 15°"
                              >
                                ⟳ +15°
                              </button>
                              <button
                                onClick={() => handleUpdateItemTransform(placed.id, { rotation: 0 })}
                                className="px-1 py-0.5 bg-white hover:bg-gray-100 border border-[#795653] text-[8px] font-black cursor-pointer"
                                title="Đặt lại góc 0°"
                              >
                                0°
                              </button>
                            </div>
                          </div>

                          {/* 2. TÍNH NĂNG PHÓNG TO / THU NHỎ (RESIZE / SCALE) */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] font-black text-[#795653]">
                              <span>🔍 KÍCH THƯỚC:</span>
                              <span className="text-[#0A5EB0] tabular-nums font-bold">
                                {Math.round(scale * 100)}% ({scale}x)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  handleUpdateItemTransform(placed.id, {
                                    scale: Math.max(0.4, Number((scale - 0.1).toFixed(2))),
                                  })
                                }
                                className="w-5 h-5 bg-white hover:bg-[#FFE5EC] border border-[#795653] text-[10px] font-black flex items-center justify-center shadow-[1px_1px_0px_#795653] active:translate-y-0.5 cursor-pointer"
                                title="Thu nhỏ -10%"
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min="0.4"
                                max="2.5"
                                step="0.05"
                                value={scale}
                                onChange={(e) =>
                                  handleUpdateItemTransform(placed.id, {
                                    scale: Number(e.target.value),
                                  })
                                }
                                className="flex-1 h-2 accent-[#0A5EB0] cursor-pointer"
                              />
                              <button
                                onClick={() =>
                                  handleUpdateItemTransform(placed.id, {
                                    scale: Math.min(2.5, Number((scale + 0.1).toFixed(2))),
                                  })
                                }
                                className="w-5 h-5 bg-white hover:bg-[#FFE5EC] border border-[#795653] text-[10px] font-black flex items-center justify-center shadow-[1px_1px_0px_#795653] active:translate-y-0.5 cursor-pointer"
                                title="Phóng to +10%"
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleUpdateItemTransform(placed.id, { scale: 1 })}
                                className="px-1 py-0.5 bg-white hover:bg-gray-100 border border-[#795653] text-[8px] font-black cursor-pointer"
                                title="Đặt lại kích thước chuẩn 100%"
                              >
                                1x
                              </button>
                            </div>
                          </div>

                          {/* 3. TÍNH NĂNG XÓA (DELETE / THU HỒI) & DÁN LINK ẢNH PHẲNG 2D TỰ CHỌN */}
                          <div className="flex items-center justify-between pt-1 border-t border-[#795653]/30 gap-1.5">
                            <button
                              onClick={() => {
                                setShowCustomUrlInput(
                                  showCustomUrlInput === placed.id ? null : placed.id
                                );
                                setCustomUrlText(placed.customImageUrl || '');
                              }}
                              className="flex-1 py-1 px-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#795653] text-[9px] font-black border border-[#795653] rounded-none shadow-[1px_1px_0px_#795653] cursor-pointer flex items-center justify-center gap-1"
                              title="Dán link ảnh phương thẳng 2D của bạn"
                            >
                              <span>🖼️</span>
                              <span>Dán Link Ảnh 2D</span>
                            </button>

                            <button
                              onClick={() => handleRemovePlacedItem(placed.id)}
                              className="py-1 px-2.5 bg-[#E63946] hover:bg-[#D62828] text-white text-[9px] font-black border border-[#795653] rounded-none shadow-[1px_1px_0px_#795653] active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                              title="Cất món này lại vào kho đồ"
                            >
                              <span>🗑️</span>
                              <span>Thu Hồi</span>
                            </button>
                          </div>

                          {/* Dropdown nhập URL ảnh 2D tùy chỉnh */}
                          {showCustomUrlInput === placed.id && (
                            <div className="pt-1.5 border-t border-dashed border-[#795653]/40 flex flex-col gap-1">
                              <span className="text-[8px] text-[#795653]/80 font-bold">
                                Dán link ảnh phẳng 2D chuẩn của bạn (PNG):
                              </span>
                              <div className="flex gap-1">
                                <input
                                  type="url"
                                  value={customUrlText}
                                  onChange={(e) => setCustomUrlText(e.target.value)}
                                  placeholder="https://.../do_vat_2d.png"
                                  className="flex-1 px-1.5 py-0.5 text-[9px] bg-white border border-[#795653] rounded-none font-mono"
                                />
                                <button
                                  onClick={() => {
                                    handleUpdateItemTransform(placed.id, {
                                      customImageUrl: customUrlText.trim() || undefined,
                                    });
                                    setShowCustomUrlInput(null);
                                    setActionFeedback('✓ Đã cập nhật link ảnh 2D phương thẳng cho món đồ!');
                                    setTimeout(() => setActionFeedback(null), 3000);
                                  }}
                                  className="px-2 py-0.5 bg-[#06D6A0] text-[#1E3A8A] text-[9px] font-black border border-[#795653] rounded-none cursor-pointer"
                                >
                                  LƯU
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Mũi tên chỉ vào món đồ */}
                          <div
                            className={`absolute ${
                              posY > 30
                                ? '-bottom-2 border-t-[8px] border-t-[#795653]'
                                : '-top-2 border-b-[8px] border-b-[#795653]'
                            } left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KHAY KHO ĐỒ NỘI THẤT DƯỚI CÙNG (KHI Ở CHẾ ĐỘ BỐ TRÍ PHÒNG)                 */}
          {/* ========================================================================= */}
          {isEditingHouse && (
            <div className="mt-4 p-3.5 bg-white border-3 sm:border-4 border-[#795653] rounded-none shadow-[4px_4px_0px_#795653]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b-2 border-[#795653]/20">
                <div>
                  <h4
                    className="text-xs sm:text-sm font-black text-[#795653]"
                    style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                  >
                    📦 KHO ĐỒ NỘI THẤT CỦA BẠN (BẤM ĐỂ TRANG TRÍ):
                  </h4>
                  <p className="text-[10px] text-[#795653]/70 font-semibold">
                    Đồ đạc: bấm "+ ĐẶT VÀO" rồi kéo thả & xoay/thu phóng | Giấy tường & Sàn: bấm DÁN TƯỜNG / LÁT SÀN để áp dụng liền mạch!
                  </p>
                </div>

                {/* Filter tags in tray */}
                <div className="flex items-center gap-1">
                  {(['all', 'furniture', 'wallpaper', 'floor'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setInventoryFilter(mode)}
                      className={`px-2 py-0.5 text-[10px] font-black border-2 border-[#795653] rounded-none cursor-pointer ${
                        inventoryFilter === mode
                          ? 'bg-[#FF8FAB] text-white shadow-[1px_1px_0px_#795653]'
                          : 'bg-[#FFF9F4] text-[#795653] hover:bg-[#FFE5EC]'
                      }`}
                      style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                    >
                      {mode === 'all'
                        ? 'Tất cả'
                        : mode === 'furniture'
                        ? 'Đồ đạc'
                        : mode === 'wallpaper'
                        ? 'Giấy tường'
                        : 'Sàn nhà'}
                    </button>
                  ))}
                </div>
              </div>

              {ownedFurniture.length === 0 ? (
                <div className="text-xs text-[#795653]/60 italic py-3 text-center">
                  Bạn chưa sở hữu món nội thất nào trong túi đồ. Hãy bấm nút "🛍️ SHOP" để sắm sửa nhé!
                </div>
              ) : (
                <div className="flex gap-2.5 overflow-x-auto pb-2">
                  {ownedFurniture
                    .filter((item) => {
                      const assetUrl = getFurnitureAssetUrl(item.itemId);
                      if (
                        !assetUrl ||
                        (!assetUrl.startsWith('/assets/furniture/') &&
                          !assetUrl.startsWith('http://') &&
                          !assetUrl.startsWith('https://'))
                      ) {
                        return false;
                      }

                      const isWall = item.itemId.startsWith('wall_') || item.details?.category === 'wallpaper';
                      const isFl = item.itemId.startsWith('floor_') || item.details?.category === 'floor';
                      if (inventoryFilter === 'wallpaper') return isWall;
                      if (inventoryFilter === 'floor') return isFl;
                      if (inventoryFilter === 'furniture') return !isWall && !isFl;
                      return true;
                    })
                    .map((furn) => {
                      const isWall = furn.itemId.startsWith('wall_') || furn.details?.category === 'wallpaper';
                      const isFl = furn.itemId.startsWith('floor_') || furn.details?.category === 'floor';
                      const assetUrl = getFurnitureAssetUrl(furn.itemId);

                      return (
                        <div
                          key={furn.id}
                          className="p-2 bg-[#FFF9F4] hover:bg-[#FFE5EC] border-2 border-[#795653] rounded-none shadow-[2px_2px_0px_#795653] flex flex-col items-center gap-1.5 min-w-[84px] shrink-0"
                        >
                          {/* Image preview */}
                          <div className="w-10 h-10 flex items-center justify-center bg-white border border-[#795653]/40 p-0.5">
                            <img
                              src={assetUrl}
                              alt={furn.name}
                              className="w-full h-full object-contain pixelated"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>

                          <span className="text-[10px] font-black text-[#795653] truncate max-w-[76px] text-center">
                            {furn.name}
                          </span>

                          {/* Quick Action Button based on category */}
                          {isWall ? (
                            <button
                              onClick={() => handleApplyWallpaperUrl(assetUrl, furn.name)}
                              className="w-full py-1 bg-[#D6336C] hover:bg-[#b02253] text-white text-[9px] font-black border border-[#795653] rounded-none shadow-[1px_1px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                              style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                            >
                              🧱 DÁN TƯỜNG
                            </button>
                          ) : isFl ? (
                            <button
                              onClick={() => handleApplyFloorUrl(assetUrl, furn.name)}
                              className="w-full py-1 bg-[#BC6C25] hover:bg-[#99541a] text-white text-[9px] font-black border border-[#795653] rounded-none shadow-[1px_1px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                              style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                            >
                              🪵 LÁT SÀN
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePlaceItem(furn.itemId)}
                              className="w-full py-1 bg-[#06D6A0] hover:bg-[#05b587] text-[#1E3A8A] text-[9px] font-black border border-[#795653] rounded-none shadow-[1px_1px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                              style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                            >
                              + ĐẶT VÀO
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: CHĂM BÉ MÈO ================= */}
      {activeTab === 'cat' && cat && (
        <div className="w-full bg-[#FFF9F4] border-4 border-[#795653] rounded-none p-5 sm:p-6 shadow-[6px_6px_0px_#795653] flex flex-col md:flex-row items-center gap-6">
          {/* Left: Animated Cat & Room Spot */}
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 bg-[#FFE5EC] border-4 border-[#795653] rounded-none shadow-[4px_4px_0px_#795653] flex flex-col items-center justify-center p-4 overflow-hidden">
              <div className="absolute top-2 right-3 text-xs animate-pulse">💖</div>
              <div className="absolute top-4 left-3 text-xs animate-bounce">✨</div>

              {/* Cat sprite with breathing idle animation & drop shadow */}
              <div className="relative flex flex-col items-center my-auto">
                <img
                  src={cat.avatarUrl || '/assets/cats/cat_02.png'}
                  alt={cat.name}
                  className="w-28 h-28 object-contain animate-cat-breathe relative z-10 select-none pixelated"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/30 rounded-full blur-[0.5px] z-0" />
              </div>

              {/* Wooden Cushion Platform */}
              <div className="w-28 h-5 bg-[#FF8FAB] border-2 border-[#795653] rounded-none shadow-[2px_2px_0px_#795653] -mt-1 flex items-center justify-center relative z-20">
              </div>
            </div>

            {/* Cat Name & Breed */}
            <div className="mt-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <h3
                  className="text-base font-black text-[#D6336C]"
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  {cat.name}
                </h3>
                <button
                  onClick={() => setShowRenameModal(true)}
                  title="Đổi tên bé mèo"
                  className="px-1.5 py-0.5 bg-white border border-[#795653]/30 rounded-none text-[10px] font-bold hover:bg-[#FFE5EC] cursor-pointer"
                >
                  ✏️
                </button>
              </div>
              <span
                className="text-xs font-bold text-[#795653]/70"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                {cat.breed} • Ngày nhận nuôi: {cat.bornDate}
              </span>

              {onOpenCatSelection && (
                <div className="mt-2">
                  <button
                    onClick={onOpenCatSelection}
                    className="px-3 py-1 bg-[#FFE5EC] hover:bg-[#FFB3C6] border-2 border-[#795653] rounded-none text-[11px] font-black text-[#D6336C] cursor-pointer shadow-[2px_2px_0px_#795653] flex items-center gap-1.5 mx-auto"
                    style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                  >
                    <span>🐾</span>
                    <span>ĐỔI BÉ MÈO / ĐỔI TÊN</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats & Care Actions */}
          <div className="flex-1 w-full space-y-4">
            <div className="space-y-2.5 bg-white p-4 rounded-none border-2 border-[#795653] shadow-[2px_2px_0px_#795653]">
              <h4
                className="text-xs font-black text-[#795653] uppercase"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                Chỉ Số Hạnh Phúc Của Bé
              </h4>

              <div>
                <div
                  className="flex justify-between text-[11px] font-bold text-[#795653] mb-0.5"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  <span style={{ fontFamily: "'Tiny5', monospace", fontWeight: 'normal' }}>Vui vẻ:</span>
                  <span className="font-black text-[#D6336C]">{cat.happiness}/100</span>
                </div>
                <div className="w-full h-3 bg-[#E5E7EB] rounded-none border border-[#795653]/30 overflow-hidden">
                  <div className="h-full bg-[#FF8FAB] transition-all" style={{ width: `${cat.happiness}%` }} />
                </div>
              </div>

              <div>
                <div
                  className="flex justify-between text-[11px] font-bold text-[#795653] mb-0.5"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  <span style={{ fontFamily: "'Tiny5', monospace", fontWeight: 'normal' }}>Năng lượng:</span>
                  <span className="font-black text-[#F7B801]">{cat.energy}/100</span>
                </div>
                <div className="w-full h-3 bg-[#E5E7EB] rounded-none border border-[#795653]/30 overflow-hidden">
                  <div className="h-full bg-[#F7DDA0] transition-all" style={{ width: `${cat.energy}%` }} />
                </div>
              </div>

              <div>
                <div
                  className="flex justify-between text-[11px] font-bold text-[#795653] mb-0.5"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  <span style={{ fontFamily: "'Tiny5', monospace", fontWeight: 'normal' }}>Thân thiết:</span>
                  <span className="font-black text-[#7209B7]">{cat.affection}/100</span>
                </div>
                <div className="w-full h-3 bg-[#E5E7EB] rounded-none border border-[#795653]/30 overflow-hidden">
                  <div className="h-full bg-[#CDB4DB] transition-all" style={{ width: `${cat.affection}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleCatCare('feed')}
                className="p-3 bg-[#FFE5EC] hover:bg-[#FFCCD5] active:translate-y-0.5 border-2 border-[#795653] rounded-none shadow-[2px_2px_0px_#795653] flex flex-col items-center gap-1 cursor-pointer"
              >
                <span className="text-xl">🥣</span>
                <span
                  className="text-[11px] font-black text-[#795653]"
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  CHO ĂN
                </span>
              </button>

              <button
                onClick={() => handleCatCare('pet')}
                className="p-3 bg-[#FFC2D1] hover:bg-[#ffaec2] active:translate-y-0.5 border-2 border-[#795653] rounded-none shadow-[2px_2px_0px_#795653] flex flex-col items-center gap-1 cursor-pointer"
              >
                <span className="text-xl">🫳</span>
                <span
                  className="text-[11px] font-black text-[#795653]"
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  VUỐT VE
                </span>
              </button>

              <button
                onClick={() => handleCatCare('play')}
                className="p-3 bg-[#F7DDA0] hover:bg-[#f5cf80] active:translate-y-0.5 border-2 border-[#795653] rounded-none shadow-[2px_2px_0px_#795653] flex flex-col items-center gap-1 cursor-pointer"
              >
                <span className="text-xl">🧶</span>
                <span
                  className="text-[11px] font-black text-[#795653]"
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  CHƠI ĐÙA
                </span>
              </button>

              <button
                onClick={() => handleCatCare('bath')}
                className="p-3 bg-[#A9C5F2] hover:bg-[#92b3e8] active:translate-y-0.5 border-2 border-[#795653] rounded-none shadow-[2px_2px_0px_#795653] flex flex-col items-center gap-1 cursor-pointer"
              >
                <span className="text-xl">🧼</span>
                <span
                  className="text-[11px] font-black text-[#1E3A8A]"
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  TẮM RỬA
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BỘ SƯU TẬP THAY TƯỜNG HOẶC THAY SÀN LIỀN MẠCH                      */}
      {/* ========================================================================= */}
      {wallFloorModalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#795653]/60 backdrop-blur-xs select-none"
          onClick={() => setWallFloorModalType(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#FFF9F4] rounded-none border-4 sm:border-6 border-[#795653] shadow-[8px_8px_0px_#795653] flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ imageRendering: 'pixelated' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-[#FFE5EC] border-b-4 border-[#795653]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{wallFloorModalType === 'wallpaper' ? '🧱' : '🪵'}</span>
                <div>
                  <h3
                    className="text-xs sm:text-sm font-black text-[#795653]"
                    style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                  >
                    {wallFloorModalType === 'wallpaper'
                      ? 'BỘ SƯU TẬP GIẤY DÁN TƯỜNG (SEAMLESS WALL)'
                      : 'BỘ SƯU TẬP SÀN NHÀ (SEAMLESS FLOOR)'}
                  </h3>
                  <p className="text-[10px] text-[#795653]/70 font-semibold">
                    Áp dụng nền nguyên khối liền mạch mượt mà, không bị chia ô
                  </p>
                </div>
              </div>

              <button
                onClick={() => setWallFloorModalType(null)}
                className="w-8 h-8 rounded-none bg-white hover:bg-[#FF8FAB] text-[#795653] hover:text-white border-2 border-[#795653] font-black text-xs flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#795653]"
              >
                ✕
              </button>
            </div>

            {/* Mode selection toggle: Repeat vs Cover */}
            <div className="px-4 py-2.5 bg-[#FFF3E0] border-b-2 border-[#795653]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span
                className="text-[11px] font-black text-[#795653]"
                style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
              >
                Chế độ hiển thị nền:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (wallFloorModalType === 'wallpaper') setWallpaperMode('repeat');
                    else setFloorMode('repeat');
                  }}
                  className={`px-3 py-1 text-[10px] font-black border-2 border-[#795653] rounded-none cursor-pointer ${
                    (wallFloorModalType === 'wallpaper' ? wallpaperMode : floorMode) === 'repeat'
                      ? 'bg-[#FF8FAB] text-white shadow-[2px_2px_0px_#795653]'
                      : 'bg-white text-[#795653]'
                  }`}
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  🔁 LẶP HOA VĂN (REPEAT - KHUYÊN DÙNG)
                </button>
                <button
                  onClick={() => {
                    if (wallFloorModalType === 'wallpaper') setWallpaperMode('cover');
                    else setFloorMode('cover');
                  }}
                  className={`px-3 py-1 text-[10px] font-black border-2 border-[#795653] rounded-none cursor-pointer ${
                    (wallFloorModalType === 'wallpaper' ? wallpaperMode : floorMode) === 'cover'
                      ? 'bg-[#FF8FAB] text-white shadow-[2px_2px_0px_#795653]'
                      : 'bg-white text-[#795653]'
                  }`}
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  🖼️ PHỦ KÍN (COVER)
                </button>
              </div>
            </div>

            {/* List of Patterns */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(wallFloorModalType === 'wallpaper' ? catalogWallpapers : catalogFloors).map((pattern) => {
                const url = pattern.imageUrl || getFurnitureAssetUrl(pattern.id);
                const isSelected =
                  wallFloorModalType === 'wallpaper'
                    ? currentWallpaper === url
                    : currentFloor === url;

                return (
                  <div
                    key={pattern.id}
                    onClick={() => {
                      if (wallFloorModalType === 'wallpaper') {
                        handleApplyWallpaperUrl(url, pattern.name);
                      } else {
                        handleApplyFloorUrl(url, pattern.name);
                      }
                    }}
                    className={`p-2.5 bg-white border-3 cursor-pointer rounded-none transition-all flex flex-col items-center gap-2 hover:-translate-y-0.5 ${
                      isSelected
                        ? 'border-[#06D6A0] bg-[#06D6A0]/10 shadow-[3px_3px_0px_#06D6A0]'
                        : 'border-[#795653] shadow-[3px_3px_0px_#795653] hover:shadow-[4px_4px_0px_#795653]'
                    }`}
                  >
                    {/* Pattern Preview Box */}
                    <div
                      className="w-full h-20 border-2 border-[#795653] shadow-inner"
                      style={{
                        backgroundImage: `url(${url})`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: '40px 40px',
                        imageRendering: 'pixelated',
                      }}
                    />

                    <div className="text-center w-full">
                      <span
                        className="text-[11px] font-black text-[#795653] block truncate"
                        style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                      >
                        {pattern.name}
                      </span>
                      <span className="text-[9px] text-[#795653]/70 font-semibold block">
                        {isSelected ? '✓ Đang áp dụng' : 'Bấm để áp dụng'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom URL Input Footer */}
            <div className="p-3 bg-[#FFF3E0] border-t-3 border-[#795653] flex flex-col sm:flex-row items-center gap-2">
              <span
                className="text-[10px] font-black text-[#795653] shrink-0"
                style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
              >
                🌐 Hoặc dán Link URL ảnh họa tiết tùy chỉnh:
              </span>
              <div className="flex w-full sm:flex-1 gap-1.5">
                <input
                  type="url"
                  value={customWallFloorUrl}
                  onChange={(e) => setCustomWallFloorUrl(e.target.value)}
                  placeholder="https://.../hoa_van_seamless.png"
                  className="flex-1 px-2 py-1 text-xs bg-white border-2 border-[#795653] rounded-none font-mono"
                />
                <button
                  onClick={() => {
                    if (!customWallFloorUrl.trim()) return;
                    if (wallFloorModalType === 'wallpaper') {
                      handleApplyWallpaperUrl(customWallFloorUrl.trim(), 'Tùy chỉnh');
                    } else {
                      handleApplyFloorUrl(customWallFloorUrl.trim(), 'Tùy chỉnh');
                    }
                    setCustomWallFloorUrl('');
                    setWallFloorModalType(null);
                  }}
                  className="px-3 py-1 bg-[#06D6A0] text-[#1E3A8A] text-xs font-black border-2 border-[#795653] rounded-none shadow-[2px_2px_0px_#795653] active:translate-y-0.5 cursor-pointer shrink-0"
                  style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                >
                  ÁP DỤNG LINK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/50 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-[#FFF9F4] rounded-none border-4 border-[#795653] p-6 shadow-[6px_6px_0px_#795653]">
            <h3
              className="text-sm font-black text-[#D6336C] mb-2"
              style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
            >
              ĐỔI TÊN CHO BÉ MÈO
            </h3>
            <form onSubmit={handleRenameCat} className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={30}
                placeholder="Nhập tên mới đáng yêu..."
                className="w-full px-3 py-2 bg-white rounded-none border-2 border-[#795653] text-xs font-bold text-[#795653]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="flex-1 py-2 bg-white border-2 border-[#795653] rounded-none text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#FF8FAB] text-white border-2 border-[#795653] rounded-none text-xs font-black cursor-pointer shadow-[2px_2px_0px_#795653]"
                >
                  Lưu Tên Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
