import React, { useState, useEffect } from 'react';
import { User, AdminTodo } from '../types.ts';
import {
  getAdminSecretaryStats,
  subscribeToAdminTodos,
  addAdminTodo,
  toggleAdminTodo,
  deleteAdminTodo,
} from '../firebase.ts';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Users,
  Fish,
  Mail,
  Sparkles,
  X,
  Clock,
  Loader2,
} from 'lucide-react';

interface AdminSecretaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: User | null;
  previousLoginAt?: string;
  onOpenAdminPanel?: () => void;
}

export const AdminSecretaryModal: React.FC<AdminSecretaryModalProps> = ({
  isOpen,
  onClose,
  adminUser,
  previousLoginAt,
  onOpenAdminPanel,
}) => {
  const [stats, setStats] = useState<{
    newUsersCount: number;
    fishSoldCount: number;
    fishSoldDetails?: { characterName: string; count: number }[];
    newRequestsCount: number;
    previousLoginAt: string;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  // To-Do list state
  const [todos, setTodos] = useState<AdminTodo[]>([]);
  const [newTodoInput, setNewTodoInput] = useState<string>('');
  const [isSubmittingTodo, setIsSubmittingTodo] = useState<boolean>(false);

  // Fetch report stats and subscribe to admin_todos
  useEffect(() => {
    if (!isOpen || !adminUser || adminUser.role !== 'admin') return;

    setIsLoadingStats(true);
    const prevTime = previousLoginAt || adminUser.previousLoginAt || adminUser.createdAt;

    getAdminSecretaryStats(prevTime)
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error('Failed to load secretary stats:', err);
      })
      .finally(() => {
        setIsLoadingStats(false);
      });

    // Real-time listener for admin_todos
    const unsubscribe = subscribeToAdminTodos((todoList) => {
      setTodos(todoList);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, adminUser, previousLoginAt]);

  if (!isOpen || !adminUser || adminUser.role !== 'admin') return null;

  // Format previous login timestamp
  const formatTimeStr = (isoString?: string) => {
    if (!isoString) return 'Lần đăng nhập gần nhất';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Handle adding new To-Do item
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodoInput.trim();
    if (!text || isSubmittingTodo) return;

    setIsSubmittingTodo(true);
    try {
      await addAdminTodo(text);
      setNewTodoInput('');
    } catch (err) {
      console.error('Failed to add admin todo:', err);
    } finally {
      setIsSubmittingTodo(false);
    }
  };

  // Handle toggling To-Do status
  const handleToggleTodo = async (todo: AdminTodo) => {
    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
    try {
      await toggleAdminTodo(todo.id, todo.isCompleted);
    } catch (err) {
      console.error('Failed to toggle admin todo:', err);
    }
  };

  // Handle deleting a To-Do item
  const handleDeleteTodo = async (todoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
    try {
      await deleteAdminTodo(todoId);
    } catch (err) {
      console.error('Failed to delete admin todo:', err);
    }
  };

  const pendingTodosCount = todos.filter((t) => !t.isCompleted).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Clipboard Frame Wrapper */}
      <div
        className="relative w-full max-w-lg bg-[#FFF9F4] rounded-3xl border-4 border-[#795653] shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col cursor-default animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 40px rgba(121, 86, 83, 0.35), 6px 6px 0px #795653',
        }}
      >
        {/* Retro Wooden Clipboard Clip Accent at the Top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#C89D7C] border-3 border-[#795653] rounded-b-xl shadow-md flex items-center justify-center z-10">
          <div className="w-12 h-2 bg-[#795653]/30 rounded-full" />
        </div>

        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-rose-100 border-2 border-[#795653] flex items-center justify-center text-[#795653] cursor-pointer transition-colors z-20"
          title="Đóng báo cáo"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Secretary Cat Avatar & Title */}
        <div className="pt-2 text-center pb-3 border-b-2 border-dashed border-[#795653]/25 shrink-0">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FFE5EC] border-3 border-[#795653] shadow-[3px_3px_0px_#795653] mb-2 text-3xl select-none animate-bounce">
            🐱
          </div>
          <h2
            className="text-xl sm:text-2xl font-black text-[#795653] tracking-tight uppercase"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            BÁO CÁO CỦA THƯ KÝ MÈO 🐾
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#795653]/80 font-bold mt-1">
            <Clock className="w-3.5 h-3.5 text-[#E13F7C]" />
            <span style={{ fontFamily: "'Cal Sans', sans-serif" }}>
              Kể từ lần trước: <strong className="text-[#E13F7C]">{formatTimeStr(stats?.previousLoginAt || previousLoginAt || adminUser.previousLoginAt)}</strong>
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 py-3.5 pr-1 custom-scrollbar flex-1">
          {/* STATS SECTION */}
          <div
            className="bg-white/85 rounded-2xl border-2 border-[#795653]/25 p-3.5 sm:p-4 shadow-xs space-y-2.5"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            <div className="text-[11px] font-black uppercase tracking-wider text-[#A6536A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E13F7C]" />
              <span>Biến động tại Tiệm Mèo Mê Cá Khô</span>
            </div>

            {isLoadingStats ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs font-bold text-[#795653]/70">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF8FAB]" />
                <span>Thư ký mèo đang tra cứu sổ sách...</span>
              </div>
            ) : (
              <div className="space-y-2 font-bold text-xs sm:text-sm text-[#795653]">
                {/* 1. New users */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9F4] border border-[#795653]/15 hover:border-[#FF8FAB] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👤</span>
                    <span>Khách hàng mới đăng ký tài khoản</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3FC] text-[#0A5EB0] border border-[#A9C5F2] font-black text-xs sm:text-sm tabular-nums">
                    +{stats?.newUsersCount ?? 0} khách
                  </span>
                </div>

                {/* 2. Chi tiết các đơn cá khô đã chốt */}
                <div className="p-3 rounded-xl bg-[#FFF9F4] border border-[#795653]/15 hover:border-[#FF8FAB] transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🐟</span>
                      <span className="font-bold text-xs sm:text-sm">Tiệm vừa chốt được các đơn cá khô sau:</span>
                    </div>
                    {stats && stats.fishSoldCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFE5EC] text-[#D81C63] border border-[#FF8FAB]/40 font-black text-xs tabular-nums">
                        +{stats.fishSoldCount} bé cá
                      </span>
                    )}
                  </div>

                  {stats?.fishSoldDetails && stats.fishSoldDetails.length > 0 ? (
                    <ul className="space-y-1.5 pl-5 pt-1.5 border-t border-dashed border-[#795653]/15 text-xs">
                      {stats.fishSoldDetails.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between font-bold text-[#795653]">
                          <span className="flex items-center gap-1.5">
                            <span className="text-[#E13F7C] font-black">▪</span>
                            <span className="text-[#E13F7C] font-extrabold">{item.count}x</span>
                            <span>{item.characterName}</span>
                          </span>
                          <span className="text-[10px] font-bold text-[#795653]/60 bg-white/80 px-2 py-0.5 rounded-md border border-[#795653]/10">
                            Đã chốt đơn
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-[#795653]/70 italic pl-6 pt-0.5">
                      Chưa có bé cá nào được rước đi cả~
                    </div>
                  )}
                </div>

                {/* 3. New requests */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9F4] border border-[#795653]/15 hover:border-[#FF8FAB] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💌</span>
                    <span>Thư & Phiếu yêu cầu mới đang chờ duyệt</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFF2D6] text-[#B07D62] border border-[#B07D62]/30 font-black text-xs sm:text-sm tabular-nums">
                    +{stats?.newRequestsCount ?? 0} phiếu
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* TO-DO LIST SECTION */}
          <div
            className="bg-white/85 rounded-2xl border-2 border-[#795653]/25 p-3.5 sm:p-4 shadow-xs space-y-3"
            style={{ fontFamily: "'Cal Sans', sans-serif" }}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#795653] flex items-center gap-1.5">
                <span>📝</span>
                <span>Ghi chú công việc Admin (To-Do List)</span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F6A6B8]/20 text-[#A6536A] border border-[#F6A6B8]/40">
                {pendingTodosCount} việc chưa làm
              </span>
            </div>

            {/* Todo items */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {todos.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#795653]/60 italic bg-[#FFF9F4] rounded-xl border border-dashed border-[#795653]/20">
                  🎉 Chưa có công việc nào! Hãy nhập việc cần làm bên dưới nha bà chủ.
                </div>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    onClick={() => handleToggleTodo(todo)}
                    className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      todo.isCompleted
                        ? 'bg-[#FFF9F4]/60 border-[#795653]/10 text-[#795653]/50 line-through'
                        : 'bg-[#FFF9F4] border-[#795653]/20 text-[#795653] hover:border-[#FF8FAB]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <button
                        type="button"
                        className="shrink-0 text-[#E13F7C] focus:outline-hidden"
                      >
                        {todo.isCompleted ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-[#795653]/60" />
                        )}
                      </button>
                      <span className="text-xs font-bold leading-tight break-words">
                        {todo.content}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteTodo(todo.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-1 text-[#795653]/50 transition-opacity shrink-0"
                      title="Xóa công việc này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Input to add new To-Do */}
            <form onSubmit={handleAddTodo} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="+ Thêm việc cần làm cho hôm nay..."
                value={newTodoInput}
                onChange={(e) => setNewTodoInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border-2 border-[#795653]/25 bg-white text-xs font-semibold text-[#795653] placeholder:text-[#795653]/50 focus:outline-hidden focus:border-[#FF8FAB]"
              />
              <button
                type="submit"
                disabled={isSubmittingTodo || !newTodoInput.trim()}
                className="py-1.5 px-3 rounded-xl bg-[#795653] hover:bg-[#624441] text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="pt-3 border-t-2 border-dashed border-[#795653]/25 flex items-center justify-center gap-2.5 shrink-0"
          style={{ fontFamily: "'Cal Sans', sans-serif" }}
        >
          {onOpenAdminPanel && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminPanel();
              }}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FFE5EC] border-2 border-[#795653] text-[#795653] font-black text-xs cursor-pointer transition-all active:scale-95 text-center whitespace-nowrap shadow-xs"
            >
              🛠️ Mở Trang Quản Trị
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FF8FAB] hover:bg-[#ff7aa0] active:scale-95 text-white font-black text-xs uppercase tracking-wider border-2 border-[#795653] cursor-pointer transition-all flex items-center justify-center gap-1.5 select-none whitespace-nowrap"
            style={{
              textShadow: '1px 1px 0px rgba(121, 86, 83, 0.4)',
              boxShadow: '2px 2px 0px #795653',
            }}
          >
            <span>🐾 TUÂN LỆNH CHỦ TIỆM!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
