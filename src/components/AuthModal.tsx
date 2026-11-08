import React, { useState } from 'react';
import { X, Lock, User as UserIcon, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';
import { User } from '../types.ts';
import { firebaseApi } from '../firebase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token: string, rememberMe: boolean) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await firebaseApi(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
      }

      // Auto-login persistent token dispatch (never stores raw password)
      onSuccess(data.user, data.token, rememberMe);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div
      onClick={() => {
        if (!isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/45 backdrop-blur-xs transition-opacity duration-200"
    >
      <div 
        className="relative w-full max-w-md bg-[#FFF9F4] rounded-3xl border-2 border-[#795653]/30 shadow-2xl p-6 sm:p-7 text-[#795653] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#FFF9F4] border border-[#795653]/20 hover:bg-[#F6A6B8]/20 transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5 text-[#795653]" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F6A6B8]/20 text-2xl mb-2 border border-[#F6A6B8]/40">
            🐾
          </div>
          <h3
            className="text-2xl font-black tracking-tight"
            style={{ color: '#E13F7C', fontFamily: "'Cal Sans', sans-serif" }}
          >
            {mode === 'login' ? 'Đăng Nhập Tiệm Cá' : 'Gia Nhập Tiệm Cá Khô'}
          </h3>
          <p
            className="text-xs text-[#795653]/70 mt-1"
            style={{ fontFamily: "'Calistoga', serif" }}
          >
            Chuyên bán cá khô, tiện thể nuôi vài nam chính.
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex p-1 bg-[#795653]/10 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#FFF9F4] text-[#795653] shadow-xs'
                : 'text-[#795653]/70 hover:text-[#795653]'
            }`}
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#F6A6B8] text-[#795653] shadow-xs'
                : 'text-[#795653]/70 hover:text-[#795653]'
            }`}
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            Đăng Ký Tài Khoản
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form with browser autofill optimization */}
        <form
          id="auth-form"
          name="authForm"
          autoComplete="on"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Username Input with standard autocomplete */}
          <div>
            <label
              htmlFor="auth-username"
              className="block text-xs font-bold text-[#795653] mb-1"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              Tên đăng nhập (Username)
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795653]/50 pointer-events-none" />
              <input
                id="auth-username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: meomayman, tieuthu..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#795653]/30 bg-white/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8] text-sm text-[#795653] font-medium"
              />
            </div>
          </div>

          {/* Password Input with Show/Hide toggle and current/new autocomplete */}
          <div>
            <label
              htmlFor={mode === 'login' ? 'auth-current-password' : 'auth-new-password'}
              className="block text-xs font-bold text-[#795653] mb-1"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              Mật khẩu (Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795653]/50 pointer-events-none" />
              <input
                id={mode === 'login' ? 'auth-current-password' : 'auth-new-password'}
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu an toàn..."
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-[#795653]/30 bg-white/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#F6A6B8] text-sm text-[#795653] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#795653]/60 hover:text-[#795653] rounded-lg transition-colors cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Checkbox "Ghi nhớ đăng nhập" (không áp dụng cho admin) */}
          {mode === 'login' ? (
            (() => {
              const isAdminInput = username.trim().toLowerCase() === 'meomecakho@6104' || username.trim().toLowerCase() === 'admin';
              return (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="remember-me-checkbox"
                      name="rememberMe"
                      checked={isAdminInput ? false : rememberMe}
                      disabled={isAdminInput}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#F6A6B8] border-[#795653]/40 rounded-sm focus:ring-[#F6A6B8] accent-[#F6A6B8] cursor-pointer disabled:opacity-40"
                    />
                    <span
                      className="text-xs font-semibold text-[#795653]"
                      style={{ fontFamily: "'Cal Sans', sans-serif" }}
                    >
                      Ghi nhớ đăng nhập
                    </span>
                  </label>
                  <span className="text-[11px] text-[#795653]/60">
                    {isAdminInput ? 'Admin không tự động lưu' : 'Tự động đăng nhập lần sau'}
                  </span>
                </div>
              );
            })()
          ) : (
            /* Mandatory notice when registering without email/phone */
            <div className="p-3 rounded-2xl bg-[#F7DDA0]/25 border border-[#F7DDA0] text-[#795653] text-[11px] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-[#795653] shrink-0 mt-0.5" />
              <div>
                <strong>Lưu ý quan trọng:</strong> Do không sử dụng email/SĐT, khả năng tự khôi phục mật khẩu sẽ bị hạn chế. Vui lòng ghi nhớ kỹ mật khẩu hoặc liên hệ Admin khi cần hỗ trợ.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="liquid-glass-btn relative w-full py-3.5 px-4 rounded-2xl text-[#795653] font-black text-sm tracking-wide flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            <span className="shimmer-liquid" />
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                <span
                  className="animate-pulse"
                  style={{ fontFamily: "'Alfa Slab One', cursive", color: '#E13F7C', fontWeight: 'normal' }}
                >
                  ĐANG KẾT NỐI...
                </span>
              ) : mode === 'login' ? (
                <span style={{ fontFamily: "'Alfa Slab One', cursive", color: '#E13F7C', fontWeight: 'normal' }}>
                  ĐĂNG NHẬP NGAY
                </span>
              ) : (
                <span style={{ fontFamily: "'Alfa Slab One', cursive", color: '#E13F7C', fontWeight: 'normal' }}>
                  TẠO TÀI KHOẢN NGAY
                </span>
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

