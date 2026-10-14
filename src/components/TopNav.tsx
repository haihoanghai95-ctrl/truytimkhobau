import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, BookOpen, Sparkles, Settings2, Cloud, LogIn, LogOut, Check } from 'lucide-react';
import { User } from '../services/firebase';

interface TopNavProps {
  currentScreen: 'home' | 'play' | 'teacher_admin';
  onNavigate: (screen: 'home' | 'play' | 'teacher_admin') => void;
  bgmEnabled: boolean;
  onToggleBgm: () => void;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenHowToPlay: () => void;
  currentUser: User | null;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  isSyncingCloud?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentScreen,
  onNavigate,
  bgmEnabled,
  onToggleBgm,
  sfxEnabled,
  onToggleSfx,
  isFullscreen,
  onToggleFullscreen,
  onOpenHowToPlay,
  currentUser,
  onSignInGoogle,
  onSignOutGoogle,
  isSyncingCloud = false
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left text-amber-900 hover:text-amber-700 transition-colors whitespace-nowrap shrink-0 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center shadow-md shadow-amber-300/40 text-xl group-hover:scale-105 transition-transform">
            🔍
          </div>
          <div>
            <div className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
              <span>TRUY TÌM KHO BÁU</span>
              <span className="hidden sm:inline-block text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                12–36 tháng
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-amber-700/80 font-semibold">
              Khám Phá Khuôn Mặt Em Bé
            </p>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentScreen === 'home'
                ? 'text-amber-600 font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            Bài Học Khuôn Mặt
          </button>

          <button
            onClick={() => onNavigate('teacher_admin')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              currentScreen === 'teacher_admin'
                ? 'text-amber-600 font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-4 h-4 text-amber-500" />
            <span>Kho Chủ Đề Của Giáo Viên</span>
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="flex items-center gap-1.5 whitespace-nowrap shrink-0 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Hướng Dẫn Chơi</span>
          </button>
        </nav>

        {/* Zone 3: Audio & Display Quick Toggles & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cloud Sync & Firebase Auth Badge */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/90 rounded-xl px-2.5 py-1 text-xs font-bold text-emerald-900 shadow-2xs">
              <div className="relative shrink-0">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName || 'Cô giáo'} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px] font-black">
                    {(currentUser.displayName || 'G')[0]}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
              <span className="hidden xl:inline truncate max-w-[100px]">
                {currentUser.displayName?.split(' ').slice(-1)[0] || 'Giáo viên'}
              </span>
              <span className="hidden md:inline-flex items-center text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                <Cloud className="w-2.5 h-2.5 mr-1" />
                Firebase
              </span>
              <button
                onClick={onSignOutGoogle}
                title="Đăng xuất tài khoản Google"
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white/80 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInGoogle}
              title="Đăng nhập tài khoản Google để đồng bộ bài học lên đám mây Firebase"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all active:scale-95 shadow-2xs"
            >
              <Cloud className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Lưu Đám Mây</span>
            </button>
          )}

          <button
            onClick={onToggleSfx}
            title={sfxEnabled ? 'Tắt hiệu ứng âm thanh' : 'Bật hiệu ứng âm thanh'}
            className={`p-2 rounded-xl transition-all ${
              sfxEnabled
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleBgm}
            title={bgmEnabled ? 'Tắt nhạc nền vui tươi' : 'Bật nhạc nền vui tươi'}
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              bgmEnabled
                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nhạc nền</span>
          </button>

          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình trình chiếu'}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {currentScreen !== 'teacher_admin' ? (
            <button
              onClick={() => onNavigate('teacher_admin')}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 transition-all whitespace-nowrap shrink-0 active:scale-95"
            >
              Kho Chủ Đề
            </button>
          ) : (
            <button
              onClick={() => onNavigate('home')}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap shrink-0 active:scale-95"
            >
              Về Trò Chơi
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
