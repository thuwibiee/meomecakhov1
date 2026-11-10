/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Character, UserCharacterOwnership, OrderReceipt } from './types.ts';
import { firebaseApi, subscribeToCharacters } from './firebase.ts';
import { LandingPage } from './components/LandingPage.tsx';
import { ShopSection } from './components/ShopSection.tsx';
import { InventorySection } from './components/InventorySection.tsx';
import { WalletSection } from './components/WalletSection.tsx';
import { QuestsAndGachaSection } from './components/QuestsAndGachaSection.tsx';
import { SpecialOrderSection } from './components/SpecialOrderSection.tsx';
import { CatTownSection } from './components/cat-town/CatTownSection.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';
import { CharacterDetailModal } from './components/CharacterDetailModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { PurchaseConfirmModal } from './components/PurchaseConfirmModal.tsx';
import { StoryModal } from './components/StoryModal.tsx';
import { ComplainModal } from './components/ComplainModal.tsx';
import { FitBachModal } from './components/FitBachModal.tsx';
import { SpiceCounterSection } from './components/SpiceCounterSection.tsx';
import { XuCaIcon } from './components/XuCaIcon.tsx';
import { 
  Store, 
  ShoppingBag, 
  Wallet, 
  Sparkles, 
  LogOut, 
  User as UserIcon, 
  ShieldAlert, 
  MessageCircleHeart,
  Home,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<'landing' | 'main'>(() => {
    try {
      const saved = sessionStorage.getItem('meome_current_view');
      if (saved === 'main' || saved === 'landing') return saved;
    } catch {}
    return 'landing';
  });
  const [activeTab, setActiveTab] = useState<'shop' | 'spice_counter' | 'inventory' | 'wallet' | 'quests' | 'special_order' | 'cat_town'>('shop');
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [adminEditingCharacter, setAdminEditingCharacter] = useState<Character | null>(null);

  // Sync currentView to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('meome_current_view', currentView);
    } catch {}
  }, [currentView]);

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Core Data state with initial localStorage cache for instant zero-loss render
  const [characters, setCharacters] = useState<(Character & { isOwned?: boolean })[]>(() => {
    try {
      const cached = localStorage.getItem('meome_characters_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [inventoryItems, setInventoryItems] = useState<UserCharacterOwnership[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<OrderReceipt | null>(null);
  const [inspectingCharacter, setInspectingCharacter] = useState<Character | null>(null);

  // New Interactive Modals state
  const [confirmBuyChar, setConfirmBuyChar] = useState<Character | null>(null);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);
  const [storyChar, setStoryChar] = useState<Character | null>(null);
  const [complainChar, setComplainChar] = useState<Character | null>(null);
  const [fitbachChar, setFitbachChar] = useState<Character | null>(null);

  // Feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cat Town Train Confirmation Modal
  const [showCatTownConfirmModal, setShowCatTownConfirmModal] = useState(false);

  // Restore persistent or session token on mount (Auto-Login)
  useEffect(() => {
    const savedToken = localStorage.getItem('meome_token') || sessionStorage.getItem('meome_token');
    if (!savedToken) return;

    firebaseApi('/api/auth/me', {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setAuthToken(savedToken);
          setUser(data.user);
        } else {
          // Token is invalid or expired
          localStorage.removeItem('meome_token');
          sessionStorage.removeItem('meome_token');
          setAuthToken(null);
        }
      })
      .catch(() => {
        // In case of transient network issue, keep token so user is not logged out unnecessarily
      });
  }, []);

  // Real-time Firestore listener for Characters
  useEffect(() => {
    const unsubscribe = subscribeToCharacters((firestoreChars) => {
      setCharacters((prev) => {
        const ownedSet = new Set(prev.filter((p) => p.isOwned).map((p) => p.id));
        const merged = firestoreChars
          .filter((c) => c.isAvailable !== false)
          .map((c) => ({
            ...c,
            isOwned: ownedSet.has(c.id),
          }));
        try {
          localStorage.setItem('meome_characters_cache', JSON.stringify(merged));
        } catch {}
        return merged;
      });
    });
    return () => unsubscribe();
  }, []);

  // Handle immediate characters update from Admin actions & sync to cache
  const handleUpdateCharacters = (newChars: Character[]) => {
    setCharacters((prev) => {
      const ownedSet = new Set(prev.filter((p) => p.isOwned).map((p) => p.id));
      const merged = newChars.map((c) => ({
        ...c,
        isOwned: ownedSet.has(c.id),
      }));
      try {
        localStorage.setItem('meome_characters_cache', JSON.stringify(merged));
      } catch {}
      return merged;
    });
  };

  // Fetch Characters
  const fetchCharacters = async () => {
    try {
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await firebaseApi(`/api/characters?t=${Date.now()}`, { headers });
      const data = await res.json();
      if (res.ok && Array.isArray(data.characters)) {
        setCharacters((prev) => {
          const ownedSet = new Set(prev.filter((p) => p.isOwned).map((p) => p.id));
          const updated = data.characters.map((c: Character) => ({
            ...c,
            isOwned: ownedSet.has(c.id) || Boolean((c as any).isOwned),
          }));
          try {
            localStorage.setItem('meome_characters_cache', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
    }
  };

  // Fetch Inventory
  const fetchInventory = async () => {
    if (!authToken) {
      setInventoryItems([]);
      return;
    }
    try {
      const res = await firebaseApi('/api/inventory', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setInventoryItems(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    fetchCharacters();
    fetchInventory();
  }, [authToken]);

  // Auth Success handler with Remember Me support
  const handleAuthSuccess = (loggedUser: User, token: string, rememberMe: boolean = true) => {
    setUser(loggedUser);
    setAuthToken(token);

    if (rememberMe) {
      // Persistent storage across browser sessions / restarts
      localStorage.setItem('meome_token', token);
      sessionStorage.removeItem('meome_token');
    } else {
      // Session storage only (cleared when browser / tab closes)
      sessionStorage.setItem('meome_token', token);
      localStorage.removeItem('meome_token');
    }
  };

  // Logout handler - clears both local and session storage, and revokes server session
  const handleLogout = () => {
    if (authToken) {
      firebaseApi('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('meome_token');
    sessionStorage.removeItem('meome_token');
    setShowAdmin(false);
    setActiveTab('shop');
  };

  // Handle successful purchase
  const handleBuySuccess = (receipt: OrderReceipt, newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
    setActiveReceipt(receipt);
    // Optimistically update character ownership immediately so button transitions instantly to "VÀO KHO"
    setCharacters((prev) =>
      prev.map((c) => (c.id === receipt.characterId ? { ...c, isOwned: true } : c))
    );
    setInspectingCharacter((prev) =>
      prev && prev.id === receipt.characterId ? { ...prev, isOwned: true } : prev
    );
    fetchCharacters();
    fetchInventory();
  };

  // Step 1 of Purchase Flow: Open cute Confirmation Pop-up instead of immediate deduct
  const handleRequestBuy = (character: Character) => {
    if (!user || !authToken) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setConfirmBuyChar(character);
  };

  // Step 2 of Purchase Flow: User clicked "ĐỒNG Ý" -> execute atomic server transaction
  const handleConfirmPurchase = async () => {
    if (!confirmBuyChar || !authToken || isProcessingBuy) return;
    setIsProcessingBuy(true);
    try {
      const res = await firebaseApi('/api/shop/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ characterId: confirmBuyChar.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || ("Hiện số xu cá của quý khách không đủ mua " + confirmBuyChar.name + ", hãy kiếm thêm xu cá và quay lại chọn mua cá nhé -`♡´- "));
        return;
      }

      // Close confirmation modal and immediately display official Receipt modal!
      setConfirmBuyChar(null);
      handleBuySuccess(data.receipt, data.updatedBalance);
    } catch (err: any) {
      alert(err.message || ("Hiện số xu cá của quý khách không đủ mua " + confirmBuyChar.name + ", hãy kiếm thêm xu cá và quay lại chọn mua cá nhé -`♡´- "));
    } finally {
      setIsProcessingBuy(false);
    }
  };

  // Send Feedback
  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim() || !authToken) return;

    try {
      const res = await firebaseApi('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content: feedbackContent, type: 'suggestion' }),
      });
      if (res.ok) {
        setFeedbackSent(true);
        setTimeout(() => {
          setFeedbackSent(false);
          setShowFeedbackModal(false);
          setFeedbackContent('');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onEnterShop={() => setCurrentView('main')}
          onOpenAuth={() => {
            setAuthMode('login');
            setIsAuthModalOpen(true);
          }}
          isLoggedIn={!!user}
          username={user?.username}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
        />
      </>
    );
  }

  // Render Full-Screen Cat Town Game Mode (Hiding Header and Sidebar)
  if (activeTab === 'cat_town') {
    return (
      <div
        className="relative min-h-screen w-full bg-[#f8cad8] text-[#795653] flex flex-col selection:bg-[#FF8FAB]/30"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Background matching main web design */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
          <img
            src="/assets/aistudio/image_acaed8f2.png"
            alt="Mèo Mê Cá Khô Background"
            className="w-full h-full object-cover object-top opacity-45"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="absolute inset-0 bg-[#f7a8c4]/20 mix-blend-multiply pointer-events-none" />
        </div>

        <main className="relative z-10 w-full min-h-screen flex flex-col">
          <CatTownSection
            authToken={authToken}
            username={user?.username || 'Khách Mèo'}
            userBalance={user?.balance || 0}
            isAdmin={user?.role === 'admin'}
            onBalanceUpdated={(newBal) => {

              if (user) setUser({ ...user, balance: newBal });
            }}
            onOpenAuth={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
            onExitToShop={() => setActiveTab('shop')}
          />
        </main>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
        />
      </div>
    );
  }

  // Render Main Web (2 Columns: Sidebar + Main Content)
  return (
    <div className="relative min-h-screen bg-[#f8cad8] text-[#795653] flex flex-col selection:bg-[#F6A6B8]/30">
      {/* Background matching design of landing page: Scalloped lace trim, soft pink aura & dreamy stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <img
          src="/assets/aistudio/image_acaed8f2.png"
          alt="Mèo Mê Cá Khô Background"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-[#f7a8c4]/20 mix-blend-multiply pointer-events-none" />
      </div>

      {/* ================= HEADER / TOP BAR ================= */}
      <header className="sticky top-0 z-30 bg-[#FFF9F4]/90 backdrop-blur-md border-b-2 border-[#795653]/15 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('landing')}
              className="flex items-center group cursor-pointer"
              title="Về mặt tiền tiệm cá"
            >
              <img
                src="https://i.postimg.cc/TPjt5rnx/b24a8c9f-0a83-491c-9de4-aa41c4e77342.png"
                alt="Mèo Mê Cá Khô"
                referrerPolicy="no-referrer"
                className="h-11 sm:h-12 w-auto object-contain rounded-2xl shadow-xs group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </button>
          </div>

          {/* User Status Bar */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Admin Access Badge */}
                {user.role === 'admin' && (
                  <button
                    onClick={() => setShowAdmin(!showAdmin)}
                    className={`py-1.5 px-3 rounded-full text-xs font-black border transition-all flex items-center gap-1.5 ${
                      showAdmin
                        ? 'bg-[#F7DDA0] text-[#795653] border-[#795653]/30 shadow-xs'
                        : 'bg-[#FFF9F4] text-[#795653] border-[#F7DDA0] hover:bg-[#F7DDA0]/30'
                    }`}
                  >
                    <span>👑</span>
                    <span className="hidden sm:inline">Trang Quản Trị</span>
                  </button>
                )}

                {/* Fish Coin Wallet Balance Badge with 3D Liquid Glass */}
                <button
                  onClick={() => {
                    setShowAdmin(false);
                    setActiveTab('wallet');
                  }}
                  className="liquid-glass-btn relative overflow-hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/80 text-[#D6336C] shadow-xs cursor-pointer select-none"
                  title="Nhấn để xem Ví Xu Cá"
                >
                  <span className="shimmer-liquid" />
                  <span
                    className="relative z-10 flex items-center gap-1.5"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
                  >
                    <XuCaIcon className="w-5 h-5 object-contain shrink-0" />
                    <span
                      className="text-xs sm:text-sm tabular-nums"
                      style={{ fontFamily: "'Cal Sans', sans-serif" }}
                    >
                      {user.balance}
                    </span>
                    <span
                      className="text-[11px] hidden sm:inline"
                      style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal' }}
                    >
                      Xu Cá
                    </span>
                  </span>
                </button>

                {/* User Info & Logout */}
                <div className="flex items-center gap-2 pl-1 border-l border-[#795653]/20">
                  <span
                    className="text-xs hidden lg:inline"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'normal', color: '#E13F7C' }}
                  >
                    {user.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-xl hover:bg-[#795653]/10 text-[#795653]/70 hover:text-[#A6536A] transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="py-2 px-4 rounded-2xl font-bold text-xs shadow-xs border border-[#A6536A]/30 transition-all"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C', backgroundColor: '#FBEFEF' }}
              >
                Đăng Nhập / Đăng Ký
              </button>
            )}

            {/* Back to landing button */}
            <button
              onClick={() => setCurrentView('landing')}
              className="p-2 rounded-xl border border-[#795653]/20 hover:bg-[#795653]/10 text-xs font-bold hidden sm:flex items-center gap-1"
              style={{ color: '#E13F7C' }}
              title="Về trang bìa"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTAINER (SIDEBAR 25% + MAIN CONTENT 75%) ================= */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* DESKTOP SIDEBAR (22% - 25% width, sticky) */}
        <aside className="hidden md:block w-64 lg:w-72 shrink-0">
          <div className="sticky top-20 space-y-4">
            {/* Navigation Card */}
            <nav className="bg-[#FFF9F4]/90 backdrop-blur-md p-3 rounded-3xl border-2 border-[#795653]/20 shadow-kawaii space-y-2">
              {/* 1. QUẦY CÁ */}
              <button
                onClick={() => {
                  setShowAdmin(false);
                  setActiveTab('shop');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer overflow-hidden relative ${
                  !showAdmin && activeTab === 'shop'
                    ? 'liquid-glass-btn text-[#D6336C] border-2 border-white/90 shadow-md scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-[#795653]/85 border border-white/80 hover:border-[#F6A6B8]/50 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {!showAdmin && activeTab === 'shop' && <span className="shimmer-liquid" />}
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="text-lg">🐟</span>
                  <span
                    className="uppercase font-bold"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#E13F7C' }}
                  >
                    1. QUẦY CÁ
                  </span>
                </div>
                <span
                  className={`relative z-10 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    !showAdmin && activeTab === 'shop' ? 'bg-[#D6336C] text-white shadow-xs' : 'bg-white/80'
                  }`}
                  style={{
                    fontFamily: "'Cal Sans', sans-serif",
                    fontWeight: 'bold',
                    color: !showAdmin && activeTab === 'shop' ? '#ffffff' : '#E13F7C',
                  }}
                >
                  {characters.length}
                </span>
              </button>

              {/* QUẦY GIA VỊ (Spice Counter) - Đặt ngay dưới QUẦY CÁ */}
              <button
                onClick={() => {
                  setShowAdmin(false);
                  setActiveTab('spice_counter');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer overflow-hidden relative ${
                  !showAdmin && activeTab === 'spice_counter'
                    ? 'liquid-glass-btn text-[#D6336C] border-2 border-white/90 shadow-md scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-[#795653]/85 border border-white/80 hover:border-[#F6A6B8]/50 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {!showAdmin && activeTab === 'spice_counter' && <span className="shimmer-liquid" />}
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="text-lg">🧂</span>
                  <span
                    className="uppercase font-bold"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#E13F7C' }}
                  >
                    QUẦY GIA VỊ
                  </span>
                </div>
                <span className="relative z-10 text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF8FAB]/25 text-[#D6336C] font-black uppercase">
                  WIKI 🧂
                </span>
              </button>

              {/* 2. GIỎ CÁ */}
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setShowAdmin(false);
                  setActiveTab('inventory');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer overflow-hidden relative ${
                  !showAdmin && activeTab === 'inventory'
                    ? 'liquid-glass-btn text-[#D6336C] border-2 border-white/90 shadow-md scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-[#795653]/85 border border-white/80 hover:border-[#F6A6B8]/50 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {!showAdmin && activeTab === 'inventory' && <span className="shimmer-liquid" />}
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="text-lg">🧺</span>
                  <span
                    className="uppercase font-bold"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#E13F7C' }}
                  >
                    2. GIỎ CÁ
                  </span>
                </div>
                <span
                  className={`relative z-10 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    !showAdmin && activeTab === 'inventory' ? 'bg-[#D6336C] text-white shadow-xs' : 'bg-white/80'
                  }`}
                  style={{
                    fontFamily: "'Cal Sans', sans-serif",
                    fontWeight: 'bold',
                    color: !showAdmin && activeTab === 'inventory' ? '#ffffff' : '#E13F7C',
                  }}
                >
                  {inventoryItems.length}
                </span>
              </button>

              {/* 3. Ví Xu Cá */}
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setShowAdmin(false);
                  setActiveTab('wallet');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer overflow-hidden relative ${
                  !showAdmin && activeTab === 'wallet'
                    ? 'liquid-glass-btn text-[#D6336C] border-2 border-white/90 shadow-md scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-[#795653]/85 border border-white/80 hover:border-[#F6A6B8]/50 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {!showAdmin && activeTab === 'wallet' && <span className="shimmer-liquid" />}
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="text-lg">👛</span>
                  <span
                    className="uppercase font-bold"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#E13F7C' }}
                  >
                    3. VÍ XU CÁ
                  </span>
                </div>
                <span
                  className={`relative z-10 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    !showAdmin && activeTab === 'wallet' ? 'bg-[#D6336C] text-white shadow-xs' : 'bg-white/80'
                  }`}
                  style={{
                    fontFamily: "'Cal Sans', sans-serif",
                    fontWeight: 'bold',
                    color: !showAdmin && activeTab === 'wallet' ? '#ffffff' : '#E13F7C',
                  }}
                >
                  {user ? `${user.balance} XU` : ''}
                </span>
              </button>

              {/* 4. Kiếm Xu Cá */}
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setShowAdmin(false);
                  setActiveTab('quests');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer overflow-hidden relative ${
                  !showAdmin && activeTab === 'quests'
                    ? 'liquid-glass-btn text-[#D6336C] border-2 border-white/90 shadow-md scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-[#795653]/85 border border-white/80 hover:border-[#F6A6B8]/50 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {!showAdmin && activeTab === 'quests' && <span className="shimmer-liquid" />}
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="text-lg">✨</span>
                  <span
                    className="uppercase font-bold"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#E13F7C' }}
                  >
                    4. KIẾM XU CÁ
                  </span>
                </div>
              </button>

              {/* 5. Phiếu Đặt Cá */}
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setShowAdmin(false);
                  setActiveTab('special_order');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer overflow-hidden relative ${
                  !showAdmin && activeTab === 'special_order'
                    ? 'liquid-glass-btn text-[#D6336C] border-2 border-white/90 shadow-md scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-[#795653]/85 border border-white/80 hover:border-[#F6A6B8]/50 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {!showAdmin && activeTab === 'special_order' && <span className="shimmer-liquid" />}
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="text-lg">📝</span>
                  <span
                    className="uppercase font-bold"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#E13F7C' }}
                  >
                    5. PHIẾU ĐẶT CÁ
                  </span>
                </div>
              </button>

              {/* 6. THỊ TRẤN CÁ MÈO */}
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setShowCatTownConfirmModal(true);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer overflow-hidden relative ${
                  !showAdmin && (activeTab as string) === 'cat_town'
                    ? 'liquid-glass-btn text-[#D6336C] border-2 border-white/90 shadow-md scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-[#795653]/85 border border-white/80 hover:border-[#F6A6B8]/50 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {!showAdmin && (activeTab as string) === 'cat_town' && <span className="shimmer-liquid" />}
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="text-lg">🏘️</span>
                  <span
                    className="uppercase font-bold"
                    style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#E13F7C' }}
                  >
                    6. THỊ TRẤN CÁ MÈO
                  </span>
                </div>
                <span className="relative z-10 text-[10px] px-2 py-0.5 rounded-full bg-[#FF8FAB]/25 text-[#D6336C] font-black uppercase">
                  Mới 🐾
                </span>
              </button>
            </nav>

            {/* Shop Slogan & Community Box */}
            <div className="bg-[#FFF9F4] p-4 rounded-3xl border border-[#795653]/20 text-xs space-y-2">
              <div className="flex items-center gap-1.5">
                <span>🎀</span>
                <span style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold', color: '#E13F7C' }}>Lời Nhắn Tiệm Cá</span>
              </div>
              <p
                className="text-[#795653]/75 leading-relaxed"
                style={{ fontFamily: "'Cal Sans', sans-serif", fontStyle: 'italic' }}
              >
                Cảm ơn quý khách đã ghé qua cửa hàng bán cá khô của MMCK. Trong quá trình trải nghiệm có vấn đề nào chưa hài lòng, hãy nhắn tin cho chủ Mèo qua facebook “Mèo Mê Cá Khô” hoặc gửi ý kiến bên dưới nhé 𖾕𖾝꙼ᩚ𛲕𖾟 
              </p>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-white border border-[#795653]/20 hover:bg-[#F6A6B8]/20 text-[#795653] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircleHeart className="w-3.5 h-3.5" style={{ color: '#E13F7C' }} />
                <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}>Gửi lời nhắn / Góp ý</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ================= MAIN CONTENT AREA (75% - 78% width) ================= */}
        <main className="flex-1 min-w-0 pb-20 md:pb-8">
          {showAdmin && user?.role === 'admin' ? (
            <AdminDashboard
              authToken={authToken!}
              onClose={() => {
                setShowAdmin(false);
                setAdminEditingCharacter(null);
              }}
              onRefreshCharacters={() => {
                fetchCharacters();
                fetchInventory();
              }}
              onUpdateCharacters={handleUpdateCharacters}
              initialEditingCharacter={adminEditingCharacter}
            />
          ) : activeTab === 'shop' ? (
            <ShopSection
              characters={characters}
              onRequestBuy={handleRequestBuy}
              onViewDetails={(char) => setInspectingCharacter(char)}
              onGoToInventory={() => setActiveTab('inventory')}
              onOpenStory={(char) => setStoryChar(char)}
              onOpenComplain={(char) => setComplainChar(char)}
              onOpenFitBach={(char) => setFitbachChar(char)}
              onOpenAuth={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              isLoggedIn={!!user}
              userBalance={user?.balance || 0}
              isAdmin={user?.role === 'admin'}
              onAdminEdit={(char) => {
                setAdminEditingCharacter(char);
                setShowAdmin(true);
              }}
            />
          ) : activeTab === 'spice_counter' ? (
            <SpiceCounterSection
              authToken={authToken}
              isAdmin={user?.role === 'admin'}
              onOpenAuth={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              onGoToShop={() => setActiveTab('shop')}
            />
          ) : activeTab === 'inventory' ? (
            <InventorySection
              items={inventoryItems}
              onGoToShop={() => setActiveTab('shop')}
              onOpenReceipt={(receipt) => setActiveReceipt(receipt)}
              onOpenStory={(char) => setStoryChar(char)}
              onOpenComplain={(char) => setComplainChar(char)}
              onOpenFitBach={(char) => setFitbachChar(char)}
            />
          ) : activeTab === 'wallet' ? (
            <WalletSection
              username={user?.username || 'Khách'}
              balance={user?.balance || 0}
              authToken={authToken}
              onBalanceUpdated={(newBal) => {
                if (user) setUser({ ...user, balance: newBal });
              }}
              onGoToVouchers={() => setActiveTab('quests')}
            />
          ) : activeTab === 'quests' ? (
            <QuestsAndGachaSection
              authToken={authToken}
              userBalance={user?.balance || 0}
              onBalanceUpdated={(newBal) => {
                if (user) setUser({ ...user, balance: newBal });
              }}
              defaultTab="quests"
              onNavigateToWalletVouchers={() => setActiveTab('wallet')}
            />
          ) : (
            <SpecialOrderSection
              user={user}
              authToken={authToken}
              onOpenAuth={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              onGoToShop={() => setActiveTab('shop')}
            />
          )}
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF9F4] border-t-2 border-[#795653]/20 shadow-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => {
            setShowAdmin(false);
            setActiveTab('shop');
          }}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] uppercase font-bold transition-colors ${
            !showAdmin && activeTab === 'shop' ? 'text-[#D6336C]' : 'text-[#795653]/70'
          }`}
          style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold' }}
        >
          <span className="text-base">🐟</span>
          <span>QUẦY CÁ</span>
        </button>

        <button
          onClick={() => {
            setShowAdmin(false);
            setActiveTab('spice_counter');
          }}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] uppercase font-bold transition-colors ${
            !showAdmin && activeTab === 'spice_counter' ? 'text-[#D6336C]' : 'text-[#795653]/70'
          }`}
          style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold' }}
        >
          <span className="text-base">🧂</span>
          <span>GIA VỊ</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            setShowAdmin(false);
            setActiveTab('inventory');
          }}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] uppercase font-bold transition-colors ${
            !showAdmin && activeTab === 'inventory' ? 'text-[#D6336C]' : 'text-[#795653]/70'
          }`}
          style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold' }}
        >
          <span className="text-base">🧺</span>
          <span>GIỎ CÁ ({inventoryItems.length})</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            setShowAdmin(false);
            setActiveTab('wallet');
          }}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] uppercase font-bold transition-colors ${
            !showAdmin && activeTab === 'wallet' ? 'text-[#D6336C]' : 'text-[#795653]/70'
          }`}
          style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold' }}
        >
          <span className="text-base">👛</span>
          <span>VÍ XU</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            setShowAdmin(false);
            setActiveTab('quests');
          }}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] uppercase font-bold transition-colors ${
            !showAdmin && activeTab === 'quests' ? 'text-[#D6336C]' : 'text-[#795653]/70'
          }`}
          style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold' }}
        >
          <span className="text-base">✨</span>
          <span>KIẾM XU</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            setShowAdmin(false);
            setActiveTab('special_order');
          }}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] uppercase font-bold transition-colors ${
            !showAdmin && activeTab === 'special_order' ? 'text-[#D6336C]' : 'text-[#795653]/70'
          }`}
          style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold' }}
        >
          <span className="text-base">📝</span>
          <span>ĐẶT CÁ</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            setShowCatTownConfirmModal(true);
          }}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] uppercase font-bold transition-colors ${
            !showAdmin && (activeTab as string) === 'cat_town' ? 'text-[#D6336C]' : 'text-[#795653]/70'
          }`}
          style={{ fontFamily: "'Cal Sans', sans-serif", fontWeight: 'bold' }}
        >
          <span className="text-base">🏘️</span>
          <span>THỊ TRẤN</span>
        </button>
      </div>

      {/* ================= MODALS ================= */}
      {/* 1. Official Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* 2. Character Detail Modal */}
      <CharacterDetailModal
        character={inspectingCharacter}
        onClose={() => setInspectingCharacter(null)}
        onBuy={(char) => {
          setInspectingCharacter(null);
          handleRequestBuy(char);
        }}
        isAdmin={user?.role === 'admin'}
        onAdminEdit={(char) => {
          setInspectingCharacter(null);
          setAdminEditingCharacter(char);
          setShowAdmin(true);
        }}
      />

      {/* 3. Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      {/* 4. Purchase Confirmation Modal */}
      <PurchaseConfirmModal
        character={confirmBuyChar}
        isOpen={!!confirmBuyChar}
        onClose={() => {
          if (!isProcessingBuy) setConfirmBuyChar(null);
        }}
        onConfirm={handleConfirmPurchase}
        isProcessing={isProcessingBuy}
        userBalance={user?.balance || 0}
      />

      {/* 5. Story Modal (Back-story & Open-scene) */}
      <StoryModal
        character={storyChar}
        isOpen={!!storyChar}
        onClose={() => setStoryChar(null)}
      />

      {/* 6. Complain Modal (Báo lỗi nhân vật) */}
      <ComplainModal
        character={complainChar}
        isOpen={!!complainChar}
        onClose={() => setComplainChar(null)}
        authToken={authToken}
        onRequireAuth={() => {
          setComplainChar(null);
          setAuthMode('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* 7. FÍT BÁCH Modal (Đánh giá & Review) */}
      <FitBachModal
        character={fitbachChar}
        isOpen={!!fitbachChar}
        onClose={() => setFitbachChar(null)}
        authToken={authToken}
        currentUsername={user?.username}
        onRequireAuth={() => {
          setFitbachChar(null);
          setAuthMode('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* 8. Feedback Modal */}
      {showFeedbackModal && (
        <div
          onClick={() => setShowFeedbackModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-6 text-[#795653] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <button
              type="button"
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#795653]/10 text-[#795653]/70 hover:text-[#795653] transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-[#795653] mb-1">
              Gửi Góp Ý / Báo Lỗi Cho Tiệm 💌
            </h3>
            <p className="text-xs text-[#795653]/70 mb-4">
              Ý kiến của bà giúp tiệm ngày càng nhiều nam chính xịn sò hơn!
            </p>

            {feedbackSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                ✓ Tiệm đã nhận được lời nhắn của bà, cảm ơn bà nhiều nhé!
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-3">
                <textarea
                  rows={4}
                  required
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Nhập cảm nhận hoặc yêu cầu nam chính mới..."
                  className="w-full p-3 rounded-2xl border border-[#795653]/25 bg-white text-xs text-[#795653] focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8]"
                />
                <button
                  type="submit"
                  disabled={!authToken}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] text-[#795653] font-bold text-xs disabled:opacity-50 cursor-pointer"
                >
                  {authToken ? 'GỬI LỜI NHẮN' : 'VUI LÒNG ĐĂNG NHẬP ĐỂ GỬI'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. Cat Town Train Departure Confirmation Modal */}
      {showCatTownConfirmModal && (
        <div
          onClick={() => setShowCatTownConfirmModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm sm:max-w-md bg-[#FFF9F4] rounded-3xl border-2 border-[#FFB3C6] p-6 sm:p-7 text-center animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto cursor-default"
            style={{
              boxShadow: '0 20px 45px -15px rgba(225, 63, 124, 0.3), 0 0 0 1px #FFB3C6',
            }}
          >
            {/* Cute Train Stamp */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FFE5EC] border-2 border-[#FFB3C6] flex items-center justify-center text-3xl shadow-xs">
              🚂
            </div>

            {/* Title */}
            <h3
              className="text-lg sm:text-xl font-black text-[#D6336C] tracking-wide mb-3"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              LÊN TÀU ĐẾN THỊ TRẤN CÁ MÈO?
            </h3>

            {/* Message */}
            <p
              className="text-xs sm:text-sm font-semibold text-[#795653] leading-relaxed mb-6 px-1"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              Quý khách muốn lên trạm tàu đến Thị trấn Cá Mèo?
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowCatTownConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-[#FFE5EC] border-2 border-[#795653]/20 text-[#795653] font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-2xs"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCatTownConfirmModal(false);
                  setShowAdmin(false);
                  setActiveTab('cat_town');
                }}
                className="liquid-glass-btn relative overflow-hidden flex-1 py-3 px-5 rounded-full font-black text-sm sm:text-base tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none active:outline-hidden transition-all duration-300"
                style={{
                  color: '#D6336C',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.95)',
                  fontFamily: "'Cal Sans', sans-serif",
                }}
              >
                {/* Shimmer sweep effect like 'sốp ping chọn cá' */}
                <span className="shimmer-liquid" />
                <span className="relative z-10 tracking-wide font-black">
                  Đi thoai ﹏𓊝﹏
                </span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
