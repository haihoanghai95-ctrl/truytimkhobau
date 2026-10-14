/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FaceTheme, AppSettings, DifficultyLevel, MaskStyle } from './types';
import { storageService, DEFAULT_SETTINGS } from './services/storage';
import { soundEffects } from './services/soundEffects';
import {
  auth,
  signInWithGoogle,
  signOutTeacher,
  onAuthStateChanged,
  User,
  testConnection
} from './services/firebase';
import { TopNav } from './components/TopNav';
import { ThemeSelector } from './components/ThemeSelector';
import { GameScreen } from './components/GameScreen';
import { TeacherAdmin } from './components/TeacherAdmin';
import { HowToPlayModal } from './components/HowToPlayModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'play' | 'teacher_admin'>('home');
  const [themes, setThemes] = useState<FaceTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<FaceTheme | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initialize data from IndexedDB & test Firebase connection
  useEffect(() => {
    async function init() {
      try {
        testConnection().catch(() => {});
        const loadedThemes = await storageService.getAllThemes();
        const loadedSettings = await storageService.getSettings();
        setThemes(loadedThemes);
        setSettings(loadedSettings);
        if (loadedThemes.length > 0) {
          setActiveTheme(loadedThemes[0]);
        }
      } catch (err) {
        console.error('Failed to initialize storage:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();

    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const synced = await storageService.syncWithFirestore();
          setThemes(synced);
        } catch (e) {
          console.warn('Initial sync after login failed:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    soundEffects.playPop();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleBgm = () => {
    soundEffects.playPop();
    const nextVal = !settings.bgmEnabled;
    const updated = { ...settings, bgmEnabled: nextVal };
    setSettings(updated);
    soundEffects.setBgmEnabled(nextVal);
    storageService.saveSettings(updated);
  };

  const toggleSfx = () => {
    soundEffects.playPop();
    const nextVal = !settings.sfxEnabled;
    const updated = { ...settings, sfxEnabled: nextVal };
    setSettings(updated);
    soundEffects.setSfxEnabled(nextVal);
    storageService.saveSettings(updated);
  };

  const changeDifficulty = (difficulty: DifficultyLevel) => {
    const updated = { ...settings, difficulty };
    setSettings(updated);
    storageService.saveSettings(updated);
  };

  const changeMaskStyle = (maskStyle: MaskStyle) => {
    const updated = { ...settings, maskStyle };
    setSettings(updated);
    storageService.saveSettings(updated);
  };

  const handleStartGame = (theme: FaceTheme) => {
    setActiveTheme(theme);
    setCurrentScreen('play');
  };

  const handleSignInGoogle = async () => {
    soundEffects.playPop();
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    }
  };

  const handleSignOutGoogle = async () => {
    soundEffects.playPop();
    try {
      await signOutTeacher();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const handleSyncCloud = async () => {
    soundEffects.playPop();
    try {
      const synced = await storageService.syncWithFirestore();
      setThemes(synced);
      if (activeTheme) {
        const refreshedActive = synced.find(t => t.id === activeTheme.id);
        if (refreshedActive) setActiveTheme(refreshedActive);
      }
    } catch (err) {
      console.error('Cloud sync failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 text-amber-900 space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-amber-300 border-t-amber-600 animate-spin" />
        <p className="font-extrabold text-lg">Đang chuẩn bị khuôn mặt cho bé...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/60 via-orange-50/30 to-yellow-50/60">
      {/* Top Bar */}
      <TopNav
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          soundEffects.playPop();
          setCurrentScreen(screen);
        }}
        bgmEnabled={settings.bgmEnabled}
        onToggleBgm={toggleBgm}
        sfxEnabled={settings.sfxEnabled}
        onToggleSfx={toggleSfx}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenHowToPlay={() => {
          soundEffects.playPop();
          setIsHowToPlayOpen(true);
        }}
        currentUser={currentUser}
        onSignInGoogle={handleSignInGoogle}
        onSignOutGoogle={handleSignOutGoogle}
      />

      {/* Main Screen Content */}
      <main className="flex-1 pb-10">
        {currentScreen === 'home' && (
          <ThemeSelector
            themes={themes}
            onSelectTheme={handleStartGame}
            onOpenTeacherAdmin={() => setCurrentScreen('teacher_admin')}
            difficulty={settings.difficulty}
            onChangeDifficulty={changeDifficulty}
            maskStyle={settings.maskStyle}
            onChangeMaskStyle={changeMaskStyle}
          />
        )}

        {currentScreen === 'play' && activeTheme && (
          <GameScreen
            theme={activeTheme}
            difficulty={settings.difficulty}
            maskStyle={settings.maskStyle}
            ttsRate={settings.ttsRate}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onBackToThemes={() => setCurrentScreen('home')}
            onOpenTeacherAdmin={() => setCurrentScreen('teacher_admin')}
            onChangeDifficulty={changeDifficulty}
          />
        )}

        {currentScreen === 'teacher_admin' && (
          <TeacherAdmin
            themes={themes}
            settings={settings}
            onThemesUpdated={(updated) => {
              setThemes(updated);
              if (activeTheme) {
                const refreshedActive = updated.find(t => t.id === activeTheme.id);
                if (refreshedActive) setActiveTheme(refreshedActive);
              }
            }}
            onSettingsUpdated={(updated) => setSettings(updated)}
            onPlayTheme={handleStartGame}
            onBackToHome={() => setCurrentScreen('home')}
            currentUser={currentUser}
            onSignInGoogle={handleSignInGoogle}
            onSyncCloud={handleSyncCloud}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200/80 bg-white/70 backdrop-blur-sm py-4 px-6 text-center text-xs text-slate-500">
        <p className="font-semibold">
          TRUY TÌM KHO BÁU – KHÁM PHÁ KHUÔN MẶT · Trò Chơi Giáo Dục Mầm Non (12–36 tháng & 3–6 tuổi)
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Tối ưu cho thao tác kéo chạm trên iPad, máy tính bảng, máy chiếu và bảng tương tác thông minh
        </p>
      </footer>

      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
