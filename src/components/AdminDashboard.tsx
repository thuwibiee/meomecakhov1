import React, { useState, useEffect } from 'react';
import { Character, RedeemCode, GachaConfig, Feedback, AdminAuditLog, Complaint, CharacterFeedback, SpecialOrder, LoyaltyCardConfig, LoyaltyCompletionLog, CHARACTER_CATEGORIES } from '../types.ts';
import { firebaseApi } from '../firebase.ts';
import { ShieldCheck, Plus, Edit, Users, Gift, Dices, MessageSquare, History, Check, AlertCircle, AlertTriangle, MessageSquareHeart, Trash2, CheckCircle2, FileText, ToggleLeft, ToggleRight, Sparkles, RefreshCw, Search } from 'lucide-react';
import { FISH_DATABASE, FishDatabaseItem, getRarityConfig, normalizeFishCatalog } from './cat-town/fishDatabase.ts';
import { getFurnitureAssetUrl } from './cat-town/furnitureCatalog.ts';
import { XuCaIcon } from './XuCaIcon.tsx';

interface AdminDashboardProps {
  authToken: string;
  onClose: () => void;
  onRefreshCharacters: () => void;
  onUpdateCharacters?: (characters: Character[]) => void;
  initialEditingCharacter?: Character | null;
  onOpenSecretaryReport?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  authToken,
  onClose,
  onRefreshCharacters,
  onUpdateCharacters,
  initialEditingCharacter,
  onOpenSecretaryReport,
}) => {
  const [tab, setTab] = useState<'characters' | 'special_orders' | 'wallet' | 'loyalty' | 'cat_town' | 'gacha' | 'complaints' | 'fitbach' | 'feedbacks' | 'logs'>('characters');
  const [stats, setStats] = useState<any>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [gachaConfig, setGachaConfig] = useState<GachaConfig | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [characterFeedbacks, setCharacterFeedbacks] = useState<CharacterFeedback[]>([]);
  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Loyalty Card Admin State
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyCardConfig>({ isEnabled: true, rewardCoins: 50 });
  const [loyaltyLogs, setLoyaltyLogs] = useState<LoyaltyCompletionLog[]>([]);
  const [isSavingLoyalty, setIsSavingLoyalty] = useState(false);
  const [loyaltyFeedback, setLoyaltyFeedback] = useState<string | null>(null);

  // Cat Town Admin State
  const [catTownStats, setCatTownStats] = useState<any>(null);
  const [catTownConfig, setCatTownConfig] = useState<any>(null);
  const [isSavingCatTown, setIsSavingCatTown] = useState(false);
  const [catTownFeedback, setCatTownFeedback] = useState<string | null>(null);

  // Fish Database Admin Editor State (Hồ Bong Bóng)
  const [editingFish, setEditingFish] = useState<any | null>(null);
  const [editingFishOriginalId, setEditingFishOriginalId] = useState<string>('');
  const [isCreatingFish, setIsCreatingFish] = useState(false);
  const [fishFeedback, setFishFeedback] = useState<string | null>(null);
  const [fishFilterRarity, setFishFilterRarity] = useState<string>('all');
  const [fishSearchTerm, setFishSearchTerm] = useState<string>('');

  // Furniture Admin State
  const [adminFurnCategory, setAdminFurnCategory] = useState<string>('all');
  const [adminFurnSearch, setAdminFurnSearch] = useState<string>('');
  const [isSavingFurniture, setIsSavingFurniture] = useState<boolean>(false);
  const [furnitureFeedback, setFurnitureFeedback] = useState<string | null>(null);
  const [isAddingFurniture, setIsAddingFurniture] = useState<boolean>(false);
  const [newFurnName, setNewFurnName] = useState<string>('');
  const [newFurnCategory, setNewFurnCategory] = useState<'bed' | 'sofa' | 'wallpaper' | 'floor' | 'decor'>('decor');
  const [newFurnPrice, setNewFurnPrice] = useState<number>(30);
  const [newFurnImageUrl, setNewFurnImageUrl] = useState<string>('');
  const [newFurnDesc, setNewFurnDesc] = useState<string>('');

  // Character Form state
  const [editingChar, setEditingChar] = useState<Partial<Character> | null>(initialEditingCharacter || null);
  const [charTagsInput, setCharTagsInput] = useState<string>(
    initialEditingCharacter && Array.isArray(initialEditingCharacter.tags)
      ? initialEditingCharacter.tags.join(', ')
      : ''
  );
  const [charError, setCharError] = useState<string | null>(null);
  const [charSuccess, setCharSuccess] = useState<string | null>(null);
  const [isSavingChar, setIsSavingChar] = useState<boolean>(false);
  const [deletingCharTarget, setDeletingCharTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingChar, setIsDeletingChar] = useState<boolean>(false);
  const [deleteCharError, setDeleteCharError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEditingCharacter) {
      setTab('characters');
      setEditingChar({
        ...initialEditingCharacter,
        category: initialEditingCharacter.category === 'khô hai nắng' ? 'khô cá hai nắng' : initialEditingCharacter.category,
      });
      setCharTagsInput(Array.isArray(initialEditingCharacter.tags) ? initialEditingCharacter.tags.join(', ') : '');
      setCharError(null);
      setCharSuccess(null);
    }
  }, [initialEditingCharacter]);

  // Balance adjustment state
  const [targetUsername, setTargetUsername] = useState('');
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustFeedback, setAdjustFeedback] = useState<string | null>(null);

  // New giftcode form state
  const [newCode, setNewCode] = useState('');
  const [newReward, setNewReward] = useState<number>(50);
  const [newMaxUses, setNewMaxUses] = useState<number>(500);

  // Complaints filter
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const fetchDashboardData = async () => {
    try {
      const res = await firebaseApi(`/api/admin/dashboard?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setCharacters(data.characters || []);
        if (data.characters && onUpdateCharacters) {
          onUpdateCharacters(data.characters);
        }
        setUsers(data.users || []);
        setRedeemCodes(data.redeemCodes || []);
        setGachaConfig(data.gachaConfig || null);
        setFeedbacks(data.feedbacks || []);
        setComplaints(data.complaints || []);
        setCharacterFeedbacks(data.characterFeedbacks || []);
        setSpecialOrders(data.specialOrders || []);
        setAuditLogs(data.auditLogs || []);
        if (data.loyaltyConfig) setLoyaltyConfig(data.loyaltyConfig);
        if (data.loyaltyLogs) setLoyaltyLogs(data.loyaltyLogs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [authToken]);

  // Save Loyalty Config
  const handleSaveLoyaltyConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLoyalty(true);
    setLoyaltyFeedback(null);
    try {
      const res = await firebaseApi('/api/admin/loyalty-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(loyaltyConfig),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu cấu hình.');
      setLoyaltyFeedback('✓ Cập nhật cấu hình Dấu Chân Khách Quen thành công!');
      fetchDashboardData();
    } catch (err: any) {
      setLoyaltyFeedback(`Lỗi: ${err.message}`);
    } finally {
      setIsSavingLoyalty(false);
    }
  };

  // Fetch Cat Town stats & config
  const fetchCatTownData = async () => {
    try {
      const res = await firebaseApi('/api/admin/cat-town/stats', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCatTownStats(data);
        setCatTownConfig(data.config);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Cat Town Config
  const handleSaveCatTownConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catTownConfig) return;
    setIsSavingCatTown(true);
    setCatTownFeedback(null);

    try {
      const res = await firebaseApi('/api/admin/cat-town/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(catTownConfig),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu cấu hình');
      setCatTownFeedback('✓ Đã cập nhật cấu hình Thị Trấn Cá Mèo thành công!');
      fetchCatTownData();
    } catch (err: any) {
      setCatTownFeedback(`Lỗi: ${err.message}`);
    } finally {
      setIsSavingCatTown(false);
    }
  };

  // Open Fish Add Modal
  const handleOpenAddFish = () => {
    const rawCatalog: any[] = (catTownConfig?.fishCatalog && catTownConfig.fishCatalog.length > 0)
      ? catTownConfig.fishCatalog
      : FISH_DATABASE;
    const fishList = normalizeFishCatalog(rawCatalog);
    let nextNum = fishList.length + 1;
    let autoId = `fish_${String(nextNum).padStart(2, '0')}`;
    while (fishList.some((f) => f.id === autoId)) {
      nextNum++;
      autoId = `fish_${String(nextNum).padStart(2, '0')}`;
    }

    setEditingFish({
      id: autoId,
      name: '',
      rarity: 'COMMON',
      rewardCoins: 30,
      xuReward: 30,
      dropRate: 5,
      weightMin: 200,
      weightMax: 500,
      imageSrc: '',
      image: '',
      description: '',
      color: '#795653',
      iconType: 'custom_fish',
    });
    setEditingFishOriginalId(autoId);
    setIsCreatingFish(true);
    setFishFeedback(null);
  };

  // Open Fish Edit Modal
  const handleOpenEditFish = (fish: any) => {
    const currentId = fish.id || '';
    setEditingFish({
      ...fish,
      id: currentId,
      rewardCoins: fish.rewardCoins ?? fish.xuReward ?? 30,
      xuReward: fish.rewardCoins ?? fish.xuReward ?? 30,
      imageSrc: fish.imageSrc || fish.image || '',
      image: fish.imageSrc || fish.image || '',
      dropRate: fish.dropRate ?? 10,
      weightMin: fish.weightMin ?? 150,
      weightMax: fish.weightMax ?? 450,
      description: fish.description || '',
    });
    setEditingFishOriginalId(currentId);
    setIsCreatingFish(false);
    setFishFeedback(null);
  };

  // Save Fish Data (Add or Edit)
  const handleSaveFish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFish) return;

    const newId = (editingFish.id || '').trim();
    if (!newId) {
      setFishFeedback('Vui lòng nhập Mã loài cá (ID).');
      return;
    }

    if (!editingFish.name || !editingFish.name.trim()) {
      setFishFeedback('Vui lòng nhập tên loài cá.');
      return;
    }

    const currentCatalog: any[] = (catTownConfig?.fishCatalog && catTownConfig.fishCatalog.length > 0)
      ? [...catTownConfig.fishCatalog]
      : [...FISH_DATABASE];

    const normalizedReward = Number(editingFish.rewardCoins ?? editingFish.xuReward ?? 30);
    const normalizedDropRate = Number(editingFish.dropRate ?? 5);
    const normalizedMin = Number(editingFish.weightMin ?? 150);
    const normalizedMax = Number(editingFish.weightMax ?? 450);
    const normalizedImg = (editingFish.imageSrc || editingFish.image || '').trim();

    const fishData = {
      ...editingFish,
      id: newId,
      name: editingFish.name.trim(),
      rarity: String(editingFish.rarity || 'COMMON').toUpperCase(),
      rewardCoins: normalizedReward,
      xuReward: normalizedReward,
      dropRate: normalizedDropRate,
      weightMin: normalizedMin,
      weightMax: normalizedMax,
      imageSrc: normalizedImg,
      image: normalizedImg,
      description: (editingFish.description || '').trim(),
    };

    let updatedCatalog: any[];
    if (isCreatingFish) {
      if (currentCatalog.some((f) => f.id === newId)) {
        setFishFeedback(`Mã cá "${newId}" đã tồn tại! Vui lòng chọn mã ID khác.`);
        return;
      }
      updatedCatalog = [...currentCatalog, fishData];
    } else {
      if (newId !== editingFishOriginalId && currentCatalog.some((f) => f.id === newId)) {
        setFishFeedback(`Mã cá mới "${newId}" đã bị trùng với loài cá khác trong hồ!`);
        return;
      }
      updatedCatalog = currentCatalog.map((f) => (f.id === editingFishOriginalId ? fishData : f));
    }

    const updatedConfig = {
      ...(catTownConfig || {}),
      fishCatalog: updatedCatalog,
    };

    setIsSavingCatTown(true);
    setFishFeedback(null);

    try {
      const res = await firebaseApi('/api/admin/cat-town/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedConfig),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu thông tin cá');

      setCatTownConfig(updatedConfig);
      setFishFeedback(`✓ Đã lưu loài cá "${fishData.name}" (${fishData.id}) thành công!`);
      setTimeout(() => {
        setEditingFish(null);
        setFishFeedback(null);
      }, 700);
      fetchCatTownData();
    } catch (err: any) {
      setFishFeedback(`Lỗi: ${err.message}`);
    } finally {
      setIsSavingCatTown(false);
    }
  };

  // Delete Fish
  const handleDeleteFish = async (fishId: string, fishName: string) => {
    if (!confirm(`Bà có chắc muốn xóa loài cá "${fishName}" (Mã: ${fishId}) khỏi Hồ Bong Bóng không?`)) return;

    const currentCatalog: any[] = (catTownConfig?.fishCatalog && catTownConfig.fishCatalog.length > 0)
      ? [...catTownConfig.fishCatalog]
      : [...FISH_DATABASE];

    if (currentCatalog.length <= 1) {
      alert('Hồ Bong Bóng phải có ít nhất 1 loài cá!');
      return;
    }

    const updatedCatalog = currentCatalog.filter((f) => f.id !== fishId);
    const updatedConfig = {
      ...(catTownConfig || {}),
      fishCatalog: updatedCatalog,
    };

    setIsSavingCatTown(true);
    try {
      const res = await firebaseApi('/api/admin/cat-town/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedConfig),
      });
      if (res.ok) {
        setCatTownConfig(updatedConfig);
        fetchCatTownData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingCatTown(false);
    }
  };

  // Reset to Default 11 Fishes
  const handleResetDefaultFish = async () => {
    if (!confirm('Khôi phục danh mục về 11 giống cá gốc chuẩn của Hồ Bong Bóng?')) return;
    const updatedConfig = {
      ...(catTownConfig || {}),
      fishCatalog: FISH_DATABASE,
    };

    setIsSavingCatTown(true);
    try {
      const res = await firebaseApi('/api/admin/cat-town/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedConfig),
      });
      if (res.ok) {
        setCatTownConfig(updatedConfig);
        fetchCatTownData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingCatTown(false);
    }
  };

  // Update Special Order Status
  const handleUpdateSpecialOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await firebaseApi(`/api/admin/special-orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to normalize URL
  const normalizeUrl = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // Save Character
  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setCharError(null);
    setCharSuccess(null);

    const charName = (editingChar?.name || '').trim();
    const rawStudioLink = (editingChar?.studioUrl || '').trim();
    const studioLink = rawStudioLink ? (normalizeUrl(rawStudioLink) || rawStudioLink) : '';
    // If explicitly marked as isComingSoon OR has no studioLink, set isComingSoon: true
    const isComingSoon = editingChar?.isComingSoon !== undefined
      ? Boolean(editingChar.isComingSoon)
      : (!studioLink);
    const priceVal = editingChar?.price;
    const numericPrice = Number(priceVal);

    if (!charName) {
      setCharError('Vui lòng nhập Họ và tên cho nhân vật.');
      return;
    }
    if (priceVal === undefined || priceVal === null || isNaN(numericPrice) || numericPrice < 0) {
      setCharError('Vui lòng nhập giá bán hợp lệ (từ 0 Xu Cá trở lên).');
      return;
    }

    const parsedTags = charTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      ...editingChar,
      name: charName,
      price: numericPrice,
      tags: parsedTags,
      studioUrl: studioLink,
      isComingSoon: Boolean(isComingSoon),
      isBestSeller: Boolean(editingChar?.isBestSeller),
      avatarUrl: normalizeUrl(editingChar?.avatarUrl),
      receiptAvatarUrl: normalizeUrl(editingChar?.receiptAvatarUrl),
    };

    setIsSavingChar(true);

    try {
      const res = await firebaseApi('/api/admin/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCharSuccess('✓ Đã lưu thông tin nhân vật thành công!');
        if (data.characters) {
          setCharacters(data.characters);
          try {
            localStorage.setItem('meome_characters_cache', JSON.stringify(data.characters));
          } catch (e) {}
          if (onUpdateCharacters) {
            onUpdateCharacters(data.characters);
          }
        }
        fetchDashboardData();
        onRefreshCharacters();
        setTimeout(() => {
          setEditingChar(null);
          setCharSuccess(null);
        }, 800);
      } else {
        setCharError(data.error || 'Không thể lưu nhân vật. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      console.error(err);
      setCharError(err.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsSavingChar(false);
    }
  };

  // Request Delete Character (Opens in-app confirmation modal)
  const handleDeleteCharacter = (charId: string, charName: string) => {
    setDeletingCharTarget({ id: charId, name: charName });
  };

  // Execute deletion confirmed by user
  const handleConfirmDeleteCharacter = async () => {
    if (!deletingCharTarget || isDeletingChar) return;
    const { id: charId, name: charName } = deletingCharTarget;
    setIsDeletingChar(true);

    try {
      const res = await firebaseApi(`/api/admin/characters/${charId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.characters) {
          setCharacters(data.characters);
          try {
            localStorage.setItem('meome_characters_cache', JSON.stringify(data.characters));
          } catch (e) {}
          if (onUpdateCharacters) {
            onUpdateCharacters(data.characters);
          }
        } else {
          setCharacters((prev) => prev.filter((c) => c.id !== charId));
        }
        if (editingChar?.id === charId) {
          setEditingChar(null);
        }
        setDeletingCharTarget(null);
        fetchDashboardData();
        onRefreshCharacters();
      } else {
        alert(data.error || 'Xóa nhân vật thất bại.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi kết nối xóa nhân vật.');
    } finally {
      setIsDeletingChar(false);
    }
  };

  // Adjust User Balance
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustFeedback(null);
    if (!targetUsername || !adjustAmount) return;

    try {
      const res = await firebaseApi('/api/admin/users/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          targetUsername,
          amount: adjustAmount,
          reason: adjustReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdjustFeedback(`Đã cập nhật số dư cho @${data.targetUsername}: Số dư mới là ${data.updatedBalance} Xu.`);
        setTargetUsername('');
        setAdjustReason('');
        fetchDashboardData();
      } else {
        setAdjustFeedback(data.error || 'Thao tác thất bại.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Giftcode
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newReward) return;

    try {
      const res = await firebaseApi('/api/admin/redeem-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          code: newCode,
          rewardCoins: newReward,
          maxUses: newMaxUses,
        }),
      });
      if (res.ok) {
        setNewCode('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Complaint Status
  const handleToggleComplaintStatus = async (complaintId: string, currentStatus: 'pending' | 'resolved') => {
    const nextStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
    try {
      const res = await firebaseApi(`/api/admin/complaints/${complaintId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Character Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Quý khách có chắc muốn xóa bình luận này không?')) return;
    try {
      const res = await firebaseApi(`/api/admin/character-comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingComplaintsCount = complaints.filter((c) => c.status === 'pending').length;
  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'pending') return c.status === 'pending';
    if (complaintFilter === 'resolved') return c.status === 'resolved';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFF9F4] p-5 sm:p-6 rounded-3xl border-2 border-[#795653]/30 shadow-kawaii flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F7DDA0] text-[#795653] flex items-center justify-center font-bold text-xl border border-[#795653]/20 shadow-xs">
            👑
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#795653]">
              Ban Quản Trị Tiệm Cá (Admin Dashboard)
            </h2>
            <p className="text-xs text-[#795653]/70">
              Phân quyền bảo mật máy chủ RBAC. Quản lý nhân vật, xu cá, báo lỗi complain và fít bách.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenSecretaryReport && (
            <button
              type="button"
              onClick={onOpenSecretaryReport}
              className="py-2 px-3.5 rounded-xl bg-[#FFE5EC] hover:bg-[#FFCCD5] border border-[#FF8FAB]/60 text-[#A6536A] text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Mở Báo Cáo & To-Do List của Thư Ký Mèo"
            >
              <span>🐾</span>
              <span>Thư Ký Mèo</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-[#795653]/30 hover:bg-[#795653]/10 text-xs font-bold cursor-pointer"
          >
            Quay lại Tiệm Cá
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#FFF9F4] border border-[#795653]/20">
            <span className="text-[11px] font-bold text-[#795653]/60">Tổng người dùng</span>
            <div className="text-xl font-black text-[#795653] mt-1 tabular-nums">{stats.totalUsers}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FFF9F4] border border-[#795653]/20">
            <span className="text-[11px] font-bold text-[#795653]/60">Nam chính mở bán</span>
            <div className="text-xl font-black text-[#795653] mt-1 tabular-nums">{stats.totalCharacters}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FFF9F4] border border-[#795653]/20">
            <span className="text-[11px] font-bold text-[#795653]/60">Đơn mua cá thành công</span>
            <div className="text-xl font-black text-[#A6536A] mt-1 tabular-nums">{stats.totalOrders}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FFF9F4] border border-[#795653]/20">
            <span className="text-[11px] font-bold text-[#795653]/60">Báo lỗi chưa xử lý</span>
            <div className="text-xl font-black text-amber-600 mt-1 tabular-nums">{pendingComplaintsCount}</div>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex p-1 bg-[#795653]/10 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setTab('characters')}
          className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            tab === 'characters' ? 'bg-[#F6A6B8] text-[#795653] shadow-xs' : 'text-[#795653]/70 hover:text-[#795653]'
          }`}
        >
          🧑‍🎨 Quản Lý Nhân Vật
        </button>
        <button
          onClick={() => setTab('special_orders')}
          className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            tab === 'special_orders' ? 'bg-[#F6A6B8] text-[#795653] shadow-xs' : 'text-[#795653]/70 hover:text-[#795653]'
          }`}
        >
          📝 Phiếu Đặt Cá ({specialOrders.length})
        </button>
        <button
          onClick={() => setTab('complaints')}
          className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            tab === 'complaints' ? 'bg-[#F6A6B8] text-[#795653] shadow-xs' : 'text-[#795653]/70 hover:text-[#795653]'
          }`}
        >
          <span>⚠️ Báo Lỗi / Complain</span>
          {pendingComplaintsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {pendingComplaintsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('fitbach')}
          className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            tab === 'fitbach' ? 'bg-[#F6A6B8] text-[#795653] shadow-xs' : 'text-[#795653]/70 hover:text-[#795653]'
          }`}
        >
          💬 Fít Bách ({characterFeedbacks.length})
        </button>
        <button
          onClick={() => setTab('wallet')}
          className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            tab === 'wallet' ? 'bg-[#F6A6B8] text-[#795653] shadow-xs' : 'text-[#795653]/70 hover:text-[#795653]'
          }`}
        >
          👛 Xu Cá & Giftcode
        </button>
        <button
          onClick={() => setTab('loyalty')}
          className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            tab === 'loyalty' ? 'bg-[#F6A6B8] text-[#795653] shadow-xs' : 'text-[#795653]/70 hover:text-[#795653]'
          }`}
        >
          <span>🐾 Dấu Chân Khách Quen</span>
        </button>
        <button
          onClick={() => {
            setTab('cat_town');
            fetchCatTownData();
          }}
          className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            tab === 'cat_town' ? 'bg-[#F6A6B8] text-[#795653] shadow-xs' : 'text-[#795653]/70 hover:text-[#795653]'
          }`}
        >
          <span>🏘️ Thị Trấn Cá Mèo</span>
        </button>
        <button
          onClick={() => setTab('feedbacks')}
          className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            tab === 'feedbacks' ? 'bg-[#F6A6B8] text-[#795653] shadow-xs' : 'text-[#795653]/70 hover:text-[#795653]'
          }`}
        >
          💌 Hộp Thư Góp Ý ({feedbacks.length})
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            tab === 'logs' ? 'bg-[#F6A6B8] text-[#795653] shadow-xs' : 'text-[#795653]/70 hover:text-[#795653]'
          }`}
        >
          🛡️ Nhật Ký Audit Logs
        </button>
      </div>

      {/* Tab 1: Characters Management */}
      {tab === 'characters' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-[#795653]">
              Danh sách nam chính trong tiệm
            </h3>
            <button
              onClick={() => {
                setEditingChar({ name: '', fishCode: `CK-${String(characters.length + 1).padStart(3, '0')}`, price: 30, age: 22, category: 'khô thượng phẩm', isAvailable: true, studioUrl: 'https://aistudio.google.com/prompt/', isComingSoon: false, isBestSeller: false, backstory: '', openScene: '', tags: ['ThơMộng', 'CáKhô'] });
                setCharTagsInput('ThơMộng, CáKhô');
                setCharError(null);
                setCharSuccess(null);
              }}
              className="py-2 px-4 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] text-[#795653] text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Nam Chính Mới</span>
            </button>
          </div>

          {/* Form Modal / Drawer */}
          {editingChar && (
            <div className="p-5 rounded-3xl bg-white border-2 border-[#795653]/30 shadow-md">
              <div className="flex items-center justify-between mb-3 border-b border-[#795653]/15 pb-2">
                <h4 className="text-sm font-black text-[#795653]">
                  {editingChar.id ? `Chỉnh sửa nhân vật: ${editingChar.name || ''}` : 'Thêm nhân vật mới'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditingChar(null);
                    setCharError(null);
                    setCharSuccess(null);
                  }}
                  className="text-xs text-[#795653]/60 hover:text-[#795653] font-bold cursor-pointer"
                >
                  ✕ Đóng
                </button>
              </div>

              {/* Error & Success Feedback Banners */}
              {charError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{charError}</span>
                </div>
              )}
              {charSuccess && (
                <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{charSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveCharacter} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-[#795653]">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Cố Diễn"
                      value={editingChar.name || ''}
                      onChange={(e) => setEditingChar({ ...editingChar, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#795653]">Mã cá khô (Mã cá)</label>
                    <input
                      type="text"
                      placeholder="VD: CK-001"
                      value={editingChar.fishCode || ''}
                      onChange={(e) => setEditingChar({ ...editingChar, fishCode: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs font-mono font-bold uppercase text-[#A6536A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#795653]">Tuổi</label>
                    <input
                      type="number"
                      value={editingChar.age || 20}
                      onChange={(e) => setEditingChar({ ...editingChar, age: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#795653]">
                      Thể loại (Category) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editingChar.category === 'khô hai nắng' ? 'khô cá hai nắng' : (editingChar.category || 'khô thượng phẩm')}
                      onChange={(e) => setEditingChar({ ...editingChar, category: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs bg-white text-[#795653] font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F6A6B8]"
                    >
                      {CHARACTER_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      {/* Hiển thị thể loại tùy chỉnh nếu có nhân vật đang dùng danh mục khác */}
                      {editingChar.category &&
                        editingChar.category !== 'khô hai nắng' &&
                        !CHARACTER_CATEGORIES.includes(editingChar.category as any) && (
                          <option value={editingChar.category}>
                            {editingChar.category} (Tùy chỉnh)
                          </option>
                        )}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#795653]">
                      Giá bán (Xu Cá) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingChar.price !== undefined ? editingChar.price : 30}
                      onChange={(e) => setEditingChar({ ...editingChar, price: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs font-bold text-[#526C91]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#795653] flex items-center justify-between">
                      <span>Link Google AI Studio ("Nhận Cá")</span>
                      <span className="text-[10px] text-amber-600 font-normal">(Không bắt buộc khi Đang ấp plot)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://aistudio.google.com/prompt/... (hoặc để trống nếu đang ấp plot)"
                      value={editingChar.studioUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingChar({
                          ...editingChar,
                          studioUrl: val,
                          ...(val.trim() && editingChar.isComingSoon ? { isComingSoon: false } : {}),
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs"
                    />
                  </div>
                </div>

                {/* Trạng thái hiển thị: Hoạt động (Có link chat) vs Đang ấp plot / Sắp ra mắt (Chưa có link) */}
                <div className="p-3.5 rounded-2xl bg-[#FFF9F4] border-2 border-[#795653]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="text-xs font-black text-[#795653] flex items-center gap-2">
                      <span>Trạng thái hiển thị:</span>
                      {editingChar.isComingSoon || !editingChar.studioUrl?.trim() ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300 flex items-center gap-1">
                          <span>🥚</span>
                          <span>Đang ấp plot / Sắp ra mắt</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-300 flex items-center gap-1">
                          <span>✓</span>
                          <span>Hoạt động (Có link chat)</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#795653]/70 mt-1">
                      Nếu chọn "Đang ấp plot", thẻ cá sẽ gắn nhãn <strong>COMING SOON ⏳</strong>, khách hàng được đọc lore/story nhưng không mua được cá.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingChar({ ...editingChar, isComingSoon: false })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !editingChar.isComingSoon && Boolean(editingChar.studioUrl?.trim())
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-white border border-[#795653]/25 text-[#795653]/70 hover:bg-slate-50'
                      }`}
                    >
                      ✓ Hoạt động
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingChar({ ...editingChar, isComingSoon: true })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        editingChar.isComingSoon || !editingChar.studioUrl?.trim()
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white border border-[#795653]/25 text-[#795653]/70 hover:bg-slate-50'
                      }`}
                    >
                      🥚 Đang ấp plot
                    </button>
                  </div>
                </div>

                {/* Huy hiệu Best-Seller (Điều chỉnh thủ công do Admin tự quyết) */}
                <div className="p-3.5 rounded-2xl bg-[#FFF9F4] border-2 border-[#FF758F]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="text-xs font-black text-[#795653] flex items-center gap-2">
                      <span>Huy hiệu Best-Seller:</span>
                      {editingChar.isBestSeller ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF4D6D] to-[#FF758F] text-white text-[11px] font-black border border-white shadow-2xs flex items-center gap-1">
                          <span>👑</span>
                          <span>BEST SELLER (BẬT)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-300">
                          Chưa gắn mác
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#795653]/70 mt-1">
                      Tính năng do Admin tự quyết định bằng tay (tuyệt đối không tự động tính theo lượt mua). Khi bật, thẻ cá sẽ có huy hiệu <strong>BEST SELLER</strong> nổi bật góc trên bên trái ảnh.
                    </p>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white px-3.5 py-2 rounded-xl border border-[#795653]/20 shadow-2xs hover:bg-[#FFE5EC]/30 transition-all shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(editingChar.isBestSeller)}
                      onChange={(e) => setEditingChar({ ...editingChar, isBestSeller: e.target.checked })}
                      className="w-4 h-4 rounded-md text-[#FF4D6D] focus:ring-[#FF758F] accent-[#FF4D6D] cursor-pointer"
                    />
                    <span className="text-xs font-extrabold text-[#795653]">
                      Gắn mác Best-Seller
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#795653]">Link ảnh Card (Chân dung chính)</label>
                    <input
                      type="text"
                      value={editingChar.avatarUrl || ''}
                      onChange={(e) => setEditingChar({ ...editingChar, avatarUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/... hoặc link ảnh bất kỳ"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#A6536A] flex items-center gap-1">
                      <span>💐 Link ảnh trên Receipt (Hóa đơn)</span>
                      <span className="text-[10px] text-[#795653]/60 font-normal">(Không liên quan ảnh card)</span>
                    </label>
                    <input
                      type="text"
                      value={editingChar.receiptAvatarUrl || ''}
                      onChange={(e) => setEditingChar({ ...editingChar, receiptAvatarUrl: e.target.value })}
                      placeholder="Để trống sẽ mặc định dùng ảnh Card..."
                      className="w-full px-3 py-1.5 rounded-lg border border-[#A6536A]/40 bg-[#FFF9F4] text-xs font-medium focus:ring-1 focus:ring-[#F6A6B8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#795653]">Giới thiệu ngắn (Short Bio)</label>
                  <textarea
                    rows={2}
                    value={editingChar.shortBio || ''}
                    onChange={(e) => setEditingChar({ ...editingChar, shortBio: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#795653]">Gắn Tags cho nhân vật (gõ phân cách bằng dấu phẩy)</label>
                    <span className="text-[10px] text-[#795653]/60 font-medium">Gõ phẩy tự do hoặc click ✕ trên thẻ tag để xóa nhanh</span>
                  </div>
                  <input
                    type="text"
                    placeholder="VD: ThơMộng, LạnhLùng, TổngTài, NiênHạ, CáKhô..."
                    value={charTagsInput}
                    onChange={(e) => setCharTagsInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#F6A6B8]"
                  />
                  {/* Tag preview chips with instant delete buttons */}
                  {charTagsInput.trim() && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {charTagsInput
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF9F4] text-[#A6536A] border border-[#F6A6B8]/50 text-[11px] font-bold shadow-2xs"
                          >
                            <span>#{tag.replace(/^#/, '')}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentTags = charTagsInput.split(',').map((t) => t.trim()).filter(Boolean);
                                const nextTags = currentTags.filter((_, i) => i !== idx);
                                setCharTagsInput(nextTags.join(', '));
                              }}
                              className="w-3.5 h-3.5 rounded-full hover:bg-rose-100 flex items-center justify-center text-rose-500 font-black cursor-pointer text-[10px]"
                              title="Xóa tag này"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-extrabold text-[#795653]">
                      Back-story (Cốt truyện chi tiết nhân vật)
                    </label>
                    <span className="text-[10px] text-[#795653]/60 font-medium">Khung nhập mở rộng cho phép kéo giãn & soạn thảo văn bản dài</span>
                  </div>
                  <textarea
                    rows={10}
                    placeholder="Bối cảnh thân thế, quá khứ, tính cách, thói quen, mối liên hệ với tiệm cá khô..."
                    value={editingChar.backstory || ''}
                    onChange={(e) => setEditingChar({ ...editingChar, backstory: e.target.value })}
                    className="w-full min-h-[200px] p-3 rounded-xl border border-[#795653]/30 text-xs font-medium leading-relaxed bg-[#FFF9F4]/40 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8] resize-y shadow-inner"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-extrabold text-[#795653]">
                      Open-scene (Kịch bản phân cảnh mở đầu)
                    </label>
                    <span className="text-[10px] text-[#795653]/60 font-medium">Kịch bản chi tiết để người dùng copy paste vào AI Studio</span>
                  </div>
                  <textarea
                    rows={10}
                    placeholder="Đoạn văn mở màn kịch bản, câu thoại đầu tiên, hành động mở đầu..."
                    value={editingChar.openScene || ''}
                    onChange={(e) => setEditingChar({ ...editingChar, openScene: e.target.value })}
                    className="w-full min-h-[200px] p-3 rounded-xl border border-[#795653]/30 text-xs font-medium leading-relaxed bg-[#FFF9F4]/40 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8] resize-y shadow-inner"
                  />
                </div>

                {/* Feedback Banner above action buttons */}
                {charError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{charError}</span>
                  </div>
                )}
                {charSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{charSuccess}</span>
                  </div>
                )}

                <div className="flex gap-2 justify-between items-center pt-2">
                  <div>
                    {editingChar.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCharacter(editingChar.id!, editingChar.name || 'nhân vật')}
                        className="py-1.5 px-3 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Nhân Vật Này</span>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingChar(null);
                        setCharError(null);
                        setCharSuccess(null);
                      }}
                      className="py-1.5 px-4 rounded-lg border border-[#795653]/20 hover:bg-[#795653]/10 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingChar}
                      className="py-2.5 px-6 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] active:scale-95 text-[#795653] text-xs font-black shadow-xs cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isSavingChar ? (
                        <>
                          <span className="inline-block w-3.5 h-3.5 border-2 border-[#795653] border-t-transparent rounded-full animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <span>Lưu Nhân Vật</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Characters Table */}
          <div className="bg-white rounded-3xl border border-[#795653]/20 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-[#795653]">
              <thead className="bg-[#FFF9F4] border-b border-[#795653]/15 font-black uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Nhân vật</th>
                  <th className="p-3">Mã cá</th>
                  <th className="p-3">Thể loại</th>
                  <th className="p-3">Giá</th>
                  <th className="p-3">Đã bán</th>
                  <th className="p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#795653]/10">
                {characters.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50/50">
                    <td className="p-3 flex items-center gap-2.5">
                      <img src={c.avatarUrl} alt="" className="w-8 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-bold flex items-center gap-1.5 flex-wrap">
                          <span>{c.name}</span>
                          {c.isBestSeller && (
                            <span className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-[#FF4D6D] to-[#FF758F] text-white text-[9px] font-black border border-white shadow-xs">
                              👑 Best-Seller
                            </span>
                          )}
                          {(c.isComingSoon || !c.studioUrl) ? (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                              Ấp plot 🥚
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              Hoạt động ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#795653]/60">{c.age} tuổi</div>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#A6536A]">{c.fishCode || 'CK-001'}</td>
                    <td className="p-3 font-semibold">{c.category}</td>
                    <td className="p-3 font-black text-[#526C91]">{c.price} Xu</td>
                    <td className="p-3 font-semibold">{c.salesCount || 0}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const normalizedCategory = c.category === 'khô hai nắng' ? 'khô cá hai nắng' : c.category;
                            setEditingChar({ ...c, category: normalizedCategory });
                            setCharTagsInput(Array.isArray(c.tags) ? c.tags.join(', ') : '');
                            setCharError(null);
                            setCharSuccess(null);
                          }}
                          className="p-1.5 rounded-lg border border-[#795653]/20 hover:bg-[#F6A6B8]/30 cursor-pointer"
                          title="Chỉnh sửa nhân vật"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#795653]" />
                        </button>
                        <button
                          onClick={() => handleDeleteCharacter(c.id, c.name)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 text-rose-600 cursor-pointer transition-colors"
                          title="Xóa nhân vật này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Complaints Management (Báo lỗi) */}
      {tab === 'complaints' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[#795653]">
                Quản Lý Báo Lỗi / Complain Nhân Vật
              </h3>
              <p className="text-xs text-[#795653]/70">
                Tiếp nhận phản hồi về link AI Studio, kịch bản hoặc lỗi hiển thị của các nam chính.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#795653]/10 p-1 rounded-xl">
              <button
                onClick={() => setComplaintFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  complaintFilter === 'all' ? 'bg-[#F6A6B8] text-[#795653]' : 'text-[#795653]/70'
                }`}
              >
                Tất cả ({complaints.length})
              </button>
              <button
                onClick={() => setComplaintFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  complaintFilter === 'pending' ? 'bg-amber-400 text-[#795653]' : 'text-[#795653]/70'
                }`}
              >
                Chưa xử lý ({pendingComplaintsCount})
              </button>
              <button
                onClick={() => setComplaintFilter('resolved')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  complaintFilter === 'resolved' ? 'bg-emerald-500 text-white' : 'text-[#795653]/70'
                }`}
              >
                Đã fix ({complaints.length - pendingComplaintsCount})
              </button>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="p-12 text-center bg-white/70 rounded-3xl border border-dashed border-[#795653]/20">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-xs font-bold text-[#795653]">Không có báo lỗi nào trong danh sách!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComplaints.map((comp) => {
                const isPending = comp.status === 'pending';
                return (
                  <div
                    key={comp.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#795653]/10 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-[#795653]">
                          {comp.characterName}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          {comp.issueType}
                        </span>
                        <span className="text-xs text-[#795653]/70">
                          báo bởi: <strong>@{comp.username}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] text-[#795653]/60">
                          {new Date(comp.createdAt).toLocaleString('vi-VN')}
                        </span>
                        <button
                          onClick={() => handleToggleComplaintStatus(comp.id, comp.status)}
                          className={`py-1 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-emerald-100 hover:text-emerald-900'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-amber-100 hover:text-amber-900'
                          }`}
                          title="Bấm để đổi trạng thái"
                        >
                          {isPending ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>CHƯA XỬ LÝ (ĐỔI SANG ĐÃ FIX)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ĐÃ FIX ✓</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#795653]/90 leading-relaxed font-medium whitespace-pre-line bg-[#FFF9F4] p-3 rounded-xl border border-[#795653]/10">
                      {comp.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Character Feedbacks (FÍT BÁCH) */}
      {tab === 'fitbach' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-[#795653]">
              Quản Lý Fít Bách / Bình Luận Về Nhân Vật
            </h3>
            <p className="text-xs text-[#795653]/70">
              Kiểm duyệt các đánh giá, cảm nghĩ độc giả để lại cho từng chàng cá khô. Xóa bình luận tiêu cực/spam.
            </p>
          </div>

          {characterFeedbacks.length === 0 ? (
            <div className="p-12 text-center bg-white/70 rounded-3xl border border-dashed border-[#795653]/20">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-xs font-bold text-[#795653]">Chưa có bình luận fít bách nào!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {characterFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#795653]">{fb.characterName}</span>
                      <span className="text-xs text-[#795653]/70">· Người gửi: <strong>@{fb.username}</strong></span>
                      <span className="text-amber-500 font-bold text-xs">
                        {'★'.repeat(fb.rating || 5)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#795653]/60">
                        {new Date(fb.createdAt).toLocaleString('vi-VN')}
                      </span>
                      <button
                        onClick={() => handleDeleteComment(fb.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa bình luận"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#795653]/90 leading-relaxed font-medium bg-[#FFF9F4] p-3 rounded-xl border border-[#795653]/10 whitespace-pre-line">
                    {fb.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Wallet & Giftcode */}
      {tab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adjust User Balance */}
          <div className="p-5 rounded-3xl bg-white border border-[#795653]/20 space-y-3 shadow-xs">
            <h4 className="text-sm font-black text-[#795653]">
              Điều chỉnh số dư Xu Cá cho người dùng
            </h4>
            {adjustFeedback && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                {adjustFeedback}
              </div>
            )}
            <form onSubmit={handleAdjustBalance} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#795653]">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: khach_yeu_ca"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#795653]">Số Xu thay đổi (+/-)</label>
                  <input
                    type="number"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#795653]">Lý do điều chỉnh</label>
                  <input
                    type="text"
                    placeholder="VD: Thưởng sự kiện Discord"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#A9C5F2] hover:bg-[#97b7e8] text-[#526C91] font-black text-xs cursor-pointer"
              >
                Xác Nhận Điều Chỉnh Số Dư
              </button>
            </form>
          </div>

          {/* Create Giftcode */}
          <div className="p-5 rounded-3xl bg-white border border-[#795653]/20 space-y-3 shadow-xs">
            <h4 className="text-sm font-black text-[#795653]">
              Phát hành Giftcode Xu Cá mới
            </h4>
            <form onSubmit={handleCreateCode} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#795653]">Mã Code (In hoa)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: BANMECA2026"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#795653]">Số Xu thưởng</label>
                  <input
                    type="number"
                    required
                    value={newReward}
                    onChange={(e) => setNewReward(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#795653]">Lượt dùng tối đa</label>
                  <input
                    type="number"
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#795653]/25 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] text-[#795653] font-black text-xs cursor-pointer"
              >
                Tạo Mã Giftcode
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Dấu Chân Khách Quen (Paw Loyalty Card) */}
      {tab === 'loyalty' && (
        <div className="space-y-6">
          {/* Header & KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs">
              <span className="text-[11px] font-bold text-[#795653]/60">Trạng thái tính năng</span>
              <div className="text-lg font-black mt-1 flex items-center gap-1.5">
                {loyaltyConfig.isEnabled ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> ĐANG BẬT
                  </span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> ĐANG TẮT
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs">
              <span className="text-[11px] font-bold text-[#795653]/60">Tổng lượt hoàn thành chu kỳ</span>
              <div className="text-xl font-black text-[#D81C63] mt-1 tabular-nums">
                {loyaltyLogs.length} chu kỳ
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs">
              <span className="text-[11px] font-bold text-[#795653]/60">Tổng Xu Cá đã phát thưởng</span>
              <div className="text-xl font-black text-[#0A5EB0] mt-1 tabular-nums">
                {loyaltyLogs.reduce((sum, l) => sum + (l.rewardCoins || 0), 0)} Xu
              </div>
            </div>
          </div>

          {/* Module Cấu Hình */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-[#795653]/20 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#795653]/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-2 bg-[#FFF9F4] rounded-2xl border border-[#795653]/15">🐾</span>
                <div>
                  <h3 className="text-base font-extrabold text-[#795653]" style={{ fontFamily: "'Cal Sans', sans-serif" }}>
                    Điều Chỉnh Mức Thưởng Xu Cá - Thẻ Tích Xu (Loyalty Card)
                  </h3>
                  <p className="text-xs text-[#795653]/70">
                    Cấu hình số lượng xu thưởng tự động trao cho người dùng khi đóng đủ 7/7 dấu chân điểm danh.
                  </p>
                </div>
              </div>
            </div>

            {loyaltyFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                  loyaltyFeedback.startsWith('✓')
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <span>{loyaltyFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveLoyaltyConfig} className="space-y-4 max-w-lg">
              {/* Toggle switch Bật / Tắt */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF9F4] border border-[#795653]/20">
                <div>
                  <label className="text-xs font-black text-[#795653] block">
                    Bật / Tắt Thẻ Tích Xu
                  </label>
                  <span className="text-[11px] text-[#795653]/70">
                    {loyaltyConfig.isEnabled
                      ? 'Người dùng có thể điểm danh 7 ngày và nhận thưởng xu bình thường.'
                      : 'Tính năng sẽ tạm khóa và hiển thị thông báo bảo trì.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLoyaltyConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))
                  }
                  className="p-1 cursor-pointer transition-transform active:scale-95"
                >
                  {loyaltyConfig.isEnabled ? (
                    <ToggleRight className="w-9 h-9 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-400" />
                  )}
                </button>
              </div>

              {/* 1. Mức Xu Cá thưởng khi đóng mộc hàng ngày (Mỗi ngày) */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#FFF9F4]/70 border border-[#795653]/15">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#795653]">
                    1. Mức Xu Cá thưởng mỗi ngày khi đóng mộc:
                  </label>
                  <span className="text-xs font-black text-[#D6336C] px-2.5 py-0.5 rounded-full bg-[#FF8FAB]/20 border border-[#FF8FAB]/40">
                    Hiện tại: {loyaltyConfig.dailyRewardCoins ?? 5} Xu / ngày
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={loyaltyConfig.dailyRewardCoins ?? 5}
                    onChange={(e) =>
                      setLoyaltyConfig((prev) => ({
                        ...prev,
                        dailyRewardCoins: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#795653]/30 bg-white text-base font-black text-[#D81C63] focus:outline-hidden focus:ring-2 focus:ring-[#FF8FAB]"
                    placeholder="Nhập số xu thưởng đóng mộc hàng ngày (VD: 5)"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[#795653]/60">
                    Xu / Ngày
                  </span>
                </div>

                {/* Quick preset buttons for daily reward */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-[#795653]/70 mb-1.5 block">Chọn nhanh mức xu mỗi ngày:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[0, 5, 10, 15, 20, 50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLoyaltyConfig((prev) => ({ ...prev, dailyRewardCoins: val }))}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          (loyaltyConfig.dailyRewardCoins ?? 5) === val
                            ? 'bg-[#FF8FAB] text-white border-[#FF8FAB] shadow-2xs'
                            : 'bg-white hover:bg-[#FFF9F4] text-[#795653] border-[#795653]/20'
                        }`}
                      >
                        {val === 0 ? '0 Xu (Tắt thưởng ngày)' : `${val} Xu${val === 5 ? ' (Mặc định)' : ''}`}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-[#795653]/75 pt-1 leading-relaxed">
                  🐾 Mỗi ngày bấm đóng mộc, người dùng sẽ nhận ngay số xu này vào ví.
                </p>
              </div>

              {/* 2. Mức Xu Cá thưởng thêm khi hoàn thành thẻ (7 ngày) */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#FFF9F4]/70 border border-[#795653]/15">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#795653]">
                    2. Mức Xu Cá thưởng thêm khi hoàn thành thẻ (7/7 ngày):
                  </label>
                  <span className="text-xs font-black text-[#D6336C] px-2.5 py-0.5 rounded-full bg-[#FF8FAB]/20 border border-[#FF8FAB]/40">
                    Hiện tại: {loyaltyConfig.rewardCoins} Xu
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={loyaltyConfig.rewardCoins}
                    onChange={(e) =>
                      setLoyaltyConfig((prev) => ({
                        ...prev,
                        rewardCoins: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#795653]/30 bg-white text-base font-black text-[#D81C63] focus:outline-hidden focus:ring-2 focus:ring-[#FF8FAB]"
                    placeholder="Nhập số xu thưởng hoàn thành thẻ (VD: 50)"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[#795653]/60">
                    Xu Cá
                  </span>
                </div>

                {/* Quick preset buttons */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-[#795653]/70 mb-1.5 block">Chọn nhanh mức xu hoàn thành 7 ngày:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[30, 50, 100, 150, 200, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLoyaltyConfig((prev) => ({ ...prev, rewardCoins: val }))}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          loyaltyConfig.rewardCoins === val
                            ? 'bg-[#FF8FAB] text-white border-[#FF8FAB] shadow-2xs'
                            : 'bg-white hover:bg-[#FFF9F4] text-[#795653] border-[#795653]/20'
                        }`}
                      >
                        {val} Xu {val === 50 ? '(Mặc định)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-[#795653]/75 pt-1 leading-relaxed">
                  💡 Số xu này sẽ tự động cộng thêm vào Ví Xu Cá của người dùng khi họ hoàn thành đóng đủ 7/7 dấu chân.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingLoyalty}
                className="py-2.5 px-6 rounded-2xl bg-[#FF8FAB] hover:bg-[#ff7aa0] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50 border border-white/80"
              >
                {isSavingLoyalty ? 'Đang lưu...' : 'Lưu Mức Xu Thưởng Thẻ Tích Xu'}
              </button>
            </form>
          </div>

          {/* Bảng Log Lịch Sử Hoàn Thành Chu Kỳ */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#795653]/20 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#795653]/10 pb-3">
              <div>
                <h3 className="text-base font-black text-[#795653] flex items-center gap-1.5">
                  <span>📜</span>
                  <span>Bảng Log Lịch Sử Hoàn Thành Chu Kỳ (Mới nhất lên đầu)</span>
                </h3>
                <p className="text-xs text-[#795653]/70">
                  Ghi nhận tự động các lần người dùng tích lũy đủ 7/7 dấu chân và nhận thưởng xu.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFE5EC] text-[#D81C63] border border-[#FF8FAB]/40">
                Tổng {loyaltyLogs.length} lượt
              </span>
            </div>

            {loyaltyLogs.length === 0 ? (
              <div className="p-8 text-center bg-[#FFF9F4] rounded-2xl border border-dashed border-[#795653]/20 text-xs text-[#795653]/70">
                🐾 Chưa có lượt hoàn thành chu kỳ nào được ghi nhận.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#795653]/15 text-[#795653]/70">
                      <th className="py-2.5 px-3 font-extrabold">Thời gian</th>
                      <th className="py-2.5 px-3 font-extrabold">Người dùng</th>
                      <th className="py-2.5 px-3 font-extrabold">Chu kỳ</th>
                      <th className="py-2.5 px-3 font-extrabold text-right">Xu nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#795653]/10">
                    {loyaltyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FFF9F4]/70 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-[#795653]/80">
                          {new Date(log.completedAt).toLocaleString('vi-VN', {
                            timeZone: 'Asia/Ho_Chi_Minh',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#795653]">
                          {log.username}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-[#FFE5EC] text-[#D81C63] font-bold text-[11px] border border-[#FF8FAB]/30">
                            Chu kỳ #{log.cycleNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-black text-emerald-700 text-right whitespace-nowrap">
                          +{log.rewardCoins} Xu Cá
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Quản Lý Thị Trấn Cá Mèo */}
      {tab === 'cat_town' && (
        <div className="space-y-6">
          {/* Header & KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs">
              <span className="text-[10px] font-bold text-[#795653]/60 uppercase">Tổng Cư Dân</span>
              <div className="text-xl font-black text-[#D6336C] mt-1 tabular-nums">
                {catTownStats?.totalResidents || 0}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs">
              <span className="text-[10px] font-bold text-[#795653]/60 uppercase">Cá Đã Câu</span>
              <div className="text-xl font-black text-[#1E3A8A] mt-1 tabular-nums">
                {catTownStats?.totalFishCaught || 0}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs">
              <span className="text-[10px] font-bold text-[#795653]/60 uppercase">Mẻ Cá Đã Nướng</span>
              <div className="text-xl font-black text-[#B07D62] mt-1 tabular-nums">
                {catTownStats?.totalFishGrilled || 0}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs">
              <span className="text-[10px] font-bold text-[#795653]/60 uppercase">Quẻ Bói Đã Rút</span>
              <div className="text-xl font-black text-[#7B2CBF] mt-1 tabular-nums">
                {catTownStats?.totalFortunesTold || 0}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#795653]/20 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-[#795653]/60 uppercase">Nội Thất Đã Bán</span>
              <div className="text-xl font-black text-emerald-700 mt-1 tabular-nums">
                {catTownStats?.totalFurnitureBought || 0}
              </div>
            </div>
          </div>

          {/* Form Cấu Hình Mini-game & Thưởng Xu */}
          {catTownConfig && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#795653]/20 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#795653]/10 pb-3">
                <div>
                  <h3 className="text-base font-black text-[#795653] flex items-center gap-1.5">
                    <span>⚙️</span>
                    <span>Cấu Hình Mini-Game & Phần Thưởng Xu Cá</span>
                  </h3>
                  <p className="text-xs text-[#795653]/70">
                    Tùy chỉnh số lượt chơi và mức Xu Cá cộng trực tiếp vào ví người chơi.
                  </p>
                </div>
              </div>

              {catTownFeedback && (
                <div className="p-3 rounded-2xl bg-[#FFE5EC] border-2 border-[#FF8FAB] text-[#795653] text-xs font-bold">
                  {catTownFeedback}
                </div>
              )}

              <form onSubmit={handleSaveCatTownConfig} className="space-y-4">
                {/* Switch Bật/Tắt */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF9F4] border border-[#795653]/15">
                  <div>
                    <label className="text-xs font-black text-[#795653] block">
                      Trạng thái Thị Trấn Cá Mèo
                    </label>
                    <span className="text-[11px] text-[#795653]/70">
                      Khi tắt, người dùng sẽ thấy thông báo bảo trì khu vực.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCatTownConfig({
                        ...catTownConfig,
                        isEnabled: !catTownConfig.isEnabled,
                      })
                    }
                    className="cursor-pointer"
                  >
                    {catTownConfig.isEnabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-neutral-400" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Daily limits */}
                  <div>
                    <label className="text-xs font-bold text-[#795653] block mb-1">
                      Giới hạn câu cá / ngày (lượt)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={catTownConfig.dailyFishingLimit}
                      onChange={(e) =>
                        setCatTownConfig({
                          ...catTownConfig,
                          dailyFishingLimit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#795653]/30 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#795653] block mb-1">
                      Giới hạn nướng cá / ngày (mẻ)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={catTownConfig.dailyGrillingLimit}
                      onChange={(e) =>
                        setCatTownConfig({
                          ...catTownConfig,
                          dailyGrillingLimit: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#795653]/30 text-xs font-bold"
                    />
                  </div>

                  {/* Rewards */}
                  <div>
                    <label className="text-xs font-bold text-[#795653] block mb-1">
                      Xu thưởng nướng cá chín vàng (Hoàn hảo)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={catTownConfig.grillingRewardPerfect}
                      onChange={(e) =>
                        setCatTownConfig({
                          ...catTownConfig,
                          grillingRewardPerfect: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#795653]/30 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#795653] block mb-1">
                      Xu thưởng xem bói may mắn đầu ngày
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={catTownConfig.fortuneRewardCoins}
                      onChange={(e) =>
                        setCatTownConfig({
                          ...catTownConfig,
                          fortuneRewardCoins: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#795653]/30 text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingCatTown}
                  className="py-2.5 px-6 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] text-[#795653] font-black text-xs uppercase tracking-wider shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSavingCatTown ? 'Đang lưu...' : 'Lưu Cấu Hình Thị Trấn'}
                </button>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* QUẢN LÝ BỂ CÁ HỒ BONG BÓNG (FISH DATABASE EDITOR) */}
          {/* ============================================================== */}
          {(() => {
            const rawCatalog: any[] = (catTownConfig?.fishCatalog && catTownConfig.fishCatalog.length > 0)
              ? catTownConfig.fishCatalog
              : FISH_DATABASE;
            const fishList = normalizeFishCatalog(rawCatalog);
            const totalDropRate = fishList.reduce((sum, f) => sum + (Number(f.dropRate) || 0), 0);

            const filteredFish = fishList.filter((f) => {
              if (fishFilterRarity !== 'all' && f.rarity.toUpperCase() !== fishFilterRarity.toUpperCase()) {
                return false;
              }
              if (fishSearchTerm.trim()) {
                const term = fishSearchTerm.trim().toLowerCase();
                const matchName = f.name.toLowerCase().includes(term);
                const matchId = f.id.toLowerCase().includes(term);
                return matchName || matchId;
              }
              return true;
            });

            return (
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#795653]/20 shadow-xs space-y-4">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#795653]/15 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#795653] flex items-center gap-2">
                      <span className="text-xl">🐟</span>
                      <span>Quản Lý Bể Cá Hồ Bong Bóng (Fish Database Editor)</span>
                    </h3>
                    <p className="text-xs text-[#795653]/70 mt-0.5">
                      Tùy chỉnh thông tin từng loài cá: tên, độ hiếm, mức Xu thưởng, tỷ lệ xuất hiện (Drop Rate %) và link ảnh Pixel. Thay đổi lập tức đồng bộ tới trò chơi câu cá ngoài hồ.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleResetDefaultFish}
                      className="px-3 py-2 rounded-xl border border-[#795653]/30 hover:bg-[#FFF9F4] text-[#795653] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Khôi phục 11 loài cá mặc định"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Khôi Phục Gốc (11 Cá)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenAddFish}
                      className="px-3.5 py-2 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] text-[#795653] text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Giống Cá Mới</span>
                    </button>
                  </div>
                </div>

                {/* Summary Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#FFF9F4] border border-[#795653]/15 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#795653]/60 uppercase">Tổng Giống Cá</span>
                    <div className="text-base font-black text-[#795653] mt-0.5">
                      {fishList.length} loài
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#795653]/60 uppercase">Tổng Tỷ Lệ Rơi</span>
                    <div className="text-base font-black flex items-center gap-1.5 mt-0.5">
                      <span className={Math.abs(totalDropRate - 100) < 0.1 ? 'text-emerald-700' : 'text-amber-600'}>
                        {totalDropRate.toFixed(1)}%
                      </span>
                      {Math.abs(totalDropRate - 100) >= 0.1 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-semibold" title="Hệ thống tự cân đối trọng số nếu không tròn 100%">
                          ≠ 100%
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#795653]/60 uppercase">Cá Huyền Thoại</span>
                    <div className="text-base font-black text-amber-600 mt-0.5">
                      {fishList.filter((f) => f.rarity.toUpperCase() === 'LEGENDARY').length} loài
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#795653]/60 uppercase">Cá Sử Thi & Hiếm</span>
                    <div className="text-base font-black text-purple-700 mt-0.5">
                      {fishList.filter((f) => ['EPIC', 'RARE'].includes(f.rarity.toUpperCase())).length} loài
                    </div>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-[#795653]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc mã cá (VD: fish_01, anh đào...)"
                      value={fishSearchTerm}
                      onChange={(e) => setFishSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#795653]/25 text-xs bg-white font-medium focus:outline-none focus:border-[#F6A6B8]"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {[
                      { key: 'all', label: 'Tất cả' },
                      { key: 'LEGENDARY', label: 'Huyền Thoại' },
                      { key: 'EPIC', label: 'Sử Thi' },
                      { key: 'RARE', label: 'Hiếm' },
                      { key: 'COMMON', label: 'Thường' },
                    ].map((tabItem) => (
                      <button
                        key={tabItem.key}
                        type="button"
                        onClick={() => setFishFilterRarity(tabItem.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                          fishFilterRarity === tabItem.key
                            ? 'bg-[#795653] text-white shadow-2xs'
                            : 'bg-[#FFF9F4] text-[#795653]/70 hover:text-[#795653] border border-[#795653]/15'
                        }`}
                      >
                        {tabItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fish Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {filteredFish.map((fish) => {
                    const rCfg = getRarityConfig(fish.rarity);
                    return (
                      <div
                        key={fish.id}
                        className="p-3.5 rounded-2xl bg-white border-2 border-[#795653]/20 hover:border-[#F6A6B8] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-2.5 group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Pixel Fish Avatar */}
                          <div className="w-14 h-14 rounded-xl bg-[#FFF9F4] border-2 border-[#795653]/20 flex items-center justify-center p-1 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                            {fish.imageSrc ? (
                              <img
                                src={fish.imageSrc}
                                alt={fish.name}
                                className="w-full h-full object-contain"
                                style={{ imageRendering: 'pixelated' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/fishing/fish_01.png';
                                }}
                              />
                            ) : (
                              <span className="text-xl">🐟</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-[10px] font-bold text-[#A6536A] uppercase">
                                {fish.id}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider"
                                style={{
                                  backgroundColor: rCfg.bgBadge,
                                  color: rCfg.textColor,
                                  borderColor: rCfg.borderColor,
                                }}
                              >
                                {rCfg.label}
                              </span>
                            </div>

                            <h4 className="font-black text-xs sm:text-sm text-[#795653] truncate mt-0.5">
                              {fish.name}
                            </h4>

                            <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                              <span className="text-[#D6336C]">+{fish.xuReward} Xu</span>
                              <span className="text-[#795653]/50">·</span>
                              <span className="text-[#526C91]">Rơi: {fish.dropRate}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Weight & Description */}
                        <div className="text-[11px] text-[#795653]/75 space-y-1 bg-[#FFF9F4] p-2 rounded-xl border border-[#795653]/10">
                          <div className="flex items-center justify-between font-semibold text-[10px]">
                            <span>Trọng lượng:</span>
                            <span className="text-[#795653] font-bold">{fish.weightMin}g - {fish.weightMax}g</span>
                          </div>
                          {fish.description && (
                            <p className="line-clamp-2 text-[10px] leading-tight text-[#795653]/70">
                              {fish.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#795653]/10">
                          <button
                            type="button"
                            onClick={() => handleOpenEditFish(fish)}
                            className="px-2.5 py-1 rounded-lg bg-[#FFE5EC] hover:bg-[#FFB3C6] text-[#795653] text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFish(fish.id, fish.name)}
                            className="p-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Xóa cá"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredFish.length === 0 && (
                  <div className="p-8 text-center bg-[#FFF9F4] rounded-2xl border border-dashed border-[#795653]/20">
                    <p className="text-xs font-bold text-[#795653]">Không tìm thấy loài cá nào khớp với điều kiện tìm kiếm.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* MODAL CHỈNH SỬA / THÊM MỚI THÔNG TIN CÁ */}
          {/* ============================================================== */}
          {editingFish && (
            <div
              onClick={() => {
                setEditingFish(null);
                setFishFeedback(null);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#795653]/70 backdrop-blur-xs animate-in fade-in select-none overflow-y-auto cursor-pointer"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl bg-[#FFF9F4] border-4 border-[#795653] shadow-[8px_8px_0px_#795653] rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col cursor-default"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b-3 border-[#795653] pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl animate-bounce">🐟</span>
                    <div>
                      <h3
                        className="text-sm sm:text-base font-black text-[#D6336C] tracking-wide"
                        style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
                      >
                        {isCreatingFish ? 'THÊM GIỐNG CÁ MỚI VÀO HỒ BONG BÓNG' : `CHỈNH SỬA: ${editingFish.name || editingFish.id}`}
                      </h3>
                      <p className="text-[11px] text-[#795653]/80 font-medium">
                        Dữ liệu sẽ lưu thẳng vào database và áp dụng lập tức ngoài hồ câu! 🎣
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingFish(null);
                      setFishFeedback(null);
                    }}
                    className="w-8 h-8 rounded-xl bg-[#FFE5EC] hover:bg-[#FFB3C6] border-2 border-[#795653] text-[#795653] font-black text-xs flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#795653]"
                  >
                    ✕
                  </button>
                </div>

                {/* Feedback message */}
                {fishFeedback && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[#FFE5EC] border-2 border-[#D6336C] text-[#D6336C] text-xs font-black">
                    {fishFeedback}
                  </div>
                )}

                {/* Form fields */}
                <form onSubmit={handleSaveFish} className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Fish ID */}
                    <div>
                      <label className="text-[11px] font-black text-[#795653] block mb-1">
                        Mã loài cá (Fish ID) <span className="text-rose-500">* (Có thể chỉnh sửa)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editingFish.id || ''}
                        onChange={(e) => setEditingFish({ ...editingFish, id: e.target.value })}
                        placeholder="VD: fish_01, fish_12, fish_koi_gold..."
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#795653] bg-white text-xs font-mono font-black text-[#D6336C] focus:outline-none focus:border-[#D6336C]"
                      />
                      <span className="text-[10px] text-[#795653]/70 mt-0.5 block">
                        {isCreatingFish
                          ? 'Mã ID độc bản cho loài cá mới (VD: fish_12)'
                          : 'Bà có thể tự do đổi sang mã ID mới (VD: fish_super_01)'}
                      </span>
                    </div>

                    {/* Fish Name */}
                    <div>
                      <label className="text-[11px] font-black text-[#795653] block mb-1">
                        Tên loài cá <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editingFish.name || ''}
                        onChange={(e) => setEditingFish({ ...editingFish, name: e.target.value })}
                        placeholder="VD: Cá Xiêm Hoa Anh Đào..."
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#795653] bg-white text-xs font-black text-[#795653] focus:outline-none focus:border-[#D6336C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Rarity */}
                    <div>
                      <label className="text-[11px] font-black text-[#795653] block mb-1">
                        Độ hiếm (Rarity)
                      </label>
                      <select
                        value={String(editingFish.rarity || 'COMMON').toUpperCase()}
                        onChange={(e) => setEditingFish({ ...editingFish, rarity: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#795653] bg-white text-xs font-black text-[#795653] focus:outline-none"
                      >
                        <option value="COMMON">COMMON (Thường)</option>
                        <option value="RARE">RARE (Hiếm)</option>
                        <option value="EPIC">EPIC (Sử thi)</option>
                        <option value="LEGENDARY">LEGENDARY (Huyền thoại)</option>
                      </select>
                    </div>

                    {/* Xu Reward */}
                    <div>
                      <label className="text-[11px] font-black text-[#795653] block mb-1">
                        Thưởng Xu Cá (Xu)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        required
                        value={editingFish.rewardCoins ?? editingFish.xuReward ?? 30}
                        onChange={(e) =>
                          setEditingFish({
                            ...editingFish,
                            rewardCoins: Number(e.target.value),
                            xuReward: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#795653] bg-white text-xs font-black text-[#D6336C] focus:outline-none"
                      />
                    </div>

                    {/* Drop Rate % */}
                    <div>
                      <label className="text-[11px] font-black text-[#795653] block mb-1">
                        Tỷ lệ câu trúng (%)
                      </label>
                      <input
                        type="number"
                        min={0.1}
                        max={100}
                        step={0.1}
                        required
                        value={editingFish.dropRate ?? 5}
                        onChange={(e) => setEditingFish({ ...editingFish, dropRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#795653] bg-white text-xs font-black text-[#526C91] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Weight Range */}
                    <div>
                      <label className="text-[11px] font-black text-[#795653] block mb-1">
                        Trọng lượng tối thiểu (gram)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={10000}
                        value={editingFish.weightMin ?? 150}
                        onChange={(e) => setEditingFish({ ...editingFish, weightMin: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#795653] bg-white text-xs font-bold text-[#795653] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-[#795653] block mb-1">
                        Trọng lượng tối đa (gram)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={10000}
                        value={editingFish.weightMax ?? 450}
                        onChange={(e) => setEditingFish({ ...editingFish, weightMax: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#795653] bg-white text-xs font-bold text-[#795653] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Fish Sprite Image URL with Live Preview */}
                  <div>
                    <label className="text-[11px] font-black text-[#795653] block mb-1">
                      Link ảnh Pixel của cá (Sprite URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="<!-- CHÈN LINK ẢNH PIXEL CỦA BẠN VÀO ĐÂY -->"
                        value={editingFish.imageSrc || editingFish.image || ''}
                        onChange={(e) =>
                          setEditingFish({
                            ...editingFish,
                            imageSrc: e.target.value,
                            image: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 rounded-xl border-2 border-[#795653] bg-white text-xs font-mono font-bold text-[#795653] focus:outline-none focus:border-[#D6336C]"
                      />
                      <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#795653] flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-[2px_2px_0px_#795653]">
                        {(editingFish.imageSrc || editingFish.image) ? (
                          <img
                            src={editingFish.imageSrc || editingFish.image}
                            alt="preview"
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/fishing/fish_01.png';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-[#795653]/50">Trống</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#795653]/60 mt-1">
                      Gợi ý: Link ảnh pixel có thể là ảnh tải lên (/assets/fishing/...) hoặc link URL online trực tiếp.
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[11px] font-black text-[#795653] block mb-1">
                      Mô tả cốt truyện loài cá (Lore / Story)
                    </label>
                    <textarea
                      rows={3}
                      value={editingFish.description || ''}
                      onChange={(e) => setEditingFish({ ...editingFish, description: e.target.value })}
                      placeholder="Mô tả đặc điểm nhận dạng, hương vị khi đem nướng, tính cách chú cá..."
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#795653] bg-white text-xs font-medium text-[#795653] focus:outline-none focus:border-[#D6336C] resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#795653]/15">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFish(null);
                        setFishFeedback(null);
                      }}
                      className="px-4 py-2 rounded-xl border-2 border-[#795653] text-[#795653] font-black text-xs hover:bg-[#795653]/10 cursor-pointer"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCatTown}
                      className="px-6 py-2 rounded-xl bg-[#FF8FAB] hover:bg-[#FF7599] disabled:opacity-50 text-white font-black text-xs border-2 border-[#795653] shadow-[3px_3px_0px_#795653] hover:shadow-[1px_1px_0px_#795653] hover:translate-y-0.5 active:translate-y-1 cursor-pointer flex items-center gap-1.5"
                    >
                      {isSavingCatTown ? 'Đang lưu...' : 'Lưu Thông Tin Cá ✓'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= QUẢN LÝ BẢNG GIÁ NỘI THẤT (ADMIN PANEL) ================= */}
          {catTownConfig?.furnitureCatalog && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#795653]/20 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#795653]/15 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#795653] flex items-center gap-2">
                    <span>🛋️</span>
                    <span>Cấu Hình Bảng Giá Nội Thất Tiệm Thị Trấn</span>
                  </h3>
                  <p className="text-xs text-[#795653]/70 font-medium mt-0.5">
                    Quản lý và điều chỉnh giá Xu Cá cho toàn bộ các danh mục: Giường ngủ (16), Sofa (6), Tường (15), Sàn (15), Trang trí (33).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingFurniture(!isAddingFurniture)}
                    className="px-3 py-2 bg-[#FFE5EC] hover:bg-[#FFCCD5] text-[#D6336C] font-black text-xs rounded-xl border-2 border-[#795653] shadow-[2px_2px_0px_#795653] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>➕</span>
                    <span>{isAddingFurniture ? 'ĐÓNG FORM' : 'THÊM MÓN MỚI'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsSavingFurniture(true);
                      setFurnitureFeedback(null);
                      try {
                        const res = await firebaseApi('/api/admin/cat-town/config', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${authToken}`,
                          },
                          body: JSON.stringify(catTownConfig),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu bảng giá');
                        setFurnitureFeedback('✓ Đã lưu thay đổi nội thất vào hệ thống thành công!');
                        setTimeout(() => setFurnitureFeedback(null), 3500);
                        fetchCatTownData();
                      } catch (err: any) {
                        setFurnitureFeedback(`Lỗi: ${err.message}`);
                      } finally {
                        setIsSavingFurniture(false);
                      }
                    }}
                    disabled={isSavingFurniture}
                    className="px-4 py-2 bg-[#06D6A0] hover:bg-[#05b587] disabled:opacity-50 text-[#1E3A8A] font-black text-xs rounded-xl border-2 border-[#795653] shadow-[3px_3px_0px_#795653] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>💾</span>
                    <span>{isSavingFurniture ? 'Đang lưu...' : 'LƯU TẤT CẢ THAY ĐỔI'}</span>
                  </button>
                </div>
              </div>

              {/* Form to Add New Furniture Item */}
              {isAddingFurniture && (
                <div className="p-4 bg-[#FFF9F4] border-2 border-[#795653] rounded-2xl space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-black text-[#795653] uppercase flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Thêm Món Đồ Nội Thất Mới Vào Shop</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-[#795653]">Tên món đồ (*)</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Ghế Mây Thư Giãn..."
                        value={newFurnName}
                        onChange={(e) => setNewFurnName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#795653]/30 rounded-lg text-xs font-bold text-[#795653]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#795653]">Danh mục (*)</label>
                      <select
                        value={newFurnCategory}
                        onChange={(e) => setNewFurnCategory(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#795653]/30 rounded-lg text-xs font-bold text-[#795653]"
                      >
                        <option value="bed">🛏️ Giường ngủ</option>
                        <option value="sofa">🛋️ Sofa</option>
                        <option value="wallpaper">🧱 Tường</option>
                        <option value="floor">🪵 Sàn nhà</option>
                        <option value="decor">🪴 Trang trí khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#795653]">Giá bán (Xu Cá) (*)</label>
                      <input
                        type="number"
                        min={1}
                        value={newFurnPrice}
                        onChange={(e) => setNewFurnPrice(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#795653]/30 rounded-lg text-xs font-bold text-[#795653]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#795653]">Link ảnh (URL)</label>
                      <input
                        type="text"
                        placeholder="/assets/... hoặc https://..."
                        value={newFurnImageUrl}
                        onChange={(e) => setNewFurnImageUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#795653]/30 rounded-lg text-xs font-bold text-[#795653]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#795653]">Mô tả món đồ</label>
                    <input
                      type="text"
                      placeholder="Mô tả phong cách pixel RPG..."
                      value={newFurnDesc}
                      onChange={(e) => setNewFurnDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#795653]/30 rounded-lg text-xs font-bold text-[#795653]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingFurniture(false)}
                      className="px-3 py-1 bg-white border border-[#795653]/30 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newFurnName.trim()) {
                          alert('Vui lòng nhập tên món đồ!');
                          return;
                        }
                        const newId = `${newFurnCategory}_custom_${Date.now()}`;
                        const newItem = {
                          id: newId,
                          name: newFurnName.trim(),
                          category: newFurnCategory,
                          price: newFurnPrice,
                          description: newFurnDesc.trim() || 'Món đồ trang trí pixel đáng yêu cho dinh thự mèo.',
                          imageUrl: newFurnImageUrl.trim() || '/assets/furniture/decor/decor_01.png',
                          dimensions: { w: 1, h: 1 },
                        };
                        const updated = [newItem, ...(catTownConfig.furnitureCatalog || [])];
                        setCatTownConfig({ ...catTownConfig, furnitureCatalog: updated });
                        setNewFurnName('');
                        setNewFurnImageUrl('');
                        setNewFurnDesc('');
                        setIsAddingFurniture(false);
                        setFurnitureFeedback(`✓ Đã thêm "${newItem.name}" vào danh mục! Nhấn "LƯU TẤT CẢ THAY ĐỔI" để lưu.`);
                        setTimeout(() => setFurnitureFeedback(null), 3500);
                      }}
                      className="px-4 py-1 bg-[#FF8FAB] hover:bg-[#f37898] text-white font-black text-xs rounded-lg border-2 border-[#795653] shadow-[2px_2px_0px_#795653] cursor-pointer"
                    >
                      + XÁC NHẬN THÊM VÀO SHOP
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback toast */}
              {furnitureFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold text-center ${
                    furnitureFeedback.startsWith('✓')
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'bg-rose-50 border-rose-400 text-rose-800'
                  }`}
                >
                  {furnitureFeedback}
                </div>
              )}

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'Tất cả', icon: '📦' },
                    { id: 'bed', label: 'Giường ngủ', icon: '🛏️' },
                    { id: 'sofa', label: 'Sofa', icon: '🛋️' },
                    { id: 'wallpaper', label: 'Tường', icon: '🧱' },
                    { id: 'floor', label: 'Sàn', icon: '🪵' },
                    { id: 'decor', label: 'Trang trí', icon: '🪴' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAdminFurnCategory(cat.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        adminFurnCategory === cat.id
                          ? 'bg-[#FF8FAB] text-white border-[#795653] shadow-[2px_2px_0px_#795653]'
                          : 'bg-white text-[#795653] border-[#795653]/20 hover:border-[#795653]'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={adminFurnSearch}
                    onChange={(e) => setAdminFurnSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc ID..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#795653]/30 bg-[#FFF9F4] text-xs font-semibold text-[#795653] focus:outline-none focus:border-[#FF8FAB]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#795653]/50 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Furniture Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[550px] overflow-y-auto pr-1">
                {(catTownConfig.furnitureCatalog || [])
                  .filter((item: any) => {
                    // Loại bỏ triệt để bất kỳ món đồ cũ nào không có file ảnh thật
                    const assetUrl = item.imageUrl || getFurnitureAssetUrl(item.id);
                    if (!assetUrl || (!assetUrl.startsWith('/assets/furniture/') && !assetUrl.startsWith('http://') && !assetUrl.startsWith('https://'))) {
                      return false;
                    }

                    if (adminFurnCategory === 'bed' && item.category !== 'bed') return false;
                    if (adminFurnCategory === 'sofa' && item.category !== 'sofa') return false;
                    if (adminFurnCategory === 'wallpaper' && item.category !== 'wallpaper') return false;
                    if (adminFurnCategory === 'floor' && item.category !== 'floor') return false;
                    if (
                      adminFurnCategory === 'decor' &&
                      !['decor', 'furniture', 'cat_item', 'plant', 'toy'].includes(item.category)
                    )
                      return false;

                    if (adminFurnSearch.trim()) {
                      const q = adminFurnSearch.toLowerCase();
                      return (
                        item.name.toLowerCase().includes(q) ||
                        item.id.toLowerCase().includes(q) ||
                        (item.description && item.description.toLowerCase().includes(q))
                      );
                    }
                    return true;
                  })
                  .map((item: any) => {
                    const assetUrl = item.imageUrl || getFurnitureAssetUrl(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border-2 flex flex-col justify-between gap-2 shadow-xs transition-all ${
                          item.isHidden
                            ? 'bg-neutral-100/90 border-neutral-300 opacity-75'
                            : 'bg-[#FFF9F4] border-[#795653]/20 hover:border-[#795653]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Image preview */}
                          <div className="w-14 h-14 bg-white border border-[#795653]/20 rounded-xl flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            <img
                              src={assetUrl}
                              alt={item.name}
                              className="w-full h-full object-contain pixelated"
                              style={{ imageRendering: 'pixelated' }}
                              loading="lazy"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-black text-[#795653] truncate" title={item.name}>
                                {item.name}
                              </h4>
                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Xóa món "${item.name}" khỏi danh mục nội thất?`)) {
                                    const updated = catTownConfig.furnitureCatalog.filter((f: any) => f.id !== item.id);
                                    setCatTownConfig({ ...catTownConfig, furnitureCatalog: updated });
                                  }
                                }}
                                title="Xóa bỏ món này"
                                className="w-5 h-5 rounded hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-bold text-[#795653]/60 bg-white px-1.5 py-0.5 rounded border border-[#795653]/20 uppercase">
                                {item.category}
                              </span>
                              <span className="text-[9px] font-mono text-[#795653]/50 truncate">
                                {item.id}
                              </span>
                            </div>

                            <p className="text-[10px] text-[#795653]/70 line-clamp-1 mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Status Toggle & Price Controls */}
                        <div className="pt-2 border-t border-[#795653]/15 flex items-center justify-between gap-2">
                          {/* Toggle Hide/Show in Shop */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = catTownConfig.furnitureCatalog.map((f: any) =>
                                f.id === item.id ? { ...f, isHidden: !f.isHidden } : f
                              );
                              setCatTownConfig({ ...catTownConfig, furnitureCatalog: updated });
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors ${
                              item.isHidden
                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                            }`}
                            title={item.isHidden ? 'Món này đang bị ẩn khỏi shop. Bấm để mở bán lại.' : 'Món này đang mở bán. Bấm để ẩn khỏi shop.'}
                          >
                            {item.isHidden ? (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5 text-rose-600" />
                                <span>ĐÃ ẨN</span>
                              </>
                            ) : (
                              <>
                                <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                                <span>MỞ BÁN</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Step Buttons */}
                            <button
                              type="button"
                              onClick={() => {
                                const newPrice = Math.max(1, (item.price || 10) - 5);
                                const updated = catTownConfig.furnitureCatalog.map((f: any) =>
                                  f.id === item.id ? { ...f, price: newPrice } : f
                                );
                                setCatTownConfig({ ...catTownConfig, furnitureCatalog: updated });
                              }}
                              className="w-5 h-5 rounded bg-white hover:bg-neutral-100 border border-[#795653]/30 text-[10px] font-bold text-[#795653] flex items-center justify-center cursor-pointer"
                              title="Giảm 5 Xu"
                            >
                              -5
                            </button>

                            {/* Direct Number Input */}
                            <input
                              type="number"
                              min={1}
                              max={9999}
                              value={item.price}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                const newPrice = isNaN(val) ? 1 : Math.max(1, val);
                                const updated = catTownConfig.furnitureCatalog.map((f: any) =>
                                  f.id === item.id ? { ...f, price: newPrice } : f
                                );
                                setCatTownConfig({ ...catTownConfig, furnitureCatalog: updated });
                              }}
                              className="w-14 px-1 py-0.5 text-center font-black text-xs text-[#D6336C] bg-white border border-[#795653]/40 rounded focus:outline-none focus:border-[#D6336C]"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const newPrice = (item.price || 10) + 5;
                                const updated = catTownConfig.furnitureCatalog.map((f: any) =>
                                  f.id === item.id ? { ...f, price: newPrice } : f
                                );
                                setCatTownConfig({ ...catTownConfig, furnitureCatalog: updated });
                              }}
                              className="w-5 h-5 rounded bg-white hover:bg-neutral-100 border border-[#795653]/30 text-[10px] font-bold text-[#795653] flex items-center justify-center cursor-pointer"
                              title="Tăng 5 Xu"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Bottom Quick Save */}
              <div className="pt-3 border-t border-[#795653]/15 flex items-center justify-between">
                <span className="text-xs text-[#795653]/70 font-semibold">
                  Tổng số món nội thất: <strong className="text-[#D6336C]">{(catTownConfig.furnitureCatalog || []).length}</strong> món
                </span>

                <button
                  type="button"
                  onClick={async () => {
                    setIsSavingFurniture(true);
                    setFurnitureFeedback(null);
                    try {
                      const res = await firebaseApi('/api/admin/cat-town/config', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${authToken}`,
                        },
                        body: JSON.stringify(catTownConfig),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu bảng giá');
                      setFurnitureFeedback('✓ Đã lưu bảng giá nội thất vào hệ thống thành công!');
                      setTimeout(() => setFurnitureFeedback(null), 3500);
                      fetchCatTownData();
                    } catch (err: any) {
                      setFurnitureFeedback(`Lỗi: ${err.message}`);
                    } finally {
                      setIsSavingFurniture(false);
                    }
                  }}
                  disabled={isSavingFurniture}
                  className="px-5 py-2 bg-[#FF8FAB] hover:bg-[#f37898] disabled:opacity-50 text-white font-black text-xs rounded-xl border-2 border-[#795653] shadow-[3px_3px_0px_#795653] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>{isSavingFurniture ? 'Đang lưu...' : 'LƯU TẤT CẢ GIÁ NỘI THẤT'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Feedbacks */}
      {tab === 'feedbacks' && (
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-[#795653]">
            Hộp thư ý kiến chung từ người dùng (Mới nhất lên đầu)
          </h3>
          {feedbacks.length === 0 ? (
            <div className="p-8 text-center bg-white/50 rounded-2xl border border-[#795653]/15 text-xs text-[#795653]/70">
              Chưa có góp ý nào từ độc giả.
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="p-4 rounded-2xl bg-white border border-[#795653]/15 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#A6536A]">{fb.username} ({fb.type})</span>
                  <span className="text-[10px] text-[#795653]/60">{new Date(fb.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <p className="text-sm font-medium text-[#795653] pt-1">{fb.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 6: Audit Logs */}
      {tab === 'logs' && (
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-[#795653]">
            Nhật ký kiểm toán hệ thống (Audit Logs)
          </h3>
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-white border border-[#795653]/15 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-[#526C91]">[{log.action}]</span> {log.details}
              </div>
              <span className="text-[10px] text-[#795653]/60 shrink-0 ml-2">
                {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Special Orders Management */}
      {tab === 'special_orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-[#795653]">
              Danh sách Phiếu Đặt Cá Theo Yêu Cầu ({specialOrders.length})
            </h3>
            <span className="text-xs text-[#795653]/70">
              Nhận trực tiếp từ khách hàng gửi qua Phiếu Đặt Cá
            </span>
          </div>

          {specialOrders.length === 0 ? (
            <div className="p-8 text-center bg-white/50 rounded-2xl border border-[#795653]/15 text-xs text-[#795653]/70">
              Chưa có phiếu đặt cá nào từ khách hàng.
            </div>
          ) : (
            <div className="space-y-3">
              {specialOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#795653]/20 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#795653]/10 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-[#D6336C] text-sm">
                        {order.requestId}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFE5EC] text-[#E13F7C] border border-[#FF8FAB]/40">
                        {order.requestTypeName}
                      </span>
                      <span className="text-xs text-[#795653]/70">
                        bởi <span className="font-bold text-[#795653]">@{order.username}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#795653]/60">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.characterName && (
                      <div className="text-xs">
                        <span className="font-bold text-[#E13F7C]">🐟 Tên cá: </span>
                        <span className="font-extrabold text-[#795653]">{order.characterName}</span>
                      </div>
                    )}
                    {order.fishType && (
                      <div className="text-xs">
                        <span className="font-bold text-[#526C91]">🏷️ Loại cá / Thể loại: </span>
                        <span className="font-medium text-[#795653]">{order.fishType}</span>
                      </div>
                    )}
                    {order.description && (
                      <div>
                        <span className="text-[11px] font-bold text-[#795653] block mb-0.5">
                          📝 Miêu tả cá khô:
                        </span>
                        <p className="text-xs text-[#795653]/90 whitespace-pre-wrap leading-relaxed bg-[#FFF9F4] p-2.5 rounded-xl border border-[#795653]/10">
                          {order.description}
                        </p>
                      </div>
                    )}
                    {order.plotIdea && (
                      <div>
                        <span className="text-[11px] font-bold text-[#A6536A] block mb-0.5">
                          📖 Ý tưởng cốt truyện:
                        </span>
                        <p className="text-xs text-[#795653]/90 whitespace-pre-wrap leading-relaxed bg-[#FFF9F4] p-2.5 rounded-xl border border-[#795653]/10">
                          {order.plotIdea}
                        </p>
                      </div>
                    )}
                    {(order.extraNotes || order.note) && (
                      <div className="text-xs text-[#795653]/80 bg-[#FFF9F4]/60 p-2 rounded-xl border border-dashed border-[#795653]/15">
                        <span className="font-bold text-[#E13F7C]">💌 Thông tin khác / Lời nhắn: </span>
                        {order.extraNotes || order.note}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-[#795653]/70 font-semibold">
                      Chuyển trạng thái:
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {['received', 'in_review', 'accepted', 'completed', 'declined'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateSpecialOrderStatus(order.id, st)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            order.status === st
                              ? 'bg-[#E13F7C] text-white'
                              : 'bg-white border border-[#795653]/20 hover:bg-[#FFE5EC] text-[#795653]'
                          }`}
                        >
                          {st === 'received'
                            ? 'Đã nhận'
                            : st === 'in_review'
                            ? 'Đang xem xét'
                            : st === 'accepted'
                            ? 'Duyệt làm'
                            : st === 'completed'
                            ? 'Hoàn thành'
                            : 'Từ chối'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XÓA NHÂN VẬT AN TOÀN ================= */}
      {deletingCharTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (!isDeletingChar) setDeletingCharTarget(null);
          }}
        >
          <div
            className="bg-[#FFF9F4] rounded-3xl p-6 sm:p-7 max-w-md w-full border-2 border-[#795653]/30 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center text-2xl shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="font-extrabold text-[#795653] text-base" style={{ fontFamily: "'Cal Sans', sans-serif" }}>
                  Xác nhận xóa nhân vật?
                </h3>
                <p className="text-xs text-[#795653]/70">
                  Thao tác này sẽ xóa vĩnh viễn dữ liệu khỏi cửa hàng.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#795653]/15 text-xs text-[#795653] leading-relaxed">
              Bà chủ có chắc muốn xóa nhân vật <span className="font-bold text-[#E13F7C]">"{deletingCharTarget.name}"</span> (ID: <code className="font-mono text-[#526C91]">{deletingCharTarget.id}</code>) không?
            </div>

            <div className="flex gap-2.5 justify-end pt-1">
              <button
                type="button"
                disabled={isDeletingChar}
                onClick={() => setDeletingCharTarget(null)}
                className="py-2.5 px-4 rounded-xl border border-[#795653]/20 hover:bg-[#795653]/10 text-xs font-bold text-[#795653] cursor-pointer transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingChar}
                onClick={handleConfirmDeleteCharacter}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black shadow-xs cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingChar ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Đồng Ý Xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
